import uuid
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from apps.conversations.models import Conversation, Message
from apps.conversations.serializers import AskQuestionSerializer
from apps.documents.models import Document
from apps.rag.pipeline import RAGPipeline
from apps.usage.services import QuotaService


class AskQuestionView(APIView):
    """
    Primary RAG Q&A endpoint.
    Verifies tenant boundaries, reserves quota atomically, executes RAG pipeline, and logs messages.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        # 1. Resolve conversation
        try:
            conversation = Conversation.objects.get(id=id, workspace__owner=request.user)
        except Conversation.DoesNotExist:
            return Response(
                {"error": {"code": "NOT_FOUND", "message": "Conversation not found."}},
                status=status.HTTP_404_NOT_FOUND
            )

        # 2. Validate question payload
        serializer = AskQuestionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        question = serializer.validated_data['question']
        document_ids = [str(doc_id) for doc_id in serializer.validated_data.get('document_ids', [])]

        # 3. Verify targeted documents belong to user
        if document_ids:
            accessible_docs = Document.objects.filter(
                id__in=document_ids,
                workspace=conversation.workspace,
                status=Document.Status.READY
            )
            if accessible_docs.count() != len(document_ids):
                return Response(
                    {"error": {"code": "INVALID_DOCUMENTS", "message": "One or more selected documents are not ready or do not exist."}},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # 4. Atomic quota verification and reservation
        try:
            quota_info = QuotaService.reserve_question_quota(request.user)
        except Exception as e:
            return Response(
                {"error": {"code": "QUOTA_EXCEEDED", "message": str(e)}},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # 5. Persist user question message
        user_message = Message.objects.create(
            conversation=conversation,
            role=Message.Role.USER,
            content=question
        )

        request_id = str(uuid.uuid4())

        # 6. Execute RAG Pipeline with error recovery and quota refunding
        try:
            rag_result = RAGPipeline.execute(
                workspace_id=str(conversation.workspace.id),
                question=question,
                document_ids=document_ids if document_ids else None
            )

            # Persist assistant response
            assistant_message = Message.objects.create(
                conversation=conversation,
                role=Message.Role.ASSISTANT,
                content=rag_result['answer'],
                sources=rag_result['sources'],
                model_name=getattr(settings, 'AI_MODEL', 'gpt-4o-mini'),
                status=Message.Status.COMPLETED
            )

            # Update conversation title if first message
            if conversation.title == 'New Conversation' or conversation.messages.count() <= 2:
                conversation.title = question[:50] + ('...' if len(question) > 50 else '')
                conversation.save(update_fields=['title', 'updated_at'])

            # Log usage record
            QuotaService.log_usage_record(
                user=request.user,
                message=assistant_message,
                status='SUCCESS'
            )

            return Response({
                "request_id": request_id,
                "conversation_id": str(conversation.id),
                "answer": rag_result['answer'],
                "sources": rag_result['sources'],
                "is_abstention": rag_result['is_abstention'],
                "usage": quota_info
            }, status=status.HTTP_200_OK)

        except Exception as e:
            # Refund quota on upstream failure
            QuotaService.refund_question_quota(request.user)

            # Record failed message in conversation
            Message.objects.create(
                conversation=conversation,
                role=Message.Role.ASSISTANT,
                content="Failed to generate response due to service disruption.",
                status=Message.Status.FAILED
            )

            return Response(
                {"error": {"code": "AI_SERVICE_UNAVAILABLE", "message": "Upstream AI service is temporarily unavailable. Quota was not deducted."}},
                status=status.HTTP_502_BAD_GATEWAY
            )

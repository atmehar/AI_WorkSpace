from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.conversations.models import Conversation, Message
from apps.conversations.serializers import (
    ConversationSerializer,
    ConversationDetailSerializer,
    MessageSerializer
)
from apps.workspaces.services import WorkspaceService


class ConversationListCreateView(APIView):
    """Lists user conversations or creates a new conversation thread."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        workspace_id = request.query_params.get('workspace_id')
        qs = Conversation.objects.filter(workspace__owner=request.user)
        if workspace_id:
            qs = qs.filter(workspace_id=workspace_id)

        serializer = ConversationSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        title = request.data.get('title', 'New Conversation').strip() or 'New Conversation'
        workspace_id = request.data.get('workspace_id')
        workspace = WorkspaceService.get_user_workspace(request.user, workspace_id)

        conversation = Conversation.objects.create(
            workspace=workspace,
            created_by=request.user,
            title=title
        )

        serializer = ConversationSerializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ConversationDetailView(APIView):
    """Retrieves or deletes a single conversation."""
    permission_classes = [IsAuthenticated]

    def get_conversation(self, request, id):
        try:
            return Conversation.objects.get(id=id, workspace__owner=request.user)
        except Conversation.DoesNotExist:
            return None

    def get(self, request, id):
        conv = self.get_conversation(request, id)
        if not conv:
            return Response({"error": {"code": "NOT_FOUND", "message": "Conversation not found."}}, status=status.HTTP_404_NOT_FOUND)
        serializer = ConversationDetailSerializer(conv)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, id):
        conv = self.get_conversation(request, id)
        if not conv:
            return Response({"error": {"code": "NOT_FOUND", "message": "Conversation not found."}}, status=status.HTTP_404_NOT_FOUND)
        conv.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ConversationMessagesView(APIView):
    """Retrieves all messages for a specific conversation."""
    permission_classes = [IsAuthenticated]

    def get(self, request, id):
        try:
            conv = Conversation.objects.get(id=id, workspace__owner=request.user)
        except Conversation.DoesNotExist:
            return Response({"error": {"code": "NOT_FOUND", "message": "Conversation not found."}}, status=status.HTTP_404_NOT_FOUND)

        messages = conv.messages.all().order_by('created_at')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

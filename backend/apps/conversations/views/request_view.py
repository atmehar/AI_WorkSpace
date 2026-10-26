from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from apps.conversations.models import Message


class RequestDetailView(APIView):
    """
    Retrieves the status and result of a processed question request by message ID.
    Enforces strict tenant isolation to ensure users can only query their own requests.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, id):
        try:
            message = Message.objects.select_related('conversation').get(
                id=id,
                conversation__workspace__owner=request.user
            )
        except Message.DoesNotExist:
            return Response(
                {"error": {"code": "NOT_FOUND", "message": "Request not found."}},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response({
            "request_id": str(message.id),
            "conversation_id": str(message.conversation.id),
            "role": message.role,
            "status": message.status.lower(),
            "content": message.content,
            "sources": message.sources,
            "created_at": message.created_at
        }, status=status.HTTP_200_OK)

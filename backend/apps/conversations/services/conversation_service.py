from apps.conversations.models import Conversation


class ConversationService:
    """Service handling conversation lifecycle and workspace associations."""

    @staticmethod
    def get_or_create_active_conversation(user, workspace):
        conv = Conversation.objects.filter(created_by=user, workspace=workspace).first()
        if not conv:
            conv = Conversation.objects.create(created_by=user, workspace=workspace, title="New Conversation")
        return conv

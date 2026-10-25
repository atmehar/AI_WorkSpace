from rest_framework import serializers
from apps.conversations.models import Conversation
from .message_serializer import MessageSerializer


class ConversationSerializer(serializers.ModelSerializer):
    """Serializer for conversation listing and creation."""

    messages_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ('id', 'workspace', 'title', 'messages_count', 'last_message', 'created_at', 'updated_at')
        read_only_fields = ('id', 'workspace', 'messages_count', 'last_message', 'created_at', 'updated_at')

    def get_messages_count(self, obj):
        return obj.messages.count()

    def get_last_message(self, obj):
        msg = obj.messages.order_by('-created_at').first()
        if msg:
            return {
                'role': msg.role,
                'content': msg.content[:80] + '...' if len(msg.content) > 80 else msg.content,
                'created_at': msg.created_at
            }
        return None


class ConversationDetailSerializer(serializers.ModelSerializer):
    """Detailed conversation serializer with full message history."""

    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ('id', 'workspace', 'title', 'messages', 'created_at', 'updated_at')
        read_only_fields = fields

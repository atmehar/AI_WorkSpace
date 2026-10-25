from rest_framework import serializers
from apps.conversations.models import Message


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for individual chat message with sources."""

    class Meta:
        model = Message
        fields = ('id', 'conversation', 'role', 'content', 'status', 'sources', 'model_name', 'created_at')
        read_only_fields = fields

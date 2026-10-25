import uuid
from django.db import models
from .conversation import Conversation


class Message(models.Model):
    """Chronological message entry in a conversation thread with citations."""

    class Role(models.TextChoices):
        USER = 'USER', 'User'
        ASSISTANT = 'ASSISTANT', 'Assistant'
        SYSTEM = 'SYSTEM', 'System'

    class Status(models.TextChoices):
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages',
        db_index=True
    )
    role = models.CharField(max_length=20, choices=Role.choices)
    content = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.COMPLETED)
    sources = models.JSONField(default=list, blank=True, help_text="List of source reference dicts")
    model_name = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'conversations_message'
        verbose_name = 'Message'
        verbose_name_plural = 'Messages'
        ordering = ['created_at']

    def __str__(self):
        return f"[{self.role}] {self.content[:40]}..."

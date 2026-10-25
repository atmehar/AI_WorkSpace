import uuid
from django.db import models
from django.conf import settings
from apps.workspaces.models import Workspace


class Conversation(models.Model):
    """Conversation session grouping questions, answers, and source citations."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name='conversations',
        db_index=True
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='conversations'
    )
    title = models.CharField(max_length=255, default='New Conversation')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'conversations_conversation'
        verbose_name = 'Conversation'
        verbose_name_plural = 'Conversations'
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.title} ({self.created_by.email})"

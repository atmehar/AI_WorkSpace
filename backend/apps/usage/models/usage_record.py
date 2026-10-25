import uuid
from django.db import models
from django.conf import settings
from apps.conversations.models import Message


class UsageRecord(models.Model):
    """Audit record logging every consumed AI operation and outcome."""

    class UsageType(models.TextChoices):
        AI_QUESTION = 'AI_QUESTION', 'AI Question'
        EMBEDDING = 'EMBEDDING', 'Embedding Generation'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='usage_records',
        db_index=True
    )
    message = models.ForeignKey(
        Message,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='usage_records'
    )
    usage_type = models.CharField(max_length=50, choices=UsageType.choices, default=UsageType.AI_QUESTION)
    quantity = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, default='SUCCESS')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'usage_usagerecord'
        verbose_name = 'Usage Record'
        verbose_name_plural = 'Usage Records'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.usage_type} ({self.status}) at {self.created_at}"

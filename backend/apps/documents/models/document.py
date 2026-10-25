import uuid
from django.db import models
from django.conf import settings
from apps.workspaces.models import Workspace


class Document(models.Model):
    """Document entity tracking uploaded files and ingestion state machine."""

    class Status(models.TextChoices):
        UPLOADED = 'UPLOADED', 'Uploaded'
        PROCESSING = 'PROCESSING', 'Processing'
        READY = 'READY', 'Ready'
        FAILED = 'FAILED', 'Failed'

    class FileType(models.TextChoices):
        PDF = 'PDF', 'PDF Document'
        DOCX = 'DOCX', 'Word Document'
        TXT = 'TXT', 'Plain Text'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name='documents',
        db_index=True
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='uploaded_documents'
    )
    original_name = models.CharField(max_length=255)
    storage_key = models.CharField(max_length=512, unique=True)
    file_type = models.CharField(max_length=10, choices=FileType.choices)
    file_size = models.PositiveIntegerField(help_text="File size in bytes")
    checksum = models.CharField(max_length=64, blank=True, null=True, help_text="SHA-256 hash")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.UPLOADED,
        db_index=True
    )
    error_code = models.CharField(max_length=50, blank=True, null=True)
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'documents_document'
        verbose_name = 'Document'
        verbose_name_plural = 'Documents'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.original_name} [{self.status}]"

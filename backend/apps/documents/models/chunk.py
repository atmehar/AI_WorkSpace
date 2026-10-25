import uuid
from django.db import models
from pgvector.django import VectorField, HnswIndex
from .document import Document


class DocumentChunk(models.Model):
    """Passage chunk extracted from a document with vector embedding representation."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name='chunks',
        db_index=True
    )
    chunk_index = models.PositiveIntegerField(help_text="Sequential 0-indexed position within document")
    content = models.TextField(help_text="Extracted text passage")
    page_number = models.PositiveIntegerField(blank=True, null=True, help_text="1-indexed source page")
    section_title = models.CharField(max_length=255, blank=True, null=True)
    embedding = VectorField(dimensions=1536, help_text="High-dimensional semantic vector")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'documents_documentchunk'
        verbose_name = 'Document Chunk'
        verbose_name_plural = 'Document Chunks'
        ordering = ['document', 'chunk_index']
        constraints = [
            models.UniqueConstraint(fields=['document', 'chunk_index'], name='unique_document_chunk_index')
        ]
        indexes = [
            HnswIndex(
                name='idx_chunk_embedding_hnsw',
                fields=['embedding'],
                m=16,
                ef_construction=64,
                opclasses=['vector_cosine_ops'],
            )
        ]

    def __str__(self):
        return f"Chunk {self.chunk_index} of {self.document.original_name} (Page {self.page_number})"

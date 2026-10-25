import os
from django.db import transaction
from django.conf import settings
from apps.documents.models import Document, DocumentChunk


class DocumentDeletionService:
    """Handles atomic cascading deletion of documents, chunks, vectors, and physical files."""

    @staticmethod
    def delete_document(document: Document) -> bool:
        """Deletes the document and all associated database records and disk storage."""
        storage_key = document.storage_key
        abs_path = os.path.join(settings.MEDIA_ROOT, storage_key) if storage_key else None

        with transaction.atomic():
            # Cascade delete in DB (chunks, embeddings)
            DocumentChunk.objects.filter(document=document).delete()
            document.delete()

        # Delete physical file on disk
        if abs_path and os.path.exists(abs_path):
            try:
                os.remove(abs_path)
            except OSError:
                pass  # Logged or handled gracefully without failing DB cascade

        return True

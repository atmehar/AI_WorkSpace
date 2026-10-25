import os
import threading
from django.utils import timezone
from django.db import transaction
from django.conf import settings
from apps.documents.models import Document, DocumentChunk
from apps.documents.processors import PDFExtractor, DocxExtractor, TxtExtractor
from apps.rag.services import ChunkingService
from apps.rag.providers import get_embedding_provider


class DocumentIngestionService:
    """Orchestrates document text extraction, LangChain chunking, embedding generation, and vector persistence."""

    EXTRACTORS = {
        'PDF': PDFExtractor,
        'DOCX': DocxExtractor,
        'TXT': TxtExtractor,
    }

    @classmethod
    def process_document(cls, document_id: str) -> None:
        """Processes document synchronously or inside background worker."""
        try:
            document = Document.objects.get(id=document_id)
            document.status = Document.Status.PROCESSING
            document.save(update_fields=['status'])

            file_path = os.path.join(settings.MEDIA_ROOT, document.storage_key)
            extractor_class = cls.EXTRACTORS.get(document.file_type)
            if not extractor_class:
                raise ValueError(f"No extractor registered for file type: {document.file_type}")

            extractor = extractor_class()
            pages = extractor.extract_pages(file_path)

            # Chunk extracted pages using LangChain RecursiveCharacterTextSplitter
            chunks_data = ChunkingService.chunk_pages(pages, chunk_size=800, chunk_overlap=100)
            if not chunks_data:
                raise ValueError("Could not create text chunks from document.")

            # Generate embeddings
            embed_provider = get_embedding_provider()
            texts = [c['content'] for c in chunks_data]
            embeddings = embed_provider.embed_texts(texts)

            # Atomically save chunks with embeddings
            with transaction.atomic():
                # Idempotency: clear previous chunks if re-processing
                DocumentChunk.objects.filter(document=document).delete()

                chunk_objects = [
                    DocumentChunk(
                        document=document,
                        chunk_index=i,
                        content=chunk['content'],
                        page_number=chunk['page_number'],
                        embedding=embeddings[i]
                    )
                    for i, chunk in enumerate(chunks_data)
                ]
                DocumentChunk.objects.bulk_create(chunk_objects)

                document.status = Document.Status.READY
                document.processed_at = timezone.now()
                document.error_code = None
                document.error_message = None
                document.save(update_fields=['status', 'processed_at', 'error_code', 'error_message'])

        except Exception as e:
            try:
                doc = Document.objects.get(id=document_id)
                doc.status = Document.Status.FAILED
                doc.error_code = "PROCESSING_FAILED"
                doc.error_message = str(e)[:500]
                doc.save(update_fields=['status', 'error_code', 'error_message'])
            except Exception:
                pass

    @classmethod
    def trigger_async_processing(cls, document_id: str) -> None:
        """Dispatches processing to a background thread for non-blocking API response."""
        thread = threading.Thread(target=cls.process_document, args=(document_id,), daemon=True)
        thread.start()

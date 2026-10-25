from typing import List, Dict, Optional
from pgvector.django import CosineDistance
from apps.documents.models import DocumentChunk
from apps.rag.providers import get_embedding_provider


class RetrievalService:
    """Retrieves relevant document chunks from PostgreSQL pgvector store."""

    # Cosine distance cutoff threshold (distance > 0.65 indicates insufficient semantic relevance)
    RELEVANCE_THRESHOLD = 0.65

    @classmethod
    def retrieve(
        cls,
        workspace_id: str,
        document_ids: Optional[List[str]],
        query: str,
        top_k: int = 5
    ) -> List[Dict]:
        """
        Retrieves top_k chunks for a query strictly bounded by workspace and optional document_ids.
        Returns: list of dicts with chunk_id, document_id, document_name, page_number, content, distance.
        """
        embed_provider = get_embedding_provider()
        query_vector = embed_provider.embed_query(query)

        qs = DocumentChunk.objects.filter(
            document__workspace_id=workspace_id,
            document__status='READY'
        )

        if document_ids:
            qs = qs.filter(document_id__in=document_ids)

        chunks_with_distance = (
            qs.annotate(distance=CosineDistance('embedding', query_vector))
            .select_related('document')
            .order_by('distance')[:top_k]
        )

        results = []
        for chunk in chunks_with_distance:
            results.append({
                'chunk_id': str(chunk.id),
                'document_id': str(chunk.document.id),
                'document_name': chunk.document.original_name,
                'page_number': chunk.page_number,
                'content': chunk.content,
                'distance': float(chunk.distance) if chunk.distance is not None else 0.0,
            })

        return results

    @classmethod
    def evaluate_evidence(cls, retrieved_chunks: List[Dict]) -> bool:
        """
        Determines whether the retrieved passages contain sufficient evidence.
        Returns False if chunks list is empty or the closest chunk is beyond relevance cutoff.
        """
        if not retrieved_chunks:
            return False
        best_distance = retrieved_chunks[0]['distance']
        # If best distance is too high, evidence is insufficient
        return best_distance <= cls.RELEVANCE_THRESHOLD

from typing import List, Dict


class CitationService:
    """Formats and validates source citations to guarantee zero fabricated references."""

    @staticmethod
    def format_sources(retrieved_chunks: List[Dict]) -> List[Dict]:
        """Formats retrieved chunks into clean source reference objects for frontend rendering."""
        sources = []
        for chunk in retrieved_chunks:
            # Create a clean excerpt preview
            content = chunk.get('content', '')
            excerpt = content[:280] + '...' if len(content) > 280 else content

            sources.append({
                'chunk_id': chunk.get('chunk_id'),
                'document_id': chunk.get('document_id'),
                'document_name': chunk.get('document_name'),
                'page_number': chunk.get('page_number'),
                'excerpt': excerpt,
            })
        return sources

    @staticmethod
    def validate_citations(cited_ids: List[str], retrieved_chunks: List[Dict]) -> List[Dict]:
        """Filters citation IDs to ensure only legitimately retrieved chunks are returned."""
        valid_ids = {c['chunk_id'] for c in retrieved_chunks}
        verified = [c for c in retrieved_chunks if c['chunk_id'] in valid_ids and c['chunk_id'] in cited_ids]
        return CitationService.format_sources(verified if verified else retrieved_chunks)

from typing import List, Tuple, Dict
from langchain_text_splitters import RecursiveCharacterTextSplitter


class ChunkingService:
    """Paragraph-aware text chunking utilizing LangChain's RecursiveCharacterTextSplitter."""

    @staticmethod
    def chunk_pages(
        pages: List[Tuple[int, str]],
        chunk_size: int = 800,
        chunk_overlap: int = 100
    ) -> List[Dict]:
        """
        Splits extracted pages into chunks while preserving 1-indexed page_number.
        Returns: list of dicts: {'page_number': int, 'content': str}
        """
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""]
        )

        all_chunks = []
        for page_num, page_text in pages:
            if not page_text or not page_text.strip():
                continue
            split_texts = splitter.split_text(page_text)
            for text_chunk in split_texts:
                cleaned = text_chunk.strip()
                if cleaned:
                    all_chunks.append({
                        'page_number': page_num,
                        'content': cleaned
                    })

        return all_chunks

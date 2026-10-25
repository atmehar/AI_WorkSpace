import fitz
from typing import List, Tuple
from .base import BaseExtractor


class PDFExtractor(BaseExtractor):
    """Extracts text page-by-page from PDF files using PyMuPDF."""

    def extract_pages(self, file_path: str) -> List[Tuple[int, str]]:
        pages = []
        try:
            doc = fitz.open(file_path)
            for page_index in range(len(doc)):
                page = doc[page_index]
                text = page.get_text("text").strip()
                if text:
                    pages.append((page_index + 1, text))
            doc.close()
        except Exception as e:
            raise ValueError(f"Failed to extract text from PDF: {str(e)}")

        if not pages:
            raise ValueError("The PDF document does not contain readable text (it may be scanned or empty).")

        return pages

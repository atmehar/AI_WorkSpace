from typing import List, Tuple
from .base import BaseExtractor


class TxtExtractor(BaseExtractor):
    """Extracts text from plain text files with UTF-8 and fallback encoding."""

    def extract_pages(self, file_path: str) -> List[Tuple[int, str]]:
        content = ""
        encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']
        for enc in encodings:
            try:
                with open(file_path, 'r', encoding=enc) as f:
                    content = f.read().strip()
                break
            except (UnicodeDecodeError, LookupError):
                continue

        if not content:
            raise ValueError("The text document is empty or could not be decoded.")

        return [(1, content)]

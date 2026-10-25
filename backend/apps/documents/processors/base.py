from abc import ABC, abstractmethod
from typing import List, Tuple


class BaseExtractor(ABC):
    """Abstract base class for document format text extractors."""

    @abstractmethod
    def extract_pages(self, file_path: str) -> List[Tuple[int, str]]:
        """
        Extracts text from file.
        Returns a list of tuples: (1-indexed page_number, extracted_page_text)
        """
        pass

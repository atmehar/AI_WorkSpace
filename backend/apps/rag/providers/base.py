from abc import ABC, abstractmethod
from typing import List


class IEmbeddingProvider(ABC):
    """Abstract interface for embedding generation."""

    @abstractmethod
    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Transforms a batch of texts into 1536-dimensional float vector lists."""
        pass

    @abstractmethod
    def embed_query(self, query: str) -> List[float]:
        """Transforms a single query string into a vector."""
        pass


class ILLMProvider(ABC):
    """Abstract interface for LLM answer generation."""

    @abstractmethod
    def generate(self, system_prompt: str, user_prompt: str) -> str:
        """Invokes language model with system guardrails and user prompt."""
        pass

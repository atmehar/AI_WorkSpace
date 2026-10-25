import os
from django.conf import settings
from .base import IEmbeddingProvider, ILLMProvider
from .mock_provider import MockEmbeddingProvider, MockLLMProvider
from .openai_provider import OpenAIEmbeddingProvider, OpenAILLMProvider


def get_embedding_provider() -> IEmbeddingProvider:
    """Factory returning configured or mock embedding provider."""
    api_key = getattr(settings, 'AI_API_KEY', '') or os.getenv('AI_API_KEY', '')
    if api_key and len(api_key.strip()) > 10:
        model = getattr(settings, 'EMBEDDING_MODEL', 'text-embedding-3-small')
        return OpenAIEmbeddingProvider(api_key=api_key.strip(), model_name=model)
    return MockEmbeddingProvider()


def get_llm_provider() -> ILLMProvider:
    """Factory returning configured or mock LLM provider."""
    api_key = getattr(settings, 'AI_API_KEY', '') or os.getenv('AI_API_KEY', '')
    if api_key and len(api_key.strip()) > 10:
        model = getattr(settings, 'AI_MODEL', 'gpt-4o-mini')
        return OpenAILLMProvider(api_key=api_key.strip(), model_name=model)
    return MockLLMProvider()


__all__ = [
    'IEmbeddingProvider',
    'ILLMProvider',
    'MockEmbeddingProvider',
    'MockLLMProvider',
    'OpenAIEmbeddingProvider',
    'OpenAILLMProvider',
    'get_embedding_provider',
    'get_llm_provider'
]

import os
from pathlib import Path
from dotenv import load_dotenv
from django.conf import settings
from .base import IEmbeddingProvider, ILLMProvider
from .mock_provider import MockEmbeddingProvider, MockLLMProvider
from .openai_provider import OpenAIEmbeddingProvider, OpenAILLMProvider
from .gemini_provider import GeminiEmbeddingProvider, GeminiLLMProvider


def _get_active_env():
    """Dynamically re-reads .env with override=True so configuration updates apply without server restart."""
    base_dir = Path(settings.BASE_DIR)
    load_dotenv(base_dir / '.env', override=True)
    api_key = os.getenv('AI_API_KEY', '').strip()
    ai_model = os.getenv('AI_MODEL', getattr(settings, 'AI_MODEL', 'gemini-3.8-flash')).strip()
    emb_model = os.getenv('EMBEDDING_MODEL', getattr(settings, 'EMBEDDING_MODEL', 'gemini-embedding-2')).strip()
    return api_key, ai_model, emb_model


def is_gemini_configured(api_key: str, model_name: str) -> bool:
    """Detects if the configured AI model or key belongs to Google Gemini."""
    if 'gemini' in (model_name or '').lower():
        return True
    if api_key.startswith('AQ.') or api_key.startswith('AIza'):
        return True
    return False


def get_embedding_provider() -> IEmbeddingProvider:
    """Factory returning configured Gemini, OpenAI, or Mock embedding provider."""
    api_key, ai_model, emb_model = _get_active_env()
    if api_key and len(api_key) > 10:
        if is_gemini_configured(api_key, emb_model) or is_gemini_configured(api_key, ai_model):
            return GeminiEmbeddingProvider(api_key=api_key, model_name=emb_model)
        return OpenAIEmbeddingProvider(api_key=api_key, model_name=emb_model)
    return MockEmbeddingProvider()


def get_llm_provider() -> ILLMProvider:
    """Factory returning configured Gemini, OpenAI, or Mock LLM provider."""
    api_key, ai_model, _ = _get_active_env()
    if api_key and len(api_key) > 10:
        if is_gemini_configured(api_key, ai_model):
            return GeminiLLMProvider(api_key=api_key, model_name=ai_model)
        return OpenAILLMProvider(api_key=api_key, model_name=ai_model)
    return MockLLMProvider()


__all__ = [
    'IEmbeddingProvider',
    'ILLMProvider',
    'MockEmbeddingProvider',
    'MockLLMProvider',
    'OpenAIEmbeddingProvider',
    'OpenAILLMProvider',
    'GeminiEmbeddingProvider',
    'GeminiLLMProvider',
    'get_embedding_provider',
    'get_llm_provider'
]

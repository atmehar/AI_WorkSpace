from typing import List
from django.conf import settings
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from .base import IEmbeddingProvider, ILLMProvider


class OpenAIEmbeddingProvider(IEmbeddingProvider):
    """Generates embeddings using LangChain's OpenAIEmbeddings."""

    def __init__(self, api_key: str, model_name: str = "text-embedding-3-small"):
        self.embeddings = OpenAIEmbeddings(
            api_key=api_key,
            model=model_name
        )

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        return self.embeddings.embed_documents(texts)

    def embed_query(self, query: str) -> List[float]:
        return self.embeddings.embed_query(query)


class OpenAILLMProvider(ILLMProvider):
    """Generates completions using LangChain's ChatOpenAI."""

    def __init__(self, api_key: str, model_name: str = "gpt-4o-mini"):
        self.llm = ChatOpenAI(
            api_key=api_key,
            model=model_name,
            temperature=0.0,
            timeout=15.0,
            max_retries=2
        )

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        response = self.llm.invoke(messages)
        return response.content

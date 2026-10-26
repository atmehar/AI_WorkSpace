import requests
from typing import List
from .base import IEmbeddingProvider, ILLMProvider


class GeminiEmbeddingProvider(IEmbeddingProvider):
    """
    Generates high-dimensional semantic embeddings using Google Gemini API.
    Uses batchEmbedContents for ultra-fast processing and enforces 1536 dimensions
    to match PostgreSQL pgvector VectorField(1536).
    """

    def __init__(self, api_key: str, model_name: str = "gemini-embedding-2"):
        self.api_key = api_key
        if not model_name or "text-embedding" in model_name:
            self.model_name = "gemini-embedding-2"
        else:
            self.model_name = model_name

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []

        embeddings = []
        batch_size = 50  # Gemini supports up to 100 requests per batchEmbedContents
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:batchEmbedContents?key={self.api_key}"
            reqs = [
                {
                    "model": f"models/{self.model_name}",
                    "content": {"parts": [{"text": text[:2048]}]},
                    "output_dimensionality": 1536
                }
                for text in batch
            ]
            resp = requests.post(url, json={"requests": reqs}, timeout=30)
            if resp.status_code == 200:
                batch_vectors = [e["values"] for e in resp.json().get("embeddings", [])]
                embeddings.extend(batch_vectors)
            else:
                # Fallback to individual embed_query if batch error occurs
                for text in batch:
                    embeddings.append(self.embed_query(text))

        return embeddings

    def embed_query(self, query: str) -> List[float]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:embedContent?key={self.api_key}"
        payload = {
            "content": {"parts": [{"text": query[:2048]}]},
            "output_dimensionality": 1536
        }
        resp = requests.post(url, json=payload, timeout=15)
        if resp.status_code == 200:
            return resp.json()["embedding"]["values"]
        raise RuntimeError(f"Gemini embedding failed ({resp.status_code}): {resp.text[:200]}")


class GeminiLLMProvider(ILLMProvider):
    """
    Generates fact-grounded completions using Google Gemini Flash models.
    Supports gemini-3.8-flash with instantaneous fallback to gemini-3.5-flash-lite if queue is congested.
    """

    def __init__(self, api_key: str, model_name: str = "gemini-3.8-flash"):
        self.api_key = api_key
        self.model_name = model_name or "gemini-3.8-flash"

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        models_to_try = [self.model_name]
        if "3.5-flash-lite" not in self.model_name:
            models_to_try.append("gemini-3.5-flash-lite")

        combined_prompt = f"{system_prompt}\n\n{user_prompt}"
        payload = {
            "contents": [{"parts": [{"text": combined_prompt}]}],
            "generationConfig": {
                "temperature": 0.0,
                "maxOutputTokens": 1024,
            }
        }

        last_error = None
        for m in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={self.api_key}"
            # 5s timeout on 3.8-flash to prevent UI freezing if 3.8 is congested
            t_out = 5 if m == self.model_name and len(models_to_try) > 1 else 20
            try:
                resp = requests.post(url, json=payload, timeout=t_out)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            return parts[0]["text"]
                elif resp.status_code in (404, 429, 503):
                    last_error = f"{m} returned HTTP {resp.status_code}"
                    continue
            except (requests.exceptions.Timeout, requests.exceptions.RequestException) as e:
                last_error = f"{m} error: {e}"
                continue

        raise RuntimeError(f"Gemini LLM generation failed across candidates: {last_error}")

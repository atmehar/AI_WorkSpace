import math
import hashlib
import re
from typing import List
from .base import IEmbeddingProvider, ILLMProvider


class MockEmbeddingProvider(IEmbeddingProvider):
    """
    Deterministic mock embedding generator producing normalized 1536-dimensional vectors.
    Uses word-level hashing to ensure texts sharing keywords yield high cosine similarity
    and low cosine distance (<0.4), matching authentic dense semantic embedding behavior.
    """

    DIMENSION = 1536

    def _generate_vector(self, text: str) -> List[float]:
        vec = [0.0] * self.DIMENSION
        words = re.findall(r'\b[a-zA-Z0-9_-]+\b', text.lower())
        if not words:
            words = ["empty"]

        for w in words:
            h = int(hashlib.md5(w.encode('utf-8')).hexdigest(), 16)
            idx1 = h % self.DIMENSION
            idx2 = (h >> 16) % self.DIMENSION
            idx3 = (h >> 32) % self.DIMENSION
            vec[idx1] += 1.0
            vec[idx2] += 0.6
            vec[idx3] += 0.3

        # L2 Normalize the vector to unit sphere
        magnitude = math.sqrt(sum(x * x for x in vec))
        if magnitude > 0:
            vec = [x / magnitude for x in vec]
        return vec

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        return [self._generate_vector(t) for t in texts]

    def embed_query(self, query: str) -> List[float]:
        return self._generate_vector(query)


class MockLLMProvider(ILLMProvider):
    """
    Mock LLM provider generating fact-grounded responses from supplied context
    or explicitly stating lack of information when context is absent.
    """

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        if "<context>" in user_prompt and "</context>" in user_prompt:
            context_start = user_prompt.find("<context>") + len("<context>")
            context_end = user_prompt.find("</context>")
            context = user_prompt[context_start:context_end].strip()

            if not context or "No relevant passages found" in context:
                return "I couldn't find this information in the uploaded documents."

            # Extract content lines
            lines = [
                l.strip() for l in context.split('\n')
                if l.strip() and not l.startswith('[Chunk') and not l.startswith('---')
            ]

            query = ""
            if "Question:" in user_prompt:
                query = user_prompt.split("Question:")[-1].split("Answer:")[0].strip().lower()

            best_line = lines[0] if lines else "Document content"
            query_words = set(re.findall(r'\b\w+\b', query))

            best_score = -1
            for line in lines:
                line_words = set(re.findall(r'\b\w+\b', line.lower()))
                overlap = len(query_words.intersection(line_words))
                if overlap > best_score:
                    best_score = overlap
                    best_line = line

            return f"{best_line} [1]"

        return "I couldn't find this information in the uploaded documents."

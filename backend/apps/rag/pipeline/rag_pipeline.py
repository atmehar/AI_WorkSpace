from typing import List, Dict, Optional
from apps.rag.services import RetrievalService, CitationService
from apps.rag.prompts import PromptBuilder
from apps.rag.providers import get_llm_provider


class RAGPipeline:
    """Master workflow orchestrating retrieval, thresholding, prompt assembly, LLM execution, and citation verification."""

    ABSTENTION_MESSAGE = "I couldn't find this information in the uploaded documents."

    @classmethod
    def execute(
        cls,
        workspace_id: str,
        question: str,
        document_ids: Optional[List[str]] = None,
        top_k: int = 5
    ) -> Dict:
        """
        Executes end-to-end RAG question answering.
        Returns: {
            'answer': str,
            'sources': List[Dict],
            'is_abstention': bool,
            'chunks_retrieved': int
        }
        """
        # 1. Retrieve relevant chunks from pgvector
        retrieved_chunks = RetrievalService.retrieve(
            workspace_id=workspace_id,
            document_ids=document_ids,
            query=question,
            top_k=top_k
        )

        # 2. Threshold evaluation: check if evidence exists and is sufficient
        has_sufficient_evidence = RetrievalService.evaluate_evidence(retrieved_chunks)

        if not has_sufficient_evidence:
            return {
                'answer': cls.ABSTENTION_MESSAGE,
                'sources': [],
                'is_abstention': True,
                'chunks_retrieved': len(retrieved_chunks)
            }

        # 3. Assemble grounded prompt with injection defense
        user_prompt = PromptBuilder.build_user_prompt(question, retrieved_chunks)

        # 4. Invoke LLM provider (LangChain or Mock)
        llm_provider = get_llm_provider()
        raw_answer = llm_provider.generate(
            system_prompt=PromptBuilder.SYSTEM_PROMPT,
            user_prompt=user_prompt
        )

        # 5. Format and verify citations
        sources = CitationService.format_sources(retrieved_chunks)

        return {
            'answer': raw_answer.strip(),
            'sources': sources,
            'is_abstention': False,
            'chunks_retrieved': len(retrieved_chunks)
        }

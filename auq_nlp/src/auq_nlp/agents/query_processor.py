"""
Query Processor for AUQ NLP

Orchestrates the complete query processing pipeline including caching,
validation, agent processing, and response formatting.
"""

import time
from typing import Dict, Any, Optional, Tuple

from .langchain_agent import get_agent
from ..core.cache import QueryCache, PrecompiledQueries
from ..core.validator import ResultValidator
from ..core.config import settings
from ..utils.logging import get_logger, info, success, warning, error

logger = get_logger(__name__)


class QueryProcessor:
    """
    Main query processing engine that coordinates all components
    
    Handles the complete lifecycle:
    1. Check precompiled queries
    2. Check cache
    3. Process with LangChain agent
    4. Validate results
    5. Cache response
    6. Return formatted response
    """
    
    def __init__(self):
        self.cache = QueryCache() if settings.cache_enabled else None
        self.validator = ResultValidator() if settings.validation_enabled else None
    
    async def process_query(
        self,
        question: str,
        context: str = "",
        conversation_history: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Process a natural language query through the complete pipeline
        
        Args:
            question: Natural language question
            context: Additional context for the query
            conversation_history: Previous conversation for context
            
        Returns:
            Formatted response with metadata
        """
        start_time = time.time()
        
        try:
            info(f"Processing query: {question}")
            
            # Build enriched context
            full_context = self._build_context(context, conversation_history)
            
            # Step 1: Check precompiled queries (instant response)
            precompiled_result = self._check_precompiled_queries(question)
            if precompiled_result:
                return self._format_response(
                    question=question,
                    context=full_context,
                    result=precompiled_result,
                    processing_time=time.time() - start_time,
                    cached=True,
                    precompiled=True
                )
            
            # Step 2: Check cache
            cached_result = None
            if self.cache:
                cached_result = self.cache.get(question, full_context)
                if cached_result:
                    info("Cache hit - returning cached result")
                    return self._format_response(
                        question=question,
                        context=full_context,
                        result=cached_result,
                        processing_time=time.time() - start_time,
                        cached=True,
                        precompiled=False
                    )
            
            # Step 3: Process with LangChain agent
            info("Cache miss - processing with LangChain agent")
            agent = await get_agent()
            agent_response = await agent.process_query(question, full_context)
            
            if not agent_response.get("success", False):
                error(f"Agent processing failed: {agent_response.get('error')}")
                return self._format_error_response(
                    question=question,
                    context=full_context,
                    error=agent_response.get("error", "Agent processing failed"),
                    processing_time=time.time() - start_time
                )
            
            # Step 4: Validate results
            validation_warnings = []
            if self.validator:
                # Note: Using a more specific validation method
                # TODO: Implement proper response validation based on query type
                validation_warnings = []  # Skip validation for now
            
            # Step 5: Cache the result
            if self.cache and agent_response.get("success", False):
                self.cache.set(question, full_context, agent_response["output"])
                info("Result cached for future queries")
            
            # Step 6: Format and return response
            return self._format_response(
                question=question,
                context=full_context,
                result=agent_response["output"],
                processing_time=time.time() - start_time,
                cached=False,
                precompiled=False,
                validation_warnings=validation_warnings,
                intermediate_steps=agent_response.get("intermediate_steps", [])
            )
            
        except Exception as e:
            error(f"Error in query processing pipeline: {e}")
            return self._format_error_response(
                question=question,
                context=context,
                error=str(e),
                processing_time=time.time() - start_time
            )
    
    def _check_precompiled_queries(self, question: str) -> Optional[str]:
        """Check if question matches a precompiled query"""
        if not settings.enable_precompiled_queries:
            return None
        
        result = PrecompiledQueries.get_response(question)
        if result:
            info(f"Precompiled query match found")
            # Return a simple response for now - TODO: Execute SQL and format properly
            return f"Found precompiled query for: {question}. SQL: {result.get('sql', '')}"
        
        return None
    
    def _build_context(self, context: str, conversation_history: Optional[list]) -> str:
        """Build enriched context from provided context and conversation history"""
        context_parts = []
        
        if context:
            context_parts.append(context)
        
        if conversation_history:
            # Limit conversation history
            max_history = settings.max_conversation_history
            recent_history = conversation_history[-max_history:] if len(conversation_history) > max_history else conversation_history
            
            history_text = "Previous conversation:\n"
            for i, exchange in enumerate(recent_history, 1):
                if isinstance(exchange, dict):
                    q = exchange.get("question", "")
                    a = exchange.get("answer", "")
                    history_text += f"{i}. Q: {q}\n   A: {a}\n"
            
            context_parts.append(history_text)
        
        return "\n\n".join(context_parts)
    
    def _format_response(
        self,
        question: str,
        context: str,
        result: str,
        processing_time: float,
        cached: bool,
        precompiled: bool,
        validation_warnings: Optional[list] = None,
        intermediate_steps: Optional[list] = None
    ) -> Dict[str, Any]:
        """Format successful response"""
        return {
            "success": True,
            "answer": result,
            "question": question,
            "context": context,
            "cached": cached,
            "precompiled": precompiled,
            "processing_time_seconds": round(processing_time, 3),
            "validation_warnings": validation_warnings or [],
            "intermediate_steps": intermediate_steps or [],
            "timestamp": time.time(),
            "model": settings.openai_model
        }
    
    def _format_error_response(
        self,
        question: str,
        context: str,
        error: str,
        processing_time: float
    ) -> Dict[str, Any]:
        """Format error response"""
        return {
            "success": False,
            "answer": "",
            "error": error,
            "question": question,
            "context": context,
            "cached": False,
            "precompiled": False,
            "processing_time_seconds": round(processing_time, 3),
            "validation_warnings": [],
            "intermediate_steps": [],
            "timestamp": time.time(),
            "model": settings.openai_model
        }
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        if not self.cache:
            return {"cache_enabled": False}
        
        stats = self.cache.get_stats()
        return {
            "cache_enabled": True,
            **stats
        }
    
    def clear_cache(self) -> bool:
        """Clear query cache"""
        if not self.cache:
            return False
        
        self.cache.clear()
        info("Query cache cleared")
        return True
    
    def get_status(self) -> Dict[str, Any]:
        """Get processor status"""
        return {
            "cache_enabled": self.cache is not None,
            "validation_enabled": self.validator is not None,
            "precompiled_queries_enabled": settings.enable_precompiled_queries,
            "precompiled_queries_count": len(PrecompiledQueries.COMMON_QUERIES),
            "settings": {
                "openai_model": settings.openai_model,
                "cache_max_size": settings.cache_max_size,
                "cache_ttl_seconds": settings.cache_ttl_seconds,
                "max_conversation_history": settings.max_conversation_history
            }
        }


# Global processor instance
_processor_instance: Optional[QueryProcessor] = None


def get_processor() -> QueryProcessor:
    """
    Get or create the global processor instance
    
    Returns:
        Query processor instance
    """
    global _processor_instance
    
    if _processor_instance is None:
        _processor_instance = QueryProcessor()
    
    return _processor_instance 


def reset_processor():
    """Reset the global processor instance"""
    global _processor_instance
    _processor_instance = None 
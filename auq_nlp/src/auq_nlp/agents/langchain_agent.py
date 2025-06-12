"""
LangChain Agent for AUQ NLP

Manages the LangChain SQL agent initialization, configuration, and query processing.
"""

import os
import warnings
from pathlib import Path
from typing import Dict, Any, Optional

from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits.sql.toolkit import SQLDatabaseToolkit
from langchain_community.agent_toolkits.sql.base import create_sql_agent
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core._api.deprecation import LangChainDeprecationWarning

from ..core.config import settings
from ..utils.logging import get_logger, info, success, warning, error

# Ignore LangChain internal deprecation warnings
warnings.filterwarnings("ignore", category=LangChainDeprecationWarning)

logger = get_logger(__name__)


class LangChainAgent:
    """
    LangChain SQL Agent wrapper for urban data analysis
    
    Manages the initialization and execution of LangChain agents for
    converting natural language questions to SQL queries.
    """
    
    def __init__(self):
        self.llm: Optional[ChatOpenAI] = None
        self.db: Optional[SQLDatabase] = None
        self.agent = None
        self.toolkit: Optional[SQLDatabaseToolkit] = None
        self.is_initialized = False
    
    async def initialize(self) -> bool:
        """
        Initialize the LangChain agent with database and LLM connections
        
        Returns:
            bool: True if initialization successful, False otherwise
        """
        try:
            info("Initializing LangChain Agent...")
            
            # Validate configuration
            if not self._validate_configuration():
                return False
            
            # Initialize LLM
            if not self._initialize_llm():
                return False
            
            # Initialize database connection
            if not self._initialize_database():
                return False
            
            # Load prompt template
            if not self._load_prompt_template():
                return False
            
            # Create agent
            if not self._create_agent():
                return False
            
            self.is_initialized = True
            success("LangChain Agent initialized successfully!")
            return True
            
        except Exception as e:
            error(f"Failed to initialize LangChain Agent: {e}")
            return False
    
    def _validate_configuration(self) -> bool:
        """Validate required configuration"""
        if not settings.supabase_uri:
            error("SUPABASE_URI is missing in configuration")
            return False
        
        if not settings.openai_api_key:
            error("OPENAI_API_KEY is missing in configuration")
            return False
        
        return True
    
    def _initialize_llm(self) -> bool:
        """Initialize the OpenAI LLM"""
        try:
            info(f"Loading OpenAI model: {settings.openai_model}")
            
            self.llm = ChatOpenAI(**settings.get_openai_config())
            
            info("OpenAI model loaded successfully")
            return True
            
        except Exception as e:
            error(f"Failed to initialize LLM: {e}")
            return False
    
    def _initialize_database(self) -> bool:
        """Initialize database connection"""
        try:
            info("Connecting to Supabase database...")
            
            self.db = SQLDatabase.from_uri(
                settings.supabase_uri,
                sample_rows_in_table_info=0  # Performance optimization
            )
            
            info("Database connection established")
            return True
            
        except Exception as e:
            error(f"Failed to connect to database: {e}")
            return False
    
    def _load_prompt_template(self) -> bool:
        """Load and configure prompt template"""
        try:
            info("Loading prompt template...")
            
            # Try enhanced prompt first, fallback to custom prompt
            prompt_path = settings.enhanced_prompt_path
            if not prompt_path.exists():
                warning("Enhanced prompt not found, using fallback")
                prompt_path = settings.fallback_prompt_path
            
            if not prompt_path.exists():
                error(f"No prompt template found at {prompt_path}")
                return False
            
            with open(prompt_path, "r", encoding="utf-8") as f:
                prompt_content = f.read()
            
            self.custom_prompt = PromptTemplate.from_template(prompt_content)
            
            info(f"Prompt template loaded from {prompt_path}")
            return True
            
        except Exception as e:
            error(f"Failed to load prompt template: {e}")
            return False
    
    def _create_agent(self) -> bool:
        """Create the SQL agent"""
        try:
            info("Creating SQL agent...")
            
            # Create toolkit
            self.toolkit = SQLDatabaseToolkit(db=self.db, llm=self.llm)
            
            # Create agent
            self.agent = create_sql_agent(
                llm=self.llm,
                toolkit=self.toolkit,
                verbose=settings.debug,
                prompt=self.custom_prompt,
                handle_parsing_errors=True
            )
            
            info("SQL agent created successfully")
            return True
            
        except Exception as e:
            error(f"Failed to create SQL agent: {e}")
            return False
    
    async def process_query(self, question: str, context: str = "") -> Dict[str, Any]:
        """
        Process a natural language question using the LangChain agent
        
        Args:
            question: Natural language question
            context: Additional context for the query
            
        Returns:
            Dict containing the agent response and metadata
        """
        if not self.is_initialized or not self.agent:
            raise RuntimeError("Agent not initialized. Call initialize() first.")
        
        try:
            info(f"Processing query: {question}")
            
            # Build input with context if provided
            input_text = question
            if context:
                input_text = f"{context}\n\nQuestion: {question}"
            
            # Process with agent
            response = self.agent.invoke(
                {"input": input_text},
                handle_parsing_errors=True
            )
            
            return {
                "success": True,
                "output": response.get("output", "No response generated"),
                "intermediate_steps": response.get("intermediate_steps", []),
                "question": question,
                "context": context
            }
            
        except Exception as e:
            error(f"Error processing query: {e}")
            return {
                "success": False,
                "output": "",
                "error": str(e),
                "question": question,
                "context": context
            }
    
    def get_status(self) -> Dict[str, Any]:
        """Get agent status information"""
        return {
            "is_initialized": self.is_initialized,
            "llm_model": settings.openai_model if self.llm else None,
            "database_connected": self.db is not None,
            "agent_ready": self.agent is not None,
            "toolkit_tools": len(self.toolkit.get_tools()) if self.toolkit else 0
        }
    
    async def cleanup(self):
        """Cleanup resources"""
        try:
            info("Cleaning up LangChain Agent resources...")
            
            self.agent = None
            self.toolkit = None
            
            if self.db:
                # Close database connections if applicable
                self.db = None
            
            self.llm = None
            self.is_initialized = False
            
            info("Agent cleanup completed")
            
        except Exception as e:
            warning(f"Error during cleanup: {e}")


# Global agent instance
_agent_instance: Optional[LangChainAgent] = None


async def get_agent() -> LangChainAgent:
    """
    Get or create the global agent instance
    
    Returns:
        Initialized LangChain agent
    """
    global _agent_instance
    
    if _agent_instance is None:
        _agent_instance = LangChainAgent()
        await _agent_instance.initialize()
    
    return _agent_instance


async def cleanup_agent():
    """Cleanup the global agent instance"""
    global _agent_instance
    
    if _agent_instance:
        await _agent_instance.cleanup()
        _agent_instance = None 
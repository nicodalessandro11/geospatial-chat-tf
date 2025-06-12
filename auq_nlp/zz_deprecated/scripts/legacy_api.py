"""
API FastAPI for AUQ NLP Agent

This API exposes the NLP + SQL Agent as a REST service for the frontend to consume.

Author: Nicolas Dalessandro
Email: nicodalessandro11@gmail.com
Date: 2025-04-21
Version: 1.0.0
License: MIT License
"""

import os
import sys
import warnings
import time
from pathlib import Path
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# Add shared directory to Python path
sys.path.append(str(Path(__file__).resolve().parents[1] / "shared"))

from dotenv import load_dotenv
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits.sql.toolkit import SQLDatabaseToolkit
from langchain_community.agent_toolkits.sql.base import create_sql_agent
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core._api.deprecation import LangChainDeprecationWarning
from common_lib.emoji_logger import info, success, warning, error

# Import our new modules
from cache_manager import query_cache, PrecompiledQueries
from result_validator import result_validator

# Ignore LangChain internal deprecation warnings
warnings.filterwarnings("ignore", category=LangChainDeprecationWarning)

# Configuration
BASE_DIR = Path(__file__).resolve().parents[0]
PROMPT_PATH = BASE_DIR / "prompt" / "enhanced_prompt.txt"  # Use enhanced prompt
FALLBACK_PROMPT_PATH = BASE_DIR / "prompt" / "custom_prompt.txt"  # Fallback

# Load environment variables
load_dotenv()
SUPABASE_URI = os.getenv("SUPABASE_URI")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# FastAPI app
app = FastAPI(
    title="AUQ NLP API",
    description="Natural Language Processing API for Urban Analytics Queries",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development/production
    allow_credentials=False,  # Set to False when using wildcard origins
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Global variables for model
llm = None
agent = None

# Pydantic models
class ConversationMessage(BaseModel):
    role: str = Field(..., description="Role of the message sender (user or assistant)")
    content: str = Field(..., description="Content of the message")
    timestamp: Optional[str] = Field(None, description="Timestamp of the message")

class QuestionRequest(BaseModel):
    question: str = Field(..., description="Natural language question about urban data", min_length=1, max_length=500)
    language: Optional[str] = Field("auto", description="Response language preference (auto, es, en)")
    conversation_history: Optional[List[ConversationMessage]] = Field(None, description="Previous conversation messages for context")

class QuestionResponse(BaseModel):
    success: bool
    question: str
    answer: str
    execution_time: Optional[float] = None
    error: Optional[str] = None
    cached: Optional[bool] = False  # Indicate if response was cached
    validation_warnings: Optional[List[str]] = None  # Data quality warnings

class HealthResponse(BaseModel):
    status: str
    database_connected: bool
    openai_connected: bool
    agent_ready: bool

# Initialize model and agent
async def initialize_agent():
    """Initialize the LLM and SQL agent on startup"""
    global llm, agent
    
    try:
        info("Initializing AUQ NLP API...")
        
        # Validate environment variables
        if not SUPABASE_URI:
            raise ValueError("SUPABASE_URI is missing in the .env file.")
        if not OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is missing in the .env file.")

        # Load OpenAI model (upgraded to GPT-4 Turbo for better performance)
        info("Loading OpenAI model...")
        llm = ChatOpenAI(
            model="gpt-4-turbo-preview",  # Upgraded model
            temperature=0,
            openai_api_key=OPENAI_API_KEY,
            request_timeout=60,  # Increased timeout for complex queries
            max_tokens=1500  # Limit response length
        )

        # Connect to Supabase DB
        info("Connecting to Supabase database...")
        db = SQLDatabase.from_uri(SUPABASE_URI, sample_rows_in_table_info=0)

        # Load prompt template (with fallback)
        info("Loading enhanced prompt template...")
        try:
            with open(PROMPT_PATH, "r") as f:
                prompt_content = f.read()
        except FileNotFoundError:
            warning(f"Enhanced prompt not found, using fallback...")
            with open(FALLBACK_PROMPT_PATH, "r") as f:
                prompt_content = f.read()
        
        custom_prompt = PromptTemplate.from_template(prompt_content)

        # Create the agent
        info("Creating SQL agent...")
        toolkit = SQLDatabaseToolkit(db=db, llm=llm)
        agent = create_sql_agent(
            llm=llm,
            toolkit=toolkit,
            verbose=False,  # Set to False for API
            prompt=custom_prompt,
            handle_parsing_errors=True
        )
        
        success("AUQ NLP API initialized successfully!")
        return True
        
    except Exception as e:
        error(f"Failed to initialize agent: {e}")
        return False

# Startup event
@app.on_event("startup")
async def startup_event():
    await initialize_agent()

# CORS Preflight handler
@app.options("/{path:path}")
async def options_handler(path: str):
    """Handle CORS preflight requests"""
    return {"message": "OK"}

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint to verify API status"""
    try:
        database_connected = SUPABASE_URI is not None
        openai_connected = OPENAI_API_KEY is not None
        agent_ready = agent is not None
        
        return HealthResponse(
            status="healthy" if all([database_connected, openai_connected, agent_ready]) else "unhealthy",
            database_connected=database_connected,
            openai_connected=openai_connected,
            agent_ready=agent_ready
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

# Main question endpoint with enhanced processing
@app.post("/ask", response_model=QuestionResponse)
async def ask_question(request: QuestionRequest):
    """Process a natural language question about urban data with caching and validation"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized. Check /health endpoint.")
    
    start_time = time.time()
    
    try:
        info(f"Processing question: {request.question}")
        
        # Build context string for caching
        context = ""
        if request.conversation_history:
            context = "|".join([f"{msg.role}:{msg.content}" for msg in request.conversation_history[-2:]])
        
        # 1. Check cache first
        cached_response = query_cache.get(request.question, context)
        if cached_response:
            info(f"Cache hit for question: {request.question}")
            cached_response["cached"] = True
            cached_response["execution_time"] = time.time() - start_time
            return QuestionResponse(**cached_response)
        
        # 2. Check for pre-compiled queries
        precompiled = PrecompiledQueries.find_matching_query(request.question)
        if precompiled:
            info(f"Using pre-compiled query for: {request.question}")
            try:
                # Execute the pre-compiled SQL directly
                from langchain_community.utilities import SQLDatabase
                db = SQLDatabase.from_uri(SUPABASE_URI)
                
                sql_result = db.run(precompiled["sql"])
                formatted_answer = PrecompiledQueries.format_response(
                    precompiled["response_template"], 
                    sql_result
                )
                
                execution_time = time.time() - start_time
                
                response_data = {
                    "success": True,
                    "question": request.question,
                    "answer": formatted_answer,
                    "execution_time": execution_time,
                    "cached": False
                }
                
                # Cache the response
                query_cache.set(request.question, response_data, context)
                
                success(f"Pre-compiled query processed in {execution_time:.2f}s")
                return QuestionResponse(**response_data)
                
            except Exception as e:
                warning(f"Pre-compiled query failed, falling back to agent: {e}")
        
        # 3. Build context-aware input for the agent
        contextual_input = request.question
        
        if request.conversation_history and len(request.conversation_history) > 0:
            # Limit to last 4 messages (2 exchanges) to save tokens
            recent_history = request.conversation_history[-4:]
            
            context_parts = ["Previous context:"]
            for msg in recent_history:
                role_name = "User" if msg.role == "user" else "Assistant"
                context_parts.append(f"{role_name}: {msg.content}")
            
            context_parts.append(f"\nCurrent question: {request.question}")
            contextual_input = "\n".join(context_parts)
            
            info(f"Added conversation context ({len(recent_history)} messages)")
        
        # 4. Process with LangChain agent
        info("Processing with LangChain agent...")
        agent_response = agent.invoke({"input": contextual_input}, handle_parsing_errors=True)
        
        execution_time = time.time() - start_time
        answer = agent_response.get("output", "No answer provided")
        
        # 5. Validate the response
        validation_warnings = []
        try:
            # Basic validation for common data types
            if "population" in request.question.lower():
                # Try to extract numbers for validation
                import re
                numbers = re.findall(r'\d{1,3}(?:,\d{3})*', answer)
                if numbers:
                    for num_str in numbers:
                        num = int(num_str.replace(',', ''))
                        validation = result_validator.validate_population_data([[None, num]], geo_level=2)
                        validation_warnings.extend(validation.get("warnings", []))
                        if not validation["is_valid"]:
                            warning(f"Population validation failed: {validation['errors']}")
            
        except Exception as validation_error:
            warning(f"Validation error: {validation_error}")
        
        # 6. Prepare response
        response_data = {
            "success": True,
            "question": request.question,
            "answer": answer,
            "execution_time": execution_time,
            "cached": False,
            "validation_warnings": validation_warnings if validation_warnings else None
        }
        
        # 7. Cache the response
        query_cache.set(request.question, response_data, context)
        
        success(f"Question processed in {execution_time:.2f}s")
        return QuestionResponse(**response_data)
        
    except Exception as e:
        error(f"Error processing question: {e}")
        return QuestionResponse(
            success=False,
            question=request.question,
            answer="",
            error=str(e),
            execution_time=time.time() - start_time
        )

# Additional endpoints for frontend
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "AUQ NLP API - Natural Language Processing for Urban Analytics",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/examples")
async def get_examples():
    """Get example questions for the frontend"""
    return {
        "examples": [
            "¿Cuál es la población de Barcelona?",
            "¿Cuántos distritos tiene Barcelona?",
            "¿Cuál es la población de Eixample?",
            "¿Cuántas escuelas hay en Gràcia?",
            "Compara la población de Sarrià-Sant Gervasi y Nou Barris",
            "What is the population density of Barcelona?",
            "Show me the districts with the highest population",
        ]
    }

@app.get("/cache/stats")
async def get_cache_stats():
    """Get cache statistics for performance monitoring"""
    try:
        stats = query_cache.get_stats()
        return {
            "cache_stats": stats,
            "precompiled_queries": len(PrecompiledQueries.COMMON_QUERIES),
            "cache_hit_rate": f"{(stats['valid_entries'] / max(stats['total_entries'], 1)) * 100:.1f}%"
        }
    except Exception as e:
        return {"error": f"Failed to get cache stats: {str(e)}"}

@app.post("/cache/clear")
async def clear_cache():
    """Clear the query cache (admin function)"""
    try:
        query_cache.clear()
        return {"message": "Cache cleared successfully"}
    except Exception as e:
        return {"error": f"Failed to clear cache: {str(e)}"}

if __name__ == "__main__":
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 
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

# Ignore LangChain internal deprecation warnings
warnings.filterwarnings("ignore", category=LangChainDeprecationWarning)

# Configuration
BASE_DIR = Path(__file__).resolve().parents[0]
PROMPT_PATH = BASE_DIR / "prompt" / "custom_prompt.txt"

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
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "https://localhost:3000",
        "*"  # Allow all origins in production - adjust for security as needed
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

        # Load OpenAI model
        info("Loading OpenAI model...")
        llm = ChatOpenAI(
            model="gpt-3.5-turbo",
            temperature=0,
            openai_api_key=OPENAI_API_KEY,
            request_timeout=30
        )

        # Connect to Supabase DB
        info("Connecting to Supabase database...")
        db = SQLDatabase.from_uri(SUPABASE_URI, sample_rows_in_table_info=0)

        # Load prompt template
        info("Loading prompt template...")
        with open(PROMPT_PATH, "r") as f:
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

# Main question endpoint
@app.post("/ask", response_model=QuestionResponse)
async def ask_question(request: QuestionRequest):
    """Process a natural language question about urban data"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized. Check /health endpoint.")
    
    try:
        import time
        start_time = time.time()
        
        info(f"Processing question: {request.question}")
        
        # Build context-aware input
        contextual_input = request.question
        
        # Add conversation history if provided
        if request.conversation_history and len(request.conversation_history) > 0:
            # Limit to last 6 messages (3 exchanges) to avoid token limits
            recent_history = request.conversation_history[-6:]
            
            context_parts = ["Previous conversation context:"]
            for msg in recent_history:
                role_name = "User" if msg.role == "user" else "Assistant"
                context_parts.append(f"{role_name}: {msg.content}")
            
            context_parts.append(f"\nCurrent question: {request.question}")
            contextual_input = "\n".join(context_parts)
            
            info(f"Added conversation context ({len(recent_history)} messages)")
        
        # Process the question with context
        response = agent.invoke({"input": contextual_input}, handle_parsing_errors=True)
        
        execution_time = time.time() - start_time
        answer = response.get("output", "No answer provided")
        
        success(f"Question processed in {execution_time:.2f}s")
        
        return QuestionResponse(
            success=True,
            question=request.question,
            answer=answer,
            execution_time=execution_time
        )
        
    except Exception as e:
        error(f"Error processing question: {e}")
        return QuestionResponse(
            success=False,
            question=request.question,
            answer="",
            error=str(e)
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
            "¿Cuál es el barrio con más población en Barcelona?",
            "What is the neighborhood with the greatest number of people in Barcelona?",
            "¿Cuántos colegios hay en el distrito de Eixample?",
            "¿Cuál es la densidad de población promedio por distrito?",
            "Show me the districts with the highest population density",
        ]
    }

if __name__ == "__main__":
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 
"""
Main FastAPI application for AUQ NLP

Professional FastAPI application with proper structure, error handling,
middleware, and endpoint organization.
"""

import asyncio
from contextlib import asynccontextmanager
from typing import Dict, Any, List, Optional

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from ..core.config import settings
from ..agents.query_processor import get_processor
from ..agents.langchain_agent import cleanup_agent
from ..utils.logging import setup_logging, get_logger, success, warning, error


# Setup logging
setup_logging()
logger = get_logger(__name__)

# Request/Response Models
class QueryRequest(BaseModel):
    """Request model for query processing"""
    question: str = Field(..., description="Natural language question", min_length=1)
    context: str = Field(default="", description="Additional context for the query")
    conversation_history: Optional[List[Dict[str, str]]] = Field(
        default=None, 
        description="Previous conversation history"
    )

class QueryResponse(BaseModel):
    """Response model for query processing"""
    success: bool
    answer: str
    question: str
    context: str
    cached: bool
    precompiled: bool
    processing_time_seconds: float
    validation_warnings: List[str]
    intermediate_steps: List[Any]
    timestamp: float
    model: str
    error: Optional[str] = None

class StatusResponse(BaseModel):
    """Response model for system status"""
    status: str
    version: str
    uptime_seconds: float
    processor_status: Dict[str, Any]
    agent_status: Dict[str, Any]

class CacheStatsResponse(BaseModel):
    """Response model for cache statistics"""
    cache_enabled: bool
    size: Optional[int] = None
    max_size: Optional[int] = None
    hit_count: Optional[int] = None
    miss_count: Optional[int] = None
    hit_rate: Optional[float] = None


# Application lifespan management
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown"""
    # Startup
    success("🚀 AUQ NLP API starting up...")
    
    # Validate configuration paths
    settings.validate_paths()
    
    # Initialize processor (which will initialize agent)
    processor = get_processor()
    success("✅ Application startup complete!")
    
    yield
    
    # Shutdown
    warning("🛑 AUQ NLP API shutting down...")
    await cleanup_agent()
    success("✅ Application shutdown complete!")


# Create FastAPI application
def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application
    
    Returns:
        Configured FastAPI application
    """
    app = FastAPI(
        title=settings.api_title,
        description=settings.api_description,
        version=settings.api_version,
        debug=settings.debug,
        lifespan=lifespan
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        **settings.get_cors_config()
    )
    
    # Add exception handlers
    add_exception_handlers(app)
    
    # Add routes
    add_routes(app)
    
    return app


def add_exception_handlers(app: FastAPI):
    """Add custom exception handlers"""
    
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request, exc):
        """Handle HTTP exceptions"""
        error(f"HTTP {exc.status_code}: {exc.detail}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": exc.detail,
                "status_code": exc.status_code
            }
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request, exc):
        """Handle general exceptions"""
        error(f"Unhandled exception: {exc}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Internal server error",
                "status_code": 500
            }
        )


def add_routes(app: FastAPI):
    """Add all API routes"""
    
    # Health check endpoint
    @app.get("/")
    async def root():
        """Root endpoint - health check"""
        return {
            "message": "AUQ NLP API is running!",
            "version": settings.api_version,
            "status": "healthy"
        }
    
    # Main query endpoint
    @app.post("/query", response_model=QueryResponse)
    async def process_query(request: QueryRequest):
        """
        Process a natural language query
        
        Args:
            request: Query request with question, context, and history
            
        Returns:
            Query response with answer and metadata
        """
        try:
            processor = get_processor()
            
            result = await processor.process_query(
                question=request.question,
                context=request.context,
                conversation_history=request.conversation_history
            )
            
            return QueryResponse(**result)
            
        except Exception as e:
            error(f"Error processing query: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Query processing failed: {str(e)}"
            )
    
    # System status endpoint
    @app.get("/status", response_model=StatusResponse)
    async def get_status():
        """
        Get system status and health information
        
        Returns:
            System status with component health
        """
        try:
            processor = get_processor()
            
            # Get agent instance for status
            from ..agents.langchain_agent import get_agent
            agent = await get_agent()
            
            return StatusResponse(
                status="healthy",
                version=settings.api_version,
                uptime_seconds=0.0,  # TODO: Implement uptime tracking
                processor_status=processor.get_status(),
                agent_status=agent.get_status()
            )
            
        except Exception as e:
            error(f"Error getting status: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Status check failed: {str(e)}"
            )
    
    # Cache management endpoints
    @app.get("/cache/stats", response_model=CacheStatsResponse)
    async def get_cache_stats():
        """
        Get cache statistics
        
        Returns:
            Cache statistics and performance metrics
        """
        try:
            processor = get_processor()
            stats = processor.get_cache_stats()
            
            return CacheStatsResponse(**stats)
            
        except Exception as e:
            error(f"Error getting cache stats: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Cache stats failed: {str(e)}"
            )
    
    @app.post("/cache/clear")
    async def clear_cache():
        """
        Clear the query cache
        
        Returns:
            Success confirmation
        """
        try:
            processor = get_processor()
            cleared = processor.clear_cache()
            
            if cleared:
                success("Cache cleared successfully")
                return {"success": True, "message": "Cache cleared successfully"}
            else:
                return {"success": False, "message": "Cache not enabled or already empty"}
                
        except Exception as e:
            error(f"Error clearing cache: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Cache clear failed: {str(e)}"
            )
    
    # Configuration endpoint
    @app.get("/config")
    async def get_config():
        """
        Get public configuration information
        
        Returns:
            Public configuration settings
        """
        return {
            "api_version": settings.api_version,
            "openai_model": settings.openai_model,
            "cache_enabled": settings.cache_enabled,
            "validation_enabled": settings.validation_enabled,
            "precompiled_queries_enabled": settings.enable_precompiled_queries,
            "debug": settings.debug
        }


# Create the application instance
app = create_app()

# Add startup event for Railway deployment compatibility
@app.on_event("startup")
async def startup_event():
    """Legacy startup event for Railway compatibility"""
    success("🌟 AUQ NLP API ready to serve requests!")


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "src.auq_nlp.api.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        log_level=settings.log_level.lower()
    ) 
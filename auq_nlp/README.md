# AUQ NLP Module 🤖

**AI-Powered Natural Language Processing API for Urban Data Analysis**

This module provides an intelligent conversational interface that allows users to query urban and geospatial databases using natural language. Built with modern Python architecture using FastAPI, LangChain, and OpenAI GPT-4.

## ⚡ What's New in v2.0.0

- **🏗️ Modern Architecture**: Complete rewrite with `src/` package layout
- **🚀 New Entry Point**: Use `python run.py` instead of `python api.py`
- **⚙️ Pydantic Settings**: Type-safe configuration management
- **🔧 CLI Interface**: Rich command-line arguments support
- **🌐 Railway Ready**: Pre-configured for Railway deployment
- **📦 pyproject.toml**: Modern Python packaging standards
- **🔄 Fixed Dependencies**: Resolved pydantic-settings imports

## 🌟 Features

- **Natural Language to SQL**: Convert human questions into database queries
- **Conversational Memory**: Context-aware responses with conversation history
- **Urban Data Expertise**: Specialized prompts for demographic and geospatial analysis
- **Real-time Processing**: Fast API responses with execution time tracking
- **Health Monitoring**: API status endpoints for frontend integration
- **CORS Enabled**: Ready for frontend consumption
- **Error Handling**: Graceful error management and user feedback

## 🏗️ Architecture

```
┌─────────────────┐    HTTP     ┌──────────────────┐    SQL    ┌─────────────────┐
│   Frontend      │ ──────────► │   NLP API        │ ────────► │   Supabase      │
│   (Next.js)     │             │   (FastAPI)      │           │   (PostgreSQL)  │
└─────────────────┘             └──────────────────┘           └─────────────────┘
                                         │
                                         ▼
                                ┌──────────────────┐
                                │   OpenAI GPT     │
                                │   (LangChain)    │
                                └──────────────────┘
```

## 📦 Tech Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **LangChain**: Framework for developing LLM applications
- **OpenAI GPT-4**: Large language model for natural language understanding
- **SQLAlchemy**: Database toolkit and ORM
- **Pydantic**: Data validation using Python type hints
- **Uvicorn**: ASGI server for production deployment
- **Pydantic Settings**: Modern configuration management

## 🚀 Quick Start

### 1. Project Structure

The module follows a modern Python package structure:

```
auq_nlp/
├── run.py                   # 🚀 Main entry point
├── pyproject.toml           # 📦 Modern Python configuration
├── src/                     # 📂 Source code
│   └── auq_nlp/
│       ├── api/             # 🌐 FastAPI endpoints
│       ├── agents/          # 🤖 LangChain agents
│       ├── core/            # ⚙️ Configuration & utilities
│       └── utils/           # 🔧 Helper functions
├── config/                  # 📋 Configuration files
│   └── prompts/             # 💬 AI prompts
└── tests/                   # 🧪 Test suite
```

### 2. Environment Setup

Create a `.env` file in the auq_nlp directory:

```bash
# Required environment variables
SUPABASE_URI=postgresql://user:password@host:port/database
OPENAI_API_KEY=sk-your-openai-api-key

# Optional configuration
OPENAI_MODEL=gpt-4-turbo-preview
DEBUG=false
PORT=8000
```

### 3. Install Dependencies

```bash
# From the project root directory
cd auq_nlp

# Activate virtual environment (if using venv)
source ../venv/bin/activate

# Install all dependencies
pip install fastapi uvicorn pydantic pydantic-settings langchain langchain-community langchain-openai openai psycopg2-binary sqlalchemy python-dotenv httpx
```

### 4. Run the API

```bash
# Development mode with auto-reload
python run.py --debug --reload

# Production mode
python run.py

# Custom port
python run.py --port 8080

# The API will be available at:
# - Main API: http://localhost:8000
# - Interactive docs: http://localhost:8000/docs
# - ReDoc: http://localhost:8000/redoc
```

## 📊 API Endpoints

### Core Endpoints

#### `POST /ask`
Process natural language questions about urban data.

**Request:**
```json
{
  "question": "What is the population of Gràcia district?",
  "language": "auto",
  "conversation_history": [
    {
      "role": "user",
      "content": "Tell me about Barcelona districts",
      "timestamp": "2024-01-01T10:00:00Z"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "question": "What is the population of Gràcia district?",
  "answer": "The Gràcia district has a population of 120,000 inhabitants according to the latest data.",
  "execution_time": 3.45
}
```

#### `GET /health`
Check API and dependencies status.

**Response:**
```json
{
  "status": "healthy",
  "database_connected": true,
  "openai_connected": true,
  "agent_ready": true
}
```

#### `GET /examples`
Get example questions for user guidance.

**Response:**
```json
{
  "examples": [
    "¿Cuál es el barrio con más población en Barcelona?",
    "What is the neighborhood with the greatest number of people?",
    "¿Cuántos colegios hay en el distrito de Eixample?"
  ]
}
```

## 🧠 Intelligence Features

### Conversational Memory

The API maintains context across conversations using a sliding window approach:

- **Sliding Window**: Last 6 messages (3 exchanges) included as context
- **Context Formatting**: Structured conversation history sent to LLM
- **Reference Resolution**: Understands "the previous district", "compare it", etc.

### Smart Query Processing

```python
# Example conversation flow:
User: "What's the population of Gràcia?"
Bot: "Gràcia district has 120,000 inhabitants."

User: "And what about Eixample?"  # Context-aware!
Bot: "Eixample district has 245,000 inhabitants."

User: "Which one is more dense?"  # Remembers both districts!
Bot: "Eixample is more dense with 15,300 people per km²..."
```

### Urban Data Specialization

Custom prompts optimized for:
- **Geographic Hierarchies**: Cities → Districts → Neighborhoods
- **Urban Indicators**: Population, demographics, infrastructure
- **Spatial Relationships**: Comparisons, proximity, density
- **Multilingual Support**: Spanish and English queries

## 🎯 Database Integration

### Supported Queries

The agent can handle complex urban data questions:

- **Population Analysis**: "What's the most populated neighborhood?"
- **Comparative Studies**: "Compare income levels between districts"
- **Demographic Insights**: "Tell me about age distribution in Sarrià"
- **Infrastructure Queries**: "How many schools are in Eixample?"
- **Spatial Analysis**: "Which district has the highest density?"

### Database Schema Understanding

The AI agent understands:
- **Geographic Levels**: 1=City, 2=District, 3=Neighborhood
- **Indicator System**: Metadata and values linkage
- **Spatial Relationships**: Parent-child geographic relationships
- **Data Quality**: Handles missing values and data gaps

## 🔧 Configuration

### Modern Configuration System

The system uses **Pydantic Settings** for configuration management with environment variables:

```python
# Located in: src/auq_nlp/core/config.py
class Settings(BaseSettings):
    # API Configuration
    api_title: str = "AUQ NLP API"
    api_version: str = "2.0.0"
    host: str = "0.0.0.0"
    port: int = 8000
    
    # OpenAI Configuration
    openai_model: str = "gpt-4-turbo-preview"
    openai_temperature: float = 0.0
    
    # Database Configuration
    supabase_uri: str = Field(..., env="SUPABASE_URI")
    
    class Config:
        env_file = ".env"
```

### Custom Prompts

Specialized prompts are located in:
```
config/prompts/
├── enhanced_prompt.txt      # Main system prompt
└── custom_prompt.txt        # Fallback prompt
```

### Performance Tuning

All parameters are configurable via environment variables:
- **Temperature**: 0 (deterministic responses)
- **Request Timeout**: 60 seconds (configurable)
- **Context Window**: 4 messages maximum (configurable)
- **Cache**: Enabled by default (configurable)

## 🐛 Error Handling

The API provides comprehensive error management:

### Parsing Errors
When the LLM response doesn't match expected format:
```json
{
  "success": false,
  "question": "ambiguous question",
  "answer": "",
  "error": "Could not parse LLM output: ..."
}
```

### Database Errors
When SQL queries fail:
- Automatic retry mechanisms
- User-friendly error messages
- Fallback response generation

### Context Limitations
When conversation history exceeds limits:
- Automatic truncation to recent messages
- Context prioritization
- Graceful degradation

## 📈 Monitoring & Observability

### Logging

Modern logging system with emoji indicators:
```
💡 [auq_nlp.api.main - INFO] Processing question: What's the population?
✅ [auq_nlp.api.main - INFO] Question processed in 2.34s
❌ [auq_nlp.api.main - ERROR] Database connection failed
```

Configurable via environment variables:
```bash
LOG_LEVEL=DEBUG
LOG_FORMAT="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
```

### Performance Metrics

Tracked metrics:
- **Response Time**: End-to-end query processing
- **Success Rate**: Successful vs failed queries
- **Token Usage**: OpenAI API consumption
- **Database Performance**: Query execution times

## 🚀 Production Deployment

### Railway Deployment Ready

The module is configured for **Railway** deployment with:

- **Procfile**: `web: cd auq_nlp && python run.py --host 0.0.0.0 --port $PORT`
- **railway.toml**: Pre-configured build and deploy settings
- **pyproject.toml**: Modern dependency management

### Environment Variables

```bash
# Production settings
SUPABASE_URI=postgresql://prod-user:password@prod-host:5432/prod-db
OPENAI_API_KEY=sk-prod-api-key
OPENAI_MODEL=gpt-4-turbo-preview
DEBUG=false
LOG_LEVEL=INFO
```

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY pyproject.toml ./
RUN pip install fastapi uvicorn pydantic pydantic-settings langchain langchain-community langchain-openai openai psycopg2-binary sqlalchemy python-dotenv httpx

# Copy source code
COPY . .
EXPOSE 8000

# Use the new run.py entry point
CMD ["python", "run.py", "--host", "0.0.0.0", "--port", "8000"]
```

### CORS Configuration

CORS is configured via environment variables:
```bash
CORS_ORIGINS=["https://your-domain.com"]
CORS_ALLOW_CREDENTIALS=false
```

## 🧪 Testing

### Manual Testing

Test the API using the interactive docs at `/docs` or with curl:

```bash
# Health check
curl http://localhost:8000/health

# Ask a question
curl -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the population of Barcelona?"}'
```

### Example Queries

Try these questions to test functionality:

**Spanish:**
- "¿Cuál es el barrio con más población en Barcelona?"
- "Compara los ingresos entre Gràcia y Eixample"
- "¿Cuántos colegios hay en Sarrià-Sant Gervasi?"

**English:**
- "What is the most densely populated district?"
- "Show me demographics for the Eixample area"
- "How many hospitals are in the city center?"

## 📚 Advanced Usage

## 📋 Command Line Interface

The new `run.py` script provides comprehensive CLI options:

```bash
python run.py --help

usage: run.py [-h] [--host HOST] [--port PORT] [--reload] [--debug]
              [--log-level {DEBUG,INFO,WARNING,ERROR,CRITICAL}] [--workers WORKERS]

Examples:
  python run.py                         # Run with default settings
  python run.py --port 8080             # Run on port 8080
  python run.py --host 127.0.0.1        # Run on localhost only
  python run.py --debug --reload        # Development mode
  python run.py --log-level DEBUG       # Verbose logging
```

### Custom Context Injection

Add geographic context to queries:
```python
contextual_question = f"In the context of {selected_area}: {user_question}"
```

### Conversation State Management

The frontend manages conversation history (configurable window size):
```typescript
const conversationHistory = messages.slice(-4).map(msg => ({
  role: msg.sender === 'user' ? 'user' : 'assistant',
  content: msg.content,
  timestamp: msg.timestamp.toISOString()
}))
```

### Configuration Override

Override settings programmatically:
```python
from auq_nlp.core.config import settings
settings.openai_model = "gpt-4"
settings.max_conversation_history = 6
```

## 📝 License & Attribution

All code is released under the [MIT License](../LICENSE).
Please attribute **Nico Dalessandro** and the **Are-u-Queryous** project if reused.

## 🔧 Development & Architecture

### Modern Python Packaging

- **pyproject.toml**: Modern dependency and build management
- **src/ layout**: Industry standard package structure
- **Pydantic Settings**: Type-safe configuration management
- **FastAPI**: Async/await support with automatic OpenAPI docs
- **LangChain**: Modular AI agent architecture

### Code Quality & Testing

```bash
# Run tests (when available)
python -m pytest tests/

# Code formatting
black src/
isort src/

# Type checking
mypy src/
```

---

**🎓 Developed as part of "Valgrai IA para profesionales del sector TIC (4a edición)"**  
*Showcasing modern AI implementation in geospatial data analysis with professional Python practices*

**✨ Version 2.0.0** - Complete architectural redesign with modular structure, modern configuration management, and Railway deployment readiness.

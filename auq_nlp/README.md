# AUQ NLP Module 🤖

**AI-Powered Natural Language Processing API for Urban Data Analysis**

This module provides an intelligent conversational interface that allows users to query urban and geospatial databases using natural language. Built with FastAPI, LangChain, and OpenAI GPT-3.5-turbo.

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
- **OpenAI GPT-3.5-turbo**: Large language model for natural language understanding
- **SQLAlchemy**: Database toolkit and ORM
- **Pydantic**: Data validation using Python type hints
- **Uvicorn**: ASGI server for production deployment

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env` file in the project root:

```bash
# Required environment variables
SUPABASE_URI=postgresql://user:password@host:port/database
OPENAI_API_KEY=sk-your-openai-api-key
```

### 2. Install Dependencies

```bash
# Activate virtual environment
source ../auq_env/bin/activate

# Install requirements (from project root)
pip install -r requirements.txt
```

### 3. Run the API

```bash
# Development mode with auto-reload
python api.py

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

### Custom Prompts

The system uses specialized prompts located in:
```
prompt/custom_prompt.txt
```

Key prompt features:
- Urban data domain expertise
- SQL generation guidelines
- Error handling instructions
- Multilingual response formatting

### Performance Tuning

Adjustable parameters:
- **Temperature**: 0 (deterministic responses)
- **Request Timeout**: 30 seconds
- **Context Window**: 6 messages maximum
- **Token Limits**: Automatic conversation truncation

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

Comprehensive logging with emoji indicators:
```
📊 [api.py - info] Processing question: What's the population?
✅ [api.py - success] Question processed in 2.34s
❗ [api.py - error] Database connection failed
```

### Performance Metrics

Tracked metrics:
- **Response Time**: End-to-end query processing
- **Success Rate**: Successful vs failed queries
- **Token Usage**: OpenAI API consumption
- **Database Performance**: Query execution times

## 🚀 Production Deployment

### Environment Variables

```bash
# Production settings
SUPABASE_URI=postgresql://prod-user:password@prod-host:5432/prod-db
OPENAI_API_KEY=sk-prod-api-key
```

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
```

### CORS Configuration

For production, update CORS origins in `api.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
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

### Custom Context Injection

Add geographic context to queries:
```python
contextual_question = f"In the context of {selected_area}: {user_question}"
```

### Conversation State Management

The frontend manages conversation history:
```typescript
const conversationHistory = messages.slice(-6).map(msg => ({
  role: msg.sender === 'user' ? 'user' : 'assistant',
  content: msg.content,
  timestamp: msg.timestamp.toISOString()
}))
```

## 📝 License & Attribution

All code is released under the [MIT License](../LICENSE).
Please attribute **Nico Dalessandro** and the **Are-u-Queryous** project if reused.

---

**Developed as part of "Valgrai IA para profesionales del sector TIC (4a edición)"**  
*Showcasing practical AI implementation in geospatial data analysis*

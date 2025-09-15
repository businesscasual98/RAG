# BAH RAG Demo

Simple RAG (Retrieval-Augmented Generation) demonstration with clean architecture.

## Implementation Status
✅ **Backend Complete** - Node.js/Express API with LangChain, ChromaDB, and OpenRouter integration
🔄 **Frontend Pending** - React interface for document upload and chat
🔄 **Integration Pending** - Full-stack communication and testing

## Core Features
- Document upload and processing
- Chat interface with RAG-powered responses
- Source citations and logging
- Containerized deployment

## Requirements Checklist
- [ ] **Frontend**: React app with upload + chat interface
- [x] **Backend**: Node.js API with document processing
- [x] **RAG Pipeline**: Langchain integration with vector search
- [x] **Containerization**: Docker setup for deployment
- [x] **Logging**: Clear RAG process demonstration

## Quick Start

### 1. Environment Setup
```bash
# Configure your API keys in the existing .env file
# Add your OpenRouter API key for LLM access
```

### 2. Start Services
```bash
# Start ChromaDB and backend API
docker-compose up -d

# Verify services are healthy
curl http://localhost:3001/health
```

### 3. Test RAG Pipeline
```bash
# Upload a document
curl -X POST -F "document=@example.pdf" \
  http://localhost:3001/api/documents/upload

# Process document for vectorization (use returned document ID)
curl -X POST -H "Content-Type: application/json" \
  -d '{"documentId": "your-document-id"}' \
  http://localhost:3001/api/chat/process

# Query the document with RAG
curl -X POST -H "Content-Type: application/json" \
  -d '{"query": "What is this document about?"}' \
  http://localhost:3001/api/chat/query
```

### 4. Monitor Processing
```bash
# View backend logs
docker-compose logs -f backend

# Check structured logs via API
curl http://localhost:3001/api/logs
```

## Technology Stack

**Backend**: Node.js + Express + Langchain
**Frontend**: React with file upload + chat UI
**Vector DB**: Chroma (containerized)
**LLM**: Open Router API
**Deployment**: Docker + Docker Compose

## Project Structure
```
RAG/
├── docker-compose.yml
├── .env
├── frontend/          # React app
├── backend/           # Node.js API + RAG logic
└── docs/             # Documentation
```

**Simplified Architecture**: Single backend service handles both API and RAG processing to reduce complexity while maintaining clear separation of concerns.

## API Endpoints
- `POST /api/upload` - Upload and process document
- `POST /api/chat` - Submit query, get RAG response with citations
- `GET /api/documents` - List processed documents
- `GET /api/health` - Service health check

## Quick Start
```bash
# Start development environment
docker-compose up

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Environment Setup
Copy `.env` file and fill in your API keys:
- `OPENROUTER_API_KEY` - For LLM responses
- `LANGCHAIN_API_KEY` - For tracing (optional)

## Demo Flow
1. Upload a document (PDF/TXT)
2. Ask questions about the document
3. Review responses with citations
4. Check logs to see RAG process
# RAG Backend Service

## Overview
Node.js/Express backend service implementing RAG (Retrieval-Augmented Generation) functionality with LangChain, vector storage via ChromaDB, and OpenRouter LLM integration.

## Features
- Document upload and processing (PDF, TXT, DOCX)
- Text chunking and vectorization with LangChain
- Vector similarity search using ChromaDB
- LLM integration via OpenRouter API
- Comprehensive logging and monitoring
- RESTful API with proper error handling

## API Endpoints

### Health & Status
- `GET /health` - Service health check
- `GET /api` - API information and available endpoints

### Document Management
- `POST /api/documents/upload` - Upload document for processing
- `GET /api/documents` - List all uploaded documents
- `GET /api/documents/:id/status` - Get document processing status

### RAG Operations
- `POST /api/chat/query` - Submit query for RAG processing
- `POST /api/chat/process` - Process uploaded document for vectorization
- `GET /api/chat/history` - Get chat history (placeholder)

### Development
- `GET /api/logs` - View recent log entries (dev only)
- `POST /api/logs/clear` - Clear log entries (dev only)

## Quick Start

### Using Docker (Recommended)
```bash
# From project root
docker-compose up -d

# Check service health
curl http://localhost:3001/health
```

### Local Development
```bash
# Install dependencies
npm install

# Start the service
npm run dev

# Service will be available at http://localhost:3001
```

## Usage Flow

1. **Upload Document**
   ```bash
   curl -X POST -F "document=@example.pdf" http://localhost:3001/api/documents/upload
   ```

2. **Process Document for Vectorization**
   ```bash
   curl -X POST -H "Content-Type: application/json" \
     -d '{"documentId": "your-document-id"}' \
     http://localhost:3001/api/chat/process
   ```

3. **Query Documents**
   ```bash
   curl -X POST -H "Content-Type: application/json" \
     -d '{"query": "What is this document about?"}' \
     http://localhost:3001/api/chat/query
   ```

## Configuration
Set environment variables in `.env` file:

```env
OPENROUTER_API_KEY=your_openrouter_key
CHROMA_HOST=localhost
CHROMA_PORT=8000
API_PORT=3001
LOG_LEVEL=info
```

## Architecture
- **Express.js**: Web framework and API routing
- **LangChain**: Document processing and text splitting
- **ChromaDB**: Vector database for embeddings
- **OpenRouter**: LLM API for response generation
- **Winston**: Structured logging
- **Multer**: File upload handling
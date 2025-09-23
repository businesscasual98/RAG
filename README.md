# BAH RAG Demo - Enterprise AI Solution

Enterprise-grade RAG (Retrieval-Augmented Generation) implementation showcasing full-stack development capabilities, LLM framework expertise, and microservices architecture.

*Last updated: 2025-09-23 - Complete implementation with comprehensive code walkthrough*

## Implementation Status
✅ **Backend Complete** - Node.js/Express API with LangChain, ChromaDB, and multi-provider LLM integration
✅ **Frontend Complete** - React/TypeScript interface with enterprise-grade UI components
✅ **Integration Complete** - Full-stack communication with automated document processing
✅ **Containerization** - Docker microservices architecture with health monitoring

## Architecture Overview

This project demonstrates enterprise software engineering principles through a clean, scalable RAG implementation:

### 🏗️ **Microservices Architecture**
```
RAG/
├── frontend/          # React + TypeScript SPA
├── backend/           # Node.js + Express RESTful API
├── vector-db/         # ChromaDB containerized service
└── docker-compose.yml # Service orchestration
```

### 🛠️ **Technology Stack**

**Frontend**: React 19 + TypeScript + Modern CSS
- **Framework**: React with functional components and hooks
- **Type Safety**: Full TypeScript implementation with custom type definitions
- **State Management**: React hooks (useState, useEffect) for component state
- **HTTP Client**: Axios with TypeScript interfaces and error handling
- **UI Components**: Custom-built upload, chat, and document management interfaces

**Backend**: Node.js + Express + LangChain Integration
- **Framework**: Express.js with middleware architecture
- **LLM Integration**: Multi-provider support (Gemini AI, OpenRouter API)
- **Document Processing**: PDF/text extraction with intelligent chunking
- **Vector Operations**: ChromaDB integration for embeddings and similarity search
- **Logging**: Winston structured logging with request/response tracing

**Infrastructure**: Docker + Production-Ready Services
- **Containerization**: Multi-service Docker Compose with health checks
- **Vector Database**: ChromaDB with persistent storage
- **Environment Management**: Configuration-driven deployment
- **Networking**: Internal service communication with external API access

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

## 📋 **Code Walkthrough**

### Frontend Architecture (`frontend/src/`)

**Core Application (`App.tsx`)**
```typescript
// Main application component with state management
- Document upload handling with automatic vectorization
- Error state management and user feedback
- Component orchestration (upload, list, chat)
- TypeScript interfaces for type safety
```

**Key Components:**
- **`DocumentUpload.tsx`**: Drag-and-drop file upload with validation
- **`ChatInterface.tsx`**: Real-time chat with RAG-powered responses
- **`DocumentList.tsx`**: Document management with processing status
- **`ErrorNotification.tsx`**: Global error handling and user feedback

**API Integration (`services/api.ts`)**
```typescript
// TypeScript API client with full error handling
- Axios configuration with interceptors
- Type-safe request/response interfaces
- Upload, chat, and document management endpoints
- Automatic request timeout and error recovery
```

### Backend Architecture (`backend/src/`)

**Express Server (`index.js`)**
```javascript
// Production-ready Express.js application
- CORS configuration for cross-origin requests
- Middleware pipeline (logging, error handling, file uploads)
- RESTful API routing with proper HTTP status codes
- Graceful shutdown handling for containerized deployment
```

**RAG Service Implementation (`services/ragService.js`)**
```javascript
// Core RAG pipeline with multi-provider LLM support
- Vector similarity search using ChromaDB
- Context building from retrieved documents
- Multi-provider LLM integration (Gemini, OpenRouter)
- Source attribution and citation extraction
- Comprehensive error handling and fallback strategies
```

**Key Services:**
- **`vectorStore.js`**: ChromaDB integration for embeddings and search
- **`documentProcessor.js`**: PDF/text extraction and intelligent chunking
- **`ragService.js`**: Complete RAG pipeline implementation

**Middleware & Utilities:**
- **`requestLogger.js`**: Winston-based request/response logging
- **`errorHandler.js`**: Centralized error handling with proper HTTP codes
- **`fileValidator.js`**: File upload validation and security checks

### Infrastructure (`docker-compose.yml`)

**Microservices Architecture:**
```yaml
services:
  vector-db:    # ChromaDB with persistent storage
  backend:      # Node.js API with environment configuration
  frontend:     # React SPA served via Nginx
```

**Production Features:**
- Health checks for all services
- Volume persistence for data
- Internal networking for service communication
- Environment-based configuration

## 🛠️ **RESTful API Documentation**

### Core Endpoints

#### Document Management
```http
POST /api/documents/upload
Content-Type: multipart/form-data

# Upload and automatically process documents
# Supports: PDF, TXT, DOCX
# Auto-triggers vectorization pipeline
```

```http
GET /api/documents
Content-Type: application/json

# List all uploaded documents with processing status
Response: {
  "documents": [{
    "id": "uuid",
    "originalName": "document.pdf",
    "status": "processed",
    "vectorized": true,
    "chunkCount": 15,
    "uploadedAt": "2025-09-23T10:00:00Z"
  }]
}
```

#### RAG Query Processing
```http
POST /api/chat/query
Content-Type: application/json

Request: {
  "query": "What are the main topics in the uploaded documents?"
}

Response: {
  "answer": "Based on the uploaded documents...",
  "sources": [{
    "sourceNumber": 1,
    "documentId": "uuid",
    "documentName": "document.pdf",
    "similarity": 0.85,
    "content": "Relevant excerpt..."
  }],
  "confidence": 0.85,
  "queryProcessedAt": "2025-09-23T10:01:00Z"
}
```

#### Service Health
```http
GET /health
Content-Type: application/json

Response: {
  "status": "healthy",
  "timestamp": "2025-09-23T10:00:00Z",
  "uptime": 3600,
  "environment": "production"
}
```

### LLM Integration Features

**Multi-Provider Support:**
- **Primary**: Gemini 1.5 Flash for fast, high-quality responses
- **Fallback**: OpenRouter API with multiple model options
- **Error Handling**: Graceful degradation and service overload management

**RAG Pipeline:**
1. **Document Processing**: PDF/text extraction → intelligent chunking
2. **Vectorization**: Embedding generation → ChromaDB storage
3. **Query Processing**: Similarity search → context retrieval
4. **Response Generation**: LLM prompting → citation extraction

## 🏗️ **Software Engineering Excellence**

### Design Patterns
- **Repository Pattern**: Vector store abstraction for database operations
- **Service Layer**: Business logic separation from HTTP routing
- **Middleware Pattern**: Request/response processing pipeline
- **Factory Pattern**: Multi-provider LLM configuration

### Security & Production Features
- **Input Validation**: File type and size restrictions
- **Error Handling**: Comprehensive try-catch with user-friendly messages
- **Logging**: Structured logging with request correlation IDs
- **Configuration Management**: Environment-based secrets and settings

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
# BAH RAG Demo - Project Instructions

## Project Overview
Interview demonstration of a RAG (Retrieval-Augmented Generation) implementation using modern microservices architecture.

## Core Requirements

### Architecture
- Dockerized microservices architecture
- React frontend
- Node.js backend
- Document upload and vectorization pipeline
- RAG implementation with citations and logging

### Technology Stack
- **LLM Integration**: Open Router or Hugging Face
- **Vector Database**: To be determined (Pinecone, Chroma, or Weaviate)
- **Embeddings**: Langchain with appropriate embedding model
- **Frontend**: React with document upload interface
- **Backend**: Node.js with Express
- **Containerization**: Docker with docker-compose

### Functional Requirements
1. Document upload capability
2. Document processing and vectorization using Langchain
3. Chat interface for user queries
4. RAG-powered responses with citations
5. Comprehensive logging to prove RAG functionality
6. Simple but functional UI (upload box + chat)

### Development Commands
- Use `npx supabase` for any Supabase operations
- Maintain Docker containers for each microservice
- Implement proper error handling and logging

## Design Principles
- "Vibe coding" approach with solid architectural foundation
- Minimal viable product with clear RAG demonstration
- Focus on functionality over aesthetics
- Comprehensive logging for interview demonstration
- Modular design for easy explanation and extension

## Success Criteria
- Successful document upload and processing
- Accurate RAG responses with source citations
- Clear logging trail showing RAG process
- Containerized deployment
- Clean, explainable codebase structure
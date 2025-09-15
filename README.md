# BAH RAG Demo - Interview Project

## Project Status
🚧 **In Development** - Planning phase complete, ready for implementation

## Requirements Tracking

### ✅ Completed Requirements
- [x] Project documentation (CLAUDE.md)
- [x] Development roadmap
- [x] Requirements tracking system (this README)

### 🔄 In Progress Requirements
None currently in progress

### ⏳ Pending Requirements

#### Core Architecture
- [ ] **Dockerized Microservices**: Container setup for each service
- [ ] **React Frontend**: Document upload and chat interface
- [ ] **Node.js Backend**: API services and business logic
- [ ] **Langchain Integration**: Document processing and RAG pipeline

#### RAG Functionality
- [ ] **Document Upload**: File upload with validation
- [ ] **Document Vectorization**: Text extraction and embedding generation
- [ ] **Vector Storage**: Database for storing and retrieving embeddings
- [ ] **Query Processing**: User query handling and context retrieval
- [ ] **Response Generation**: LLM integration with citations
- [ ] **Logging System**: Comprehensive RAG process logging

#### User Interface
- [ ] **Upload Interface**: Document upload box with progress indication
- [ ] **Chat Interface**: Query input and response display
- [ ] **Citation Display**: Source references and document highlights

## Technology Stack

### Planned Dependencies
#### Backend Services
- [ ] **Express.js**: Web framework for Node.js backend
- [ ] **Langchain**: Document processing and RAG orchestration
- [ ] **Multer**: File upload handling
- [ ] **Winston**: Logging framework
- [ ] **Cors**: Cross-origin resource sharing
- [ ] **Dotenv**: Environment variable management

#### LLM & Embeddings
- [ ] **Open Router API** OR **Hugging Face Transformers**: LLM integration
- [ ] **@langchain/openai**: OpenAI embeddings integration
- [ ] **@langchain/community**: Additional Langchain tools

#### Vector Database (Choose One)
- [ ] **Pinecone**: Managed vector database service
- [ ] **Chroma**: Open-source vector database
- [ ] **Weaviate**: Vector search engine

#### Frontend
- [ ] **React**: Frontend framework
- [ ] **Axios**: HTTP client for API calls
- [ ] **React-Dropzone**: Drag-and-drop file upload
- [ ] **Material-UI** OR **Tailwind CSS**: UI components and styling

#### DevOps & Tools
- [ ] **Docker**: Containerization
- [ ] **Docker Compose**: Multi-container orchestration
- [ ] **Nodemon**: Development server with hot reload
- [ ] **ESLint**: Code linting
- [ ] **Prettier**: Code formatting

## Project Structure
```
BAH-RAG-Demo/
├── docker-compose.yml
├── .dockerignore
├── .gitignore
├── README.md
├── CLAUDE.md
├── Roadmap.md
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   └── public/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── services/
│   │   ├── routes/
│   │   └── utils/
│   └── uploads/
├── document-processor/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
└── rag-engine/
    ├── Dockerfile
    ├── package.json
    └── src/
```

## API Endpoints (Planned)
### Document Service
- `POST /api/documents/upload` - Upload document for processing
- `GET /api/documents/:id/status` - Check processing status
- `GET /api/documents` - List uploaded documents

### RAG Service
- `POST /api/chat/query` - Submit query for RAG processing
- `GET /api/chat/history` - Retrieve chat history
- `POST /api/chat/feedback` - Submit response feedback

### Health Checks
- `GET /health` - Service health status
- `GET /api/logs` - Retrieve processing logs (development only)

## Development Commands
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [service-name]

# Rebuild and restart
docker-compose down && docker-compose up --build

# Run individual service
npm run dev (in service directory)

# Supabase operations (if used)
npx supabase [command]
```

## Environment Variables Required
```env
# LLM Configuration
OPENROUTER_API_KEY=your_openrouter_key
# OR
HUGGINGFACE_API_KEY=your_hf_key

# Vector Database
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENVIRONMENT=your_pinecone_env
# OR
CHROMA_HOST=localhost
CHROMA_PORT=8000

# Application
NODE_ENV=development
PORT=3000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

## Success Metrics
- [ ] Document successfully uploaded and processed
- [ ] Vector embeddings generated and stored
- [ ] User query returns relevant responses
- [ ] Responses include accurate source citations
- [ ] Complete logging trail visible
- [ ] All services containerized and communicating
- [ ] Frontend renders upload and chat interfaces

## Demo Scenarios
1. **Document Upload Flow**: Upload PDF/text file, show processing logs
2. **Simple Query**: Ask question about uploaded document, show RAG retrieval
3. **Citation Verification**: Demonstrate source attribution and accuracy
4. **Logging Review**: Walk through logs to prove RAG implementation

## Notes for Interview
- Emphasize microservices architecture decisions
- Explain RAG implementation choices
- Discuss scalability considerations
- Highlight logging strategy for transparency
- Be prepared to explain any "vibe coding" decisions
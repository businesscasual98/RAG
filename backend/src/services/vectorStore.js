const { ChromaApi, OpenAIApi } = require('chromadb');
const { OpenAIEmbeddings } = require('@langchain/openai');

const logger = require('../utils/logger');

class VectorStore {
  constructor() {
    this.client = null;
    this.collection = null;
    this.embeddings = null;
    this.collectionName = process.env.CHROMA_COLLECTION || 'documents';
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Initialize Chroma client
      this.client = new ChromaApi({
        path: `http://${process.env.CHROMA_HOST || 'localhost'}:${process.env.CHROMA_PORT || 8000}`
      });

      // Initialize embeddings
      this.embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENROUTER_API_KEY,
        modelName: 'text-embedding-ada-002'
      });

      // Get or create collection
      try {
        this.collection = await this.client.getCollection({
          name: this.collectionName
        });
        logger.info('Connected to existing Chroma collection', { name: this.collectionName });
      } catch (error) {
        // Collection doesn't exist, create it
        this.collection = await this.client.createCollection({
          name: this.collectionName,
          metadata: {
            description: 'RAG document chunks',
            created: new Date().toISOString()
          }
        });
        logger.info('Created new Chroma collection', { name: this.collectionName });
      }

      this.isInitialized = true;
      logger.info('Vector store initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize vector store:', error);
      throw error;
    }
  }

  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  async addDocuments(chunks) {
    try {
      await this.ensureInitialized();

      if (!chunks || chunks.length === 0) {
        throw new Error('No chunks provided to add to vector store');
      }

      logger.info('Adding documents to vector store', { chunkCount: chunks.length });

      // Generate embeddings for all chunks
      const texts = chunks.map(chunk => chunk.content);
      const embeddings = await this.embeddings.embedDocuments(texts);

      // Prepare data for Chroma
      const ids = chunks.map(chunk => chunk.id);
      const metadatas = chunks.map(chunk => ({
        ...chunk.metadata,
        content: chunk.content.substring(0, 1000) // Truncate for metadata storage
      }));
      const documents = texts;

      // Add to collection
      await this.collection.add({
        ids,
        embeddings,
        metadatas,
        documents
      });

      logger.info('Documents added to vector store successfully', {
        chunkCount: chunks.length,
        collection: this.collectionName
      });

      return {
        success: true,
        addedCount: chunks.length,
        chunkIds: ids
      };

    } catch (error) {
      logger.error('Error adding documents to vector store:', error);
      throw error;
    }
  }

  async searchSimilar(query, options = {}) {
    try {
      await this.ensureInitialized();

      const {
        topK = 5,
        threshold = 0.7
      } = options;

      logger.info('Searching for similar documents', { query: query.substring(0, 100), topK });

      // Generate embedding for query
      const queryEmbedding = await this.embeddings.embedQuery(query);

      // Search in collection
      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: topK,
        include: ['documents', 'metadatas', 'distances']
      });

      // Process results
      const documents = [];
      if (results.documents && results.documents[0]) {
        for (let i = 0; i < results.documents[0].length; i++) {
          const distance = results.distances[0][i];
          const similarity = 1 - distance; // Convert distance to similarity

          if (similarity >= threshold) {
            documents.push({
              id: results.ids[0][i],
              content: results.documents[0][i],
              metadata: results.metadatas[0][i],
              similarity,
              distance
            });
          }
        }
      }

      logger.info('Search completed', {
        resultsFound: documents.length,
        topSimilarity: documents.length > 0 ? documents[0].similarity : 0
      });

      return documents;

    } catch (error) {
      logger.error('Error searching vector store:', error);
      throw error;
    }
  }

  async deleteDocument(documentId) {
    try {
      await this.ensureInitialized();

      // Delete all chunks for this document
      await this.collection.delete({
        where: { documentId }
      });

      logger.info('Document deleted from vector store', { documentId });

    } catch (error) {
      logger.error('Error deleting document from vector store:', error);
      throw error;
    }
  }

  async getCollectionInfo() {
    try {
      await this.ensureInitialized();

      const count = await this.collection.count();

      return {
        name: this.collectionName,
        count,
        initialized: this.isInitialized
      };

    } catch (error) {
      logger.error('Error getting collection info:', error);
      throw error;
    }
  }
}

module.exports = VectorStore;
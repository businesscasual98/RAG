const { ChromaClient } = require('chromadb');

const logger = require('../utils/logger');

// Global in-memory store to persist across requests
let globalInMemoryStore = {
  documents: [],
  embeddings: [],
  ids: [],
  initialized: false
};

class VectorStore {
  constructor() {
    this.client = null;
    this.collection = null;
    this.collectionName = process.env.CHROMA_COLLECTION || 'documents';
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // For demo purposes, use a simple in-memory store to avoid ChromaDB complications
      if (!globalInMemoryStore.initialized) {
        logger.info('Initializing simple in-memory vector store for demo');
        globalInMemoryStore.initialized = true;
        logger.info('Vector store initialized successfully (in-memory mode)');
      } else {
        logger.info('Using existing in-memory vector store', { documentsCount: globalInMemoryStore.documents.length });
      }

      this.inMemoryStore = globalInMemoryStore;
      this.isInitialized = true;

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
      const documents = chunks.map(chunk => chunk.content);
      const embeddings = await this.generateEmbeddings(documents);

      // Add to in-memory store
      chunks.forEach((chunk, index) => {
        this.inMemoryStore.documents.push({
          id: chunk.id,
          content: chunk.content,
          metadata: chunk.metadata
        });
        this.inMemoryStore.embeddings.push(embeddings[index]);
        this.inMemoryStore.ids.push(chunk.id);
      });

      logger.info('Documents added to vector store successfully', {
        chunkCount: chunks.length,
        totalDocuments: this.inMemoryStore.documents.length
      });

      return {
        success: true,
        addedCount: chunks.length,
        chunkIds: chunks.map(chunk => chunk.id)
      };

    } catch (error) {
      logger.error('Error adding documents to vector store:', error);
      throw error;
    }
  }

  async generateEmbeddings(texts) {
    try {
      const axios = require('axios');
      const openRouterApiKey = process.env.OPENROUTER_API_KEY;

      if (!openRouterApiKey) {
        // Use simple text-based embeddings as fallback
        return texts.map(text => this.simpleTextEmbedding(text));
      }

      // Use OpenRouter's embedding endpoint if available
      // For demo purposes, we'll use a simple text-based approach
      return texts.map(text => this.simpleTextEmbedding(text));

    } catch (error) {
      logger.warn('Error generating embeddings, falling back to simple method', error);
      return texts.map(text => this.simpleTextEmbedding(text));
    }
  }

  simpleTextEmbedding(text) {
    // Create a simple 384-dimensional embedding based on text characteristics
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0);

    // Use word characteristics to create pseudo-embeddings
    words.forEach((word, index) => {
      const wordHash = this.hashCode(word);
      const baseIndex = Math.abs(wordHash) % 384;

      // Spread influence across multiple dimensions
      for (let i = 0; i < 5; i++) {
        const dim = (baseIndex + i) % 384;
        embedding[dim] += (word.length * 0.1) + (index * 0.01);
      }
    });

    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
  }

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  async searchSimilar(query, options = {}) {
    try {
      await this.ensureInitialized();

      const {
        topK = 5,
        threshold = 0.0  // No threshold - return all documents for demo
      } = options;

      logger.info('Searching for similar documents', { query: query.substring(0, 100), topK });

      if (this.inMemoryStore.documents.length === 0) {
        logger.warn('No documents in vector store');
        return [];
      }

      // Generate query embedding
      const queryEmbedding = (await this.generateEmbeddings([query]))[0];

      // Calculate cosine similarity with all stored embeddings
      const similarities = this.inMemoryStore.embeddings.map((docEmbedding, index) => {
        const similarity = this.cosineSimilarity(queryEmbedding, docEmbedding);
        return {
          index,
          similarity,
          document: this.inMemoryStore.documents[index]
        };
      });

      logger.info('Similarity scores calculated', {
        similarities: similarities.map(s => ({
          similarity: s.similarity,
          content: s.document.content.substring(0, 50) + '...'
        }))
      });

      // Sort by similarity and filter by threshold
      const filteredResults = similarities
        .filter(item => item.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);

      const documents = filteredResults.map(item => ({
        id: item.document.id,
        content: item.document.content,
        metadata: item.document.metadata,
        similarity: item.similarity,
        distance: 1 - item.similarity
      }));

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

  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude > 0 ? dotProduct / magnitude : 0;
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

      const count = this.inMemoryStore.documents.length;

      return {
        name: 'in-memory-store',
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
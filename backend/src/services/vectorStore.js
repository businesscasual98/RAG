const { ChromaClient } = require('chromadb');

const logger = require('../utils/logger');

class VectorStore {
  constructor() {
    this.client = null;
    this.collection = null;
    this.collectionName = process.env.CHROMA_COLLECTION || 'documents';
    this.isInitialized = false;
    this.embeddings = null;
  }

  async initialize() {
    try {
      logger.info('Initializing ChromaDB vector store');

      // Initialize ChromaDB client
      const chromaHost = process.env.CHROMA_HOST || 'localhost';
      const chromaPort = process.env.CHROMA_PORT || '8000';

      this.client = new ChromaClient({
        path: `http://${chromaHost}:${chromaPort}`
      });

      // For now, use simple text embeddings for the demo
      logger.info('Using simple text embeddings for ChromaDB demo');
      this.embeddings = null; // Will use fallback method

      // Get or create collection
      try {
        this.collection = await this.client.getCollection({ name: this.collectionName });
        const count = await this.collection.count();
        logger.info('Connected to existing ChromaDB collection', {
          collection: this.collectionName,
          documentsCount: count
        });
      } catch (error) {
        logger.info('Creating new ChromaDB collection', { collection: this.collectionName });
        this.collection = await this.client.createCollection({
          name: this.collectionName,
          metadata: {
            description: 'RAG document chunks with embeddings',
            created_at: new Date().toISOString()
          }
        });
      }

      this.isInitialized = true;
      logger.info('ChromaDB vector store initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize ChromaDB vector store:', error);
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

      logger.info('Adding documents to ChromaDB', { chunkCount: chunks.length });

      // Generate embeddings for all chunks
      const documents = chunks.map(chunk => chunk.content);
      const embeddings = documents.map(doc => this.simpleTextEmbedding(doc));

      // Prepare data for ChromaDB
      const ids = chunks.map(chunk => chunk.id);
      const metadatas = chunks.map(chunk => ({
        documentId: chunk.metadata.documentId,
        originalName: chunk.metadata.originalName,
        chunkIndex: chunk.metadata.chunkIndex,
        addedAt: new Date().toISOString()
      }));

      // Add to ChromaDB collection
      await this.collection.add({
        ids,
        embeddings,
        documents,
        metadatas
      });

      const totalCount = await this.collection.count();

      logger.info('Documents added to ChromaDB successfully', {
        chunkCount: chunks.length,
        totalDocuments: totalCount
      });

      return {
        success: true,
        addedCount: chunks.length,
        chunkIds: chunks.map(chunk => chunk.id)
      };

    } catch (error) {
      logger.error('Error adding documents to ChromaDB:', error);
      throw error;
    }
  }

  async generateQueryEmbedding(query) {
    try {
      await this.ensureInitialized();
      const embedding = this.simpleTextEmbedding(query);
      return embedding;
    } catch (error) {
      logger.error('Error generating query embedding:', error);
      throw error;
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
        threshold = 0.0,
        maxPerDocument = 3,  // Limit chunks per document for balanced results
        strategy = 'balanced'  // 'balanced' or 'best_match'
      } = options;

      logger.info('Searching ChromaDB for similar documents', {
        query: query.substring(0, 100),
        topK,
        strategy,
        maxPerDocument
      });

      // Check if collection has documents
      const count = await this.collection.count();
      if (count === 0) {
        logger.warn('No documents in ChromaDB collection');
        return [];
      }

      // Generate query embedding
      const queryEmbedding = await this.generateQueryEmbedding(query);

      if (strategy === 'balanced') {
        return await this.balancedSearch(queryEmbedding, topK, threshold, maxPerDocument);
      } else {
        return await this.bestMatchSearch(queryEmbedding, topK, threshold);
      }

    } catch (error) {
      logger.error('Error searching ChromaDB:', error);
      throw error;
    }
  }

  async balancedSearch(queryEmbedding, topK, threshold, maxPerDocument) {
    // For large document collections, limit initial search to prevent performance issues
    const maxInitialResults = Math.min(topK * 4, 30); // Much more conservative limit

    const results = await this.collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: maxInitialResults,
      include: ['documents', 'metadatas', 'distances']
    });

    if (!results.documents[0] || results.documents[0].length === 0) {
      logger.info('No similar documents found');
      return [];
    }

    // Process and group results by document
    const documentGroups = new Map();
    const allResults = [];

    results.documents[0].forEach((content, index) => {
      const distance = results.distances[0][index];
      const similarity = 1 - distance;
      const metadata = results.metadatas[0][index];

      if (similarity < threshold) return;

      const result = {
        id: results.ids[0][index],
        content,
        metadata: {
          documentId: metadata.documentId,
          originalName: metadata.originalName,
          chunkIndex: metadata.chunkIndex
        },
        similarity,
        distance
      };

      allResults.push(result);

      const docId = metadata.documentId;
      if (!documentGroups.has(docId)) {
        documentGroups.set(docId, {
          documentId: docId,
          documentName: metadata.originalName,
          chunks: []
        });
      }
      documentGroups.get(docId).chunks.push(result);
    });

    // Sort chunks within each document by similarity
    documentGroups.forEach(group => {
      group.chunks.sort((a, b) => b.similarity - a.similarity);
    });

    // Balanced selection: take top chunks from each document
    const balancedResults = [];
    const documentKeys = Array.from(documentGroups.keys());

    logger.info('Balanced search document distribution', {
      totalDocuments: documentKeys.length,
      documentsFound: documentKeys.map(docId => ({
        documentId: docId,
        documentName: documentGroups.get(docId).documentName,
        chunksFound: documentGroups.get(docId).chunks.length
      }))
    });

    // Round-robin selection with limits per document
    let roundRobinIndex = 0;
    const documentChunkCounts = new Map();

    // Initialize counters
    documentKeys.forEach(docId => documentChunkCounts.set(docId, 0));

    // First pass: ensure each document gets at least one chunk if available
    documentKeys.forEach(docId => {
      const group = documentGroups.get(docId);
      if (group.chunks.length > 0 && balancedResults.length < topK) {
        balancedResults.push(group.chunks[0]);
        documentChunkCounts.set(docId, 1);
      }
    });

    // Second pass: fill remaining slots with round-robin, respecting maxPerDocument
    while (balancedResults.length < topK) {
      let addedThisRound = false;

      for (const docId of documentKeys) {
        if (balancedResults.length >= topK) break;

        const group = documentGroups.get(docId);
        const currentCount = documentChunkCounts.get(docId);

        if (currentCount < maxPerDocument && currentCount < group.chunks.length) {
          balancedResults.push(group.chunks[currentCount]);
          documentChunkCounts.set(docId, currentCount + 1);
          addedThisRound = true;
        }
      }

      // If no documents had available chunks this round, break
      if (!addedThisRound) break;
    }

    // Sort final results by similarity while maintaining some document diversity
    const finalResults = balancedResults.sort((a, b) => b.similarity - a.similarity);

    logger.info('Balanced ChromaDB search completed', {
      resultsFound: finalResults.length,
      documentsRepresented: new Set(finalResults.map(r => r.metadata.documentId)).size,
      topSimilarity: finalResults.length > 0 ? finalResults[0].similarity : 0,
      distributionByDoc: Array.from(documentChunkCounts.entries()).map(([docId, count]) => ({
        documentName: documentGroups.get(docId).documentName,
        chunksIncluded: count
      }))
    });

    return finalResults;
  }

  async bestMatchSearch(queryEmbedding, topK, threshold) {
    // Original search behavior for when balanced results aren't needed
    const results = await this.collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      include: ['documents', 'metadatas', 'distances']
    });

    if (!results.documents[0] || results.documents[0].length === 0) {
      logger.info('No similar documents found');
      return [];
    }

    const documents = results.documents[0].map((content, index) => {
      const distance = results.distances[0][index];
      const similarity = 1 - distance;
      const metadata = results.metadatas[0][index];

      return {
        id: results.ids[0][index],
        content,
        metadata: {
          documentId: metadata.documentId,
          originalName: metadata.originalName,
          chunkIndex: metadata.chunkIndex
        },
        similarity,
        distance
      };
    })
    .filter(doc => doc.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity);

    logger.info('Best match ChromaDB search completed', {
      resultsFound: documents.length,
      topSimilarity: documents.length > 0 ? documents[0].similarity : 0
    });

    return documents;
  }


  async deleteDocument(documentId) {
    try {
      await this.ensureInitialized();

      // Delete all chunks for this document from ChromaDB
      await this.collection.delete({
        where: { documentId }
      });

      logger.info('Document deleted from ChromaDB', { documentId });

    } catch (error) {
      logger.error('Error deleting document from ChromaDB:', error);
      throw error;
    }
  }

  async getCollectionInfo() {
    try {
      await this.ensureInitialized();

      const count = await this.collection.count();
      const collectionData = await this.collection.get({ limit: 1 });

      return {
        name: this.collectionName,
        count,
        initialized: this.isInitialized,
        hasDocuments: count > 0,
        sampleDocument: collectionData.documents.length > 0 ? {
          id: collectionData.ids[0],
          metadata: collectionData.metadatas[0]
        } : null
      };

    } catch (error) {
      logger.error('Error getting ChromaDB collection info:', error);
      throw error;
    }
  }

  async getAllDocuments() {
    try {
      await this.ensureInitialized();

      const count = await this.collection.count();
      if (count === 0) {
        return [];
      }

      // Get all documents from ChromaDB
      const results = await this.collection.get({
        include: ['documents', 'metadatas']
      });

      // Group chunks by document ID
      const documentMap = new Map();

      results.ids.forEach((id, index) => {
        const metadata = results.metadatas[index];
        const documentId = metadata.documentId;

        if (!documentMap.has(documentId)) {
          documentMap.set(documentId, {
            documentId,
            originalName: metadata.originalName,
            chunks: [],
            chunkCount: 0
          });
        }

        documentMap.get(documentId).chunks.push({
          id,
          content: results.documents[index],
          chunkIndex: metadata.chunkIndex
        });
        documentMap.get(documentId).chunkCount++;
      });

      return Array.from(documentMap.values());

    } catch (error) {
      logger.error('Error getting all documents from ChromaDB:', error);
      throw error;
    }
  }
}

module.exports = VectorStore;
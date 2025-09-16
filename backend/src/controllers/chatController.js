const RAGService = require('../services/ragService');
const DocumentProcessor = require('../services/documentProcessor');
const VectorStore = require('../services/vectorStore');
const { documents } = require('./documentController');
const logger = require('../utils/logger');

class ChatController {
  constructor() {
    this.ragService = new RAGService();
    this.documentProcessor = new DocumentProcessor();
    this.vectorStore = new VectorStore();
  }

  async processQuery(req, res, next) {
    try {
      const { query, options = {} } = req.body;

      if (!query || query.trim().length === 0) {
        return res.status(400).json({
          error: 'Invalid query',
          message: 'Query parameter is required and cannot be empty'
        });
      }

      logger.info('Received chat query', { query: query.substring(0, 100) });

      // Check if we have any processed documents
      const vectorInfo = await this.ragService.getVectorStoreInfo();
      if (vectorInfo.count === 0) {
        return res.status(400).json({
          error: 'No documents available',
          message: 'Please upload and process documents before asking questions'
        });
      }

      // Process the query using RAG
      const result = await this.ragService.processQuery(query, options);

      res.json({
        query,
        ...result,
        metadata: {
          documentsInIndex: vectorInfo.count,
          processingTime: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Error processing chat query:', error);
      next(error);
    }
  }

  async processDocument(req, res, next) {
    try {
      const { documentId } = req.body;

      if (!documentId) {
        return res.status(400).json({
          error: 'Document ID required',
          message: 'Please provide a valid document ID'
        });
      }

      const document = documents.get(documentId);
      if (!document) {
        return res.status(404).json({
          error: 'Document not found',
          message: `Document with ID ${documentId} not found`
        });
      }

      if (document.vectorized) {
        return res.status(400).json({
          error: 'Document already processed',
          message: 'This document has already been processed and vectorized'
        });
      }

      logger.info('Starting document processing for vectorization', { documentId });

      // Update status to processing
      document.status = 'processing';
      document.processingStage = 'text_extracted';
      documents.set(documentId, document);

      // Process the document
      const processedDoc = await this.documentProcessor.processDocument(document);

      // Update status after chunking
      document.processingStage = 'chunked';
      document.chunkCount = processedDoc.chunks.length;
      document.textLength = processedDoc.text.length;
      documents.set(documentId, document);

      // Update status during vectorization
      document.processingStage = 'vectorizing';
      documents.set(documentId, document);

      // Add to vector store
      const vectorResult = await this.vectorStore.addDocuments(processedDoc.chunks);

      // Update document metadata
      document.status = 'processed';
      document.processingStage = 'completed';
      document.processedAt = new Date().toISOString();
      document.chunks = processedDoc.chunks.map(chunk => chunk.id);
      document.vectorized = true;
      documents.set(documentId, document);

      logger.info('Document processed and vectorized successfully', {
        documentId,
        chunkCount: processedDoc.chunks.length,
        vectorized: vectorResult.success
      });

      res.json({
        message: 'Document processed successfully',
        document: {
          id: documentId,
          status: document.status,
          processingStage: document.processingStage,
          processedAt: document.processedAt,
          chunkCount: document.chunkCount,
          textLength: document.textLength,
          vectorized: document.vectorized
        }
      });

    } catch (error) {
      // Update document status to show error
      if (documentId) {
        const document = documents.get(documentId);
        if (document) {
          document.status = 'error';
          document.processingStage = 'failed';
          document.error = error.message;
          documents.set(documentId, document);
        }
      }

      logger.error('Error processing document:', error);
      next(error);
    }
  }

  async getChatHistory(req, res, next) {
    try {
      // For demo purposes, return empty history
      // In production, this would retrieve from a database
      res.json({
        history: [],
        message: 'Chat history not implemented in demo version'
      });
    } catch (error) {
      logger.error('Error retrieving chat history:', error);
      next(error);
    }
  }
}

module.exports = new ChatController();
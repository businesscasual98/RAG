const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { v4: uuidv4 } = require('uuid');

const logger = require('../utils/logger');

class DocumentProcessor {
  constructor() {
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', ' ', '']
    });
  }

  async extractText(filePath, mimeType) {
    try {
      const buffer = await fs.readFile(filePath);

      switch (mimeType) {
        case 'application/pdf':
          return await this.extractFromPDF(buffer);

        case 'text/plain':
          return buffer.toString('utf-8');

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          return await this.extractFromWord(buffer);

        default:
          throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      logger.error('Error extracting text from document:', error);
      throw error;
    }
  }

  async extractFromPDF(buffer) {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      logger.error('Error parsing PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  async extractFromWord(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      logger.error('Error parsing Word document:', error);
      throw new Error('Failed to extract text from Word document');
    }
  }

  async chunkText(text, metadata = {}) {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error('No text content to chunk');
      }

      const chunks = await this.textSplitter.splitText(text);

      return chunks.map((chunk, index) => ({
        id: uuidv4(),
        content: chunk.trim(),
        metadata: {
          ...metadata,
          chunkIndex: index,
          chunkCount: chunks.length,
          length: chunk.length,
          createdAt: new Date().toISOString()
        }
      })).filter(chunk => chunk.content.length > 0);

    } catch (error) {
      logger.error('Error chunking text:', error);
      throw error;
    }
  }

  async processDocument(documentMetadata) {
    try {
      logger.info('Starting document processing', {
        documentId: documentMetadata.id,
        filename: documentMetadata.originalName
      });

      // Extract text from document
      const text = await this.extractText(documentMetadata.path, documentMetadata.mimeType);

      if (!text || text.trim().length === 0) {
        throw new Error('No text content extracted from document');
      }

      logger.info('Text extracted successfully', {
        documentId: documentMetadata.id,
        textLength: text.length
      });

      // Create chunks
      const chunks = await this.chunkText(text, {
        documentId: documentMetadata.id,
        originalName: documentMetadata.originalName,
        mimeType: documentMetadata.mimeType
      });

      logger.info('Document chunked successfully', {
        documentId: documentMetadata.id,
        chunkCount: chunks.length
      });

      return {
        text,
        chunks,
        metadata: {
          ...documentMetadata,
          textLength: text.length,
          chunkCount: chunks.length,
          processedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      logger.error('Error processing document:', {
        documentId: documentMetadata.id,
        error: error.message
      });
      throw error;
    }
  }

  async cleanupTempFiles(filePath) {
    try {
      await fs.unlink(filePath);
      logger.info('Temporary file cleaned up', { filePath });
    } catch (error) {
      logger.warn('Failed to cleanup temporary file', { filePath, error: error.message });
    }
  }
}

module.exports = DocumentProcessor;
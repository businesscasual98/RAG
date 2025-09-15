const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const logger = require('../utils/logger');
const { validateFile } = require('../utils/fileValidator');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      logger.error('Failed to create upload directory:', error);
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const filename = `${uuidv4()}${fileExtension}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const validation = validateFile(file);
    if (validation.isValid) {
      cb(null, true);
    } else {
      cb(new Error(validation.errors.join('; ')));
    }
  }
});

// In-memory storage for document metadata (replace with database in production)
const documents = new Map();

const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please select a file to upload'
      });
    }

    const documentId = uuidv4();
    const documentMetadata = {
      id: documentId,
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: new Date().toISOString(),
      status: 'uploaded',
      processedAt: null,
      chunks: [],
      vectorized: false
    };

    documents.set(documentId, documentMetadata);

    logger.info('Document uploaded successfully', {
      documentId,
      originalName: req.file.originalname,
      size: req.file.size
    });

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        id: documentId,
        originalName: documentMetadata.originalName,
        size: documentMetadata.size,
        uploadedAt: documentMetadata.uploadedAt,
        status: documentMetadata.status
      }
    });

  } catch (error) {
    logger.error('Error uploading document:', error);
    next(error);
  }
};

const getDocuments = async (req, res, next) => {
  try {
    const documentList = Array.from(documents.values()).map(doc => ({
      id: doc.id,
      originalName: doc.originalName,
      size: doc.size,
      uploadedAt: doc.uploadedAt,
      status: doc.status,
      vectorized: doc.vectorized,
      chunks: doc.chunks.length
    }));

    res.json({
      documents: documentList,
      total: documentList.length
    });

  } catch (error) {
    logger.error('Error retrieving documents:', error);
    next(error);
  }
};

const getDocumentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = documents.get(id);

    if (!document) {
      return res.status(404).json({
        error: 'Document not found',
        message: `Document with ID ${id} does not exist`
      });
    }

    res.json({
      id: document.id,
      originalName: document.originalName,
      status: document.status,
      uploadedAt: document.uploadedAt,
      processedAt: document.processedAt,
      vectorized: document.vectorized,
      chunks: document.chunks.length
    });

  } catch (error) {
    logger.error('Error getting document status:', error);
    next(error);
  }
};

module.exports = {
  upload,
  uploadDocument,
  getDocuments,
  getDocumentStatus,
  documents // Export for use in other modules
};
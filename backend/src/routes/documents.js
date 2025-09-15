const express = require('express');
const { upload, uploadDocument, getDocuments, getDocumentStatus } = require('../controllers/documentController');

const router = express.Router();

// POST /api/documents/upload - Upload a document
router.post('/upload', upload.single('document'), uploadDocument);

// GET /api/documents - Get all documents
router.get('/', getDocuments);

// GET /api/documents/:id/status - Get document status
router.get('/:id/status', getDocumentStatus);

module.exports = router;
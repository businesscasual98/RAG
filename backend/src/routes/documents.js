const express = require('express');
const { upload, uploadDocument, getDocuments, getDocumentStatus, deleteDocument } = require('../controllers/documentController');

const router = express.Router();

// POST /api/documents/upload - Upload a document
router.post('/upload', upload.single('document'), uploadDocument);

// GET /api/documents - Get all documents
router.get('/', getDocuments);

// DELETE /api/documents/:id - Delete a document
router.delete('/:id', deleteDocument);

// GET /api/documents/:id/status - Get document status
router.get('/:id/status', getDocumentStatus);

module.exports = router;
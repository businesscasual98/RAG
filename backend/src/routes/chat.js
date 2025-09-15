const express = require('express');
const chatController = require('../controllers/chatController');

const router = express.Router();

// POST /api/chat/query - Process a query using RAG
router.post('/query', chatController.processQuery.bind(chatController));

// POST /api/chat/process - Process a document for vectorization
router.post('/process', chatController.processDocument.bind(chatController));

// GET /api/chat/history - Get chat history (placeholder)
router.get('/history', chatController.getChatHistory.bind(chatController));

module.exports = router;
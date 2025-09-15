const express = require('express');
const logger = require('../utils/logger');

const router = express.Router();

// In-memory log storage for demo purposes
let logEntries = [];

// Override console methods to capture logs
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

const captureLog = (level, ...args) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message: args.join(' '),
    id: Date.now().toString()
  };

  logEntries.push(entry);

  // Keep only last 100 entries for demo
  if (logEntries.length > 100) {
    logEntries = logEntries.slice(-100);
  }
};

// Override console methods (for demo purposes only)
console.log = (...args) => {
  captureLog('info', ...args);
  originalConsoleLog(...args);
};

console.error = (...args) => {
  captureLog('error', ...args);
  originalConsoleError(...args);
};

console.warn = (...args) => {
  captureLog('warn', ...args);
  originalConsoleWarn(...args);
};

// GET /api/logs - Get recent log entries (development only)
router.get('/', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      error: 'Logs endpoint disabled in production',
      message: 'Log access is only available in development mode'
    });
  }

  const { level, limit = 50 } = req.query;

  let filteredLogs = [...logEntries];

  if (level) {
    filteredLogs = filteredLogs.filter(log => log.level === level);
  }

  // Sort by timestamp (newest first) and limit
  filteredLogs = filteredLogs
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, parseInt(limit));

  res.json({
    logs: filteredLogs,
    total: logEntries.length,
    filtered: filteredLogs.length,
    availableLevels: ['info', 'warn', 'error']
  });
});

// POST /api/logs/clear - Clear log entries (development only)
router.post('/clear', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      error: 'Log clearing disabled in production',
      message: 'Log clearing is only available in development mode'
    });
  }

  const clearedCount = logEntries.length;
  logEntries = [];

  logger.info('Log entries cleared', { clearedCount });

  res.json({
    message: 'Log entries cleared successfully',
    clearedCount
  });
});

module.exports = router;
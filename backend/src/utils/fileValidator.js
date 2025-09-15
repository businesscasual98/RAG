const path = require('path');

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword'
];

const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.docx', '.doc'];

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10485760; // 10MB default

const validateFile = (file) => {
  const errors = [];

  if (!file) {
    errors.push('No file provided');
    return { isValid: false, errors };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds maximum allowed size (${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(2)}MB)`);
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    errors.push(`File type '${file.mimetype}' is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }

  // Check file extension
  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
    errors.push(`File extension '${fileExtension}' is not allowed. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`);
  }

  // Check filename
  if (!file.originalname || file.originalname.trim() === '') {
    errors.push('Invalid filename');
  }

  return {
    isValid: errors.length === 0,
    errors,
    fileInfo: {
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      extension: fileExtension
    }
  };
};

module.exports = {
  validateFile,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE
};
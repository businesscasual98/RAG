import React, { useState, useCallback } from 'react';
import { uploadDocument } from '../services/api';
import { Document, UploadResponse } from '../types';
import './DocumentUpload.css';

interface DocumentUploadProps {
  onUploadSuccess: (document: Document) => void;
  onUploadError: (error: string) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUploadSuccess, onUploadError }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
  ];

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload PDF, DOC, DOCX, or TXT files.';
    }

    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 10MB limit.';
    }

    return null;
  };

  const handleFileUpload = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      onUploadError(validationError);
      return;
    }

    setIsUploading(true);

    try {
      const response: UploadResponse = await uploadDocument(file);

      if (response.success && response.document) {
        onUploadSuccess(response.document);
      } else {
        onUploadError(response.error || 'Upload failed');
      }
    } catch (error: any) {
      onUploadError(error.response?.data?.error || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [onUploadSuccess, onUploadError]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="document-upload">
      <div
        className={`upload-zone ${dragActive ? 'drag-active' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="upload-loading">
            <div className="spinner"></div>
            <p>Uploading and processing document...</p>
          </div>
        ) : (
          <>
            <div className="upload-icon">📄</div>
            <p className="upload-text">
              Drag & drop your document here, or{' '}
              <label className="upload-link">
                browse files
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleInputChange}
                  disabled={isUploading}
                  style={{ display: 'none' }}
                />
              </label>
            </p>
            <p className="upload-hint">
              Supported formats: PDF, DOC, DOCX, TXT (max 10MB)
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentUpload;
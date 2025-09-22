import React, { useState, useEffect } from 'react';
import { getDocuments, deleteDocument, processDocument } from '../services/api';
import { Document } from '../types';
import './DocumentList.css';

interface DocumentListProps {
  onError: (error: string) => void;
  refreshTrigger: number;
}

const DocumentList: React.FC<DocumentListProps> = ({ onError, refreshTrigger }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (error: any) {
      onError(error.response?.data?.error || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleProcess = async (documentId: string) => {
    try {
      setProcessingIds(prev => new Set(prev).add(documentId));
      await processDocument(documentId);

      // Reload documents to show updated status
      await loadDocuments();
    } catch (error: any) {
      onError(error.response?.data?.error || 'Failed to process document');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await deleteDocument(documentId);
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    } catch (error: any) {
      onError(error.response?.data?.error || 'Failed to delete document');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (type: string): string => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('text')) return '📃';
    return '📎';
  };

  const getStatusIcon = (status?: string, vectorized?: boolean): string => {
    if (status === 'error') return '❌';
    if (vectorized) return '✅';
    if (status === 'processing') return '⚡';
    if (status === 'uploaded') return '⏳';
    return '📁';
  };

  const getStatusColor = (status?: string, vectorized?: boolean): string => {
    if (status === 'error') return 'status-error';
    if (vectorized) return 'status-ready';
    if (status === 'processing') return 'status-processing';
    return 'status-uploaded';
  };

  if (loading) {
    return (
      <div className="document-list">
        <h3>📚 Uploaded Documents</h3>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="document-list">
      <h3>📚 Uploaded Documents ({documents.length})</h3>

      {documents.length === 0 ? (
        <div className="empty-documents">
          <div className="empty-icon">📭</div>
          <p>No documents uploaded yet</p>
          <p className="empty-hint">Upload documents to start asking questions!</p>
        </div>
      ) : (
        <div className="documents-grid">
          {documents.map((doc) => (
            <div key={doc.id} className="document-card">
              <div className="document-header">
                <div className="document-icon">
                  {getFileIcon(doc.type)}
                </div>
                <div className="document-actions">
                  {!doc.vectorized && doc.status !== 'processing' && (
                    <button
                      className="process-button"
                      onClick={() => handleProcess(doc.id)}
                      disabled={processingIds.has(doc.id)}
                      title="Process document for search"
                    >
                      {processingIds.has(doc.id) ? '⏳' : '⚡'}
                    </button>
                  )}
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(doc.id)}
                    title="Delete document"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="document-info">
                <h4 className="document-name" title={doc.filename}>
                  {doc.filename}
                </h4>

                <div className={`document-status ${getStatusColor(doc.status, doc.vectorized)}`}>
                  <span className="status-icon">{getStatusIcon(doc.status, doc.vectorized)}</span>
                  <span className="status-text">
                    {doc.statusDescription || doc.status || 'Unknown'}
                  </span>
                </div>

                {doc.vectorized && (
                  <div className="document-processing-info">
                    {doc.chunkCount !== undefined && (
                      <span className="processing-stat">
                        📊 {doc.chunkCount} chunks
                      </span>
                    )}
                    {doc.textLength !== undefined && doc.textLength > 0 && (
                      <span className="processing-stat">
                        📝 {doc.textLength.toLocaleString()} chars
                      </span>
                    )}
                  </div>
                )}

                <div className="document-meta">
                  <span className="document-size">
                    {formatFileSize(doc.size)}
                  </span>
                  <span className="document-date">
                    {formatDate(doc.uploadDate)}
                  </span>
                </div>

                {doc.error && (
                  <div className="document-error">
                    ⚠️ {doc.error}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentList;
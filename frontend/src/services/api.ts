import axios, { AxiosResponse } from 'axios';
import { UploadResponse, ChatResponse, Document } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const uploadDocument = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('document', file);

  const response: AxiosResponse<any> = await apiClient.post(
    '/api/documents/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  // Map backend response to frontend UploadResponse type
  const { message, document: doc, error } = response.data;
  return {
    success: !error,
    message,
    error,
    document: doc ? {
      id: doc.id,
      filename: doc.originalName,
      uploadDate: doc.uploadedAt,
      size: doc.size,
      type: file.type || 'application/octet-stream'
    } : undefined
  };
};

export const sendChatMessage = async (message: string): Promise<ChatResponse> => {
  const response: AxiosResponse<ChatResponse> = await apiClient.post('/api/chat/query', {
    query: message,
  });

  return response.data;
};

export const getDocuments = async (): Promise<Document[]> => {
  const response: AxiosResponse<{ documents: any[] }> = await apiClient.get('/api/documents');

  // Map backend response to frontend Document type
  return response.data.documents.map(doc => ({
    id: doc.id,
    filename: doc.originalName,
    uploadDate: doc.uploadedAt,
    size: doc.size,
    type: doc.mimeType || 'application/octet-stream',
    status: doc.status,
    processingStage: doc.processingStage,
    statusDescription: doc.statusDescription,
    vectorized: doc.vectorized,
    chunkCount: doc.chunkCount,
    textLength: doc.textLength,
    processedAt: doc.processedAt,
    error: doc.error
  }));
};

export const deleteDocument = async (documentId: string): Promise<void> => {
  await apiClient.delete(`/api/documents/${documentId}`);
};

export const healthCheck = async (): Promise<boolean> => {
  try {
    await apiClient.get('/health');
    return true;
  } catch {
    return false;
  }
};
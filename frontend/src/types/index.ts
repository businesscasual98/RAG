export interface Document {
  id: string;
  filename: string;
  uploadDate: string;
  size: number;
  type: string;
  status?: string;
  processingStage?: string;
  statusDescription?: string;
  vectorized?: boolean;
  chunkCount?: number;
  textLength?: number;
  processedAt?: string;
  error?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: string;
  sources?: DocumentSource[];
}

export interface DocumentSource {
  sourceNumber: number;
  documentId: string;
  documentName: string;
  chunkId: string;
  chunkIndex: number;
  similarity: number;
  content: string;
  implicit?: boolean;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  document?: Document;
  error?: string;
}

export interface ChatResponse {
  query: string;
  answer: string;
  sources: DocumentSource[];
  context: any[];
  confidence: number;
  queryProcessedAt: string;
  metadata?: any;
  error?: string;
}

export interface ApiError {
  message: string;
  status: number;
  details?: any;
}
import React, { useState } from 'react';
import DocumentUpload from './components/DocumentUpload';
import DocumentList from './components/DocumentList';
import ChatInterface from './components/ChatInterface';
import ErrorNotification from './components/ErrorNotification';
import { Document } from './types';
import './App.css';

function App() {
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = (document: Document) => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="container">
          <h1>🚀 Enterprise RAG Demo</h1>
          <p>Upload documents and ask intelligent questions powered by AI</p>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          <div className="app-grid">
            <div className="sidebar">
              <DocumentUpload
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleError}
              />
              <DocumentList
                onError={handleError}
                refreshTrigger={refreshTrigger}
              />
            </div>

            <div className="main-content">
              <ChatInterface onError={handleError} />
            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <div className="container">
          <p>
            Built with React, TypeScript, LangChain, and enterprise-grade architecture
          </p>
        </div>
      </footer>

      {error && (
        <ErrorNotification
          message={error}
          onClose={clearError}
        />
      )}
    </div>
  );
}

export default App;

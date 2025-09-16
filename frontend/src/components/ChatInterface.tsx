import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/api';
import { ChatMessage, ChatResponse } from '../types';
import './ChatInterface.css';

interface ChatInterfaceProps {
  onError: (error: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onError }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: input.trim(),
      type: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response: ChatResponse = await sendChatMessage(input.trim());

      if (response.error) {
        onError(response.error);
        return;
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response.answer,
        type: 'assistant',
        timestamp: new Date().toISOString(),
        sources: response.sources,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      onError(error.response?.data?.error || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h2>🤖 RAG Assistant</h2>
        <p>Ask questions about your uploaded documents</p>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <p>Start a conversation by asking a question about your documents!</p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-content">
              <div className="message-text">{message.content}</div>
              {message.sources && message.sources.length > 0 && (
                <div className="message-sources">
                  <h4>Sources:</h4>
                  {message.sources.map((source, index) => (
                    <div key={index} className="source-item">
                      <div className="source-header">
                        <span className="source-filename">{source.documentName}</span>
                        <span className="source-page">Chunk {source.chunkIndex + 1}</span>
                        <span className="source-confidence">
                          {Math.round(source.similarity * 100)}% relevance
                        </span>
                      </div>
                      <div className="source-excerpt">"{source.content}"</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="message-timestamp">
              {formatTimestamp(message.timestamp)}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message assistant loading">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <div className="chat-input-container">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your documents..."
            disabled={isLoading}
            className="chat-input"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="chat-send-button"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
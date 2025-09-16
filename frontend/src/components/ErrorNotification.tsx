import React, { useEffect } from 'react';
import './ErrorNotification.css';

interface ErrorNotificationProps {
  message: string;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  message,
  onClose,
  autoClose = true,
  duration = 5000
}) => {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  return (
    <div className="error-notification">
      <div className="error-content">
        <span className="error-icon">⚠️</span>
        <span className="error-message">{message}</span>
        <button className="error-close" onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  );
};

export default ErrorNotification;
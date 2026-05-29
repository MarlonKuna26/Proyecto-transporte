import React, { useEffect } from 'react';

export interface ToastMessage {
  id: string;
  msg: string;
  type: 'success' | 'error';
  duration?: number;
}

interface ToastProps {
  message: ToastMessage;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    const duration = message.duration || 3000;
    const timer = setTimeout(() => {
      onClose(message.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [message, onClose]);

  const isError = message.type === 'error';

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 text-sm rounded-xl border animate-fade-in transition-all duration-300 shadow-lg ${
        isError
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-green-200 bg-green-50 text-green-700'
      }`}
      style={{ maxWidth: '400px' }}
    >
      {isError ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      <span className="font-semibold">{message.msg}</span>
      <button
        onClick={() => onClose(message.id)}
        className="ml-auto flex-shrink-0 hover:opacity-70 transition-opacity"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
};

interface ToastContainerProps {
  messages: ToastMessage[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ messages, onClose }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
      {messages.map(message => (
        <Toast key={message.id} message={message} onClose={onClose} />
      ))}
    </div>
  );
};

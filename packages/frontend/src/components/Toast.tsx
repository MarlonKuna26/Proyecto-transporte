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
      className={`flex items-center gap-3 px-5 py-4 text-sm rounded-2xl border animate-fade-in transition-all duration-300 shadow-2xl ${
        isError
          ? 'border-red-500/50 bg-zinc-900 text-white'
          : 'border-emerald-500/50 bg-zinc-900 text-white'
      }`}
      style={{ maxWidth: '400px' }}
    >
      {isError ? (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
      ) : (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
      <span className="font-bold tracking-tight">{message.msg}</span>
      <button
        onClick={() => onClose(message.id)}
        className="ml-auto flex-shrink-0 w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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

import React from 'react';
import { useApp } from '../../store/AppContext.tsx';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <div style={{ flex: 1 }}>{t.text}</div>
          <button
            type="button"
            onClick={() => removeToast(t.id)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: '14px',
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

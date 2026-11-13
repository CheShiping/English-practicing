'use client';

import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useApp } from '@/state/AppProvider';

export default function ToastStack() {
  const { toasts, dismissToast } = useApp();
  if (!toasts.length) return null;
  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}${t.closing ? ' closing' : ''}`}>
          <span className="toast-icon">
            {t.kind === 'success' ? (
              <CheckCircle2 size={16} />
            ) : t.kind === 'error' ? (
              <AlertCircle size={16} />
            ) : (
              <Info size={16} />
            )}
          </span>
          <span>{t.message}</span>
          <button onClick={() => dismissToast(t.id)} aria-label="关闭提示">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

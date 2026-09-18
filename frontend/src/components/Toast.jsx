import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 3000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-in max-w-sm">
      <div className={`p-4 rounded-2xl glass-panel border flex items-center gap-3 shadow-[0_10px_35px_rgba(0,0,0,0.6)] ${
        isSuccess ? 'border-teal-500/40 text-teal-200' : isError ? 'border-rose-500/40 text-rose-200' : 'border-white/15 text-slate-200'
      }`}>
        <div className={`p-2 rounded-xl shrink-0 ${
          isSuccess ? 'bg-teal-500/20 text-teal-300' : isError ? 'bg-rose-500/20 text-rose-300' : 'bg-surface-800 text-brand-400'
        }`}>
          {isSuccess ? <CheckCircle2 className="w-4 h-4" /> : isError ? <AlertCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
        </div>
        <div className="text-xs">
          <h4 className="font-bold text-white">{toast.title}</h4>
          {toast.message && <p className="text-slate-400 mt-0.5">{toast.message}</p>}
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-white ml-auto">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

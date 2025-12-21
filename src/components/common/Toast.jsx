import React, { useEffect } from 'react';

export default function Toast({ open, message, duration = 1600, onClose }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  if (!open) return null;

  return (
    <div className='fixed top-6 left-1/2 z-[99999] -translate-x-1/2'>
      <div
        className='rounded-2xl border border-slate-200 bg-white/95 px-4 py-2 text-[13px] font-semibold text-slate-800 shadow-[0_10px_30px_rgba(15,23,42,0.18)] backdrop-blur'
        role='status'
        aria-live='polite'
      >
        {message}
      </div>
    </div>
  );
}

import React from 'react';

export default function FilterChip({ label, active, onClick }) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`rounded-xl border px-4 py-2 text-[13px] font-medium whitespace-nowrap transition-all ${
        active
          ? 'border-sky-500 bg-sky-50 text-sky-700'
          : 'border-slate-300 bg-white text-slate-700 hover:border-sky-400 hover:text-sky-700'
      }`}
    >
      {label}
    </button>
  );
}

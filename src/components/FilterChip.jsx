import React from 'react';

export default function FilterChip({
  label,
  subLabel,
  active,
  applied,
  onClick,
}) {
  const isOn = Boolean(active || applied);
  const hasSub = Boolean(subLabel);

  return (
    <button
      type='button'
      onClick={onClick}
      className={[
        'h-[46px] w-[92px] rounded-xl border px-2 transition-all',
        'flex flex-col items-center text-center',
        hasSub ? 'justify-center' : 'justify-center',
        isOn
          ? 'border-sky-500 bg-sky-50 text-sky-700'
          : 'border-slate-300 bg-white text-slate-700 hover:border-sky-400 hover:text-sky-700',
      ].join(' ')}
    >
      {hasSub ? (
        <>
          <div className='text-[13px] leading-[14px] font-semibold'>
            {label}
          </div>
          <div className='mt-0.5 text-[10px] leading-[11px] font-medium text-slate-500'>
            <span className='block truncate'>{subLabel}</span>
          </div>
        </>
      ) : (
        <div className='text-[13px] leading-none font-semibold'>{label}</div>
      )}
    </button>
  );
}

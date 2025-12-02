import React from 'react';

export default function RegionGrid({ items, selected, onSelect }) {
  return (
    <div className='mt-3 grid grid-cols-3 gap-2'>
      {items.map((name) => {
        const isActive = selected === name;
        const [firstLine, ...rest] = name.split(' ');
        const secondLine = rest.join(' ');

        return (
          <button
            key={name}
            type='button'
            onClick={() => onSelect(name)}
            className={`/* 👈 고정 높이 */ /* 👈 column full width */ flex grid h-[68px] w-full flex-col items-center justify-center rounded-xl border px-3 py-2.5 text-center text-[13px] leading-snug transition-all ${
              isActive
                ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-sm'
                : 'border-slate-200 bg-white/90 text-slate-800 hover:border-sky-300 hover:bg-sky-50/70'
            } `}
          >
            {secondLine ? (
              <>
                <span className='block'>{firstLine}</span>
                <span className='block'>{secondLine}</span>
              </>
            ) : (
              <span className='block'>{firstLine}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// src/components/map/LegendBox.jsx
import React from 'react';

function LegendBox() {
  return (
    <div className='absolute right-4 bottom-4 z-50 flex flex-col gap-1.5 rounded-2xl border border-slate-100 bg-white/90 px-3 py-2.5 text-[11px] text-slate-600 shadow-sm backdrop-blur'>
      <div className='mb-0.5 text-xs font-semibold'>가격 변화 색상 안내</div>

      <div className='flex items-center gap-2'>
        <span className='mr-1 inline-flex h-3 w-3 rounded-full bg-rose-500' />
        <span>하락 (최근 3개월 기준)</span>
      </div>

      <div className='flex items-center gap-2'>
        <span className='mr-1 inline-flex h-3 w-3 rounded-full bg-amber-400' />
        <span>보합 · 변동 없음</span>
      </div>

      <div className='flex items-center gap-2'>
        <span className='mr-1 inline-flex h-3 w-3 rounded-full bg-sky-600' />
        <span>상승</span>
      </div>
    </div>
  );
}

export default React.memo(LegendBox);

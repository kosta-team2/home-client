import React, { useEffect, useMemo, useRef, useState } from 'react';

import { FILTER_DEFAULTS } from '../../store/uiSlice';

export default function FilterRangePanel({ filterKey, value, onCommit }) {
  const [dMin, dMax] = FILTER_DEFAULTS[filterKey];

  const [min, setMin] = useState(value?.[0] ?? dMin);
  const [max, setMax] = useState(value?.[1] ?? dMax);

  const dirtyRef = useRef(false);

  useEffect(() => {
    setMin(value?.[0] ?? dMin);
    setMax(value?.[1] ?? dMax);
    dirtyRef.current = false;
  }, [value, dMin, dMax]);

  const unitText =
    filterKey === 'priceEok'
      ? '억'
      : filterKey === 'pyeong'
        ? '평'
        : filterKey === 'age'
          ? '년'
          : filterKey === 'unit'
            ? '세대'
            : '';

  const title =
    filterKey === 'unit'
      ? '세대수'
      : filterKey === 'pyeong'
        ? '평형'
        : filterKey === 'priceEok'
          ? '가격'
          : '입주년차';

  const commitIfDirty = () => {
    if (!dirtyRef.current) return;
    dirtyRef.current = false;

    const nextMin = Math.min(min, max);
    const nextMax = Math.max(min, max);

    onCommit([nextMin, nextMax]);
  };

  useEffect(() => {
    const onUp = () => commitIfDirty();
    window.addEventListener('pointerup', onUp);
    window.addEventListener('touchend', onUp);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('touchend', onUp);
      window.removeEventListener('mouseup', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max]);

  const handleMinChange = (e) => {
    const v = Number(e.target.value);
    dirtyRef.current = true;
    setMin(Math.min(v, max));
  };

  const handleMaxChange = (e) => {
    const v = Number(e.target.value);
    dirtyRef.current = true;
    setMax(Math.max(v, min));
  };

  const handleResetOne = () => {
    dirtyRef.current = false;
    setMin(dMin);
    setMax(dMax);
    onCommit([dMin, dMax]);
  };

  const leftPct = useMemo(
    () => ((min - dMin) / (dMax - dMin)) * 100,
    [min, dMin, dMax],
  );
  const rightPct = useMemo(
    () => (1 - (max - dMin) / (dMax - dMin)) * 100,
    [max, dMin, dMax],
  );

  return (
    <div>
      <div className='mb-2 flex items-center justify-between'>
        <div className='text-sm font-semibold text-slate-800'>{title}</div>
        <button
          type='button'
          onClick={handleResetOne}
          className='rounded-xl border border-slate-200 px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-50'
        >
          초기화
        </button>
      </div>

      <div className='mb-2 text-[12px] text-slate-600'>
        <span className='font-semibold text-slate-900'>
          {min}
          {unitText}
        </span>
        <span className='mx-1 text-slate-400'>~</span>
        <span className='font-semibold text-slate-900'>
          {max}
          {unitText}
        </span>
      </div>

      <div className='relative h-10'>
        <div className='absolute top-1/2 right-0 left-0 h-1 -translate-y-1/2 rounded-full bg-slate-200' />

        <div
          className='absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-sky-400'
          style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
        />

        <input
          type='range'
          min={dMin}
          max={dMax}
          value={min}
          onChange={handleMinChange}
          className='absolute top-0 right-0 left-0 h-10 w-full appearance-none bg-transparent'
          style={{ zIndex: 3 }}
        />
        <input
          type='range'
          min={dMin}
          max={dMax}
          value={max}
          onChange={handleMaxChange}
          className='absolute top-0 right-0 left-0 h-10 w-full appearance-none bg-transparent'
          style={{ zIndex: 2 }}
        />
      </div>

      <div className='mt-3 flex items-center justify-between text-[11px] text-slate-400'>
        <span>
          최소 {dMin}
          {unitText}
        </span>
        <span>
          최대 {dMax}
          {unitText}
        </span>
      </div>

      <style>{`
        input[type="range"] { pointer-events: none; }
        input[type="range"]::-webkit-slider-thumb {
          pointer-events: auto;
          -webkit-appearance: none;
          appearance: none;
          height: 18px; width: 18px;
          border-radius: 9999px;
          background: white;
          border: 2px solid rgba(56,189,248,1);
          box-shadow: 0 3px 10px rgba(15,23,42,0.18);
          cursor: pointer;
        }
        input[type="range"]::-webkit-slider-runnable-track {
          height: 18px; background: transparent;
        }
        input[type="range"]::-moz-range-thumb {
          pointer-events: auto;
          height: 18px; width: 18px;
          border-radius: 9999px;
          background: white;
          border: 2px solid rgba(56,189,248,1);
          box-shadow: 0 3px 10px rgba(15,23,42,0.18);
          cursor: pointer;
        }
        input[type="range"]::-moz-range-track {
          height: 18px; background: transparent;
        }
      `}</style>
    </div>
  );
}

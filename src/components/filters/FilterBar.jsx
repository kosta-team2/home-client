import { RefreshCcw } from 'lucide-react';
import React, { useEffect, useMemo, useRef } from 'react';

import { FILTER_DEFAULTS } from '../../store/uiSlice';
import FilterChip from '../FilterChip';

import FilterRangePanel from './FilterRangePanel';

const FILTER_CHIPS = [
  { key: 'unit', label: '세대수' },
  { key: 'pyeong', label: '평형' },
  { key: 'priceEok', label: '가격' },
  { key: 'age', label: '입주년차' },
];

const formatRangeLabel = (key, min, max) => {
  if (min == null || max == null) return '';
  if (key === 'priceEok') return `${min}~${max}억`;
  if (key === 'pyeong') return `${min}~${max}평`;
  if (key === 'age') return `${min}~${max}년`;
  if (key === 'unit') return `${min}~${max}세대`;
  return `${min}~${max}`;
};

export default function FilterBar({
  filters,
  openKey,
  setOpenKey,
  onCommitRange,
  onResetAll,
}) {
  const rootRef = useRef(null);

  const isApplied = (key) => {
    const [dMin, dMax] = FILTER_DEFAULTS[key];
    const [min, max] = filters[key];
    return !(min === dMin && max === dMax);
  };

  const chipSubLabels = useMemo(() => {
    const out = {};
    for (const { key } of FILTER_CHIPS) {
      const [min, max] = filters[key];
      out[key] = formatRangeLabel(key, min, max);
    }
    return out;
  }, [filters]);

  const toggle = (key) => setOpenKey((prev) => (prev === key ? null : key));

  useEffect(() => {
    if (!openKey) return;

    const onDown = (e) => {
      const el = rootRef.current;
      if (!el) return;
      if (!el.contains(e.target)) setOpenKey(null);
    };

    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [openKey, setOpenKey]);

  return (
    <div
      ref={rootRef}
      className='relative z-50 overflow-visible border-b border-sky-100 bg-gradient-to-r from-white via-white to-sky-100'
    >
      <div className='flex flex-wrap items-center gap-2 overflow-visible px-6 py-2'>
        <div className='flex items-center gap-2'>
          {FILTER_CHIPS.map((f) => {
            const open = openKey === f.key;
            const applied = isApplied(f.key);

            return (
              <div key={f.key} className='relative'>
                <FilterChip
                  label={f.label}
                  subLabel={applied ? chipSubLabels[f.key] : null}
                  active={open}
                  applied={applied}
                  onClick={() => toggle(f.key)}
                />

                {open && (
                  <div className='absolute top-[44px] left-0 z-[9999] w-[320px] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.18)]'>
                    <FilterRangePanel
                      filterKey={f.key}
                      value={filters[f.key]}
                      onCommit={(range) => onCommitRange(f.key, range)}
                    />
                  </div>
                )}
              </div>
            );
          })}

          <button
            type='button'
            onClick={onResetAll}
            className='inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-400 hover:border-sky-400 hover:text-sky-600'
            title='필터 초기화'
          >
            <RefreshCcw className='h-3.5 w-3.5' />
          </button>
        </div>
      </div>

      <div className='h-[2px] bg-sky-400/70 shadow-[0_1px_4px_rgba(56,189,248,0.55)]' />
    </div>
  );
}

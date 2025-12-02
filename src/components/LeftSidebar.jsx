import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  SIDO_LIST,
  GYEONGGI_SGG_LIST,
  GYEONGGI_EMD_LIST,
} from '../data/mockData';
import {
  setSearchText,
  selectSido,
  selectSgg,
  selectEmd,
} from '../store/uiSlice';

import RegionGrid from './RegionGrid';

export default function LeftSidebar() {
  const dispatch = useDispatch();
  const { searchText, selectedSido, selectedSgg, selectedEmd } = useSelector(
    (state) => state.ui,
  );

  // 단계별 리스트 선택
  let currentItems = SIDO_LIST;
  let currentLevel = 'sido';

  if (selectedSido) {
    currentItems = GYEONGGI_SGG_LIST;
    currentLevel = 'sgg';
  }
  if (selectedSgg) {
    currentItems = GYEONGGI_EMD_LIST;
    currentLevel = 'emd';
  }

  const filteredItems = searchText
    ? currentItems.filter((name) =>
        name.toLowerCase().includes(searchText.toLowerCase()),
      )
    : currentItems;

  const levelLabel =
    currentLevel === 'sido'
      ? '시도 선택'
      : currentLevel === 'sgg'
        ? '시군구 선택'
        : '읍면동 선택';

  return (
    <aside className='flex w-[430px] max-w-[450px] flex-col border-r border-slate-100 bg-white'>
      {/* 검색 바 */}
      <div className='border-b border-slate-100 p-4'>
        <div className='flex items-center gap-2 rounded-2xl border border-sky-400 bg-white/80 px-3 py-2 shadow-sm'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-4 w-4 text-slate-400'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
            strokeWidth='1.6'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z'
            />
          </svg>
          <input
            value={searchText}
            onChange={(e) => dispatch(setSearchText(e.target.value))}
            placeholder='아파트명을 검색해보세요.'
            className='flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400'
          />
        </div>
        <p className='mt-2 text-[11px] text-slate-400'>
          * 기본은 지역 선택, 검색 시 단지명/동 이름으로 빠르게 이동할 수
          있어요.
        </p>
      </div>

      {/* 단계 네비게이션 */}
      <div className='flex items-center gap-1 border-b border-slate-100 bg-sky-50/80 px-4 py-3 text-[13px]'>
        <button
          type='button'
          onClick={() => {
            dispatch(selectSgg(null));
            dispatch(selectEmd(null));
          }}
          className='font-semibold text-sky-700 hover:text-sky-800'
        >
          {selectedSido || '시도 선택'}
        </button>
        <span className='text-slate-400'>›</span>
        <button
          type='button'
          onClick={() => {
            dispatch(selectEmd(null));
          }}
          className={
            currentLevel !== 'sido'
              ? 'font-semibold text-sky-700 hover:text-sky-800'
              : 'text-slate-500'
          }
        >
          {currentLevel === 'sgg' ? '시군구 선택' : '시군구'}
        </button>
        <span className='text-slate-400'>›</span>
        <span
          className={
            currentLevel === 'emd'
              ? 'font-semibold text-sky-700'
              : 'text-slate-500'
          }
        >
          읍면동 선택
        </span>
      </div>

      {/* 리스트 */}
      <div className='flex-1 overflow-y-auto p-4'>
        <div className='mb-1 flex items-center justify-between'>
          <div className='text-sm font-semibold text-slate-800'>
            {levelLabel}
          </div>
          <div className='text-[11px] text-slate-400'>
            {filteredItems.length.toLocaleString()}개 지역
          </div>
        </div>

        <RegionGrid
          items={filteredItems}
          selected={
            currentLevel === 'sido'
              ? selectedSido
              : currentLevel === 'sgg'
                ? selectedSgg
                : selectedEmd
          }
          onSelect={(value) => {
            if (currentLevel === 'sido') {
              dispatch(selectSido(value));
            } else if (currentLevel === 'sgg') {
              dispatch(selectSgg(value));
            } else {
              dispatch(selectEmd(value));
            }
          }}
        />
      </div>
    </aside>
  );
}

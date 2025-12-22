import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  setSelectedParcelId,
  openDetailFrom,
  setMapCenter,
  setMapLevel,
} from '../../store/uiSlice';

export default function SearchListSidebar() {
  const dispatch = useDispatch();
  const { searchResults, searchLoading, searchError, sidebarMode } =
    useSelector((s) => s.ui);

  const handleClick = (item) => {
    if (!item?.parcelId) return;

    dispatch(setSelectedParcelId(item.parcelId));
    dispatch(openDetailFrom(sidebarMode));

    // 지도 이동 (레벨 4)
    if (Number.isFinite(item.latitude) && Number.isFinite(item.longitude)) {
      dispatch(setMapCenter({ lat: item.latitude, lng: item.longitude }));
      dispatch(setMapLevel(3));
    }
  };

  if (searchLoading) {
    return <div className='p-4 text-sm text-slate-400'>검색 중...</div>;
  }
  if (searchError) {
    return <div className='p-4 text-sm text-rose-500'>{searchError}</div>;
  }
  if (!searchResults || searchResults.length === 0) {
    return (
      <div className='p-4 text-sm text-slate-400'>검색 결과가 없습니다.</div>
    );
  }

  return (
    <div className='p-3'>
      <div className='mb-2 text-sm font-semibold text-slate-800'>검색 결과</div>

      <ul className='space-y-2'>
        {searchResults.map((r) => (
          <li
            key={r.complexId}
            onClick={() => handleClick(r)}
            className='cursor-pointer rounded-2xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm hover:border-sky-200 hover:bg-sky-50/40'
          >
            <div className='text-[13px] font-semibold text-slate-900'>
              {r.complexName}
            </div>
            <div className='mt-0.5 line-clamp-1 text-[11px] text-slate-500'>
              {r.address || '주소 정보 없음'}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

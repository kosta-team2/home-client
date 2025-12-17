import axiosInstance from '@axios/AxiosInstance';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  goBackFromDetail,
  setSearchText,
  setSidebarMode,
  setSearchResults,
  setSearchLoading,
  setSearchError,
} from '../../store/uiSlice';

import DetailSidebar from './detail/DetailSidebar';
import RegionNavSidebar from './region/RegionNavSidebar';
import SearchListSidebar from './SearchListSidebar';

export default function LeftSidebar() {
  const dispatch = useDispatch();
  const { searchText, sidebarMode, selectedParcelId } = useSelector(
    (s) => s.ui,
  );

  const timerRef = useRef(null);

  const handleChangeSearch = (e) => {
    dispatch(setSearchText(e.target.value));
  };

  useEffect(() => {
    const q = (searchText ?? '').trim();

    // 2) 비면: 요청 X + region-nav 복귀 + 검색결과 초기화
    if (!q) {
      if (timerRef.current) clearTimeout(timerRef.current);
      dispatch(setSearchResults([]));
      dispatch(setSearchError(null));
      dispatch(setSearchLoading(false));
      dispatch(setSidebarMode('region-nav'));
      return;
    }

    // 입력 중이면 search-list 모드로
    dispatch(setSidebarMode('search-list'));

    // 1) 입력 바뀔 때마다 자동검색 (debounce)
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        dispatch(setSearchLoading(true));
        dispatch(setSearchError(null));

        const res = await axiosInstance.get(
          `/api/v1/search/complexes?q=${encodeURIComponent(q)}`,
        );

        dispatch(setSearchResults(Array.isArray(res.data) ? res.data : []));
      } catch (e) {
        console.log(e);
        dispatch(setSearchError('검색 실패'));
        dispatch(setSearchResults([]));
      } finally {
        dispatch(setSearchLoading(false));
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [searchText, dispatch]);

  return (
    <aside className='flex w-[430px] max-w-[450px] flex-col border-r border-slate-100 bg-white'>
      {sidebarMode !== 'detail' && (
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
              onChange={handleChangeSearch}
              placeholder='아파트명을 검색해보세요.'
              className='flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400'
            />
          </div>

          <p className='mt-2 text-[11px] text-slate-400'>
            * 기본은 지역 선택, 검색 시 단지명/동 이름으로 빠르게 이동할 수
            있어요.
          </p>
        </div>
      )}

      <div className='flex-1 overflow-y-auto'>
        <RegionNavSidebar active={sidebarMode === 'region-nav'} />
        {sidebarMode === 'search-list' && <SearchListSidebar />}

        {sidebarMode === 'detail' && selectedParcelId && (
          <DetailSidebar
            parcelId={selectedParcelId}
            onBack={() => dispatch(goBackFromDetail())}
          />
        )}
      </div>
    </aside>
  );
}

import { useDispatch, useSelector } from 'react-redux';

import {
  goBackFromDetail,
  setSearchText,
  setSidebarMode,
} from '../../store/uiSlice';

import DetailSidebar from './DetailSidebar';
import RegionNavSidebar from './RegionNavSidebar';

export default function LeftSidebar() {
  const dispatch = useDispatch();
  const { searchText, sidebarMode, selectedComplexId } = useSelector(
    (state) => state.ui,
  );

  const handleChangeSearch = (e) => {
    dispatch(setSearchText(e.target.value));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchText.trim();
    if (!q) return;

    // 검색 모드로 전환 + 검색 실행
    dispatch(setSidebarMode('search-list'));
    // 여기서 검색 API 호출 thunk
    // dispatch(fetchSearchResults(q));
  };

  return (
    <aside className='flex w-[430px] max-w-[450px] flex-col border-r border-slate-100 bg-white'>
      {/*상세 모드가 아닐 때만 검색바 표시 */}
      {sidebarMode !== 'detail' && (
        <div className='border-b border-slate-100 p-4'>
          <form
            className='flex items-center gap-2 rounded-2xl border border-sky-400 bg-white/80 px-3 py-2 shadow-sm'
            onSubmit={handleSearchSubmit}
          >
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
            {/* 검색 버튼도 쓸 거면 */}
            <button
              type='submit'
              className='rounded-xl px-2 py-1 text-[11px] text-sky-700 hover:bg-sky-50'
            >
              검색
            </button>
          </form>
          <p className='mt-2 text-[11px] text-slate-400'>
            * 기본은 지역 선택, 검색 시 단지명/동 이름으로 빠르게 이동할 수
            있어요.
          </p>
        </div>
      )}

      <div className='flex-1 overflow-y-auto'>
        <RegionNavSidebar active={sidebarMode === 'region-nav'} />

        {sidebarMode === 'detail' && selectedComplexId && (
          <DetailSidebar
            complexId={selectedComplexId}
            onBack={() => dispatch(goBackFromDetail())}
          />
        )}
      </div>
    </aside>
  );
}

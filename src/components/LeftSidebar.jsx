import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import axiosInstance from '../axiosInstance/AxiosInstance';
import { setSearchText } from '../store/uiSlice';

import RegionGrid from './RegionGrid';

// ❗프로젝트 경로에 맞게 수정
// 예: '@/store/uiSlice' 나 '../store/uiSlice' 같은 곳에 있을 것

export default function LeftSidebar() {
  const dispatch = useDispatch();
  const { searchText } = useSelector((state) => state.ui);

  const [rootRegions, setRootRegions] = useState([]); // 시도 리스트 (/move)
  const [currentRegion, setCurrentRegion] = useState(null); // 현재 단계 부모 (/move/{id} 결과)
  const [level, setLevel] = useState(0); // 0: 시도, 1: 시군구, 2: 읍면동

  const [selectedSido, setSelectedSido] = useState(null); // { id, name }
  const [selectedSigungu, setSelectedSigungu] = useState(null); // { id, name }
  const [selectedEmd, setSelectedEmd] = useState(null); // { id, name }

  const [loading, setLoading] = useState(false);

  // 공통으로 쓰는 로더: 특정 region(id)의 children 가져와서 currentRegion + level 변경
  const loadRegion = async (id, nextLevel) => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/v1/move/' + id);
      setCurrentRegion(res.data); // { id, name, children: [...] }
      setLevel(nextLevel);
    } catch (e) {
      console.error(`move/${id} 실패`, e);
    } finally {
      setLoading(false);
    }
  };

  // 1) 초기 시도 리스트 불러오기
  useEffect(() => {
    const loadRoot = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/api/v1/move');
        setRootRegions(res.data);
      } catch (e) {
        console.error('/api/v1/move 조회 실패', e);
      } finally {
        setLoading(false);
      }
    };

    loadRoot();
  }, []);

  // 2) 현재 단계 리스트
  const currentItems =
    level === 0 ? rootRegions : currentRegion?.children || [];

  const filteredItems = searchText
    ? currentItems.filter((item) =>
        item.name.toLowerCase().includes(searchText.toLowerCase()),
      )
    : currentItems;

  // RegionGrid에 넘길 선택된 id (단계에 따라 다름)
  const selectedId =
    level === 0
      ? selectedSido?.id
      : level === 1
        ? selectedSigungu?.id
        : selectedEmd?.id;

  // 3) 리스트 아이템 클릭 (시도 / 시군구 / 읍면동)
  const handleSelect = async (item) => {
    if (level === 0) {
      // 시도 선택
      setSelectedSido({ id: item.id, name: item.name });
      setSelectedSigungu(null);
      setSelectedEmd(null);
      await loadRegion(item.id, 1); // 시군구 단계로
    } else if (level === 1) {
      // 시군구 선택
      setSelectedSigungu({ id: item.id, name: item.name });
      setSelectedEmd(null);
      await loadRegion(item.id, 2); // 읍면동 단계로
    } else {
      // level === 2, 읍면동 선택: 더 내려가지 않고 선택만
      setSelectedEmd({ id: item.id, name: item.name });
    }
  };

  // 4) 단계 네비게이션 클릭 핸들러들

  // "시도 선택" 클릭 → 완전 초기화
  const handleClickSido = () => {
    setLevel(0);
    setCurrentRegion(null);
    setSelectedSido(null);
    setSelectedSigungu(null);
    setSelectedEmd(null);
  };

  // "시군구 선택" 클릭 → 선택된 시도의 시군구 리스트 다시 로딩
  const handleClickSigungu = async () => {
    if (!selectedSido) return; // 아직 시도를 안 골랐으면 무시

    await loadRegion(selectedSido.id, 1); // 시군구 리스트 다시 로딩
    setSelectedSigungu(null);
    setSelectedEmd(null);
  };

  // "읍면동 선택" 클릭 → 선택된 시군구의 읍면동 리스트 다시 로딩
  const handleClickEmd = async () => {
    if (!selectedSigungu) return; // 아직 시군구를 안 골랐으면 무시

    await loadRegion(selectedSigungu.id, 2); // 읍면동 리스트 다시 로딩
    setSelectedEmd(null);
  };

  const stepLabels = ['시도 선택', '시군구 선택', '읍면동 선택'];
  const listTitle = stepLabels[level];

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

      {/* 단계 네비게이션 (서울 > 강남구 > 개포동 느낌) */}
      <div className='flex items-center border-b border-slate-100 bg-sky-50/80 px-4 py-3 text-[13px]'>
        {/* 시도 */}
        <button
          type='button'
          onClick={handleClickSido}
          className={
            'text-[12px] ' +
            (level === 0 ? 'font-semibold text-sky-700 ' : 'text-sky-600 ') +
            'underline-offset-2 hover:underline'
          }
        >
          {selectedSido?.name || '시도 선택'}
        </button>

        <span className='mx-2 text-slate-400'>{'>'}</span>

        {/* 시군구 */}
        <button
          type='button'
          onClick={handleClickSigungu}
          disabled={!selectedSido}
          className={
            'text-[12px] ' +
            (level === 1 ? 'font-semibold text-sky-700 ' : 'text-sky-600 ') +
            (!selectedSido
              ? ' cursor-default opacity-40'
              : ' underline-offset-2 hover:underline')
          }
        >
          {selectedSigungu?.name || '시군구 선택'}
        </button>

        <span className='mx-2 text-slate-400'>{'>'}</span>

        {/* 읍면동 */}
        <button
          type='button'
          onClick={handleClickEmd}
          disabled={!selectedSigungu}
          className={
            'text-[12px] ' +
            (level === 2 ? 'font-semibold text-sky-700 ' : 'text-sky-600 ') +
            (!selectedSigungu
              ? ' cursor-default opacity-40'
              : ' underline-offset-2 hover:underline')
          }
        >
          {selectedEmd?.name || '읍면동 선택'}
        </button>
      </div>

      {/* 리스트 */}
      <div className='flex-1 overflow-y-auto p-4'>
        <div className='mb-1 flex items-center justify-between'>
          <div className='text-sm font-semibold text-slate-800'>
            {listTitle}
          </div>
          <div className='text-[11px] text-slate-400'>
            {loading
              ? '불러오는 중...'
              : `${filteredItems.length.toLocaleString()}개 지역`}
          </div>
        </div>

        <RegionGrid
          items={filteredItems}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </div>
    </aside>
  );
}

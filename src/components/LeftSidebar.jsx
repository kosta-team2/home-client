import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import axiosInstance from '../axiosInstance/AxiosInstance';
import { setMapCenter, setMapLevel, setSearchText } from '../store/uiSlice';

import RegionGrid from './RegionGrid';

export default function LeftSidebar() {
  const dispatch = useDispatch();
  const { searchText } = useSelector((state) => state.ui);

  const [rootRegions, setRootRegions] = useState([]);
  const [currentRegion, setCurrentRegion] = useState(null);
  const [level, setLevel] = useState(0);

  const [selectedSido, setSelectedSido] = useState(null);
  const [selectedSigungu, setSelectedSigungu] = useState(null);
  const [selectedEmd, setSelectedEmd] = useState(null);

  const [loading, setLoading] = useState(false);

  // todo 줌레벨 상수로 수정하기
  const toKakaoLevel = (zoomStep) => {
    switch (zoomStep) {
      case 0: // 시도
        return 10;
      case 1: // 시군구
        return 6;
      case 2: // 읍면동
        return 3;
      default:
        return 10;
    }
  };

  const moveMapToRegion = async (id, zoomStep) => {
    try {
      const res = await axiosInstance.get('/api/v1/move/' + id);
      const region = res.data;

      if (region && region.latitude != null && region.longitude != null) {
        dispatch(
          setMapCenter({
            lat: region.latitude,
            lng: region.longitude,
          }),
        );
        dispatch(setMapLevel(toKakaoLevel(zoomStep)));
      } else {
        console.warn(
          'moveMapToRegion: region에 latitude/longitude가 없습니다.',
          region,
        );
      }
    } catch (e) {
      console.error(`moveMapToRegion /api/v1/move/${id} 실패`, e);
    }
  };

  const loadRegion = async (id, nextLevel, zoomStep) => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/v1/move/' + id);
      const region = res.data;

      setCurrentRegion(region);
      setLevel(nextLevel);

      if (region && region.latitude != null && region.longitude != null) {
        dispatch(
          setMapCenter({
            lat: region.latitude,
            lng: region.longitude,
          }),
        );

        dispatch(setMapLevel(toKakaoLevel(zoomStep)));
      } else {
        console.warn(
          'loadRegion: region에 latitude/longitude가 없어 지도 이동은 생략됩니다.',
          region,
        );
      }
    } catch (e) {
      console.error(`/api/v1/move/${id} 실패`, e);
    } finally {
      setLoading(false);
    }
  };

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

  const currentItems =
    level === 0 ? rootRegions : currentRegion?.children || [];

  const filteredItems = searchText
    ? currentItems.filter((item) =>
        item.name.toLowerCase().includes(searchText.toLowerCase()),
      )
    : currentItems;

  const selectedId =
    level === 0
      ? selectedSido?.id
      : level === 1
        ? selectedSigungu?.id
        : selectedEmd?.id;

  const handleSelect = async (item) => {
    if (level === 0) {
      setSelectedSido({ id: item.id, name: item.name });
      setSelectedSigungu(null);
      setSelectedEmd(null);

      await loadRegion(item.id, 1, 0);
    } else if (level === 1) {
      setSelectedSigungu({ id: item.id, name: item.name });
      setSelectedEmd(null);

      await loadRegion(item.id, 2, 1);
    } else {
      setSelectedEmd({ id: item.id, name: item.name });

      await moveMapToRegion(item.id, 2);
    }
  };

  const handleClickSido = () => {
    setLevel(0);
    setCurrentRegion(null);
    setSelectedSido(null);
    setSelectedSigungu(null);
    setSelectedEmd(null);
  };

  const handleClickSigungu = async () => {
    if (!selectedSido) return;

    await loadRegion(selectedSido.id, 1, 0);
    setSelectedSigungu(null);
    setSelectedEmd(null);
  };

  const handleClickEmd = async () => {
    if (!selectedSigungu) return;

    await loadRegion(selectedSigungu.id, 2, 1);
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

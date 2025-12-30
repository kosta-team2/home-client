import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import axiosInstance from '../../../axiosInstance/AxiosInstance';
import { setMapCenter, setMapLevel } from '../../../store/uiSlice';

import RegionGrid from './RegionGrid';

export default function RegionNavSidebar({ active = true }) {
  const dispatch = useDispatch();
  const { searchText } = useSelector((state) => state.ui);

  const [rootRegions, setRootRegions] = useState([]);
  const [currentRegion, setCurrentRegion] = useState(null);
  const [level, setLevel] = useState(0);

  const [selectedSido, setSelectedSido] = useState(null);
  const [selectedSigungu, setSelectedSigungu] = useState(null);
  const [selectedEmd, setSelectedEmd] = useState(null);

  const [loading, setLoading] = useState(false);

  const toKakaoLevel = (zoomStep) => {
    switch (zoomStep) {
      case 0:
        return 7; // 시도
      case 1:
        return 4; // 시군구
      case 2:
        return 3; // 읍면동
      default:
        return 10;
    }
  };

  const moveMapToRegion = async (id, zoomStep) => {
    try {
      const res = await axiosInstance.get('/api/v1/region/' + id);
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
      console.error(`moveMapToRegion /api/v1/region/${id} 실패`, e);
    }
  };

  const loadRegion = async (id, nextLevel, zoomStep) => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/v1/region/' + id);
      const region = res.data;

      // ✅ 방어: children이 배열이 아닐 경우 빈 배열로 정규화(로직은 동일)
      const normalizedRegion =
        region && typeof region === 'object'
          ? {
              ...region,
              children: Array.isArray(region.children) ? region.children : [],
            }
          : region;

      setCurrentRegion(normalizedRegion);
      setLevel(nextLevel);

      if (
        normalizedRegion &&
        normalizedRegion.latitude != null &&
        normalizedRegion.longitude != null
      ) {
        dispatch(
          setMapCenter({
            lat: normalizedRegion.latitude,
            lng: normalizedRegion.longitude,
          }),
        );
        dispatch(setMapLevel(toKakaoLevel(zoomStep)));
      } else {
        console.warn(
          'loadRegion: region에 latitude/longitude가 없어 지도 이동은 생략됩니다.',
          normalizedRegion,
        );
      }
    } catch (e) {
      console.error(`/api/v1/region/${id} 실패`, e);
      // ✅ 방어: 실패 시에도 그리드가 즉사하지 않도록 상태를 안전한 값으로
      setCurrentRegion(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadRoot = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/api/v1/region');

        // ✅ 방어: res.data가 배열이 아니면 빈 배열
        const data = res?.data;
        setRootRegions(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('/api/v1/region 조회 실패', e);
        // ✅ 방어: 실패 시에도 배열 유지
        setRootRegions([]);
      } finally {
        setLoading(false);
      }
    };

    loadRoot();
  }, []);

  // ✅ 방어: currentItems는 언제나 배열
  const currentItems =
    level === 0
      ? Array.isArray(rootRegions)
        ? rootRegions
        : []
      : Array.isArray(currentRegion?.children)
        ? currentRegion.children
        : [];

  // ✅ 방어: 필터링도 배열에서만
  const filteredItems = searchText
    ? currentItems.filter((item) =>
        (item?.name ?? '').toLowerCase().includes(searchText.toLowerCase()),
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
    // active가 false면 hidden으로만 숨김 (언마운트 X)
    <div className={'flex flex-1 flex-col ' + (active ? '' : 'hidden')}>
      {/* 단계 네비게이션 */}
      <div className='flex items-center border-b border-slate-100 bg-sky-50/80 px-4 py-3 text-[13px]'>
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
    </div>
  );
}

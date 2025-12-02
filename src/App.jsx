import { RefreshCcw } from 'lucide-react';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import FilterChip from './components/FilterChip';
import Header from './components/Header';
import LeftSidebar from './components/LeftSidebar';
import KakaoMap from './components/map/KakaoMap';
import LegendBox from './components/map/LegendBox';
import PriceChangeMarkers from './components/map/PriceChangeMarkers';
import { METRICS, MARKERS } from './data/mockData';
import {
  toggleMetric,
  resetFilters,
  setMapCenter,
  setMapLevel,
} from './store/uiSlice';

export default function App() {
  const dispatch = useDispatch();
  const {
    selectedMetrics,
    selectedSido,
    selectedSgg,
    selectedEmd,
    mapCenter,
    mapLevel,
  } = useSelector((state) => state.ui);

  const handleToggleMetric = (metric) => {
    dispatch(toggleMetric(metric));
  };

  const handleReset = () => {
    dispatch(resetFilters());
  };

  const handleMapIdle = (map) => {
    const center = map.getCenter();
    const level = map.getLevel();
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    console.log('level:', level);
    console.log('SW:', sw.getLat(), sw.getLng());
    console.log('NE:', ne.getLat(), ne.getLng());

    dispatch(
      setMapCenter({
        lat: center.getLat(),
        lng: center.getLng(),
      }),
    );
    dispatch(setMapLevel(level));
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-['Pretendard',system-ui,sans-serif]">
      <Header />

      <main className='flex flex-1 overflow-hidden'>
        <LeftSidebar />

        {/* 오른쪽 지도 + 상단 필터 */}
        <section className='flex flex-1 flex-col'>
          {/* 표시 항목 바 */}
          <div className='border-b border-sky-100 bg-gradient-to-r from-white via-white to-sky-100'>
            <div className='no-scrollbar flex items-center gap-2 overflow-x-auto px-6 py-2'>
              <div className='flex items-center gap-2'>
                {METRICS.map((metric) => (
                  <FilterChip
                    key={metric}
                    label={metric}
                    active={selectedMetrics.includes(metric)}
                    onClick={() => handleToggleMetric(metric)}
                  />
                ))}

                <button
                  type='button'
                  onClick={handleReset}
                  className='inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-400 hover:border-sky-400 hover:text-sky-600'
                >
                  <RefreshCcw className='h-3.5 w-3.5' />
                </button>
              </div>
            </div>
            <div className='h-[2px] bg-sky-400/70 shadow-[0_1px_4px_rgba(56,189,248,0.55)]' />
          </div>

          {/* 지도 영역 */}
          <div className='flex-1'>
            <div className='relative h-full w-full'>
              <KakaoMap
                center={mapCenter}
                level={mapLevel}
                onIdle={handleMapIdle}
              >
                <PriceChangeMarkers markers={MARKERS} />
              </KakaoMap>

              {/* 현재 보기 요약 */}
              <div className='absolute top-4 left-4 flex flex-col gap-1 rounded-2xl border border-slate-100 bg-white/90 px-3 py-2.5 text-xs shadow-sm backdrop-blur'>
                <div className='font-semibold text-slate-800'>현재 보기</div>
                <div className='text-[11px] text-slate-500'>
                  {selectedSido || '시도 미선택'}
                  {selectedSgg && ` · ${selectedSgg}`}
                  {selectedEmd && ` · ${selectedEmd}`}
                </div>
                <div className='mt-0.5 flex flex-wrap gap-1'>
                  {selectedMetrics.map((m) => (
                    <span
                      key={m}
                      className='inline-flex rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-[10px] text-sky-700'
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* 마커 범례 (별도 컴포넌트, React.memo로 깜빡임 최소화) */}
              <LegendBox />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

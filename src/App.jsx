import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { tokenStore } from './auth/token';
import axiosInstance from './axiosInstance/AxiosInstance';
import FilterBar from './components/filters/FilterBar';
import Header from './components/Header';
import ComplexMarkers from './components/map/ComplexMarkers';
import KakaoMap from './components/map/KakaoMap';
import RegionMarkers from './components/map/RegionMarkers';
import LeftSidebar from './components/sidebar/LeftSidebar';
import { FILTER_DEFAULTS, setFilterRange, resetFilters } from './store/uiSlice';
import {
  setMapCenter,
  setMapLevel,
  setRegionMarkers,
  setComplexMarkers,
} from './store/uiSlice';

export default function App() {
  const dispatch = useDispatch();
  const mapRef = useRef(null);

  const { mapCenter, mapLevel, regionMarkers, complexMarkers, filters } =
    useSelector((state) => state.ui);

  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const [openFilterKey, setOpenFilterKey] = useState(null);

  // ✅ 요청/렌더 타이밍 측정용 상태
  const [timing, setTiming] = useState({
    apiMs: null, // axios 요청~응답
    uiMs: null, // axios 요청~(화면 반영 후)
    lastCount: 0,
    lastEndpoint: '',
    lastLevel: null,
    lastAt: null,
  });

  // ✅ 최신 요청만 반영(지도 idle이 연속으로 들어올 때 “느린 응답이 나중에 와서 덮어쓰기” 방지)
  const reqSeqRef = useRef(0);

  const resolveEndpoint = (level) => {
    if (level <= 4) return 'api/v1/map/complexes';
    return 'api/v1/map/regions';
  };

  const resolveRegionKeyForApi = (level) => {
    if (level >= 10) return 'si-do';
    if (level >= 7) return 'si-gun-gu';
    if (level >= 4) return 'eup-myeon-dong';
    return 'complex';
  };

  const buildFilterPayload = (f) => {
    const isFull = (key, min, max) => {
      const [dMin, dMax] = FILTER_DEFAULTS[key];
      return min === dMin && max === dMax;
    };

    const [priceMin, priceMax] = f.priceEok;
    const [pyMin, pyMax] = f.pyeong;
    const [ageMin, ageMax] = f.age;
    const [unitMin, unitMax] = f.unit;

    return {
      priceEokMin: isFull('priceEok', priceMin, priceMax) ? null : priceMin,
      priceEokMax: isFull('priceEok', priceMin, priceMax) ? null : priceMax,

      pyeongMin: isFull('pyeong', pyMin, pyMax) ? null : pyMin,
      pyeongMax: isFull('pyeong', pyMin, pyMax) ? null : pyMax,

      ageMin: isFull('age', ageMin, ageMax) ? null : ageMin,
      ageMax: isFull('age', ageMin, ageMax) ? null : ageMax,

      unitMin: isFull('unit', unitMin, unitMax) ? null : unitMin,
      unitMax: isFull('unit', unitMin, unitMax) ? null : unitMax,
    };
  };

  const fetchMarkers = useCallback(
    async (map, overrideFilters) => {
      if (!map) return;

      const center = map.getCenter();
      const level = map.getLevel();
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      console.log('[MAP BOUNDS]', {
        level,
        center: { lat: center.getLat(), lng: center.getLng() },
        sw: { lat: sw.getLat(), lng: sw.getLng() },
        ne: { lat: ne.getLat(), lng: ne.getLng() },
      });

      dispatch(setMapCenter({ lat: center.getLat(), lng: center.getLng() }));
      dispatch(setMapLevel(level));

      const url = resolveEndpoint(level);
      const isComplexLevel = level <= 4;

      const payload = isComplexLevel
        ? {
            swLat: sw.getLat(),
            swLng: sw.getLng(),
            neLat: ne.getLat(),
            neLng: ne.getLng(),
            ...buildFilterPayload(overrideFilters ?? filtersRef.current),
          }
        : {
            swLat: sw.getLat(),
            swLng: sw.getLng(),
            neLat: ne.getLat(),
            neLng: ne.getLng(),
            region: resolveRegionKeyForApi(level),
          };

      // ✅ 타이밍 측정 시작
      const t0 = performance.now();
      const seq = ++reqSeqRef.current;

      try {
        const res = await axiosInstance.post(url, payload);
        const tApi = performance.now(); // ✅ 응답 도착

        // ✅ 최신 요청만 반영 (이전 요청이 늦게 와서 덮어쓰는 것 방지)
        if (seq !== reqSeqRef.current) return;

        const list = Array.isArray(res.data) ? res.data : [];

        console.log(list);

        const parsed = list.map((item) => ({
          ...item,
          lat: typeof item.lat === 'string' ? parseFloat(item.lat) : item.lat,
          lng: typeof item.lng === 'string' ? parseFloat(item.lng) : item.lng,
        }));

        if (isComplexLevel) {
          dispatch(setComplexMarkers(parsed));
          dispatch(setRegionMarkers([]));
        } else {
          dispatch(setRegionMarkers(parsed));
          dispatch(setComplexMarkers([]));
        }

        // ✅ “화면 반영”까지(다음 페인트 이후) 측정
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const tPaint = performance.now();
            setTiming({
              apiMs: tApi - t0,
              uiMs: tPaint - t0,
              lastCount: parsed.length,
              lastEndpoint: url,
              lastLevel: level,
              lastAt: new Date().toLocaleTimeString(),
            });
          });
        });
      } catch (e) {
        console.log(e);

        // ✅ 최신 요청만 반영
        if (seq !== reqSeqRef.current) return;

        dispatch(setRegionMarkers([]));
        dispatch(setComplexMarkers([]));

        const tFail = performance.now();
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const tPaint = performance.now();
            setTiming({
              apiMs: tFail - t0,
              uiMs: tPaint - t0,
              lastCount: 0,
              lastEndpoint: url,
              lastLevel: level,
              lastAt: new Date().toLocaleTimeString(),
            });
          });
        });
      }
    },
    [dispatch],
  );

  const handleMapReady = useCallback(
    (map) => {
      mapRef.current = map;
      fetchMarkers(map);
    },
    [fetchMarkers],
  );

  const handleMapIdle = useCallback(
    (map) => {
      mapRef.current = map;
      fetchMarkers(map);
    },
    [fetchMarkers],
  );

  const isComplexLevel = mapLevel <= 4;

  const handleCommitRange = (key, range) => {
    const nextFilters = {
      ...filtersRef.current,
      [key]: range,
    };

    dispatch(setFilterRange({ key, value: range }));

    // 현재 맵 기준으로 즉시 1회 갱신
    if (mapRef.current) fetchMarkers(mapRef.current, nextFilters);
  };

  const handleResetAll = () => {
    dispatch(resetFilters());
    setOpenFilterKey(null);

    // reset 직후 즉시 갱신
    const defaultFilters = {
      unit: FILTER_DEFAULTS.unit,
      pyeong: FILTER_DEFAULTS.pyeong,
      priceEok: FILTER_DEFAULTS.priceEok,
      age: FILTER_DEFAULTS.age,
    };
    if (mapRef.current) fetchMarkers(mapRef.current, defaultFilters);
  };

  useEffect(() => {
    const handleOAuthCallback = async () => {
      if (window.location.pathname !== '/oauth/callback') return;

      try {
        const { data } = await axiosInstance.post('/auth/access'); // withCredentials=true여야 쿠키 전송됨
        tokenStore.set(data.accessToken);

        // URL만 /로 바꾸고 리렌더/이동 없이 유지
        window.history.replaceState({}, '', '/');
      } catch (e) {
        console.log('access token issue failed:', e);
        window.history.replaceState({}, '', '/');
      }
    };

    handleOAuthCallback();
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 font-['Pretendard',system-ui,sans-serif]">
      <Header />

      <main className='flex flex-1 overflow-hidden'>
        <LeftSidebar />

        <section className='flex flex-1 flex-col'>
          <FilterBar
            filters={filters}
            openKey={openFilterKey}
            setOpenKey={setOpenFilterKey}
            onCommitRange={handleCommitRange}
            onResetAll={handleResetAll}
          />

          <div className='flex-1'>
            <div className='relative h-full w-full'>
              {/* ✅ 디버그: 요청/렌더 시간 오버레이 */}
              <div className='pointer-events-none absolute top-3 right-3 z-50 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-700 shadow-sm backdrop-blur'>
                <div className='font-semibold text-slate-800'>Perf</div>
                <div>
                  API:{' '}
                  <span className='font-mono'>
                    {timing.apiMs == null
                      ? '-'
                      : `${timing.apiMs.toFixed(1)} ms`}
                  </span>
                </div>
                <div>
                  UI:{' '}
                  <span className='font-mono'>
                    {timing.uiMs == null ? '-' : `${timing.uiMs.toFixed(1)} ms`}
                  </span>
                </div>
                <div>
                  count: <span className='font-mono'>{timing.lastCount}</span>
                </div>
                <div>
                  level:{' '}
                  <span className='font-mono'>{timing.lastLevel ?? '-'}</span>
                </div>
                <div className='max-w-[220px] truncate'>
                  endpoint:{' '}
                  <span className='font-mono'>
                    {timing.lastEndpoint || '-'}
                  </span>
                </div>
                <div>
                  at: <span className='font-mono'>{timing.lastAt || '-'}</span>
                </div>
              </div>

              <KakaoMap
                center={mapCenter}
                level={mapLevel}
                onIdle={handleMapIdle}
                onMapReady={handleMapReady}
              >
                {isComplexLevel ? (
                  <ComplexMarkers markers={complexMarkers} />
                ) : (
                  <RegionMarkers markers={regionMarkers} />
                )}
              </KakaoMap>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

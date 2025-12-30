import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { tokenStore } from './auth/token';
import axiosInstance from './axiosInstance/AxiosInstance';
import FilterBar from './components/filters/FilterBar';
import Header from './components/Header';
import ComplexMarkers from './components/map/ComplexMarkers';
import KakaoMap from './components/map/KakaoMap';
import LegendBox from './components/map/LegendBox';
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

  const resolveEndpoint = (level) => {
    if (level < 4) return 'api/v1/map/complexes';
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

      try {
        const res = await axiosInstance.post(url, payload);
        const list = Array.isArray(res.data) ? res.data : [];

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
      } catch (e) {
        console.log(e);
        dispatch(setRegionMarkers([]));
        dispatch(setComplexMarkers([]));
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
  const showLegend = !isComplexLevel;

  const handleCommitRange = (key, range) => {
    const nextFilters = {
      ...filtersRef.current,
      [key]: range,
    };

    dispatch(setFilterRange({ key, value: range }));

    if (mapRef.current) fetchMarkers(mapRef.current, nextFilters);
  };

  const handleResetAll = () => {
    dispatch(resetFilters());
    setOpenFilterKey(null);

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
        const { data } = await axiosInstance.post('/auth/access');
        tokenStore.set(data.accessToken);
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

              {showLegend && <LegendBox />}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

import { BarChart3 } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  openDetailFrom,
  setMapCenter,
  setMapLevel,
  setSelectedParcelId,
} from '../../../store/uiSlice';
import { fetchTopPrice10, fetchTopVolumeAll } from '../../api/topChartApi';

function formatPrice(priceWon) {
  if (priceWon == null) return '-';
  const n = Number(priceWon);
  if (!Number.isFinite(n)) return '-';

  // NOTE: 기존 로직 유지 (priceWon이 만원단위라고 가정)
  const eok = Math.floor(n / 1_0000);
  const man = Math.round((n % 10_000) / 10_000);

  if (eok > 0)
    return man > 0 ? `${eok}억 ${man.toLocaleString()}만` : `${eok}억`;
  return `${man.toLocaleString()}만`;
}

function RowItemButton({ onClick, title, left, center, right }) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={[
        'w-full',
        'rounded-2xl border border-slate-100 bg-white',
        'px-4 py-4',
        'shadow-sm',
        'hover:border-sky-200 hover:bg-sky-50/30',
        'min-h-[64px]',
      ].join(' ')}
      title={title}
    >
      <div className='grid grid-cols-[56px_1fr_96px] items-center gap-3'>
        {/* LEFT */}
        <div className='text-left text-[13px] font-semibold text-slate-700'>
          {left}
        </div>

        {/* CENTER */}
        <div className='truncate text-center text-[14px] font-semibold text-slate-800'>
          {center}
        </div>

        {/* RIGHT */}
        <div className='text-right text-[13px] font-semibold whitespace-nowrap text-slate-800'>
          {right}
        </div>
      </div>
    </button>
  );
}

export default function TopChartSidebar({ onBack }) {
  const dispatch = useDispatch();
  const sidebarMode = useSelector((s) => s.ui.sidebarMode);

  const [tab, setTab] = useState('price');
  const [topPrice, setTopPrice] = useState([]);
  const [topVolume, setTopVolume] = useState([]);

  const [selectedRegionId, setSelectedRegionId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const handleBack = () => onBack?.();

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);

      const [priceList, volumeList] = await Promise.all([
        fetchTopPrice10(),
        fetchTopVolumeAll(),
      ]);

      setTopPrice(priceList);
      setTopVolume(volumeList);
    } catch (e) {
      console.log(e);
      setErr('TOP 차트 데이터를 불러오지 못했습니다.');
      setTopPrice([]);
      setTopVolume([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const regions = useMemo(() => {
    const map = new Map();
    (topVolume || []).forEach((x) => {
      if (x?.regionId == null) return;
      if (!map.has(x.regionId)) {
        map.set(x.regionId, {
          regionId: x.regionId,
          regionName: x.regionName ?? '지역',
        });
      }
    });
    return Array.from(map.values());
  }, [topVolume]);

  const effectiveRegionId = useMemo(() => {
    if (tab !== 'volume') return null;
    return selectedRegionId ?? regions[0]?.regionId ?? null;
  }, [tab, selectedRegionId, regions]);

  const volumeFiltered = useMemo(() => {
    if (!topVolume || topVolume.length === 0) return [];
    if (effectiveRegionId == null) return [];

    return topVolume
      .filter((x) => Number(x.regionId) === Number(effectiveRegionId))
      .sort((a, b) => Number(b.dealCount ?? 0) - Number(a.dealCount ?? 0))
      .slice(0, 10);
  }, [topVolume, effectiveRegionId]);

  const handleClickItem = (item) => {
    if (!item?.parcelId) return;

    if (
      Number.isFinite(Number(item.lat)) &&
      Number.isFinite(Number(item.lng))
    ) {
      dispatch(setMapCenter({ lat: Number(item.lat), lng: Number(item.lng) }));
      dispatch(setMapLevel(4));
    }

    dispatch(setSelectedParcelId(item.parcelId));
    dispatch(openDetailFrom(sidebarMode));
  };

  const tabBtn = (active) =>
    [
      'rounded-full px-4 py-1.5 text-[12px] font-semibold transition',
      'border',
      active
        ? 'bg-[#d6f3ff] border-sky-200 text-slate-900 shadow-sm'
        : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50',
    ].join(' ');

  return (
    <div className='flex h-full flex-col bg-white'>
      <header className='flex items-center justify-between bg-[#d6f3ff] px-4 py-3 text-black'>
        <button
          type='button'
          onClick={handleBack}
          className='flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-black shadow-sm backdrop-blur transition-all duration-150 hover:-translate-y-0.5 hover:bg-white/30 hover:shadow-md active:translate-y-0'
        >
          ←
        </button>

        <div className='flex flex-1 flex-col items-center px-2'>
          <div className='text-[11px] opacity-80'>TOP 차트</div>
          <div className='mt-0.5 text-sm font-semibold'>랭킹</div>
        </div>

        <div className='w-6' />
      </header>

      {/* 탭 + 구분선 유격 */}
      <div className='px-4 pt-3'>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() => setTab('price')}
            className={tabBtn(tab === 'price')}
          >
            실거래가 TOP10
          </button>

          <button
            type='button'
            onClick={() => setTab('volume')}
            className={tabBtn(tab === 'volume')}
          >
            지역별 거래량 TOP10
          </button>
        </div>

        <div className='mt-3 mb-3 border-b border-slate-100' />
      </div>

      <div className='flex-1 overflow-y-auto px-4 pb-5'>
        {loading && (
          <div className='flex items-center gap-2 text-[12px] text-slate-400'>
            <BarChart3 className='h-4 w-4' /> 불러오는 중...
          </div>
        )}

        {err && <p className='mb-2 text-[12px] text-red-500'>{err}</p>}

        {!loading && !err && tab === 'price' && (
          <div className='space-y-2'>
            {topPrice.length === 0 ? (
              <div className='rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-[12px] text-slate-500'>
                데이터가 없습니다.
              </div>
            ) : (
              topPrice
                .slice(0, 10)
                .map((x) => (
                  <RowItemButton
                    key={x.rank}
                    onClick={() => handleClickItem(x)}
                    title='클릭 시 지도 이동 + 상세보기'
                    left={`${x.rank}위`}
                    center={x.tradeName ?? '단지'}
                    right={formatPrice(x.maxPrice)}
                  />
                ))
            )}
          </div>
        )}

        {!loading && !err && tab === 'volume' && (
          <>
            <div className='mb-3'>
              <div className='mb-1 text-[11px] font-semibold text-slate-600'>
                지역 선택
              </div>

              <select
                className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-800 outline-none focus:border-sky-300'
                value={effectiveRegionId ?? ''}
                onChange={(e) => setSelectedRegionId(Number(e.target.value))}
                disabled={regions.length === 0}
              >
                {regions.length === 0 ? (
                  <option value=''>지역 없음</option>
                ) : (
                  regions.map((r) => (
                    <option key={r.regionId} value={r.regionId}>
                      {r.regionName}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className='space-y-2'>
              {volumeFiltered.length === 0 ? (
                <div className='rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-[12px] text-slate-500'>
                  데이터가 없습니다.
                </div>
              ) : (
                volumeFiltered.map((x, idx) => (
                  <RowItemButton
                    key={`${x.regionId}-${x.parcelId}-${idx}`}
                    onClick={() => handleClickItem(x)}
                    title='클릭 시 지도 이동 + 상세보기'
                    left={`${idx + 1}위`}
                    center={x.tradeName ?? '단지'}
                    right={`${Number(x.dealCount ?? 0).toLocaleString()}건`}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

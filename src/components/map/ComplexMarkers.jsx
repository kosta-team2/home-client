import React, { useState } from 'react';
import { CustomOverlayMap } from 'react-kakao-maps-sdk';
import { useDispatch, useSelector } from 'react-redux';

import { setSelectedComplexId, openDetailFrom } from '../../store/uiSlice';

export default function ComplexMarkers({ markers }) {
  const [hoveredId, setHoveredId] = useState(null);
  const dispatch = useDispatch();
  const sidebarMode = useSelector((state) => state.ui.sidebarMode);

  if (!markers || markers.length === 0) return null;

  const handleMarkerClick = (marker) => {
    dispatch(setSelectedComplexId(marker.id));
    dispatch(openDetailFrom(sidebarMode));
  };

  return (
    <>
      {markers.map((m) => {
        const archArea = m.archArea ?? m.arch_area;
        const unitCnt = m.unitCnt ?? m.unit_cnt;
        const buildYear = m.buildYear ?? m.build_year;
        const tradeName = m.tradeName ?? m.trade_name;
        const address = m.address ?? '';
        const areaPyeong = archArea ? Math.round(archArea / 3.3) : null;

        const topLabel = areaPyeong ? `${areaPyeong}평` : tradeName || '아파트';
        const bottomLabel = unitCnt
          ? `${unitCnt.toLocaleString()}세대`
          : '세대수 정보 없음';

        const isHovered = hoveredId === m.id;

        const houseColor = '#60a5fa';

        return (
          <CustomOverlayMap
            key={m.id}
            position={{ lat: m.lat, lng: m.lng }}
            yAnchor={1}
          >
            <div
              className='relative'
              style={{ transform: 'translate(-50%, -100%)' }}
              onMouseEnter={() => setHoveredId(m.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => handleMarkerClick(m)}
            >
              {/* 집 모양 전체 (clip-path로 지붕+몸통 일체형) */}
              <div
                className={`flex cursor-pointer flex-col items-center transition-transform duration-150 ${
                  isHovered
                    ? '-translate-y-0.5 scale-[1.03]'
                    : 'translate-y-0 scale-100'
                }`}
              >
                <div
                  className='flex flex-col items-center justify-center px-3 py-1.5 text-center text-white'
                  style={{
                    width: 68,
                    minHeight: 40,
                    backgroundColor: houseColor,
                    clipPath:
                      'polygon(50% 0, 100% 30%, 100% 100%, 0 100%, 0 30%)',
                    boxShadow: isHovered
                      ? '0 6px 14px rgba(15,23,42,0.35)'
                      : '0 4px 10px rgba(15,23,42,0.25)',
                  }}
                >
                  <div className='text-[10px] font-semibold whitespace-nowrap'>
                    {topLabel}
                  </div>
                  <div className='text-[12px] font-bold whitespace-nowrap'>
                    {bottomLabel}
                  </div>
                </div>

                {/* 아래 꼬리 */}
                <div
                  className='-mt-[2px] h-3 w-3 rotate-45'
                  style={{
                    backgroundColor: houseColor,
                    boxShadow: '0 2px 6px rgba(15,23,42,0.25)',
                  }}
                />
              </div>

              {/* hover info 카드 */}
              {isHovered && (
                <div
                  className='absolute z-[60] ml-2 w-[260px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs shadow-[0_6px_18px_rgba(15,23,42,0.32)]'
                  style={{
                    left: '110%',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                >
                  <div className='mb-1 flex items-start justify-between gap-2'>
                    <div className='flex-1'>
                      <div className='mb-0.5 text-[12px] font-semibold text-slate-900'>
                        {m.name}
                      </div>
                      <div className='text-[11px] text-slate-500'>
                        {address}
                      </div>
                    </div>
                  </div>

                  <div className='mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500'>
                    {unitCnt && <span>{unitCnt.toLocaleString()}세대</span>}
                    {buildYear && <span>준공 {buildYear}년</span>}
                    {areaPyeong && (
                      <span>
                        전용 {areaPyeong}평(≈{archArea}
                        ㎡)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CustomOverlayMap>
        );
      })}
    </>
  );
}

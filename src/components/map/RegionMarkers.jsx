import React, { useState } from 'react';
import { CustomOverlayMap } from 'react-kakao-maps-sdk';
import { useDispatch, useSelector } from 'react-redux';

import { setMapCenter, setMapLevel } from '../../store/uiSlice';

export default function RegionMarkers({ markers }) {
  const dispatch = useDispatch();
  const mapLevel = useSelector((state) => state.ui.mapLevel);
  const [hoveredId, setHoveredId] = useState(null);

  const handleMarkerClick = (marker) => {
    const newLevel = Math.max(1, mapLevel - 2);

    dispatch(setMapCenter({ lat: marker.lat, lng: marker.lng }));
    dispatch(setMapLevel(newLevel));
  };

  const formatUnit = (v) => {
    const n = Number(v ?? 0);
    if (!Number.isFinite(n)) return '0';
    return n.toLocaleString();
  };

  if (!markers || markers.length === 0) return null;

  return (
    <>
      {markers.map((m) => {
        const bgColor = '#0284c7';
        const isHovered = hoveredId === m.id;

        const zIndex = isHovered ? 9999 : 1;

        const pixelFixY = -8;

        return (
          <CustomOverlayMap
            key={m.id}
            position={{ lat: m.lat, lng: m.lng }}
            xAnchor={0.5}
            yAnchor={1.0}
            zIndex={zIndex}
          >
            <div
              className='relative cursor-pointer transition-transform duration-150 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98]'
              style={{
                transform: `translateY(${pixelFixY}px)`,
                zIndex,
              }}
              onMouseEnter={() => setHoveredId(m.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => handleMarkerClick(m)}
            >
              <div
                className='w-[130px] overflow-hidden rounded-[8px] border bg-white shadow-[0_4px_10px_rgba(15,23,42,0.22)] hover:shadow-[0_6px_14px_rgba(15,23,42,0.30)]'
                style={{ borderColor: bgColor }}
              >
                <div className='overflow-hidden px-2 py-1.5 text-center text-[13px] font-semibold tracking-[-0.01em] text-ellipsis whitespace-nowrap text-slate-900'>
                  {m.name}
                </div>
                <div
                  className='flex items-center justify-center gap-1 px-2 py-1.5 font-semibold text-white'
                  style={{ backgroundColor: bgColor }}
                >
                  <span className='text-[14px]'>
                    {formatUnit(m.unitCntSum)}세대
                  </span>
                </div>
              </div>

              <div
                className='absolute left-1/2 h-[10px] w-[10px] shadow-[0_3px_8px_rgba(15,23,42,0.25)]'
                style={{
                  bottom: -6,
                  transform: 'translateX(-50%) rotate(45deg)',
                  backgroundColor: bgColor,
                }}
              />
            </div>
          </CustomOverlayMap>
        );
      })}
    </>
  );
}

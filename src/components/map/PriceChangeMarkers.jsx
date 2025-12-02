import React from 'react';
import { CustomOverlayMap } from 'react-kakao-maps-sdk';

export default function PriceChangeMarkers({ markers }) {
  return (
    <>
      {markers.map((m) => {
        const bgColor =
          m.trend === 'up'
            ? '#0284c7'
            : m.trend === 'down'
              ? '#f43f5e'
              : '#fbbf24';

        const arrowSymbol =
          m.trend === 'up' ? '▲' : m.trend === 'down' ? '▼' : '·';

        return (
          <CustomOverlayMap
            key={m.id}
            position={{ lat: m.lat, lng: m.lng }}
            yAnchor={1}
          >
            <div
              className='relative'
              style={{ transform: 'translate(-50%, -100%)' }}
            >
              <div
                className='w-[120px] overflow-hidden rounded-[6px] border bg-white text-[11px] shadow-[0_4px_10px_rgba(15,23,42,0.22)]'
                style={{ borderColor: bgColor }}
              >
                <div className='overflow-hidden px-2 py-1 text-center font-semibold tracking-[-0.01em] text-ellipsis whitespace-nowrap text-slate-900'>
                  {m.name}
                </div>
                <div
                  className='flex items-center justify-center gap-1 px-2 py-1 font-semibold text-white'
                  style={{ backgroundColor: bgColor }}
                >
                  <span className='text-[10px]'>{arrowSymbol}</span>
                  <span className='text-[11px]'>{m.change}</span>
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

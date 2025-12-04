// 나중에 개별 상세아파트 정보를 표현해주기 위한 마커임, 변형해서 사용.
import React from 'react';
import { CustomOverlayMap } from 'react-kakao-maps-sdk';

// markers: [{ id, name, lat, lng }]
export default function RegionMarkers({ markers }) {
  if (!markers || markers.length === 0) return null;

  return (
    <>
      {markers.map((m) => (
        <CustomOverlayMap
          key={m.id}
          position={{ lat: m.lat, lng: m.lng }}
          yAnchor={1}
        >
          <div
            className='relative'
            style={{ transform: 'translate(-50%, -100%)' }}
          >
            <div className='rounded-full border border-sky-700 bg-sky-600 px-3 py-1 shadow-md'>
              <span className='text-[11px] font-semibold whitespace-nowrap text-white'>
                {m.name}
              </span>
            </div>
          </div>
        </CustomOverlayMap>
      ))}
    </>
  );
}

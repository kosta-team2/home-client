import React from 'react';
import { Map } from 'react-kakao-maps-sdk';

export default function KakaoMap({
  center,
  level = 7,
  onIdle,
  onMapReady,
  children,
}) {
  return (
    <Map
      center={center}
      level={level}
      style={{ width: '100%', height: '100%' }}
      onIdle={onIdle}
      onCreate={onMapReady}
    >
      {children}
    </Map>
  );
}

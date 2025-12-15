import React, { useState, memo } from 'react';
import { CustomOverlayMap } from 'react-kakao-maps-sdk';
import { useDispatch, useSelector } from 'react-redux';

import { setSelectedComplexId, openDetailFrom } from '../../store/uiSlice';

function formatToEok(amount) {
  if (amount == null) return '-';
  const n = Number(amount);
  if (!Number.isFinite(n)) return '-';

  const eok = n / 100000000;

  const rounded = Math.round(eok * 10) / 10;

  const text = Number.isInteger(rounded)
    ? String(rounded.toFixed(0))
    : String(rounded.toFixed(1));
  return `${text}억`;
}

function ComplexMarkers({ markers }) {
  const [hoveredId, setHoveredId] = useState(null);
  const dispatch = useDispatch();
  const sidebarMode = useSelector((state) => state.ui.sidebarMode);

  if (!markers || markers.length === 0) return null;

  const handleMarkerClick = (marker) => {
    // 이제 marker.id == parcelId 라고 보면 됨
    dispatch(setSelectedComplexId(marker.parcelId));
    dispatch(openDetailFrom(sidebarMode));
  };

  return (
    <>
      {markers.map((m) => {
        // === 좌표 ===
        const lat = Number(m.lat ?? m.latitude ?? m.latitute);
        const lng = Number(m.lng ?? m.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        const latestDealAmount =
          m.latestDealAmount ??
          m.latest_deal_amount ??
          m.latestDeal ??
          m.latest_deal;
        const unitCntSum =
          m.unitCntSum ?? m.unit_cnt_sum ?? m.unitCnt ?? m.unit_cnt;

        const priceLabel = formatToEok(latestDealAmount);
        const unitLabel =
          unitCntSum != null && Number.isFinite(Number(unitCntSum))
            ? `${Number(unitCntSum).toLocaleString()}세대`
            : '-세대';

        const isHovered = hoveredId === (m.id ?? m.parcelId ?? m.parcel_id);
        const houseColor = '#60a5fa';

        return (
          <CustomOverlayMap
            key={m.id ?? m.parcelId ?? m.parcel_id}
            position={{ lat, lng }}
            xAnchor={0.5}
            yAnchor={1.15}
          >
            <div
              className='relative'
              onMouseEnter={() =>
                setHoveredId(m.id ?? m.parcelId ?? m.parcel_id)
              }
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => handleMarkerClick(m)}
            >
              <div
                className={`flex cursor-pointer flex-col items-center transition-transform duration-150 ${
                  isHovered ? '-translate-y-0.5 scale-[1.03]' : ''
                }`}
                style={{ transformOrigin: '50% 100%' }}
              >
                <div
                  className='flex flex-col items-center justify-center px-3 text-center text-white'
                  style={{
                    width: 84,
                    minHeight: 54,
                    paddingTop: 10,
                    paddingBottom: 8,
                    backgroundColor: houseColor,
                    clipPath:
                      'polygon(50% 0, 100% 30%, 100% 100%, 0 100%, 0 30%)',
                    boxShadow: isHovered
                      ? '0 6px 14px rgba(15,23,42,0.35)'
                      : '0 4px 10px rgba(15,23,42,0.25)',
                  }}
                >
                  <div className='text-[13px] leading-none font-extrabold whitespace-nowrap'>
                    {priceLabel}
                  </div>
                  <div className='mt-1 text-[12px] leading-none font-semibold whitespace-nowrap'>
                    {unitLabel}
                  </div>
                </div>

                <div
                  className='-mt-[2px] h-3 w-3 rotate-45'
                  style={{
                    backgroundColor: houseColor,
                    boxShadow: '0 2px 6px rgba(15,23,42,0.25)',
                  }}
                />
              </div>
            </div>
          </CustomOverlayMap>
        );
      })}
    </>
  );
}

export default memo(ComplexMarkers);

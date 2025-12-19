import axiosInstance from '@axios/AxiosInstance';
import { useEffect, useMemo, useState } from 'react';

import TradeSidebar from './TradeSidebar';

// ✅ m² -> 평 변환 (1평 = 3.305785 m²)
function m2ToPyeong(m2) {
  const n = Number(m2);
  if (!Number.isFinite(n)) return null;
  return n / 3.305785;
}

// ✅ "123.4㎡ (37.3평)" 형태로 출력
function formatAreaWithPyeong(m2, options = {}) {
  const { showM2 = true, digits = 1 } = options;

  const m2Num = Number(m2);
  if (!Number.isFinite(m2Num)) return '-';

  const py = m2ToPyeong(m2Num);
  const pyRounded = py == null ? null : Math.round(py * 10) / 10;

  const pyText =
    pyRounded == null
      ? '-'
      : Number.isInteger(pyRounded)
        ? pyRounded.toFixed(0)
        : pyRounded.toFixed(digits);

  const m2Text = showM2 ? `${m2Num.toLocaleString()}㎡` : '';
  const pyPart = `(${pyText}평)`;

  return showM2 ? `${m2Text} ${pyPart}` : `${pyText}평`;
}

export default function DetailSidebar({ parcelId, onBack }) {
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const handleBack = () => {
    if (onBack) onBack();
  };

  useEffect(() => {
    if (!parcelId) return;

    const fetchDetail = async () => {
      try {
        setLoadingDetail(true);
        setDetailError(null);

        const res = await axiosInstance.get(`/api/v1/detail/${parcelId}`);
        setDetail(res.data);
      } catch (e) {
        console.error(`/api/v1/detail/${parcelId} 실패`, e);
        setDetailError('단지 정보를 불러오는데 실패했습니다.');
        setDetail(null);
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchDetail();
  }, [parcelId]);

  const formattedAddress = useMemo(() => {
    if (!detail) return '';
    return detail.address || '';
  }, [detail]);

  return (
    <div className='flex h-full flex-col bg-white'>
      {/* 헤더 */}
      <header className='flex items-center justify-between bg-[#d6f3ff] px-4 py-3 text-black'>
        <button
          type='button'
          onClick={handleBack}
          className='flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-black shadow-sm backdrop-blur transition-all duration-150 hover:-translate-y-0.5 hover:bg-white/30 hover:shadow-md active:translate-y-0'
        >
          ←
        </button>

        <div className='flex flex-1 flex-col items-center px-2'>
          <div className='max-w-[220px] truncate text-[11px] opacity-80'>
            {formattedAddress || '주소 정보 없음'}
          </div>
          <div className='mt-0.5 max-w-[220px] truncate text-sm font-semibold'>
            {detail?.tradeName}
          </div>
        </div>

        <div className='w-6' />
      </header>

      {/* 내용 */}
      <div className='flex-1 overflow-y-auto'>
        {/* 실거래 요약 / 차트 */}
        <section className='border-b border-slate-100 px-4 pt-3 pb-4'>
          <TradeSidebar parcelId={parcelId} />
        </section>

        {/* 단지 기본정보 */}
        <section className='px-4 pt-4 pb-6'>
          <h3 className='mb-2 text-[13px] font-semibold text-slate-800'>
            단지 기본정보
          </h3>

          {loadingDetail && (
            <p className='text-[12px] text-slate-400'>
              단지 정보를 불러오는 중...
            </p>
          )}

          {detailError && (
            <p className='mb-2 text-[12px] text-red-500'>{detailError}</p>
          )}

          {detail && (
            <dl className='space-y-1 text-[12px] text-slate-700'>
              <DetailRow label='주소' value={detail.address} />
              <DetailRow label='아파트명' value={detail.tradeName} />
              <DetailRow label='단지명' value={detail.name} />
              <DetailRow
                label='건축년도'
                value={detail.useDate ? `${detail.useDate}` : '-'}
              />
              <DetailRow
                label='세대수'
                value={
                  detail.unitCnt
                    ? `${detail.unitCnt.toLocaleString()}세대`
                    : '-'
                }
              />
              <DetailRow
                label='동수'
                value={detail.dongCnt ? `${detail.dongCnt}개동` : '-'}
              />

              {/* ✅ 여기부터 면적은 평수로 같이 표시 */}
              <DetailRow
                label='대지면적'
                value={
                  detail.platArea
                    ? formatAreaWithPyeong(detail.platArea, { showM2: true })
                    : '-'
                }
              />
              <DetailRow
                label='건축면적'
                value={
                  detail.archArea
                    ? formatAreaWithPyeong(detail.archArea, { showM2: true })
                    : '-'
                }
              />
              <DetailRow
                label='연면적'
                value={
                  detail.totArea
                    ? formatAreaWithPyeong(detail.totArea, { showM2: true })
                    : '-'
                }
              />

              <DetailRow
                label='건폐율'
                value={detail.bcRat ? `${detail.bcRat}%` : '-'}
              />
              <DetailRow
                label='용적률'
                value={detail.vlRat ? `${detail.vlRat}%` : '-'}
              />
            </dl>
          )}
        </section>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  if (value == null || value === 'null') return null;

  return (
    <div className='flex text-[12px]'>
      <dt className='w-20 shrink-0 text-slate-400'>{label}</dt>
      <dd className='flex-1 text-slate-700'>{value ?? '-'}</dd>
    </div>
  );
}

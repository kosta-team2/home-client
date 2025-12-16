import axiosInstance from '@axios/AxiosInstance';
import { useEffect, useMemo, useState } from 'react';

import TradeSidebar from './TradeSidebar'; // 새로운 trade 파일 import

export default function DetailSidebar({ parcelId, onBack }) {
  // /detail 데이터
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  // 단지 기본 정보 조회
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
            {detail?.tradeName || detail?.name || '단지명'}
          </div>
        </div>

        <div className='w-6' />
      </header>

      {/* 내용 */}
      <div className='flex-1 overflow-y-auto'>
        {/* 실거래 요약 / 차트 */}
        <section className='border-b border-slate-100 px-4 pt-3 pb-4'>
          {/* 여기서 TradeSidebar를 사용합니다. */}
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
              <DetailRow
                label='대지면적'
                value={
                  detail.platArea
                    ? `${detail.platArea.toLocaleString()}㎡`
                    : '-'
                }
              />
              <DetailRow
                label='건축면적'
                value={
                  detail.archArea
                    ? `${detail.archArea.toLocaleString()}㎡`
                    : '-'
                }
              />
              <DetailRow
                label='연면적'
                value={
                  detail.totArea ? `${detail.totArea.toLocaleString()}㎡` : '-'
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

// 나머지 코드 (DetailRow, formatPrice 등)

function DetailRow({ label, value }) {
  return (
    <div className='flex text-[12px]'>
      <dt className='w-20 shrink-0 text-slate-400'>{label}</dt>
      <dd className='flex-1 text-slate-700'>{value ?? '-'}</dd>
    </div>
  );
}

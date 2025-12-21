import axiosInstance from '@axios/AxiosInstance';
import { Heart, HeartOff } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { tokenStore } from '../../../auth/token';
import Toast from '../../common/Toast';
import LoginModal from '../../LoginModal';

import TradeSidebar from './TradeSidebar';

export default function DetailSidebar({ parcelId, onBack }) {
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const [favLoading, setFavLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const [toast, setToast] = useState({ open: false, msg: '' });
  const showToast = (msg) => setToast({ open: true, msg });

  const [loginOpen, setLoginOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!tokenStore.get());
  useEffect(() => tokenStore.subscribe((t) => setIsLoggedIn(!!t)), []);

  const handleBack = () => onBack?.();

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

  const checkFavorite = async () => {
    if (!parcelId) return;
    if (!isLoggedIn) {
      setIsFavorite(false);
      return;
    }

    try {
      const res = await axiosInstance.get(`/api/v1/favorites/exists`, {
        params: { parcelId },
      });
      setIsFavorite(!!res.data);
    } catch (e) {
      console.log(e);
      if (e?.response?.status === 401) setLoginOpen(true);
    }
  };

  useEffect(() => {
    checkFavorite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parcelId, isLoggedIn]);

  const formattedAddress = useMemo(() => detail?.address || '', [detail]);

  const handleToggleFavorite = async () => {
    if (!detail || !parcelId) return;

    if (!isLoggedIn) {
      setLoginOpen(true);
      return;
    }

    try {
      setFavLoading(true);

      if (!isFavorite) {
        await axiosInstance.post('/api/v1/favorites', {
          parcelId,
          complexName: detail.tradeName ?? detail.name ?? '단지',
        });
        setIsFavorite(true);
        showToast('관심지역으로 등록했습니다.');
      } else {
        const listRes = await axiosInstance.get('/api/v1/favorites');
        const found = Array.isArray(listRes.data)
          ? listRes.data.find((x) => Number(x.parcelId) === Number(parcelId))
          : null;

        if (!found?.id) {
          showToast('이미 해제된 관심지역입니다.');
          setIsFavorite(false);
          return;
        }

        await axiosInstance.delete(`/api/v1/favorites/${found.id}`);
        setIsFavorite(false);
        showToast('관심지역에서 해제했습니다.');
      }
    } catch (e) {
      console.log(e);

      if (e?.response?.status === 401) {
        setLoginOpen(true);
        return;
      }

      alert('관심지역 처리에 실패했습니다.');
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <div className='flex h-full flex-col bg-white'>
      <Toast
        open={toast.open}
        message={toast.msg}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
      />

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

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

        <button
          type='button'
          onClick={handleToggleFavorite}
          disabled={favLoading || !detail}
          className={`flex h-8 w-8 items-center justify-center rounded-full shadow-sm backdrop-blur transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 ${
            isFavorite
              ? 'bg-white/60 text-rose-500 hover:bg-white/75'
              : 'bg-white/40 text-slate-700 hover:bg-white/55'
          } ${favLoading ? 'opacity-60' : ''}`}
          title={
            !isLoggedIn
              ? '로그인 후 이용 가능합니다'
              : isFavorite
                ? '관심지역 해제'
                : '관심지역 등록'
          }
        >
          {isFavorite ? (
            <HeartOff className='h-4 w-4' />
          ) : (
            <Heart className='h-4 w-4' />
          )}
        </button>
      </header>

      <div className='flex-1 overflow-y-auto'>
        <section className='border-b border-slate-100 px-4 pt-3 pb-4'>
          <TradeSidebar parcelId={parcelId} />
        </section>

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

function DetailRow({ label, value }) {
  if (value == null || value === 'null') return null;

  return (
    <div className='flex text-[12px]'>
      <dt className='w-20 shrink-0 text-slate-400'>{label}</dt>
      <dd className='flex-1 text-slate-700'>{value ?? '-'}</dd>
    </div>
  );
}

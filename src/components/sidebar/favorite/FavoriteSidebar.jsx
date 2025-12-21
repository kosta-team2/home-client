import { Bell, BellOff, Trash2 } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  openDetailFrom,
  setMapCenter,
  setMapLevel,
  setSelectedParcelId,
} from '../../../store/uiSlice.js';
import {
  deleteFavorite,
  fetchFavorites,
  updateFavoriteAlarm,
} from '../../api/favoriteApi.js';
import Toast from '../../common/Toast';

export default function FavoriteSidebar({ onBack }) {
  const dispatch = useDispatch();
  const sidebarMode = useSelector((state) => state.ui.sidebarMode);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // ✅ 토스트
  const [toast, setToast] = useState({ open: false, msg: '' });
  const showToast = (msg) => setToast({ open: true, msg });

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);
      const list = await fetchFavorites();
      setItems(list);
    } catch (e) {
      console.log(e);
      setErr('관심지역 목록을 불러오는데 실패했습니다.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleBack = () => onBack?.();

  const handleClickItem = (f) => {
    if (Number.isFinite(Number(f.lat)) && Number.isFinite(Number(f.lng))) {
      dispatch(setMapCenter({ lat: Number(f.lat), lng: Number(f.lng) }));
      dispatch(setMapLevel(4));
    }

    dispatch(setSelectedParcelId(f.parcelId));
    dispatch(openDetailFrom(sidebarMode));
  };

  const handleToggleAlarm = async (f) => {
    try {
      const nextEnabled = !f.alarmEnabled;
      const next = await updateFavoriteAlarm(f.id, nextEnabled);
      setItems((prev) => prev.map((x) => (x.id === f.id ? next : x)));

      showToast(nextEnabled ? '알람을 켰습니다.' : '알람을 껐습니다.');
    } catch (e) {
      console.log(e);
      alert('알람 설정 변경에 실패했습니다.');
    }
  };

  const handleDelete = async (f) => {
    const ok = window.confirm('관심지역에서 삭제할까요?');
    if (!ok) return;

    try {
      await deleteFavorite(f.id);
      setItems((prev) => prev.filter((x) => x.id !== f.id));
      showToast('관심지역에서 삭제했습니다.');
    } catch (e) {
      console.log(e);
      alert('삭제에 실패했습니다.');
    }
  };

  const countLabel = useMemo(() => `${items.length}개`, [items.length]);

  return (
    <div className='flex h-full flex-col bg-white'>
      <Toast
        open={toast.open}
        message={toast.msg}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
      />

      <header className='flex items-center justify-between bg-[#d6f3ff] px-4 py-3 text-black'>
        <button
          type='button'
          onClick={handleBack}
          className='flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-black shadow-sm backdrop-blur transition-all duration-150 hover:-translate-y-0.5 hover:bg-white/30 hover:shadow-md active:translate-y-0'
        >
          ←
        </button>

        <div className='flex flex-1 flex-col items-center px-2'>
          <div className='text-[11px] opacity-80'>관심지역</div>
          <div className='mt-0.5 text-sm font-semibold'>목록 {countLabel}</div>
        </div>

        <div className='w-6' />
      </header>

      <div className='flex-1 overflow-y-auto px-4 py-4'>
        {loading && (
          <p className='text-[12px] text-slate-400'>불러오는 중...</p>
        )}
        {err && <p className='mb-2 text-[12px] text-red-500'>{err}</p>}

        {!loading && !err && items.length === 0 && (
          <div className='rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-[12px] text-slate-500'>
            아직 등록된 관심지역이 없습니다.
          </div>
        )}

        <div className='flex flex-col gap-2'>
          {items.map((f) => (
            <div
              key={f.id}
              className='group flex items-start justify-between gap-2 rounded-2xl border border-slate-100 bg-white px-3 py-3 shadow-sm hover:border-sky-200 hover:bg-sky-50/30'
            >
              <button
                type='button'
                onClick={() => handleClickItem(f)}
                className='flex flex-1 flex-col text-left'
              >
                <div className='text-[13px] font-semibold text-slate-800'>
                  {f.complexName}
                </div>
                <div className='mt-1 line-clamp-2 text-[11px] text-slate-500'>
                  {f.address}
                </div>
              </button>

              <div className='flex shrink-0 items-center gap-1'>
                <button
                  type='button'
                  onClick={() => handleToggleAlarm(f)}
                  className='inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-sky-300 hover:text-sky-600'
                  title={f.alarmEnabled ? '알람 끄기' : '알람 켜기'}
                >
                  {f.alarmEnabled ? (
                    <Bell className='h-4 w-4' />
                  ) : (
                    <BellOff className='h-4 w-4' />
                  )}
                </button>

                <button
                  type='button'
                  onClick={() => handleDelete(f)}
                  className='inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-red-300 hover:text-red-500'
                  title='삭제'
                >
                  <Trash2 className='h-4 w-4' />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

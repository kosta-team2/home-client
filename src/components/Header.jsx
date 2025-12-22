import { Bell, Heart } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { tokenStore } from '../auth/token';
import { fetchMeMini } from '../components/api/userApi';
import { NOTIFICATIONS } from '../data/mockData';
import { setSidebarMode, toggleNotifications } from '../store/uiSlice';

import LoginModal from './LoginModal';

function getInitials(name) {
  const s = (name ?? '').trim();
  if (!s) return 'U';

  const isKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(s);
  if (isKorean) return s.slice(0, 2);

  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function Header() {
  const dispatch = useDispatch();
  const showNotifications = useSelector((state) => state.ui.showNotifications);

  const [loginOpen, setLoginOpen] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(!!tokenStore.get());
  const [me, setMe] = useState(null); // { displayName, profileImage }

  useEffect(() => {
    return tokenStore.subscribe((t) => setIsLoggedIn(!!t));
  }, []);

  useEffect(() => {
    let alive = true;

    const loadMe = async () => {
      if (!isLoggedIn) {
        setMe(null);
        return;
      }
      try {
        const data = await fetchMeMini();
        if (!alive) return;
        setMe(data);
      } catch (e) {
        console.log('fetchMeMini failed:', e);
        if (!alive) return;
        setMe(null);
      }
    };

    loadMe();
    return () => {
      alive = false;
    };
  }, [isLoggedIn]);

  const displayName = me?.displayName ?? '사용자';
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  return (
    <header className='border-b border-slate-200 bg-gradient-to-r from-sky-50 via-white to-sky-100'>
      <div className='flex items-center justify-between px-8 py-3'>
        <div className='flex items-center gap-3'>
          <div className='flex h-9 w-9 items-center justify-center rounded-xl border border-sky-100 bg-white shadow-sm'>
            <svg
              className='h-6 w-6'
              viewBox='0 0 24 24'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <defs>
                <linearGradient
                  id='homeSearchGrad'
                  x1='3'
                  y1='3'
                  x2='21'
                  y2='21'
                >
                  <stop stopColor='#6EC6FF' />
                  <stop offset='1' stopColor='#3A8DFF' />
                </linearGradient>
              </defs>
              <path
                d='M3 10L12 3L21 10V20C21 20.55 20.55 21 20 21H4C3.45 21 3 20.55 3 20V10Z'
                stroke='url(#homeSearchGrad)'
                strokeWidth='2'
                strokeLinejoin='round'
              />
              <circle
                cx='12'
                cy='14'
                r='3'
                stroke='url(#homeSearchGrad)'
                strokeWidth='2'
              />
              <line
                x1='14.5'
                y1='16.5'
                x2='17'
                y2='19'
                stroke='url(#homeSearchGrad)'
                strokeWidth='2'
                strokeLinecap='round'
              />
            </svg>
          </div>

          <div className='leading-tight'>
            <div className='text-lg font-semibold tracking-tight'>홈서치</div>
            <div className='text-[11px] text-slate-500'>
              HomeSearch · 실거래가 인사이트
            </div>
          </div>
        </div>

        <div className='relative flex items-center gap-4'>
          {isLoggedIn && (
            <button
              type='button'
              onClick={() => dispatch(setSidebarMode('favorites'))}
              className='text-slate-500 hover:text-sky-600'
              title='관심지역'
            >
              <Heart className='h-5 w-5' />
            </button>
          )}

          <button
            type='button'
            onClick={() => dispatch(toggleNotifications())}
            className='text-slate-500 hover:text-sky-500'
            title='알림'
          >
            <Bell className='h-5 w-5' />
          </button>

          {showNotifications && (
            <div className='absolute top-8 right-0 z-[900] w-80 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl'>
              <div className='mb-2 flex items-center justify-between'>
                <div className='text-sm font-semibold'>알림</div>
                <button
                  className='text-[11px] text-slate-400 hover:text-sky-500'
                  type='button'
                >
                  모두 읽음 처리
                </button>
              </div>

              <div className='flex max-h-72 flex-col gap-2 overflow-y-auto pr-1'>
                {NOTIFICATIONS.map((n) => (
                  <div
                    key={n.id}
                    className='flex flex-col gap-1 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2.5'
                  >
                    <div className='flex items-center justify-between'>
                      <span className='text-xs font-semibold text-slate-800'>
                        {n.aptName}
                      </span>
                      <span className='text-[10px] text-slate-400'>
                        {n.time}
                      </span>
                    </div>
                    <p className='text-xs leading-snug text-slate-700'>
                      {n.message}
                    </p>
                    <div className='mt-0.5 flex items-center gap-1'>
                      <span className='inline-flex items-center rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-600'>
                        {n.tag}
                      </span>
                      <span className='inline-flex rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400'>
                        관심 단지
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoggedIn ? (
            <div className='flex items-center gap-2 rounded-full border border-sky-100 bg-white/80 px-3 py-1 shadow-sm'>
              {me?.profileImage ? (
                <img
                  src={me.profileImage}
                  alt='profile'
                  className='h-7 w-7 rounded-full object-cover'
                  referrerPolicy='no-referrer'
                />
              ) : (
                <div className='flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-sky-500 text-[11px] font-semibold text-white'>
                  {initials}
                </div>
              )}

              <div className='mr-1 flex flex-col leading-tight'>
                <span className='text-[11px] text-slate-400'>환영합니다</span>
                <span className='text-xs font-semibold text-slate-800'>
                  {displayName}님
                </span>
              </div>
            </div>
          ) : (
            <button
              className='rounded-full border border-sky-100 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:text-sky-600'
              onClick={() => setLoginOpen(true)}
            >
              로그인
            </button>
          )}

          <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
        </div>
      </div>
    </header>
  );
}

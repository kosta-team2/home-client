import React from 'react';

const API = import.meta.env.VITE_API_SERVER_IP;

export default function LoginModal({ open, onClose }) {
  if (!open) return null;

  const go = (provider) => {
    window.location.href = `${API}/oauth2/authorization/${provider}`;
  };

  return (
    <div className='fixed inset-0 z-[9999] flex items-center justify-center'>
      <div className='absolute inset-0 bg-black/40' onClick={onClose} />

      <div className='relative w-[520px] max-w-[92vw] rounded-2xl bg-white p-6 shadow-2xl'>
        <div className='mb-5 text-xl font-bold'>로그인</div>

        <div className='flex flex-col gap-3'>
          <button
            className='h-14 w-full rounded-2xl bg-[#FEE500] font-semibold'
            onClick={() => go('kakao')}
          >
            카카오로 로그인하기
          </button>

          <button
            className='h-14 w-full rounded-2xl bg-[#03C75A] font-semibold text-white'
            onClick={() => go('naver')}
          >
            네이버로 로그인하기
          </button>

          <button
            className='h-14 w-full rounded-2xl bg-[#4285F4] font-semibold text-white'
            onClick={() => go('google')}
          >
            구글로 로그인하기
          </button>
        </div>

        <button
          className='mt-5 w-full rounded-xl border border-slate-200 py-2 text-sm text-slate-600'
          onClick={onClose}
        >
          닫기
        </button>
      </div>
    </div>
  );
}

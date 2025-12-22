import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import axiosInstance from '../api/axiosInstance';
import { tokenStore } from '../auth/token';

export default function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axiosInstance.post('/auth/access');
        tokenStore.set(data.accessToken);
        navigate('/', { replace: true });
      } catch (e) {
        console.log(e);
        navigate('/', { replace: true });
      }
    })();
  }, [navigate]);

  return (
    <div className='flex h-screen items-center justify-center'>
      <div className='text-slate-600'>로그인 처리 중...</div>
    </div>
  );
}

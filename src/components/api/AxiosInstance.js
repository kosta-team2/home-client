import axios from 'axios';

import { tokenStore } from '../../auth/token';

const serverIp = import.meta.env.VITE_API_SERVER_IP;

const authClient = axios.create({
  baseURL: serverIp,
  timeout: 5000,
  withCredentials: true,
});

const axiosInstance = axios.create({
  baseURL: serverIp,
  timeout: 5000,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    const url = original?.url || '';
    if (url.includes('/auth/access')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;

      try {
        const { data } = await authClient.post('/auth/access');
        tokenStore.set(data.accessToken);

        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${data.accessToken}`;

        return axiosInstance(original);
      } catch (e) {
        tokenStore.clear();
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;

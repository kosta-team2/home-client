import axiosInstance from '@axios/AxiosInstance';

export async function fetchTopPrice10() {
  const res = await axiosInstance.get('/api/v1/rankings/top-price-30d');
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchTopVolumeAll() {
  const res = await axiosInstance.get('/api/v1/rankings/top-volume-30d');
  return Array.isArray(res.data) ? res.data : [];
}

import axiosInstance from '@axios/AxiosInstance';

export async function fetchMeMini() {
  const { data } = await axiosInstance.get('/api/v1/users/me');
  return data;
}

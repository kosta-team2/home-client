// src/api/favoriteApi.js
import axiosInstance from '@axios/AxiosInstance';

/**
 * FavoriteResponse:
 * {
 *   id: number,
 *   parcelId: number,
 *   complexName: string,
 *   address: string,
 *   lat: number,
 *   lng: number,
 *   alarmEnabled: boolean
 * }
 */

export async function fetchFavorites() {
  const { data } = await axiosInstance.get('/api/v1/favorites');
  return Array.isArray(data) ? data : [];
}

export async function createFavorite({ parcelId, complexName }) {
  const { data } = await axiosInstance.post('/api/v1/favorites', {
    parcelId,
    complexName,
  });
  return data;
}

export async function updateFavoriteAlarm(favoriteId, enabled) {
  const { data } = await axiosInstance.patch(
    `/api/v1/favorites/${favoriteId}/alarm`,
    { enabled },
  );
  return data;
}

export async function deleteFavorite(favoriteId) {
  await axiosInstance.delete(`/api/v1/favorites/${favoriteId}`);
}

/** 편의: 목록에서 parcelId로 favorite 찾기 */
export async function findFavoriteByParcelId(parcelId) {
  const list = await fetchFavorites();
  return list.find((x) => Number(x.parcelId) === Number(parcelId)) ?? null;
}

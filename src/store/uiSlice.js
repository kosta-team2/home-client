import { createSlice } from '@reduxjs/toolkit';

import axiosInstance from '../axiosInstance/AxiosInstance';
import { METRICS } from '../data/mockData';

const initialCenter = {
  lat: 37.5662952,
  lng: 126.9779451,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    searchText: '',
    selectedMetrics: METRICS,
    selectedSido: '경기도',
    selectedSgg: null,
    selectedEmd: null,
    showNotifications: false,
    mapCenter: initialCenter,
    mapLevel: 10,
    aggregatedMarkers: [],
    previousSidebarMode: null,
    selectedComplexId: null,
    regionMarkers: [], // 시/도, 시/군/구, 읍/면/동 집계용
    complexMarkers: [], // 단지 상세용
    searchResults: [],
    searchLoading: false,
    searchError: null,
  },
  reducers: {
    setSearchText(state, action) {
      state.searchText = action.payload;
    },
    toggleMetric(state, action) {
      const metric = action.payload;
      if (state.selectedMetrics.includes(metric)) {
        state.selectedMetrics = state.selectedMetrics.filter(
          (m) => m !== metric,
        );
      } else {
        state.selectedMetrics.push(metric);
      }
    },
    resetFilters(state) {
      state.selectedMetrics = METRICS;
      state.selectedSido = '경기도';
      state.selectedSgg = null;
      state.selectedEmd = null;
      state.searchText = '';
      state.sidebarMode = 'region-nav';
      state.previousSidebarMode = null;
    },
    selectSido(state, action) {
      state.selectedSido = action.payload;
      state.selectedSgg = null;
      state.selectedEmd = null;
    },
    selectSgg(state, action) {
      state.selectedSgg = action.payload;
      state.selectedEmd = null;
    },
    selectEmd(state, action) {
      state.selectedEmd = action.payload;
    },
    toggleNotifications(state) {
      state.showNotifications = !state.showNotifications;
    },
    setMapCenter(state, action) {
      state.mapCenter = action.payload; // { lat, lng }
    },
    setMapLevel(state, action) {
      state.mapLevel = action.payload; // number
    },

    setRegionMarkers(state, action) {
      state.regionMarkers = action.payload;
    },

    setComplexMarkers(state, action) {
      state.complexMarkers = action.payload;
    },
    setSidebarMode(state, action) {
      state.sidebarMode = action.payload;
    },
    setSelectedComplexId(state, action) {
      state.selectedComplexId = action.payload;
    },
    openDetailFrom(state, action) {
      // 마커나, 검색으로 상세페이지로 이동 시
      state.previousSidebarMode = action.payload; // 'region-nav' | 'search-list'
      state.sidebarMode = 'detail';
    },
    goBackFromDetail(state) {
      if (state.previousSidebarMode) {
        state.sidebarMode = state.previousSidebarMode;
        state.previousSidebarMode = null;
      } else {
        state.sidebarMode = 'region-nav';
      }
    },
    setSearchResults: (state, action) => {
      state.searchResults = action.payload;
    },
    setSearchLoading: (state, action) => {
      state.searchLoading = action.payload;
    },
    setSearchError: (state, action) => {
      state.searchError = action.payload;
    },
  },
});

export const {
  setSearchText,
  toggleMetric,
  resetFilters,
  selectSido,
  selectSgg,
  selectEmd,
  toggleNotifications,
  setMapCenter,
  setMapLevel,
  setAggregatedMarkers,
  setSidebarMode,
  setSelectedComplexId,
  openDetailFrom,
  goBackFromDetail,
  setRegionMarkers,
  setComplexMarkers,
  setSearchResults,
  setSearchLoading,
  setSearchError,
} = uiSlice.actions;

export const fetchSearchResults = (q) => async (dispatch) => {
  try {
    dispatch(setSearchLoading(true));
    dispatch(setSearchError(null));
    const res = await axiosInstance.get(
      `/api/v1/search/complexes?q=${encodeURIComponent(q)}`,
    );
    dispatch(setSearchResults(Array.isArray(res.data) ? res.data : []));
    console.log(res);
  } catch (e) {
    console.log(e);
    dispatch(setSearchError('검색 실패'));
    dispatch(setSearchResults([]));
  } finally {
    dispatch(setSearchLoading(false));
  }
};

export default uiSlice.reducer;

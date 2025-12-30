import { createSlice } from '@reduxjs/toolkit';

import axiosInstance from '../axiosInstance/AxiosInstance';

export const FILTER_DEFAULTS = {
  priceEok: [0, 80],
  pyeong: [0, 120],
  age: [0, 40],
  unit: [0, 5000],
};

const initialCenter = {
  lat: 37.5662952,
  lng: 126.9779451,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    searchText: '',
    selectedSido: '경기도',
    selectedSgg: null,
    selectedEmd: null,
    showNotifications: false,
    mapCenter: initialCenter,
    mapLevel: 10,
    aggregatedMarkers: [],
    sidebarMode: 'region-nav', // 'region-nav' | 'search-list' | 'detail' | 'favorites' | 'top-charts'
    previousSidebarMode: null,
    selectedParcelId: null,
    regionMarkers: [],
    complexMarkers: [],
    searchResults: [],
    searchLoading: false,
    searchError: null,
    filters: FILTER_DEFAULTS,
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
      state.selectedSido = '경기도';
      state.selectedSgg = null;
      state.selectedEmd = null;
      state.searchText = '';
      state.sidebarMode = 'region-nav';
      state.previousSidebarMode = null;
      state.filters = FILTER_DEFAULTS;
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
      state.mapCenter = action.payload;
    },
    setMapLevel(state, action) {
      state.mapLevel = action.payload;
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
    setSelectedParcelId(state, action) {
      state.selectedParcelId = action.payload;
    },
    openDetailFrom(state, action) {
      state.previousSidebarMode = action.payload;
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
    setFilterRange(state, action) {
      const { key, value } = action.payload;
      state.filters[key] = value;
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
  setSelectedParcelId,
  openDetailFrom,
  goBackFromDetail,
  setRegionMarkers,
  setComplexMarkers,
  setSearchResults,
  setSearchLoading,
  setSearchError,
  setFilterRange,
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

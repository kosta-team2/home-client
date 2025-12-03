// src/store/uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

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
    mapLevel: 7,
    aggregatedMarkers: [],
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
    setAggregatedMarkers(state, action) {
      state.aggregatedMarkers = action.payload; // 행정 구역 마커용 집계 데이터
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
} = uiSlice.actions;

export default uiSlice.reducer;

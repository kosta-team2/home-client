// src/store/index.js
import { configureStore } from '@reduxjs/toolkit';

import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
  },
});

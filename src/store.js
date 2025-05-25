// src/store.js
import { configureStore } from '@reduxjs/toolkit';
import historyReducer from './features/history/historySlice';
import itemReducer from './features/items/itemSlice';     // Added
import wheelReducer from './features/wheel/WheelSlice';   // Added

export const store = configureStore({
    reducer: {
        history: historyReducer,
        items: itemReducer,     // Added
        wheel: wheelReducer,    // Added
    },
});
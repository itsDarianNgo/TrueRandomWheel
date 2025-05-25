// src/store.js
import { configureStore } from '@reduxjs/toolkit';
import historyReducer from './features/history/historySlice';
import settingsReducer from './features/settings/settingsSlice'; // New import

export const store = configureStore({
    reducer: {
        history: historyReducer,
        settings: settingsReducer, // Add settings reducer
        // items: itemReducer, // Future: Uncomment when itemSlice is implemented
        // wheel: wheelReducer,   // Future: Uncomment when wheelSlice is implemented
    },
});
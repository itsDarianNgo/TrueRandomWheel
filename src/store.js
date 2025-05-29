// src/store.js
import { configureStore } from '@reduxjs/toolkit';
import historyReducer from './features/history/historySlice';
import itemReducer from './features/items/itemSlice';
import wheelReducer from './features/wheel/WheelSlice';
import effectsReducer from './features/effects/effectsSlice'; // New import

export const store = configureStore({
    reducer: {
        history: historyReducer,
        items: itemReducer,
        wheel: wheelReducer,
        effects: effectsReducer, // Add new reducer
    },
});
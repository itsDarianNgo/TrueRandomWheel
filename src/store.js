// src/store.js
import { configureStore } from '@reduxjs/toolkit';
import historyReducer from './features/history/historySlice';
// import itemReducer from './features/itemManagement/itemSlice'; // Future: Uncomment when itemSlice is implemented
// import wheelReducer from './features/wheel/wheelSlice';   // Future: Uncomment when wheelSlice is implemented

export const store = configureStore({
    reducer: {
        history: historyReducer,
        // items: itemReducer, // Future
        // wheel: wheelReducer,   // Future
    },
    // enhancers: (defaultEnhancers) => defaultEnhancers.concat(...) // If you need custom enhancers
    // middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(...) // If you need custom middleware
});
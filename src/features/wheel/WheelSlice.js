// src/features/wheel/wheelSlice.js
import { createSlice } from '@reduxjs/toolkit';

const WHEEL_SETTINGS_STORAGE_KEY = 'trueRandomWheel_wheelSettings';

// Helper to load settings from localStorage
const loadWheelSettingsFromStorage = () => {
    const defaultSettings = {
        pointerPosition: 'top',
        removeOnHit: false,
        shuffleCount: 3,
        spinDuration: 7000,
        minSpins: 5,
    };
    try {
        const storedSettings = localStorage.getItem(WHEEL_SETTINGS_STORAGE_KEY);
        if (storedSettings) {
            return { ...defaultSettings, ...JSON.parse(storedSettings) };
        }
    } catch (error) {
        console.error("Error loading wheel settings from localStorage:", error);
    }
    return defaultSettings;
};

// Helper to save settings to localStorage
const saveWheelSettingsToStorage = (settings) => {
    try {
        // Only persist the settings, not transient state like status or winner
        const { pointerPosition, removeOnHit, shuffleCount, spinDuration, minSpins } = settings;
        localStorage.setItem(WHEEL_SETTINGS_STORAGE_KEY, JSON.stringify({
            pointerPosition, removeOnHit, shuffleCount, spinDuration, minSpins
        }));
    } catch (error) {
        console.error("Error saving wheel settings to localStorage:", error);
    }
};

const persistedSettings = loadWheelSettingsFromStorage();

const initialState = {
    // Persisted settings
    pointerPosition: persistedSettings.pointerPosition,
    removeOnHit: persistedSettings.removeOnHit,
    shuffleCount: persistedSettings.shuffleCount, // Number of times to shuffle in "Shuffle N Times"
    spinDuration: persistedSettings.spinDuration, // Target duration for prize spin animation
    minSpins: persistedSettings.minSpins,       // Minimum full rotations during prize spin

    // Transient state (not persisted)
    wheelStatus: 'idle', // 'idle', 'preparing_spin', 'spinning', 'shuffle_animating', 'prize_landing'
    winningItemDetails: null, // { id: string, name: string, color?: string } | null
    displayWinningBanner: false,
    targetWinningItem: null, // Stores the item object PRNG selected before spin animation
};

const wheelSlice = createSlice({
    name: 'wheel',
    initialState,
    reducers: {
        setPointerPosition: (state, action) => {
            state.pointerPosition = action.payload;
            saveWheelSettingsToStorage(state);
        },
        setWheelStatus: (state, action) => {
            state.wheelStatus = action.payload;
        },
        setWinningItemDetails: (state, action) => { // Sets the details of the item that won
            state.winningItemDetails = action.payload;
        },
        setTargetWinningItem: (state, action) => { // Sets the item PRNG determined should win
            state.targetWinningItem = action.payload;
        },
        clearWinningItemDetails: (state) => { // Used when banner is closed or new spin starts
            state.winningItemDetails = null;
            state.targetWinningItem = null;
        },
        setDisplayWinningBanner: (state, action) => {
            state.displayWinningBanner = action.payload;
        },
        toggleRemoveOnHit: (state) => {
            state.removeOnHit = !state.removeOnHit;
            saveWheelSettingsToStorage(state);
        },
        setShuffleCount: (state, action) => {
            const count = parseInt(action.payload, 10);
            state.shuffleCount = isNaN(count) || count < 1 ? 1 : count;
            saveWheelSettingsToStorage(state);
        },
        setSpinParameters: (state, action) => { // Example for future settings
            const { duration, spins } = action.payload;
            if (typeof duration === 'number' && duration > 0) state.spinDuration = duration;
            if (typeof spins === 'number' && spins > 0) state.minSpins = spins;
            saveWheelSettingsToStorage(state);
        },
    },
});

export const {
    setPointerPosition,
    setWheelStatus,
    setWinningItemDetails,
    setTargetWinningItem,
    clearWinningItemDetails,
    setDisplayWinningBanner,
    toggleRemoveOnHit,
    setShuffleCount,
    setSpinParameters,
} = wheelSlice.actions;

// Selectors
export const selectWheelSettings = (state) => ({
    pointerPosition: state.wheel.pointerPosition,
    removeOnHit: state.wheel.removeOnHit,
    shuffleCount: state.wheel.shuffleCount,
    spinDuration: state.wheel.spinDuration,
    minSpins: state.wheel.minSpins,
});
export const selectWheelStatus = (state) => state.wheel.wheelStatus;
export const selectWinningItemDetails = (state) => state.wheel.winningItemDetails;
export const selectDisplayWinningBanner = (state) => state.wheel.displayWinningBanner;
export const selectTargetWinningItem = (state) => state.wheel.targetWinningItem;
export const selectRemoveOnHit = (state) => state.wheel.removeOnHit;


export default wheelSlice.reducer;
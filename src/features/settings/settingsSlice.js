// src/features/settings/settingsSlice.js
import { createSlice } from '@reduxjs/toolkit';

const SETTINGS_STORAGE_KEY = 'trueRandomWheel_settings';

// Helper to load settings from localStorage
const loadSettingsFromStorage = () => {
    try {
        const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (storedSettings) {
            const parsedSettings = JSON.parse(storedSettings);
            // Ensure it's an object, could add more validation if needed
            if (typeof parsedSettings === 'object' && parsedSettings !== null) {
                return parsedSettings;
            }
        }
    } catch (error) {
        console.error("Error loading settings from localStorage:", error);
    }
    return {}; // Return empty object if nothing stored, error, or invalid format
};

const initialStoredSettings = loadSettingsFromStorage();

const initialState = {
    // Add other settings here as they are migrated or created
    // e.g., pointerPosition: initialStoredSettings?.pointerPosition || 'top',
    // e.g., removeOnHit: initialStoredSettings?.removeOnHit || false,
    wheelBackgroundImageURL: initialStoredSettings?.wheelBackgroundImageURL || null,
};

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        setWheelBackgroundImage: (state, action) => {
            state.wheelBackgroundImageURL = action.payload; // payload is Data URL or null

            // Persist the entire settings object (or at least the relevant part)
            const currentSettingsToSave = { ...initialStoredSettings, ...state }; // Merge with potentially other loaded settings
            currentSettingsToSave.wheelBackgroundImageURL = action.payload; // Ensure this specific one is updated
            try {
                localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(currentSettingsToSave));
            } catch (error) {
                console.error("Error saving background image URL to localStorage:", error);
            }
        },
        clearWheelBackgroundImage: (state) => {
            state.wheelBackgroundImageURL = null;

            const currentSettingsToSave = { ...initialStoredSettings, ...state };
            currentSettingsToSave.wheelBackgroundImageURL = null; // Explicitly set to null as per Critibot's recommendation
                                                                  // Could also use `delete currentSettingsToSave.wheelBackgroundImageURL;` if key absence is preferred
            try {
                localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(currentSettingsToSave));
            } catch (error) {
                console.error("Error clearing background image URL from localStorage:", error);
            }
        },
        // Example for future settings:
        // setPointerPosition: (state, action) => {
        //     state.pointerPosition = action.payload;
        //     // TODO: Add localStorage persistence logic similar to above
        // },
    },
});

export const {
    setWheelBackgroundImage,
    clearWheelBackgroundImage,
    // export setPointerPosition, etc. when added
} = settingsSlice.actions;

// Selectors
export const selectWheelBackgroundImageURL = (state) => state.settings.wheelBackgroundImageURL;
// export const selectPointerPosition = (state) => state.settings.pointerPosition; // Future

export default settingsSlice.reducer;
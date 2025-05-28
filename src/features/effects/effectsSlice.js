// src/features/effects/effectsSlice.js
import { createSlice } from '@reduxjs/toolkit';

const EFFECTS_STORAGE_KEY = 'trueRandomWheel_tagEffects';

const loadEffectsFromStorage = () => {
    try {
        const storedEffects = localStorage.getItem(EFFECTS_STORAGE_KEY);
        if (storedEffects) {
            const parsed = JSON.parse(storedEffects);
            // Basic validation: ensure it's an object
            if (typeof parsed === 'object' && parsed !== null) {
                return parsed;
            }
        }
    } catch (error) {
        console.error("[effectsSlice] Error loading tagEffects from localStorage:", error);
    }
    return {}; // Default to an empty object
};

const saveEffectsToStorage = (tagEffects) => {
    try {
        localStorage.setItem(EFFECTS_STORAGE_KEY, JSON.stringify(tagEffects));
    } catch (error) {
        console.error("[effectsSlice] Error saving tagEffects to localStorage:", error);
    }
};

const initialState = {
    tagEffects: loadEffectsFromStorage(),
    // e.g., { "rare": { soundUrl: "...", gifUrl: "..." } }
};

const effectsSlice = createSlice({
    name: 'effects',
    initialState,
    reducers: {
        setTagEffect: (state, action) => {
            const { tag, effectType, url } = action.payload; // url can be string or null
            const lowerTag = tag.toLowerCase();

            if (!state.tagEffects[lowerTag]) {
                state.tagEffects[lowerTag] = { soundUrl: null, gifUrl: null };
            }

            if (effectType === 'sound') {
                state.tagEffects[lowerTag].soundUrl = url || null;
            } else if (effectType === 'gif') {
                state.tagEffects[lowerTag].gifUrl = url || null;
            }

            // Clean up tag entry if both effects are null
            if (state.tagEffects[lowerTag].soundUrl === null && state.tagEffects[lowerTag].gifUrl === null) {
                delete state.tagEffects[lowerTag];
            }
            saveEffectsToStorage(state.tagEffects);
        },
        clearAllEffectsForTag: (state, action) => {
            const { tag } = action.payload;
            delete state.tagEffects[tag.toLowerCase()];
            saveEffectsToStorage(state.tagEffects);
        },
        // loadInitialEffects: (state, action) => { // Used if initial load is complex, not needed here
        //  state.tagEffects = action.payload;
        // }
    },
});

export const { setTagEffect, clearAllEffectsForTag } = effectsSlice.actions;

export const selectTagEffects = (state) => state.effects.tagEffects;
// Selector to get effects for a specific tag, useful in thunks or components
export const selectEffectsForSpecificTag = (state, tag) => {
    const lowerTag = tag.toLowerCase();
    return state.effects.tagEffects[lowerTag] || { soundUrl: null, gifUrl: null };
};

export default effectsSlice.reducer;
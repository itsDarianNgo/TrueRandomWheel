// src/features/wheel/WheelSlice.js
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import PRNG from '../../core/prng/PRNGModule';
import { addHistoryEntry } from '../history/historySlice';
import { setItems, removeItemInstance } from '../items/itemSlice';

const WHEEL_SETTINGS_STORAGE_KEY = 'trueRandomWheel_wheelSettings';
const SHUFFLE_STEP_DELAY_MS = 100;

// Default enhanced pointer color if none is set by user or in storage
const DEFAULT_CUSTOM_POINTER_COLOR = '#FFC107'; // Amber

const loadWheelSettingsFromStorage = () => {
    const defaultSettings = {
        pointerPosition: 'top', // Default from earlier state if any
        removeOnHit: false,
        shuffleCount: 3,
        spinDuration: 7000,
        minSpins: 5,
        pageBackgroundImageUrl: null,
        wheelSurfaceImageUrl: null,
        segmentOpacity: 0.85,
        customPointerColor: DEFAULT_CUSTOM_POINTER_COLOR, // ***** NEW *****
    };
    try {
        const storedSettings = localStorage.getItem(WHEEL_SETTINGS_STORAGE_KEY);
        if (storedSettings) {
            const parsed = JSON.parse(storedSettings);
            // Ensure all keys from defaultSettings are present, applying defaults if missing
            return {
                ...defaultSettings,
                ...parsed,
                // Explicitly ensure customPointerColor uses default if parsed one is invalid/missing
                customPointerColor: parsed.customPointerColor || defaultSettings.customPointerColor,
                segmentOpacity: typeof parsed.segmentOpacity === 'number' ? parsed.segmentOpacity : defaultSettings.segmentOpacity,
            };
        }
    } catch (error) {
        console.error("Error loading wheel settings from localStorage:", error);
    }
    return defaultSettings;
};

const saveWheelSettingsToStorage = (settings) => {
    try {
        // Destructure all settings that should be persisted
        const {
            pointerPosition, removeOnHit, shuffleCount, spinDuration, minSpins,
            pageBackgroundImageUrl, wheelSurfaceImageUrl, segmentOpacity,
            customPointerColor // ***** NEW *****
        } = settings;
        localStorage.setItem(WHEEL_SETTINGS_STORAGE_KEY, JSON.stringify({
            pointerPosition, removeOnHit, shuffleCount, spinDuration, minSpins,
            pageBackgroundImageUrl, wheelSurfaceImageUrl, segmentOpacity,
            customPointerColor // ***** NEW *****
        }));
    } catch (error) {
        console.error("Error saving wheel settings to localStorage:", error);
    }
};

const persistedSettings = loadWheelSettingsFromStorage();

const initialState = {
    // All settings now sourced from persistedSettings which includes defaults
    ...persistedSettings,
    wheelStatus: 'idle',
    winningItemDetails: null,
    displayWinningBanner: false,
    targetWinningItem: null,
    ephemeralEffect: null,
};

// Thunks (spinWheelThunk, finalizeSpinThunk, confirmWinningSpinThunk, voidLastSpinThunk, performShuffleThunk)
// remain IDENTICAL to Response #8 (with their logging and effect handling). No changes needed in thunks for this feature.
// ... (Thunks from Response #8 would be here) ...
export const spinWheelThunk = createAsyncThunk( /* ... from Response #8 ... */ 'wheel/spinWheel', async (_, { dispatch, getState }) => { console.log('[spinWheelThunk] Initiating spin...'); dispatch(wheelSlice.actions.setWheelStatus('preparing_spin')); dispatch(wheelSlice.actions.clearWinningItemDetails()); dispatch(wheelSlice.actions.clearEphemeralEffect()); const allItems = getState().items.items; if (allItems.length === 0) { console.warn('[spinWheelThunk] No items on the wheel.'); dispatch(wheelSlice.actions.setWheelStatus('idle')); return { error: "No items on the wheel." }; } const winningItemFromPRNG = PRNG.selectRandomItemFromArray(allItems); if (!winningItemFromPRNG) { console.error('[spinWheelThunk] PRNG failed to select a winner.'); dispatch(wheelSlice.actions.setWheelStatus('idle')); return { error: "Failed to determine a winner using PRNG." }; } console.log('[spinWheelThunk] Target winner selected by PRNG:', winningItemFromPRNG.name, winningItemFromPRNG.id); dispatch(wheelSlice.actions.setTargetWinningItem(winningItemFromPRNG)); dispatch(wheelSlice.actions.setWheelStatus('spinning')); return { success: true, targetName: winningItemFromPRNG.name }; });
export const finalizeSpinThunk = createAsyncThunk( /* ... from Response #8 ... */ 'wheel/finalizeSpin', async (payload, { dispatch, getState }) => { const { confirmedLandedItem, errorInfo } = payload; console.log('[finalizeSpinThunk] Finalizing spin. Landed item from canvas:', confirmedLandedItem, 'Error info:', errorInfo); if (errorInfo) { console.error("[finalizeSpinThunk] Error reported from WheelCanvas:", errorInfo.error); dispatch(wheelSlice.actions.setWheelStatus('idle')); dispatch(wheelSlice.actions.clearWinningItemDetails()); dispatch(wheelSlice.actions.clearEphemeralEffect()); return { error: errorInfo.error }; } const targetItem = getState().wheel.targetWinningItem; if (!confirmedLandedItem) { console.error("[finalizeSpinThunk] No landed item data received from canvas."); dispatch(wheelSlice.actions.setWheelStatus('idle')); dispatch(wheelSlice.actions.clearWinningItemDetails()); dispatch(wheelSlice.actions.clearEphemeralEffect()); return { error: "No landed item reported by canvas." }; } if (targetItem && confirmedLandedItem.id !== targetItem.id) { console.warn(`[finalizeSpinThunk] Discrepancy: Target item was '${targetItem.name}' (ID: ${targetItem.id}), but canvas landed on '${confirmedLandedItem.name}' (ID: ${confirmedLandedItem.id}). Trusting canvas result.`);} const allConfiguredEffects = getState().effects.tagEffects; console.log('[finalizeSpinThunk] All configured effects:', JSON.parse(JSON.stringify(allConfiguredEffects))); let soundToPlay = null; let gifToDisplay = null; if (confirmedLandedItem.tags && confirmedLandedItem.tags.length > 0) { console.log(`[finalizeSpinThunk] Winner '${confirmedLandedItem.name}' has tags:`, confirmedLandedItem.tags); for (const tag of confirmedLandedItem.tags) { const lowerTag = tag.toLowerCase(); const effectsForTag = allConfiguredEffects[lowerTag]; console.log(`[finalizeSpinThunk] Checking effects for tag '${lowerTag}':`, effectsForTag); if (effectsForTag) { if (!soundToPlay && effectsForTag.soundUrl) { soundToPlay = effectsForTag.soundUrl; console.log(`[finalizeSpinThunk] Found sound for tag '${lowerTag}': ${soundToPlay}`); } if (!gifToDisplay && effectsForTag.gifUrl) { gifToDisplay = effectsForTag.gifUrl; console.log(`[finalizeSpinThunk] Found GIF for tag '${lowerTag}': ${gifToDisplay}`); } if (soundToPlay && gifToDisplay) break; } } } else { console.log(`[finalizeSpinThunk] Winner '${confirmedLandedItem.name}' has no tags.`); } if (soundToPlay) { console.log(`[finalizeSpinThunk] Attempting to play sound: ${soundToPlay}`); try { const audio = new Audio(soundToPlay); audio.play().then(() => { console.log(`[finalizeSpinThunk] Sound effect '${soundToPlay}' playback started.`); }).catch(e => { console.warn(`[finalizeSpinThunk] Error playing sound effect '${soundToPlay}':`, e); }); } catch (e) { console.error(`[finalizeSpinThunk] Error creating Audio object for '${soundToPlay}':`, e); } } else { console.log(`[finalizeSpinThunk] No sound effect to play for this winner.`); } if (gifToDisplay) { console.log(`[finalizeSpinThunk] Setting ephemeral GIF effect: ${gifToDisplay}`); dispatch(wheelSlice.actions.setEphemeralEffect({ type: 'gif', url: gifToDisplay })); } else { console.log(`[finalizeSpinThunk] No GIF effect to display for this winner. Clearing any existing.`); dispatch(wheelSlice.actions.clearEphemeralEffect()); } dispatch(wheelSlice.actions.setWinningItemDetails(confirmedLandedItem)); dispatch(wheelSlice.actions.setDisplayWinningBanner(true)); dispatch(wheelSlice.actions.setWheelStatus('prize_landing')); return { success: true, pendingWinnerName: confirmedLandedItem.name }; });
export const confirmWinningSpinThunk = createAsyncThunk( /* ... from Response #8 ... */ 'wheel/confirmWinningSpin', async (_, { dispatch, getState }) => { const { winningItemDetails: currentWinner, removeOnHit } = getState().wheel; console.log('[confirmWinningSpinThunk] Confirming win for:', currentWinner?.name); if (!currentWinner) { console.error("[confirmWinningSpinThunk] No current winner details found to confirm."); dispatch(wheelSlice.actions.setDisplayWinningBanner(false)); dispatch(wheelSlice.actions.clearEphemeralEffect()); dispatch(wheelSlice.actions.setWheelStatus('idle')); return { error: "No winner to confirm." }; } dispatch(addHistoryEntry({ name: currentWinner.name, color: currentWinner.color })); if (removeOnHit && currentWinner.id) { console.log(`[confirmWinningSpinThunk] Removing item ID '${currentWinner.id}' due to RemoveOnHit.`); dispatch(removeItemInstance(currentWinner.id)); } dispatch(wheelSlice.actions.setDisplayWinningBanner(false)); dispatch(wheelSlice.actions.clearEphemeralEffect()); dispatch(wheelSlice.actions.clearWinningItemDetails()); dispatch(wheelSlice.actions.setWheelStatus('idle')); return { success: true, confirmedWinnerName: currentWinner.name }; });
export const voidLastSpinThunk = createAsyncThunk( /* ... from Response #8 ... */ 'wheel/voidLastSpin', async (_, { dispatch, getState }) => { const { winningItemDetails: currentWinner } = getState().wheel; console.log('[voidLastSpinThunk] Voiding spin for:', currentWinner?.name); dispatch(wheelSlice.actions.setDisplayWinningBanner(false)); dispatch(wheelSlice.actions.clearEphemeralEffect()); dispatch(wheelSlice.actions.clearWinningItemDetails()); dispatch(wheelSlice.actions.setWheelStatus('idle')); return { success: true, voidedItemName: currentWinner ? currentWinner.name : null }; });
export const performShuffleThunk = createAsyncThunk( /* ... from Response #8 ... */ 'wheel/performShuffle', async (payload, { dispatch, getState }) => { const currentItems = getState().items.items; if (currentItems.length < 2) { return { success: false, reason: "Not enough items to shuffle." }; } dispatch(wheelSlice.actions.setWheelStatus('shuffle_animating')); let itemsToShuffle = [...currentItems]; const shuffleIterations = payload.shuffleType === 'quick' ? 1 : getState().wheel.shuffleCount; for (let i = 0; i < shuffleIterations; i++) { PRNG.shuffleArray(itemsToShuffle); if (payload.shuffleType === 'N_times' && shuffleIterations > 1) { dispatch(setItems(itemsToShuffle.map(item => ({...item})))); if (i < shuffleIterations - 1) { await new Promise(resolve => setTimeout(resolve, SHUFFLE_STEP_DELAY_MS)); } } } dispatch(setItems(itemsToShuffle.map(item => ({...item})))); await new Promise(resolve => setTimeout(resolve, 50)); dispatch(wheelSlice.actions.setWheelStatus('idle')); return { success: true, iterations: shuffleIterations }; });


const wheelSlice = createSlice({
    name: 'wheel',
    initialState,
    reducers: {
        setPointerPosition: (state, action) => { state.pointerPosition = action.payload; saveWheelSettingsToStorage(state); },
        setWheelStatus: (state, action) => { state.wheelStatus = action.payload; },
        setWinningItemDetails: (state, action) => { state.winningItemDetails = action.payload; },
        setTargetWinningItem: (state, action) => { state.targetWinningItem = action.payload; },
        clearWinningItemDetails: (state) => { state.winningItemDetails = null; state.targetWinningItem = null; },
        setDisplayWinningBanner: (state, action) => { state.displayWinningBanner = action.payload; },
        toggleRemoveOnHit: (state) => { state.removeOnHit = !state.removeOnHit; saveWheelSettingsToStorage(state); },
        setShuffleCount: (state, action) => { const count = parseInt(action.payload, 10); state.shuffleCount = isNaN(count) || count < 1 ? 1 : count; saveWheelSettingsToStorage(state); },
        setSpinParameters: (state, action) => { const { duration, spins } = action.payload; if (typeof duration === 'number' && duration > 0) state.spinDuration = duration; if (typeof spins === 'number' && spins > 0) state.minSpins = spins; saveWheelSettingsToStorage(state); },
        setPageBackgroundImageUrl: (state, action) => { state.pageBackgroundImageUrl = action.payload; saveWheelSettingsToStorage(state); },
        setWheelSurfaceImageUrl: (state, action) => { state.wheelSurfaceImageUrl = action.payload; saveWheelSettingsToStorage(state); },
        setSegmentOpacity: (state, action) => { let newOpacity = parseFloat(action.payload); if (isNaN(newOpacity) || newOpacity < 0) newOpacity = 0; if (newOpacity > 1) newOpacity = 1; state.segmentOpacity = newOpacity; saveWheelSettingsToStorage(state); },
        setEphemeralEffect: (state, action) => { state.ephemeralEffect = action.payload; },
        clearEphemeralEffect: (state) => { state.ephemeralEffect = null; },
        // ***** NEW REDUCER *****
        setCustomPointerColor: (state, action) => {
            // Basic validation for hex color string could be added here if desired
            // e.g., if (!/^#([0-9A-Fa-f]{3}){1,2}$/.test(action.payload) && action.payload !== null) { return; }
            state.customPointerColor = action.payload;
            saveWheelSettingsToStorage(state);
        },
    },
    extraReducers: (builder) => { // Unchanged from Response #8
        builder .addCase(spinWheelThunk.rejected, (state, action) => { console.error("spinWheelThunk rejected:", action.error ? action.error.message : 'Unknown error during spinWheelThunk'); state.wheelStatus = 'idle'; }) .addCase(finalizeSpinThunk.rejected, (state, action) => { console.error("finalizeSpinThunk rejected:", action.error ? action.error.message : 'Unknown error during finalizeSpinThunk'); state.wheelStatus = 'idle'; state.ephemeralEffect = null; }) .addCase(performShuffleThunk.rejected, (state, action) => { console.error("performShuffleThunk rejected:", action.error ? action.error.message : 'Unknown error during performShuffleThunk'); state.wheelStatus = 'idle'; }) .addCase(confirmWinningSpinThunk.rejected, (state, action) => { console.error("confirmWinningSpinThunk rejected:", action.error ? action.error.message : 'Unknown error during confirmWinningSpinThunk'); state.wheelStatus = 'idle'; state.displayWinningBanner = false; state.ephemeralEffect = null;}) .addCase(voidLastSpinThunk.rejected, (state, action) => { console.error("voidLastSpinThunk rejected:", action.error ? action.error.message : 'Unknown error during voidLastSpinThunk'); state.wheelStatus = 'idle'; state.displayWinningBanner = false; state.ephemeralEffect = null;});
    }
});

// Actions
export const {
    setPointerPosition, setWheelStatus, setWinningItemDetails, setTargetWinningItem,
    clearWinningItemDetails, setDisplayWinningBanner, toggleRemoveOnHit,
    setShuffleCount, setSpinParameters,
    setPageBackgroundImageUrl, setWheelSurfaceImageUrl, setSegmentOpacity,
    setEphemeralEffect, clearEphemeralEffect,
    setCustomPointerColor // ***** EXPORT NEW ACTION *****
} = wheelSlice.actions;

// Selectors
const selectWheelSlice = (state) => state.wheel;
export const selectWheelSettings = createSelector( // Keep this selector for general wheel operational settings
    [selectWheelSlice],
    (wheel) => ({
        pointerPosition: wheel.pointerPosition,
        removeOnHit: wheel.removeOnHit,
        shuffleCount: wheel.shuffleCount,
        spinDuration: wheel.spinDuration,
        minSpins: wheel.minSpins,
        // customPointerColor is NOT part of these "operational" settings, selected separately
    })
);
export const selectWheelStatus = (state) => state.wheel.wheelStatus;
export const selectWinningItemDetails = (state) => state.wheel.winningItemDetails;
export const selectDisplayWinningBanner = (state) => state.wheel.displayWinningBanner;
export const selectTargetWinningItem = (state) => state.wheel.targetWinningItem;
export const selectRemoveOnHit = (state) => state.wheel.removeOnHit;
export const selectPageBackgroundImageUrl = (state) => state.wheel.pageBackgroundImageUrl;
export const selectWheelSurfaceImageUrl = (state) => state.wheel.wheelSurfaceImageUrl;
export const selectPointerPosition = (state) => state.wheel.pointerPosition;
export const selectMinSpins = (state) => state.wheel.minSpins;
export const selectSpinDuration = (state) => state.wheel.spinDuration;
export const selectShuffleCountValue = (state) => state.wheel.shuffleCount;
export const selectSegmentOpacity = (state) => state.wheel.segmentOpacity;
export const selectEphemeralEffect = (state) => state.wheel.ephemeralEffect;
export const selectCustomPointerColor = (state) => state.wheel.customPointerColor; // ***** NEW SELECTOR *****

export default wheelSlice.reducer;
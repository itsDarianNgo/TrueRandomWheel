// src/features/wheel/WheelSlice.js
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import PRNG from '../../core/prng/PRNGModule';
import { addHistoryEntry } from '../history/historySlice';
import { setItems, removeItemInstance } from '../items/itemSlice';

const WHEEL_SETTINGS_STORAGE_KEY = 'trueRandomWheel_wheelSettings';
const SHUFFLE_STEP_DELAY_MS = 100;
const DEFAULT_CUSTOM_POINTER_COLOR = '#FFC107'; // Amber
const DEFAULT_SPIN_DURATION_MS = 7000; // 7 seconds
const MIN_SPIN_DURATION_MS = 1000; // 1 second
const MAX_SPIN_DURATION_MS = 60000; // 60 seconds

const loadWheelSettingsFromStorage = () => {
    const defaultSettings = {
        pointerPosition: 'top',
        removeOnHit: false,
        shuffleCount: 3,
        spinDuration: DEFAULT_SPIN_DURATION_MS, // ***** USE CONSTANT *****
        minSpins: 5,
        pageBackgroundImageUrl: null,
        wheelSurfaceImageUrl: null,
        segmentOpacity: 0.85,
        customPointerColor: DEFAULT_CUSTOM_POINTER_COLOR,
    };
    try {
        const storedSettings = localStorage.getItem(WHEEL_SETTINGS_STORAGE_KEY);
        if (storedSettings) {
            const parsed = JSON.parse(storedSettings);
            return {
                ...defaultSettings,
                ...parsed,
                customPointerColor: parsed.customPointerColor || defaultSettings.customPointerColor,
                segmentOpacity: typeof parsed.segmentOpacity === 'number' ? parsed.segmentOpacity : defaultSettings.segmentOpacity,
                // Ensure spinDuration from storage is validated or defaults
                spinDuration: (typeof parsed.spinDuration === 'number' && parsed.spinDuration >= MIN_SPIN_DURATION_MS && parsed.spinDuration <= MAX_SPIN_DURATION_MS)
                    ? parsed.spinDuration
                    : defaultSettings.spinDuration,
            };
        }
    } catch (error) {
        console.error("Error loading wheel settings from localStorage:", error);
    }
    return defaultSettings;
};

// saveWheelSettingsToStorage already includes spinDuration. No change needed here if structure is flat.
const saveWheelSettingsToStorage = (settings) => {
    try {
        const {
            pointerPosition, removeOnHit, shuffleCount, spinDuration, minSpins,
            pageBackgroundImageUrl, wheelSurfaceImageUrl, segmentOpacity,
            customPointerColor
        } = settings;
        localStorage.setItem(WHEEL_SETTINGS_STORAGE_KEY, JSON.stringify({
            pointerPosition, removeOnHit, shuffleCount, spinDuration, minSpins,
            pageBackgroundImageUrl, wheelSurfaceImageUrl, segmentOpacity,
            customPointerColor
        }));
    } catch (error) {
        console.error("Error saving wheel settings to localStorage:", error);
    }
};

const persistedSettings = loadWheelSettingsFromStorage();
const initialState = { ...persistedSettings, wheelStatus: 'idle', winningItemDetails: null, displayWinningBanner: false, targetWinningItem: null, ephemeralEffect: null };

// Thunks (spinWheelThunk, etc.) remain IDENTICAL to Response #8 / #28
// ... (Thunks from Response #28) ...
export const spinWheelThunk = createAsyncThunk( /* ... from Response #28 ... */ 'wheel/spinWheel', async (_, { dispatch, getState }) => { console.log('[spinWheelThunk] Initiating spin...'); dispatch(wheelSlice.actions.setWheelStatus('preparing_spin')); dispatch(wheelSlice.actions.clearWinningItemDetails()); dispatch(wheelSlice.actions.clearEphemeralEffect()); const allItems = getState().items.items; if (allItems.length === 0) { console.warn('[spinWheelThunk] No items on the wheel.'); dispatch(wheelSlice.actions.setWheelStatus('idle')); return { error: "No items on the wheel." }; } const winningItemFromPRNG = PRNG.selectRandomItemFromArray(allItems); if (!winningItemFromPRNG) { console.error('[spinWheelThunk] PRNG failed to select a winner.'); dispatch(wheelSlice.actions.setWheelStatus('idle')); return { error: "Failed to determine a winner using PRNG." }; } console.log('[spinWheelThunk] Target winner selected by PRNG:', winningItemFromPRNG.name, winningItemFromPRNG.id); dispatch(wheelSlice.actions.setTargetWinningItem(winningItemFromPRNG)); dispatch(wheelSlice.actions.setWheelStatus('spinning')); return { success: true, targetName: winningItemFromPRNG.name }; });
export const finalizeSpinThunk = createAsyncThunk( /* ... from Response #28 ... */ 'wheel/finalizeSpin', async (payload, { dispatch, getState }) => { const { confirmedLandedItem, errorInfo } = payload; console.log('[finalizeSpinThunk] Finalizing spin. Landed item from canvas:', confirmedLandedItem, 'Error info:', errorInfo); if (errorInfo) { console.error("[finalizeSpinThunk] Error reported from WheelCanvas:", errorInfo.error); dispatch(wheelSlice.actions.setWheelStatus('idle')); dispatch(wheelSlice.actions.clearWinningItemDetails()); dispatch(wheelSlice.actions.clearEphemeralEffect()); return { error: errorInfo.error }; } const targetItem = getState().wheel.targetWinningItem; if (!confirmedLandedItem) { console.error("[finalizeSpinThunk] No landed item data received from canvas."); dispatch(wheelSlice.actions.setWheelStatus('idle')); dispatch(wheelSlice.actions.clearWinningItemDetails()); dispatch(wheelSlice.actions.clearEphemeralEffect()); return { error: "No landed item reported by canvas." }; } if (targetItem && confirmedLandedItem.id !== targetItem.id) { console.warn(`[finalizeSpinThunk] Discrepancy: Target item was '${targetItem.name}' (ID: ${targetItem.id}), but canvas landed on '${confirmedLandedItem.name}' (ID: ${confirmedLandedItem.id}). Trusting canvas result.`);} const allConfiguredEffects = getState().effects.tagEffects; console.log('[finalizeSpinThunk] All configured effects:', JSON.parse(JSON.stringify(allConfiguredEffects))); let soundToPlay = null; let gifToDisplay = null; if (confirmedLandedItem.tags && confirmedLandedItem.tags.length > 0) { console.log(`[finalizeSpinThunk] Winner '${confirmedLandedItem.name}' has tags:`, confirmedLandedItem.tags); for (const tag of confirmedLandedItem.tags) { const lowerTag = tag.toLowerCase(); const effectsForTag = allConfiguredEffects[lowerTag]; console.log(`[finalizeSpinThunk] Checking effects for tag '${lowerTag}':`, effectsForTag); if (effectsForTag) { if (!soundToPlay && effectsForTag.soundUrl) { soundToPlay = effectsForTag.soundUrl; console.log(`[finalizeSpinThunk] Found sound for tag '${lowerTag}': ${soundToPlay}`); } if (!gifToDisplay && effectsForTag.gifUrl) { gifToDisplay = effectsForTag.gifUrl; console.log(`[finalizeSpinThunk] Found GIF for tag '${lowerTag}': ${gifToDisplay}`); } if (soundToPlay && gifToDisplay) break; } } } else { console.log(`[finalizeSpinThunk] Winner '${confirmedLandedItem.name}' has no tags.`); } if (soundToPlay) { console.log(`[finalizeSpinThunk] Attempting to play sound: ${soundToPlay}`); try { const audio = new Audio(soundToPlay); audio.play().then(() => { console.log(`[finalizeSpinThunk] Sound effect '${soundToPlay}' playback started.`); }).catch(e => { console.warn(`[finalizeSpinThunk] Error playing sound effect '${soundToPlay}':`, e); }); } catch (e) { console.error(`[finalizeSpinThunk] Error creating Audio object for '${soundToPlay}':`, e); } } else { console.log(`[finalizeSpinThunk] No sound effect to play for this winner.`); } if (gifToDisplay) { console.log(`[finalizeSpinThunk] Setting ephemeral GIF effect: ${gifToDisplay}`); dispatch(wheelSlice.actions.setEphemeralEffect({ type: 'gif', url: gifToDisplay })); } else { console.log(`[finalizeSpinThunk] No GIF effect to display for this winner. Clearing any existing.`); dispatch(wheelSlice.actions.clearEphemeralEffect()); } dispatch(wheelSlice.actions.setWinningItemDetails(confirmedLandedItem)); dispatch(wheelSlice.actions.setDisplayWinningBanner(true)); dispatch(wheelSlice.actions.setWheelStatus('prize_landing')); return { success: true, pendingWinnerName: confirmedLandedItem.name }; });
export const confirmWinningSpinThunk = createAsyncThunk( /* ... from Response #28 ... */ 'wheel/confirmWinningSpin', async (_, { dispatch, getState }) => { const { winningItemDetails: currentWinner, removeOnHit } = getState().wheel; console.log('[confirmWinningSpinThunk] Confirming win for:', currentWinner?.name); if (!currentWinner) { console.error("[confirmWinningSpinThunk] No current winner details found to confirm."); dispatch(wheelSlice.actions.setDisplayWinningBanner(false)); dispatch(wheelSlice.actions.clearEphemeralEffect()); dispatch(wheelSlice.actions.setWheelStatus('idle')); return { error: "No winner to confirm." }; } dispatch(addHistoryEntry({ name: currentWinner.name, color: currentWinner.color })); if (removeOnHit && currentWinner.id) { console.log(`[confirmWinningSpinThunk] Removing item ID '${currentWinner.id}' due to RemoveOnHit.`); dispatch(removeItemInstance(currentWinner.id)); } dispatch(wheelSlice.actions.setDisplayWinningBanner(false)); dispatch(wheelSlice.actions.clearEphemeralEffect()); dispatch(wheelSlice.actions.clearWinningItemDetails()); dispatch(wheelSlice.actions.setWheelStatus('idle')); return { success: true, confirmedWinnerName: currentWinner.name }; });
export const voidLastSpinThunk = createAsyncThunk( /* ... from Response #28 ... */ 'wheel/voidLastSpin', async (_, { dispatch, getState }) => { const { winningItemDetails: currentWinner } = getState().wheel; console.log('[voidLastSpinThunk] Voiding spin for:', currentWinner?.name); dispatch(wheelSlice.actions.setDisplayWinningBanner(false)); dispatch(wheelSlice.actions.clearEphemeralEffect()); dispatch(wheelSlice.actions.clearWinningItemDetails()); dispatch(wheelSlice.actions.setWheelStatus('idle')); return { success: true, voidedItemName: currentWinner ? currentWinner.name : null }; });
export const performShuffleThunk = createAsyncThunk( /* ... from Response #28 ... */ 'wheel/performShuffle', async (payload, { dispatch, getState }) => { const currentItems = getState().items.items; if (currentItems.length < 2) { return { success: false, reason: "Not enough items to shuffle." }; } dispatch(wheelSlice.actions.setWheelStatus('shuffle_animating')); let itemsToShuffle = [...currentItems]; const shuffleIterations = payload.shuffleType === 'quick' ? 1 : getState().wheel.shuffleCount; for (let i = 0; i < shuffleIterations; i++) { PRNG.shuffleArray(itemsToShuffle); if (payload.shuffleType === 'N_times' && shuffleIterations > 1) { dispatch(setItems(itemsToShuffle.map(item => ({...item})))); if (i < shuffleIterations - 1) { await new Promise(resolve => setTimeout(resolve, SHUFFLE_STEP_DELAY_MS)); } } } dispatch(setItems(itemsToShuffle.map(item => ({...item})))); await new Promise(resolve => setTimeout(resolve, 50)); dispatch(wheelSlice.actions.setWheelStatus('idle')); return { success: true, iterations: shuffleIterations }; });


const wheelSlice = createSlice({
    name: 'wheel',
    initialState,
    reducers: {
        // ... (other reducers: setPointerPosition, setWheelStatus, etc. remain unchanged)
        setPointerPosition: (state, action) => { state.pointerPosition = action.payload; saveWheelSettingsToStorage(state); },
        setWheelStatus: (state, action) => { state.wheelStatus = action.payload; },
        setWinningItemDetails: (state, action) => { state.winningItemDetails = action.payload; },
        setTargetWinningItem: (state, action) => { state.targetWinningItem = action.payload; },
        clearWinningItemDetails: (state) => { state.winningItemDetails = null; state.targetWinningItem = null; },
        setDisplayWinningBanner: (state, action) => { state.displayWinningBanner = action.payload; },
        toggleRemoveOnHit: (state) => { state.removeOnHit = !state.removeOnHit; saveWheelSettingsToStorage(state); },
        setShuffleCount: (state, action) => { const count = parseInt(action.payload, 10); state.shuffleCount = isNaN(count) || count < 1 ? 1 : count; saveWheelSettingsToStorage(state); },
        setPageBackgroundImageUrl: (state, action) => { state.pageBackgroundImageUrl = action.payload; saveWheelSettingsToStorage(state); },
        setWheelSurfaceImageUrl: (state, action) => { state.wheelSurfaceImageUrl = action.payload; saveWheelSettingsToStorage(state); },
        setSegmentOpacity: (state, action) => { let newOpacity = parseFloat(action.payload); if (isNaN(newOpacity) || newOpacity < 0) newOpacity = 0; if (newOpacity > 1) newOpacity = 1; state.segmentOpacity = newOpacity; saveWheelSettingsToStorage(state); },
        setEphemeralEffect: (state, action) => { state.ephemeralEffect = action.payload; },
        clearEphemeralEffect: (state) => { state.ephemeralEffect = null; },
        setCustomPointerColor: (state, action) => { state.customPointerColor = action.payload; saveWheelSettingsToStorage(state); },

        // MODIFIED/REFINED setSpinParameters, or add new setCustomSpinDuration
        // Option: Modify existing setSpinParameters to be more robust for individual changes
        setSpinParameters: (state, action) => {
            const { duration, spins } = action.payload;
            if (typeof duration === 'number') { // Check if duration is provided
                const newDurationMs = duration; // Assuming payload duration is already in MS
                if (!isNaN(newDurationMs) && newDurationMs >= MIN_SPIN_DURATION_MS && newDurationMs <= MAX_SPIN_DURATION_MS) {
                    state.spinDuration = newDurationMs;
                } else if (!isNaN(newDurationMs)) { // Clamp if out of bounds but valid number
                    state.spinDuration = Math.max(MIN_SPIN_DURATION_MS, Math.min(newDurationMs, MAX_SPIN_DURATION_MS));
                }
                // If duration is not a number, or NaN from payload, it's ignored, keeping existing state.spinDuration
            }
            if (typeof spins === 'number') { // Check if spins is provided
                const newMinSpins = parseInt(spins, 10);
                if (!isNaN(newMinSpins) && newMinSpins >= 1 && newMinSpins <= 100) { // Example max for minSpins
                    state.minSpins = newMinSpins;
                }
            }
            saveWheelSettingsToStorage(state);
        },
    },
    extraReducers: (builder) => { /* ... unchanged ... */ builder .addCase(spinWheelThunk.rejected, (state, action) => { console.error("spinWheelThunk rejected:", action.error ? action.error.message : 'Unknown error during spinWheelThunk'); state.wheelStatus = 'idle'; }) .addCase(finalizeSpinThunk.rejected, (state, action) => { console.error("finalizeSpinThunk rejected:", action.error ? action.error.message : 'Unknown error during finalizeSpinThunk'); state.wheelStatus = 'idle'; state.ephemeralEffect = null; }) .addCase(performShuffleThunk.rejected, (state, action) => { console.error("performShuffleThunk rejected:", action.error ? action.error.message : 'Unknown error during performShuffleThunk'); state.wheelStatus = 'idle'; }) .addCase(confirmWinningSpinThunk.rejected, (state, action) => { console.error("confirmWinningSpinThunk rejected:", action.error ? action.error.message : 'Unknown error during confirmWinningSpinThunk'); state.wheelStatus = 'idle'; state.displayWinningBanner = false; state.ephemeralEffect = null;}) .addCase(voidLastSpinThunk.rejected, (state, action) => { console.error("voidLastSpinThunk rejected:", action.error ? action.error.message : 'Unknown error during voidLastSpinThunk'); state.wheelStatus = 'idle'; state.displayWinningBanner = false; state.ephemeralEffect = null;}); }
});

// Actions (setSpinParameters is already exported)
export const {
    setPointerPosition, setWheelStatus, setWinningItemDetails, setTargetWinningItem,
    clearWinningItemDetails, setDisplayWinningBanner, toggleRemoveOnHit,
    setShuffleCount, setSpinParameters, /* <<< setSpinParameters handles duration */
    setPageBackgroundImageUrl, setWheelSurfaceImageUrl, setSegmentOpacity,
    setEphemeralEffect, clearEphemeralEffect,
    setCustomPointerColor
} = wheelSlice.actions;

// Selectors (selectSpinDuration already exists)
// ... (other selectors unchanged) ...
const selectWheelSlice = (state) => state.wheel;
export const selectWheelSettings = createSelector( [selectWheelSlice], (wheel) => ({ pointerPosition: wheel.pointerPosition, removeOnHit: wheel.removeOnHit, shuffleCount: wheel.shuffleCount, spinDuration: wheel.spinDuration, minSpins: wheel.minSpins, }) );
export const selectWheelStatus = (state) => state.wheel.wheelStatus;
export const selectWinningItemDetails = (state) => state.wheel.winningItemDetails;
export const selectDisplayWinningBanner = (state) => state.wheel.displayWinningBanner;
export const selectTargetWinningItem = (state) => state.wheel.targetWinningItem;
export const selectRemoveOnHit = (state) => state.wheel.removeOnHit;
export const selectPageBackgroundImageUrl = (state) => state.wheel.pageBackgroundImageUrl;
export const selectWheelSurfaceImageUrl = (state) => state.wheel.wheelSurfaceImageUrl;
export const selectPointerPosition = (state) => state.wheel.pointerPosition;
export const selectMinSpins = (state) => state.wheel.minSpins;
export const selectSpinDuration = (state) => state.wheel.spinDuration; // This selector exists
export const selectShuffleCountValue = (state) => state.wheel.shuffleCount;
export const selectSegmentOpacity = (state) => state.wheel.segmentOpacity;
export const selectEphemeralEffect = (state) => state.wheel.ephemeralEffect;
export const selectCustomPointerColor = (state) => state.wheel.customPointerColor;

export default wheelSlice.reducer;
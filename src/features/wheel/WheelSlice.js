// src/features/wheel/wheelSlice.js
// ... (imports, constants, storage helpers, initialState - same as Response #75, ensure ephemeralEffect is in initialState)
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import PRNG from '../../core/prng/PRNGModule';
import { addHistoryEntry } from '../history/historySlice';
import { setItems, removeItemInstance } from '../items/itemSlice';

const WHEEL_SETTINGS_STORAGE_KEY = 'trueRandomWheel_wheelSettings'; const SHUFFLE_STEP_DELAY_MS = 100;
const loadWheelSettingsFromStorage = () => { const defaultSettings = { pointerPosition: 'top', removeOnHit: false, shuffleCount: 3, spinDuration: 7000, minSpins: 5, pageBackgroundImageUrl: null, wheelSurfaceImageUrl: null, segmentOpacity: 0.85, }; try { const storedSettings = localStorage.getItem(WHEEL_SETTINGS_STORAGE_KEY); if (storedSettings) { const parsed = JSON.parse(storedSettings); return { ...defaultSettings, ...parsed }; } } catch (error) { console.error("Error loading wheel settings from localStorage:", error); } return defaultSettings; };
const saveWheelSettingsToStorage = (settings) => { try { const { pointerPosition, removeOnHit, shuffleCount, spinDuration, minSpins, pageBackgroundImageUrl, wheelSurfaceImageUrl, segmentOpacity } = settings; localStorage.setItem(WHEEL_SETTINGS_STORAGE_KEY, JSON.stringify({ pointerPosition, removeOnHit, shuffleCount, spinDuration, minSpins, pageBackgroundImageUrl, wheelSurfaceImageUrl, segmentOpacity })); } catch (error) { console.error("Error saving wheel settings to localStorage:", error); } };
const persistedSettings = loadWheelSettingsFromStorage();
const initialState = { pointerPosition: persistedSettings.pointerPosition, removeOnHit: persistedSettings.removeOnHit, shuffleCount: persistedSettings.shuffleCount, spinDuration: persistedSettings.spinDuration, minSpins: persistedSettings.minSpins, pageBackgroundImageUrl: persistedSettings.pageBackgroundImageUrl, wheelSurfaceImageUrl: persistedSettings.wheelSurfaceImageUrl, segmentOpacity: persistedSettings.segmentOpacity, wheelStatus: 'idle', winningItemDetails: null, displayWinningBanner: false, targetWinningItem: null, ephemeralEffect: null, };


// spinWheelThunk remains the same as Response #75
export const spinWheelThunk = createAsyncThunk( /* ...from Response #75... */ 'wheel/spinWheel', async (_, { dispatch, getState }) => { dispatch(wheelSlice.actions.setWheelStatus('preparing_spin')); dispatch(wheelSlice.actions.clearWinningItemDetails()); dispatch(wheelSlice.actions.clearEphemeralEffect()); const allItems = getState().items.items; if (allItems.length === 0) { dispatch(wheelSlice.actions.setWheelStatus('idle')); return { error: "No items on the wheel." }; } const winningItemFromPRNG = PRNG.selectRandomItemFromArray(allItems); if (!winningItemFromPRNG) { dispatch(wheelSlice.actions.setWheelStatus('idle')); return { error: "Failed to determine a winner." }; } dispatch(wheelSlice.actions.setTargetWinningItem(winningItemFromPRNG)); dispatch(wheelSlice.actions.setWheelStatus('spinning')); return { success: true, targetName: winningItemFromPRNG.name }; });


// MODIFIED finalizeSpinThunk (to trigger effects immediately)
export const finalizeSpinThunk = createAsyncThunk(
    'wheel/finalizeSpin',
    async (payload, { dispatch, getState }) => {
        const { confirmedLandedItem, errorInfo } = payload;
        const allConfiguredEffects = getState().effects.tagEffects; // Get effect configurations

        if (errorInfo) {
            console.error("finalizeSpinThunk: Error from WheelCanvas -", errorInfo.error);
            dispatch(wheelSlice.actions.setWheelStatus('idle'));
            dispatch(wheelSlice.actions.clearWinningItemDetails()); // Also clears target and ephemeralEffect implicitly if reducer handles it
            dispatch(wheelSlice.actions.clearEphemeralEffect());   // Explicit clear
            return { error: errorInfo.error };
        }

        const targetItem = getState().wheel.targetWinningItem;
        if (!confirmedLandedItem) { /* ... error handling as in Response #75 ... */ console.error("finalizeSpinThunk: No landed item reported by canvas."); dispatch(wheelSlice.actions.setWheelStatus('idle')); dispatch(wheelSlice.actions.clearWinningItemDetails()); dispatch(wheelSlice.actions.clearEphemeralEffect()); return { error: "No landed item reported." }; }
        if (targetItem && confirmedLandedItem.id !== targetItem.id) { /* ... warning as in Response #75 ... */ console.warn("finalizeSpinThunk: Landed item ID does not match target ID. Target:", targetItem.id, "Landed:", confirmedLandedItem.id, ". Trusting landed item.");}

        // ***** EFFECT TRIGGERING LOGIC MOVED HERE *****
        let soundToPlay = null;
        let gifToDisplay = null;
        if (confirmedLandedItem.tags && confirmedLandedItem.tags.length > 0) {
            for (const tag of confirmedLandedItem.tags) {
                const effects = allConfiguredEffects[tag.toLowerCase()];
                if (effects) {
                    if (!soundToPlay && effects.soundUrl) soundToPlay = effects.soundUrl;
                    if (!gifToDisplay && effects.gifUrl) gifToDisplay = effects.gifUrl;
                    if (soundToPlay && gifToDisplay) break;
                }
            }
        }

        if (soundToPlay) {
            try {
                const audio = new Audio(soundToPlay);
                audio.play().catch(e => console.warn("Error playing sound effect on win:", e, "URL:", soundToPlay));
            } catch (e) { console.error("Error creating audio object for win effect:", e); }
        }
        if (gifToDisplay) {
            dispatch(wheelSlice.actions.setEphemeralEffect({ type: 'gif', url: gifToDisplay }));
        } else {
            // Ensure ephemeralEffect is cleared if no GIF for this winner,
            // in case a previous spin had one and something went wrong in cleanup.
            dispatch(wheelSlice.actions.clearEphemeralEffect());
        }
        // ***** END EFFECT TRIGGERING LOGIC *****

        dispatch(wheelSlice.actions.setWinningItemDetails(confirmedLandedItem));
        dispatch(wheelSlice.actions.setDisplayWinningBanner(true));
        dispatch(wheelSlice.actions.setWheelStatus('prize_landing'));
        return { success: true, pendingWinnerName: confirmedLandedItem.name };
    }
);

// MODIFIED confirmWinningSpinThunk (effect triggering REMOVED, cleanup for ephemeralEffect remains)
export const confirmWinningSpinThunk = createAsyncThunk(
    'wheel/confirmWinningSpin',
    async (_, { dispatch, getState }) => {
        const { winningItemDetails: currentWinner, removeOnHit } = getState().wheel;

        if (!currentWinner) { /* ... error handling as in Response #75 ... */ console.error("confirmWinningSpinThunk: No current winner details found to confirm."); dispatch(wheelSlice.actions.setDisplayWinningBanner(false)); dispatch(wheelSlice.actions.clearEphemeralEffect()); dispatch(wheelSlice.actions.setWheelStatus('idle')); return { error: "No winner to confirm." }; }

        dispatch(addHistoryEntry({ name: currentWinner.name, color: currentWinner.color }));
        if (removeOnHit && currentWinner.id) {
            dispatch(removeItemInstance(currentWinner.id));
        }

        dispatch(wheelSlice.actions.setDisplayWinningBanner(false));
        dispatch(wheelSlice.actions.clearEphemeralEffect()); // Cleanup GIF display state
        dispatch(wheelSlice.actions.clearWinningItemDetails());
        dispatch(wheelSlice.actions.setWheelStatus('idle'));
        return { success: true, confirmedWinnerName: currentWinner.name };
    }
);

// MODIFIED voidLastSpinThunk (cleanup for ephemeralEffect remains)
export const voidLastSpinThunk = createAsyncThunk(
    'wheel/voidLastSpin',
    async (_, { dispatch, getState }) => {
        const { winningItemDetails: currentWinner } = getState().wheel;
        dispatch(wheelSlice.actions.setDisplayWinningBanner(false));
        dispatch(wheelSlice.actions.clearEphemeralEffect()); // Cleanup GIF display state
        dispatch(wheelSlice.actions.clearWinningItemDetails());
        dispatch(wheelSlice.actions.setWheelStatus('idle'));
        return { success: true, voidedItemName: currentWinner ? currentWinner.name : null };
    }
);

// performShuffleThunk remains the same as Response #75
export const performShuffleThunk = createAsyncThunk( /* ...from Response #75... */ 'wheel/performShuffle', async (payload, { dispatch, getState }) => { const currentItems = getState().items.items; if (currentItems.length < 2) { return { success: false, reason: "Not enough items to shuffle." }; } dispatch(wheelSlice.actions.setWheelStatus('shuffle_animating')); let itemsToShuffle = [...currentItems]; const shuffleIterations = payload.shuffleType === 'quick' ? 1 : getState().wheel.shuffleCount; for (let i = 0; i < shuffleIterations; i++) { PRNG.shuffleArray(itemsToShuffle); if (payload.shuffleType === 'N_times' && shuffleIterations > 1) { dispatch(setItems([...itemsToShuffle])); if (i < shuffleIterations - 1) { await new Promise(resolve => setTimeout(resolve, SHUFFLE_STEP_DELAY_MS)); } } } dispatch(setItems([...itemsToShuffle])); await new Promise(resolve => setTimeout(resolve, 50)); dispatch(wheelSlice.actions.setWheelStatus('idle')); return { success: true, iterations: shuffleIterations }; });


const wheelSlice = createSlice({ /* ... reducers and extraReducers same as Response #75 ... */
    name: 'wheel',
    initialState,
    reducers: {
        setPointerPosition: (state, action) => { state.pointerPosition = action.payload; saveWheelSettingsToStorage(state); },
        setWheelStatus: (state, action) => { state.wheelStatus = action.payload; },
        setWinningItemDetails: (state, action) => { state.winningItemDetails = action.payload; },
        setTargetWinningItem: (state, action) => { state.targetWinningItem = action.payload; },
        clearWinningItemDetails: (state) => { state.winningItemDetails = null; state.targetWinningItem = null; /* Ephemeral effect cleared by its own action */ },
        setDisplayWinningBanner: (state, action) => { state.displayWinningBanner = action.payload; },
        toggleRemoveOnHit: (state) => { state.removeOnHit = !state.removeOnHit; saveWheelSettingsToStorage(state); },
        setShuffleCount: (state, action) => { const count = parseInt(action.payload, 10); state.shuffleCount = isNaN(count) || count < 1 ? 1 : count; saveWheelSettingsToStorage(state); },
        setSpinParameters: (state, action) => { const { duration, spins } = action.payload; if (typeof duration === 'number' && duration > 0) state.spinDuration = duration; if (typeof spins === 'number' && spins > 0) state.minSpins = spins; saveWheelSettingsToStorage(state); },
        setPageBackgroundImageUrl: (state, action) => { state.pageBackgroundImageUrl = action.payload; saveWheelSettingsToStorage(state); },
        setWheelSurfaceImageUrl: (state, action) => { state.wheelSurfaceImageUrl = action.payload; saveWheelSettingsToStorage(state); },
        setSegmentOpacity: (state, action) => { let newOpacity = parseFloat(action.payload); if (isNaN(newOpacity) || newOpacity < 0) newOpacity = 0; if (newOpacity > 1) newOpacity = 1; state.segmentOpacity = newOpacity; saveWheelSettingsToStorage(state); },
        setEphemeralEffect: (state, action) => { state.ephemeralEffect = action.payload; },
        clearEphemeralEffect: (state) => { state.ephemeralEffect = null; },
    },
    extraReducers: (builder) => { /* ... same as Response #75 ... */ builder .addCase(spinWheelThunk.rejected, (state, action) => { console.error("spinWheelThunk rejected:", action.error ? action.error.message : 'Unknown error'); state.wheelStatus = 'idle'; }) .addCase(finalizeSpinThunk.rejected, (state, action) => { console.error("finalizeSpinThunk rejected:", action.error ? action.error.message : 'Unknown error'); state.wheelStatus = 'idle'; state.ephemeralEffect = null; }) .addCase(performShuffleThunk.rejected, (state, action) => { console.error("performShuffleThunk rejected:", action.error ? action.error.message : 'Unknown error'); state.wheelStatus = 'idle'; }) .addCase(confirmWinningSpinThunk.rejected, (state, action) => { console.error("confirmWinningSpinThunk rejected:", action.error ? action.error.message : 'Unknown error'); state.wheelStatus = 'idle'; state.displayWinningBanner = false; state.ephemeralEffect = null;}) .addCase(voidLastSpinThunk.rejected, (state, action) => { console.error("voidLastSpinThunk rejected:", action.error ? action.error.message : 'Unknown error'); state.wheelStatus = 'idle'; state.displayWinningBanner = false; state.ephemeralEffect = null;});}
});

export const { /* ... actions same as Response #75 ... */
    setPointerPosition, setWheelStatus, setWinningItemDetails, setTargetWinningItem,
    clearWinningItemDetails, setDisplayWinningBanner, toggleRemoveOnHit,
    setShuffleCount, setSpinParameters,
    setPageBackgroundImageUrl, setWheelSurfaceImageUrl, setSegmentOpacity,
    setEphemeralEffect, clearEphemeralEffect
} = wheelSlice.actions;

// Selectors (remain same as Response #75)
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
export const selectSpinDuration = (state) => state.wheel.spinDuration;
export const selectShuffleCountValue = (state) => state.wheel.shuffleCount;
export const selectSegmentOpacity = (state) => state.wheel.segmentOpacity;
export const selectEphemeralEffect = (state) => state.wheel.ephemeralEffect;

export default wheelSlice.reducer;
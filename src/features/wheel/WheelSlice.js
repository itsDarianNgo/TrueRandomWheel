// src/features/wheel/wheelSlice.js
import { createSlice, createAsyncThunk, createSelector} from '@reduxjs/toolkit';
import PRNG from '../../core/prng/PRNGModule'; // For selecting winner
import { addHistoryEntry } from '../history/historySlice'; // To dispatch to another slice
import { setItems as setItemsAction, removeItemInstance as removeItemInstanceAction } from '../items/itemSlice'; // Actions from itemSlice

const WHEEL_SETTINGS_STORAGE_KEY = 'trueRandomWheel_wheelSettings';
const SHUFFLE_STEP_DELAY_MS = 100; // Delay for visual feedback during N_times shuffle

const loadWheelSettingsFromStorage = () => {const defaultSettings = { pointerPosition: 'top', removeOnHit: false, shuffleCount: 3, spinDuration: 7000, minSpins: 5, pageBackgroundImageUrl: null, wheelSurfaceImageUrl: null, segmentOpacity: 0.85,}; try { const storedSettings = localStorage.getItem(WHEEL_SETTINGS_STORAGE_KEY); if (storedSettings) { return { ...defaultSettings, ...JSON.parse(storedSettings) }; } } catch (error) { console.error("Error loading wheel settings from localStorage:", error); } return defaultSettings; };
const saveWheelSettingsToStorage = (settings) => {try { const { pointerPosition, removeOnHit, shuffleCount, spinDuration, minSpins, pageBackgroundImageUrl, wheelSurfaceImageUrl, segmentOpacity  } = settings; localStorage.setItem(WHEEL_SETTINGS_STORAGE_KEY, JSON.stringify({ pointerPosition, removeOnHit, shuffleCount, spinDuration, minSpins, pageBackgroundImageUrl, wheelSurfaceImageUrl})); } catch (error) { console.error("Error saving wheel settings to localStorage:", error); } };

const persistedSettings = loadWheelSettingsFromStorage();
const initialState = {
    pointerPosition: persistedSettings.pointerPosition,
    removeOnHit: persistedSettings.removeOnHit,
    shuffleCount: persistedSettings.shuffleCount,
    spinDuration: persistedSettings.spinDuration,
    minSpins: persistedSettings.minSpins,
    pageBackgroundImageUrl: persistedSettings.pageBackgroundImageUrl,
    wheelSurfaceImageUrl: persistedSettings.wheelSurfaceImageUrl,
    segmentOpacity: persistedSettings.segmentOpacity,
    wheelStatus: 'idle',
    winningItemDetails: null,
    displayWinningBanner: false,
    targetWinningItem: null,
};

// THUNKS
export const spinWheelThunk = createAsyncThunk(
    'wheel/spinWheel',
    async (_, { dispatch, getState }) => {
        dispatch(wheelSlice.actions.setWheelStatus('preparing_spin'));
        dispatch(wheelSlice.actions.clearWinningItemDetails()); // Clear previous winner & target

        const allItems = getState().items.items;
        if (allItems.length === 0) {
            console.warn("spinWheelThunk: No items to spin.");
            dispatch(wheelSlice.actions.setWheelStatus('idle'));
            // Optionally, dispatch a notification action here for UI
            return { error: "No items on the wheel." }; // Return error object
        }

        const winningItemFromPRNG = PRNG.selectRandomItemFromArray(allItems);
        if (!winningItemFromPRNG) {
            console.error("spinWheelThunk: PRNG failed to select a winning item.");
            dispatch(wheelSlice.actions.setWheelStatus('idle'));
            return { error: "Failed to determine a winner." };
        }

        dispatch(wheelSlice.actions.setTargetWinningItem(winningItemFromPRNG));
        dispatch(wheelSlice.actions.setWheelStatus('spinning'));
        return { success: true, targetName: winningItemFromPRNG.name }; // Return a serializable object
    }
);

// MODIFIED finalizeSpinThunk
export const finalizeSpinThunk = createAsyncThunk(
    'wheel/finalizeSpin',
    async (payload, { dispatch, getState }) => {
        const { confirmedLandedItem, errorInfo } = payload;

        if (errorInfo) {
            console.error("finalizeSpinThunk: Error from WheelCanvas -", errorInfo.error);
            dispatch(wheelSlice.actions.setWheelStatus('idle'));
            dispatch(wheelSlice.actions.clearWinningItemDetails());
            return { error: errorInfo.error };
        }

        const targetItem = getState().wheel.targetWinningItem;
        if (!confirmedLandedItem) {
            console.error("finalizeSpinThunk: No landed item reported by canvas.");
            dispatch(wheelSlice.actions.setWheelStatus('idle'));
            dispatch(wheelSlice.actions.clearWinningItemDetails());
            return { error: "No landed item reported." };
        }

        if (targetItem && confirmedLandedItem.id !== targetItem.id) {
            console.warn("finalizeSpinThunk: Landed item ID does not match target ID. Target:", targetItem.id, "Landed:", confirmedLandedItem.id, ". Trusting landed item.");
            // Potentially log this for analytics or deeper debugging if it happens often
        }

        dispatch(wheelSlice.actions.setWinningItemDetails(confirmedLandedItem)); // This is the "pending" winner
        dispatch(wheelSlice.actions.setDisplayWinningBanner(true));
        dispatch(wheelSlice.actions.setWheelStatus('prize_landing'));
        return { success: true, pendingWinnerName: confirmedLandedItem.name };
    }
);

// NEW confirmWinningSpinThunk
export const confirmWinningSpinThunk = createAsyncThunk(
    'wheel/confirmWinningSpin',
    async (_, { dispatch, getState }) => {
        const { winningItemDetails: currentWinner, removeOnHit } = getState().wheel;

        if (!currentWinner) {
            console.error("confirmWinningSpinThunk: No current winner details found to confirm.");
            dispatch(wheelSlice.actions.setDisplayWinningBanner(false));
            dispatch(wheelSlice.actions.setWheelStatus('idle'));
            return { error: "No winner to confirm." };
        }

        dispatch(addHistoryEntry({ name: currentWinner.name, color: currentWinner.color }));

        if (removeOnHit && currentWinner.id) {
            dispatch(removeItemInstanceAction(currentWinner.id)); // Dispatch action from itemSlice
        }

        dispatch(wheelSlice.actions.setDisplayWinningBanner(false));
        dispatch(wheelSlice.actions.clearWinningItemDetails());
        dispatch(wheelSlice.actions.setWheelStatus('idle'));
        return { success: true, confirmedWinnerName: currentWinner.name };
    }
);

// NEW voidLastSpinThunk
export const voidLastSpinThunk = createAsyncThunk(
    'wheel/voidLastSpin',
    async (_, { dispatch, getState }) => {
        const { winningItemDetails: currentWinner } = getState().wheel; // Get winner to log if needed

        dispatch(wheelSlice.actions.setDisplayWinningBanner(false));
        dispatch(wheelSlice.actions.clearWinningItemDetails());
        dispatch(wheelSlice.actions.setWheelStatus('idle'));
        // No history entry, no item removal.
        return { success: true, voidedItemName: currentWinner ? currentWinner.name : null };
    }
);

export const performShuffleThunk = createAsyncThunk(
    'wheel/performShuffle',
    async (payload, { dispatch, getState }) => {
        // payload: { shuffleType: 'quick' | 'N_times' }
        const currentItems = getState().items.items;
        if (currentItems.length < 2) {
            return { success: false, reason: "Not enough items to shuffle." };
        }

        dispatch(wheelSlice.actions.setWheelStatus('shuffle_animating'));

        let itemsToShuffle = [...currentItems];
        const shuffleIterations = payload.shuffleType === 'quick' ? 1 : getState().wheel.shuffleCount;

        for (let i = 0; i < shuffleIterations; i++) {
            PRNG.shuffleArray(itemsToShuffle);
            // For N_times shuffle, update items for visual feedback if desired, with a delay
            if (payload.shuffleType === 'N_times' && shuffleIterations > 1) {
                dispatch(setItemsAction([...itemsToShuffle])); // Update items in store
                if (i < shuffleIterations - 1) { // Don't delay after the very last shuffle step before idle
                    await new Promise(resolve => setTimeout(resolve, SHUFFLE_STEP_DELAY_MS));
                }
            }
        }
        // Final set for 'quick' or the last step of 'N_times'
        dispatch(setItemsAction([...itemsToShuffle]));

        // Brief delay to let UI update before switching status from 'shuffle_animating'
        await new Promise(resolve => setTimeout(resolve, 50));
        dispatch(wheelSlice.actions.setWheelStatus('idle'));
        return { success: true, iterations: shuffleIterations };
    }
);
// END THUNKS

const wheelSlice = createSlice({
    name: 'wheel',
    initialState,
    reducers: {
        setPointerPosition: (state, action) => { state.pointerPosition = action.payload; saveWheelSettingsToStorage(state); },
        setWheelStatus: (state, action) => { state.wheelStatus = action.payload; },
        setWinningItemDetails: (state, action) => { state.winningItemDetails = action.payload; },
        setTargetWinningItem: (state, action) => { state.targetWinningItem = action.payload; },
        clearWinningItemDetails: (state) => { state.winningItemDetails = null; state.targetWinningItem = null; }, // Also clears target
        setDisplayWinningBanner: (state, action) => { state.displayWinningBanner = action.payload; },
        toggleRemoveOnHit: (state) => { state.removeOnHit = !state.removeOnHit; saveWheelSettingsToStorage(state); },
        setShuffleCount: (state, action) => { const count = parseInt(action.payload, 10); state.shuffleCount = isNaN(count) || count < 1 ? 1 : count; saveWheelSettingsToStorage(state); },
        setSpinParameters: (state, action) => { const { duration, spins } = action.payload; if (typeof duration === 'number' && duration > 0) state.spinDuration = duration; if (typeof spins === 'number' && spins > 0) state.minSpins = spins; saveWheelSettingsToStorage(state); },
        setPageBackgroundImageUrl: (state, action) => {
            state.pageBackgroundImageUrl = action.payload; // Validation happens in UI before dispatch
            saveWheelSettingsToStorage(state);
        },
        setWheelSurfaceImageUrl: (state, action) => {
            state.wheelSurfaceImageUrl = action.payload; // Validation happens in UI before dispatch
            saveWheelSettingsToStorage(state);
        },

        // ***** NEW REDUCER FOR SEGMENT OPACITY *****
        setSegmentOpacity: (state, action) => {
            let newOpacity = parseFloat(action.payload);
            if (isNaN(newOpacity) || newOpacity < 0) newOpacity = 0;
            if (newOpacity > 1) newOpacity = 1;
            state.segmentOpacity = newOpacity;
            saveWheelSettingsToStorage(state);
        },

    },
    extraReducers: (builder) => { /* ... same as Response #30, can add handlers for new thunks if needed ... */ builder .addCase(spinWheelThunk.rejected, (state, action) => { console.error("spinWheelThunk rejected:", action.error ? action.error.message : 'Unknown error'); state.wheelStatus = 'idle'; }) .addCase(finalizeSpinThunk.rejected, (state, action) => { console.error("finalizeSpinThunk rejected:", action.error ? action.error.message : 'Unknown error'); state.wheelStatus = 'idle'; }) .addCase(performShuffleThunk.rejected, (state, action) => { console.error("performShuffleThunk rejected:", action.error ? action.error.message : 'Unknown error'); state.wheelStatus = 'idle'; }) .addCase(confirmWinningSpinThunk.rejected, (state, action) => { console.error("confirmWinningSpinThunk rejected:", action.error ? action.error.message : 'Unknown error'); state.wheelStatus = 'idle'; // Ensure idle state on unexpected failure }) .addCase(voidLastSpinThunk.rejected, (state, action) => { console.error("voidLastSpinThunk rejected:", action.error ? action.error.message : 'Unknown error'); state.wheelStatus = 'idle'; }); }
            });
        // Can add .pending or .fulfilled handlers if specific state changes are needed during thunk lifecycle
    }
});

export const {
    setPointerPosition, setWheelStatus, setWinningItemDetails, setTargetWinningItem,
    clearWinningItemDetails, setDisplayWinningBanner, toggleRemoveOnHit,
    setShuffleCount, setSpinParameters, setPageBackgroundImageUrl, setWheelSurfaceImageUrl, setSegmentOpacity
} = wheelSlice.actions;

// Input selector for the whole wheel slice
const selectWheelSlice = (state) => state.wheel;


// Memoized selector for wheel settings
export const selectWheelSettings = createSelector(
    [selectWheelSlice],
    (wheel) => ({
        pointerPosition: wheel.pointerPosition,
        removeOnHit: wheel.removeOnHit,
        shuffleCount: wheel.shuffleCount,
        spinDuration: wheel.spinDuration,
        minSpins: wheel.minSpins,
        // Include image URLs if they are considered part of "settings" object
        // that components might consume together.
        // pageBackgroundImageUrl: wheel.pageBackgroundImageUrl,
        // wheelSurfaceImageUrl: wheel.wheelSurfaceImageUrl,
    })
);

// Individual selectors (these are inherently memoized by useSelector if they return primitives)
export const selectWheelStatus = (state) => state.wheel.wheelStatus;
export const selectWinningItemDetails = (state) => state.wheel.winningItemDetails;
export const selectDisplayWinningBanner = (state) => state.wheel.displayWinningBanner;
export const selectTargetWinningItem = (state) => state.wheel.targetWinningItem;
export const selectRemoveOnHit = (state) => state.wheel.removeOnHit; // Kept if used individually
export const selectPageBackgroundImageUrl = (state) => state.wheel.pageBackgroundImageUrl;
export const selectWheelSurfaceImageUrl = (state) => state.wheel.wheelSurfaceImageUrl;
// Add individual selectors for other settings if components need them one by one
export const selectPointerPosition = (state) => state.wheel.pointerPosition;
export const selectMinSpins = (state) => state.wheel.minSpins;
export const selectSpinDuration = (state) => state.wheel.spinDuration;
export const selectShuffleCountValue = (state) => state.wheel.shuffleCount;

// ***** NEW SELECTOR FOR SEGMENT OPACITY *****
export const selectSegmentOpacity = (state) => state.wheel.segmentOpacity;

export default wheelSlice.reducer;
// src/features/wheel/wheelSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import PRNG from '../../core/prng/PRNGModule'; // For selecting winner
import { addHistoryEntry } from '../history/historySlice'; // To dispatch to another slice
import { setItems as setItemsAction, removeItemInstance as removeItemInstanceAction } from '../items/itemSlice'; // Actions from itemSlice

const WHEEL_SETTINGS_STORAGE_KEY = 'trueRandomWheel_wheelSettings';
const SHUFFLE_STEP_DELAY_MS = 100; // Delay for visual feedback during N_times shuffle

const loadWheelSettingsFromStorage = () => { /* ... same as Response #10 ... */ const defaultSettings = { pointerPosition: 'top', removeOnHit: false, shuffleCount: 3, spinDuration: 7000, minSpins: 5, }; try { const storedSettings = localStorage.getItem(WHEEL_SETTINGS_STORAGE_KEY); if (storedSettings) { return { ...defaultSettings, ...JSON.parse(storedSettings) }; } } catch (error) { console.error("Error loading wheel settings from localStorage:", error); } return defaultSettings; };
const saveWheelSettingsToStorage = (settings) => { /* ... same as Response #10 ... */ try { const { pointerPosition, removeOnHit, shuffleCount, spinDuration, minSpins } = settings; localStorage.setItem(WHEEL_SETTINGS_STORAGE_KEY, JSON.stringify({ pointerPosition, removeOnHit, shuffleCount, spinDuration, minSpins })); } catch (error) { console.error("Error saving wheel settings to localStorage:", error); } };

const persistedSettings = loadWheelSettingsFromStorage();
const initialState = {
    pointerPosition: persistedSettings.pointerPosition,
    removeOnHit: persistedSettings.removeOnHit,
    shuffleCount: persistedSettings.shuffleCount,
    spinDuration: persistedSettings.spinDuration,
    minSpins: persistedSettings.minSpins,
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
        return { success: true, target: winningItemFromPRNG.name }; // Indicate success
    }
);

export const finalizeSpinThunk = createAsyncThunk(
    'wheel/finalizeSpin',
    async (payload, { dispatch, getState }) => {
        // payload: { confirmedLandedItem, errorInfo }
        const { confirmedLandedItem, errorInfo } = payload;
        const targetItem = getState().wheel.targetWinningItem;

        if (errorInfo) {
            console.error("finalizeSpinThunk: Error from WheelCanvas -", errorInfo.error);
            dispatch(wheelSlice.actions.setWheelStatus('idle'));
            dispatch(wheelSlice.actions.clearWinningItemDetails());
            return { error: errorInfo.error };
        }

        if (!confirmedLandedItem || (targetItem && confirmedLandedItem.id !== targetItem.id)) {
            console.error("finalizeSpinThunk: Landed item mismatch or not found. Target:", targetItem, "Landed:", confirmedLandedItem);
            dispatch(wheelSlice.actions.setWheelStatus('idle'));
            dispatch(wheelSlice.actions.clearWinningItemDetails());
            return { error: "Landed item did not match target." };
        }

        dispatch(wheelSlice.actions.setWinningItemDetails(confirmedLandedItem));
        dispatch(addHistoryEntry({ name: confirmedLandedItem.name, color: confirmedLandedItem.color }));
        dispatch(wheelSlice.actions.setDisplayWinningBanner(true));
        dispatch(wheelSlice.actions.setWheelStatus('prize_landing'));
        return { success: true, winner: confirmedLandedItem.name };
    }
);

export const acknowledgeWinnerThunk = createAsyncThunk(
    'wheel/acknowledgeWinner',
    async (_, { dispatch, getState }) => {
        dispatch(wheelSlice.actions.setDisplayWinningBanner(false));
        const { removeOnHit, winningItemDetails: currentWinner } = getState().wheel;

        if (removeOnHit && currentWinner && currentWinner.id) {
            dispatch(removeItemInstanceAction(currentWinner.id)); // Dispatch action from itemSlice
        }
        dispatch(wheelSlice.actions.clearWinningItemDetails());
        dispatch(wheelSlice.actions.setWheelStatus('idle'));
        return { success: true };
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
    },
    extraReducers: (builder) => { // To handle thunk lifecycle if needed (e.g., pending, rejected)
        builder
            .addCase(spinWheelThunk.rejected, (state, action) => {
                console.error("spinWheelThunk rejected:", action.error.message);
                state.wheelStatus = 'idle'; // Ensure idle on failure
            })
            .addCase(finalizeSpinThunk.rejected, (state, action) => {
                console.error("finalizeSpinThunk rejected:", action.error.message);
                state.wheelStatus = 'idle';
            })
            .addCase(performShuffleThunk.rejected, (state, action) => {
                console.error("performShuffleThunk rejected:", action.error.message);
                state.wheelStatus = 'idle';
            });
        // Can add .pending or .fulfilled handlers if specific state changes are needed during thunk lifecycle
    }
});

export const {
    setPointerPosition, setWheelStatus, setWinningItemDetails, setTargetWinningItem,
    clearWinningItemDetails, setDisplayWinningBanner, toggleRemoveOnHit,
    setShuffleCount, setSpinParameters,
} = wheelSlice.actions;

export const selectWheelSettings = (state) => ({ /* ... same as Response #10 ... */ pointerPosition: state.wheel.pointerPosition, removeOnHit: state.wheel.removeOnHit, shuffleCount: state.wheel.shuffleCount, spinDuration: state.wheel.spinDuration, minSpins: state.wheel.minSpins,});
export const selectWheelStatus = (state) => state.wheel.wheelStatus;
export const selectWinningItemDetails = (state) => state.wheel.winningItemDetails;
export const selectDisplayWinningBanner = (state) => state.wheel.displayWinningBanner;
export const selectTargetWinningItem = (state) => state.wheel.targetWinningItem;
export const selectRemoveOnHit = (state) => state.wheel.removeOnHit;

export default wheelSlice.reducer;
// src/features/history/historySlice.js
import { createSlice } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid'; // For fallback ID generation

const MAX_HISTORY_ENTRIES = 50;
const HISTORY_STORAGE_KEY = 'trueRandomWheel_history';

// Helper to load from localStorage
const loadHistoryFromStorage = () => {
    try {
        const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (storedHistory) {
            const parsed = JSON.parse(storedHistory);
            // Basic validation: ensure it's an array
            if (Array.isArray(parsed)) {
                // Optional: further validate structure of each entry if needed
                // For now, we assume if it's an array, it's in the expected format or will be handled by components.
                return parsed;
            }
        }
    } catch (error) {
        console.error("Error loading history from localStorage:", error);
    }
    return []; // Return empty array if nothing stored, error, or invalid format
};

const initialState = {
    entries: loadHistoryFromStorage(), // Array of { id: string, name: string, color?: string, timestamp: number }
};

const historySlice = createSlice({
    name: 'history',
    initialState,
    reducers: {
        addHistoryEntry: (state, action) => {
            // action.payload = { name: string, color?: string } (winning item details)
            const newEntry = {
                id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : uuidv4(),
                name: action.payload.name,
                color: action.payload.color, // Will be undefined if not provided
                timestamp: Date.now(),
            };

            state.entries.unshift(newEntry); // Add to the beginning (most recent first)

            if (state.entries.length > MAX_HISTORY_ENTRIES) {
                state.entries.length = MAX_HISTORY_ENTRIES; // More direct way to trim than pop in a loop
            }

            try {
                localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(state.entries));
            } catch (error) {
                console.error("Error saving history to localStorage:", error);
                // Potentially dispatch an error action here if UI needs to react to storage failure
            }
        },
        clearHistory: (state) => {
            state.entries = [];
            try {
                localStorage.removeItem(HISTORY_STORAGE_KEY);
            } catch (error) {
                console.error("Error clearing history from localStorage:", error);
            }
        },
    },
});

export const { addHistoryEntry, clearHistory } = historySlice.actions;

// Selector to get history entries
export const selectHistoryEntries = (state) => state.history.entries;

export default historySlice.reducer;
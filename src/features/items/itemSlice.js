// src/features/items/itemSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

const ITEMS_STORAGE_KEY = 'trueRandomWheel_items';
const MAX_ITEMS_OVERALL = 300;

const loadItemsFromStorage = () => {
    try {
        const storedItems = localStorage.getItem(ITEMS_STORAGE_KEY);
        if (storedItems) {
            const parsed = JSON.parse(storedItems);
            if (Array.isArray(parsed)) {
                // console.log('[itemSlice] Loaded items from localStorage:', parsed);
                return parsed;
            }
            // console.log('[itemSlice] Parsed localStorage items was not an array.');
        }
    } catch (error) {
        console.error("[itemSlice] Error loading items from localStorage:", error);
    }
    // console.log('[itemSlice] No valid items in localStorage, returning [].');
    return [];
};

const saveItemsToStorage = (items) => {
    try {
        localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(items));
        // console.log('[itemSlice] Saved items to localStorage:', items);
    } catch (error) {
        console.error("[itemSlice] Error saving items to localStorage:", error);
    }
};

const initialState = {
    items: loadItemsFromStorage(),
};
// console.log('[itemSlice] Initial state:', initialState);

const itemSlice = createSlice({
    name: 'items', // This name is used as the key in the root state: state.items
    initialState,
    reducers: {
        setItems: (state, action) => {
            // console.log('[itemSlice] setItems - payload:', action.payload);
            state.items = action.payload; // state here is the slice's state: { items: [...] }
                                          // So state.items refers to the array.
            saveItemsToStorage(state.items);
        },
        addItemEntry: (state, action) => {
            // console.log('[itemSlice] addItemEntry - current items before add:', JSON.parse(JSON.stringify(state.items)));
            // console.log('[itemSlice] addItemEntry - payload:', action.payload);

            const { name, quantity, color } = action.payload;
            if (state.items.length + quantity > MAX_ITEMS_OVERALL) {
                console.warn(`[itemSlice] Cannot add items: Exceeds maximum limit of ${MAX_ITEMS_OVERALL} items.`);
                return;
            }

            const sourceGroupId = `sg-${(typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : uuidv4()}`;
            const newIndividualItems = Array.from({ length: quantity }, (_, i) => ({
                id: `item-${sourceGroupId}-${i}-${Math.random().toString(36).substring(2, 7)}`, // added random suffix for higher uniqueness if rapid adding
                name: name,
                color: color || undefined,
                sourceGroup: sourceGroupId,
            }));

            // state.items is the actual array due to Immer proxying state.
            state.items.push(...newIndividualItems);
            // console.log('[itemSlice] addItemEntry - items after add:', JSON.parse(JSON.stringify(state.items)));
            saveItemsToStorage(state.items);
        },
        removeItemSourceGroup: (state, action) => {
            const sourceGroupIdToRemove = action.payload;
            state.items = state.items.filter(item => item.sourceGroup !== sourceGroupIdToRemove);
            saveItemsToStorage(state.items);
        },
        incrementItemGroupQuantity: (state, action) => {
            if (state.items.length >= MAX_ITEMS_OVERALL) {
                console.warn(`[itemSlice] Cannot increment: Max items limit reached.`);
                return;
            }
            const sourceGroupIdToIncrement = action.payload;
            const itemToClone = state.items.find(item => item.sourceGroup === sourceGroupIdToIncrement);
            if (itemToClone) {
                const newItemInstance = {
                    ...itemToClone,
                    id: `item-${sourceGroupIdToIncrement}-${(typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : uuidv4().slice(0,8)}-${Math.random().toString(36).substring(2, 7)}`,
                };
                state.items.push(newItemInstance);
                saveItemsToStorage(state.items);
            }
        },
        decrementItemGroupQuantity: (state, action) => {
            const sourceGroupIdToDecrement = action.payload;
            const firstItemIndexInGroup = state.items.findIndex(item => item.sourceGroup === sourceGroupIdToDecrement);
            if (firstItemIndexInGroup !== -1) {
                state.items.splice(firstItemIndexInGroup, 1);
                saveItemsToStorage(state.items);
            }
        },
        removeItemInstance: (state, action) => {
            const itemIdToRemove = action.payload;
            state.items = state.items.filter(item => item.id !== itemIdToRemove);
            saveItemsToStorage(state.items);
        }
    },
});

export const {
    setItems,
    addItemEntry,
    removeItemSourceGroup,
    incrementItemGroupQuantity,
    decrementItemGroupQuantity,
    removeItemInstance
} = itemSlice.actions;

// Selector: state.items (from root) -> .items (the array within the slice)
export const selectAllItems = (state) => state.items.items;

export default itemSlice.reducer;
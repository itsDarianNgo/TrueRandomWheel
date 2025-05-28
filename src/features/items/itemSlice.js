// src/features/items/itemSlice.js
import { createSlice, createSelector } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

const ITEMS_STORAGE_KEY = 'trueRandomWheel_items';
export const MAX_ITEMS_OVERALL = 300; // Exported for use in UI components

const loadItemsFromStorage = () => { /* ... same as Response #51 ... */ try { const storedItems = localStorage.getItem(ITEMS_STORAGE_KEY); if (storedItems) { const parsed = JSON.parse(storedItems); if (Array.isArray(parsed)) { return parsed.map(item => ({ ...item, tags: Array.isArray(item.tags) ? item.tags : [], })); } } } catch (error) { console.error("[itemSlice] Error loading items from localStorage:", error); } return []; };
const saveItemsToStorage = (items) => { /* ... same as Response #51 ... */ try { localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(items)); } catch (error) { console.error("[itemSlice] Error saving items to localStorage:", error); } };

const initialState = { /* ... same as Response #51 ... */ items: loadItemsFromStorage(), };

const itemSlice = createSlice({
    name: 'items',
    initialState,
    reducers: {
        setItems: (state, action) => { /* ... same as Response #51 ... */ state.items = action.payload.map(item => ({ ...item, tags: Array.isArray(item.tags) ? item.tags : [], })); saveItemsToStorage(state.items); },
        addItemEntry: (state, action) => { /* ... same as Response #51, ensure MAX_ITEMS_OVERALL is used if checking here ... */ const { name, quantity, color, tags } = action.payload; if (state.items.length + quantity > MAX_ITEMS_OVERALL) { console.warn(`[itemSlice] AddItemEntry: Cannot add items: Exceeds maximum limit of ${MAX_ITEMS_OVERALL} items.`); return; } const sourceGroupId = `sg-${(typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : uuidv4()}`; const newIndividualItems = Array.from({ length: quantity }, (_, i) => ({ id: `item-${sourceGroupId}-${i}-${Math.random().toString(36).substring(2, 7)}`, name: name, color: color || undefined, sourceGroup: sourceGroupId, tags: tags || [], })); state.items.push(...newIndividualItems); saveItemsToStorage(state.items); },
        updateItemGroup: (state, action) => { /* ... same as Response #62 ... */ const { sourceGroupId, newName, newColor, newTags } = action.payload; state.items = state.items.map(item => { if (item.sourceGroup === sourceGroupId) { return { ...item, name: newName, color: newColor === undefined ? undefined : (newColor || undefined), tags: newTags || [] }; } return item; }); saveItemsToStorage(state.items); },
        removeItemSourceGroup: (state, action) => { /* ... same as Response #51 ... */ const sourceGroupIdToRemove = action.payload; state.items = state.items.filter(item => item.sourceGroup !== sourceGroupIdToRemove); saveItemsToStorage(state.items); },
        incrementItemGroupQuantity: (state, action) => { /* ... same as Response #51, ensure MAX_ITEMS_OVERALL check ... */ if (state.items.length >= MAX_ITEMS_OVERALL) { console.warn(`[itemSlice] Increment: Max items limit reached.`); return; } const sourceGroupIdToIncrement = action.payload; const itemToClone = state.items.find(item => item.sourceGroup === sourceGroupIdToIncrement); if (itemToClone) { const newItemInstance = { ...itemToClone, id: `item-${sourceGroupIdToIncrement}-${(typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : uuidv4().slice(0,8)}-${Math.random().toString(36).substring(2, 7)}`, }; state.items.push(newItemInstance); saveItemsToStorage(state.items); } },
        decrementItemGroupQuantity: (state, action) => { /* ... same as Response #51 ... */ const sourceGroupIdToDecrement = action.payload; const firstItemIndexInGroup = state.items.findIndex(item => item.sourceGroup === sourceGroupIdToDecrement); if (firstItemIndexInGroup !== -1) { state.items.splice(firstItemIndexInGroup, 1); saveItemsToStorage(state.items); } },
        removeItemInstance: (state, action) => { /* ... same as Response #51 ... */ const itemIdToRemove = action.payload; state.items = state.items.filter(item => item.id !== itemIdToRemove); saveItemsToStorage(state.items); },

        // ***** NEW REDUCER for adding multiple item entries *****
        addMultipleItemEntries: (state, action) => {
            const { names } = action.payload; // Array of processed name strings

            // The pre-check for MAX_ITEMS_OVERALL should happen in the component before dispatching.
            // If it were to be handled here, it'd be:
            // if (state.items.length + names.length > MAX_ITEMS_OVERALL) {
            //     console.warn(`[itemSlice] AddMultiple: Cannot add ${names.length} items. Total would exceed limit.`);
            //     return; // Do not modify state if batch would exceed limit
            // }

            const commonSourceGroupId = `bsg-${(typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : uuidv4()}`;

            const newBulkItems = names.map((name, index) => ({
                id: `bitem-${commonSourceGroupId}-${index}-${Math.random().toString(36).substring(2, 9)}`, // Increased randomness length
                name: name,
                color: undefined, // Uses default palette behavior in WheelCanvas
                sourceGroup: commonSourceGroupId,
                tags: [],         // Default to no tags for bulk added items
            }));

            state.items.push(...newBulkItems);
            saveItemsToStorage(state.items);
        },
    },
});

export const {
    setItems, addItemEntry, removeItemSourceGroup,
    incrementItemGroupQuantity, decrementItemGroupQuantity,
    removeItemInstance, updateItemGroup,
    addMultipleItemEntries // Export new action
} = itemSlice.actions;

export const selectAllItems = (state) => state.items.items;
export const selectTagBasedOdds = createSelector( /* ... same as Response #58 ... */ [selectAllItems], (items) => { const totalSegments = items.length; if (totalSegments === 0) { return { totalSegments: 0, taggedOdds: [], untaggedCount: 0, untaggedProbability: 0, hasTaggedItems: false, }; } const tagCounts = new Map(); let untaggedSegmentCount = 0; let hasAnyTaggedItems = false; items.forEach(item => { if (item.tags && item.tags.length > 0) { hasAnyTaggedItems = true; const uniqueTagsForItem = new Set(item.tags); uniqueTagsForItem.forEach(tag => { tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1); }); } else { untaggedSegmentCount++; } }); const taggedOdds = []; for (const [tag, count] of tagCounts) { taggedOdds.push({ tag: tag, count: count, probability: (count / totalSegments) * 100, }); } taggedOdds.sort((a, b) => a.tag.localeCompare(b.tag)); return { totalSegments, taggedOdds, untaggedCount: untaggedSegmentCount, untaggedProbability: totalSegments > 0 ? (untaggedSegmentCount / totalSegments) * 100 : 0, hasTaggedItems: hasAnyTaggedItems, }; });

export default itemSlice.reducer;
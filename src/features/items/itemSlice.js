// src/features/items/itemSlice.js
import { createSlice, createSelector } from '@reduxjs/toolkit'; // Added createSelector
import { v4 as uuidv4 } from 'uuid';

const ITEMS_STORAGE_KEY = 'trueRandomWheel_items';
const MAX_ITEMS_OVERALL = 300;

const loadItemsFromStorage = () => { /* ... same as Response #51 ... */ try { const storedItems = localStorage.getItem(ITEMS_STORAGE_KEY); if (storedItems) { const parsed = JSON.parse(storedItems); if (Array.isArray(parsed)) { return parsed.map(item => ({ ...item, tags: Array.isArray(item.tags) ? item.tags : [], })); } } } catch (error) { console.error("[itemSlice] Error loading items from localStorage:", error); } return []; };
const saveItemsToStorage = (items) => { /* ... same as Response #51 ... */ try { localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(items)); } catch (error) { console.error("[itemSlice] Error saving items to localStorage:", error); } };

const initialState = { /* ... same as Response #51 ... */ items: loadItemsFromStorage(), };

const itemSlice = createSlice({ /* ... name, initialState, reducers same as Response #51 ... */
    name: 'items',
    initialState,
    reducers: {
        setItems: (state, action) => { state.items = action.payload.map(item => ({ ...item, tags: Array.isArray(item.tags) ? item.tags : [], })); saveItemsToStorage(state.items); },
        addItemEntry: (state, action) => { const { name, quantity, color, tags } = action.payload; if (state.items.length + quantity > MAX_ITEMS_OVERALL) { console.warn(`[itemSlice] Cannot add items: Exceeds maximum limit of ${MAX_ITEMS_OVERALL} items.`); return; } const sourceGroupId = `sg-${(typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : uuidv4()}`; const newIndividualItems = Array.from({ length: quantity }, (_, i) => ({ id: `item-${sourceGroupId}-${i}-${Math.random().toString(36).substring(2, 7)}`, name: name, color: color || undefined, sourceGroup: sourceGroupId, tags: tags || [], })); state.items.push(...newIndividualItems); saveItemsToStorage(state.items); },
        removeItemSourceGroup: (state, action) => { const sourceGroupIdToRemove = action.payload; state.items = state.items.filter(item => item.sourceGroup !== sourceGroupIdToRemove); saveItemsToStorage(state.items); },
        incrementItemGroupQuantity: (state, action) => { if (state.items.length >= MAX_ITEMS_OVERALL) { console.warn(`[itemSlice] Cannot increment: Max items limit reached.`); return; } const sourceGroupIdToIncrement = action.payload; const itemToClone = state.items.find(item => item.sourceGroup === sourceGroupIdToIncrement); if (itemToClone) { const newItemInstance = { ...itemToClone, id: `item-${sourceGroupIdToIncrement}-${(typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : uuidv4().slice(0,8)}-${Math.random().toString(36).substring(2, 7)}`, }; state.items.push(newItemInstance); saveItemsToStorage(state.items); } },
        decrementItemGroupQuantity: (state, action) => { const sourceGroupIdToDecrement = action.payload; const firstItemIndexInGroup = state.items.findIndex(item => item.sourceGroup === sourceGroupIdToDecrement); if (firstItemIndexInGroup !== -1) { state.items.splice(firstItemIndexInGroup, 1); saveItemsToStorage(state.items); } },
        removeItemInstance: (state, action) => { const itemIdToRemove = action.payload; state.items = state.items.filter(item => item.id !== itemIdToRemove); saveItemsToStorage(state.items); }
    },
});

export const { /* ... actions same as Response #51 ... */
    setItems, addItemEntry, removeItemSourceGroup,
    incrementItemGroupQuantity, decrementItemGroupQuantity,
    removeItemInstance
} = itemSlice.actions;

export const selectAllItems = (state) => state.items.items;

// ***** NEW SELECTOR for Tag-Based Odds *****
export const selectTagBasedOdds = createSelector(
    [selectAllItems], // Input selector
    (items) => {      // Result function
        const totalSegments = items.length;

        if (totalSegments === 0) {
            return {
                totalSegments: 0,
                taggedOdds: [],
                untaggedCount: 0,
                untaggedProbability: 0,
                hasTaggedItems: false,
            };
        }

        const tagCounts = new Map();
        let untaggedSegmentCount = 0;
        let hasAnyTaggedItems = false;

        items.forEach(item => {
            if (item.tags && item.tags.length > 0) {
                hasAnyTaggedItems = true;
                // Use a Set for current item's tags to count an item only once per unique tag it has
                const uniqueTagsForItem = new Set(item.tags);
                uniqueTagsForItem.forEach(tag => {
                    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
                });
            } else {
                untaggedSegmentCount++;
            }
        });

        const taggedOdds = [];
        for (const [tag, count] of tagCounts) {
            taggedOdds.push({
                tag: tag,
                count: count,
                probability: (count / totalSegments) * 100,
            });
        }
        // Sort alphabetically for consistent display
        taggedOdds.sort((a, b) => a.tag.localeCompare(b.tag));

        return {
            totalSegments,
            taggedOdds,
            untaggedCount: untaggedSegmentCount,
            untaggedProbability: totalSegments > 0 ? (untaggedSegmentCount / totalSegments) * 100 : 0,
            hasTaggedItems: hasAnyTaggedItems,
        };
    }
);
// ***** END NEW SELECTOR *****

export default itemSlice.reducer;
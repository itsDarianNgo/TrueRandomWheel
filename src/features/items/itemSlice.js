// src/features/items/itemSlice.js
import { createSlice, createSelector } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

const ITEMS_STORAGE_KEY = 'trueRandomWheel_items';
const MAX_ITEMS_OVERALL = 300;
const UNCATEGORIZED_INTERNAL_KEY = '__UNCATEGORIZED__'; // Key for internal map

const loadItemsFromStorage = () => { /* ... same as Response #55 ... */ try { const storedItems = localStorage.getItem(ITEMS_STORAGE_KEY); if (storedItems) { const parsed = JSON.parse(storedItems); if (Array.isArray(parsed)) { return parsed.map(item => ({ ...item, category: item.category !== undefined ? item.category : null, })); } } } catch (error) { console.error("[itemSlice] Error loading items from localStorage:", error); } return []; };
const saveItemsToStorage = (items) => { /* ... same as Response #55 ... */ try { localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(items)); } catch (error) { console.error("[itemSlice] Error saving items to localStorage:", error); } };

const initialState = {
    items: loadItemsFromStorage(),
};

const itemSlice = createSlice({ /* ... name, initialState, reducers (setItems, addItemEntry, etc.) same as Response #55 ... */
    name: 'items',
    initialState,
    reducers: {
        setItems: (state, action) => { state.items = action.payload.map(item => ({ ...item, category: item.category !== undefined ? item.category : null })); saveItemsToStorage(state.items); },
        addItemEntry: (state, action) => { const { name, quantity, color, category } = action.payload; if (state.items.length + quantity > MAX_ITEMS_OVERALL) { console.warn(`[itemSlice] Cannot add items: Exceeds maximum limit of ${MAX_ITEMS_OVERALL} items.`); return; } const trimmedCategory = typeof category === 'string' ? category.trim() : null; const finalCategory = trimmedCategory === '' ? null : trimmedCategory; const sourceGroupId = `sg-${(typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : uuidv4()}`; const newIndividualItems = Array.from({ length: quantity }, (_, i) => ({ id: `item-${sourceGroupId}-${i}-${Math.random().toString(36).substring(2, 7)}`, name: name, color: color || undefined, sourceGroup: sourceGroupId, category: finalCategory, })); state.items.push(...newIndividualItems); saveItemsToStorage(state.items); },
        removeItemSourceGroup: (state, action) => { const sourceGroupIdToRemove = action.payload; state.items = state.items.filter(item => item.sourceGroup !== sourceGroupIdToRemove); saveItemsToStorage(state.items); },
        incrementItemGroupQuantity: (state, action) => { if (state.items.length >= MAX_ITEMS_OVERALL) { console.warn(`[itemSlice] Cannot increment: Max items limit reached.`); return; } const sourceGroupIdToIncrement = action.payload; const itemToClone = state.items.find(item => item.sourceGroup === sourceGroupIdToIncrement); if (itemToClone) { const newItemInstance = { ...itemToClone, id: `item-${sourceGroupIdToIncrement}-${(typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : uuidv4().slice(0,8)}-${Math.random().toString(36).substring(2, 7)}`, }; state.items.push(newItemInstance); saveItemsToStorage(state.items); } },
        decrementItemGroupQuantity: (state, action) => { const sourceGroupIdToDecrement = action.payload; const firstItemIndexInGroup = state.items.findIndex(item => item.sourceGroup === sourceGroupIdToDecrement); if (firstItemIndexInGroup !== -1) { state.items.splice(firstItemIndexInGroup, 1); saveItemsToStorage(state.items); } },
        removeItemInstance: (state, action) => { const itemIdToRemove = action.payload; state.items = state.items.filter(item => item.id !== itemIdToRemove); saveItemsToStorage(state.items); }
    },
});

export const {
    setItems, addItemEntry, removeItemSourceGroup,
    incrementItemGroupQuantity, decrementItemGroupQuantity, removeItemInstance
} = itemSlice.actions;

export const selectAllItems = (state) => state.items.items;
export const selectItemOddsByName = createSelector( /* ... same as Response #51 ... */ [selectAllItems], (items) => { if (!items || items.length === 0) { return {}; } const totalSegments = items.length; if (totalSegments === 0) { return {}; } const nameCounts = items.reduce((acc, item) => { acc[item.name] = (acc[item.name] || 0) + 1; return acc; }, {}); const oddsMap = {}; for (const name in nameCounts) { const firstItemOfName = items.find(item => item.name === name); oddsMap[name] = { totalQuantity: nameCounts[name], odds: nameCounts[name] / totalSegments, representativeColor: firstItemOfName ? firstItemOfName.color : undefined, }; } return oddsMap; } );

// ***** NEW MEMOIZED SELECTOR for Odds by Category *****
export const selectCategoryOdds = createSelector(
    [selectAllItems],
    (items) => {
        if (!items || items.length === 0) {
            return []; // Return empty array if no items
        }

        const totalSegments = items.length;
        if (totalSegments === 0) {
            return [];
        }

        const categoryDataMap = items.reduce((acc, item) => {
            const categoryKey = item.category === null ? UNCATEGORIZED_INTERNAL_KEY : item.category;

            if (!acc[categoryKey]) {
                acc[categoryKey] = {
                    categoryNameDisplay: item.category, // Store original category name (null or string)
                    totalQuantity: 0,
                    // Store the color of the first item encountered in this category as representative
                    representativeColor: item.color,
                };
            }
            acc[categoryKey].totalQuantity += 1;
            // If a later item in the same category has a color and the first one didn't, update representativeColor
            if (acc[categoryKey].representativeColor === undefined && item.color !== undefined) {
                acc[categoryKey].representativeColor = item.color;
            }
            return acc;
        }, {});

        const resultArray = Object.entries(categoryDataMap).map(([key, data]) => ({
            categoryName: data.categoryNameDisplay, // Use the stored original category name (null or string)
            totalQuantity: data.totalQuantity,
            odds: data.totalQuantity / totalSegments,
            representativeColor: data.representativeColor,
        }));

        // Sort: Uncategorized (categoryName: null) last, others alphabetically
        resultArray.sort((a, b) => {
            if (a.categoryName === null && b.categoryName !== null) return 1;  // a (Uncategorized) comes after b
            if (a.categoryName !== null && b.categoryName === null) return -1; // a comes before b (Uncategorized)
            if (a.categoryName === null && b.categoryName === null) return 0;  // both Uncategorized

            // Both are named categories, sort alphabetically
            return (a.categoryName || '').localeCompare(b.categoryName || '');
        });

        return resultArray;
    }
);
// ***** END NEW SELECTOR *****

export default itemSlice.reducer;
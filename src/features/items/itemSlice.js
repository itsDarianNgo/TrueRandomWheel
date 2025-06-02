// src/features/items/itemSlice.js
import { createSlice, createSelector } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

const ITEMS_STORAGE_KEY = 'trueRandomWheel_items';
export const MAX_ITEMS_OVERALL = 300; // Exported for use in UI components

// loadItemsFromStorage and saveItemsToStorage remain unchanged from previous versions
const loadItemsFromStorage = () => {
    try {
        const storedItems = localStorage.getItem(ITEMS_STORAGE_KEY);
        if (storedItems) {
            const parsed = JSON.parse(storedItems);
            if (Array.isArray(parsed)) {
                // Ensure tags array exists, default to empty if not (for data safety from older versions)
                return parsed.map(item => ({ ...item, tags: Array.isArray(item.tags) ? item.tags : [] }));
            }
        }
    } catch (error) { console.error("[itemSlice] Error loading items from localStorage:", error); }
    return [];
};
const saveItemsToStorage = (items) => {
    try {
        localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(items));
    } catch (error) { console.error("[itemSlice] Error saving items to localStorage:", error); }
};

const initialState = {
    items: loadItemsFromStorage(),
};

const itemSlice = createSlice({
    name: 'items',
    initialState,
    reducers: {
        setItems: (state, action) => {
            // Ensure tags array exists on payload items as well
            state.items = action.payload.map(item => ({ ...item, tags: Array.isArray(item.tags) ? item.tags : [] }));
            saveItemsToStorage(state.items);
        },
        addItemEntry: (state, action) => {
            const { name, quantity, color, tags } = action.payload;
            if (state.items.length + quantity > MAX_ITEMS_OVERALL) {
                console.warn(`[itemSlice] AddItemEntry: Cannot add items: Exceeds maximum limit of ${MAX_ITEMS_OVERALL} items.`);
                return;
            }
            // Each call to addItemEntry creates a new, unique sourceGroup
            const sourceGroupId = `sg-${(typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : uuidv4()}`;
            const newIndividualItems = Array.from({ length: quantity }, (_, i) => ({
                id: `item-${sourceGroupId}-${i}-${Math.random().toString(36).substring(2, 7)}`, // Unique ID for each instance
                name: name,
                color: color || undefined, // Ensure undefined if no color, for default palette
                sourceGroup: sourceGroupId,
                tags: tags || [],
            }));
            state.items.push(...newIndividualItems);
            saveItemsToStorage(state.items);
        },
        updateItemGroup: (state, action) => {
            const { sourceGroupId, newName, newColor, newTags } = action.payload;
            state.items = state.items.map(item => {
                if (item.sourceGroup === sourceGroupId) {
                    return {
                        ...item,
                        name: newName,
                        // Ensure newColor is truly undefined if it's meant to be default, not just empty string
                        color: newColor === undefined || newColor === '' || newColor === '#' ? undefined : newColor,
                        tags: newTags || []
                    };
                }
                return item;
            });
            saveItemsToStorage(state.items);
        },
        removeItemSourceGroup: (state, action) => {
            const sourceGroupIdToRemove = action.payload;
            state.items = state.items.filter(item => item.sourceGroup !== sourceGroupIdToRemove);
            saveItemsToStorage(state.items);
        },
        incrementItemGroupQuantity: (state, action) => {
            if (state.items.length >= MAX_ITEMS_OVERALL) {
                console.warn(`[itemSlice] Increment: Max items limit reached.`);
                return;
            }
            const sourceGroupIdToIncrement = action.payload;
            const itemToClone = state.items.find(item => item.sourceGroup === sourceGroupIdToIncrement);
            if (itemToClone) {
                const newItemInstance = {
                    ...itemToClone,
                    // Generate a new unique ID for the new instance
                    id: `item-${sourceGroupIdToIncrement}-CLONE-${(typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID().slice(0,8) : uuidv4().slice(0,8)}-${Math.random().toString(36).substring(2,7)}`,
                };
                state.items.push(newItemInstance);
                saveItemsToStorage(state.items);
            }
        },
        decrementItemGroupQuantity: (state, action) => {
            const sourceGroupIdToDecrement = action.payload;
            // Find the index of the first item belonging to the group to remove one instance
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
        },

        // ***** MODIFIED REDUCER for adding multiple item entries *****
        addMultipleItemEntries: (state, action) => {
            const { names } = action.payload; // Expect 'names' to be an array of strings

            if (!Array.isArray(names) || names.length === 0) {
                console.warn('[itemSlice] AddMultiple: No names provided or invalid format.');
                return;
            }

            const itemsToAddCount = names.length; // Each name string results in one item
            if (state.items.length + itemsToAddCount > MAX_ITEMS_OVERALL) {
                console.warn(`[itemSlice] AddMultiple: Cannot add ${itemsToAddCount} items. Total items would exceed limit of ${MAX_ITEMS_OVERALL}. Current: ${state.items.length}.`);
                // TODO: Optionally dispatch a notification to the UI about this failure.
                return;
            }

            const newBulkItems = names.map((name) => {
                // Generate a new, unique sourceGroupId for EACH name/line from the bulk add.
                // This makes each line behave as if it were added individually via AddItemForm with quantity 1.
                const newUniqueSourceGroupId = `sg-${(typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : uuidv4()}`;

                return {
                    // Generate a unique ID for the item instance itself.
                    // Using the newUniqueSourceGroupId ensures this item ID is also distinct.
                    id: `bitem-${newUniqueSourceGroupId}-${Math.random().toString(36).substring(2, 9)}`,
                    name: name.trim(), // Ensure names are trimmed
                    color: undefined,  // Will use default palette behavior in WheelCanvas
                    sourceGroup: newUniqueSourceGroupId, // Assign the unique sourceGroup
                    tags: [],          // Default to no tags for bulk added items
                };
            });

            state.items.push(...newBulkItems);
            saveItemsToStorage(state.items);
            console.log(`[itemSlice] Added ${newBulkItems.length} items via bulk add.`);
        },
        // ***** END MODIFICATION *****
    },
});

export const {
    setItems, addItemEntry, removeItemSourceGroup,
    incrementItemGroupQuantity, decrementItemGroupQuantity,
    removeItemInstance, updateItemGroup,
    addMultipleItemEntries
} = itemSlice.actions;

// Selectors (remain unchanged)
export const selectAllItems = (state) => state.items.items;

// selectTagBasedOdds selector remains unchanged from previous versions
export const selectTagBasedOdds = createSelector(
    [selectAllItems],
    (items) => {
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

        const tagCounts = new Map(); // Stores count of segments for each tag
        let untaggedSegmentCount = 0;
        let hasAnyTaggedItems = false;

        items.forEach(item => {
            if (item.tags && item.tags.length > 0) {
                hasAnyTaggedItems = true;
                // Use a Set to count each tag only once per item, even if duplicated in item.tags array
                const uniqueTagsForItem = new Set(item.tags.map(tag => tag.toLowerCase()));
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
        // Sort tags alphabetically for consistent display order
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

export default itemSlice.reducer;
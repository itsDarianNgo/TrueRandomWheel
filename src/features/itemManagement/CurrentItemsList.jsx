// src/features/itemManagement/CurrentItemsList.jsx
import React from 'react';
import PropTypes from 'prop-types';

// Helper function to group items by sourceGroup for display
const groupItemsForDisplay = (items) => {
    if (!items || items.length === 0) {
        return [];
    }
    const grouped = items.reduce((acc, item) => {
        // Ensure sourceGroup exists, default to item.id if it's a truly individual item without a group
        const groupId = item.sourceGroup || `individual-${item.id}`;
        if (!acc[groupId]) {
            acc[groupId] = {
                sourceGroupId: groupId,
                name: item.name,
                color: item.color, // Assume all items in a sourceGroup share the same name and color
                quantity: 0,
                // Store one representative item from the group to get its details if needed
                // or store the first item's full details.
                firstItemId: item.id
            };
        }
        acc[groupId].quantity += 1;
        return acc;
    }, {});
    return Object.values(grouped);
};

const CurrentItemsList = ({ items, onRemoveItemGroup, className = '' }) => {
    const displayedItems = groupItemsForDisplay(items);

    if (displayedItems.length === 0) {
        return (
            <div className={`p-6 bg-slate-800 rounded-xl shadow-xl text-center ${className}`}>
                <p className="text-slate-400 italic">No items added to the wheel yet.</p>
            </div>
        );
    }

    return (
        <div className={`p-6 bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg mx-auto ${className}`}>
            <h3 className="text-xl font-semibold text-center text-sky-400 mb-6">Current Wheel Items</h3>
            <ul className="space-y-3 max-h-96 overflow-y-auto pr-2"> {/* Added max-height and scroll */}
                {displayedItems.map((group) => (
                    <li
                        key={group.sourceGroupId}
                        className="flex items-center justify-between p-3 bg-slate-700 rounded-lg shadow transition-all duration-150 ease-in-out hover:bg-slate-600/70"
                    >
                        <div className="flex items-center space-x-3">
              <span
                  className="w-5 h-5 rounded-sm border border-slate-500 flex-shrink-0"
                  style={{ backgroundColor: group.color || '#A0A0A0' }} // Default color if not provided
                  title={`Color: ${group.color || 'Default'}`}
              ></span>
                            <span className="text-slate-100 font-medium truncate" title={group.name}>
                {group.name}
              </span>
                            <span className="text-xs text-slate-400 bg-slate-600 px-2 py-0.5 rounded-full">
                Qty: {group.quantity}
              </span>
                        </div>
                        <button
                            onClick={() => onRemoveItemGroup(group.sourceGroupId)}
                            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-700 rounded-md"
                            title={`Remove ${group.name} (all ${group.quantity})`}
                            aria-label={`Remove ${group.name} group`}
                        >
                            {/* Simple X icon (can be replaced with SVG) */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

CurrentItemsList.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        color: PropTypes.string,
        sourceGroup: PropTypes.string, // Crucial for grouping
    })).isRequired,
    onRemoveItemGroup: PropTypes.func.isRequired,
    className: PropTypes.string,
};

export default CurrentItemsList;
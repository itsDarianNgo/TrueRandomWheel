// src/features/itemManagement/CurrentItemsList.jsx
import React from 'react'; // Ensure React is imported
import PropTypes from 'prop-types';

// Helper function groupItemsForDisplay (Unchanged from Response #23)
const groupItemsForDisplay = (items) => {
    if (!items || items.length === 0) {
        return [];
    }
    const grouped = items.reduce((acc, item) => {
        const groupId = item.sourceGroup || `individual-${item.id}`;
        if (!acc[groupId]) {
            acc[groupId] = {
                sourceGroupId: groupId,
                name: item.name,
                color: item.color,
                quantity: 0,
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

    const handleRemoveClick = (group) => {
        // ***** CONFIRMATION LOGIC *****
        const confirmationMessage = `Are you sure you want to remove "${group.name}" (Qty: ${group.quantity}) from the wheel?`;
        if (window.confirm(confirmationMessage)) {
            onRemoveItemGroup(group.sourceGroupId);
        }
        // If window.confirm is false, do nothing.
    };

    if (displayedItems.length === 0) {
        return (
            <div className={`p-6 bg-slate-800 rounded-xl shadow-xl text-center ${className}`}>
                <p className="text-slate-400 italic">No items added to the wheel yet.</p>
                {/* Optionally, add an icon here like in AddItemForm's empty state */}
            </div>
        );
    }

    return (
        <div className={`p-6 bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg mx-auto ${className}`}>
            <h3 className="text-xl font-semibold text-center text-sky-400 mb-6">Current Wheel Items</h3>
            {displayedItems.length > 0 ? (
                <ul className="space-y-3 max-h-96 overflow-y-auto pr-2"> {/* Scrollbar styling is browser-default for now */}
                    {displayedItems.map((group) => (
                        <li
                            key={group.sourceGroupId}
                            className="flex items-center justify-between p-3 bg-slate-700 rounded-lg shadow transition-all duration-150 ease-in-out hover:bg-slate-600/70 group" // Added 'group' for potential group-hover on children
                        >
                            <div className="flex items-center space-x-3 overflow-hidden"> {/* Added overflow-hidden for long names */}
                                <span
                                    className="w-5 h-5 rounded-sm border border-slate-500 flex-shrink-0"
                                    style={{ backgroundColor: group.color || '#A0A0A0' }}
                                    title={`Color: ${group.color || 'Default'}`}
                                ></span>
                                <span className="text-slate-100 font-medium truncate" title={group.name}>
                  {group.name}
                </span>
                                <span className="text-xs text-slate-400 bg-slate-600 px-2 py-0.5 rounded-full flex-shrink-0">
                  Qty: {group.quantity}
                </span>
                            </div>
                            <button
                                onClick={() => handleRemoveClick(group)} // Call the new handler
                                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-700 rounded-md opacity-70 group-hover:opacity-100" // Opacity change on li hover
                                title={`Remove ${group.name} (all ${group.quantity})`}
                                aria-label={`Remove ${group.name} group`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                // This case should ideally be caught by the check at the top, but as a fallback:
                <p className="text-slate-400 italic text-center">No items to display.</p>
            )}
        </div>
    );
};

CurrentItemsList.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        color: PropTypes.string,
        sourceGroup: PropTypes.string,
    })).isRequired,
    onRemoveItemGroup: PropTypes.func.isRequired,
    className: PropTypes.string,
};

export default CurrentItemsList;
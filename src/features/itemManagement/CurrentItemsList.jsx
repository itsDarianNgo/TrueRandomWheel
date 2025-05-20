// src/features/itemManagement/CurrentItemsList.jsx
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../components/Modal'; // Import the custom Modal component

// Helper function groupItemsForDisplay (Ensure this is exactly as in Response #23 or #34)
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
                firstItemId: item.id // Store one representative item's ID
            };
        }
        acc[groupId].quantity += 1;
        return acc;
    }, {});
    return Object.values(grouped);
};

const CurrentItemsList = ({ items, onRemoveItemGroup, className = '' }) => {
    const displayedItems = groupItemsForDisplay(items);

    // State for managing the confirmation modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemGroupToRemove, setItemGroupToRemove] = useState(null); // Stores the group object {sourceGroupId, name, quantity}

    const openConfirmationModal = useCallback((group) => {
        setItemGroupToRemove(group);
        setIsModalOpen(true);
    }, []);

    const closeConfirmationModal = useCallback(() => {
        setIsModalOpen(false);
        // It's good practice to clear the item being removed when the modal is closed without confirmation
        // to avoid potential stale state if the modal is reopened for a different item quickly.
        // However, itemGroupToRemove is primarily read when handleConfirmRemove is called.
        // For strictness, we can clear it:
        // setItemGroupToRemove(null);
        // But often it's left until a new item triggers openConfirmationModal or on successful removal.
        // Let's keep it simple and clear it on successful removal or explicit close.
    }, []);

    const handleConfirmRemove = useCallback(() => {
        if (itemGroupToRemove) {
            onRemoveItemGroup(itemGroupToRemove.sourceGroupId);
        }
        // Close modal and clear the targeted item AFTER action is dispatched
        setIsModalOpen(false);
        setItemGroupToRemove(null);
    }, [itemGroupToRemove, onRemoveItemGroup]); // Removed closeConfirmationModal from deps, direct calls now


    if (displayedItems.length === 0) {
        return (
            <div className={`p-6 bg-slate-800 rounded-xl shadow-xl text-center ${className}`}>
                <p className="text-slate-400 italic">No items added to the wheel yet.</p>
            </div>
        );
    }

    return (
        <> {/* Fragment to allow Modal to be a sibling to the list container */}
            <div className={`p-6 bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg mx-auto ${className}`}>
                <h3 className="text-xl font-semibold text-center text-sky-400 mb-6">Current Wheel Items</h3>
                {displayedItems.length > 0 ? (
                    <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {displayedItems.map((group) => (
                            <li
                                key={group.sourceGroupId}
                                className="flex items-center justify-between p-3 bg-slate-700 rounded-lg shadow transition-all duration-150 ease-in-out hover:bg-slate-600/70 group"
                            >
                                <div className="flex items-center space-x-3 overflow-hidden">
                  <span
                      className="w-5 h-5 rounded-sm border border-slate-500 flex-shrink-0"
                      style={{ backgroundColor: group.color || '#A0A0A0' }} // Default color if not provided
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
                                    onClick={() => openConfirmationModal(group)} // Open modal with the current group's data
                                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-700 rounded-md opacity-70 group-hover:opacity-100"
                                    title={`Remove ${group.name} (all ${group.quantity})`}
                                    aria-label={`Remove ${group.name} group`}
                                >
                                    {/* Simple X icon SVG (as before) */}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    // This specific case should be rare if displayedItems.length === 0 is handled above,
                    // but kept as a defensive measure.
                    <p className="text-slate-400 italic text-center">No items to display.</p>
                )}
            </div>

            {/* Confirmation Modal Integration */}
            {/* Render Modal only if itemGroupToRemove is set, ensuring data is available for the message */}
            {itemGroupToRemove && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => { // Consolidate close logic here
                        setIsModalOpen(false);
                        setItemGroupToRemove(null);
                    }}
                    title="Confirm Removal"
                    size="sm" // Use a smaller modal for simple confirmations
                    footerContent={
                        <> {/* Using React Fragment for multiple buttons in footer */}
                            <button
                                type="button"
                                onClick={() => { // Consolidate close logic here
                                    setIsModalOpen(false);
                                    setItemGroupToRemove(null);
                                }}
                                className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmRemove} // This already calls setIsModalOpen(false) and setItemGroupToRemove(null)
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors"
                            >
                                Remove Group
                            </button>
                        </>
                    }
                >
                    {/* Modal Body Content */}
                    <p className="text-slate-300">
                        Are you sure you want to remove the item group <strong className="font-semibold text-sky-400">"{itemGroupToRemove.name}"</strong> (Quantity: {itemGroupToRemove.quantity}) from the wheel?
                    </p>
                    <p className="mt-2 text-xs text-slate-400">This action cannot be undone.</p>
                </Modal>
            )}
        </>
    );
};

CurrentItemsList.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        color: PropTypes.string,
        sourceGroup: PropTypes.string, // Crucial for grouping logic
    })).isRequired,
    onRemoveItemGroup: PropTypes.func.isRequired,
    className: PropTypes.string,
};

export default CurrentItemsList;
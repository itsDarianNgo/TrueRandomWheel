// src/features/itemManagement/CurrentItemsList.jsx
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../components/Modal';

const groupItemsForDisplay = (items) => { /* ... (Unchanged from Response #40) ... */
    if (!items || items.length === 0) return [];
    const grouped = items.reduce((acc, item) => {
        const groupId = item.sourceGroup || `individual-${item.id}`;
        if (!acc[groupId]) {
            acc[groupId] = { sourceGroupId: groupId, name: item.name, color: item.color, quantity: 0, firstItemId: item.id };
        }
        acc[groupId].quantity += 1; return acc;
    }, {});
    return Object.values(grouped);
};


const CurrentItemsList = ({ items, onRemoveItemGroup, isSpinning, className = '' }) => { // Added isSpinning prop
    const displayedItems = groupItemsForDisplay(items);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemGroupToRemove, setItemGroupToRemove] = useState(null);

    const openConfirmationModal = useCallback((group) => {
        if (isSpinning) return; // Prevent opening modal if spinning
        setItemGroupToRemove(group);
        setIsModalOpen(true);
    }, [isSpinning]); // Added isSpinning dependency

    // handleConfirmRemove, closeConfirmationModal (Unchanged from Response #40)
    const closeConfirmationModal = useCallback(() => { setIsModalOpen(false); /* setItemGroupToRemove(null); // optional here */ }, []);
    const handleConfirmRemove = useCallback(() => { if (itemGroupToRemove) { onRemoveItemGroup(itemGroupToRemove.sourceGroupId); } setIsModalOpen(false); setItemGroupToRemove(null); }, [itemGroupToRemove, onRemoveItemGroup]);


    if (displayedItems.length === 0) { /* ... (Unchanged) ... */
        return (<div className={`p-6 bg-slate-800 rounded-xl shadow-xl text-center ${className}`}><p className="text-slate-400 italic">No items added to the wheel yet.</p></div>);
    }

    return (
        <>
            <div className={`p-6 bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg mx-auto ${className}`}>
                <h3 className="text-xl font-semibold text-center text-sky-400 mb-6">Current Wheel Items</h3>
                {displayedItems.length > 0 ? (
                    <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {displayedItems.map((group) => (
                            <li key={group.sourceGroupId} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg shadow transition-all duration-150 ease-in-out hover:bg-slate-600/70 group">
                                <div className="flex items-center space-x-3 overflow-hidden">
                                    <span className="w-5 h-5 rounded-sm border border-slate-500 flex-shrink-0" style={{ backgroundColor: group.color || '#A0A0A0' }} title={`Color: ${group.color || 'Default'}`}></span>
                                    <span className="text-slate-100 font-medium truncate" title={group.name}>{group.name}</span>
                                    <span className="text-xs text-slate-400 bg-slate-600 px-2 py-0.5 rounded-full flex-shrink-0">Qty: {group.quantity}</span>
                                </div>
                                <button
                                    onClick={() => openConfirmationModal(group)}
                                    disabled={isSpinning} // ***** MODIFICATION: Disable button if spinning *****
                                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-700 rounded-md opacity-70 group-hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-400"
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
                ) : ( <p className="text-slate-400 italic text-center">No items to display.</p> )}
            </div>

            {itemGroupToRemove && ( <Modal isOpen={isModalOpen} onClose={closeConfirmationModal} title="Confirm Removal" size="sm" footerContent={<> <button type="button" onClick={closeConfirmationModal} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors">Cancel</button> <button type="button" onClick={handleConfirmRemove} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors">Remove Group</button></>}> <p className="text-slate-300">Are you sure you want to remove <strong className="font-semibold text-sky-400">"{itemGroupToRemove.name}"</strong> (Qty: {itemGroupToRemove.quantity})?</p><p className="mt-2 text-xs text-slate-400">This action cannot be undone.</p></Modal>)}
        </>
    );
};

CurrentItemsList.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({ /* ... */ })).isRequired,
    onRemoveItemGroup: PropTypes.func.isRequired,
    isSpinning: PropTypes.bool.isRequired, // Added propType
    className: PropTypes.string,
};

export default CurrentItemsList;
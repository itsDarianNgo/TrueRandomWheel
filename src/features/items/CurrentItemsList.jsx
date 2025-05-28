// src/features/items/CurrentItemsList.jsx
import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import {
    selectAllItems,
    removeItemSourceGroup,
    incrementItemGroupQuantity,
    decrementItemGroupQuantity
} from './itemSlice';
import { selectWheelStatus } from '../wheel/WheelSlice';
import Modal from '../../components/common/Modal';

const IconMinus = ({ className = "w-4 h-4" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>);
const IconPlus = ({ className = "w-4 h-4" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>);

// MODIFIED: Helper function to group items for display, now includes tags.
const groupItemsForDisplay = (items) => {
    if (!items || items.length === 0) return [];
    const grouped = items.reduce((acc, item) => {
        const groupId = item.sourceGroup;
        if (!acc[groupId]) {
            acc[groupId] = {
                sourceGroupId: groupId,
                name: item.name,
                color: item.color,
                tags: Array.isArray(item.tags) ? item.tags : [], // Ensure tags is an array
                quantity: 0,
            };
        }
        acc[groupId].quantity += 1;
        return acc;
    }, {});
    return Object.values(grouped).sort((a,b) => a.name.localeCompare(b.name));
};

// Displays the list of current items on the wheel, allowing quantity adjustments and removal.
const CurrentItemsList = ({ className = '' }) => {
    const dispatch = useDispatch();
    const allItems = useSelector(selectAllItems);
    const wheelStatus = useSelector(selectWheelStatus);
    const isListDisabled = wheelStatus !== 'idle';

    const displayedItems = useMemo(() => groupItemsForDisplay(allItems), [allItems]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemGroupForModal, setItemGroupForModal] = useState(null);

    const openConfirmationModal = useCallback((group) => { /* ... same as Response #45 ... */ if (isListDisabled) return; setItemGroupForModal(group); setIsModalOpen(true); }, [isListDisabled]);
    const closeConfirmationModal = useCallback(() => { /* ... same as Response #45 ... */ setIsModalOpen(false); }, []);
    const handleConfirmRemove = useCallback(() => { /* ... same as Response #45 ... */ if (itemGroupForModal) { dispatch(removeItemSourceGroup(itemGroupForModal.sourceGroupId)); } closeConfirmationModal(); }, [itemGroupForModal, dispatch, closeConfirmationModal]);

    if (displayedItems.length === 0) {
        return (
            <div className={`p-6 bg-slate-800 rounded-xl shadow-xl text-center ${className}`}>
                <p className="text-slate-400 italic">No items added to the wheel yet.</p>
            </div>
        );
    }

    return (
        <>
            <div className={`p-6 bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg mx-auto ${className}`}>
                <h3 className="text-xl font-semibold text-center text-sky-400 mb-6">Current Wheel Items</h3>
                {displayedItems.length > 0 ? (
                    <ul className={`space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-hide ${isListDisabled ? 'opacity-60' : ''}`}>
                        {displayedItems.map((group) => (
                            <li
                                key={group.sourceGroupId}
                                className="flex items-center justify-between p-3 bg-slate-700/80 rounded-lg shadow transition-all duration-150 ease-in-out hover:bg-slate-700 group"
                            >
                                {/* MODIFIED: Container for color swatch, name, and tags */}
                                <div className="flex items-start space-x-3 overflow-hidden flex-grow min-w-0"> {/* items-start for alignment, min-w-0 for truncation */}
                                    <span // Color Swatch
                                        className="mt-0.5 w-5 h-5 rounded-sm border border-slate-500 flex-shrink-0 shadow-sm"
                                        style={{ backgroundColor: group.color || '#A0A0A0' }}
                                        title={`Color: ${group.color || 'Default Grey'}`}
                                    ></span>
                                    <div className="flex flex-col overflow-hidden"> {/* Inner div for name and tags */}
                                        <span // Item Name
                                            className="text-slate-100 font-medium truncate text-sm"
                                            title={group.name}
                                        >
                                            {group.name}
                                        </span>
                                        {/* NEW: Tag Display Section */}
                                        {group.tags && group.tags.length > 0 && (
                                            <div className="mt-1.5 flex flex-wrap gap-x-1.5 gap-y-1"> {/* gap-x and gap-y for spacing between pills */}
                                                {group.tags.map((tag, tagIndex) => (
                                                    <span
                                                        key={tagIndex}
                                                        className="px-2 py-0.5 text-[0.7rem] leading-none bg-slate-600/70 text-sky-300 rounded-full shadow-sm"
                                                        title={`Tag: ${tag}`}
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Quantity Controls & Remove Button (structure remains same as Response #45) */}
                                <div className="flex items-center space-x-2 flex-shrink-0 ml-3"> <button onClick={() => dispatch(decrementItemGroupQuantity(group.sourceGroupId))} disabled={isListDisabled || group.quantity <= 1} className="p-1.5 text-slate-400 hover:text-sky-400 bg-slate-600 hover:bg-slate-500 rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-600" aria-label={`Decrement quantity for ${group.name}`}> <IconMinus /> </button> <span className="text-sm text-slate-300 bg-slate-600/70 px-2.5 py-1 rounded-md w-10 text-center" title="Current quantity"> {group.quantity} </span> <button onClick={() => dispatch(incrementItemGroupQuantity(group.sourceGroupId))} disabled={isListDisabled} className="p-1.5 text-slate-400 hover:text-sky-400 bg-slate-600 hover:bg-slate-500 rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-600" aria-label={`Increment quantity for ${group.name}`}> <IconPlus /> </button> </div>
                                <button onClick={() => openConfirmationModal(group)} disabled={isListDisabled} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-700 rounded-md opacity-70 group-hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-400 ml-2 flex-shrink-0" title={`Remove all ${group.quantity} of ${group.name}`} aria-label={`Remove ${group.name} group`}> <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"> <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> </svg> </button>
                            </li>
                        ))}
                    </ul>
                ) : ( <p className="text-slate-400 italic text-center">No items to display.</p> )}
            </div>

            {/* Modal (same as Response #45) */}
            {itemGroupForModal && ( <Modal isOpen={isModalOpen} onClose={closeConfirmationModal} title="Confirm Removal" size="sm" footerContent={ <> <button type="button" onClick={closeConfirmationModal} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-lg shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 transition-colors">Cancel</button> <button type="button" onClick={handleConfirmRemove} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 transition-colors">Remove Group</button> </> } > <p className="text-slate-300">Are you sure you want to remove all items named <strong className="font-semibold text-sky-400">"{itemGroupForModal.name}"</strong> (Quantity: {itemGroupForModal.quantity})?</p> <p className="mt-2 text-xs text-slate-400">This action cannot be undone.</p> </Modal>)}
        </>
    );
};
CurrentItemsList.propTypes = { className: PropTypes.string };
export default CurrentItemsList;
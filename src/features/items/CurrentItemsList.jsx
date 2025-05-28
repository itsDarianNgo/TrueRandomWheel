// src/features/items/CurrentItemsList.jsx
import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import {
    selectAllItems, removeItemSourceGroup, incrementItemGroupQuantity,
    decrementItemGroupQuantity, selectItemOddsByName
} from './itemSlice';
import { selectWheelStatus } from '../wheel/WheelSlice.js';
import Modal from '../../components/common/Modal';

const IconMinus = ({ className = "w-4 h-4" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>);
const IconPlus = ({ className = "w-4 h-4" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>);

// MODIFIED groupItemsForDisplay to include category
const groupItemsForDisplay = (items) => {
    if (!items || items.length === 0) return [];
    const grouped = items.reduce((acc, item) => {
        const groupId = item.sourceGroup;
        if (!acc[groupId]) {
            acc[groupId] = {
                sourceGroupId: groupId,
                name: item.name,
                color: item.color,
                category: item.category, // Include category from the first item of the group
                quantity: 0,
            };
        }
        acc[groupId].quantity += 1;
        return acc;
    }, {});
    return Object.values(grouped).sort((a,b) => {
        // Optional: Sort by category then name, or just name
        if (a.category && !b.category) return -1;
        if (!a.category && b.category) return 1;
        if (a.category && b.category && a.category !== b.category) {
            return a.category.localeCompare(b.category);
        }
        return a.name.localeCompare(b.name);
    });
};

const CurrentItemsList = ({ className = '' }) => {
    const dispatch = useDispatch();
    const allItems = useSelector(selectAllItems);
    const wheelStatus = useSelector(selectWheelStatus);
    const itemOddsByName = useSelector(selectItemOddsByName);

    const isListDisabled = wheelStatus !== 'idle';
    const displayedItems = useMemo(() => groupItemsForDisplay(allItems), [allItems]);
    const totalSegmentsForTitle = allItems.length;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemGroupForModal, setItemGroupForModal] = useState(null);

    // openConfirmationModal, closeConfirmationModal, handleConfirmRemove (same as Response #51)
    const openConfirmationModal = useCallback((group) => { if (isListDisabled) return; setItemGroupForModal(group); setIsModalOpen(true); }, [isListDisabled]);
    const closeConfirmationModal = useCallback(() => { setIsModalOpen(false); }, []);
    const handleConfirmRemove = useCallback(() => { if (itemGroupForModal) { dispatch(removeItemSourceGroup(itemGroupForModal.sourceGroupId)); } closeConfirmationModal(); }, [itemGroupForModal, dispatch, closeConfirmationModal]);


    if (displayedItems.length === 0) { /* ... same empty state JSX ... */ return ( <div className={`p-6 bg-slate-800 rounded-xl shadow-xl text-center ${className}`}> <p className="text-slate-400 italic">No items added to the wheel yet.</p> </div> ); }

    return (
        <>
            <div className={`p-6 bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg mx-auto ${className}`}>
                <h3 className="text-xl font-semibold text-center text-sky-400 mb-6">Current Wheel Items</h3>
                <ul className={`space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-hide ${isListDisabled ? 'opacity-60' : ''}`}>
                    {displayedItems.map((group) => {
                        const oddsData = itemOddsByName[group.name];
                        const percentage = oddsData ? (oddsData.odds * 100).toFixed(1) : 'N/A';
                        const oddsTitle = oddsData ? `Odds: ${oddsData.totalQuantity}/${totalSegmentsForTitle}` : "Odds N/A";

                        return (
                            <li
                                key={group.sourceGroupId}
                                className="flex items-center justify-between p-3 bg-slate-700/80 rounded-lg shadow transition-all duration-150 ease-in-out hover:bg-slate-700 group"
                            >
                                <div className="flex items-start space-x-3 overflow-hidden flex-grow min-w-0"> {/* items-start for category below name */}
                                    <span
                                        className="w-5 h-5 mt-0.5 rounded-sm border border-slate-500 flex-shrink-0 shadow-sm" // Added mt-0.5 for alignment
                                        style={{ backgroundColor: group.color || '#A0A0A0' }}
                                        title={`Color: ${group.color || 'Default Grey'}`}
                                    ></span>
                                    <div className="flex-grow overflow-hidden"> {/* Wrapper for name and category */}
                                        <p className="text-slate-100 font-medium truncate text-sm" title={group.name}>
                                            {group.name}
                                        </p>
                                        {/* NEW Category Display */}
                                        {group.category && (
                                            <p className="text-xs text-sky-400/80 truncate" title={`Category: ${group.category}`}>
                                                {group.category}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* ... (Odds, Quantity, +/- buttons, Remove button - same JSX structure as Response #51) ... */}
                                <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0 ml-2"> {oddsData && totalSegmentsForTitle > 0 && ( <span className="text-xs text-sky-300 font-semibold w-14 text-right tabular-nums px-1" title={oddsTitle} > {percentage}% </span> )} <span className="text-sm text-slate-300 bg-slate-600/70 px-2 py-0.5 rounded-md w-9 text-center tabular-nums" title="Current quantity in this group" > {group.quantity} </span> <button onClick={() => dispatch(decrementItemGroupQuantity(group.sourceGroupId))} disabled={isListDisabled || group.quantity <= 1} className="p-1.5 text-slate-400 hover:text-sky-400 bg-slate-600 hover:bg-slate-500 rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500 disabled:opacity-40 disabled:cursor-not-allowed" aria-label={`Decrement quantity for ${group.name}`} > <IconMinus className="w-3.5 h-3.5 sm:w-4 sm:h-4"/> </button> <button onClick={() => dispatch(incrementItemGroupQuantity(group.sourceGroupId))} disabled={isListDisabled} className="p-1.5 text-slate-400 hover:text-sky-400 bg-slate-600 hover:bg-slate-500 rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500 disabled:opacity-40 disabled:cursor-not-allowed" aria-label={`Increment quantity for ${group.name}`} > <IconPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4"/> </button> </div>
                                <button onClick={() => openConfirmationModal(group)} disabled={isListDisabled} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-700 rounded-md opacity-70 group-hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed ml-2 flex-shrink-0" title={`Remove all ${group.quantity} of ${group.name}`} aria-label={`Remove ${group.name} group`} > <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"> <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> </svg> </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
            {/* Modal (same JSX as Response #51) */}
            {itemGroupForModal && ( <Modal isOpen={isModalOpen} onClose={closeConfirmationModal} title="Confirm Removal" size="sm" footerContent={ <> <button type="button" onClick={closeConfirmationModal} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-lg shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 transition-colors">Cancel</button> <button type="button" onClick={handleConfirmRemove} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 transition-colors">Remove Group</button> </> } > <p className="text-slate-300">Are you sure you want to remove all items named <strong className="font-semibold text-sky-400">"{itemGroupForModal.name}"</strong> (Quantity: {itemGroupForModal.quantity})?</p> <p className="mt-2 text-xs text-slate-400">This action cannot be undone.</p> </Modal>)}
        </>
    );
};
CurrentItemsList.propTypes = { className: PropTypes.string };
export default CurrentItemsList;
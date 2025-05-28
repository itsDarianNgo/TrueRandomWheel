// src/features/items/CurrentItemsList.jsx
import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import {
    selectAllItems, removeItemSourceGroup, incrementItemGroupQuantity,
    decrementItemGroupQuantity, updateItemGroup // Import new action
} from './itemSlice';
import { selectWheelStatus } from '../wheel/WheelSlice';
import Modal from '../../components/common/Modal';
import EditItemForm from './EditItemForm'; // Import new EditItemForm

// Icons (IconMinus, IconPlus, EditIcon)
const IconMinus = ({ className = "w-4 h-4" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>);
const IconPlus = ({ className = "w-4 h-4" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>);
const IconPencil = ({ className = "w-4 h-4" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>);


const groupItemsForDisplay = (items) => { /* ... same as Response #53 ... */ if (!items || items.length === 0) return []; const grouped = items.reduce((acc, item) => { const groupId = item.sourceGroup; if (!acc[groupId]) { acc[groupId] = { sourceGroupId: groupId, name: item.name, color: item.color, tags: Array.isArray(item.tags) ? item.tags : [], quantity: 0, }; } acc[groupId].quantity += 1; return acc; }, {}); return Object.values(grouped).sort((a,b) => a.name.localeCompare(b.name)); };

const CurrentItemsList = ({ className = '' }) => {
    const dispatch = useDispatch();
    const allItems = useSelector(selectAllItems);
    const wheelStatus = useSelector(selectWheelStatus);
    const isListDisabled = wheelStatus !== 'idle';
    const displayedItems = useMemo(() => groupItemsForDisplay(allItems), [allItems]);

    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
    const [itemGroupForRemoveModal, setItemGroupForRemoveModal] = useState(null);

    // ***** NEW STATE for Edit Modal *****
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItemGroup, setEditingItemGroup] = useState(null);

    const openRemoveConfirmationModal = useCallback((group) => { /* ... same ... */ if (isListDisabled) return; setItemGroupForRemoveModal(group); setIsRemoveModalOpen(true); }, [isListDisabled]);
    const closeRemoveConfirmationModal = useCallback(() => { /* ... same ... */ setIsRemoveModalOpen(false); setItemGroupForRemoveModal(null); }, []);
    const handleConfirmRemove = useCallback(() => { /* ... same ... */ if (itemGroupForRemoveModal) { dispatch(removeItemSourceGroup(itemGroupForRemoveModal.sourceGroupId)); } closeRemoveConfirmationModal(); }, [itemGroupForRemoveModal, dispatch, closeRemoveConfirmationModal]);

    // ***** NEW HANDLERS for Edit Modal *****
    const handleOpenEditModal = useCallback((groupToEdit) => {
        if (isListDisabled) return;
        setEditingItemGroup({ // Structure for EditItemForm props
            sourceGroupId: groupToEdit.sourceGroupId,
            name: groupToEdit.name,
            color: groupToEdit.color, // Will be undefined if not set
            tags: groupToEdit.tags || [],
        });
        setIsEditModalOpen(true);
    }, [isListDisabled]);

    const handleCloseEditModal = useCallback(() => {
        setIsEditModalOpen(false);
        setEditingItemGroup(null); // Clear editing data
    }, []);

    const handleSaveChanges = useCallback((updatedData) => {
        // updatedData: { sourceGroupId, newName, newColor, newTags }
        dispatch(updateItemGroup(updatedData));
        handleCloseEditModal();
    }, [dispatch, handleCloseEditModal]);


    if (displayedItems.length === 0) { /* ... same empty state ... */ return ( <div className={`p-6 bg-slate-800 rounded-xl shadow-xl text-center ${className}`}> <p className="text-slate-400 italic">No items added to the wheel yet.</p> </div> ); }

    return (
        <>
            <div className={`p-6 bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg mx-auto ${className}`}>
                <h3 className="text-xl font-semibold text-center text-sky-400 mb-6">Current Wheel Items</h3>
                {displayedItems.length > 0 ? (
                    <ul className={`space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-hide ${isListDisabled ? 'opacity-60' : ''}`}>
                        {displayedItems.map((group) => (
                            <li key={group.sourceGroupId} className="flex items-center justify-between p-3 bg-slate-700/80 rounded-lg shadow transition-all duration-150 ease-in-out hover:bg-slate-700 group" >
                                <div className="flex items-start space-x-3 overflow-hidden flex-grow min-w-0"> {/* Name, Color Swatch, Tags */}
                                    {/* ... (Color Swatch, Name, Tags display - same as Response #53) ... */}
                                    <span className="mt-0.5 w-5 h-5 rounded-sm border border-slate-500 flex-shrink-0 shadow-sm" style={{ backgroundColor: group.color || '#A0A0A0' }} title={`Color: ${group.color || 'Default Grey'}`}></span>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-slate-100 font-medium truncate text-sm" title={group.name}> {group.name} </span>
                                        {group.tags && group.tags.length > 0 && ( <div className="mt-1.5 flex flex-wrap gap-x-1.5 gap-y-1"> {group.tags.map((tag, tagIndex) => ( <span key={tagIndex} className="px-2 py-0.5 text-[0.7rem] leading-none bg-slate-600/70 text-sky-300 rounded-full shadow-sm" title={`Tag: ${tag}`}> {tag} </span> ))} </div> )}
                                    </div>
                                </div>

                                <div className="flex items-center space-x-1.5 flex-shrink-0 ml-2"> {/* Reduced space slightly */}
                                    {/* Edit Button (New) */}
                                    <button onClick={() => handleOpenEditModal(group)} disabled={isListDisabled} className="p-1.5 text-slate-400 hover:text-sky-400 bg-slate-600 hover:bg-slate-500 rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500 disabled:opacity-40 disabled:cursor-not-allowed" aria-label={`Edit ${group.name} group`} title="Edit Item Group">
                                        <IconPencil />
                                    </button>

                                    {/* Quantity Controls (+/-) */}
                                    <button onClick={() => dispatch(decrementItemGroupQuantity(group.sourceGroupId))} disabled={isListDisabled || group.quantity <= 1} className="p-1.5 text-slate-400 hover:text-sky-400 bg-slate-600 hover:bg-slate-500 rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-600" aria-label={`Decrement quantity for ${group.name}`} > <IconMinus /> </button>
                                    <span className="text-sm text-slate-300 bg-slate-600/70 px-2.5 py-1 rounded-md w-10 text-center" title="Current quantity"> {group.quantity} </span>
                                    <button onClick={() => dispatch(incrementItemGroupQuantity(group.sourceGroupId))} disabled={isListDisabled} className="p-1.5 text-slate-400 hover:text-sky-400 bg-slate-600 hover:bg-slate-500 rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-600" aria-label={`Increment quantity for ${group.name}`}> <IconPlus /> </button>

                                    {/* Remove Group Button */}
                                    <button onClick={() => openRemoveConfirmationModal(group)} disabled={isListDisabled} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-700 rounded-md opacity-70 group-hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-400" title={`Remove all ${group.quantity} of ${group.name}`} aria-label={`Remove ${group.name} group`}> <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"> <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> </svg> </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : ( /* ... no items display ... */ <p className="text-slate-400 italic text-center">No items to display.</p> )}
            </div>

            {/* Remove Confirmation Modal (existing) */}
            {itemGroupForRemoveModal && ( <Modal isOpen={isRemoveModalOpen} onClose={closeRemoveConfirmationModal} /* ... same props ... */ title="Confirm Removal" size="sm" footerContent={ <> <button type="button" onClick={closeRemoveConfirmationModal} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-lg shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 transition-colors">Cancel</button> <button type="button" onClick={handleConfirmRemove} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 transition-colors">Remove Group</button> </> } > <p className="text-slate-300">Are you sure you want to remove all items named <strong className="font-semibold text-sky-400">"{itemGroupForRemoveModal.name}"</strong> (Quantity: {itemGroupForRemoveModal.quantity})?</p> <p className="mt-2 text-xs text-slate-400">This action cannot be undone.</p> </Modal>)}

            {/* ***** NEW Edit Item Modal ***** */}
            {editingItemGroup && isEditModalOpen && (
                <Modal
                    isOpen={isEditModalOpen}
                    onClose={handleCloseEditModal}
                    title={`Edit: ${editingItemGroup.name}`}
                    size="lg" // Potentially larger for the form
                    footerContent={
                        // Buttons are now part of EditItemForm, so pass form submission trigger here if form doesn't have its own
                        // For this implementation, EditItemForm has its own buttons; footer can be for additional actions or empty.
                        // We will have EditItemForm trigger its own save/cancel through props.
                        // To keep modal generic, EditItemForm actions are internal to its children prop.
                        // But Modal can provide generic Save/Cancel buttons that the form's submit handler is tied to.
                        // Simpler for now: EditItemForm renders its own action buttons.
                        // So, make footerContent of Modal an explicit Save/Cancel which triggers form submission
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={handleCloseEditModal}
                                className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-lg shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit" // This button will trigger the form's onSubmit
                                form="edit-item-group-form" // ID of the EditItemForm <form> element
                                className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    }
                >
                    <EditItemForm
                        itemGroupToEdit={editingItemGroup}
                        onSaveChanges={handleSaveChanges} // This will be called by the form's submit handler
                        onCancel={handleCloseEditModal}   // Form might use this for an internal cancel button
                        // Pass an ID to the form element so modal footer button can trigger it
                        formId="edit-item-group-form"
                    />
                </Modal>
            )}
        </>
    );
};
CurrentItemsList.propTypes = { className: PropTypes.string };
export default CurrentItemsList;
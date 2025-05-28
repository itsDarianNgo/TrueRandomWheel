// src/features/items/EditItemForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { HexColorPicker, HexColorInput } from 'react-colorful';

// Shared UI Components (assuming InputError, IconCheck, PREDEFINED_SWATCHES are accessible, e.g. from a common file or defined here)
// For simplicity, re-defining PREDEFINED_SWATCHES here. In a larger app, share it.
const PREDEFINED_SWATCHES = [ '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E', '#10B981', '#14B8A6', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#D946EF', '#EC4899', '#78716C', '#A0A0A0', '#FFFFFF',];
const InputError = ({ message, id }) => { if (!message) return null; return <p id={id} className="mt-1 text-xs text-red-500 animate-fade-in">{message}</p>; };
InputError.propTypes = { message: PropTypes.string, id: PropTypes.string };
const IconCheck = ({ className = "w-4 h-4 text-white" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>);


const EditItemForm = ({ itemGroupToEdit, onSaveChanges, onCancel, isProcessing = false, formId }) => {
    const [itemName, setItemName] = useState('');
    const [itemColor, setItemColor] = useState(PREDEFINED_SWATCHES[14]); // Default
    const [tagsInputValue, setTagsInputValue] = useState('');
    const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);
    const [errors, setErrors] = useState({ itemName: '', itemColor: '', itemTags: '' });

    useEffect(() => {
        if (itemGroupToEdit) {
            setItemName(itemGroupToEdit.name);
            setItemColor(itemGroupToEdit.color || PREDEFINED_SWATCHES[14]);
            setTagsInputValue(Array.isArray(itemGroupToEdit.tags) ? itemGroupToEdit.tags.join(', ') : '');
            setErrors({ itemName: '', itemColor: '', itemTags: '' }); // Clear errors on new item
        }
    }, [itemGroupToEdit]);

    const validateForm = useCallback(() => {
        const newErrors = { itemName: '', itemColor: '', itemTags: '' };
        let isValid = true;
        if (!itemName.trim()) {
            newErrors.itemName = 'Item name cannot be empty.';
            isValid = false;
        }
        const trimmedColor = itemColor.trim();
        if (trimmedColor && trimmedColor !== '#' && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i.test(trimmedColor)) {
            newErrors.itemColor = 'Invalid hex color (e.g., #FF0000). Leave empty or just # for default.';
            isValid = false;
        }
        setErrors(newErrors);
        return isValid;
    }, [itemName, itemColor]);

    const handleSave = (e) => {
        e.preventDefault();
        if (isProcessing) return;
        if (!validateForm()) return;

        const rawTags = tagsInputValue.split(',');
        const cleanedTags = [...new Set(
            rawTags
                .map(tag => tag.trim().toLowerCase())
                .filter(tag => tag !== '')
        )];

        // Ensure color is undefined if input is empty or just "#" for default handling in slice
        const finalColor = (itemColor.trim() === '' || itemColor.trim() === '#') ? undefined : itemColor.trim().toUpperCase();

        onSaveChanges({
            sourceGroupId: itemGroupToEdit.sourceGroupId,
            newName: itemName.trim(),
            newColor: finalColor,
            newTags: cleanedTags,
        });
    };

    const handleColorValueChange = useCallback((newColor) => { setItemColor(newColor.toUpperCase()); if (errors.itemColor && newColor.startsWith('#') && (newColor.length === 4 || newColor.length === 7 || newColor.length === 0 || newColor === '#')) { setErrors(prev => ({...prev, itemColor: ''})); } }, [errors.itemColor]);
    const handleSwatchClick = (color) => { handleColorValueChange(color); };


    return (
        <form id={formId} onSubmit={handleSave} className="space-y-4" noValidate>
            {/* Item Name Input */}
            <div>
                <label htmlFor="editItemName" className="block text-sm font-medium text-slate-300 mb-1">Item Name <span className="text-red-500">*</span></label>
                <input type="text" id="editItemName" value={itemName}
                       onChange={(e) => { setItemName(e.target.value); if (errors.itemName) setErrors(prev => ({...prev, itemName: ''})); }}
                       className={`w-full px-3 py-2 bg-slate-700 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${errors.itemName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-600 focus:border-sky-500 focus:ring-sky-500'} ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                       readOnly={isProcessing} />
                {errors.itemName && <InputError message={errors.itemName} id="editItemName-error" />}
            </div>

            {/* Item Color Section (similar to AddItemForm) */}
            <div className={`space-y-3 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center justify-between"> <label className="block text-sm font-medium text-slate-300">Item Color</label> <div className="flex items-center space-x-2"> <span className="text-xs text-slate-400">Preview:</span> <div className="w-6 h-6 rounded border border-slate-500 shadow-sm" style={{ backgroundColor: (itemColor.trim() && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i.test(itemColor.trim())) ? itemColor : 'transparent' }} title={`Current color: ${itemColor}`}></div> </div> </div>
                <div className="grid grid-cols-8 gap-2"> {PREDEFINED_SWATCHES.map(color => ( <button type="button" key={color} onClick={() => handleSwatchClick(color)} disabled={isProcessing} className={`w-full aspect-square rounded-md border-2 transition-all duration-100 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 ${itemColor.toUpperCase() === color.toUpperCase() ? 'ring-sky-400 border-sky-400 scale-110' : 'border-slate-600 hover:border-slate-400'} ${isProcessing ? 'cursor-not-allowed !border-slate-600 !scale-100' : ''}`} style={{ backgroundColor: color }} aria-label={`Select color ${color}`} title={color}> {itemColor.toUpperCase() === color.toUpperCase() && <IconCheck className="mx-auto"/>} </button> ))} </div> {errors.itemColor && <InputError message={errors.itemColor} id="editItemColor-error" />}
                <button type="button" onClick={() => setShowCustomColorPicker(prev => !prev)} disabled={isProcessing} className={`w-full text-sm text-sky-400 hover:text-sky-300 py-2 px-3 bg-slate-700 hover:bg-slate-600/70 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 transition-colors flex items-center justify-center space-x-2 ${isProcessing ? 'cursor-not-allowed' : ''}`}> <span>{showCustomColorPicker ? 'Hide Custom Picker' : 'Show Custom Picker'}</span> <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 transition-transform duration-200 ${showCustomColorPicker ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"> <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /> </svg> </button>
                {showCustomColorPicker && ( <div className={`space-y-3 mt-3 animate-fade-in ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}> <div className="mx-auto w-full max-w-[200px] h-auto aspect-square rounded-md overflow-hidden shadow-lg border border-slate-600"> <HexColorPicker color={itemColor} onChange={handleColorValueChange} style={{ width: '100%', height: '100%' }} /> </div> <div> <HexColorInput id="editItemColorTextCustom" color={itemColor} onChange={handleColorValueChange} prefixed alpha={false} className={`w-full mt-2 px-3 py-2 bg-slate-700 border text-slate-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-sky-500 transition duration-150 ease-in-out ${errors.itemColor && !PREDEFINED_SWATCHES.includes(itemColor.toUpperCase()) ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-sky-500'}`} readOnly={isProcessing} placeholder="e.g., #A0A0A0" /> </div> </div> )}
            </div>

            {/* Tags Input Section */}
            <div>
                <label htmlFor="editItemTags" className="block text-sm font-medium text-slate-300 mb-1">Tags (comma-separated)</label>
                <input type="text" id="editItemTags" value={tagsInputValue}
                       onChange={(e) => setTagsInputValue(e.target.value)}
                       placeholder="e.g., common, bonus"
                       className={`w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:border-sky-500 focus:ring-sky-500 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                       readOnly={isProcessing} />
            </div>

            {/* Action Buttons provided by Modal's footerContent prop */}
        </form>
    );
};

EditItemForm.propTypes = {
    itemGroupToEdit: PropTypes.shape({
        sourceGroupId: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        color: PropTypes.string,
        tags: PropTypes.arrayOf(PropTypes.string),
        formId: PropTypes.string.isRequired,
    }).isRequired,
    onSaveChanges: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    isProcessing: PropTypes.bool,
};

export default EditItemForm;
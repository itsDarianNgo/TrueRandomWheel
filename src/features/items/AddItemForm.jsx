// src/features/items/AddItemForm.jsx
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types'; // Still needed for InputError
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { useDispatch, useSelector } from 'react-redux';
import { addItemEntry } from './itemSlice';
import { selectWheelStatus } from '../wheel/WheelSlice';

const InputError = ({ message, id }) => { if (!message) return null; return <p id={id} className="mt-1 text-xs text-red-500 animate-fade-in">{message}</p>; };
InputError.propTypes = { message: PropTypes.string, id: PropTypes.string };
const IconCheck = ({ className = "w-4 h-4 text-white" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>);
const PREDEFINED_SWATCHES = [ '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E', '#10B981', '#14B8A6', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#D946EF', '#EC4899', '#78716C', '#A0A0A0', '#FFFFFF',];


const AddItemForm = () => {
    const dispatch = useDispatch();
    const wheelStatus = useSelector(selectWheelStatus);
    const isFormDisabled = wheelStatus !== 'idle';

    const [itemName, setItemName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [itemColor, setItemColor] = useState(PREDEFINED_SWATCHES[14]);
    const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);
    const [tagsInputValue, setTagsInputValue] = useState(''); // New state for tags input
    const [errors, setErrors] = useState({ itemName: '', quantity: '', itemColor: '', itemTags: '' }); // Added itemTags error

    // validateForm updated to include basic tag validation if needed (e.g., length), but mainly for other fields
    const validateForm = useCallback(() => {
        const newErrors = { itemName: '', quantity: '', itemColor: '', itemTags: '' };
        let isValid = true;
        if (!itemName.trim()) {
            newErrors.itemName = 'Item name cannot be empty.';
            isValid = false;
        }
        // Quantity is generally handled by input type=number min=1
        const trimmedColor = itemColor.trim();
        if (trimmedColor && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i.test(trimmedColor)) {
            newErrors.itemColor = 'Invalid hex color format (e.g., #FF0000).';
            isValid = false;
        }
        // Basic validation for tags could be max length of string, but not critical for MVP
        // For example: if (tagsInputValue.length > 200) { newErrors.itemTags = 'Tags input too long.'; isValid = false; }
        setErrors(newErrors);
        return isValid;
    }, [itemName, quantity, itemColor, tagsInputValue]); // Added tagsInputValue

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isFormDisabled) return;
        if (!validateForm()) return;

        // Parse and clean tags
        const rawTags = tagsInputValue.split(',');
        const cleanedTags = [...new Set(
            rawTags
                .map(tag => tag.trim().toLowerCase())
                .filter(tag => tag !== '') // Or filter(Boolean)
        )];

        dispatch(addItemEntry({
            name: itemName.trim(),
            quantity: Number(quantity),
            color: itemColor.trim() === '' || itemColor.trim() === '#' ? undefined : itemColor.trim().toUpperCase(),
            tags: cleanedTags, // Include cleaned tags in the action payload
        }));

        setItemName('');
        setQuantity(1);
        setItemColor(PREDEFINED_SWATCHES[14]);
        setShowCustomColorPicker(false);
        setTagsInputValue(''); // Reset tags input
        setErrors({ itemName: '', quantity: '', itemColor: '', itemTags: '' });
    };

    const handleColorChange = useCallback((newColor) => { /* ... same ... */ const upperNewColor = newColor.toUpperCase(); setItemColor(upperNewColor); if (errors.itemColor && upperNewColor.startsWith('#') && (upperNewColor.length === 4 || upperNewColor.length === 7)) { setErrors(prev => ({...prev, itemColor: ''})); } }, [errors.itemColor]);
    const handleSwatchClick = (color) => { /* ... same ... */ handleColorChange(color); };

    return (
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 bg-slate-800 rounded-xl shadow-2xl space-y-4 w-full max-w-lg mx-auto" noValidate>
            <h3 className="text-xl sm:text-2xl font-semibold text-center text-sky-400 mb-4 sm:mb-6">Add New Item to Wheel</h3>

            {/* Item Name (same JSX) */}
            <div> <label htmlFor="itemName" className="block text-sm font-medium text-slate-300 mb-1">Item Name <span className="text-red-500">*</span></label> <input type="text" id="itemName" value={itemName} onChange={(e) => { setItemName(e.target.value); if (errors.itemName) setErrors(prev => ({...prev, itemName: ''})); }} placeholder="E.g., Grand Prize, Spin Again" className={`w-full px-4 py-2.5 bg-slate-700 border text-slate-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-sky-500 transition duration-150 ease-in-out ${errors.itemName ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-sky-500'} ${isFormDisabled ? 'opacity-50 cursor-not-allowed' : ''}`} aria-describedby={errors.itemName ? "itemName-error" : undefined} aria-invalid={!!errors.itemName} readOnly={isFormDisabled} /> {errors.itemName && <InputError message={errors.itemName} id="itemName-error" />} </div>

            {/* Quantity (same JSX) */}
            <div> <label htmlFor="quantity" className="block text-sm font-medium text-slate-300 mb-1">Quantity</label> <input type="number" id="quantity" value={quantity} onChange={(e) => { setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1)); if (errors.quantity) setErrors(prev => ({...prev, quantity: ''})); }} min="1" className={`w-full px-4 py-2.5 bg-slate-700 border text-slate-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-sky-500 transition duration-150 ease-in-out ${errors.quantity ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-sky-500'} ${isFormDisabled ? 'opacity-50 cursor-not-allowed' : ''}`} aria-describedby={errors.quantity ? "quantity-error" : undefined} aria-invalid={!!errors.quantity} readOnly={isFormDisabled} /> {errors.quantity && <InputError message={errors.quantity} id="quantity-error" />} </div>

            {/* Item Color Section (same JSX structure as Response #45, ensure disabled={isFormDisabled}) */}
            <div className={`space-y-3 ${isFormDisabled ? 'opacity-50 pointer-events-none' : ''}`}> {/* Added pointer-events-none for safety */}
                {/* ... (Color preview, swatches, custom color picker toggle from Response #45, ensuring disabled={isFormDisabled} on all interactive elements) ... */}
                <div className="flex items-center justify-between"> <label className="block text-sm font-medium text-slate-300">Item Color (Optional)</label> <div className="flex items-center space-x-2"> <span className="text-xs text-slate-400">Preview:</span> <div className="w-6 h-6 rounded border border-slate-500 shadow-sm" style={{ backgroundColor: (itemColor.trim() && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i.test(itemColor.trim())) ? itemColor : 'transparent' }} title={`Current color: ${itemColor}`}></div> </div> </div>
                <div className="grid grid-cols-8 gap-2"> {PREDEFINED_SWATCHES.map(color => ( <button type="button" key={color} onClick={() => handleSwatchClick(color)} disabled={isFormDisabled} className={`w-full aspect-square rounded-md border-2 transition-all duration-100 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 ${itemColor.toUpperCase() === color.toUpperCase() ? 'ring-sky-400 border-sky-400 scale-110' : 'border-slate-600 hover:border-slate-400'} ${isFormDisabled ? 'cursor-not-allowed !border-slate-600 !scale-100' : ''}`} style={{ backgroundColor: color }} aria-label={`Select color ${color}`} title={color}> {itemColor.toUpperCase() === color.toUpperCase() && <IconCheck className="mx-auto"/>} </button> ))} </div> {errors.itemColor && <InputError message={errors.itemColor} id="itemColor-error-form" />}
                <button type="button" onClick={() => setShowCustomColorPicker(prev => !prev)} disabled={isFormDisabled} className={`w-full text-sm text-sky-400 hover:text-sky-300 py-2 px-3 bg-slate-700 hover:bg-slate-600/70 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 transition-colors flex items-center justify-center space-x-2 ${isFormDisabled ? 'cursor-not-allowed' : ''}`}> <span>{showCustomColorPicker ? 'Hide Custom Color Picker' : 'Show Custom Color Picker'}</span> <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 transition-transform duration-200 ${showCustomColorPicker ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"> <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /> </svg> </button>
                {showCustomColorPicker && ( <div className={`space-y-3 mt-3 animate-fade-in ${isFormDisabled ? 'opacity-50 pointer-events-none' : ''}`}> <div className="mx-auto w-full max-w-[200px] h-auto aspect-square rounded-md overflow-hidden shadow-lg border border-slate-600"> <HexColorPicker color={itemColor} onChange={handleColorChange} style={{ width: '100%', height: '100%' }} /> </div> <div> <HexColorInput id="itemColorTextCustomForm" color={itemColor} onChange={handleColorChange} prefixed alpha={false} className={`w-full mt-2 px-4 py-2.5 bg-slate-700 border text-slate-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-sky-500 transition duration-150 ease-in-out ${errors.itemColor && !PREDEFINED_SWATCHES.includes(itemColor.toUpperCase()) ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-sky-500'}`} readOnly={isFormDisabled} placeholder="e.g., #A0A0A0" /> </div> </div> )}
            </div>

            {/* NEW Tags Input Section */}
            <div>
                <label htmlFor="itemTags" className="block text-sm font-medium text-slate-300 mb-1">
                    Tags (Optional, comma-separated)
                </label>
                <input
                    type="text"
                    id="itemTags"
                    value={tagsInputValue}
                    onChange={(e) => setTagsInputValue(e.target.value)}
                    placeholder="e.g., common, bonus prize, hard to get"
                    className={`w-full px-4 py-2.5 bg-slate-700 border text-slate-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-sky-500 transition duration-150 ease-in-out border-slate-600 focus:ring-sky-500 ${isFormDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    readOnly={isFormDisabled}
                    aria-describedby={errors.itemTags ? "itemTags-error" : undefined}
                />
                {/* <p className="mt-1 text-xs text-slate-400">Tags help categorize items for future features.</p> */}
                {errors.itemTags && <InputError message={errors.itemTags} id="itemTags-error" />}
            </div>

            {/* Submit Button (same JSX) */}
            <button type="submit" disabled={isFormDisabled} className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/70 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-sky-500 disabled:hover:to-cyan-500 disabled:transform-none"> {isFormDisabled ? 'Wheel is Busy...' : 'Add Item to Wheel'} </button>
        </form>
    );
};
export default AddItemForm;
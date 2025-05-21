// src/features/itemManagement/AddItemForm.jsx
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { HexColorPicker, HexColorInput } from 'react-colorful'; // Import components from react-colorful

// InputError Component (Unchanged from Response #33)
const InputError = ({ message }) => {
    if (!message) return null;
    return <p className="mt-1 text-xs text-red-500 animate-fade-in">{message}</p>;
};
InputError.propTypes = { message: PropTypes.string };


const AddItemForm = ({ onAddItem, isSpinning }) => {
    const [itemName, setItemName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [itemColor, setItemColor] = useState('#A0A0A0'); // Default color

    const [errors, setErrors] = useState({
        itemName: '',
        quantity: '',
        itemColor: '',
    });

    // Memoize validateForm to prevent re-creation if not needed
    const validateForm = useCallback(() => {
        const newErrors = { itemName: '', quantity: '', itemColor: '' };
        let isValid = true;

        if (!itemName.trim()) {
            newErrors.itemName = 'Item name cannot be empty.';
            isValid = false;
        }

        if (quantity < 1) {
            newErrors.quantity = 'Quantity must be at least 1.';
            isValid = false;
        }

        // react-colorful's HexColorInput handles its own validation largely,
        // but we can add a check if color is required or for specific formats if needed.
        // For now, an empty color is allowed (will use default in wheel).
        // If a color is entered, HexColorInput tries to keep it valid.
        // We mainly care if it's a *syntactically* invalid string if user bypasses picker.
        // However, HexColorInput itself will likely manage this.
        // This validation is more for if user types something completely non-hex.
        if (itemColor.trim() && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(itemColor.trim())) {
            newErrors.itemColor = 'Invalid hex color format (e.g., #FF0000).';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    }, [itemName, quantity, itemColor]); // Dependencies of validateForm

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSpinning) return;
        if (!validateForm()) {
            return;
        }

        onAddItem({
            name: itemName.trim(),
            quantity: Number(quantity),
            color: itemColor.trim() === '' || itemColor.trim() === '#' ? undefined : itemColor.trim(), // Ensure '#' alone is also default
        });

        setItemName('');
        setQuantity(1);
        // setItemColor('#A0A0A0'); // Optionally reset color, current keeps last used
        setErrors({ itemName: '', quantity: '', itemColor: '' });
    };

    // Handler for react-colorful picker and HexColorInput
    // Ensures state is updated and errors cleared.
    const handleColorChange = useCallback((newColor) => {
        setItemColor(newColor);
        if (errors.itemColor) {
            // Basic check: if newColor is a valid start of hex, clear error
            if (newColor.startsWith('#') && (newColor.length <= 7)) {
                setErrors(prev => ({...prev, itemColor: ''}));
            }
            // More robust validation could be re-run here if desired on every change
        }
    }, [errors.itemColor]);


    return (
        <form onSubmit={handleSubmit} className="p-6 bg-slate-800 rounded-xl shadow-2xl space-y-4 w-full max-w-lg mx-auto" noValidate>
            <h3 className="text-2xl font-semibold text-center text-sky-400 mb-6">Add New Item to Wheel</h3>

            {/* Item Name */}
            <div>
                <label htmlFor="itemName" className="block text-sm font-medium text-slate-300 mb-1">Item Name <span className="text-red-500">*</span></label>
                <input
                    type="text" id="itemName" value={itemName}
                    onChange={(e) => { setItemName(e.target.value); if (errors.itemName) setErrors(prev => ({...prev, itemName: ''})); }}
                    placeholder="E.g., Grand Prize, Spin Again"
                    className={`w-full px-4 py-2.5 bg-slate-700 border text-slate-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-sky-500 transition duration-150 ease-in-out ${errors.itemName ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-sky-500'}`}
                    aria-describedby={errors.itemName ? "itemName-error" : undefined}
                    aria-invalid={!!errors.itemName}
                    readOnly={isSpinning}
                />
                {errors.itemName && <InputError message={errors.itemName} id="itemName-error" />}
            </div>

            {/* Quantity */}
            <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-slate-300 mb-1">Quantity</label>
                <input
                    type="number" id="quantity" value={quantity}
                    onChange={(e) => { setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1)); if (errors.quantity) setErrors(prev => ({...prev, quantity: ''})); }}
                    min="1"
                    className={`w-full px-4 py-2.5 bg-slate-700 border text-slate-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-sky-500 transition duration-150 ease-in-out ${errors.quantity ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-sky-500'}`}
                    aria-describedby={errors.quantity ? "quantity-error" : undefined}
                    aria-invalid={!!errors.quantity}
                    readOnly={isSpinning}
                />
                {errors.quantity && <InputError message={errors.quantity} id="quantity-error" />}
            </div>

            {/* Item Color - Using react-colorful */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">Item Color (Optional)</label>

                {/* react-colorful Picker */}
                {/* Custom styling for react-colorful can be done via CSS by targeting its classes,
            or by wrapping it and applying styles. For dark theme, it often looks decent by default,
            but its container might need styling. react-colorful is typically a fixed-size square. */}
                <div className={`mx-auto w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] rounded-md overflow-hidden shadow-lg border border-slate-600 ${isSpinning ? 'opacity-50 pointer-events-none' : ''}`}>
                    {/* Conditionally render picker or a placeholder if spinning to avoid interaction issues */}
                    {!isSpinning ? (
                        <HexColorPicker color={itemColor} onChange={handleColorChange} style={{ width: '100%', height: '100%' }} />
                    ) : (
                        <div className="w-full h-full bg-slate-700 flex items-center justify-center text-slate-500 text-sm">Picker disabled during spin</div>
                    )}
                </div>

                {/* Hex Color Input - using HexColorInput from react-colorful for better sync & validation */}
                <div>
                    <HexColorInput
                        id="itemColorText"
                        color={itemColor}
                        onChange={handleColorChange}
                        prefixed // Ensures '#' is present
                        alpha={false} // We don't support alpha channel
                        className={`w-full px-4 py-2.5 bg-slate-700 border text-slate-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-sky-500 transition duration-150 ease-in-out ${errors.itemColor ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-sky-500'} ${isSpinning ? 'opacity-50 cursor-not-allowed' : ''}`}
                        readOnly={isSpinning}
                        aria-describedby={errors.itemColor ? "itemColor-error" : undefined}
                        aria-invalid={!!errors.itemColor}
                        placeholder="e.g., #A0A0A0"
                    />
                    {errors.itemColor && <InputError message={errors.itemColor} id="itemColor-error" />}
                </div>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isSpinning}
                className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-sky-400/70 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-sky-500 disabled:hover:to-cyan-500 disabled:transform-none"
            >
                {isSpinning ? 'Wheel is Spinning...' : 'Add Item to Wheel'}
            </button>
        </form>
    );
};

AddItemForm.propTypes = {
    onAddItem: PropTypes.func.isRequired,
    isSpinning: PropTypes.bool.isRequired,
};

export default AddItemForm;
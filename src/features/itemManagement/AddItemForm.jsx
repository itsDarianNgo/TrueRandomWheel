// src/features/itemManagement/AddItemForm.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';

// Simple Error Message Component (can be styled further or made more generic later)
const InputError = ({ message }) => {
    if (!message) return null;
    return <p className="mt-1 text-xs text-red-500 animate-fade-in">{message}</p>;
};

InputError.propTypes = {
    message: PropTypes.string,
};


const AddItemForm = ({ onAddItem }) => {
    const [itemName, setItemName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [itemColor, setItemColor] = useState('#A0A0A0'); // Default light gray

    // State for validation errors
    const [errors, setErrors] = useState({
        itemName: '',
        quantity: '',
        itemColor: '', // For potential future color validation
    });

    const validateForm = () => {
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

        // Basic hex color validation (can be more sophisticated)
        // This pattern allows #RGB, #RRGGBB. Empty is allowed (will use default).
        if (itemColor.trim() && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(itemColor.trim())) {
            newErrors.itemColor = 'Invalid hex color format (e.g., #FF0000 or #F00).';
            isValid = false;
        }


        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return; // Stop submission if validation fails
        }

        onAddItem({
            name: itemName.trim(),
            quantity: Number(quantity),
            // Pass empty string as undefined for color if user clears it, to trigger default color
            color: itemColor.trim() === '' ? undefined : itemColor.trim(),
        });

        // Reset form fields
        setItemName('');
        setQuantity(1);
        // setItemColor('#A0A0A0'); // Keep last color or reset, current keeps
        setErrors({ itemName: '', quantity: '', itemColor: '' }); // Clear errors on successful submit
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="p-6 bg-slate-800 rounded-xl shadow-2xl space-y-4 w-full max-w-lg mx-auto" // Reduced space-y slightly
            noValidate // Disable browser's default validation UI to use our own
        >
            <h3 className="text-2xl font-semibold text-center text-sky-400 mb-6">Add New Item to Wheel</h3>

            {/* Item Name */}
            <div>
                <label htmlFor="itemName" className="block text-sm font-medium text-slate-300 mb-1">
                    Item Name <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    id="itemName"
                    value={itemName}
                    onChange={(e) => {
                        setItemName(e.target.value);
                        if (errors.itemName) setErrors(prev => ({...prev, itemName: ''})); // Clear error on change
                    }}
                    placeholder="E.g., Grand Prize, Spin Again"
                    className={`w-full px-4 py-2.5 bg-slate-700 border text-slate-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-sky-500 transition duration-150 ease-in-out ${errors.itemName ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-sky-500'}`}
                    aria-describedby={errors.itemName ? "itemName-error" : undefined}
                    aria-invalid={!!errors.itemName}
                />
                {errors.itemName && <InputError message={errors.itemName} id="itemName-error" />}
            </div>

            {/* Quantity */}
            <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-slate-300 mb-1">
                    Quantity
                </label>
                <input
                    type="number"
                    id="quantity"
                    value={quantity}
                    onChange={(e) => {
                        setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1));
                        if (errors.quantity) setErrors(prev => ({...prev, quantity: ''})); // Clear error on change
                    }}
                    min="1"
                    className={`w-full px-4 py-2.5 bg-slate-700 border text-slate-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-sky-500 transition duration-150 ease-in-out ${errors.quantity ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-sky-500'}`}
                    aria-describedby={errors.quantity ? "quantity-error" : undefined}
                    aria-invalid={!!errors.quantity}
                />
                {errors.quantity && <InputError message={errors.quantity} id="quantity-error" />}
            </div>

            {/* Item Color */}
            <div className="space-y-1"> {/* Group label and inputs slightly closer */}
                <label className="block text-sm font-medium text-slate-300 mb-1">
                    Item Color (Optional)
                </label>
                <div className="flex items-start space-x-3"> {/* Use items-start for alignment with error messages */}
                    <div className="flex-grow">
                        <input
                            type="text"
                            id="itemColorText"
                            value={itemColor}
                            onChange={(e) => {
                                setItemColor(e.target.value);
                                if (errors.itemColor) setErrors(prev => ({...prev, itemColor: ''})); // Clear error
                            }}
                            placeholder="#RRGGBB or leave blank for default"
                            // Removed pattern from input to handle validation in JS for better error message control
                            className={`w-full px-4 py-2.5 bg-slate-700 border text-slate-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-sky-500 transition duration-150 ease-in-out ${errors.itemColor ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-sky-500'}`}
                            aria-describedby={errors.itemColor ? "itemColor-error" : undefined}
                            aria-invalid={!!errors.itemColor}
                        />
                    </div>
                    <div className="flex-shrink-0 pt-[0.125rem]"> {/* Slight top padding to align picker better with text input */}
                        <input
                            type="color"
                            id="itemColorPicker"
                            value={itemColor.trim() && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(itemColor.trim()) ? itemColor.trim() : '#000000'} // Ensure picker gets valid hex or a default
                            onChange={(e) => {
                                setItemColor(e.target.value);
                                if (errors.itemColor) setErrors(prev => ({...prev, itemColor: ''})); // Clear error
                            }}
                            className="w-12 h-[42px] p-0 border-none rounded-md cursor-pointer bg-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                            title="Select item color"
                        />
                    </div>
                </div>
                {errors.itemColor && <InputError message={errors.itemColor} id="itemColor-error" />}
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-sky-400/70 disabled:opacity-60 disabled:cursor-not-allowed"
            >
                Add Item to Wheel
            </button>
        </form>
    );
};

AddItemForm.propTypes = {
    onAddItem: PropTypes.func.isRequired,
};

export default AddItemForm;
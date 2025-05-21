// src/features/itemManagement/AddItemForm.jsx
import React, { useState } from 'react'; // useEffect not needed if not doing onBlur validation here
import PropTypes from 'prop-types';

const InputError = ({ message }) => { /* ... (Unchanged from Response #33) ... */
    if (!message) return null;
    return <p className="mt-1 text-xs text-red-500 animate-fade-in">{message}</p>;
};
InputError.propTypes = { message: PropTypes.string };


const AddItemForm = ({ onAddItem, isSpinning }) => { // Added isSpinning prop
    const [itemName, setItemName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [itemColor, setItemColor] = useState('#A0A0A0');
    const [errors, setErrors] = useState({ itemName: '', quantity: '', itemColor: '' });

    const validateForm = () => { /* ... (Unchanged from Response #33) ... */
        const newErrors = { itemName: '', quantity: '', itemColor: '' };
        let isValid = true;
        if (!itemName.trim()) { newErrors.itemName = 'Item name cannot be empty.'; isValid = false; }
        if (quantity < 1) { newErrors.quantity = 'Quantity must be at least 1.'; isValid = false; }
        if (itemColor.trim() && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(itemColor.trim())) {
            newErrors.itemColor = 'Invalid hex color format (e.g., #FF0000 or #F00).';
            isValid = false;
        }
        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSpinning) return; // Extra guard, though button should be disabled
        if (!validateForm()) return;

        onAddItem({
            name: itemName.trim(),
            quantity: Number(quantity),
            color: itemColor.trim() === '' ? undefined : itemColor.trim(),
        });

        setItemName('');
        setQuantity(1);
        setErrors({ itemName: '', quantity: '', itemColor: '' });
    };

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
                    readOnly={isSpinning} // ***** MODIFICATION: Make input readOnly if spinning *****
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
                    readOnly={isSpinning} // ***** MODIFICATION: Make input readOnly if spinning *****
                />
                {errors.quantity && <InputError message={errors.quantity} id="quantity-error" />}
            </div>

            {/* Item Color */}
            <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-300 mb-1">Item Color (Optional)</label>
                <div className="flex items-start space-x-3">
                    <div className="flex-grow">
                        <input
                            type="text" id="itemColorText" value={itemColor}
                            onChange={(e) => { setItemColor(e.target.value); if (errors.itemColor) setErrors(prev => ({...prev, itemColor: ''})); }}
                            placeholder="#RRGGBB or leave blank for default"
                            className={`w-full px-4 py-2.5 bg-slate-700 border text-slate-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-sky-500 transition duration-150 ease-in-out ${errors.itemColor ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-sky-500'}`}
                            aria-describedby={errors.itemColor ? "itemColor-error" : undefined}
                            aria-invalid={!!errors.itemColor}
                            readOnly={isSpinning} // ***** MODIFICATION: Make input readOnly if spinning *****
                        />
                    </div>
                    <div className="flex-shrink-0 pt-[0.125rem]">
                        <input
                            type="color" id="itemColorPicker"
                            value={itemColor.trim() && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(itemColor.trim()) ? itemColor.trim() : '#000000'}
                            onChange={(e) => { setItemColor(e.target.value); if (errors.itemColor) setErrors(prev => ({...prev, itemColor: ''})); }}
                            className="w-12 h-[42px] p-0 border-none rounded-md cursor-pointer bg-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                            title="Select item color"
                            disabled={isSpinning} // ***** MODIFICATION: Disable color picker if spinning *****
                        />
                    </div>
                </div>
                {errors.itemColor && <InputError message={errors.itemColor} id="itemColor-error" />}
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isSpinning} // ***** MODIFICATION: Disable button if spinning *****
                className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-sky-400/70 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-sky-500 disabled:hover:to-cyan-500 disabled:transform-none"
            >
                {isSpinning ? 'Wheel is Spinning...' : 'Add Item to Wheel'}
            </button>
        </form>
    );
};

AddItemForm.propTypes = {
    onAddItem: PropTypes.func.isRequired,
    isSpinning: PropTypes.bool.isRequired, // Added propType
};

export default AddItemForm;
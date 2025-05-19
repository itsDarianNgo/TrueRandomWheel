// src/features/itemManagement/AddItemForm.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';

const AddItemForm = ({ onAddItem }) => {
    const [itemName, setItemName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [itemColor, setItemColor] = useState('#A0A0A0'); // Default light gray, user can change

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!itemName.trim()) {
            alert('Item name cannot be empty.'); // Simple validation for now
            return;
        }
        if (quantity < 1) {
            alert('Quantity must be at least 1.');
            return;
        }

        // The onAddItem function in WheelDisplay will handle generating unique IDs and sourceGroup
        onAddItem({
            name: itemName.trim(),
            quantity: Number(quantity),
            color: itemColor, // Pass the selected color
        });

        // Reset form fields
        setItemName('');
        setQuantity(1);
        // setItemColor('#A0A0A0'); // Optionally reset color or keep last used
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="p-6 bg-slate-800 rounded-xl shadow-2xl space-y-6 w-full max-w-lg mx-auto"
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
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="E.g., Grand Prize, Spin Again"
                    className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 ease-in-out"
                    required
                />
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
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    min="1"
                    className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 ease-in-out"
                />
            </div>

            {/* Item Color */}
            <div className="flex items-center space-x-4">
                <div className="flex-grow">
                    <label htmlFor="itemColorText" className="block text-sm font-medium text-slate-300 mb-1">
                        Item Color (Hex e.g. #FF0000)
                    </label>
                    <input
                        type="text"
                        id="itemColorText"
                        value={itemColor}
                        onChange={(e) => setItemColor(e.target.value)}
                        placeholder="#RRGGBB"
                        pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$" // Basic hex pattern
                        className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-slate-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 ease-in-out"
                    />
                </div>
                <div className="flex-shrink-0">
                    <label htmlFor="itemColorPicker" className="block text-sm font-medium text-slate-300 mb-1 text-center">
                        Picker
                    </label>
                    <input
                        type="color"
                        id="itemColorPicker"
                        value={itemColor} // Ensure this is a valid hex for the color picker
                        onChange={(e) => setItemColor(e.target.value)}
                        className="w-16 h-12 p-0 border-none rounded-lg cursor-pointer bg-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                        title="Select item color"
                    />
                </div>
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
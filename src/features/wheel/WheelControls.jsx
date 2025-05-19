// src/features/wheel/WheelControls.jsx
// ... (imports and icon components as before)
import React from 'react'; // Ensure React is imported if not already
import PropTypes from 'prop-types';

const PointerTopIcon = () => <span role="img" aria-label="Pointer Top">⬆️</span>;
const PointerRightIcon = () => <span role="img" aria-label="Pointer Right">➡️</span>;
const PointerBottomIcon = () => <span role="img" aria-label="Pointer Bottom">⬇️</span>;
const PointerLeftIcon = () => <span role="img" aria-label="Pointer Left">⬅️</span>;


const WheelControls = ({
                           onSpinClick,
                           isSpinning, // Still useful for "Spinning..." text
                           canSpin,    // New prop: true if items > 0 AND not isSpinning
                           currentPointerPosition,
                           onPointerPositionChange,
                           availablePointerPositions = ['top', 'right', 'bottom', 'left'],
                       }) => {

    const pointerIcons = { /* ... as before ... */
        top: { icon: <PointerTopIcon />, label: "Top" },
        right: { icon: <PointerRightIcon />, label: "Right" },
        bottom: { icon: <PointerBottomIcon />, label: "Bottom" },
        left: { icon: <PointerLeftIcon />, label: "Left" },
    };

    return (
        <div className="flex flex-col items-center space-y-8 p-6 bg-slate-800 rounded-xl shadow-2xl w-full max-w-md">
            <button
                type="button"
                onClick={onSpinClick}
                disabled={!canSpin} // Use the new canSpin prop for disabled state
                className="w-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 text-white font-extrabold py-5 px-10 rounded-xl text-3xl shadow-lg transition-all duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-pink-400/70 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                aria-label="Spin the wheel"
            >
                {isSpinning ? 'Spinning...' : 'SPIN!'}
            </button>

            {/* Pointer Position Selector (remains the same) */}
            <div className="w-full">
                <label
                    // ... (as before)
                    htmlFor="pointer-position-group"
                    className="block text-sm font-medium text-slate-300 mb-2 text-center"
                >
                    Pointer Position
                </label>
                <div
                    // ... (as before)
                    id="pointer-position-group"
                    role="group"
                    aria-labelledby="pointer-position-group"
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                >
                    {availablePointerPositions.map((position) => {
                        const isActive = currentPointerPosition === position;
                        const iconInfo = pointerIcons[position] || { icon: position.charAt(0).toUpperCase(), label: position.charAt(0).toUpperCase() + position.slice(1) };
                        return (
                            <button
                                key={position}
                                type="button"
                                onClick={() => onPointerPositionChange(position)}
                                className={`
                  flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-150 ease-in-out
                  focus:outline-none focus:ring-3 focus:ring-offset-2 focus:ring-offset-slate-800
                  ${isActive
                                    ? 'bg-sky-600 border-sky-500 text-white shadow-md scale-105'
                                    : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:border-slate-500 hover:shadow-sm'
                                }
                  focus:ring-sky-500
                `}
                                aria-pressed={isActive}
                                aria-label={`Set pointer to ${iconInfo.label}`}
                            >
                                <span className="text-xl">{iconInfo.icon}</span>
                                <span className="mt-1 text-xs font-semibold">{iconInfo.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

WheelControls.propTypes = {
    onSpinClick: PropTypes.func.isRequired,
    isSpinning: PropTypes.bool.isRequired,
    canSpin: PropTypes.bool.isRequired, // Added new propType
    currentPointerPosition: PropTypes.string.isRequired,
    onPointerPositionChange: PropTypes.func.isRequired,
    availablePointerPositions: PropTypes.arrayOf(PropTypes.string),
};

export default WheelControls;
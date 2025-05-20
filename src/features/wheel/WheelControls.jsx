// src/features/wheel/WheelControls.jsx
import React from 'react';
import PropTypes from 'prop-types';

// --- SVG Icon Components ---
const IconArrowUp = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" />
    </svg>
);
const IconArrowRight = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
);
const IconArrowDown = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
);
const IconArrowLeft = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h15" />
    </svg>
);

const pointerIconsMap = {
    top: { IconComponent: IconArrowUp, label: "Top" },
    right: { IconComponent: IconArrowRight, label: "Right" },
    bottom: { IconComponent: IconArrowDown, label: "Bottom" },
    left: { IconComponent: IconArrowLeft, label: "Left" },
};
// --- End SVG Icon Components ---


const WheelControls = ({
                           onSpinClick,
                           isSpinning,
                           canSpin,
                           currentPointerPosition,
                           onPointerPositionChange,
                           availablePointerPositions = ['top', 'right', 'bottom', 'left'],
                       }) => {

    return (
        <div className="flex flex-col items-center space-y-6 p-6 bg-slate-800 rounded-xl shadow-2xl w-full max-w-md"> {/* Reduced space-y from 8 to 6 */}
            {/* Spin Button (Styling Unchanged from #24 - already quite polished) */}
            <button
                type="button"
                onClick={onSpinClick}
                disabled={!canSpin}
                className="w-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 text-white font-extrabold py-5 px-10 rounded-xl text-3xl shadow-lg transition-all duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-pink-400/70 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                aria-label="Spin the wheel"
            >
                {isSpinning ? 'Spinning...' : 'SPIN!'}
            </button>

            {/* Pointer Position Selector - Segmented Control Styling */}
            <div className="w-full">
                <label
                    htmlFor="pointer-position-group" // This ID is for the group, not an input
                    className="block text-sm font-medium text-slate-300 mb-2 text-center"
                    id="pointer-position-group-label" // Added ID for aria-labelledby
                >
                    Pointer Position
                </label>
                <div
                    role="group"
                    aria-labelledby="pointer-position-group-label" // Use the label's ID
                    className="flex w-full rounded-lg shadow-sm border border-slate-600 overflow-hidden" // Container for segmented control
                >
                    {availablePointerPositions.map((position, index) => {
                        const isActive = currentPointerPosition === position;
                        const { IconComponent, label } = pointerIconsMap[position] || { IconComponent: () => '?', label: position };

                        // Conditional classes for border radius to make segments connect
                        let segmentClasses = "";
                        if (index === 0) segmentClasses += "rounded-l-md ";
                        if (index === availablePointerPositions.length - 1) segmentClasses += "rounded-r-md ";
                        // Add right border to all but the last segment
                        if (index < availablePointerPositions.length - 1) segmentClasses += "border-r border-slate-500 ";


                        return (
                            <button
                                key={position}
                                type="button"
                                onClick={() => onPointerPositionChange(position)}
                                className={`
                  flex-1 flex flex-col items-center justify-center p-3 transition-colors duration-150 ease-in-out
                  focus:outline-none focus:z-10 focus:ring-2 focus:ring-offset-0 focus:ring-sky-400 
                  ${segmentClasses}
                  ${isActive
                                    ? 'bg-sky-600 text-white shadow-inner' // Active state styling
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600' // Inactive state
                                }
                `}
                                aria-pressed={isActive}
                                aria-label={`Set pointer to ${label}`}
                            >
                                <IconComponent className={`w-5 h-5 mb-1 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                                <span className="text-xs font-semibold">{label}</span>
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
    canSpin: PropTypes.bool.isRequired,
    currentPointerPosition: PropTypes.string.isRequired,
    onPointerPositionChange: PropTypes.func.isRequired,
    availablePointerPositions: PropTypes.arrayOf(PropTypes.string),
};

export default WheelControls;
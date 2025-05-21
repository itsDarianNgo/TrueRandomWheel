// src/features/wheel/WheelControls.jsx
import React from 'react';
import PropTypes from 'prop-types';

// --- SVG Icon Components (Unchanged from Response #36/47) ---
const IconArrowUp = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"> <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" /> </svg> );
const IconArrowRight = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"> <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /> </svg> );
const IconArrowDown = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"> <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M19 12l-7 7-7-7" /> </svg> );
const IconArrowLeft = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"> <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h15" /> </svg> );

const pointerIconsMap = {
    top: { IconComponent: IconArrowUp, label: "Top" },
    right: { IconComponent: IconArrowRight, label: "Right" },
    bottom: { IconComponent: IconArrowDown, label: "Bottom" },
    left: { IconComponent: IconArrowLeft, label: "Left" },
};
// --- End SVG Icon Components ---


const WheelControls = ({
                           onSpinClick,
                           isSpinning, // Used for Spin button text AND disabling pointer cycle button
                           canSpin,
                           currentPointerPosition,
                           onCyclePointerPosition,
                       }) => {

    const currentPointerInfo = pointerIconsMap[currentPointerPosition] || pointerIconsMap.top;

    return (
        <div className="flex flex-col items-center space-y-4 p-6 bg-slate-800 rounded-xl shadow-2xl w-full max-w-md">
            {/* Spin Button (Unchanged) */}
            <button
                type="button"
                onClick={onSpinClick}
                disabled={!canSpin} // This already considers isSpinning
                className="w-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 text-white font-extrabold py-5 px-10 rounded-xl text-3xl shadow-lg transition-all duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-pink-400/70 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                aria-label="Spin the wheel"
            >
                {isSpinning ? 'Spinning...' : 'SPIN!'}
            </button>

            {/* Cycle Pointer Position Button - Now with disabled state */}
            <div className="w-full">
                <p className="text-xs text-slate-400 mb-1 text-center uppercase tracking-wider">Pointer</p>
                <button
                    type="button"
                    onClick={onCyclePointerPosition}
                    disabled={isSpinning} // ***** MODIFICATION: Disable if wheel is spinning *****
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-700"
                    aria-label={`Cycle pointer position, current: ${currentPointerInfo.label}`}
                >
                    <currentPointerInfo.IconComponent className="w-5 h-5 text-sky-400" />
                    <span className="font-medium">{currentPointerInfo.label}</span>
                </button>
            </div>
        </div>
    );
};

WheelControls.propTypes = {
    onSpinClick: PropTypes.func.isRequired,
    isSpinning: PropTypes.bool.isRequired,
    canSpin: PropTypes.bool.isRequired,
    currentPointerPosition: PropTypes.string.isRequired,
    onCyclePointerPosition: PropTypes.func.isRequired,
};

export default WheelControls;
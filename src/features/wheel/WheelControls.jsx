// src/features/wheel/WheelControls.jsx
import React from 'react';
import PropTypes from 'prop-types';

// Tailwind v4 requires explicit import for icons if not using a library, or SVG directly.
// For simplicity, using text/emoji for now. Real icons would be SVG components or a library.
// Example icons (can be replaced with SVGs or an icon library later)
const PointerTopIcon = () => <span role="img" aria-label="Pointer Top">⬆️</span>;
const PointerRightIcon = () => <span role="img" aria-label="Pointer Right">➡️</span>;
const PointerBottomIcon = () => <span role="img" aria-label="Pointer Bottom">⬇️</span>;
const PointerLeftIcon = () => <span role="img" aria-label="Pointer Left">⬅️</span>;


const WheelControls = ({
                           onSpinClick,
                           isSpinning,
                           currentPointerPosition,
                           onPointerPositionChange,
                           availablePointerPositions = ['top', 'right', 'bottom', 'left'],
                       }) => {

    const pointerIcons = {
        top: { icon: <PointerTopIcon />, label: "Top" },
        right: { icon: <PointerRightIcon />, label: "Right" },
        bottom: { icon: <PointerBottomIcon />, label: "Bottom" },
        left: { icon: <PointerLeftIcon />, label: "Left" },
    };

    return (
        <div className="flex flex-col items-center space-y-8 p-6 bg-slate-800 rounded-xl shadow-2xl w-full max-w-md">
            {/* Spin Button */}
            <button
                type="button"
                onClick={onSpinClick}
                disabled={isSpinning}
                className="w-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 text-white font-extrabold py-5 px-10 rounded-xl text-3xl shadow-lg transition-all duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-pink-400/70 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                aria-label="Spin the wheel"
            >
                {isSpinning ? 'Spinning...' : 'SPIN!'}
            </button>

            {/* Pointer Position Selector */}
            <div className="w-full">
                <label
                    htmlFor="pointer-position-group"
                    className="block text-sm font-medium text-slate-300 mb-2 text-center"
                >
                    Pointer Position
                </label>
                <div
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

            {/* Placeholder for future controls */}
            {/*
      <div className="w-full border-t border-slate-700 pt-6 mt-6">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">More Settings (Coming Soon)</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-300">Manual Shuffle Count:</span>
            <input type="number" defaultValue="1" className="bg-slate-700 text-white rounded p-1 w-16 text-center outline-hidden focus:ring-2 focus:ring-sky-500 border border-slate-600"/>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-300">Auto-Shuffle After Hit:</span>
            <button className="bg-slate-600 hover:bg-slate-500 text-xs py-1 px-2 rounded">Toggle</button>
          </div>
        </div>
      </div>
      */}
        </div>
    );
};

WheelControls.propTypes = {
    onSpinClick: PropTypes.func.isRequired,
    isSpinning: PropTypes.bool.isRequired,
    currentPointerPosition: PropTypes.string.isRequired,
    onPointerPositionChange: PropTypes.func.isRequired,
    availablePointerPositions: PropTypes.arrayOf(PropTypes.string),
};

export default WheelControls;
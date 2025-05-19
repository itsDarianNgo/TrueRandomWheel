// src/features/wheel/WheelDisplay.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react'; // Added useEffect
import WheelCanvas from './WheelCanvas';
import WheelControls from './WheelControls';

const initialWheelItems = [
    { id: 'item1', name: 'Grand Prize! 🏆', color: '#FFD700' },
    { id: 'item2', name: 'Spin Again! 🔄', color: '#8A2BE2' },
    { id: 'item3', name: 'Small Bonus 🍬', color: '#32CD32' },
    { id: 'item4', name: 'Mystery Gift 🎁', color: '#FF69B4' },
    { id: 'item5', name: 'Better Luck Next Time 😔', color: '#FF4500' },
    { id: 'item6', name: '2x Points! ✨', color: '#1E90FF' },
];

const WheelDisplay = () => {
    const [items, setItems] = useState(initialWheelItems);
    const [pointerPosition, setPointerPosition] = useState('top'); // Default to top as in screenshot
    const [isDisplaySpinning, setIsDisplaySpinning] = useState(false); // Renamed for clarity vs WheelCanvas internal
    const [winningItem, setWinningItem] = useState(null);
    const [showWinningBanner, setShowWinningBanner] = useState(false);

    const wheelCanvasRef = useRef(null);
    const bannerTimeoutRef = useRef(null); // To clear timeout for banner

    // Clear banner timeout on unmount or if banner is manually closed
    useEffect(() => {
        return () => {
            if (bannerTimeoutRef.current) {
                clearTimeout(bannerTimeoutRef.current);
            }
        };
    }, []);

    const handleSpinClick = useCallback(() => {
        console.log("WheelDisplay: Spin button clicked.");
        if (items.length === 0) {
            console.warn("WheelDisplay: No items to spin.");
            // Optionally show a user message here
            return;
        }
        if (isDisplaySpinning) {
            console.warn("WheelDisplay: Already spinning, ignoring click.");
            return;
        }

        if (wheelCanvasRef.current && typeof wheelCanvasRef.current.spin === 'function') {
            console.log("WheelDisplay: Calling WheelCanvas.spin()");
            wheelCanvasRef.current.spin();
            // Note: setIsDisplaySpinning(true) will be called by handleSpinStart callback
        } else {
            console.error("WheelDisplay Critical Error: WheelCanvas ref not available or spin method not exposed.");
        }
    }, [items, isDisplaySpinning]); // Dependencies for handleSpinClick

    const handlePointerPositionChange = useCallback((newPosition) => {
        setPointerPosition(newPosition);
    }, []);

    const handleSpinStart = useCallback((spunItem) => {
        console.log("WheelDisplay: onSpinStart callback received for:", spunItem.name);
        setIsDisplaySpinning(true);
        setWinningItem(null); // Clear previous winner from display
        if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current); // Clear any existing banner timeout
        setShowWinningBanner(false);
    }, []);

    const handleSpinEnd = useCallback((spunItem, errorInfo) => {
        console.log("WheelDisplay: onSpinEnd callback received. Winner:", spunItem ? spunItem.name : "None");
        setIsDisplaySpinning(false);

        if (errorInfo) {
            console.error("WheelDisplay: Spin ended with error from WheelCanvas:", errorInfo.error);
            // Optionally display an error message to the user
            setWinningItem(null);
            return;
        }

        if (spunItem) {
            setWinningItem(spunItem);
            setShowWinningBanner(true);
            bannerTimeoutRef.current = setTimeout(() => {
                setShowWinningBanner(false);
            }, 5000);
        } else {
            setWinningItem(null); // Explicitly set to null if no item
        }
    }, []);

    return (
        <div className="w-full flex flex-col items-center justify-center p-2 md:p-6 space-y-6">
            {showWinningBanner && winningItem && ( // Ensure winningItem exists before showing banner
                <div
                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 text-white p-8 md:p-12 rounded-2xl shadow-2xl text-center animate-fade-in animate-spin-celebrate"
                    // Ensure 'animate-fade-in' and 'animate-spin-celebrate' are defined in tailwind.config.js
                    // or use arbitrary property syntax if not in config for some reason:
                    // style={{ animation: 'fadeIn 0.3s ease-out forwards, spin-celebrate 0.5s ease-out forwards' }}
                >
                    <h2 className="text-2xl md:text-4xl font-bold mb-2">Congratulations!</h2>
                    <p className="text-xl md:text-3xl ">You won: <span className="font-extrabold tracking-wide">{winningItem.name}</span></p>
                    <button
                        onClick={() => {
                            setShowWinningBanner(false);
                            if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
                        }}
                        className="mt-6 bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
                    >
                        Close
                    </button>
                </div>
            )}

            <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-around gap-6 lg:gap-10">
                <div className="relative flex-shrink-0 w-full max-w-lg lg:max-w-xl aspect-square">
                    <WheelCanvas
                        ref={wheelCanvasRef}
                        items={items}
                        pointerPosition={pointerPosition}
                        onSpinStart={handleSpinStart}
                        onSpinEnd={handleSpinEnd}
                        width={500}
                        height={500}
                    />
                    {items.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full pointer-events-none">
                            <p className="text-xl text-slate-300 p-4 text-center">Add items to the wheel to begin!</p>
                        </div>
                    )}
                </div>

                <div className="w-full lg:w-auto lg:max-w-sm flex-shrink-0 lg:pt-8">
                    <WheelControls
                        onSpinClick={handleSpinClick}
                        isSpinning={isDisplaySpinning} // Use the clarified state name
                        currentPointerPosition={pointerPosition}
                        onPointerPositionChange={handlePointerPositionChange}
                    />
                </div>
            </div>

            <div className="mt-4 p-4 bg-slate-700 rounded-md text-sm text-slate-300 w-full max-w-md">
                <p>Pointer: {pointerPosition}</p>
                <p>Spinning: {isDisplaySpinning.toString()}</p>
                <p>Winner: {winningItem ? winningItem.name : 'None'}</p>
                <p className="mt-2 text-xs">Items on wheel: {items.length}</p>
            </div>
        </div>
    );
};

export default WheelDisplay;
// src/features/wheel/WheelDisplay.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import WheelCanvas from './WheelCanvas';
import WheelControls from './WheelControls';
import AddItemForm from '../itemManagement/AddItemForm';
import CurrentItemsList from '../itemManagement/CurrentItemsList';

// Icons for empty states - simple SVGs for this example
const IconPlusCircle = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const IconWheelOutline = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M3 12H0M12 12l5.25 5.25M12 12l-5.25 5.25M12 12l5.25-5.25M12 12l-5.25-5.25" />
    </svg>
);


const WheelDisplay = () => {
    const [items, setItems] = useState([]);
    const [pointerPosition, setPointerPosition] = useState('top');
    const [isDisplaySpinning, setIsDisplaySpinning] = useState(false);
    const [winningItem, setWinningItem] = useState(null);
    const [showWinningBanner, setShowWinningBanner] = useState(false);

    const wheelCanvasRef = useRef(null);
    const bannerTimeoutRef = useRef(null);

    useEffect(() => { // Cleanup for banner timeout
        return () => {
            if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
        };
    }, []);

    const handleAddItem = useCallback(({ name, quantity, color }) => {
        const sourceGroupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newSegments = Array.from({ length: quantity }, (_, i) => ({
            id: `segment-${sourceGroupId}-${i}`, // Simpler unique ID within group context
            name: name,
            color: color || undefined,
            sourceGroup: sourceGroupId,
        }));
        setItems(prevItems => [...prevItems, ...newSegments]);
    }, []);

    const handleRemoveItemGroup = useCallback((sourceGroupIdToRemove) => {
        setItems(prevItems => prevItems.filter(item => item.sourceGroup !== sourceGroupIdToRemove));
        if (winningItem && winningItem.sourceGroup === sourceGroupIdToRemove) {
            setWinningItem(null);
        }
    }, [winningItem]);

    const handleSpinClick = useCallback(() => {
        if (items.length === 0) {
            alert("Please add items to the wheel before spinning!");
            return;
        }
        if (isDisplaySpinning) return;
        if (wheelCanvasRef.current && typeof wheelCanvasRef.current.spin === 'function') {
            wheelCanvasRef.current.spin();
        } else {
            console.error("WheelDisplay Critical Error: WheelCanvas ref/spin method issue.");
        }
    }, [items, isDisplaySpinning]);

    const handlePointerPositionChange = useCallback((newPosition) => {
        setPointerPosition(newPosition);
    }, []);

    const handleSpinStart = useCallback((spunItem) => {
        setIsDisplaySpinning(true);
        setWinningItem(null);
        if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
        setShowWinningBanner(false);
    }, []);

    const handleSpinEnd = useCallback((spunItem, errorInfo) => {
        setIsDisplaySpinning(false);
        if (errorInfo) {
            console.error("WheelDisplay: Spin ended with error:", errorInfo.error);
            setWinningItem(null); return;
        }
        if (spunItem) {
            setWinningItem(spunItem);
            setShowWinningBanner(true);
            bannerTimeoutRef.current = setTimeout(() => setShowWinningBanner(false), 6000); // Increased banner time
        } else {
            setWinningItem(null);
        }
    }, []);

    const canSpin = items.length > 0 && !isDisplaySpinning;

    return (
        <div className="w-full flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 space-y-8 min-h-screen">
            {/* Winning Item Banner - Styling unchanged for now, focus is layout */}
            {showWinningBanner && winningItem && (
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 text-white p-8 md:p-12 rounded-2xl shadow-2xl text-center animate-fade-in animate-spin-celebrate">
                    <h2 className="text-2xl md:text-4xl font-bold mb-2">Congratulations!</h2>
                    <p className="text-xl md:text-3xl ">You won: <span className="font-extrabold tracking-wide">{winningItem.name}</span></p>
                    <button onClick={() => { setShowWinningBanner(false); if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);}} className="mt-6 bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors">Close</button>
                </div>
            )}

            {/* Main Content Area: Two Columns on Large Screens */}
            <div className="w-full max-w-7xl mx-auto flex flex-col xl:flex-row items-start justify-center gap-8 xl:gap-12">

                {/* Column 1: The Stage & Control Deck (Wheel and its controls) */}
                <section className="w-full xl:w-[550px] flex flex-col items-center space-y-6 order-1 flex-shrink-0"> {/* Fixed width for consistent canvas parent size */}
                    {/* The Stage: Wheel Canvas Container */}
                    <div className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-xl w-full"> {/* Card-like container */}
                        <div className="relative w-[calc(100%-2rem)] sm:w-[480px] h-[calc(100%-2rem)] sm:h-[480px] mx-auto"> {/* Responsive inner container for canvas, maintains square */}
                            {/* Forcing canvas to a common size that fits within typical max-w-lg/xl for demo */}
                            <WheelCanvas
                                ref={wheelCanvasRef}
                                items={items}
                                pointerPosition={pointerPosition}
                                onSpinStart={handleSpinStart}
                                onSpinEnd={handleSpinEnd}
                                width={480} // Using a common divisible size for easier calculations
                                height={480}
                                // UI/UX for WheelCanvas itself (colors, text) will be refined in next step
                            />
                            {items.length === 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/80 backdrop-blur-sm rounded-full pointer-events-none">
                                    <IconWheelOutline />
                                    <p className="text-lg font-medium text-slate-300 p-4 text-center">Your wheel is empty!</p>
                                    <p className="text-sm text-slate-400">Use the form to add items.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* The Control Deck: Controls for the Wheel */}
                    {/* WheelControls itself is already card-like from its own styling in Response #24.
              If we want an additional wrapper card here, we can add it. For now, direct placement.
          */}
                    <div className="w-full max-w-[500px]"> {/* Ensure controls don't get wider than canvas area */}
                        <WheelControls
                            onSpinClick={handleSpinClick}
                            isSpinning={isDisplaySpinning}
                            canSpin={canSpin}
                            currentPointerPosition={pointerPosition}
                            onPointerPositionChange={handlePointerPositionChange}
                        />
                    </div>
                </section>

                {/* Column 2: The Workshop (Item Management) */}
                <section className="w-full xl:w-auto xl:max-w-lg flex flex-col space-y-8 items-center order-2 xl:order-1 mt-8 xl:mt-0 flex-grow"> {/* Allow this column to grow if needed, but capped */}
                    {/* AddItemForm and CurrentItemsList are already styled as cards */}
                    <AddItemForm onAddItem={handleAddItem} /> {/* Assuming AddItemForm has w-full max-w-lg from its own styles */}
                    <CurrentItemsList items={items} onRemoveItemGroup={handleRemoveItemGroup} className="w-full" />
                </section>
            </div>

            {/* Debug Info Area - styling largely unchanged, remains at bottom */}
            <div className="mt-auto pt-8 p-4 bg-slate-900/70 backdrop-blur-sm rounded-md text-xs text-slate-400 w-full max-w-4xl self-center ">
                <h4 className="font-semibold text-slate-300 mb-1">Debug Info:</h4>
                <p>Pointer: {pointerPosition}</p>
                <p>Spinning (Display State): {isDisplaySpinning.toString()}</p>
                <p>Can Spin (Button State): {canSpin.toString()}</p>
                <p>Winner: {winningItem ? winningItem.name : 'None'}</p>
                <p>Items on wheel (segments): {items.length}</p>
                <p>Groups on display: {items.reduce((acc, item) => acc.add(item.sourceGroup), new Set()).size}</p>
            </div>
        </div>
    );
};

export default WheelDisplay;
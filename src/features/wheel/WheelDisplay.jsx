// src/features/wheel/WheelDisplay.jsx
// ... (imports and existing state/functions from #26 - no changes to them yet)
import React, { useState, useRef, useCallback, useEffect } from 'react';
import WheelCanvas from './WheelCanvas';
import WheelControls from './WheelControls';
import AddItemForm from '../itemManagement/AddItemForm';
import CurrentItemsList from '../itemManagement/CurrentItemsList';

const WheelDisplay = () => {
    // ... (All state and handler functions - handleAddItem, etc. - remain THE SAME as in Response #26 / #25)
    // For brevity, not repeating them here. Assume the logic from Response #25 is present.
    const [items, setItems] = useState([]);
    const [pointerPosition, setPointerPosition] = useState('top');
    const [isDisplaySpinning, setIsDisplaySpinning] = useState(false);
    const [winningItem, setWinningItem] = useState(null);
    const [showWinningBanner, setShowWinningBanner] = useState(false);

    const wheelCanvasRef = useRef(null);
    const bannerTimeoutRef = useRef(null);

    useEffect(() => { /* ... banner timeout cleanup from #26 ... */
        return () => {
            if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
        };
    }, []);

    const handleAddItem = useCallback(({ name, quantity, color }) => { /* ...from #26... */
        const sourceGroupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newSegments = [];
        for (let i = 0; i < quantity; i++) {
            newSegments.push({
                id: `segment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
                name: name,
                color: color || undefined,
                sourceGroup: sourceGroupId,
            });
        }
        setItems(prevItems => [...prevItems, ...newSegments]);
    }, []);

    const handleRemoveItemGroup = useCallback((sourceGroupIdToRemove) => { /* ...from #26... */
        setItems(prevItems => {
            const updatedItems = prevItems.filter(item => item.sourceGroup !== sourceGroupIdToRemove);
            if (winningItem && winningItem.sourceGroup === sourceGroupIdToRemove) {
                setWinningItem(null);
            }
            return updatedItems;
        });
    }, [winningItem]);

    const handleSpinClick = useCallback(() => { /* ...from #26... */
        if (items.length === 0) {
            alert("Please add items to the wheel before spinning!"); return;
        }
        if (isDisplaySpinning) return;
        if (wheelCanvasRef.current && typeof wheelCanvasRef.current.spin === 'function') {
            wheelCanvasRef.current.spin();
        } else {
            console.error("WheelDisplay Critical Error: WheelCanvas ref not available or spin method not exposed.");
        }
    }, [items, isDisplaySpinning]);

    const handlePointerPositionChange = useCallback((newPosition) => { /* ...from #26... */
        setPointerPosition(newPosition);
    }, []);

    const handleSpinStart = useCallback((spunItem) => { /* ...from #26... */
        setIsDisplaySpinning(true); setWinningItem(null);
        if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
        setShowWinningBanner(false);
    }, []);

    const handleSpinEnd = useCallback((spunItem, errorInfo) => { /* ...from #26... */
        setIsDisplaySpinning(false);
        if (errorInfo) {
            console.error("WheelDisplay: Spin ended with error from WheelCanvas:", errorInfo.error);
            setWinningItem(null); return;
        }
        if (spunItem) {
            setWinningItem(spunItem); setShowWinningBanner(true);
            bannerTimeoutRef.current = setTimeout(() => { setShowWinningBanner(false); }, 5000);
        } else {
            setWinningItem(null);
        }
    }, []);

    const canSpin = items.length > 0 && !isDisplaySpinning;

    return (
        // Root container: takes full width and min full height, centers content block horizontally using mx-auto for the grid
        <div className="w-full flex flex-col items-center justify-start py-8 px-4 min-h-screen"> {/* py-8 for top/bottom padding, px-4 for side padding */}

            {/* Winning Item Banner (as before) */}
            {showWinningBanner && winningItem && ( /* ... banner code from #26 ... */
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 text-white p-8 md:p-12 rounded-2xl shadow-2xl text-center animate-fade-in animate-spin-celebrate">
                    <h2 className="text-2xl md:text-4xl font-bold mb-2">Congratulations!</h2>
                    <p className="text-xl md:text-3xl ">You won: <span className="font-extrabold tracking-wide">{winningItem.name}</span></p>
                    <button onClick={() => { setShowWinningBanner(false); if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);}} className="mt-6 bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors">Close</button>
                </div>
            )}

            {/* Main Content Area: Grid layout */}
            {/* Removed max-w-screen-2xl to allow it to be truly full width IF desired, or re-add if too wide. */}
            {/* Adding mx-auto to center the grid container itself if it's narrower than viewport (e.g. if a max-width is re-added) */}
            <div className="w-full grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-12 items-start max-w-full px-2"> {/* max-w-full ensures it uses available space, px-2 for slight edge spacing */}

                {/* Left Column: Wheel & Controls */}
                <div className="flex flex-col items-center space-y-6 w-full">
                    <div className="relative w-[500px] h-[500px] max-w-full flex-shrink-0 mx-auto"> {/* Added mx-auto to center this fixed-size block within its grid cell */}
                        <WheelCanvas
                            ref={wheelCanvasRef}
                            items={items}
                            pointerPosition={pointerPosition}
                            onSpinStart={handleSpinStart}
                            onSpinEnd={handleSpinEnd}
                            width={500}
                            height={500}
                        />
                        {items.length === 0 && ( /* ... empty message ... */
                            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-full pointer-events-none">
                                <p className="text-xl text-slate-200 p-4 text-center">Add items below to build your wheel!</p>
                            </div>
                        )}
                    </div>
                    <div className="w-full max-w-[500px] mx-auto"> {/* Added mx-auto */}
                        <WheelControls
                            onSpinClick={handleSpinClick}
                            isSpinning={isDisplaySpinning}
                            canSpin={canSpin}
                            currentPointerPosition={pointerPosition}
                            onPointerPositionChange={handlePointerPositionChange}
                        />
                    </div>
                </div>

                {/* Right Column: Item Management */}
                <div className="flex flex-col space-y-8 items-center w-full"> {/* This column will naturally fill its grid space */}
                    <AddItemForm onAddItem={handleAddItem} className="w-full max-w-md mx-auto xl:mx-0" /> {/* Centered on small, align left on xl if needed */}
                    <CurrentItemsList items={items} onRemoveItemGroup={handleRemoveItemGroup} className="w-full max-w-md mx-auto xl:mx-0" />
                </div>
            </div>

            {/* Debug Info Area (as before) */}
            <div className="mt-auto pt-8 p-4 bg-slate-900/50 backdrop-blur-sm rounded-md text-xs text-slate-400 w-full max-w-4xl self-center">
                {/* ... debug info from #26 ... */}
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
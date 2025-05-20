// src/features/wheel/WheelDisplay.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import WheelCanvas from './WheelCanvas';
import WheelControls from './WheelControls';
import AddItemForm from '../itemManagement/AddItemForm';
import CurrentItemsList from '../itemManagement/CurrentItemsList';
import SlideOutPanel from '../../components/SlideOutPanel';

// Icons (ensure these are defined as in Response #45 or your working version)
const IconSettings = ({ className = "w-6 h-6" }) => ( /* ... SVG ... */
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
);
const IconClosePanel = ({ className = "w-6 h-6" }) => ( /* ... SVG ... */
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
);
const IconWheelOutlineDisplay = () => ( /* ... SVG ... */
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M3 12H0M12 12l5.25 5.25M12 12l-5.25 5.25M12 12l5.25-5.25M12 12l-5.25-5.25" /></svg>
);


const WheelDisplay = () => {
    const [items, setItems] = useState([]);
    const [pointerPosition, setPointerPosition] = useState('top');
    const [isDisplaySpinning, setIsDisplaySpinning] = useState(false);
    const [winningItem, setWinningItem] = useState(null);
    const [showWinningBanner, setShowWinningBanner] = useState(false);
    const [isItemPanelOpen, setIsItemPanelOpen] = useState(false);

    const wheelCanvasRef = useRef(null);
    const bannerTimeoutRef = useRef(null);

    // Constants for panel effects
    const PANEL_WIDTH_PX = 480; // Assuming effective panel width is 480px (from md:w-[480px])
    const WHEEL_SECTION_TRANSLATE_X_OFFSET = PANEL_WIDTH_PX / 2.5; // How much wheel section slides left
    const WHEEL_SCALE_WHEN_PANEL_OPEN = 0.7; // How much wheel shrinks

    // Unchanged handlers: useEffect cleanup, handleAddItem, handleRemoveItemGroup,
    // handleSpinClick, handlePointerPositionChange, handleSpinStart, handleSpinEnd, canSpin
    useEffect(() => { return () => { if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current); }; }, []);
    const handleAddItem = useCallback(({ name, quantity, color }) => { const sourceGroupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; const newSegments = Array.from({ length: quantity }, (_, i) => ({ id: `segment-${sourceGroupId}-${i}`, name: name, color: color || undefined, sourceGroup: sourceGroupId, })); setItems(prevItems => [...prevItems, ...newSegments]); }, []);
    const handleRemoveItemGroup = useCallback((sourceGroupIdToRemove) => { setItems(prevItems => prevItems.filter(item => item.sourceGroup !== sourceGroupIdToRemove)); if (winningItem && winningItem.sourceGroup === sourceGroupIdToRemove) setWinningItem(null); }, [winningItem]);
    const handleSpinClick = useCallback(() => { if (items.length === 0) { alert("Please add items to the wheel before spinning!"); return; } if (isDisplaySpinning) return; if (wheelCanvasRef.current?.spin) wheelCanvasRef.current.spin(); else console.error("WheelDisplay Error: WheelCanvas ref/spin issue."); }, [items, isDisplaySpinning]);
    const handlePointerPositionChange = useCallback((newPosition) => { setPointerPosition(newPosition); }, []);
    const handleSpinStart = useCallback((spunItem) => { setIsDisplaySpinning(true); setWinningItem(null); if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current); setShowWinningBanner(false); }, []);
    const handleSpinEnd = useCallback((spunItem, errorInfo) => { setIsDisplaySpinning(false); if (errorInfo) { console.error("Spin ended with error:", errorInfo.error); setWinningItem(null); return; } if (spunItem) { setWinningItem(spunItem); setShowWinningBanner(true); bannerTimeoutRef.current = setTimeout(() => setShowWinningBanner(false), 6000); } else { setWinningItem(null); } }, []);
    const canSpin = items.length > 0 && !isDisplaySpinning;
    // End unchanged handlers

    const closedPanelWheelRenderSize = 520; // Canvas actual render dimension

    const toggleItemPanel = () => setIsItemPanelOpen(prev => !prev);

    return (
        <div className="w-full flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 space-y-8 min-h-screen relative overflow-x-hidden"> {/* Added overflow-x-hidden */}

            <button
                onClick={toggleItemPanel}
                className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-[75] p-3 text-white rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 ease-in-out
                    ${isItemPanelOpen ? 'bg-red-600 hover:bg-red-700 rotate-[360deg]' : 'bg-sky-600 hover:bg-sky-700'}`} // Added rotation for fun
                aria-label={isItemPanelOpen ? "Close item panel" : "Open item panel"}
                aria-expanded={isItemPanelOpen}
            >
                {isItemPanelOpen ? <IconClosePanel className="w-6 h-6"/> : <IconSettings className="w-6 h-6"/>}
            </button>

            {showWinningBanner && winningItem && ( /* ... Unchanged Banner ... */
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 text-white p-8 md:p-12 rounded-2xl shadow-2xl text-center animate-fade-in animate-spin-celebrate">
                    <h2 className="text-2xl md:text-4xl font-bold mb-2">Congratulations!</h2>
                    <p className="text-xl md:text-3xl ">You won: <span className="font-extrabold tracking-wide">{winningItem.name}</span></p>
                    <button onClick={() => { setShowWinningBanner(false); if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);}} className="mt-6 bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors">Close</button>
                </div>
            )}

            {/* Main Content Area - Now designed for wheel to slide and scale */}
            <div className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center pt-10 xl:pt-0">

                {/* "Stage & Control Deck" Section - This section will translate and its content will scale */}
                <section
                    className="flex flex-col items-center space-y-6 transition-transform duration-300 ease-in-out"
                    style={{
                        transform: isItemPanelOpen ? `translateX(-${WHEEL_SECTION_TRANSLATE_X_OFFSET}px)` : 'translateX(0px)',
                        // Ensure this section has enough width to contain the scaled wheel + controls comfortably
                        // It doesn't need to shrink in width, only its contents scale, and it moves.
                        width: `${closedPanelWheelRenderSize + 64}px`, // Approx. wheel size + padding for card + controls space
                        maxWidth: '100%', // Ensure it doesn't overflow viewport
                    }}
                >
                    {/* Wheel's Card Container */}
                    <div className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-xl"
                        // This card's dimensions will be dictated by the scaled canvas container inside it
                    >
                        {/* Canvas Container - THIS is what scales. It always has the 'closedPanelWheelRenderSize' dimensions. */}
                        <div
                            className="relative mx-auto origin-center transition-transform duration-300 ease-in-out"
                            style={{
                                width: `${closedPanelWheelRenderSize}px`,
                                height: `${closedPanelWheelRenderSize}px`,
                                transform: isItemPanelOpen ? `scale(${WHEEL_SCALE_WHEN_PANEL_OPEN})` : 'scale(1)',
                            }}
                        >
                            <WheelCanvas
                                ref={wheelCanvasRef}
                                items={items}
                                pointerPosition={pointerPosition}
                                onSpinStart={handleSpinStart}
                                onSpinEnd={handleSpinEnd}
                                width={closedPanelWheelRenderSize} // Always render at full size
                                height={closedPanelWheelRenderSize} // Canvas itself then scales via parent's transform
                            />
                            {items.length === 0 && ( /* ... Unchanged Empty State Overlay ... */
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/80 backdrop-blur-sm rounded-full pointer-events-none">
                                    <IconWheelOutlineDisplay />
                                    <p className="text-lg font-medium text-slate-300 p-4 text-center">Your wheel is empty!</p>
                                    <p className="text-sm text-slate-400">Use the form to add items.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Controls Container - Also scales with the wheel to maintain relative position/size perception */}
                    <div
                        className="w-full origin-top transition-transform duration-300 ease-in-out"
                        style={{
                            maxWidth: `${closedPanelWheelRenderSize}px`,
                            transform: isItemPanelOpen ? `scale(${WHEEL_SCALE_WHEN_PANEL_OPEN})` : 'scale(1)',
                        }}
                    >
                        <WheelControls
                            onSpinClick={handleSpinClick}
                            isSpinning={isDisplaySpinning}
                            canSpin={canSpin}
                            currentPointerPosition={pointerPosition}
                            onPointerPositionChange={handlePointerPositionChange}
                        />
                    </div>
                </section>
            </div>

            <SlideOutPanel
                isOpen={isItemPanelOpen}
                onClose={() => setIsItemPanelOpen(false)}
                position="right"
                title="Manage Wheel Items"
                widthClass="w-full sm:w-[420px] md:w-[480px]" // This defines PANEL_WIDTH_PX implicitly
            >
                <div className="flex flex-col space-y-8 p-1">
                    <AddItemForm onAddItem={handleAddItem} />
                    <CurrentItemsList items={items} onRemoveItemGroup={handleRemoveItemGroup} className="w-full" />
                </div>
            </SlideOutPanel>

            <div className="fixed bottom-0 left-0 right-0 p-3 bg-slate-900/80 backdrop-blur-sm text-xs text-slate-400 text-center z-[50]">
                <span>...Debug Info... | Panel: {isItemPanelOpen.toString()} | WheelScale: {isItemPanelOpen ? WHEEL_SCALE_WHEN_PANEL_OPEN : 1} | WheelX: {isItemPanelOpen ? -WHEEL_SECTION_TRANSLATE_X_OFFSET : 0}px</span>
            </div>
        </div>
    );
};

export default WheelDisplay;
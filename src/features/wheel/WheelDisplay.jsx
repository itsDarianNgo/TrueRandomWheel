// src/features/wheel/WheelDisplay.jsx
// ... (all imports, icons, constants, etc. as in Response #57) ...
import React, { useState, useRef, useCallback, useEffect } from 'react';
import WheelCanvas from './WheelCanvas';
import WheelControls from './WheelControls';
import AddItemForm from '../itemManagement/AddItemForm';
import CurrentItemsList from '../itemManagement/CurrentItemsList';
import SlideOutPanel from '../../components/SlideOutPanel';

const IconSettings = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const IconClosePanel = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
const IconWheelOutlineDisplay = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M3 12H0M12 12l5.25 5.25M12 12l-5.25 5.25M12 12l5.25-5.25M12 12l-5.25-5.25" /></svg>);
const IconArrowUp = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"> <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" /> </svg> );
const IconArrowRight = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"> <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /> </svg> );
const IconArrowDown = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"> <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M19 12l-7 7-7-7" /> </svg> );
const IconArrowLeft = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"> <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h15" /> </svg> );
const pointerIconsMapWheelDisplay = { top: { IconComponent: IconArrowUp, label: "Top" }, right: { IconComponent: IconArrowRight, label: "Right" }, bottom: { IconComponent: IconArrowDown, label: "Bottom" }, left: { IconComponent: IconArrowLeft, label: "Left" }};
const POINTER_POSITIONS_ORDER = ['top', 'right', 'bottom', 'left'];
const IconInformationCircle = ({ className = "w-4 h-4" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"> <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> </svg>);


const WheelDisplay = () => {
    // State (removeOnHit state is already present from #56)
    const [items, setItems] = useState([]);
    const [pointerPosition, setPointerPosition] = useState('top');
    const [isDisplaySpinning, setIsDisplaySpinning] = useState(false);
    const [winningItem, setWinningItem] = useState(null); // This will hold the item that won
    const [showWinningBanner, setShowWinningBanner] = useState(false);
    const [isItemPanelOpen, setIsItemPanelOpen] = useState(false);
    const [removeOnHit, setRemoveOnHit] = useState(false);

    const wheelCanvasRef = useRef(null);
    // const bannerTimeoutRef = useRef(null); // No longer needed as banner is manually closed

    // Item management and most other handlers (Unchanged from Response #56)
    useEffect(() => { /* No banner timeout to clear now */ }, []);
    const handleAddItem = useCallback(({ name, quantity, color }) => { const sourceGroupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; const newSegments = Array.from({ length: quantity }, (_, i) => ({ id: `segment-${sourceGroupId}-${i}`, name: name, color: color || undefined, sourceGroup: sourceGroupId, })); setItems(prevItems => [...prevItems, ...newSegments]); }, []);
    const handleRemoveItemGroup = useCallback((sourceGroupIdToRemove) => { setItems(prevItems => prevItems.filter(item => item.sourceGroup !== sourceGroupIdToRemove)); if (winningItem && winningItem.sourceGroup === sourceGroupIdToRemove) setWinningItem(null); }, [winningItem]); // winningItem dependency is correct
    const handleIncrementItemGroupQuantity = useCallback((sourceGroupId) => { setItems(prevItems => { const itemToClone = prevItems.find(item => item.sourceGroup === sourceGroupId); if (itemToClone) { const newItemSegment = { ...itemToClone, id: `segment-${sourceGroupId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` }; return [...prevItems, newItemSegment]; } return prevItems; }); }, []);
    const handleDecrementItemGroupQuantity = useCallback((sourceGroupId) => { setItems(prevItems => { const itemIndexToRemove = prevItems.findIndex(item => item.sourceGroup === sourceGroupId); if (itemIndexToRemove !== -1) { const newItems = [...prevItems]; newItems.splice(itemIndexToRemove, 1); if (newItems.filter(i => i.sourceGroup === sourceGroupId).length === 0) { if (winningItem && winningItem.sourceGroup === sourceGroupId) { setWinningItem(null); } } return newItems; } return prevItems; }); }, [winningItem]);
    const handleSpinClick = useCallback(() => { if (items.length === 0) { alert("Please add items to the wheel before spinning!"); return; } if (isDisplaySpinning) return; if (wheelCanvasRef.current?.spin) wheelCanvasRef.current.spin(); else console.error("WheelDisplay Error: WheelCanvas ref/spin issue."); }, [items, isDisplaySpinning]);
    const handleDirectPointerPositionChange = useCallback((newPosition) => { if (isDisplaySpinning) return; setPointerPosition(newPosition); }, [isDisplaySpinning]);
    const handleCyclePointerPosition = useCallback(() => { if (isDisplaySpinning) return; const currentIndex = POINTER_POSITIONS_ORDER.indexOf(pointerPosition); const nextIndex = (currentIndex + 1) % POINTER_POSITIONS_ORDER.length; setPointerPosition(POINTER_POSITIONS_ORDER[nextIndex]); }, [pointerPosition, isDisplaySpinning]);
    const handleSpinStart = useCallback((spunItem) => { setIsDisplaySpinning(true); setWinningItem(null); setShowWinningBanner(false); }, []); // Removed bannerTimeout clear as it's gone

    // ***** MODIFIED handleSpinEnd: No auto-hide for banner, removeOnHit logic moved to banner close *****
    const handleSpinEnd = useCallback((spunItem, errorInfo) => {
        setIsDisplaySpinning(false);
        if (errorInfo) {
            console.error("Spin ended with error:", errorInfo.error);
            setWinningItem(null); // Ensure winningItem is cleared on error
            setShowWinningBanner(false); // Ensure banner is not shown on error
            return;
        }

        if (spunItem) {
            setWinningItem(spunItem); // Store the actual winning item object
            setShowWinningBanner(true); // Show the banner
            // The removeOnHit logic is now handled by handleCloseWinningBanner
        } else {
            setWinningItem(null); // Should not happen if no error, but defensive
            setShowWinningBanner(false);
        }
    }, []); // removeOnHit is NOT a dependency here anymore

    // ***** NEW: Handler for closing the winning banner *****
    const handleCloseWinningBanner = useCallback(() => {
        setShowWinningBanner(false);
        if (removeOnHit && winningItem) { // Check removeOnHit AND if there was a winningItem
            console.log(`Banner closed. Remove on Hit enabled. Removing item ID: ${winningItem.id}`);
            setItems(prevItems => prevItems.filter(item => item.id !== winningItem.id));
            // Set winningItem to null after removal and banner close if desired,
            // or keep it to show "Last Winner" somewhere else. For now, banner closes, item removed.
            // setWinningItem(null); // Optional: clear winningItem after processing
        } else if (winningItem) {
            console.log(`Banner closed for winner: ${winningItem.name}. Remove on Hit was OFF or no winner data.`);
        }
        // No need to explicitly setWinningItem(null) here unless specifically desired for other UI.
        // The winningItem state retains the last winner until the next spin starts or an error occurs.
    }, [removeOnHit, winningItem]); // Depends on these states


    // Unchanged constants and derived states for layout
    const PANEL_WIDTH_PX = 480;
    const WHEEL_SECTION_TRANSLATE_X_OFFSET = PANEL_WIDTH_PX / 2.5;
    const WHEEL_SCALE_WHEN_PANEL_OPEN = 0.7;
    const closedPanelWheelRenderSize = 520;
    const canSpin = items.length > 0 && !isDisplaySpinning;
    const visualWheelScale = isItemPanelOpen ? WHEEL_SCALE_WHEN_PANEL_OPEN : 1;
    const wheelTranslateX = isItemPanelOpen ? -WHEEL_SECTION_TRANSLATE_X_OFFSET : 0;
    const toggleItemPanel = () => setIsItemPanelOpen(prev => !prev);

    return (
        <div className="w-full flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 space-y-8 min-h-screen relative overflow-x-hidden">
            {/* Panel Toggle Button (Unchanged from #48) */}
            <button onClick={toggleItemPanel} disabled={isDisplaySpinning} className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-[75] p-3 text-white rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 ease-in-out ${isDisplaySpinning ? 'opacity-50 cursor-not-allowed' : ''} ${isItemPanelOpen ? 'bg-red-600 hover:bg-red-700 rotate-[360deg]' : 'bg-sky-600 hover:bg-sky-700'}`} aria-label={isItemPanelOpen ? "Close settings panel" : "Open settings panel"} aria-expanded={isItemPanelOpen}>
                {isItemPanelOpen ? <IconClosePanel className="w-6 h-6"/> : <IconSettings className="w-6 h-6"/>}
            </button>

            {/* Winning Item Banner - onClick for close button MODIFIED */}
            {showWinningBanner && winningItem && (
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 text-white p-8 md:p-12 rounded-2xl shadow-2xl text-center animate-fade-in animate-spin-celebrate">
                    <h2 className="text-2xl md:text-4xl font-bold mb-2">Congratulations!</h2>
                    <p className="text-xl md:text-3xl ">You won: <span className="font-extrabold tracking-wide">{winningItem.name}</span></p>
                    <button
                        onClick={handleCloseWinningBanner} // ***** MODIFIED: Use new handler *****
                        className="mt-6 bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
                    >
                        Close & Continue
                    </button>
                </div>
            )}

            {/* Main Content Area (Layout Unchanged from #48) */}
            <div className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center pt-10 xl:pt-0">
                <section className="flex flex-col items-center space-y-6 transition-transform duration-300 ease-in-out" style={{ transform: `translateX(${wheelTranslateX}px)`, width: `${closedPanelWheelRenderSize + 64}px`, maxWidth: '100%' }}>
                    <div className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-xl">
                        <div className="relative mx-auto origin-center transition-transform duration-300 ease-in-out" style={{ width: `${closedPanelWheelRenderSize}px`, height: `${closedPanelWheelRenderSize}px`, transform: `scale(${visualWheelScale})` }}>
                            <WheelCanvas ref={wheelCanvasRef} items={items} pointerPosition={pointerPosition} onSpinStart={handleSpinStart} onSpinEnd={handleSpinEnd} width={closedPanelWheelRenderSize} height={closedPanelWheelRenderSize} />
                            {items.length === 0 && ( <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/80 backdrop-blur-sm rounded-full pointer-events-none"><IconWheelOutlineDisplay /><p className="text-lg font-medium text-slate-300 p-4 text-center">Your wheel is empty!</p><p className="text-sm text-slate-400">Use the form to add items.</p></div>)}
                        </div>
                    </div>
                    <div className="w-full origin-top transition-transform duration-300 ease-in-out" style={{ maxWidth: `${closedPanelWheelRenderSize}px`, transform: `scale(${visualWheelScale})` }}>
                        <WheelControls onSpinClick={handleSpinClick} isSpinning={isDisplaySpinning} canSpin={canSpin} currentPointerPosition={pointerPosition} onCyclePointerPosition={handleCyclePointerPosition} />
                    </div>
                </section>
            </div>

            {/* SlideOutPanel Content (Unchanged from #57 - "Spin Behavior" section is correct) */}
            <SlideOutPanel isOpen={isItemPanelOpen} onClose={() => setIsItemPanelOpen(false)} position="right" title="Wheel Settings & Items" widthClass="w-full sm:w-[420px] md:w-[480px]">
                <div className={`flex flex-col space-y-6 p-2 sm:p-4 ${isDisplaySpinning ? 'opacity-60 pointer-events-none' : ''}`}>
                    <section className="p-4 bg-slate-700/60 rounded-lg shadow">
                        <h4 id="pointer-position-group-label-panel" className="text-base sm:text-md font-semibold text-sky-300 mb-3 text-center">Pointer Position</h4>
                        <div role="group" aria-labelledby="pointer-position-group-label-panel" className={`flex w-full rounded-lg shadow-sm border border-slate-600 overflow-hidden ${isDisplaySpinning ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {POINTER_POSITIONS_ORDER.map((positionKey, index) => {
                                const isActive = pointerPosition === positionKey; const { IconComponent, label } = pointerIconsMapWheelDisplay[positionKey]; let segmentClasses = ""; if (index === 0) segmentClasses += "rounded-l-md "; if (index === POINTER_POSITIONS_ORDER.length - 1) segmentClasses += "rounded-r-md "; if (index < POINTER_POSITIONS_ORDER.length - 1) segmentClasses += "border-r border-slate-500 ";
                                return (<button key={positionKey} type="button" onClick={() => handleDirectPointerPositionChange(positionKey)} disabled={isDisplaySpinning} className={`flex-1 flex flex-col items-center justify-center p-2.5 sm:p-3 text-xs sm:text-sm transition-colors duration-150 ease-in-out focus:outline-none focus:z-10 focus:ring-2 focus:ring-offset-0 focus:ring-sky-400 ${segmentClasses} ${isActive ? 'bg-sky-600 text-white shadow-inner' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'} ${isDisplaySpinning ? 'pointer-events-none hover:bg-slate-700' : ''}`} aria-pressed={isActive} aria-label={`Set pointer to ${label}`}><IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 sm:mb-1 ${isActive ? 'text-white' : 'text-slate-400'}`} /><span className="font-semibold">{label}</span></button>);
                            })}
                        </div>
                    </section>
                    <section className="p-4 bg-slate-700/60 rounded-lg shadow">
                        <h4 className="text-base sm:text-md font-semibold text-sky-300 mb-3 text-center">Spin Behavior</h4>
                        <div className={`flex items-center justify-between p-3 bg-slate-700 rounded-md transition-opacity ${isDisplaySpinning ? 'opacity-50' : ''}`}>
                            <div className="flex items-center space-x-2">
                                <label htmlFor="removeOnHitToggle" className="text-sm text-slate-200 select-none cursor-pointer flex-grow">Auto-Remove Winner</label>
                                <span className="cursor-help text-slate-400 hover:text-sky-400 transition-colors" title="If enabled, the winning item segment will be removed from the wheel after each spin."><IconInformationCircle className="w-4 h-4"/></span>
                            </div>
                            <button type="button" id="removeOnHitToggle" role="switch" aria-checked={removeOnHit} onClick={() => { if (!isDisplaySpinning) setRemoveOnHit(prev => !prev); }} disabled={isDisplaySpinning} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-700 ${isDisplaySpinning ? 'cursor-not-allowed' : 'cursor-pointer'} ${removeOnHit ? 'bg-sky-500' : 'bg-slate-600'}`}>
                                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform shadow ${removeOnHit ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </section>
                    <AddItemForm onAddItem={handleAddItem} isSpinning={isDisplaySpinning} />
                    <CurrentItemsList items={items} onRemoveItemGroup={handleRemoveItemGroup} onIncrementItemGroupQuantity={handleIncrementItemGroupQuantity} onDecrementItemGroupQuantity={handleDecrementItemGroupQuantity} isSpinning={isDisplaySpinning} className="w-full" />
                </div>
            </SlideOutPanel>

            <div className="fixed bottom-0 left-0 right-0 p-3 bg-slate-900/80 backdrop-blur-sm text-xs text-slate-400 text-center z-[50]">
                <span>...Debug Info... | Panel: {isItemPanelOpen.toString()} | WheelScale: {visualWheelScale} | WheelX: {wheelTranslateX}px | isSpinning: {isDisplaySpinning.toString()} | RemoveOnHit: {removeOnHit.toString()} | Winner: {winningItem ? winningItem.name.substring(0,10)+'...' : 'N/A'}</span>
            </div>
        </div>
    );
};

export default WheelDisplay;
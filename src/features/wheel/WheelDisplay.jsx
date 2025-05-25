// src/features/wheel/WheelDisplay.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux'; // Added for Redux
import WheelCanvas from './WheelCanvas';
import SlideOutPanel from '../../components/common/SlideOutPanel.jsx';
import SettingsPanelContent from './SettingsPanelContent';
import PRNG from '../../core/prng/PRNGModule'; // Assuming this path is correct
import Modal from '../../components/common/Modal.jsx';
import { addHistoryEntry } from '../history/historySlice'; // Added for Redux, adjust path as needed

// SVG Icon Components (assuming these are small and specific enough to keep here, or move to a shared icons file)
const IconSettings = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const IconClosePanel = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
const IconWheelOutlineDisplay = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M3 12H0M12 12l5.25 5.25M12 12l-5.25 5.25M12 12l5.25-5.25M12 12l-5.25-5.25" /></svg>);
const IconShuffle = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /> </svg>);

const SHUFFLE_TICK_ORCHESTRATION_DELAY = 270; // ms, matches WheelCanvas for visual sync if it had its own internal animation timer

const WheelDisplay = () => {
    const [items, setItems] = useState([]); // Array of { id, name, color, sourceGroup }
    const [pointerPosition, setPointerPosition] = useState('top'); // 'top', 'right', 'bottom', 'left'
    const [isDisplaySpinning, setIsDisplaySpinning] = useState(false); // True if wheel is physically spinning or shuffle sequence is active
    const [winningItem, setWinningItem] = useState(null); // Stores the last winning item object
    const [showWinningBanner, setShowWinningBanner] = useState(false);
    const [isItemPanelOpen, setIsItemPanelOpen] = useState(false); // For slide-out settings panel

    // Settings managed by SettingsPanelContent, but their state lives here to be passed down
    const [removeOnHit, setRemoveOnHit] = useState(false);
    const [shuffleCountInput, setShuffleCountInput] = useState('3'); // Number of times to shuffle

    // For WheelCanvas shuffle animation
    const [shuffleAnimationSeed, setShuffleAnimationSeed] = useState(0); // Incremented to trigger shuffle animation in WheelCanvas
    const [isShuffleSequenceAnimating, setIsShuffleSequenceAnimating] = useState(false); // True during the multi-step shuffle N times process

    const wheelAreaRef = useRef(null); // Ref for the div containing the canvas to measure its size
    const [canvasDimensions, setCanvasDimensions] = useState({ width: 520, height: 520 }); // Default, updated by ResizeObserver
    const wheelCanvasRef = useRef(null); // Ref to WheelCanvas component to call its .spin() method

    const dispatch = useDispatch(); // Redux dispatch hook

    // Panel animation constants
    const PANEL_WIDTH_PX = 480; // Approximate width of the panel, adjust if SettingsPanelContent width changes
    const WHEEL_SECTION_TRANSLATE_X_OFFSET = PANEL_WIDTH_PX / 2.5; // How much to shift wheel left
    const WHEEL_SCALE_WHEN_PANEL_OPEN = 0.75; // How much to shrink wheel

    // Effect to observe the size of the wheel area and update canvas dimensions
    useEffect(() => {
        const wheelElement = wheelAreaRef.current;
        if (!wheelElement) return;

        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                const size = Math.min(width, height); // Ensure it's a square
                if (size > 0 && (Math.abs(canvasDimensions.width - size) > 1 || Math.abs(canvasDimensions.height - size) > 1)) {
                    setCanvasDimensions({ width: size, height: size });
                }
            }
        });

        resizeObserver.observe(wheelElement);
        return () => resizeObserver.unobserve(wheelElement);
    }, [canvasDimensions.width, canvasDimensions.height]); // Rerun if dimensions change significantly

    // Item Management Callbacks
    const handleAddItem = useCallback((newItemData) => { // newItemData: { name, quantity, color }
        const sourceGroupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newIndividualItems = Array.from({ length: newItemData.quantity }, (_, i) => ({
            id: `item-${sourceGroupId}-${i}`, // Unique ID for each individual segment
            name: newItemData.name,
            color: newItemData.color || undefined, // Use undefined if no color to let WheelCanvas use defaults
            sourceGroup: sourceGroupId,
        }));
        setItems(prevItems => [...prevItems, ...newIndividualItems]);
    }, []);

    const handleRemoveItemGroup = useCallback((sourceGroupIdToRemove) => {
        setItems(prevItems => prevItems.filter(item => item.sourceGroup !== sourceGroupIdToRemove));
        if (winningItem && winningItem.sourceGroup === sourceGroupIdToRemove) {
            setWinningItem(null); // Clear winner if its group is removed
            setShowWinningBanner(false);
        }
    }, [winningItem]);

    const handleIncrementItemGroupQuantity = useCallback((sourceGroupIdToIncrement) => {
        setItems(prevItems => {
            const itemToClone = prevItems.find(item => item.sourceGroup === sourceGroupIdToIncrement);
            if (itemToClone) {
                const newItemInstance = {
                    ...itemToClone,
                    id: `item-${sourceGroupIdToIncrement}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, // New unique ID
                };
                return [...prevItems, newItemInstance];
            }
            return prevItems;
        });
    }, []);

    const handleDecrementItemGroupQuantity = useCallback((sourceGroupIdToDecrement) => {
        setItems(prevItems => {
            const firstItemIndexInGroup = prevItems.findIndex(item => item.sourceGroup === sourceGroupIdToDecrement);
            if (firstItemIndexInGroup !== -1) {
                const newItems = [...prevItems];
                const removedItem = newItems.splice(firstItemIndexInGroup, 1)[0]; // Remove one item from the group

                // If the removed item was the currently displayed winning item (and no others of its kind are left from this removal)
                // and this was the last item of its source group.
                const remainingInGroup = newItems.filter(item => item.sourceGroup === sourceGroupIdToDecrement).length;
                if (winningItem && winningItem.id === removedItem.id && remainingInGroup === 0) {
                    // More robustly, if the winning item's group is now empty.
                    if (winningItem.sourceGroup === sourceGroupIdToDecrement) {
                        // Check if any item from this sourceGroup is still the winner
                        if(!newItems.find(i => i.id === winningItem.id)){
                            setWinningItem(null);
                            setShowWinningBanner(false);
                        }
                    }
                }
                // Check if the removed item was the specific instance that won
                if (winningItem && winningItem.id === removedItem.id) {
                    // If this specific instance was the winner, clear it.
                    // But only if no other identical items from the same original "add operation" (sourceGroup) are left.
                    // This logic can get complex. Simpler: if the *displayed* winningItem object's ID matches the removed one, clear it.
                    // The history will still have the record.
                    setWinningItem(null);
                    setShowWinningBanner(false);
                }


                return newItems;
            }
            return prevItems;
        });
    }, [winningItem]);

    // Wheel Interaction Callbacks
    const handleSpinTrigger = useCallback(() => {
        if (items.length === 0 || isDisplaySpinning || isShuffleSequenceAnimating) return;
        if (wheelCanvasRef.current?.spin) {
            wheelCanvasRef.current.spin();
        }
    }, [items.length, isDisplaySpinning, isShuffleSequenceAnimating]);

    const handleDirectPointerPositionChange = useCallback((newPosition) => {
        if (isDisplaySpinning || isShuffleSequenceAnimating) return;
        setPointerPosition(newPosition);
    }, [isDisplaySpinning, isShuffleSequenceAnimating]);

    const handleSpinStart = useCallback((_selectedItemByPRNG) => { // Parameter from WheelCanvas, not used directly here but good for logging
        setIsDisplaySpinning(true); // This now covers both actual spin and shuffle sequence
        setWinningItem(null);
        setShowWinningBanner(false);
    }, []);

    const handleSpinEnd = useCallback((finalWinningItem, errorInfo) => {
        // Note: isDisplaySpinning will be set to false by shuffle sequence if that was running.
        // If it was a prize spin, setIsDisplaySpinning(false) happens here.
        setIsDisplaySpinning(false);
        setIsShuffleSequenceAnimating(false); // Ensure shuffle sequence is also marked false

        if (errorInfo) {
            setWinningItem(null);
            setShowWinningBanner(false);
            console.error("Spin Error from WheelCanvas:", errorInfo.error);
            // TODO: Consider a user-facing notification for spin errors
            return;
        }
        if (finalWinningItem) {
            setWinningItem(finalWinningItem);
            setShowWinningBanner(true);
            dispatch(addHistoryEntry({
                name: finalWinningItem.name,
                color: finalWinningItem.color
            }));
        } else {
            // Should ideally not happen if errorInfo is properly managed by WheelCanvas
            setWinningItem(null);
            setShowWinningBanner(false);
        }
    }, [dispatch]); // removeOnHit was removed as it's handled in handleCloseWinningBanner directly

    const handleCloseWinningBanner = useCallback(() => {
        setShowWinningBanner(false);
        if (removeOnHit && winningItem) {
            // Remove the specific winning item instance by its unique ID
            setItems(prevItems => prevItems.filter(item => item.id !== winningItem.id));
            // Note: The winningItem state itself is not cleared here,
            // it will be cleared on the next spin or if its group is removed.
            // This allows the name to potentially still be referenced until then.
        }
    }, [removeOnHit, winningItem]);

    // Shuffle Logic
    const handleQuickShuffle = useCallback(async () => {
        if (isDisplaySpinning || isShuffleSequenceAnimating || !items || items.length < 2) return;

        setIsDisplaySpinning(true); // Block other interactions
        setIsShuffleSequenceAnimating(true);

        const itemsCopy = [...items];
        PRNG.shuffleArray(itemsCopy); // Mutates itemsCopy
        setItems(itemsCopy); // Update state with shuffled items

        setShuffleAnimationSeed(s => s + 1); // Trigger animation in WheelCanvas

        // Wait for animation to roughly complete before re-enabling controls
        await new Promise(resolve => setTimeout(resolve, SHUFFLE_TICK_ORCHESTRATION_DELAY + 50)); // A bit longer than canvas animation

        setIsShuffleSequenceAnimating(false);
        setIsDisplaySpinning(false); // Re-enable
    }, [items, isDisplaySpinning, isShuffleSequenceAnimating]);

    const handleShuffleNTimes = useCallback(async () => {
        if (isDisplaySpinning || isShuffleSequenceAnimating || !items || items.length < 2) return;

        setIsDisplaySpinning(true); // Block other interactions
        setIsShuffleSequenceAnimating(true);

        let count = parseInt(shuffleCountInput, 10);
        if (isNaN(count) || count < 1) {
            count = 1;
            setShuffleCountInput('1'); // Correct the input display
        }

        let itemsToShuffleInLoop = [...items];
        for (let i = 0; i < count; i++) {
            PRNG.shuffleArray(itemsToShuffleInLoop); // Mutate the copy
            if (i < count - 1) { // For all but the last shuffle, update state for visual feedback
                setItems([...itemsToShuffleInLoop]); // Create new array reference to trigger re-render if needed by other components
                setShuffleAnimationSeed(s => s + 1); // Trigger animation for this step
                await new Promise(resolve => setTimeout(resolve, SHUFFLE_TICK_ORCHESTRATION_DELAY));
            }
        }
        setItems([...itemsToShuffleInLoop]); // Set final shuffled state
        setShuffleAnimationSeed(s => s + 1); // Trigger final animation tick

        await new Promise(resolve => setTimeout(resolve, SHUFFLE_TICK_ORCHESTRATION_DELAY + 50)); // Wait for final animation

        setIsShuffleSequenceAnimating(false);
        setIsDisplaySpinning(false); // Re-enable
    }, [items, isDisplaySpinning, isShuffleSequenceAnimating, shuffleCountInput]);

    // UI Control & Computed Values
    const visualWheelScale = isItemPanelOpen ? WHEEL_SCALE_WHEN_PANEL_OPEN : 1;
    const wheelTranslateX = isItemPanelOpen ? -WHEEL_SECTION_TRANSLATE_X_OFFSET : 0;

    const toggleItemPanel = () => {
        // Prevent panel toggle if wheel is busy
        if (isDisplaySpinning || isShuffleSequenceAnimating) return;
        setIsItemPanelOpen(prev => !prev);
    };

    const overallIsBusy = isDisplaySpinning || isShuffleSequenceAnimating;


    return (
        <div className="w-full flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 space-y-8 min-h-screen relative overflow-x-hidden bg-slate-850">
            <button
                onClick={toggleItemPanel}
                disabled={overallIsBusy}
                className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-[75] p-3 text-white rounded-full shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-100 ${overallIsBusy ? 'opacity-50 cursor-not-allowed' : ''} ${isItemPanelOpen ? 'bg-red-600 hover:bg-red-700 rotate-[360deg]' : 'bg-sky-600 hover:bg-sky-700'}`}
                aria-label={isItemPanelOpen ? "Close wheel configuration panel" : "Open wheel configuration panel"}
                aria-expanded={isItemPanelOpen}
                aria-controls="slide-out-panel-content" // Assuming SlideOutPanel has this id
            >
                {isItemPanelOpen ? <IconClosePanel className="w-6 h-6"/> : <IconSettings className="w-6 h-6"/>}
            </button>

            {winningItem && showWinningBanner && (
                <Modal
                    isOpen={showWinningBanner}
                    onClose={handleCloseWinningBanner}
                    title="Congratulations!"
                    size="md"
                    panelClassName="bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 text-white border-pink-500 shadow-2xl animate-[spin-celebrate_0.5s_ease-out]"
                    footerContent={
                        <button
                            onClick={handleCloseWinningBanner}
                            className="w-full sm:w-auto mt-2 sm:mt-0 bg-white/25 hover:bg-white/35 text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                        >
                            Acknowledge & Continue
                        </button>
                    }
                >
                    <div className="text-center py-4">
                        <p className="text-3xl md:text-5xl font-bold">🎉 Winner! 🎉</p>
                        <p className="text-xl md:text-3xl mt-4">You won: <span className="font-extrabold tracking-wide text-yellow-300">{winningItem.name}</span></p>
                    </div>
                </Modal>
            )}

            <div className="w-full mx-auto flex flex-col items-center justify-center flex-grow relative">
                <section
                    className="flex flex-col items-center space-y-4 transition-transform duration-300 ease-in-out w-full h-full flex-grow justify-center"
                    style={{ transform: `translateX(${wheelTranslateX}px)` }}
                >
                    <div
                        ref={wheelAreaRef}
                        className="bg-slate-800 p-3 sm:p-4 rounded-xl shadow-2xl flex items-center justify-center w-full max-w-[90vw] sm:max-w-[80vw] md:max-w-[70vw] lg:max-w-[60vw] xl:max-w-[800px] h-auto aspect-square relative"
                    >
                        <div
                            className="relative origin-center transition-transform duration-300 ease-in-out"
                            style={{ width: `${canvasDimensions.width}px`, height: `${canvasDimensions.height}px`, transform: `scale(${visualWheelScale})`}}
                        >
                            <WheelCanvas
                                ref={wheelCanvasRef}
                                items={items}
                                pointerPosition={pointerPosition}
                                onSpinStart={handleSpinStart}
                                onSpinEnd={handleSpinEnd}
                                onWheelClick={handleSpinTrigger}
                                width={canvasDimensions.width}
                                height={canvasDimensions.height}
                                shuffleAnimationTrigger={shuffleAnimationSeed}
                                // Pass other relevant props like minSpins, spinDuration if they become dynamic
                            />
                            {items.length === 0 && !overallIsBusy && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/90 backdrop-blur-sm rounded-full pointer-events-none p-5">
                                    <IconWheelOutlineDisplay />
                                    <p className="text-lg font-medium text-slate-300 mt-3 text-center">Your wheel is empty!</p>
                                    <p className="text-sm text-slate-400 text-center">Use the settings panel to add items.</p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleQuickShuffle}
                            disabled={overallIsBusy || items.length < 2}
                            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-2.5 bg-slate-700/80 hover:bg-slate-600/90 text-slate-100 rounded-full shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 transition-all duration-150 ease-in-out hover:scale-110 active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            aria-label="Quick shuffle wheel items"
                            title="Shuffle Items (Once)"
                        >
                            <IconShuffle className="w-5 h-5" />
                        </button>
                    </div>
                </section>
            </div>

            <SlideOutPanel
                isOpen={isItemPanelOpen}
                onClose={toggleItemPanel}
                position="right"
                title="Wheel Configuration"
                widthClass="w-full sm:w-[420px] md:w-[480px]"
                // id="slide-out-panel-content" // For aria-controls if needed
            >
                <SettingsPanelContent
                    isDisplaySpinning={overallIsBusy} // Pass combined busy state
                    currentPointerPosition={pointerPosition}
                    onDirectPointerPositionChange={handleDirectPointerPositionChange}
                    removeOnHit={removeOnHit}
                    onRemoveOnHitChange={() => setRemoveOnHit(prev => !prev)}
                    shuffleCountInput={shuffleCountInput}
                    onShuffleCountInputChange={(e) => setShuffleCountInput(e.target.value)}
                    onShuffleNTimes={handleShuffleNTimes}
                    itemsCount={items.length}
                    onAddItem={handleAddItem}
                    currentItems={items}
                    onRemoveItemGroup={handleRemoveItemGroup}
                    onIncrementItemGroupQuantity={handleIncrementItemGroupQuantity}
                    onDecrementItemGroupQuantity={handleDecrementItemGroupQuantity}
                />
            </SlideOutPanel>

            {/* Debug Bar - Conditionally rendered based on Vite's DEV mode */}
            {import.meta.env.DEV && (
                <div className="fixed bottom-0 left-0 right-0 p-2 bg-slate-900/90 backdrop-blur-sm text-xs text-slate-400 text-center z-[100] flex flex-wrap justify-center items-center gap-x-4 gap-y-1">
                    <span>Panel: {isItemPanelOpen.toString()}</span>
                    <span>Spinning: {isDisplaySpinning.toString()}</span>
                    <span>ShuffleSeq: {isShuffleSequenceAnimating.toString()}</span>
                    <span>Items: {items.length}</span>
                    <span>Winner: {winningItem ? winningItem.name.substring(0,10).concat(winningItem.name.length > 10 ? '...' : '') :'N/A'}</span>
                </div>
            )}
        </div>
    );
};

export default WheelDisplay;
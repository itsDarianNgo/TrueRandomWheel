// src/features/layout/WheelPage.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

// Redux Slices & Actions
import {selectAllItems, setItems} from '../items/itemSlice'; // Assuming moved to ../items/
import { removeItemInstance } from '../items/itemSlice';
import {
    selectWheelSettings,
    selectWheelStatus,
    selectWinningItemDetails,
    selectDisplayWinningBanner,
    selectTargetWinningItem, // For passing to WheelCanvas
    setWheelStatus,
    setWinningItemDetails,
    clearWinningItemDetails,
    setDisplayWinningBanner, setTargetWinningItem,
    // Thunks will be imported in Phase 2 (e.g., spinWheelThunk, performShuffleThunk)
} from '../wheel/wheelSlice'; // Assuming moved to ../wheel/
import { addHistoryEntry } from '../history/historySlice'; // Assuming moved to ../history/

// Components
import WheelCanvas from '../wheel/WheelCanvas'; // Will become WheelCanvasContainer in Phase 2
import SlideOutPanel from '../../components/common/SlideOutPanel'; // Assuming moved
import SettingsPanelContent from '../wheel/SettingsPanelContent'; // Stays in wheel or moves to ui/layout
import Modal from '../../components/common/Modal'; // Assuming moved
import PRNG from '../../core/prng/PRNGModule';


// Icons (Consider moving to a dedicated icons file/folder)
const IconSettings = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const IconClosePanel = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
const IconWheelOutlineDisplay = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M3 12H0M12 12l5.25 5.25M12 12l-5.25 5.25M12 12l5.25-5.25M12 12l-5.25-5.25" /></svg>);
const IconShuffle = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /> </svg>);

const SHUFFLE_TICK_ORCHESTRATION_DELAY = 270; // For non-thunk based shuffle animation delay

const WheelPage = () => {
    const dispatch = useDispatch();

    // Selectors for data from Redux store
    const items = useSelector(selectAllItems);
    const wheelSettings = useSelector(selectWheelSettings);
    const wheelStatus = useSelector(selectWheelStatus);
    const winningItemDetails = useSelector(selectWinningItemDetails);
    const displayWinningBanner = useSelector(selectDisplayWinningBanner);
    const targetWinningItemFromStore = useSelector(selectTargetWinningItem); // For WheelCanvas spin target

    // Local UI state (not suitable for Redux or very specific to this page orchestrator)
    const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
    const [canvasDimensions, setCanvasDimensions] = useState({ width: 520, height: 520 });

    // Refs
    const wheelAreaRef = useRef(null);
    const wheelCanvasRef = useRef(null); // To call .spinToTarget() or .triggerShuffleAnim()

    // Panel animation constants from old WheelDisplay
    const PANEL_WIDTH_PX = 480;
    const WHEEL_SECTION_TRANSLATE_X_OFFSET = PANEL_WIDTH_PX / 2.5;
    const WHEEL_SCALE_WHEN_PANEL_OPEN = 0.75;

    const overallIsBusy = wheelStatus !== 'idle';

    // Canvas resizing effect (same as old WheelDisplay)
    useEffect(() => { /* ... same canvas resize observer logic ... */ const wheelElement = wheelAreaRef.current; if (!wheelElement) return; const resizeObserver = new ResizeObserver(entries => { for (let entry of entries) { const { width, height } = entry.contentRect; const size = Math.min(width, height); if (size > 0 && (Math.abs(canvasDimensions.width - size) > 1 || Math.abs(canvasDimensions.height - size) > 1)) { setCanvasDimensions({ width: size, height: size }); } } }); resizeObserver.observe(wheelElement); return () => resizeObserver.unobserve(wheelElement); }, [canvasDimensions.width, canvasDimensions.height]);


    // Event Handlers (will dispatch actions or thunks)

    const handleCanvasSpinTrigger = useCallback(() => {
        if (items.length === 0 || overallIsBusy) return;

        // Phase 1: Simplified spin logic (Thunk will handle this in Phase 2)
        dispatch(setWheelStatus('preparing_spin'));
        const prngMax = BigInt(items.length);
        if (prngMax <= 0n) {
            console.error("No items to spin.");
            dispatch(setWheelStatus('idle'));
            return;
        }
        const winningIndex = Number(PRNG.nextRandomIntInRange(prngMax));
        const determinedWinner = items[winningIndex];

        if (!determinedWinner) {
            console.error("PRNG failed to select a winner.");
            dispatch(setWheelStatus('idle'));
            return;
        }
        dispatch(setTargetWinningItem(determinedWinner)); // Canvas will spin to this
        dispatch(setWheelStatus('spinning'));
        // In Phase 1, WheelCanvas might need to receive targetWinningItem and wheelStatus
        // and initiate its own spin animation.
        // Or, we call a method on wheelCanvasRef.current.spinToTarget(determinedWinner)
        if (wheelCanvasRef.current?.spinToTarget) { // Assuming WheelCanvas exposes this
            wheelCanvasRef.current.spinToTarget(determinedWinner, wheelSettings.minSpins, wheelSettings.spinDuration);
        } else if (wheelCanvasRef.current?.spin) { // Fallback to old spin if new method not ready
            console.warn("WheelCanvas.spinToTarget not available, using generic spin. Accuracy may vary.");
            wheelCanvasRef.current.spin(); // This spin uses its internal PRNG; not ideal for Redux controlled winner
        }


    }, [items, overallIsBusy, dispatch, wheelSettings.minSpins, wheelSettings.spinDuration]);

    const handleCanvasSpinStart = useCallback((_targetItem) => {
        // This callback from WheelCanvas indicates its animation has started.
        // The status 'spinning' should already be set by handleCanvasSpinTrigger.
        // No Redux dispatch needed here unless to confirm canvas ack.
        dispatch(clearWinningItemDetails()); // Clear any previous winner details
    }, [dispatch]);

    const handleCanvasSpinEnd = useCallback((actualLandedItem, errorInfo) => {
        // This callback from WheelCanvas indicates its animation has ended.
        // actualLandedItem should match what was set in targetWinningItemFromStore.
        if (errorInfo) {
            console.error("Spin Error from WheelCanvas:", errorInfo.error);
            dispatch(setWheelStatus('idle'));
            dispatch(clearWinningItemDetails());
            return;
        }

        if (actualLandedItem) { // This is the item the canvas visually landed on
            dispatch(setWinningItemDetails(actualLandedItem)); // Store the actual winner
            dispatch(addHistoryEntry({ name: actualLandedItem.name, color: actualLandedItem.color }));
            dispatch(setDisplayWinningBanner(true));
            dispatch(setWheelStatus('prize_landing')); // Or 'idle' if no banner and immediate next
        } else {
            dispatch(setWheelStatus('idle')); // Should not happen if no error
        }
    }, [dispatch]);

    const handleCloseWinningBanner = useCallback(() => {
        dispatch(setDisplayWinningBanner(false));
        const remove = wheelSettings.removeOnHit; // Get from Redux store
        if (remove && winningItemDetails) { // winningItemDetails from Redux store
            dispatch(removeItemInstance(winningItemDetails.id));
        }
        dispatch(setWheelStatus('idle')); // Wheel is ready for next action
        // dispatch(clearWinningItemDetails()); // Clear here or on next spin_start
    }, [dispatch, wheelSettings.removeOnHit, winningItemDetails]);


    // Phase 1 Shuffle Logic (Simplified, direct state manipulation, Thunk in Phase 2)
    const handleQuickShuffle_Phase1 = async () => {
        if (overallIsBusy || items.length < 2) return;
        dispatch(setWheelStatus('shuffle_animating')); // Indicate busy

        const itemsCopy = [...items];
        PRNG.shuffleArray(itemsCopy);
        dispatch(setItems(itemsCopy)); // Dispatch action from itemSlice

        // Simulate shuffle animation trigger for WheelCanvas if it expects one
        if(wheelCanvasRef.current?.triggerShuffleAnim) {
            wheelCanvasRef.current.triggerShuffleAnim();
        }

        await new Promise(resolve => setTimeout(resolve, SHUFFLE_TICK_ORCHESTRATION_DELAY + 50));
        dispatch(setWheelStatus('idle'));
    };

    const handleShuffleNTimes_Phase1 = async () => {
        if (overallIsBusy || items.length < 2) return;
        dispatch(setWheelStatus('shuffle_animating'));

        let count = wheelSettings.shuffleCount; // Get from Redux
        let itemsToShuffle = [...items];

        for (let i = 0; i < count; i++) {
            PRNG.shuffleArray(itemsToShuffle);
            dispatch(setItems([...itemsToShuffle])); // Update store for each shuffle
            if(wheelCanvasRef.current?.triggerShuffleAnim) {
                wheelCanvasRef.current.triggerShuffleAnim();
            }
            if (i < count - 1) {
                await new Promise(resolve => setTimeout(resolve, SHUFFLE_TICK_ORCHESTRATION_DELAY));
            }
        }
        await new Promise(resolve => setTimeout(resolve, SHUFFLE_TICK_ORCHESTRATION_DELAY + 50));
        dispatch(setWheelStatus('idle'));
    };

    const visualWheelScale = isSettingsPanelOpen ? WHEEL_SCALE_WHEN_PANEL_OPEN : 1;
    const wheelTranslateXVal = isSettingsPanelOpen ? -WHEEL_SECTION_TRANSLATE_X_OFFSET : 0;

    const toggleSettingsPanel = () => {
        if (overallIsBusy) return;
        setIsSettingsPanelOpen(prev => !prev);
    };

    return (
        <div className="w-full flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 space-y-8 min-h-screen relative overflow-x-hidden bg-slate-850">
            <button
                onClick={toggleSettingsPanel}
                disabled={overallIsBusy}
                className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-[75] p-3 text-white rounded-full shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-100 ${overallIsBusy ? 'opacity-50 cursor-not-allowed' : ''} ${isSettingsPanelOpen ? 'bg-red-600 hover:bg-red-700 rotate-[360deg]' : 'bg-sky-600 hover:bg-sky-700'}`}
                aria-label={isSettingsPanelOpen ? "Close wheel configuration panel" : "Open wheel configuration panel"}
                aria-expanded={isSettingsPanelOpen}
            >
                {isSettingsPanelOpen ? <IconClosePanel className="w-6 h-6"/> : <IconSettings className="w-6 h-6"/>}
            </button>

            {winningItemDetails && displayWinningBanner && (
                <Modal
                    isOpen={displayWinningBanner}
                    onClose={handleCloseWinningBanner}
                    title="Congratulations!"
                    size="md"
                    panelClassName="bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 text-white border-pink-500 shadow-2xl animate-[spin-celebrate_0.5s_ease-out]"
                    footerContent={ <button onClick={handleCloseWinningBanner} className="w-full sm:w-auto mt-2 sm:mt-0 bg-white/25 hover:bg-white/35 text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70">Acknowledge & Continue</button> }
                >
                    <div className="text-center py-4">
                        <p className="text-3xl md:text-5xl font-bold">🎉 Winner! 🎉</p>
                        <p className="text-xl md:text-3xl mt-4">You won: <span className="font-extrabold tracking-wide text-yellow-300">{winningItemDetails.name}</span></p>
                    </div>
                </Modal>
            )}

            <div className="w-full mx-auto flex flex-col items-center justify-center flex-grow relative">
                <section
                    className="flex flex-col items-center space-y-4 transition-transform duration-300 ease-in-out w-full h-full flex-grow justify-center"
                    style={{ transform: `translateX(${wheelTranslateXVal}px)` }}
                >
                    <div ref={wheelAreaRef} className="bg-slate-800 p-3 sm:p-4 rounded-xl shadow-2xl flex items-center justify-center w-full max-w-[90vw] sm:max-w-[80vw] md:max-w-[70vw] lg:max-w-[60vw] xl:max-w-[800px] h-auto aspect-square relative">
                        <div className="relative origin-center transition-transform duration-300 ease-in-out" style={{ width: `${canvasDimensions.width}px`, height: `${canvasDimensions.height}px`, transform: `scale(${visualWheelScale})`}}>
                            <WheelCanvas
                                ref={wheelCanvasRef}
                                items={items} // From Redux
                                pointerPosition={wheelSettings.pointerPosition} // From Redux
                                onSpinStart={handleCanvasSpinStart} // Connected to local handler
                                onSpinEnd={handleCanvasSpinEnd}     // Connected to local handler
                                onWheelClick={handleCanvasSpinTrigger} // Connected to local handler
                                width={canvasDimensions.width}
                                height={canvasDimensions.height}
                                // For Phase 1, WheelCanvas might need to adapt to spin to a target item
                                // OR we assume it uses its internal PRNG for now if spinToTarget isn't ready
                                // For shuffle animation, if WheelCanvas still uses shuffleAnimationTrigger:
                                // shuffleAnimationTrigger={some_local_seed_or_prop_from_redux_if_needed}
                                // For simplification, this is omitted; shuffle happens by items prop changing.
                                wheelStatus={wheelStatus} // Pass current wheel status for canvas to react
                                targetWinningItem={targetWinningItemFromStore} // Pass the target for spin animation
                                minSpins={wheelSettings.minSpins}
                                spinDuration={wheelSettings.spinDuration}
                            />
                            {items.length === 0 && !overallIsBusy && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/90 backdrop-blur-sm rounded-full pointer-events-none p-5">
                                    <IconWheelOutlineDisplay />
                                    <p className="text-lg font-medium text-slate-300 mt-3 text-center">Your wheel is empty!</p>
                                    <p className="text-sm text-slate-400 text-center">Use the settings panel to add items.</p>
                                </div>
                            )}
                        </div>
                        <button onClick={handleQuickShuffle_Phase1} disabled={overallIsBusy || items.length < 2}
                                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-2.5 bg-slate-700/80 hover:bg-slate-600/90 text-slate-100 rounded-full shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 transition-all duration-150 ease-in-out hover:scale-110 active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                aria-label="Quick shuffle wheel items" title="Shuffle Items (Once)">
                            <IconShuffle className="w-5 h-5" />
                        </button>
                    </div>
                </section>
            </div>

            <SlideOutPanel
                isOpen={isSettingsPanelOpen}
                onClose={toggleSettingsPanel}
                position="right"
                title="Wheel Configuration"
                widthClass="w-full sm:w-[420px] md:w-[480px]"
            >
                {/* For Phase 1, SettingsPanelContent still needs onShuffleNTimes prop if not using thunk yet */}
                <SettingsPanelContent onShuffleNTimes={handleShuffleNTimes_Phase1} />
            </SlideOutPanel>

            {import.meta.env.DEV && ( /* Debug Bar */
                <div className="fixed bottom-0 left-0 right-0 p-2 bg-slate-900/90 backdrop-blur-sm text-xs text-slate-400 text-center z-[100] flex flex-wrap justify-center items-center gap-x-4 gap-y-1">
                    <span>Panel: {isSettingsPanelOpen.toString()}</span>
                    <span>Status: {wheelStatus}</span>
                    <span>Items: {items.length}</span>
                    <span>Winner: {winningItemDetails ? winningItemDetails.name.substring(0,10).concat(winningItemDetails.name.length > 10 ? '...' : '') :'N/A'}</span>
                    <span>Target: {targetWinningItemFromStore ? targetWinningItemFromStore.name.substring(0,10) : 'N/A'}</span>
                </div>
            )}
        </div>
    );
};
export default WheelPage;
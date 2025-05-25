// src/features/wheel/WheelDisplay.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import WheelCanvas from './WheelCanvas';
import SlideOutPanel from '../../components/SlideOutPanel';
import SettingsPanelContent from './SettingsPanelContent'; // This component needs the missing props
import PRNG from '../../core/prng/PRNGModule';
import Modal from '../../components/Modal';
import { addHistoryEntry } from '../history/historySlice';
import { selectWheelBackgroundImageURL } from '../settings/settingsSlice';

// SVG Icon Components
const IconSettings = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const IconClosePanel = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
const IconWheelOutlineDisplay = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M3 12H0M12 12l5.25 5.25M12 12l-5.25 5.25M12 12l5.25-5.25M12 12l-5.25-5.25" /></svg>);
const IconShuffle = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /> </svg>);

const SHUFFLE_TICK_ORCHESTRATION_DELAY = 270;

const WheelDisplay = () => {
    const [items, setItems] = useState([]);
    const [isDisplaySpinning, setIsDisplaySpinning] = useState(false);
    const [winningItem, setWinningItem] = useState(null);
    const [showWinningBanner, setShowWinningBanner] = useState(false);
    const [isItemPanelOpen, setIsItemPanelOpen] = useState(false);
    const [isShuffleSequenceAnimating, setIsShuffleSequenceAnimating] = useState(false);

    const wheelAreaRef = useRef(null);
    const [canvasDimensions, setCanvasDimensions] = useState({ width: 520, height: 520 });
    const wheelCanvasRef = useRef(null);

    const dispatch = useDispatch();
    const wheelBackgroundImageURL = useSelector(selectWheelBackgroundImageURL);

    const [pointerPosition, setPointerPosition] = useState('top');
    const [removeOnHit, setRemoveOnHit] = useState(false);
    const [shuffleCountInput, setShuffleCountInput] = useState('3');
    const [shuffleAnimationSeed, setShuffleAnimationSeed] = useState(0);

    const PANEL_WIDTH_PX = 480;
    const WHEEL_SECTION_TRANSLATE_X_OFFSET = PANEL_WIDTH_PX / 2.5;
    const WHEEL_SCALE_WHEN_PANEL_OPEN = 0.75;

    useEffect(() => {
        const wheelElement = wheelAreaRef.current;
        if (!wheelElement) return;
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                const size = Math.min(width, height);
                if (size > 0 && (Math.abs(canvasDimensions.width - size) > 1 || Math.abs(canvasDimensions.height - size) > 1)) {
                    setCanvasDimensions({ width: size, height: size });
                }
            }
        });
        resizeObserver.observe(wheelElement);
        return () => { if (wheelElement) { resizeObserver.unobserve(wheelElement); }};
    }, [canvasDimensions.width, canvasDimensions.height]);

    const handleAddItem = useCallback((newItemData) => {
        const sourceGroupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newIndividualItems = Array.from({ length: newItemData.quantity }, (_, i) => ({
            id: `item-${sourceGroupId}-${i}`,
            name: newItemData.name,
            color: newItemData.color || undefined,
            sourceGroup: sourceGroupId,
        }));
        setItems(prevItems => [...prevItems, ...newIndividualItems]);
    }, []);

    const handleRemoveItemGroup = useCallback((sourceGroupIdToRemove) => {
        setItems(prevItems => prevItems.filter(item => item.sourceGroup !== sourceGroupIdToRemove));
        if (winningItem && winningItem.sourceGroup === sourceGroupIdToRemove) {
            setWinningItem(null);
            setShowWinningBanner(false);
        }
    }, [winningItem]);

    // DEFINITION of handleIncrementItemGroupQuantity
    const handleIncrementItemGroupQuantity = useCallback((sourceGroupIdToIncrement) => {
        setItems(prevItems => {
            const itemToClone = prevItems.find(item => item.sourceGroup === sourceGroupIdToIncrement);
            if (itemToClone) {
                const newItemInstance = {
                    ...itemToClone,
                    id: `item-${sourceGroupIdToIncrement}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                };
                return [...prevItems, newItemInstance];
            }
            return prevItems;
        });
    }, []); // Dependency array is empty, setItems is stable.

    // DEFINITION of handleDecrementItemGroupQuantity
    const handleDecrementItemGroupQuantity = useCallback((sourceGroupIdToDecrement) => {
        setItems(prevItems => {
            const firstItemIndexInGroup = prevItems.findIndex(item => item.sourceGroup === sourceGroupIdToDecrement);
            if (firstItemIndexInGroup !== -1) {
                const newItems = [...prevItems];
                const removedItem = newItems.splice(firstItemIndexInGroup, 1)[0];
                if (winningItem && winningItem.id === removedItem.id) {
                    setWinningItem(null);
                    setShowWinningBanner(false);
                }
                return newItems;
            }
            return prevItems;
        });
    }, [winningItem]); // Depends on winningItem

    const overallIsBusy = isDisplaySpinning || isShuffleSequenceAnimating;

    const handleSpinTrigger = useCallback(() => {
        if (items.length === 0 || overallIsBusy) return;
        if (wheelCanvasRef.current?.spin) {
            wheelCanvasRef.current.spin();
        }
    }, [items.length, overallIsBusy]);

    const handleDirectPointerPositionChange = useCallback((newPosition) => {
        if (overallIsBusy) return;
        setPointerPosition(newPosition);
    }, [overallIsBusy]);

    const handleSpinStart = useCallback((_selectedItemByPRNG) => {
        setIsDisplaySpinning(true);
        setWinningItem(null);
        setShowWinningBanner(false);
    }, []);

    const handleSpinEnd = useCallback((finalWinningItem, errorInfo) => {
        setIsDisplaySpinning(false);
        setIsShuffleSequenceAnimating(false);
        if (errorInfo) {
            setWinningItem(null);
            setShowWinningBanner(false);
            console.error("Spin Error from WheelCanvas:", errorInfo.error);
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
            setWinningItem(null);
            setShowWinningBanner(false);
        }
    }, [dispatch]);

    const handleCloseWinningBanner = useCallback(() => {
        setShowWinningBanner(false);
        if (removeOnHit && winningItem) {
            setItems(prevItems => prevItems.filter(item => item.id !== winningItem.id));
        }
    }, [removeOnHit, winningItem]);

    const handleQuickShuffle = useCallback(async () => {
        if (overallIsBusy || !items || items.length < 2) return;
        setIsShuffleSequenceAnimating(true);
        const itemsCopy = [...items];
        PRNG.shuffleArray(itemsCopy);
        setItems(itemsCopy);
        setShuffleAnimationSeed(s => s + 1);
        await new Promise(resolve => setTimeout(resolve, SHUFFLE_TICK_ORCHESTRATION_DELAY + 50));
        setIsShuffleSequenceAnimating(false);
    }, [items, overallIsBusy]);

    const handleShuffleNTimes = useCallback(async () => {
        if (overallIsBusy || !items || items.length < 2) return;
        setIsShuffleSequenceAnimating(true);
        let count = parseInt(shuffleCountInput, 10);
        if (isNaN(count) || count < 1) {
            count = 1;
            setShuffleCountInput('1');
        }
        let itemsToShuffleInLoop = [...items];
        for (let i = 0; i < count; i++) {
            PRNG.shuffleArray(itemsToShuffleInLoop);
            if (i < count - 1) {
                setItems([...itemsToShuffleInLoop]);
                setShuffleAnimationSeed(s => s + 1);
                await new Promise(resolve => setTimeout(resolve, SHUFFLE_TICK_ORCHESTRATION_DELAY));
            }
        }
        setItems([...itemsToShuffleInLoop]);
        setShuffleAnimationSeed(s => s + 1);
        await new Promise(resolve => setTimeout(resolve, SHUFFLE_TICK_ORCHESTRATION_DELAY + 50));
        setIsShuffleSequenceAnimating(false);
    }, [items, overallIsBusy, shuffleCountInput]);

    const visualWheelScale = isItemPanelOpen ? WHEEL_SCALE_WHEN_PANEL_OPEN : 1;
    const wheelTranslateX = isItemPanelOpen ? -WHEEL_SECTION_TRANSLATE_X_OFFSET : 0;

    const toggleItemPanel = () => {
        if (overallIsBusy) return;
        setIsItemPanelOpen(prev => !prev);
    };

    return (
        <div className="w-full flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 space-y-8 min-h-screen relative overflow-x-hidden bg-slate-850">
            <button
                onClick={toggleItemPanel}
                disabled={overallIsBusy}
                className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-[75] p-3 text-white rounded-full shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-100 ${overallIsBusy ? 'opacity-50 cursor-not-allowed' : ''} ${isItemPanelOpen ? 'bg-red-600 hover:bg-red-700 rotate-[360deg]' : 'bg-sky-600 hover:bg-sky-700'}`}
                aria-label={isItemPanelOpen ? "Close wheel configuration panel" : "Open wheel configuration panel"}
                aria-expanded={isItemPanelOpen}
                aria-controls="slide-out-panel-content"
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
                        className="bg-slate-800 p-3 sm:p-4 rounded-xl shadow-2xl flex items-center justify-center w-full max-w-[90vw] sm:max-w-[80vw] md:max-w-[70vw] lg:max-w-[60vw] xl:max-w-[800px] h-auto aspect-square relative overflow-hidden"
                    >
                        <div
                            className="relative origin-center transition-transform duration-300 ease-in-out bg-no-repeat bg-center bg-cover"
                            style={{
                                width: `${canvasDimensions.width}px`,
                                height: `${canvasDimensions.height}px`,
                                transform: `scale(${visualWheelScale})`,
                                backgroundImage: wheelBackgroundImageURL ? `url(${wheelBackgroundImageURL})` : 'none',
                            }}
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
                id="slide-out-panel-content"
            >
                {/* This is approximately line 348 or where the error was originating from */}
                <SettingsPanelContent
                    isDisplaySpinning={overallIsBusy}
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
                    // ***** THE CRITICAL FIX - ENSURING THESE PROPS ARE PASSED *****
                    onIncrementItemGroupQuantity={handleIncrementItemGroupQuantity}
                    onDecrementItemGroupQuantity={handleDecrementItemGroupQuantity}
                />
            </SlideOutPanel>

            {import.meta.env.DEV && (
                <div className="fixed bottom-0 left-0 right-0 p-2 bg-slate-900/90 backdrop-blur-sm text-xs text-slate-400 text-center z-[100] flex flex-wrap justify-center items-center gap-x-4 gap-y-1">
                    <span>Panel: {isItemPanelOpen.toString()}</span>
                    <span>Spinning: {isDisplaySpinning.toString()}</span>
                    <span>ShuffleAnim: {isShuffleSequenceAnimating.toString()}</span>
                    <span>Items: {items.length}</span>
                    <span>Winner: {winningItem ? winningItem.name.substring(0,10).concat(winningItem.name.length > 10 ? '...' : '') :'N/A'}</span>
                </div>
            )}
        </div>
    );
};

export default WheelDisplay;
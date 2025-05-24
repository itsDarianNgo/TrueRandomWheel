// src/features/wheel/WheelDisplay.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import WheelCanvas from './WheelCanvas';
import SlideOutPanel from '../../components/SlideOutPanel';
import SettingsPanelContent from './SettingsPanelContent';
import PRNG from '../../core/prng/PRNGModule';
import Modal from '../../components/Modal';

// All Icon components (Settings, ClosePanel, WheelOutline, Shuffle, Info) as in Response #66
const IconSettings = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const IconClosePanel = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
const IconWheelOutlineDisplay = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M3 12H0M12 12l5.25 5.25M12 12l-5.25 5.25M12 12l5.25-5.25M12 12l-5.25-5.25" /></svg>);
const IconShuffle = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /> </svg>);


const WheelDisplay = () => {
    const [items, setItems] = useState([]);
    const [pointerPosition, setPointerPosition] = useState('top'); // Kept for SettingsPanelContent
    const [isDisplaySpinning, setIsDisplaySpinning] = useState(false);
    const [winningItem, setWinningItem] = useState(null);
    const [showWinningBanner, setShowWinningBanner] = useState(false);
    const [isItemPanelOpen, setIsItemPanelOpen] = useState(false);
    const [removeOnHit, setRemoveOnHit] = useState(false);
    const [shuffleCountInput, setShuffleCountInput] = useState('3');

    const wheelAreaRef = useRef(null);
    const [canvasDimensions, setCanvasDimensions] = useState({ width: 520, height: 520 });
    const wheelCanvasRef = useRef(null);

    console.log("WheelDisplay rendered. Items count:", items.length, "isSpinning:", isDisplaySpinning); // DEBUG

    const PANEL_WIDTH_PX = 480;
    const WHEEL_SECTION_TRANSLATE_X_OFFSET = PANEL_WIDTH_PX / 2.5;
    const WHEEL_SCALE_WHEN_PANEL_OPEN = 0.75;

    useEffect(() => { const el = wheelAreaRef.current; if(!el) return; const ro = new ResizeObserver(([e]) => { const {width,height} = e.contentRect; const s=Math.min(width,height); if(s>0 && (Math.abs(canvasDimensions.width-s)>1 || Math.abs(canvasDimensions.height-s)>1)) setCanvasDimensions({width:s,height:s}); }); ro.observe(el); return () => ro.unobserve(el); }, [canvasDimensions.width, canvasDimensions.height]);

    const handleAddItem = useCallback((newItemData) => {
        const sourceGroupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newSegments = Array.from({ length: newItemData.quantity }, (_, i) => ({ id: `segment-${sourceGroupId}-${i}`, name: newItemData.name, color: newItemData.color || undefined, sourceGroup: sourceGroupId }));
        setItems(prevItems => {
            const updatedItems = [...prevItems, ...newSegments];
            console.log("handleAddItem: items updated, new count:", updatedItems.length); // DEBUG
            return updatedItems;
        });
    }, []); // This empty dependency array is INTENTIONAL for setItems(updaterFn) pattern

    const handleRemoveItemGroup = useCallback((sourceGroupIdToRemove) => { setItems(prevItems => prevItems.filter(item => item.sourceGroup !== sourceGroupIdToRemove)); if (winningItem && winningItem.sourceGroup === sourceGroupIdToRemove) setWinningItem(null); }, [winningItem]);
    const handleIncrementItemGroupQuantity = useCallback((sourceGroupId) => { setItems(prevItems => { const itemToClone = prevItems.find(item => item.sourceGroup === sourceGroupId); if (itemToClone) { const newItemSegment = { ...itemToClone, id: `segment-${sourceGroupId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` }; return [...prevItems, newItemSegment]; } return prevItems; }); }, []);
    const handleDecrementItemGroupQuantity = useCallback((sourceGroupId) => { setItems(prevItems => { const itemIndexToRemove = prevItems.findIndex(item => item.sourceGroup === sourceGroupId); if (itemIndexToRemove !== -1) { const newItems = [...prevItems]; newItems.splice(itemIndexToRemove, 1); if (newItems.filter(i => i.sourceGroup === sourceGroupId).length === 0 && winningItem && winningItem.sourceGroup === sourceGroupId) { setWinningItem(null); } return newItems; } return prevItems; }); }, [winningItem]);

    const handleSpinTrigger = useCallback(() => { if (items.length === 0) { alert("Please add items to the wheel before spinning!"); return; } if (isDisplaySpinning) return; if (wheelCanvasRef.current?.spin) wheelCanvasRef.current.spin(); }, [items, isDisplaySpinning]);
    const handleDirectPointerPositionChange = useCallback((newPosition) => { if (isDisplaySpinning) return; setPointerPosition(newPosition); }, [isDisplaySpinning]);
    const handleSpinStart = useCallback((spunItem) => { setIsDisplaySpinning(true); setWinningItem(null); setShowWinningBanner(false); }, []);
    const handleSpinEnd = useCallback((spunItem, errorInfo) => { setIsDisplaySpinning(false); if (errorInfo) { setWinningItem(null); setShowWinningBanner(false); return; } if (spunItem) { setWinningItem(spunItem); setShowWinningBanner(true); } else { setWinningItem(null); setShowWinningBanner(false); } }, []);
    const handleCloseWinningBanner = useCallback(() => { setShowWinningBanner(false); if (removeOnHit && winningItem) { setItems(prevItems => prevItems.filter(item => item.id !== winningItem.id)); } }, [removeOnHit, winningItem]);

    // Corrected Shuffle Handlers (from Response #66)
    const handleQuickShuffle = useCallback(() => {
        console.log("handleQuickShuffle called. Current items length:", items.length, "isSpinning:", isDisplaySpinning); // DEBUG
        if (isDisplaySpinning || !items || items.length < 2) {
            console.warn("Quick Shuffle: Conditions not met.", {isDisplaySpinning, itemCount: items ? items.length : 'undefined'});
            return;
        }
        const itemsCopy = [...items];
        PRNG.shuffleArray(itemsCopy);
        setItems(itemsCopy);
        console.log("Quick Shuffle: setItems called with shuffled copy."); // DEBUG
    }, [items, isDisplaySpinning]); // CRITICAL: `items` MUST be in dependency array

    const handleShuffleNTimes = useCallback(() => {
        console.log("handleShuffleNTimes called. Current items length:", items.length, "isSpinning:", isDisplaySpinning, "shuffleCountInput:", shuffleCountInput); // DEBUG
        if (isDisplaySpinning || !items || items.length < 2) {
            console.warn("Shuffle N Times: Conditions not met.", {isDisplaySpinning, itemCount: items ? items.length : 'undefined'});
            return;
        }
        let count = parseInt(shuffleCountInput, 10);
        if (isNaN(count) || count < 1) {
            count = 1;
            setShuffleCountInput('1');
        }
        let newItemsState = [...items];
        for (let i = 0; i < count; i++) {
            PRNG.shuffleArray(newItemsState);
        }
        setItems(newItemsState);
        console.log(`Shuffle N Times: setItems called with ${count} shuffles.`); // DEBUG
    }, [items, isDisplaySpinning, shuffleCountInput]); // CRITICAL: `items` and `shuffleCountInput` MUST be in dependency array

    const canSpin = items.length > 0 && !isDisplaySpinning;
    const visualWheelScale = isItemPanelOpen ? WHEEL_SCALE_WHEN_PANEL_OPEN : 1;
    const wheelTranslateX = isItemPanelOpen ? -WHEEL_SECTION_TRANSLATE_X_OFFSET : 0;
    const toggleItemPanel = () => setIsItemPanelOpen(prev => !prev);

    return (
        <div className="w-full flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 space-y-8 min-h-screen relative overflow-x-hidden">
            <button onClick={toggleItemPanel} disabled={isDisplaySpinning} className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-[75] p-3 text-white rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 ease-in-out ${isDisplaySpinning ? 'opacity-50 cursor-not-allowed' : ''} ${isItemPanelOpen ? 'bg-red-600 hover:bg-red-700 rotate-[360deg]' : 'bg-sky-600 hover:bg-sky-700'}`} aria-label={isItemPanelOpen ? "Close settings panel" : "Open settings panel"} aria-expanded={isItemPanelOpen}>
                {isItemPanelOpen ? <IconClosePanel className="w-6 h-6"/> : <IconSettings className="w-6 h-6"/>}
            </button>

            {winningItem && showWinningBanner && ( <Modal isOpen={showWinningBanner} onClose={handleCloseWinningBanner} title="Congratulations!" size="md" panelClassName="bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 text-white border-pink-500 shadow-2xl" footerContent={ <button onClick={handleCloseWinningBanner} className="w-full sm:w-auto mt-2 sm:mt-0 bg-white/20 hover:bg-white/30 text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white/70">Acknowledge & Continue</button> }><div className="text-center py-4"><p className="text-2xl md:text-4xl font-bold animate-pulse">🎉 Winner! 🎉</p><p className="text-xl md:text-3xl mt-4">You won: <span className="font-extrabold tracking-wide">{winningItem.name}</span></p></div></Modal>)}

            <div className="w-full mx-auto flex flex-col items-center justify-center flex-grow">
                <section className="flex flex-col items-center space-y-4 transition-transform duration-300 ease-in-out w-full h-full flex-grow justify-center" style={{ transform: `translateX(${wheelTranslateX}px)` }}>
                    <div ref={wheelAreaRef} className="bg-slate-800 p-3 sm:p-4 rounded-xl shadow-xl flex items-center justify-center w-full max-w-[90vw] sm:max-w-[80vw] md:max-w-[70vw] lg:max-w-[60vw] xl:max-w-[800px] h-auto aspect-square relative">
                        <div className="relative origin-center transition-transform duration-300 ease-in-out" style={{ width: `${canvasDimensions.width}px`, height: `${canvasDimensions.height}px`, transform: `scale(${visualWheelScale})`}}>
                            <WheelCanvas ref={wheelCanvasRef} items={items} pointerPosition={pointerPosition} onSpinStart={handleSpinStart} onSpinEnd={handleSpinEnd} onWheelClick={handleSpinTrigger} width={canvasDimensions.width} height={canvasDimensions.height} />
                            {items.length === 0 && ( <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/80 backdrop-blur-sm rounded-full pointer-events-none"><IconWheelOutlineDisplay /><p className="text-lg font-medium text-slate-300 p-4 text-center">Your wheel is empty!</p><p className="text-sm text-slate-400">Use the form to add items.</p></div>)}
                        </div>
                        {items.length >= 2 && !isDisplaySpinning && ( <button onClick={handleQuickShuffle} disabled={isDisplaySpinning} className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 p-2.5 bg-slate-700/80 hover:bg-slate-600/90 text-slate-100 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-150 ease-in-out hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" aria-label="Quick shuffle wheel items" title="Shuffle Items (Once)"><IconShuffle className="w-5 h-5" /></button> )}
                    </div>
                </section>
            </div>

            <SlideOutPanel isOpen={isItemPanelOpen} onClose={() => setIsItemPanelOpen(false)} position="right" title="Wheel Settings & Items" widthClass="w-full sm:w-[420px] md:w-[480px]">
                <SettingsPanelContent
                    isDisplaySpinning={isDisplaySpinning}
                    currentPointerPosition={pointerPosition}
                    onDirectPointerPositionChange={handleDirectPointerPositionChange}
                    removeOnHit={removeOnHit}
                    onRemoveOnHitChange={() => setRemoveOnHit(prev => !prev)}
                    shuffleCountInput={shuffleCountInput}
                    onShuffleCountInputChange={(e) => setShuffleCountInput(e.target.value)}
                    onShuffleNTimes={handleShuffleNTimes}
                    itemsCount={items.length} // Pass current items.length
                    // Item Management Props
                    onAddItem={handleAddItem}
                    currentItems={items} // Pass current items array
                    onRemoveItemGroup={handleRemoveItemGroup}
                    onIncrementItemGroupQuantity={handleIncrementItemGroupQuantity}
                    onDecrementItemGroupQuantity={handleDecrementItemGroupQuantity}
                />
            </SlideOutPanel>

            <div className="fixed bottom-0 left-0 right-0 p-3 bg-slate-900/80 backdrop-blur-sm text-xs text-slate-400 text-center z-[50]">
                <span>Panel: {isItemPanelOpen.toString()} | Canvas W: {canvasDimensions.width} H: {canvasDimensions.height} | Scale: {visualWheelScale.toFixed(2)} | X: {wheelTranslateX.toFixed(0)}px | Spinning: {isDisplaySpinning.toString()} | RemoveOnHit: {removeOnHit.toString()} | Winner: {winningItem ? winningItem.name.substring(0,10)+'...' : 'N/A'} | Items: {items.length} | ShuffleInput: {shuffleCountInput}</span>
            </div>
        </div>
    );
};

export default WheelDisplay;
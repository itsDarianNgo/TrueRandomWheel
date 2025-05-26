// src/features/layout/WheelPage.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { selectAllItems, setItems as setItemsAction } from '../items/itemSlice'; // setItemsAction for shuffle
import {
    selectWheelSettings, selectWheelStatus, selectWinningItemDetails,
    selectDisplayWinningBanner, acknowledgeWinnerThunk, performShuffleThunk,
} from '../wheel/wheelSlice';
// spinWheelThunk is dispatched by WheelCanvasContainer now via onWheelClick

import WheelCanvasContainer from '../wheel/WheelCanvasContainer'; // Use the container
import SlideOutPanel from '../../components/common/SlideOutPanel';
import SettingsPanelContent from '../wheel/SettingsPanelContent';
import Modal from '../../components/common/Modal';
import PRNG from '../../core/prng/PRNGModule'; // Still needed for direct shuffle logic if not in thunk

// Icons (same as before)
const IconSettings = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const IconClosePanel = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
const IconWheelOutlineDisplay = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M3 12H0M12 12l5.25 5.25M12 12l-5.25 5.25M12 12l5.25-5.25M12 12l-5.25-5.25" /></svg>);
const IconShuffle = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /> </svg>);


const WheelPage = () => {
    const dispatch = useDispatch();
    const items = useSelector(selectAllItems);
    // wheelSettings is used by WheelCanvasContainer directly
    const wheelStatus = useSelector(selectWheelStatus);
    const winningItemDetails = useSelector(selectWinningItemDetails);
    const displayWinningBanner = useSelector(selectDisplayWinningBanner);

    const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
    const [canvasDimensions, setCanvasDimensions] = useState({ width: 520, height: 520 });
    const wheelAreaRef = useRef(null);

    const PANEL_WIDTH_PX = 480; /* same */
    const WHEEL_SECTION_TRANSLATE_X_OFFSET = PANEL_WIDTH_PX / 2.5; /* same */
    const WHEEL_SCALE_WHEN_PANEL_OPEN = 0.75; /* same */
    const overallIsBusy = wheelStatus !== 'idle';

    useEffect(() => { /* ... same canvas resize observer logic ... */ const wheelElement = wheelAreaRef.current; if (!wheelElement) return; const resizeObserver = new ResizeObserver(entries => { for (let entry of entries) { const { width, height } = entry.contentRect; const size = Math.min(width, height); if (size > 0 && (Math.abs(canvasDimensions.width - size) > 1 || Math.abs(canvasDimensions.height - size) > 1)) { setCanvasDimensions({ width: size, height: size }); } } }); resizeObserver.observe(wheelElement); return () => resizeObserver.unobserve(wheelElement); }, [canvasDimensions.width, canvasDimensions.height]);

    const handleCloseWinningBanner = useCallback(() => {
        dispatch(acknowledgeWinnerThunk());
    }, [dispatch]);

    const handleQuickShuffle = useCallback(() => {
        if (overallIsBusy || items.length < 2) return;
        dispatch(performShuffleThunk({ shuffleType: 'quick' }));
    }, [dispatch, overallIsBusy, items.length]);

    const handleShuffleNTimes = useCallback(() => { // This will be passed to SettingsPanelContent
        if (overallIsBusy || items.length < 2) return;
        dispatch(performShuffleThunk({ shuffleType: 'N_times' }));
    }, [dispatch, overallIsBusy, items.length]);

    const visualWheelScale = isSettingsPanelOpen ? WHEEL_SCALE_WHEN_PANEL_OPEN : 1; /* same */
    const wheelTranslateXVal = isSettingsPanelOpen ? -WHEEL_SECTION_TRANSLATE_X_OFFSET : 0; /* same */
    const toggleSettingsPanel = () => { /* same */ if (overallIsBusy) return; setIsSettingsPanelOpen(prev => !prev); };

    return (
        <div className="w-full flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 space-y-8 min-h-screen relative overflow-x-hidden bg-slate-850">
            <button onClick={toggleSettingsPanel} disabled={overallIsBusy} /* ... same button JSX ... */ className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-[75] p-3 text-white rounded-full shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-100 ${overallIsBusy ? 'opacity-50 cursor-not-allowed' : ''} ${isSettingsPanelOpen ? 'bg-red-600 hover:bg-red-700 rotate-[360deg]' : 'bg-sky-600 hover:bg-sky-700'}`} aria-label={isSettingsPanelOpen ? "Close wheel configuration panel" : "Open wheel configuration panel"} aria-expanded={isSettingsPanelOpen} >
                {isSettingsPanelOpen ? <IconClosePanel className="w-6 h-6"/> : <IconSettings className="w-6 h-6"/>}
            </button>

            {winningItemDetails && displayWinningBanner && ( /* ... same Modal JSX for winner ... */
                <Modal isOpen={displayWinningBanner} onClose={handleCloseWinningBanner} title="Congratulations!" size="md" panelClassName="bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 text-white border-pink-500 shadow-2xl animate-[spin-celebrate_0.5s_ease-out]" footerContent={ <button onClick={handleCloseWinningBanner} className="w-full sm:w-auto mt-2 sm:mt-0 bg-white/25 hover:bg-white/35 text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70">Acknowledge & Continue</button> } >
                    <div className="text-center py-4"> <p className="text-3xl md:text-5xl font-bold">🎉 Winner! 🎉</p> <p className="text-xl md:text-3xl mt-4">You won: <span className="font-extrabold tracking-wide text-yellow-300">{winningItemDetails.name}</span></p> </div>
                </Modal>
            )}

            <div className="w-full mx-auto flex flex-col items-center justify-center flex-grow relative">
                <section className="flex flex-col items-center space-y-4 transition-transform duration-300 ease-in-out w-full h-full flex-grow justify-center" style={{ transform: `translateX(${wheelTranslateXVal}px)` }}>
                    <div ref={wheelAreaRef} className="bg-slate-800 p-3 sm:p-4 rounded-xl shadow-2xl flex items-center justify-center w-full max-w-[90vw] sm:max-w-[80vw] md:max-w-[70vw] lg:max-w-[60vw] xl:max-w-[800px] h-auto aspect-square relative">
                        <div className="relative origin-center transition-transform duration-300 ease-in-out" style={{ width: `${canvasDimensions.width}px`, height: `${canvasDimensions.height}px`, transform: `scale(${visualWheelScale})`}}>
                            <WheelCanvasContainer
                                width={canvasDimensions.width}
                                height={canvasDimensions.height}
                                // canvasClassName can be passed if needed
                            />
                            {items.length === 0 && !overallIsBusy && ( /* ... same empty state JSX ... */
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/90 backdrop-blur-sm rounded-full pointer-events-none p-5"> <IconWheelOutlineDisplay /> <p className="text-lg font-medium text-slate-300 mt-3 text-center">Your wheel is empty!</p> <p className="text-sm text-slate-400 text-center">Use the settings panel to add items.</p> </div>
                            )}
                        </div>
                        <button onClick={handleQuickShuffle} disabled={overallIsBusy || items.length < 2} /* ... same quick shuffle button JSX ... */ className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-2.5 bg-slate-700/80 hover:bg-slate-600/90 text-slate-100 rounded-full shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 transition-all duration-150 ease-in-out hover:scale-110 active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" aria-label="Quick shuffle wheel items" title="Shuffle Items (Once)">
                            <IconShuffle className="w-5 h-5" />
                        </button>
                    </div>
                </section>
            </div>

            <SlideOutPanel isOpen={isSettingsPanelOpen} onClose={toggleSettingsPanel} position="right" title="Wheel Configuration" widthClass="w-full sm:w-[420px] md:w-[480px]">
                <SettingsPanelContent onShuffleNTimes={handleShuffleNTimes} />
            </SlideOutPanel>

            {import.meta.env.DEV && ( /* ... same Debug Bar JSX ... */
                <div className="fixed bottom-0 left-0 right-0 p-2 bg-slate-900/90 backdrop-blur-sm text-xs text-slate-400 text-center z-[100] flex flex-wrap justify-center items-center gap-x-4 gap-y-1"> <span>Panel: {isSettingsPanelOpen.toString()}</span> <span>Status: {wheelStatus}</span> <span>Items: {items.length}</span> <span>Winner: {winningItemDetails ? winningItemDetails.name.substring(0,10).concat(winningItemDetails.name.length > 10 ? '...' : '') :'N/A'}</span> {/* <span>Target: {useSelector(selectTargetWinningItem) ? useSelector(selectTargetWinningItem).name.substring(0,10) : 'N/A'}</span> */} </div>
            )}
        </div>
    );
};
export default WheelPage;
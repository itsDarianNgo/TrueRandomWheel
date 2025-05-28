// src/features/layout/WheelPage.jsx
// ... (imports: add selectEphemeralEffect)
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectAllItems } from '../items/itemSlice';
import {
    selectWheelStatus, selectWinningItemDetails, selectDisplayWinningBanner,
    confirmWinningSpinThunk, voidLastSpinThunk, performShuffleThunk,
    selectPageBackgroundImageUrl, selectRemoveOnHit,
    selectEphemeralEffect // New selector
} from '../wheel/WheelSlice';
import WheelCanvasContainer from '../wheel/WheelCanvasContainer';
import SettingsPanelOrchestrator from './SettingsPanelOrchestrator';
import Modal from '../../components/common/Modal';
import WheelOddsSummary from "../odds/WheelOddsSummary.jsx";
// Icons (same as before)
const IconSettings = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const IconClosePanel = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
const IconWheelOutlineDisplay = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M3 12H0M12 12l5.25 5.25M12 12l-5.25 5.25M12 12l5.25-5.25M12 12l-5.25-5.25" /></svg>);
const IconShuffle = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /> </svg>);


const WheelPage = () => {
    // ... (dispatch, most selectors, local state, refs - same as Response #66)
    const dispatch = useDispatch(); const items = useSelector(selectAllItems); const wheelStatus = useSelector(selectWheelStatus); const winningItemDetails = useSelector(selectWinningItemDetails); const displayWinningBanner = useSelector(selectDisplayWinningBanner); const pageBackgroundImageUrl = useSelector(selectPageBackgroundImageUrl); const removeOnHitActive = useSelector(selectRemoveOnHit);
    const ephemeralEffect = useSelector(selectEphemeralEffect); // New selector for GIF
    const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false); const [canvasDimensions, setCanvasDimensions] = useState({ width: 520, height: 520 }); const wheelAreaRef = useRef(null); const pageRootRef = useRef(null); const PANEL_WIDTH_PX = 480; const WHEEL_SECTION_TRANSLATE_X_OFFSET = PANEL_WIDTH_PX / 2.5; const WHEEL_SCALE_WHEN_PANEL_OPEN = 0.75; const overallIsBusy = wheelStatus !== 'idle';
    useEffect(() => { /* ... canvas resize observer ... */ const wheelElement = wheelAreaRef.current; if (!wheelElement) return; const resizeObserver = new ResizeObserver(entries => { for (let entry of entries) { const { width, height } = entry.contentRect; const size = Math.min(width, height); if (size > 0 && (Math.abs(canvasDimensions.width - size) > 1 || Math.abs(canvasDimensions.height - size) > 1)) { setCanvasDimensions({ width: size, height: size }); } } }); resizeObserver.observe(wheelElement); return () => resizeObserver.unobserve(wheelElement); }, [canvasDimensions.width, canvasDimensions.height]);
    useEffect(() => { /* ... page background effect ... */ const pageElement = pageRootRef.current; if (!pageElement) return; if (pageBackgroundImageUrl && /^(https?:\/\/|data:image\/)/i.test(pageBackgroundImageUrl)) { pageElement.style.backgroundImage = `url('${pageBackgroundImageUrl}')`; pageElement.style.backgroundSize = 'cover'; pageElement.style.backgroundPosition = 'center'; pageElement.style.backgroundRepeat = 'no-repeat'; pageElement.style.backgroundColor = 'transparent'; } else { pageElement.style.backgroundImage = ''; pageElement.style.backgroundSize = ''; pageElement.style.backgroundPosition = ''; pageElement.style.backgroundRepeat = ''; pageElement.style.backgroundColor = ''; } }, [pageBackgroundImageUrl]);
    const handleConfirmWin = useCallback(() => { dispatch(confirmWinningSpinThunk()); }, [dispatch]);
    const handleVoidSpin = useCallback(() => { dispatch(voidLastSpinThunk()); }, [dispatch]);
    const handleQuickShuffle = useCallback(() => { if (overallIsBusy || items.length < 2) return; dispatch(performShuffleThunk({ shuffleType: 'quick' })); }, [dispatch, overallIsBusy, items.length]);
    const handleShuffleNTimes = useCallback(() => { if (overallIsBusy || items.length < 2) return; dispatch(performShuffleThunk({ shuffleType: 'N_times' })); }, [dispatch, overallIsBusy, items.length]);
    const toggleSettingsPanel = useCallback(() => { if (overallIsBusy && !isSettingsPanelOpen) return; setIsSettingsPanelOpen(prev => !prev); }, [overallIsBusy, isSettingsPanelOpen]);
    const visualWheelScale = isSettingsPanelOpen ? WHEEL_SCALE_WHEN_PANEL_OPEN : 1; const wheelTranslateXVal = isSettingsPanelOpen ? -WHEEL_SECTION_TRANSLATE_X_OFFSET : 0;

    return (
        <div ref={pageRootRef} /* ... same outer div props ... */ className="w-full flex flex-col items-center justify-start p-2 sm:p-4 md:p-6 space-y-4 md:space-y-6 min-h-screen relative overflow-x-hidden transition-all duration-500 ease-in-out">
            {/* Settings Toggle Button (same) */}
            <button onClick={toggleSettingsPanel} disabled={overallIsBusy && !isSettingsPanelOpen} className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-[75] p-3 text-white rounded-full shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-100 ${(overallIsBusy && !isSettingsPanelOpen) ? 'opacity-50 cursor-not-allowed' : ''} ${isSettingsPanelOpen ? 'bg-red-600 hover:bg-red-700 rotate-[360deg]' : 'bg-sky-600 hover:bg-sky-700'}`} aria-label={isSettingsPanelOpen ? "Close wheel configuration panel" : "Open wheel configuration panel"} aria-expanded={isSettingsPanelOpen} aria-controls="settings-panel-main" > {isSettingsPanelOpen ? <IconClosePanel className="w-6 h-6"/> : <IconSettings className="w-6 h-6"/>} </button>

            {/* MODIFIED Winning Banner Modal to include GIF */}
            {winningItemDetails && displayWinningBanner && (
                <Modal
                    isOpen={displayWinningBanner}
                    onClose={handleConfirmWin}
                    title="Spin Result!"
                    size="md"
                    panelClassName="bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 text-white border-pink-500 shadow-2xl animate-[spin-celebrate_0.5s_ease-out]"
                    footerContent={ /* ... same footer buttons ... */ <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 w-full"> <button onClick={handleVoidSpin} className="w-full sm:w-auto order-2 sm:order-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 active:bg-red-700 rounded-lg shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 transition-colors" > Void Spin </button> <button onClick={handleConfirmWin} className="w-full sm:w-auto order-1 sm:order-2 px-4 py-2.5 text-sm font-semibold text-slate-900 bg-green-400 hover:bg-green-500 active:bg-green-600 rounded-lg shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 transition-colors" > Confirm Winner </button> </div> }
                >
                    <div className="text-center py-4 flex flex-col items-center"> {/* Added flex for centering gif */}
                        <p className="text-3xl md:text-5xl font-bold">🎉 Winner! 🎉</p>
                        <p className="text-xl md:text-3xl mt-4">
                            Landed on: <span className="font-extrabold tracking-wide text-yellow-300">{winningItemDetails.name}</span>
                        </p>

                        {/* Conditional GIF Display */}
                        {ephemeralEffect && ephemeralEffect.type === 'gif' && ephemeralEffect.url && (
                            <div className="mt-4 mb-2 flex justify-center max-h-40 sm:max-h-48 w-full"> {/* Max height for GIF */}
                                <img
                                    src={ephemeralEffect.url}
                                    alt="Winning GIF Effect"
                                    className="max-w-full max-h-full object-contain rounded-md shadow-lg"
                                    onError={(e) => { e.target.style.display = 'none'; console.warn("Failed to load GIF in modal:", ephemeralEffect.url);}}
                                />
                            </div>
                        )}

                        {removeOnHitActive && ( /* Helper text for remove on hit */ <p className="mt-3 text-xs text-white/80 px-2"> (Confirming will remove this item from the wheel as "Remove on Hit" is active) </p> )}
                        {!removeOnHitActive && ( <p className="mt-3 text-xs text-white/80 px-2"> (Item will remain on the wheel) </p> )}
                    </div>
                </Modal>
            )}

            {/* Main Content Area (Wheel & Odds Summary - same layout as Response #66) */}
            <div className={`w-full flex-grow flex flex-col md:flex-row items-center md:items-start md:justify-center gap-4 lg:gap-6 transition-transform duration-300 ease-in-out`} style={{ transform: isSettingsPanelOpen ? `translateX(${wheelTranslateXVal}px)` : 'translateX(0px)' }} > <section className="flex-grow w-full md:w-auto flex justify-center items-center order-1 md:order-1 min-w-0 md:min-w-[320px] lg:min-w-[400px] xl:min-w-[480px]"> <div ref={wheelAreaRef} className={`p-3 sm:p-4 rounded-xl shadow-2xl flex items-center justify-center w-full max-w-full md:max-w-[800px] h-auto aspect-square relative transition-colors duration-300 ${pageBackgroundImageUrl && /^(https?:\/\/|data:image\/)/i.test(pageBackgroundImageUrl) ? 'bg-transparent' : 'bg-slate-800'}`} > <div className="relative origin-center transition-transform duration-300 ease-in-out" style={{ width: `${canvasDimensions.width}px`, height: `${canvasDimensions.height}px`, transform: `scale(${visualWheelScale})`}} > <WheelCanvasContainer width={canvasDimensions.width} height={canvasDimensions.height} /> {items.length === 0 && !overallIsBusy && ( <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/90 backdrop-blur-sm rounded-full pointer-events-none p-5"> <IconWheelOutlineDisplay /> <p className="text-lg font-medium text-slate-300 mt-3 text-center">Your wheel is empty!</p> <p className="text-sm text-slate-400 text-center">Use the settings panel to add items.</p> </div> )} </div> <button onClick={handleQuickShuffle} disabled={overallIsBusy || items.length < 2} className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-2.5 bg-slate-700/80 hover:bg-slate-600/90 text-slate-100 rounded-full shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 transition-all duration-150 ease-in-out hover:scale-110 active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" aria-label="Quick shuffle wheel items" title="Shuffle Items (Once)"> <IconShuffle className="w-5 h-5" /> </button> </div> </section> <section className="w-full md:w-auto md:max-w-xs lg:max-w-sm order-2 md:order-2 shrink-0 mt-4 md:mt-0"> <WheelOddsSummary onViewDetailedOddsClick={toggleSettingsPanel} /> </section> </div>
            <SettingsPanelOrchestrator isOpen={isSettingsPanelOpen} onClosePanel={toggleSettingsPanel} panelTitle="Wheel Configuration" onShuffleNTimes={handleShuffleNTimes} />
            {import.meta.env.DEV && ( /* Debug Bar */ <div className="fixed bottom-0 left-0 right-0 p-2 bg-slate-900/90 backdrop-blur-sm text-xs text-slate-400 text-center z-[100] flex flex-wrap justify-center items-center gap-x-4 gap-y-1"> <span>Panel: {isSettingsPanelOpen.toString()}</span> <span>Status: {wheelStatus}</span> <span>Items: {items.length}</span> <span>Winner: {winningItemDetails ? winningItemDetails.name.substring(0,10).concat(winningItemDetails.name.length > 10 ? '...' : '') :'N/A'}</span> </div> )}
        </div>
    );
};
export default WheelPage;
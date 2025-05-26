// src/features/layout/WheelPage.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

// Redux Slices & Actions (imports remain the same as Phase 2)
import { selectAllItems } from '../items/itemSlice';
import {
    selectWheelStatus, selectWinningItemDetails,
    selectDisplayWinningBanner, acknowledgeWinnerThunk, performShuffleThunk, selectPageBackgroundImageUrl,
} from '../wheel/wheelSlice';

// Components
import WheelCanvasContainer from '../wheel/WheelCanvasContainer';
import SettingsPanelOrchestrator from './SettingsPanelOrchestrator'; // New import
import Modal from '../../components/common/Modal';

// Icons (imports remain the same)
const IconSettings = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const IconClosePanel = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
const IconWheelOutlineDisplay = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M3 12H0M12 12l5.25 5.25M12 12l-5.25 5.25M12 12l5.25-5.25M12 12l-5.25-5.25" /></svg>);
const IconShuffle = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /> </svg>);

// Orchestrates the main wheel page, including the wheel itself and the settings panel.
const WheelPage = () => {
    const dispatch = useDispatch();
    const items = useSelector(selectAllItems);
    const wheelStatus = useSelector(selectWheelStatus);
    const winningItemDetails = useSelector(selectWinningItemDetails);
    const displayWinningBanner = useSelector(selectDisplayWinningBanner);
    const pageBackgroundImageUrl = useSelector(selectPageBackgroundImageUrl); // New

    // State for settings panel visibility is managed here
    const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
    const [canvasDimensions, setCanvasDimensions] = useState({ width: 520, height: 520 });
    const wheelAreaRef = useRef(null);
    const pageRootRef = useRef(null); // Ref for the main div to set background

    const PANEL_WIDTH_PX = 480;
    const WHEEL_SECTION_TRANSLATE_X_OFFSET = PANEL_WIDTH_PX / 2.5;
    const WHEEL_SCALE_WHEN_PANEL_OPEN = 0.75;
    const overallIsBusy = wheelStatus !== 'idle';

    // Effect for canvas resizing (remains the same)
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
        return () => resizeObserver.unobserve(wheelElement);
    }, [canvasDimensions.width, canvasDimensions.height]);

    // Effect to apply page background image
    useEffect(() => {
        const pageElement = pageRootRef.current;
        if (!pageElement) return;

        if (pageBackgroundImageUrl && /^(https?:\/\/)/i.test(pageBackgroundImageUrl)) {
            pageElement.style.backgroundImage = `url('${pageBackgroundImageUrl}')`;
            pageElement.style.backgroundSize = 'cover';
            pageElement.style.backgroundPosition = 'center';
            pageElement.style.backgroundRepeat = 'no-repeat';
        } else {
            // Revert to default (which should be handled by Tailwind classes on this div)
            // Or explicitly set back to gradient if that was the JS-controlled default
            pageElement.style.backgroundImage = ''; // Clears inline style, CSS class takes over
        }
    }, [pageBackgroundImageUrl]);

    // Callback to close the winning banner (dispatches acknowledgeWinnerThunk)
    const handleCloseWinningBanner = useCallback(() => {
        dispatch(acknowledgeWinnerThunk());
    }, [dispatch]);

    // Callback for quick shuffle button (dispatches performShuffleThunk)
    const handleQuickShuffle = useCallback(() => {
        if (overallIsBusy || items.length < 2) return;
        dispatch(performShuffleThunk({ shuffleType: 'quick' }));
    }, [dispatch, overallIsBusy, items.length]);

    // Callback for "Shuffle N Times" (passed to SettingsPanelContent via orchestrator)
    const handleShuffleNTimes = useCallback(() => {
        if (overallIsBusy || items.length < 2) return;
        dispatch(performShuffleThunk({ shuffleType: 'N_times' }));
    }, [dispatch, overallIsBusy, items.length]);

    // Toggles the settings panel visibility
    const toggleSettingsPanel = useCallback(() => {
        if (overallIsBusy && !isSettingsPanelOpen) return; // Prevent opening if busy
        // Allow closing even if busy
        setIsSettingsPanelOpen(prev => !prev);
    }, [overallIsBusy, isSettingsPanelOpen]); // Added isSettingsPanelOpen to dependency for correct logic

    const visualWheelScale = isSettingsPanelOpen ? WHEEL_SCALE_WHEN_PANEL_OPEN : 1;
    const wheelTranslateXVal = isSettingsPanelOpen ? -WHEEL_SECTION_TRANSLATE_X_OFFSET : 0;

    return (
        <div ref={pageRootRef} className="w-full flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 space-y-8 min-h-screen relative overflow-x-hidden bg-slate-850 transition-all duration-500 ease-in-out">
            {/* Settings Toggle Button - rendered by WheelPage */}
            <button
                onClick={toggleSettingsPanel}
                disabled={overallIsBusy && !isSettingsPanelOpen} // Only disable opening if busy
                className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-[75] p-3 text-white rounded-full shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-100 ${(overallIsBusy && !isSettingsPanelOpen) ? 'opacity-50 cursor-not-allowed' : ''} ${isSettingsPanelOpen ? 'bg-red-600 hover:bg-red-700 rotate-[360deg]' : 'bg-sky-600 hover:bg-sky-700'}`}
                aria-label={isSettingsPanelOpen ? "Close wheel configuration panel" : "Open wheel configuration panel"}
                aria-expanded={isSettingsPanelOpen}
                aria-controls="settings-panel-main" // ID for SlideOutPanel, to be set in SettingsPanelOrchestrator
            >
                {isSettingsPanelOpen ? <IconClosePanel className="w-6 h-6"/> : <IconSettings className="w-6 h-6"/>}
            </button>

            {/* Winning Banner Modal (remains the same) */}
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

            {/* Main Wheel Area (remains the same, renders WheelCanvasContainer) */}
            <div className="w-full mx-auto flex flex-col items-center justify-center flex-grow relative">
                <section
                    className="flex flex-col items-center space-y-4 transition-transform duration-300 ease-in-out w-full h-full flex-grow justify-center"
                    style={{ transform: `translateX(${wheelTranslateXVal}px)` }}
                >
                    {/* ***** MODIFIED DIV for background cutout fix ***** */}
                    <div
                        ref={wheelAreaRef}
                        className={`p-3 sm:p-4 rounded-xl shadow-2xl flex items-center justify-center w-full max-w-[90vw] sm:max-w-[80vw] md:max-w-[70vw] lg:max-w-[60vw] xl:max-w-[800px] h-auto aspect-square relative 
                                    ${pageBackgroundImageUrl ? 'bg-transparent' : 'bg-slate-800'}`}
                    >
                        <div className="relative origin-center transition-transform duration-300 ease-in-out" style={{ width: `${canvasDimensions.width}px`, height: `${canvasDimensions.height}px`, transform: `scale(${visualWheelScale})`}}>
                            <WheelCanvasContainer
                                width={canvasDimensions.width}
                                height={canvasDimensions.height}
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

            {/* Delegated Settings Panel Rendering */}
            <SettingsPanelOrchestrator
                isOpen={isSettingsPanelOpen}
                onClosePanel={toggleSettingsPanel} // Pass the toggle function
                panelTitle="Wheel Configuration"    // Or from a constant/config
                onShuffleNTimes={handleShuffleNTimes} // Pass the callback for "Shuffle N Times" button
            />

            {/* Debug Bar (remains the same) */}
            {import.meta.env.DEV && (
                <div className="fixed bottom-0 left-0 right-0 p-2 bg-slate-900/90 backdrop-blur-sm text-xs text-slate-400 text-center z-[100] flex flex-wrap justify-center items-center gap-x-4 gap-y-1">
                    <span>Panel: {isSettingsPanelOpen.toString()}</span>
                    <span>Status: {wheelStatus}</span>
                    <span>Items: {items.length}</span>
                    <span>Winner: {winningItemDetails ? winningItemDetails.name.substring(0,10).concat(winningItemDetails.name.length > 10 ? '...' : '') :'N/A'}</span>
                </div>
            )}
        </div>
    );
};
export default WheelPage;
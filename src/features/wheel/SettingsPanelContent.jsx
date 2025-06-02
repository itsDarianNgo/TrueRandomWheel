// src/features/wheel/SettingsPanelContent.jsx
// ... (other imports remain mostly the same)
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { HexColorPicker, HexColorInput } from 'react-colorful';

import AddItemForm from '../items/AddItemForm';
import CurrentItemsList from '../items/CurrentItemsList';
import HistoryPanel from '../history/HistoryPanel';
import OddsDisplayPanel from '../odds/OddsDisplayPanel';
import ImageInputControl from './ImageInputControl';
import EffectsConfigurationPanel from '../effects/components/EffectsConfigurationPanel';
import Modal from '../../components/common/Modal';

import {
    selectWheelSettings, selectWheelStatus, setPointerPosition, toggleRemoveOnHit,
    setShuffleCount as setReduxShuffleCount, setPageBackgroundImageUrl, setWheelSurfaceImageUrl,
    selectPageBackgroundImageUrl, selectWheelSurfaceImageUrl, setSegmentOpacity, selectSegmentOpacity,
    selectCustomPointerColor, setCustomPointerColor,
    selectSpinDuration, setSpinParameters // ***** Use selectSpinDuration and setSpinParameters *****
} from './WheelSlice.js';
import { selectAllItems, addMultipleItemEntries, MAX_ITEMS_OVERALL as MAX_ITEMS_CONFIG } from '../items/itemSlice';

// Icons ... (remain the same)
const IconArrowUp = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"> <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" /> </svg> );
const IconArrowRight = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"> <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /> </svg> );
const IconArrowDown = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"> <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M19 12l-7 7-7-7" /> </svg> );
const IconArrowLeft = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"> <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h15" /> </svg> );
const IconInformationCircle = ({ className = "w-4 h-4" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"> <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> </svg>);
const IconChevronDown = ({ className = "w-5 h-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;
const IconChevronUp = ({ className = "w-5 h-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>;
const pointerIconsMap = { top: { IconComponent: IconArrowUp, label: "Top" }, right: { IconComponent: IconArrowRight, label: "Right" }, bottom: { IconComponent: IconArrowDown, label: "Bottom" }, left: { IconComponent: IconArrowLeft, label: "Left" }, };
const POINTER_POSITIONS_ORDER_PANEL = ['top', 'right', 'bottom', 'left'];

const SettingsPanelContent = ({ onShuffleNTimes }) => {
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState('settings');

    const wheelSettings = useSelector(selectWheelSettings); // General settings like pointerPosition, removeOnHit, shuffleCount
    const wheelStatus = useSelector(selectWheelStatus);
    const allItems = useSelector(selectAllItems);
    const pageBgUrlFromStore = useSelector(selectPageBackgroundImageUrl);
    const wheelSurfaceUrlFromStore = useSelector(selectWheelSurfaceImageUrl);
    const segmentOpacityFromStore = useSelector(selectSegmentOpacity);
    const currentCustomPointerColor = useSelector(selectCustomPointerColor);
    const currentSpinDurationMs = useSelector(selectSpinDuration); // ***** GET SPIN DURATION *****

    const [isPointerColorModalOpen, setIsPointerColorModalOpen] = useState(false);
    const [temporaryPointerColor, setTemporaryPointerColor] = useState(currentCustomPointerColor);

    const currentTotalItemsCount = allItems.length;
    const isDisabled = wheelStatus !== 'idle';

    const [localShuffleCountInput, setLocalShuffleCountInput] = useState(wheelSettings.shuffleCount.toString());
    // ***** LOCAL STATE FOR SPIN DURATION INPUT (IN SECONDS) *****
    const [localSpinDurationSec, setLocalSpinDurationSec] = useState((currentSpinDurationMs / 1000).toFixed(1));

    useEffect(() => { setLocalShuffleCountInput(wheelSettings.shuffleCount.toString()); }, [wheelSettings.shuffleCount]);
    useEffect(() => { if (!isPointerColorModalOpen) { setTemporaryPointerColor(currentCustomPointerColor); } }, [currentCustomPointerColor, isPointerColorModalOpen]);
    // ***** SYNC LOCAL SPIN DURATION INPUT WITH REDUX STATE *****
    useEffect(() => {
        setLocalSpinDurationSec((currentSpinDurationMs / 1000).toFixed(1));
    }, [currentSpinDurationMs]);


    const [isBulkAddOpen, setIsBulkAddOpen] = useState(false); /* ... bulk add state ... */
    const [bulkAddText, setBulkAddText] = useState('');
    const [bulkAddMessage, setBulkAddMessage] = useState(null);

    const handlePointerPositionChange = (newPosition) => dispatch(setPointerPosition(newPosition));
    const handleRemoveOnHitChange = () => dispatch(toggleRemoveOnHit());
    const handleShuffleCountInputChange = (e) => { /* ... */ const val = e.target.value; setLocalShuffleCountInput(val); const count = parseInt(val, 10); if (!isNaN(count) && count >= 1) { dispatch(setReduxShuffleCount(count)); } else if (val === "") { dispatch(setReduxShuffleCount(1)); } };
    const handleSegmentOpacityChange = (e) => { /* ... */ const opacityValue = parseInt(e.target.value, 10) / 100; dispatch(setSegmentOpacity(opacityValue)); };
    const handleSetPageBgUrl = (url) => dispatch(setPageBackgroundImageUrl(url));
    const handleSetWheelSurfaceUrl = (url) => dispatch(setWheelSurfaceImageUrl(url));
    const openPointerColorModal = () => { /* ... */ setTemporaryPointerColor(currentCustomPointerColor); setIsPointerColorModalOpen(true); };
    const handleApplyPointerColor = () => { /* ... */ dispatch(setCustomPointerColor(temporaryPointerColor)); setIsPointerColorModalOpen(false); };
    const handleCancelPointerColor = () => { /* ... */ setIsPointerColorModalOpen(false); };
    const handleAddPastedItems = () => { /* ... */ setBulkAddMessage(null); const lines = bulkAddText.split('\n'); const itemNames = lines.map(line => line.trim()).filter(name => name !== ''); if (itemNames.length === 0) { setBulkAddMessage({ type: 'error', text: 'No valid item names found.' }); return; } if (currentTotalItemsCount + itemNames.length > MAX_ITEMS_CONFIG) { setBulkAddMessage({ type: 'error', text: `Cannot add. Total items would exceed limit of ${MAX_ITEMS_CONFIG}.` }); return; } dispatch(addMultipleItemEntries({ names: itemNames })); setBulkAddMessage({ type: 'success', text: `${itemNames.length} items added!` }); setBulkAddText(''); setTimeout(() => setBulkAddMessage(null), 4000); };

    // ***** HANDLER FOR SPIN DURATION INPUT CHANGE *****
    const handleSpinDurationUIChange = (e) => {
        const secString = e.target.value;
        setLocalSpinDurationSec(secString); // Update local UI state immediately

        // Debounce or onBlur for dispatching might be good, but for now, direct dispatch
        const valFloat = parseFloat(secString);
        if (!isNaN(valFloat)) {
            const ms = Math.round(valFloat * 1000); // Convert to ms
            // Dispatch using setSpinParameters, passing undefined for spins if not changing it
            dispatch(setSpinParameters({ duration: ms }));
        }
    };

    const isPrimaryInteractionDisabled = isDisabled && (activeTab === 'settings' || activeTab === 'appearance');
    const tabButtonClass = (tabName) =>  `flex-1 py-3 px-2 text-xs sm:text-sm font-semibold text-center transition-all duration-150 ease-in-out focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-800 rounded-t-md ${activeTab === tabName ? 'bg-slate-700 text-sky-300 border-b-2 border-sky-400 shadow-inner' : 'text-slate-400 hover:bg-slate-700/30 hover:text-slate-200'}`;

    return (
        <div className={`flex flex-col h-full ${isPrimaryInteractionDisabled ? 'opacity-70 pointer-events-none' : ''}`}>
            {/* Tabs ... unchanged ... */}
            <div className="flex border-b border-slate-700 flex-shrink-0 bg-slate-800"> <button onClick={() => setActiveTab('settings')} disabled={isPrimaryInteractionDisabled} className={tabButtonClass('settings')}>Controls & Items</button> <button onClick={() => setActiveTab('appearance')} disabled={isPrimaryInteractionDisabled} className={tabButtonClass('appearance')}>Appearance</button> <button onClick={() => setActiveTab('effects')} disabled={isPrimaryInteractionDisabled} className={tabButtonClass('effects')}>Effects</button> <button onClick={() => setActiveTab('odds')} className={tabButtonClass('odds')}>Odds</button> <button onClick={() => setActiveTab('history')} className={tabButtonClass('history')}>Spin History</button> </div>

            <div className="flex-grow overflow-y-auto scrollbar-hide bg-slate-800">
                {activeTab === 'settings' && (
                    <div id="settings-tab-panel" className="p-3 sm:p-4 space-y-6">
                        {/* ... Pointer Position section ... unchanged ... */}
                        <section className="p-4 bg-slate-700/60 rounded-lg shadow"> <h4 id="pointer-position-group-label-panel" className="text-base sm:text-md font-semibold text-sky-300 mb-3 text-center">Pointer Position</h4> <div role="group" aria-labelledby="pointer-position-group-label-panel" className={`flex w-full rounded-md shadow-sm border border-slate-600 overflow-hidden ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}> {POINTER_POSITIONS_ORDER_PANEL.map((positionKey, index) => { const isActive = wheelSettings.pointerPosition === positionKey; const { IconComponent, label } = pointerIconsMap[positionKey]; let segmentClasses = index > 0 ? "border-l border-slate-500 " : ""; return ( <button key={positionKey} type="button" onClick={() => handlePointerPositionChange(positionKey)} disabled={isDisabled} className={`flex-1 flex flex-col items-center justify-center p-2.5 sm:p-3 text-xs sm:text-sm transition-colors duration-150 ease-in-out focus:outline-none focus-visible:z-10 focus-visible:ring-1 focus-visible:ring-sky-400 focus-visible:ring-offset-0 ${segmentClasses} ${isActive ? 'bg-sky-600 text-white shadow-inner' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'} ${isDisabled ? 'pointer-events-none hover:bg-slate-700' : ''}`} aria-pressed={isActive} aria-label={`Set pointer to ${label}`}> <IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 sm:mb-1 ${isActive ? 'text-white' : 'text-slate-400'}`} /> <span className="font-medium">{label}</span> </button> ); })} </div> </section>
                        <section className="p-4 bg-slate-700/60 rounded-lg shadow">
                            <h4 className="text-base sm:text-md font-semibold text-sky-300 mb-3 text-center">Spin Behavior</h4>
                            {/* Auto-Remove Winner Toggle - unchanged */}
                            <div className={`flex items-center justify-between p-3 bg-slate-700 rounded-md transition-opacity ${isDisabled ? 'opacity-60' : ''}`}> <div className="flex items-center space-x-2"> <label htmlFor="removeOnHitToggle" className="text-sm text-slate-200 select-none cursor-pointer flex-grow">Auto-Remove Winner</label> <span className="cursor-help text-slate-400 hover:text-sky-400 transition-colors" title="If enabled, the winning item will be removed from the wheel after its win is acknowledged."><IconInformationCircle className="w-4 h-4"/></span> </div> <button type="button" id="removeOnHitToggle" role="switch" aria-checked={wheelSettings.removeOnHit} onClick={handleRemoveOnHitChange} disabled={isDisabled} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-700 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${wheelSettings.removeOnHit ? 'bg-sky-500' : 'bg-slate-600'}`}> <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform shadow ${wheelSettings.removeOnHit ? 'translate-x-6' : 'translate-x-1'}`} /> </button> </div>

                            {/* ***** NEW SPIN DURATION INPUT ***** */}
                            <div className="mt-4 pt-4 border-t border-slate-600/50">
                                <label htmlFor="spinDurationInput" className="block text-sm font-medium text-slate-300 mb-1">
                                    Spin Duration (seconds)
                                </label>
                                <input
                                    type="number"
                                    id="spinDurationInput"
                                    value={localSpinDurationSec}
                                    onChange={handleSpinDurationUIChange}
                                    min="1"  // Corresponds to MIN_SPIN_DURATION_MS
                                    max="60" // Corresponds to MAX_SPIN_DURATION_MS
                                    step="0.1" // Allow finer control
                                    disabled={isDisabled}
                                    className="w-28 px-3 py-1.5 bg-slate-700 border border-slate-500 text-slate-100 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:border-sky-500 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <p className="mt-1 text-xs text-slate-400">Set how long the wheel spins (1 to 60 seconds).</p>
                            </div>
                        </section>
                        {/* ... Shuffle Wheel, AddItemForm, Bulk Add, CurrentItemsList ... unchanged ... */}
                        <section className="p-4 bg-slate-700/60 rounded-lg shadow"> <h4 className="text-base sm:text-md font-semibold text-sky-300 mb-4 text-center">Shuffle Wheel</h4> <div className="space-y-3"> <div className="flex items-center space-x-3"> <label htmlFor="shuffleCountInput" className="text-sm text-slate-200 flex-shrink-0">Shuffle Count:</label> <input type="number" id="shuffleCountInput" value={localShuffleCountInput} onChange={handleShuffleCountInputChange} min="1" disabled={isDisabled || currentTotalItemsCount < 2} className="w-24 px-3 py-1.5 bg-slate-700 border border-slate-600 text-slate-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:opacity-50 disabled:cursor-not-allowed" /> </div> <button type="button" onClick={onShuffleNTimes} disabled={isDisabled || currentTotalItemsCount < 2} className="w-full px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-700/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-sky-600" > Shuffle {wheelSettings.shuffleCount >= 1 && currentTotalItemsCount >=2 ? wheelSettings.shuffleCount : ''} Times </button> </div> </section> <AddItemForm />  <section className="p-4 bg-slate-700/60 rounded-lg shadow"> <button onClick={() => setIsBulkAddOpen(prev => !prev)} className="w-full flex justify-between items-center text-left text-sm font-medium text-sky-300 hover:text-sky-200 p-2 rounded-md hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500" aria-expanded={isBulkAddOpen} aria-controls="bulk-add-content" > <span>Bulk Add Items by Name</span> {isBulkAddOpen ? <IconChevronUp /> : <IconChevronDown />} </button> {isBulkAddOpen && ( <div id="bulk-add-content" className="mt-3 pt-3 border-t border-slate-600 space-y-3"> <p className="text-xs text-slate-400"> Paste one item name per line. Each will be added with quantity 1, default color, and no tags. </p> <textarea value={bulkAddText} onChange={(e) => setBulkAddText(e.target.value)} placeholder={"Item Name 1\nItem Name 2\nItem Name 3\n..."} rows={6} disabled={isDisabled} className={`w-full p-2 bg-slate-900 border border-slate-600 text-slate-200 rounded-md focus:ring-1 focus:ring-sky-500 focus:border-sky-500 scrollbar-hide ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`} /> <button onClick={handleAddPastedItems} disabled={isDisabled || !bulkAddText.trim()} className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-700/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-600" > Add Pasted Items to Wheel </button> {bulkAddMessage && ( <p className={`mt-2 text-xs p-2 rounded-md ${bulkAddMessage.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}> {bulkAddMessage.text} </p> )} </div> )} </section> <CurrentItemsList />
                    </div>
                )}

                {activeTab === 'appearance' && ( /* ... Appearance Tab Content ... */ <div id="appearance-tab-panel" className="p-3 sm:p-4 space-y-6"> <section className="p-4 bg-slate-700/60 rounded-lg shadow space-y-4"> <h4 className="text-md font-semibold text-sky-300 mb-1 text-center">Page & Wheel Images</h4> <ImageInputControl label="Page Background Image" idPrefix="page-bg" currentImageUrl={pageBgUrlFromStore} onSetImageUrl={handleSetPageBgUrl} disabled={isDisabled} /> <hr className="border-slate-600 my-4"/> <ImageInputControl label="Wheel Surface Image" idPrefix="wheel-surface" currentImageUrl={wheelSurfaceUrlFromStore} onSetImageUrl={handleSetWheelSurfaceUrl} disabled={isDisabled} /> </section> <section className="p-4 bg-slate-700/60 rounded-lg shadow"> <h4 className="text-md font-semibold text-sky-300 mb-3 text-center">Wheel & Pointer Appearance</h4> <div> <label htmlFor="segmentOpacity" className="block text-sm font-medium text-slate-300 mb-1"> Segment Color Opacity: {Math.round(segmentOpacityFromStore * 100)}% </label> <input type="range" id="segmentOpacity" min="0" max="100" value={Math.round(segmentOpacityFromStore * 100)} onChange={handleSegmentOpacityChange} disabled={isDisabled || !wheelSurfaceUrlFromStore} className={`w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-sky-500 ${ (isDisabled || !wheelSurfaceUrlFromStore) ? 'opacity-50 cursor-not-allowed' : ''}`} /> <p className="mt-1 text-xs text-slate-400">Controls opacity of item colors when a wheel surface image is set.</p> </div> <div className="mt-6 pt-4 border-t border-slate-600/50"> <label className="block text-sm font-medium text-slate-300 mb-2"> Pointer Color </label> <div className="flex items-center space-x-3"> <div className="w-10 h-8 rounded-md border-2 border-slate-500 shadow-sm cursor-pointer hover:border-sky-400 transition-colors" style={{ backgroundColor: currentCustomPointerColor }} onClick={!isDisabled ? openPointerColorModal : undefined} title={`Current pointer color: ${currentCustomPointerColor}. Click to change.`} role="button" tabIndex={isDisabled ? -1 : 0} onKeyDown={!isDisabled ? (e) => { if (e.key === 'Enter' || e.key === ' ') openPointerColorModal(); } : undefined} ></div> <span className="text-sm text-slate-200 font-mono tabular-nums">{currentCustomPointerColor}</span> <button type="button" onClick={openPointerColorModal} disabled={isDisabled} className="ml-auto px-3 py-1.5 text-xs bg-sky-600 hover:bg-sky-700 text-white rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-700/60 disabled:opacity-50 disabled:cursor-not-allowed" > Choose Color... </button> </div> <p className="mt-1 text-xs text-slate-400">Set the main fill color for the wheel pointer.</p> </div> </section> </div>)}
                {activeTab === 'effects' && ( /* ... Effects Tab Content ... */ <div id="effects-tab-panel" className="p-3 sm:p-4 h-full"> <EffectsConfigurationPanel isDisabled={isDisabled} /> </div>)}
                {activeTab === 'odds' && ( /* ... Odds Tab Content ... */ <div id="odds-tab-panel" className="p-3 sm:p-4 h-full"> <OddsDisplayPanel /> </div>)}
                {activeTab === 'history' && ( /* ... History Tab Content ... */ <div id="history-tab-panel" className="p-3 sm:p-4 h-full"> <HistoryPanel /> </div>)}
            </div>

            {/* Pointer Color Picker Modal (unchanged from Response #30) */}
            {isPointerColorModalOpen && ( <Modal isOpen={isPointerColorModalOpen} onClose={handleCancelPointerColor} title="Select Pointer Color" size="sm" footerContent={ <> <button onClick={handleCancelPointerColor} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors" > Cancel </button> <button onClick={handleApplyPointerColor} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors" > Apply Color </button> </> } > <div className="space-y-4 p-1 sm:p-2"> <div className="mx-auto w-full max-w-[200px] sm:max-w-[240px] h-auto aspect-square rounded-md overflow-hidden shadow-lg border border-slate-600"> <HexColorPicker  color={temporaryPointerColor}  onChange={setTemporaryPointerColor} style={{ width: '100%', height: '100%' }} /> </div> <div className="flex items-center space-x-2 pt-2"> <HexColorInput color={temporaryPointerColor} onChange={setTemporaryPointerColor} prefixed alpha={false} className="flex-grow w-full px-3 py-2 bg-slate-700 border border-slate-500 text-slate-100 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:border-sky-500 focus:ring-sky-500 text-sm" /> <div className="w-8 h-8 rounded border-2 border-slate-500 flex-shrink-0 shadow-inner" style={{ backgroundColor: temporaryPointerColor }} title={`Preview: ${temporaryPointerColor}`} ></div> </div> </div> </Modal> )}
        </div>
    );
};
SettingsPanelContent.propTypes = { onShuffleNTimes: PropTypes.func.isRequired };
export default SettingsPanelContent;
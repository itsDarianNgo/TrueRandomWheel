// src/features/wheel/SettingsPanelContent.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';

import AddItemForm from '../items/AddItemForm';
import CurrentItemsList from '../items/CurrentItemsList';
import HistoryPanel from '../history/HistoryPanel';

import {
    selectWheelSettings, selectWheelStatus,
    setPointerPosition, toggleRemoveOnHit, setShuffleCount as setReduxShuffleCount,
    setPageBackgroundImageUrl, setWheelSurfaceImageUrl, // New image actions
    selectPageBackgroundImageUrl, selectWheelSurfaceImageUrl // New image selectors
} from './wheelSlice';
import { selectAllItems } from '../items/itemSlice';

// Icons (same as before)
const IconArrowUp = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"> <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" /> </svg> );
const IconArrowRight = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"> <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /> </svg> );
const IconArrowDown = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"> <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M19 12l-7 7-7-7" /> </svg> );
const IconArrowLeft = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"> <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h15" /> </svg> );
const IconInformationCircle = ({ className = "w-4 h-4" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"> <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> </svg>);
const IconX = ({ className = "w-4 h-4" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);

const pointerIconsMap = { /* ... same ... */ top: { IconComponent: IconArrowUp, label: "Top" }, right: { IconComponent: IconArrowRight, label: "Right" }, bottom: { IconComponent: IconArrowDown, label: "Bottom" }, left: { IconComponent: IconArrowLeft, label: "Left" }, };
const POINTER_POSITIONS_ORDER_PANEL = ['top', 'right', 'bottom', 'left'];

const UrlInputGroup = ({ label, id, currentUrl, onSetUrl, onClearUrl, disabled, error }) => {
    const [localUrl, setLocalUrl] = useState(currentUrl || '');
    const [showError, setShowError] = useState('');

    useEffect(() => {
        setLocalUrl(currentUrl || ''); // Sync with Redux store
        if (error) setShowError(error); // Show error from parent if any initial one
    }, [currentUrl, error]);

    const isValidUrlScheme = (url) => /^(https?:\/\/)/i.test(url);

    const handleSet = () => {
        if (localUrl.trim() === '') { // If user types then clears and sets
            onSetUrl(null); // Treat as clear
            setShowError('');
            return;
        }
        if (isValidUrlScheme(localUrl)) {
            onSetUrl(localUrl);
            setShowError('');
        } else {
            setShowError('Invalid URL. Must start with http:// or https://');
        }
    };

    const handleClear = () => {
        setLocalUrl('');
        onClearUrl();
        setShowError('');
    };

    const handleChange = (e) => {
        setLocalUrl(e.target.value);
        if (showError) setShowError(''); // Clear error on type
    };

    return (
        <div className="space-y-2">
            <label htmlFor={id} className="block text-sm font-medium text-slate-300">{label}</label>
            <div className="flex space-x-2">
                <input
                    type="text"
                    id={id}
                    value={localUrl}
                    onChange={handleChange}
                    placeholder="Enter image URL (http:// or https://)"
                    disabled={disabled}
                    className={`flex-grow px-3 py-2 bg-slate-700 border text-slate-100 rounded-md shadow-sm focus:outline-none focus:ring-1  transition-colors ${showError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-600 focus:border-sky-500 focus:ring-sky-500'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {localUrl && (
                    <button type="button" onClick={handleClear} disabled={disabled} title="Clear URL" className={`p-2 bg-slate-600 hover:bg-red-700 text-slate-300 hover:text-white rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-red-500 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}> <IconX/> </button>
                )}
            </div>
            <button type="button" onClick={handleSet} disabled={disabled || (currentUrl === localUrl && !showError) } title="Set or Apply URL" className={`w-full mt-1 px-3 py-1.5 text-xs bg-sky-600 hover:bg-sky-700 text-white rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500 ${disabled || (currentUrl === localUrl && !showError) ? 'opacity-50 cursor-not-allowed !bg-sky-700' : ''}`}> Set Image </button>
            {showError && <p className="mt-1 text-xs text-red-500 animate-fade-in">{showError}</p>}
        </div>
    );
};
UrlInputGroup.propTypes = { label: PropTypes.string.isRequired, id: PropTypes.string.isRequired, currentUrl: PropTypes.string, onSetUrl: PropTypes.func.isRequired, onClearUrl: PropTypes.func.isRequired, disabled: PropTypes.bool, error: PropTypes.string };


const SettingsPanelContent = ({ onShuffleNTimes }) => {
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState('settings'); // 'settings', 'history', 'appearance'

    const wheelSettings = useSelector(selectWheelSettings);
    const wheelStatus = useSelector(selectWheelStatus);
    const allItems = useSelector(selectAllItems);
    const pageBgUrlFromStore = useSelector(selectPageBackgroundImageUrl);
    const wheelSurfaceUrlFromStore = useSelector(selectWheelSurfaceImageUrl);

    const itemsCount = allItems.length;
    const isDisabled = wheelStatus !== 'idle';

    const [localShuffleCountInput, setLocalShuffleCountInput] = useState(wheelSettings.shuffleCount.toString());
    useEffect(() => { setLocalShuffleCountInput(wheelSettings.shuffleCount.toString()); }, [wheelSettings.shuffleCount]);

    const handlePointerPositionChange = (newPosition) => dispatch(setPointerPosition(newPosition));
    const handleRemoveOnHitChange = () => dispatch(toggleRemoveOnHit());
    const handleShuffleCountInputChange = (e) => { /* ... same as Response #18 ... */ const val = e.target.value; setLocalShuffleCountInput(val); const count = parseInt(val, 10); if (!isNaN(count) && count >= 1) { dispatch(setReduxShuffleCount(count)); } else if (val === "") { dispatch(setReduxShuffleCount(1)); } };

    const handleSetPageBg = (url) => dispatch(setPageBackgroundImageUrl(url));
    const handleClearPageBg = () => dispatch(setPageBackgroundImageUrl(null));
    const handleSetWheelSurface = (url) => dispatch(setWheelSurfaceImageUrl(url));
    const handleClearWheelSurface = () => dispatch(setWheelSurfaceImageUrl(null));

    const tabButtonClass = (tabName) => `flex-1 py-3 px-2 text-xs sm:text-sm font-semibold text-center transition-all duration-150 ease-in-out focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-800 rounded-t-md ${activeTab === tabName ? 'bg-slate-700/60 text-sky-300 border-b-2 border-sky-400 shadow-inner' : 'text-slate-400 hover:bg-slate-700/30 hover:text-slate-200'}`;

    return (
        <div className={`flex flex-col h-full ${isDisabled ? 'opacity-70 pointer-events-none' : ''}`}>
            <div className="flex border-b border-slate-700 flex-shrink-0 bg-slate-800">
                <button onClick={() => setActiveTab('settings')} disabled={isDisabled} className={tabButtonClass('settings')} aria-pressed={activeTab === 'settings'} role="tab">Controls & Items</button>
                <button onClick={() => setActiveTab('appearance')} disabled={isDisabled} className={tabButtonClass('appearance')} aria-pressed={activeTab === 'appearance'} role="tab">Appearance</button>
                <button onClick={() => setActiveTab('history')} disabled={isDisabled} className={tabButtonClass('history')} aria-pressed={activeTab === 'history'} role="tab">Spin History</button>
            </div>

            <div className="flex-grow overflow-y-auto scrollbar-hide bg-slate-800">
                {activeTab === 'settings' && ( /* ... Controls & Items tab content same as Response #18 ... */
                    <div id="settings-tab-panel" role="tabpanel" aria-labelledby="settings-tab" className="p-3 sm:p-4 space-y-6">
                        <section className="p-4 bg-slate-700/60 rounded-lg shadow"> <h4 id="pointer-position-group-label-panel" className="text-base sm:text-md font-semibold text-sky-300 mb-3 text-center">Pointer Position</h4> <div role="group" aria-labelledby="pointer-position-group-label-panel" className={`flex w-full rounded-md shadow-sm border border-slate-600 overflow-hidden ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}> {POINTER_POSITIONS_ORDER_PANEL.map((positionKey, index) => { const isActive = wheelSettings.pointerPosition === positionKey; const { IconComponent, label } = pointerIconsMap[positionKey]; let segmentClasses = index > 0 ? "border-l border-slate-500 " : ""; return ( <button key={positionKey} type="button" onClick={() => handlePointerPositionChange(positionKey)} disabled={isDisabled} className={`flex-1 flex flex-col items-center justify-center p-2.5 sm:p-3 text-xs sm:text-sm transition-colors duration-150 ease-in-out focus:outline-none focus-visible:z-10 focus-visible:ring-1 focus-visible:ring-sky-400 focus-visible:ring-offset-0 ${segmentClasses} ${isActive ? 'bg-sky-600 text-white shadow-inner' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'} ${isDisabled ? 'pointer-events-none hover:bg-slate-700' : ''}`} aria-pressed={isActive} aria-label={`Set pointer to ${label}`}> <IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 sm:mb-1 ${isActive ? 'text-white' : 'text-slate-400'}`} /> <span className="font-medium">{label}</span> </button> ); })} </div> </section>
                        <section className="p-4 bg-slate-700/60 rounded-lg shadow"> <h4 className="text-base sm:text-md font-semibold text-sky-300 mb-3 text-center">Spin Behavior</h4> <div className={`flex items-center justify-between p-3 bg-slate-700 rounded-md transition-opacity ${isDisabled ? 'opacity-60' : ''}`}> <div className="flex items-center space-x-2"> <label htmlFor="removeOnHitToggle" className="text-sm text-slate-200 select-none cursor-pointer flex-grow">Auto-Remove Winner</label> <span className="cursor-help text-slate-400 hover:text-sky-400 transition-colors" title="If enabled, the winning item will be removed from the wheel after its win is acknowledged."><IconInformationCircle className="w-4 h-4"/></span> </div> <button type="button" id="removeOnHitToggle" role="switch" aria-checked={wheelSettings.removeOnHit} onClick={handleRemoveOnHitChange} disabled={isDisabled} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-700 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${wheelSettings.removeOnHit ? 'bg-sky-500' : 'bg-slate-600'}`}> <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform shadow ${wheelSettings.removeOnHit ? 'translate-x-6' : 'translate-x-1'}`} /> </button> </div> </section>
                        <section className="p-4 bg-slate-700/60 rounded-lg shadow"> <h4 className="text-base sm:text-md font-semibold text-sky-300 mb-4 text-center">Shuffle Wheel</h4> <div className="space-y-3"> <div className="flex items-center space-x-3"> <label htmlFor="shuffleCountInput" className="text-sm text-slate-200 flex-shrink-0">Shuffle Count:</label> <input type="number" id="shuffleCountInput" value={localShuffleCountInput} onChange={handleShuffleCountInputChange} min="1" disabled={isDisabled || itemsCount < 2} className="w-24 px-3 py-1.5 bg-slate-700 border border-slate-600 text-slate-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:opacity-50 disabled:cursor-not-allowed" /> </div> <button type="button" onClick={onShuffleNTimes} disabled={isDisabled || itemsCount < 2} className="w-full px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-700/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-sky-600" > Shuffle {wheelSettings.shuffleCount >= 1 && itemsCount >=2 ? wheelSettings.shuffleCount : ''} Times </button> </div> </section>
                        <AddItemForm /> <CurrentItemsList />
                    </div>
                )}
                {activeTab === 'appearance' && (
                    <div id="appearance-tab-panel" role="tabpanel" aria-labelledby="appearance-tab" className="p-3 sm:p-4 space-y-6">
                        <section className="p-4 bg-slate-700/60 rounded-lg shadow">
                            <h4 className="text-md font-semibold text-sky-300 mb-3 text-center">Customize Appearance</h4>
                            <UrlInputGroup
                                label="Page Background Image URL"
                                id="pageBgUrl"
                                currentUrl={pageBgUrlFromStore}
                                onSetUrl={handleSetPageBg}
                                onClearUrl={handleClearPageBg}
                                disabled={isDisabled}
                            />
                        </section>
                        <section className="p-4 bg-slate-700/60 rounded-lg shadow">
                            <UrlInputGroup
                                label="Wheel Surface Image URL"
                                id="wheelSurfaceUrl"
                                currentUrl={wheelSurfaceUrlFromStore}
                                onSetUrl={handleSetWheelSurface}
                                onClearUrl={handleClearWheelSurface}
                                disabled={isDisabled}
                            />
                        </section>
                    </div>
                )}
                {activeTab === 'history' && ( /* ... History tab content same as Response #18 ... */
                    <div id="history-tab-panel" role="tabpanel" aria-labelledby="history-tab" className="h-full"> <HistoryPanel /> </div>
                )}
            </div>
        </div>
    );
};
SettingsPanelContent.propTypes = { onShuffleNTimes: PropTypes.func.isRequired };
export default SettingsPanelContent;
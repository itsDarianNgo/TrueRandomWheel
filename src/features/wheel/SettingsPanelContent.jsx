// src/features/wheel/SettingsPanelContent.jsx
import React, { useState } // Removed direct prop drilling for items/handlers
    from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux'; // Added

import AddItemForm from '../items/AddItemForm'; // Adjusted path if moved
import CurrentItemsList from '../items/CurrentItemsList'; // Adjusted path if moved
import HistoryPanel from '../history/HistoryPanel';

import {
    selectWheelSettings,
    selectWheelStatus,
    setPointerPosition,
    toggleRemoveOnHit,
    setShuffleCount as setReduxShuffleCount, // aliased to avoid conflict with local state if any
} from './wheelSlice'; // Adjust path
import { selectAllItems } from '../items/itemSlice'; // To get itemsCount

// Icons (ensure these are defined or imported)
const IconArrowUp = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"> <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" /> </svg> );
const IconArrowRight = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"> <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /> </svg> );
const IconArrowDown = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"> <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M19 12l-7 7-7-7" /> </svg> );
const IconArrowLeft = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"> <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h15" /> </svg> );
const IconInformationCircle = ({ className = "w-4 h-4" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"> <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> </svg>);

const pointerIconsMap = { /* ... same ... */ top: { IconComponent: IconArrowUp, label: "Top" }, right: { IconComponent: IconArrowRight, label: "Right" }, bottom: { IconComponent: IconArrowDown, label: "Bottom" }, left: { IconComponent: IconArrowLeft, label: "Left" }, };
const POINTER_POSITIONS_ORDER_PANEL = ['top', 'right', 'bottom', 'left'];


// Props that will be passed from the new Page level component (e.g. WheelPage.jsx)
// For Phase 1, we still need onShuffleNTimes to be passed if thunk isn't ready.
// Let's assume for Phase 1, onShuffleNTimes is still a prop from parent,
// parent will dispatch thunk in Phase 2.
const SettingsPanelContent = ({ onShuffleNTimes }) => {
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState('settings');

    const wheelSettings = useSelector(selectWheelSettings);
    const wheelStatus = useSelector(selectWheelStatus);
    const allItems = useSelector(selectAllItems);

    const itemsCount = allItems.length;
    const isDisabled = wheelStatus !== 'idle'; // Overall disabled state for controls

    // Local state for shuffle count input, synced with Redux
    const [localShuffleCountInput, setLocalShuffleCountInput] = useState(wheelSettings.shuffleCount.toString());

    const handlePointerPositionChange = (newPosition) => {
        dispatch(setPointerPosition(newPosition));
    };

    const handleRemoveOnHitChange = () => {
        dispatch(toggleRemoveOnHit());
    };

    const handleShuffleCountInputChange = (e) => {
        setLocalShuffleCountInput(e.target.value); // Update local state immediately for responsiveness
        // Debounce or onBlur dispatch to Redux is an option, for now direct:
        const count = parseInt(e.target.value, 10);
        if (!isNaN(count) && count >= 1) {
            dispatch(setReduxShuffleCount(count));
        } else if (e.target.value === "") {
            // Allow empty input, but Redux store might hold last valid or default to 1
            dispatch(setReduxShuffleCount(1)); // Or some other handling for empty
        }
    };

    // Update local input if Redux store changes from elsewhere (e.g. initial load)
    React.useEffect(() => {
        setLocalShuffleCountInput(wheelSettings.shuffleCount.toString());
    }, [wheelSettings.shuffleCount]);


    return (
        <div className={`flex flex-col h-full ${isDisabled ? 'opacity-70 pointer-events-none' : ''}`}>
            {/* Tab Navigation ... same as Response #5 ... */}
            <div className="flex border-b border-slate-700 flex-shrink-0 bg-slate-800">
                <button
                    onClick={() => setActiveTab('settings')}
                    disabled={isDisabled}
                    className={`flex-1 py-3 px-2 text-sm font-semibold text-center transition-all duration-150 ease-in-out focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-800 rounded-t-md ${activeTab === 'settings' ? 'bg-slate-700/60 text-sky-300 border-b-2 border-sky-400 shadow-inner' : 'text-slate-400 hover:bg-slate-700/30 hover:text-slate-200'}`}
                    aria-pressed={activeTab === 'settings'} role="tab" aria-controls="settings-tab-panel" id="settings-tab" >
                    Controls & Items
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    disabled={isDisabled}
                    className={`flex-1 py-3 px-2 text-sm font-semibold text-center transition-all duration-150 ease-in-out focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-800 rounded-t-md ${activeTab === 'history' ? 'bg-slate-700/60 text-sky-300 border-b-2 border-sky-400 shadow-inner' : 'text-slate-400 hover:bg-slate-700/30 hover:text-slate-200'}`}
                    aria-pressed={activeTab === 'history'} role="tab" aria-controls="history-tab-panel" id="history-tab" >
                    Spin History
                </button>
            </div>

            <div className="flex-grow overflow-y-auto scrollbar-hide bg-slate-800">
                {activeTab === 'settings' && (
                    <div id="settings-tab-panel" role="tabpanel" aria-labelledby="settings-tab" className="p-3 sm:p-4 space-y-6">
                        {/* Pointer Position Section */}
                        <section className="p-4 bg-slate-700/60 rounded-lg shadow">
                            <h4 id="pointer-position-group-label-panel" className="text-base sm:text-md font-semibold text-sky-300 mb-3 text-center">Pointer Position</h4>
                            <div role="group" aria-labelledby="pointer-position-group-label-panel" className={`flex w-full rounded-md shadow-sm border border-slate-600 overflow-hidden ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                {POINTER_POSITIONS_ORDER_PANEL.map((positionKey, index) => {
                                    const isActive = wheelSettings.pointerPosition === positionKey; /* Use Redux state */
                                    const { IconComponent, label } = pointerIconsMap[positionKey];
                                    let segmentClasses = index > 0 ? "border-l border-slate-500 " : "";
                                    return (
                                        <button key={positionKey} type="button" onClick={() => handlePointerPositionChange(positionKey)} disabled={isDisabled}
                                                className={`flex-1 flex flex-col items-center justify-center p-2.5 sm:p-3 text-xs sm:text-sm transition-colors duration-150 ease-in-out focus:outline-none focus-visible:z-10 focus-visible:ring-1 focus-visible:ring-sky-400 focus-visible:ring-offset-0 ${segmentClasses} ${isActive ? 'bg-sky-600 text-white shadow-inner' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'} ${isDisabled ? 'pointer-events-none hover:bg-slate-700' : ''}`}
                                                aria-pressed={isActive} aria-label={`Set pointer to ${label}`}>
                                            <IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 sm:mb-1 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                            <span className="font-medium">{label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Spin Behavior Section */}
                        <section className="p-4 bg-slate-700/60 rounded-lg shadow">
                            <h4 className="text-base sm:text-md font-semibold text-sky-300 mb-3 text-center">Spin Behavior</h4>
                            <div className={`flex items-center justify-between p-3 bg-slate-700 rounded-md transition-opacity ${isDisabled ? 'opacity-60' : ''}`}>
                                <div className="flex items-center space-x-2">
                                    <label htmlFor="removeOnHitToggle" className="text-sm text-slate-200 select-none cursor-pointer flex-grow">Auto-Remove Winner</label>
                                    <span className="cursor-help text-slate-400 hover:text-sky-400 transition-colors" title="If enabled, the winning item will be removed from the wheel after its win is acknowledged."><IconInformationCircle className="w-4 h-4"/></span>
                                </div>
                                <button type="button" id="removeOnHitToggle" role="switch" aria-checked={wheelSettings.removeOnHit} /* Use Redux state */
                                        onClick={handleRemoveOnHitChange} disabled={isDisabled}
                                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-700 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${wheelSettings.removeOnHit ? 'bg-sky-500' : 'bg-slate-600'}`}>
                                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform shadow ${wheelSettings.removeOnHit ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </section>

                        {/* Shuffle Wheel Options Section */}
                        <section className="p-4 bg-slate-700/60 rounded-lg shadow">
                            <h4 className="text-base sm:text-md font-semibold text-sky-300 mb-4 text-center">Shuffle Wheel</h4>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-3">
                                    <label htmlFor="shuffleCountInput" className="text-sm text-slate-200 flex-shrink-0">Shuffle Count:</label>
                                    <input
                                        type="number" id="shuffleCountInput" value={localShuffleCountInput} /* Use local state for input value */
                                        onChange={handleShuffleCountInputChange} min="1"
                                        disabled={isDisabled || itemsCount < 2}
                                        className="w-24 px-3 py-1.5 bg-slate-700 border border-slate-600 text-slate-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                </div>
                                <button
                                    type="button" onClick={onShuffleNTimes} /* Prop for now, will become thunk dispatch */
                                    disabled={isDisabled || itemsCount < 2}
                                    className="w-full px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-700/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-sky-600"
                                >
                                    Shuffle {wheelSettings.shuffleCount >= 1 && itemsCount >=2 ? wheelSettings.shuffleCount : ''} Times
                                </button>
                            </div>
                        </section>

                        {/* AddItemForm and CurrentItemsList now connect to Redux internally */}
                        <AddItemForm />
                        <CurrentItemsList />
                    </div>
                )}
                {activeTab === 'history' && (
                    <div id="history-tab-panel" role="tabpanel" aria-labelledby="history-tab" className="h-full">
                        <HistoryPanel />
                    </div>
                )}
            </div>
        </div>
    );
};

SettingsPanelContent.propTypes = {
    // Removed props that are now handled by Redux useSelector within the component
    onShuffleNTimes: PropTypes.func.isRequired, // Still needed for Phase 1 if thunk not yet implemented
};

export default SettingsPanelContent;
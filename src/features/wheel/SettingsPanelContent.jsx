// src/features/wheel/SettingsPanelContent.jsx
import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

// Item Management Components
import AddItemForm from '../itemManagement/AddItemForm';
import CurrentItemsList from '../itemManagement/CurrentItemsList';

// History Component
import HistoryPanel from '../history/HistoryPanel';

// Settings Slice Actions & Selectors
import {
    setWheelBackgroundImage,
    clearWheelBackgroundImage,
    selectWheelBackgroundImageURL
} from '../settings/settingsSlice';

// SVG Icon Components
const IconArrowUp = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"> <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" /> </svg> );
const IconArrowRight = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"> <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /> </svg> );
const IconArrowDown = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"> <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M19 12l-7 7-7-7" /> </svg> );
const IconArrowLeft = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"> <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h15" /> </svg> );
const IconInformationCircle = ({ className = "w-4 h-4" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"> <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> </svg>);
const IconUpload = ({ className = "w-5 h-5 mr-2" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>);
const IconTrash = ({ className = "w-4 h-4 mr-1.5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);
const IconChevronDown = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>);
const IconChevronUp = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>);

const pointerIconsMap = {
    top: { IconComponent: IconArrowUp, label: "Top" },
    right: { IconComponent: IconArrowRight, label: "Right" },
    bottom: { IconComponent: IconArrowDown, label: "Bottom" },
    left: { IconComponent: IconArrowLeft, label: "Left" },
};
const POINTER_POSITIONS_ORDER_PANEL = ['top', 'right', 'bottom', 'left'];
const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const SettingsPanelContent = ({
                                  isDisplaySpinning,
                                  currentPointerPosition,
                                  onDirectPointerPositionChange,
                                  removeOnHit,
                                  onRemoveOnHitChange,
                                  shuffleCountInput,
                                  onShuffleCountInputChange,
                                  onShuffleNTimes,
                                  itemsCount,
                                  onAddItem,
                                  currentItems,
                                  onRemoveItemGroup,
                                  onIncrementItemGroupQuantity,
                                  onDecrementItemGroupQuantity,
                              }) => {
    const [activeTab, setActiveTab] = useState('settings');
    const [isAppearanceExpanded, setIsAppearanceExpanded] = useState(false);

    const dispatch = useDispatch();
    const currentBackgroundImageURL = useSelector(selectWheelBackgroundImageURL);
    const [imageUploadError, setImageUploadError] = useState('');
    const fileInputRef = useRef(null);

    const isDisabled = isDisplaySpinning;

    const handleImageFileChange = (event) => {
        setImageUploadError('');
        const file = event.target.files && event.target.files[0];
        if (!file) {
            if(fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            setImageUploadError(`Invalid file type. Please use JPG, PNG, GIF, or WebP.`);
            if(fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
            setImageUploadError(`Image too large. Max size: ${MAX_FILE_SIZE_MB}MB.`);
            if(fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target && typeof e.target.result === 'string') {
                dispatch(setWheelBackgroundImage(e.target.result));
            } else {
                setImageUploadError('Could not read image file.');
            }
        };
        reader.onerror = () => {
            setImageUploadError('Error reading image file.');
        };
        reader.readAsDataURL(file);
    };
    const handleRemoveImage = () => {
        dispatch(clearWheelBackgroundImage());
        setImageUploadError('');
        if(fileInputRef.current) fileInputRef.current.value = '';
    };
    const triggerFileInput = () => {
        setImageUploadError('');
        fileInputRef.current?.click();
    };

    return (
        <div className={`flex flex-col h-full ${isDisabled ? 'opacity-70 pointer-events-none' : ''}`}>
            {/* Tab Navigation */}
            <div className="flex border-b border-slate-700 flex-shrink-0 bg-slate-800 sticky top-0 z-10">
                <button
                    onClick={() => setActiveTab('settings')}
                    disabled={isDisabled}
                    className={`flex-1 py-3 px-2 text-sm font-semibold text-center transition-all duration-150 ease-in-out focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-800 rounded-t-md ${activeTab === 'settings' ? 'bg-slate-700/60 text-sky-300 border-b-2 border-sky-400 shadow-inner' : 'text-slate-400 hover:bg-slate-700/30 hover:text-slate-200'}`}
                    aria-pressed={activeTab === 'settings'} role="tab" aria-controls="settings-tab-panel" id="settings-tab"
                > Controls & Items </button>
                <button
                    onClick={() => setActiveTab('history')}
                    disabled={isDisabled}
                    className={`flex-1 py-3 px-2 text-sm font-semibold text-center transition-all duration-150 ease-in-out focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-800 rounded-t-md ${activeTab === 'history' ? 'bg-slate-700/60 text-sky-300 border-b-2 border-sky-400 shadow-inner' : 'text-slate-400 hover:bg-slate-700/30 hover:text-slate-200'}`}
                    aria-pressed={activeTab === 'history'} role="tab" aria-controls="history-tab-panel" id="history-tab"
                > Spin History </button>
            </div>

            {/* Tab Content Area */}
            <div className="flex-grow overflow-y-auto scrollbar-hide bg-slate-800">
                {activeTab === 'settings' && (
                    <div id="settings-tab-panel" role="tabpanel" aria-labelledby="settings-tab" className="p-3 sm:p-4 space-y-6">

                        {/* Section 1: Pointer Position */}
                        <section className="p-4 bg-slate-700/60 rounded-lg shadow-md">
                            <h4 id="pointer-position-group-label-panel" className="text-base font-semibold text-sky-300 mb-3 text-center">Pointer Position</h4>
                            <div role="group" aria-labelledby="pointer-position-group-label-panel" className={`flex w-full rounded-md shadow-sm border border-slate-600 overflow-hidden ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                {POINTER_POSITIONS_ORDER_PANEL.map((positionKey, index) => {
                                    const isActive = currentPointerPosition === positionKey;
                                    const { IconComponent, label } = pointerIconsMap[positionKey];
                                    let segmentClasses = "";
                                    if (index > 0) segmentClasses += "border-l border-slate-500 ";
                                    return ( <button key={positionKey} type="button" onClick={() => onDirectPointerPositionChange(positionKey)} disabled={isDisabled} className={`flex-1 flex flex-col items-center justify-center p-2.5 sm:p-3 text-xs sm:text-sm transition-colors duration-150 ease-in-out focus:outline-none focus-visible:z-10 focus-visible:ring-1 focus-visible:ring-sky-400 focus-visible:ring-offset-0 ${segmentClasses} ${isActive ? 'bg-sky-600 text-white shadow-inner' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'} ${isDisabled ? 'pointer-events-none hover:bg-slate-700' : ''}`} aria-pressed={isActive} aria-label={`Set pointer to ${label}`}><IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 sm:mb-1 ${isActive ? 'text-white' : 'text-slate-400'}`} /><span className="font-medium">{label}</span></button> );
                                })}
                            </div>
                        </section>

                        {/* Section 2: Spin Behavior */}
                        <section className="p-4 bg-slate-700/60 rounded-lg shadow-md">
                            <h4 className="text-base font-semibold text-sky-300 mb-3 text-center">Spin Behavior</h4>
                            <div className={`flex items-center justify-between p-3 bg-slate-700 rounded-md transition-opacity ${isDisabled ? 'opacity-60' : ''}`}>
                                <div className="flex items-center space-x-2"> <label htmlFor="removeOnHitToggle" className="text-sm text-slate-200 select-none cursor-pointer flex-grow">Auto-Remove Winner</label> <span className="cursor-help text-slate-400 hover:text-sky-400 transition-colors" title="If enabled, the winning item will be removed from the wheel after its win is acknowledged."><IconInformationCircle className="w-4 h-4"/></span> </div> <button type="button" id="removeOnHitToggle" role="switch" aria-checked={removeOnHit} onClick={onRemoveOnHitChange} disabled={isDisabled} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-700 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${removeOnHit ? 'bg-sky-500' : 'bg-slate-600'}`}><span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform shadow ${removeOnHit ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                            </div>
                        </section>

                        {/* Section 3: Shuffle Wheel */}
                        <section className="p-4 bg-slate-700/60 rounded-lg shadow-md">
                            <h4 className="text-base font-semibold text-sky-300 mb-4 text-center">Shuffle Wheel</h4>
                            <div className="space-y-3"> <div className="flex items-center space-x-3"> <label htmlFor="shuffleCountInput" className="text-sm text-slate-200 flex-shrink-0">Shuffle Count:</label> <input type="number" id="shuffleCountInput" value={shuffleCountInput} onChange={onShuffleCountInputChange} min="1" disabled={isDisabled || itemsCount < 2} className="w-24 px-3 py-1.5 bg-slate-700 border border-slate-600 text-slate-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"/> </div> <button type="button" onClick={onShuffleNTimes} disabled={isDisabled || itemsCount < 2} className="w-full px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-700/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-sky-600"> Shuffle {parseInt(shuffleCountInput, 10) >= 1 && itemsCount >=2 ? parseInt(shuffleCountInput, 10) : ''} Times </button> </div>
                        </section>

                        {/* Section 4: Add Item Form */}
                        <AddItemForm onAddItem={onAddItem} isSpinning={isDisabled} />

                        {/* Section 5: Current Items List */}
                        <CurrentItemsList
                            items={currentItems}
                            onRemoveItemGroup={onRemoveItemGroup}
                            onIncrementItemGroupQuantity={onIncrementItemGroupQuantity}
                            onDecrementItemGroupQuantity={onDecrementItemGroupQuantity}
                            isSpinning={isDisabled}
                            className="w-full"
                        />

                        {/* Section 6: Wheel Appearance (Collapsible) - MOVED TO BOTTOM */}
                        <section className="bg-slate-700/60 rounded-lg shadow-md">
                            <button
                                type="button"
                                onClick={() => setIsAppearanceExpanded(!isAppearanceExpanded)}
                                disabled={isDisabled}
                                className="w-full flex items-center justify-between p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-inset rounded-lg hover:bg-slate-700 transition-colors"
                                aria-expanded={isAppearanceExpanded}
                                aria-controls="wheel-appearance-content"
                            >
                                <h4 className="text-base font-semibold text-sky-300">Wheel Appearance</h4>
                                {isAppearanceExpanded ?
                                    <IconChevronUp className="w-5 h-5 text-sky-300 transition-transform duration-200"/> :
                                    <IconChevronDown className="w-5 h-5 text-sky-300 transition-transform duration-200"/>
                                }
                            </button>
                            {isAppearanceExpanded && (
                                <div id="wheel-appearance-content" className="p-4 border-t border-slate-600/50 space-y-3">
                                    <input type="file" accept={ALLOWED_MIME_TYPES.join(',')} onChange={handleImageFileChange} ref={fileInputRef} className="hidden" id="wheelBgFileInput" disabled={isDisabled} aria-label="Upload wheel background image"/>
                                    <button type="button" onClick={triggerFileInput} disabled={isDisabled} className="w-full flex items-center justify-center px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-700/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                        <IconUpload /> Set Wheel Background
                                    </button>
                                    {currentBackgroundImageURL && (
                                        <div className="mt-3 p-3 bg-slate-700 rounded-md space-y-2 border border-slate-600">
                                            <p className="text-xs text-slate-300 text-center mb-1">Current Background:</p>
                                            <img src={currentBackgroundImageURL} alt="Wheel background preview" className="w-full h-auto max-h-36 object-contain rounded border border-slate-500 shadow-sm mx-auto bg-slate-600/30"/>
                                            <button type="button" onClick={handleRemoveImage} disabled={isDisabled} className="mt-2 w-full flex items-center justify-center px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-red-500 disabled:opacity-50">
                                                <IconTrash /> Remove Background
                                            </button>
                                        </div>
                                    )}
                                    {imageUploadError && ( <p className="mt-1 text-xs text-red-400 text-center p-2 bg-red-900/30 rounded-md border border-red-700 animate-fade-in">{imageUploadError}</p> )}
                                </div>
                            )}
                        </section>
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
    isDisplaySpinning: PropTypes.bool.isRequired,
    currentPointerPosition: PropTypes.string.isRequired,
    onDirectPointerPositionChange: PropTypes.func.isRequired,
    removeOnHit: PropTypes.bool.isRequired,
    onRemoveOnHitChange: PropTypes.func.isRequired,
    shuffleCountInput: PropTypes.string.isRequired,
    onShuffleCountInputChange: PropTypes.func.isRequired,
    onShuffleNTimes: PropTypes.func.isRequired,
    itemsCount: PropTypes.number.isRequired,
    onAddItem: PropTypes.func.isRequired,
    currentItems: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        color: PropTypes.string,
        sourceGroup: PropTypes.string.isRequired,
    })).isRequired,
    onRemoveItemGroup: PropTypes.func.isRequired,
    onIncrementItemGroupQuantity: PropTypes.func.isRequired,
    onDecrementItemGroupQuantity: PropTypes.func.isRequired,
};

export default SettingsPanelContent;
// src/features/effects/components/MediaUrlInputControl.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const IconX = ({ className = "w-4 h-4" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
const IconPlay = ({ className = "w-4 h-4" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);


const MediaUrlInputControl = ({
                                  label,
                                  id,
                                  currentUrl, // from Redux store
                                  onSetUrl,   // (url: string | null) => void
                                  onClearUrl, // () => void
                                  onTestUrl,  // (url: string) => void
                                  disabled,
                                  placeholder = "Enter URL (http:// or https://)",
                                  testButtonText = "Test",
                                  type = "media" // 'media', 'image' (for different test/preview)
                              }) => {
    const [localUrl, setLocalUrl] = useState(currentUrl || '');
    const [errorMessage, setErrorMessage] = useState('');
    const [showPreview, setShowPreview] = useState(false); // For image preview

    useEffect(() => {
        setLocalUrl(currentUrl || '');
        setShowPreview(false); // Reset preview when prop changes
    }, [currentUrl]);

    const isValidHttpUrl = (url) => /^(https?:\/\/)/i.test(url);

    const handleApplyUrl = () => {
        if (!localUrl.trim()) { // Treat empty input as clear on apply
            onSetUrl(null); // Calls Redux action via parent
            setErrorMessage('');
            return;
        }
        if (isValidHttpUrl(localUrl)) {
            onSetUrl(localUrl);
            setErrorMessage('');
        } else {
            setErrorMessage('Invalid URL. Must start with http:// or https://');
        }
    };

    const handleTest = () => {
        if (localUrl && isValidHttpUrl(localUrl)) {
            if (type === 'image') {
                setShowPreview(true); // Toggle preview for image
            } else { // for sound or other media
                onTestUrl(localUrl);
            }
            setErrorMessage('');
        } else if (currentUrl && isValidHttpUrl(currentUrl) && type !== 'image') {
            onTestUrl(currentUrl); // Test current stored URL if local is empty
            setErrorMessage('');
        } else {
            setErrorMessage('Enter a valid URL to test.');
        }
    };


    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="block text-xs font-medium text-slate-400">{label}</label>
            <div className="flex space-x-2">
                <input
                    type="text"
                    id={id}
                    value={localUrl}
                    onChange={(e) => { setLocalUrl(e.target.value); if(errorMessage) setErrorMessage(''); setShowPreview(false); }}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`flex-grow px-3 py-1.5 bg-slate-800 border text-slate-200 text-sm rounded-md shadow-sm focus:outline-none focus:ring-1  transition-colors ${errorMessage && !isValidHttpUrl(localUrl) && localUrl ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-600 focus:border-sky-500 focus:ring-sky-500'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {currentUrl && ( // Show clear only if there's a current URL set in Redux
                    <button type="button" onClick={onClearUrl} disabled={disabled} title="Clear Stored URL" className={`p-2 bg-slate-600 hover:bg-red-700 text-slate-300 hover:text-white rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-red-500 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}> <IconX/> </button>
                )}
            </div>
            <div className="flex space-x-2 mt-1">
                <button
                    type="button"
                    onClick={handleApplyUrl}
                    disabled={disabled || localUrl === (currentUrl || '')} // Disable if local same as stored or empty initially
                    className={`flex-1 px-3 py-1 text-xs bg-sky-600 hover:bg-sky-700 text-white rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:!bg-sky-700`}
                >
                    Set URL
                </button>
                <button
                    type="button"
                    onClick={handleTest}
                    disabled={disabled || (!localUrl.trim() && !currentUrl)} // Disable if no URL to test
                    className={`flex-1 px-3 py-1 text-xs bg-slate-500 hover:bg-slate-400 text-slate-900 rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    <div className="flex items-center justify-center">
                        <IconPlay className="mr-1"/> {testButtonText}
                    </div>
                </button>
            </div>
            {errorMessage && <p className="mt-1 text-xs text-red-500 animate-fade-in">{errorMessage}</p>}
            {type === 'image' && showPreview && localUrl && isValidHttpUrl(localUrl) && (
                <div className="mt-2 p-2 border border-slate-600 rounded-md bg-slate-900 flex justify-center items-center">
                    <img src={localUrl} alt="Preview" className="max-w-full max-h-32 object-contain rounded" onError={() => { setShowPreview(false); setErrorMessage("Failed to load preview image."); }}/>
                </div>
            )}
        </div>
    );
};

MediaUrlInputControl.propTypes = {
    label: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    currentUrl: PropTypes.string,
    onSetUrl: PropTypes.func.isRequired,
    onClearUrl: PropTypes.func.isRequired,
    onTestUrl: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    placeholder: PropTypes.string,
    testButtonText: PropTypes.string,
    type: PropTypes.oneOf(['media', 'image']),
};

export default MediaUrlInputControl;
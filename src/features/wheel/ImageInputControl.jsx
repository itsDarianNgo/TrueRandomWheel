// src/features/wheel/components/ImageInputControl.jsx
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

// Re-usable Icon components (can be moved to a shared icons file)
const IconX = ({ className = "w-4 h-4" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
const IconUpload = ({ className = "w-4 h-4" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>);

const ImageInputControl = ({
                               label,
                               idPrefix, // e.g., "pageBg" or "wheelSurface" to make IDs unique
                               currentImageUrl, // From Redux store (can be http(s) or Data URL)
                               onSetImageUrl,   // Dispatches action to set Redux state (string | null)
                               disabled,
                           }) => {
    const [urlInputValue, setUrlInputValue] = useState('');
    const [selectedFileName, setSelectedFileName] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const fileInputRef = useRef(null);

    // Sync local UI with currentImageUrl from Redux
    useEffect(() => {
        if (currentImageUrl) {
            if (currentImageUrl.startsWith('data:image')) {
                // If it's a Data URL, it was likely from an upload.
                // We don't store the original filename in Redux state (Data URL doesn't have it).
                // So, if `selectedFileName` isn't already set (from current session upload), show generic.
                if (!selectedFileName && currentImageUrl) { // Ensure selectedFileName is only set if it's not already from a current upload action
                    setSelectedFileName("Uploaded image active");
                }
                setUrlInputValue(''); // Clear URL input if a Data URL is active
            } else if (currentImageUrl.startsWith('http')) {
                setUrlInputValue(currentImageUrl);
                setSelectedFileName(null); // Clear file name if URL is active
            } else { // Unrecognized or cleared
                setUrlInputValue('');
                setSelectedFileName(null);
            }
        } else { // currentImageUrl is null
            setUrlInputValue('');
            setSelectedFileName(null);
        }
        setErrorMessage(''); // Clear any previous errors when prop changes
    }, [currentImageUrl]); // Removed selectedFileName from deps to avoid loop

    const isValidUrlScheme = (url) => /^(https?:\/\/)/i.test(url);

    const handleSetFromUrl = () => {
        if (disabled) return;
        const trimmedUrl = urlInputValue.trim();
        if (trimmedUrl === '') {
            // If user clears URL input and hits "Set", treat as clear.
            // Or, we can prevent this and require "Clear Image" button.
            // For now, let's require "Clear Image" for explicit clearing.
            // If input is empty, do nothing or show error.
            setErrorMessage("URL input is empty. Use 'Clear Image' to remove.");
            return;
        }
        if (isValidUrlScheme(trimmedUrl)) {
            onSetImageUrl(trimmedUrl); // This will update currentImageUrl, triggering useEffect
            setSelectedFileName(null); // URL input takes precedence
            setErrorMessage('');
        } else {
            setErrorMessage('Invalid URL. Must start with http:// or https://');
        }
    };

    const handleFileUpload = (event) => {
        if (disabled) return;
        const file = event.target.files && event.target.files[0];
        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            setErrorMessage('Invalid file type. Please select an image.');
            if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
            return;
        }

        // Optional: Basic size warning (e.g., > 2MB) - not a hard block for MVP
        if (file.size > 2 * 1024 * 1024) { // 2MB
            // setErrorMessage("Warning: Large file selected (>2MB), may impact performance.");
            // Allow proceeding for MVP
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            onSetImageUrl(dataUrl); // This updates Redux store
            setSelectedFileName(file.name); // Store filename locally for display
            setUrlInputValue('');         // Clear URL input as file takes precedence
            setErrorMessage('');
        };
        reader.onerror = () => {
            setErrorMessage('Error reading the selected file.');
            setSelectedFileName(null);
        };
        reader.readAsDataURL(file);
        if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input for next selection
    };

    const handleClearImage = () => {
        if (disabled) return;
        onSetImageUrl(null); // This updates Redux store to null
        setUrlInputValue('');
        setSelectedFileName(null);
        setErrorMessage('');
        if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
    };

    const currentSourceDisplay = () => {
        if (currentImageUrl && currentImageUrl.startsWith('data:image')) {
            return `Current: Uploaded - ${selectedFileName || 'Image'}`;
        }
        if (currentImageUrl && currentImageUrl.startsWith('http')) {
            return `Current URL: ${currentImageUrl.substring(0, 30)}${currentImageUrl.length > 30 ? '...' : ''}`;
        }
        return "Current: None";
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">{label}</label>

            <div className="p-2 text-xs text-slate-400 bg-slate-700/50 rounded-md min-h-[2.5rem] flex items-center">
                <span className="truncate" title={currentImageUrl || "None"}>{currentSourceDisplay()}</span>
            </div>

            {/* URL Input */}
            <div className="space-y-1">
                <div className="flex space-x-2 items-center">
                    <input
                        type="text"
                        id={`${idPrefix}-url-input`}
                        value={urlInputValue}
                        onChange={(e) => { setUrlInputValue(e.target.value); if(errorMessage) setErrorMessage('');}}
                        placeholder="Or paste image URL (http:// or https://)"
                        disabled={disabled}
                        className={`flex-grow px-3 py-2 bg-slate-600 border text-slate-100 rounded-md shadow-sm focus:outline-none focus:ring-1 transition-colors ${errorMessage && !isValidUrlScheme(urlInputValue) && urlInputValue ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-500 focus:border-sky-500 focus:ring-sky-500'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                </div>
                <button
                    type="button"
                    onClick={handleSetFromUrl}
                    disabled={disabled || !urlInputValue.trim() || urlInputValue === currentImageUrl}
                    className={`w-full px-3 py-1.5 text-xs bg-sky-600 hover:bg-sky-700 text-white rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:!bg-sky-700/50`}
                >
                    Set from URL
                </button>
            </div>

            <div className="text-center text-xs text-slate-400 my-1">OR</div>

            {/* File Upload */}
            <div className="space-y-1">
                <label
                    htmlFor={`${idPrefix}-file-input`}
                    className={`w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed !bg-emerald-700/50' : ''}`}
                >
                    <IconUpload className="w-4 h-4" />
                    <span>Upload File</span>
                </label>
                <input
                    type="file"
                    id={`${idPrefix}-file-input`}
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={disabled}
                    ref={fileInputRef}
                    className="hidden"
                />
            </div>

            {/* Clear Button */}
            {(currentImageUrl) && (
                <button
                    type="button"
                    onClick={handleClearImage}
                    disabled={disabled}
                    className={`w-full mt-2 px-3 py-1.5 text-xs bg-slate-500 hover:bg-slate-600 text-white rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    Clear Image
                </button>
            )}

            {errorMessage && <p className="mt-1 text-xs text-red-500 animate-fade-in">{errorMessage}</p>}
        </div>
    );
};

ImageInputControl.propTypes = {
    label: PropTypes.string.isRequired,
    idPrefix: PropTypes.string.isRequired,
    currentImageUrl: PropTypes.string, // Can be null
    onSetImageUrl: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
};

export default ImageInputControl;
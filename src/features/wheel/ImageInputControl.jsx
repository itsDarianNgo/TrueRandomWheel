// src/features/wheel/ImageInputControl.jsx
// (Or move to a more generic location like src/components/forms/ if used elsewhere later)
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

// Simple X icon for clear button
const IconX = ({ className = "w-4 h-4" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
const IconUpload = ({ className = "w-4 h-4" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>);


const ImageInputControl = ({
                               label,
                               idPrefix, // To make IDs unique if multiple instances are on a page
                               currentImageUrlFromStore,
                               onSetImageUrl, // (url: string | null) => void
                               disabled,
                           }) => {
    const [urlInputValue, setUrlInputValue] = useState('');
    const [uploadedFileName, setUploadedFileName] = useState(null);
    const [previewSrc, setPreviewSrc] = useState(null);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        setPreviewSrc(currentImageUrlFromStore);
        if (currentImageUrlFromStore) {
            if (currentImageUrlFromStore.startsWith('http')) {
                setUrlInputValue(currentImageUrlFromStore);
                setUploadedFileName(null); // Clear filename if URL is set from store
            } else if (currentImageUrlFromStore.startsWith('data:image')) {
                setUrlInputValue(''); // Clear URL input if data URL is from store
                setUploadedFileName("[Current Uploaded Image]"); // Indicate an upload is active
            } else { // Unrecognized or potentially invalid URL from store
                setUrlInputValue(currentImageUrlFromStore); // Display it for user to see/correct
                setUploadedFileName(null);
            }
        } else { // Null from store (cleared image)
            setUrlInputValue('');
            setUploadedFileName(null);
        }
        setError(''); // Clear local error when store value changes
    }, [currentImageUrlFromStore]);

    const isValidHttpUrlScheme = (url) => /^(https?:\/\/)/i.test(url);

    const handleSetUrlFromInput = () => {
        if (urlInputValue.trim() === '') {
            // If user clears input and clicks set, treat as clear
            onSetImageUrl(null);
            setPreviewSrc(null);
            setUploadedFileName(null);
            setError('');
            return;
        }
        if (isValidHttpUrlScheme(urlInputValue)) {
            onSetImageUrl(urlInputValue);
            setPreviewSrc(urlInputValue); // Update preview immediately
            setUploadedFileName(null);    // Clear any uploaded file indication
            setError('');
        } else {
            setError('Invalid URL. Must start with http:// or https://');
            // setPreviewSrc(null); // Optionally clear preview on invalid URL input
        }
    };

    const handleClearImage = () => {
        onSetImageUrl(null); // Dispatch null to Redux
        setUrlInputValue('');
        setUploadedFileName(null);
        setPreviewSrc(null);
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset file input
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files && event.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Invalid file type. Please select an image.');
                setUploadedFileName(null);
                // setPreviewSrc(null); // Keep previous preview or clear? Let's clear.
                // onSetImageUrl(null); // Clear any existing image in Redux if upload fails early
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
            // Optional: File size check
            // if (file.size > 5 * 1024 * 1024) { // 5MB limit example
            //     setError('File is too large (max 5MB).');
            //     if (fileInputRef.current) fileInputRef.current.value = '';
            //     return;
            // }

            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                onSetImageUrl(dataUrl); // Dispatch Data URL to Redux
                setPreviewSrc(dataUrl);      // Update preview
                setUrlInputValue('');        // Clear URL input field
                setUploadedFileName(file.name); // Show uploaded file name
                setError('');
            };
            reader.onerror = () => {
                setError('Error reading the selected file.');
                setUploadedFileName(null);
                // setPreviewSrc(null);
                // onSetImageUrl(null);
            };
            reader.readAsDataURL(file);
        }
        // Reset file input to allow re-uploading the same file if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-3">
            <p className="block text-sm font-medium text-slate-300">{label}</p>

            {/* URL Input Section */}
            <div className="space-y-1">
                <label htmlFor={`${idPrefix}-url-input`} className="text-xs text-slate-400">Enter Image URL:</label>
                <div className="flex space-x-2">
                    <input
                        type="text"
                        id={`${idPrefix}-url-input`}
                        value={urlInputValue}
                        onChange={(e) => {
                            setUrlInputValue(e.target.value);
                            if (error) setError(''); // Clear error on typing
                            if (e.target.value.trim() !== "" && uploadedFileName) setUploadedFileName(null); // Clear file name if user types URL
                        }}
                        placeholder="http(s)://example.com/image.png"
                        disabled={disabled}
                        className={`flex-grow px-3 py-2 bg-slate-700 border text-slate-100 rounded-md shadow-sm focus:outline-none focus:ring-1 transition-colors ${error && !isValidHttpUrlScheme(urlInputValue) && urlInputValue ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-600 focus:border-sky-500 focus:ring-sky-500'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    {/* "Set URL" button is now part of combined actions below or implicit on blur */}
                </div>
                <button
                    type="button"
                    onClick={handleSetUrlFromInput}
                    disabled={disabled || urlInputValue.trim() === '' || (currentImageUrlFromStore === urlInputValue && !uploadedFileName)}
                    className={`w-full mt-1 px-3 py-1.5 text-xs bg-sky-600 hover:bg-sky-700 text-white rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500 ${disabled || urlInputValue.trim() === '' || (currentImageUrlFromStore === urlInputValue && !uploadedFileName) ? 'opacity-50 cursor-not-allowed !bg-sky-700' : ''}`}
                >
                    Set from URL
                </button>
            </div>

            {/* File Upload Section */}
            <div className="space-y-1">
                <span className="text-xs text-slate-400 block text-center my-1">OR</span>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={disabled}
                    ref={fileInputRef}
                    className="hidden" // Hidden, triggered by button
                    id={`${idPrefix}-file-input`}
                />
                <button
                    type="button"
                    onClick={triggerFileInput}
                    disabled={disabled}
                    className={`w-full flex items-center justify-center space-x-2 px-3 py-2 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <IconUpload className="w-4 h-4"/>
                    <span>Upload Image File</span>
                </button>
                {uploadedFileName && (
                    <p className="text-xs text-slate-400 mt-1 truncate">
                        Selected: <span className="font-medium text-slate-300">{uploadedFileName}</span>
                    </p>
                )}
            </div>

            {/* Preview and Clear */}
            {previewSrc && (
                <div className="mt-2 p-2 border border-slate-600 rounded-md bg-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Preview:</p>
                    <img
                        src={previewSrc}
                        alt="Preview"
                        className="max-w-full h-auto max-h-32 object-contain rounded border border-slate-500"
                        onError={(e) => { e.target.style.display='none'; setError('Preview failed to load.');}} // Hide img if src is broken
                        onLoad={(e) => { e.target.style.display='block'; if(error === 'Preview failed to load.') setError('');}}
                    />
                </div>
            )}

            {/* Unified Clear Button */}
            {(urlInputValue || uploadedFileName || currentImageUrlFromStore) && (
                <button
                    type="button"
                    onClick={handleClearImage}
                    disabled={disabled}
                    className={`w-full mt-2 px-3 py-1.5 text-xs bg-red-700 hover:bg-red-800 text-white rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-red-500 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    Clear Image
                </button>
            )}

            {error && <p className="mt-2 text-xs text-red-500 animate-fade-in">{error}</p>}
        </div>
    );
};

ImageInputControl.propTypes = {
    label: PropTypes.string.isRequired,
    idPrefix: PropTypes.string.isRequired,
    currentImageUrlFromStore: PropTypes.string, // Can be null
    onSetImageUrl: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
};

export default ImageInputControl;
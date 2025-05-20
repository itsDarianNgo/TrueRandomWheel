// src/components/Modal.jsx
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

// Simple SVG X icon for the close button
const IconClose = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const Modal = ({
                   isOpen,
                   onClose,
                   title,
                   children,
                   footerContent,
                   size = 'md', // 'sm', 'md', 'lg', 'xl'
               }) => {
    const modalRef = useRef(null);

    // Handle Escape key press to close modal
    useEffect(() => {
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscapeKey);
            // Focus management: Focus the modal panel itself or first focusable element
            // For simplicity, we'll focus the panel. A more robust solution would find the first button.
            // setTimeout ensures the element is in the DOM and visible.
            setTimeout(() => {
                if (modalRef.current) {
                    modalRef.current.focus();
                }
            }, 0);
        }

        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [isOpen, onClose]);

    // Handle overlay click to close modal
    const handleOverlayClick = (e) => {
        // Only close if the direct overlay is clicked, not content within the modal panel
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) {
        return null;
    }

    let sizeClasses = 'max-w-md'; // Default md
    switch (size) {
        case 'sm': sizeClasses = 'max-w-sm'; break;
        case 'lg': sizeClasses = 'max-w-lg'; break;
        case 'xl': sizeClasses = 'max-w-xl'; break;
        // md is default
    }

    return (
        <div
            className="fixed inset-0 z-[99] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in"
            onClick={handleOverlayClick} // Close on overlay click
            role="dialog" // Accessibility: role
            aria-modal="true" // Accessibility: indicates it's a modal
            aria-labelledby={title ? "modal-title" : undefined} // Accessibility
        >
            <div
                ref={modalRef}
                tabIndex="-1" // Make the div focusable for Esc key and initial focus
                className={`bg-slate-800 rounded-xl shadow-2xl w-full ${sizeClasses} flex flex-col overflow-hidden border border-slate-700 transform transition-all animate-[slideInUp_0.3s_ease-out]`}
                // Added animate-slideInUp (assuming defined in tailwind.config.js, e.g., from 20px up and fade in)
                // style={{ animation: 'slideInUp 0.3s ease-out forwards' }} // if not using tailwind animation name
            >
                {/* Header with Title and Close Button */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                    {title ? (
                        <h3 id="modal-title" className="text-xl font-semibold text-sky-400">
                            {title}
                        </h3>
                    ) : (
                        <span /> // Placeholder to keep close button alignment if no title
                    )}
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-sky-400 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors"
                        aria-label="Close modal"
                    >
                        <IconClose className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body Content */}
                <div className="p-6 text-slate-300 leading-relaxed">
                    {children}
                </div>

                {/* Modal Footer Content */}
                {footerContent && (
                    <div className="px-6 py-4 bg-slate-700/60 rounded-b-xl flex justify-end space-x-3 border-t border-slate-700">
                        {footerContent}
                    </div>
                )}
            </div>
        </div>
    );
};

Modal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    title: PropTypes.string,
    children: PropTypes.node.isRequired,
    footerContent: PropTypes.node,
    size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
};

export default Modal;
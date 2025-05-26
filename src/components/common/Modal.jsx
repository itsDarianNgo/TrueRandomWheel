// src/components/Modal.jsx (or src/components/common/Modal.jsx)
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const IconClose = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);

const Modal = ({
                   isOpen,
                   onClose,
                   title,
                   children,
                   footerContent,
                   size = 'md',
                   panelClassName = '',
               }) => {
    const modalRef = useRef(null);
    const firstFocusableElementRef = useRef(null);

    useEffect(() => {
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscapeKey);
            setTimeout(() => {
                if (firstFocusableElementRef.current) {
                    firstFocusableElementRef.current.focus();
                } else if (modalRef.current) {
                    modalRef.current.focus();
                }
            }, 0);
        }
        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [isOpen, onClose]);

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) {
        return null;
    }

    let sizeClasses = 'max-w-md';
    switch (size) {
        case 'sm': sizeClasses = 'max-w-sm'; break;
        case 'lg': sizeClasses = 'max-w-lg'; break;
        case 'xl': sizeClasses = 'max-w-xl'; break;
        // md is default
    }

    return (
        <div
            // ***** MODIFIED OVERLAY CLASSES *****
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
            // Old: className="fixed inset-0 z-[70] ... bg-slate-900/80 backdrop-blur-sm ..."
            // Options:
            // bg-black/50 (black at 50% opacity) - good general dimming
            // bg-slate-900/50 (slate-900 at 50% opacity)
            // backdrop-blur-none (to remove blur) or backdrop-blur-xs (extra small blur)
            // ***** END MODIFICATION *****
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
            id={title ? `modal-${title.toLowerCase().replace(/\s+/g, '-')}` : undefined} // Optional: Add id for aria-controls
        >
            <div
                ref={modalRef}
                tabIndex="-1" // Make panel focusable
                className={`bg-slate-800 rounded-xl shadow-2xl w-full ${sizeClasses} flex flex-col overflow-hidden border border-slate-700 transform transition-all animate-[slideInUp_0.3s_ease-out] ${panelClassName}`}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                    {title ? (
                        <h3 id={title ? "modal-title" : undefined} className="text-xl font-semibold text-sky-400">
                            {title}
                        </h3>
                    ) : ( <span /> /* Empty span to maintain layout if no title */ )}
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-sky-400 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 transition-colors"
                        aria-label="Close modal"
                    >
                        <IconClose className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 text-slate-300 leading-relaxed">
                    {children}
                </div>

                {footerContent && (
                    <div className="px-6 py-4 bg-slate-700/60 rounded-b-xl flex justify-end space-x-3 border-t border-slate-700">
                        {/* Attempt to pass ref to the first focusable element in footer, e.g. primary button */}
                        {React.Children.map(footerContent, (child, index) => {
                            if (React.isValidElement(child) && child.type === 'button') {
                                // Try to make the "Confirm" or "primary" button focusable.
                                // This is a heuristic; a more robust way is for the parent to pass a specific ref.
                                // For now, let's assume the last button in footerContent is primary if multiple.
                                // Or, we can assume the first button if it's for "Cancel" and second is "Confirm".
                                // The existing logic in WheelPage.jsx's modal footer has Confirm as the last button in markup.
                                const isLikelyPrimaryAction = React.Children.count(footerContent) === 1 || index === React.Children.count(footerContent) - 1;
                                if (isLikelyPrimaryAction && firstFocusableElementRef) {
                                    return React.cloneElement(child, { ref: firstFocusableElementRef });
                                }
                            }
                            return child;
                        })}
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
    panelClassName: PropTypes.string,
};

export default Modal;
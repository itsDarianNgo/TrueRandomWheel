// src/components/Modal.jsx
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const IconClose = ({ className = "w-6 h-6" }) => ( /* ... SVG Unchanged from #43 ... */ <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);

const Modal = ({
                   isOpen,
                   onClose,
                   title,
                   children,
                   footerContent,
                   size = 'md',
                   panelClassName = '', // ***** NEW PROP for custom panel styling *****
               }) => {
    const modalRef = useRef(null);
    const firstFocusableElementRef = useRef(null); // Ref for the first focusable element (e.g., close button in footer)

    useEffect(() => {
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscapeKey);
            // Attempt to focus the first focusable element provided, or the modal panel itself
            setTimeout(() => {
                if (firstFocusableElementRef.current) {
                    firstFocusableElementRef.current.focus();
                } else if (modalRef.current) {
                    modalRef.current.focus(); // Fallback to panel
                }
            }, 0); // Timeout for elements to be in DOM
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
    }

    // Pass down firstFocusableElementRef to footer buttons if needed,
    // or identify the first button automatically. For now, we can pass it to the primary action.

    // We can make the 'Close & Continue' button in the winning banner explicitly get focus.
    // One way is to pass a ref to it from Modal, but Modal is generic.
    // Better: WheelDisplay will pass a ref to the button via footerContent.
    // Simpler for now: Modal focuses itself, user can Tab.

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in" // Increased z-index from Modal's original z-[65]
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
        >
            <div
                ref={modalRef}
                tabIndex="-1"
                className={`bg-slate-800 rounded-xl shadow-2xl w-full ${sizeClasses} flex flex-col overflow-hidden border border-slate-700 transform transition-all animate-[slideInUp_0.3s_ease-out] ${panelClassName}`} // Added panelClassName
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                    {title ? (
                        <h3 id="modal-title" className="text-xl font-semibold text-sky-400">
                            {title}
                        </h3>
                    ) : ( <span /> )}
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-sky-400 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors"
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
                        {React.Children.map(footerContent, (child, index) => {
                            if (React.isValidElement(child) && index === 0 && child.type === 'button') { // Attempt to focus first button in footer
                                return React.cloneElement(child, { ref: firstFocusableElementRef });
                            }
                            return child;
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

Modal.propTypes = { /* ... Unchanged from #38, but add panelClassName */
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    title: PropTypes.string,
    children: PropTypes.node.isRequired,
    footerContent: PropTypes.node,
    size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
    panelClassName: PropTypes.string, // New propType
};

export default Modal;
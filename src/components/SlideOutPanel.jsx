// src/components/SlideOutPanel.jsx
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const IconClose = ({ className = "w-6 h-6" }) => ( /* ... SVG Unchanged ... */
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
);

const SlideOutPanel = ({
                           isOpen,
                           onClose,
                           position = 'right',
                           title,
                           children,
                           widthClass = 'w-96',
                           className = '',
                       }) => {
    const panelRef = useRef(null);

    useEffect(() => { /* ... Unchanged (Escape key handler) ... */
        const handleEscapeKey = (event) => { if (event.key === 'Escape') onClose(); };
        if (isOpen) document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, [isOpen, onClose]);

    const basePanelClasses = `fixed top-0 bottom-0 z-[65] flex flex-col bg-slate-800 shadow-2xl border-slate-700 transition-transform duration-300 ease-in-out transform ${widthClass} ${className}`; // Removed overflow-y-auto from here

    let positionClasses = '';
    if (position === 'right') {
        positionClasses = `right-0 border-l ${isOpen ? 'translate-x-0' : 'translate-x-full'}`;
    } else {
        positionClasses = `left-0 border-r ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;
    }

    return (
        <div
            ref={panelRef}
            className={`${basePanelClasses} ${positionClasses}`}
            aria-hidden={!isOpen}
        >
            {/* Panel Header (Using the simpler version from Response #45's final code block) */}
            <div className="flex items-center p-4 border-b border-slate-700 flex-shrink-0">
                {position === 'right' && (
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-sky-400 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors mr-3" aria-label="Close panel">
                        <IconClose />
                    </button>
                )}
                {title && <h3 id="slide-panel-title" className="text-lg font-semibold text-sky-400 truncate flex-grow">{title}</h3>}
                {!title && <span className="flex-grow"></span>}
                {position === 'left' && (
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-sky-400 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors ml-3 order-last" aria-label="Close panel">
                        <IconClose />
                    </button>
                )}
            </div>

            {/* Panel Body (Scrollable Content Area) - MODIFIED */}
            <div className={`flex-grow p-4 sm:p-6 overflow-y-auto scrollbar-hide`}> {/* Added scrollbar-hide class, standardized padding */}
                {children}
            </div>
        </div>
    );
};

SlideOutPanel.propTypes = { /* ... Unchanged ... */
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    position: PropTypes.oneOf(['left', 'right']),
    title: PropTypes.string,
    children: PropTypes.node.isRequired,
    widthClass: PropTypes.string,
    className: PropTypes.string,
};

export default SlideOutPanel;
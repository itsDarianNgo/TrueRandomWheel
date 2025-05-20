// src/components/SlideOutPanel.jsx
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const IconClose = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
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

    useEffect(() => {
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscapeKey);
        }
        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [isOpen, onClose]);

    const basePanelClasses = `fixed top-0 bottom-0 z-[65] flex flex-col bg-slate-800 shadow-2xl border-slate-700 transition-transform duration-300 ease-in-out transform overflow-y-auto ${widthClass} ${className}`;

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
            {/* Panel Header: Close button position adjusted */}
            <div className={`flex items-center p-4 border-b border-slate-700 flex-shrink-0 ${title ? 'justify-between' : (position === 'right' ? 'justify-start' : 'justify-end')}`}>
                {position === 'left' && !title && <span />} {/* Spacer for left panel, no title, to push X right */}
                {title && (
                    <h3 id="slide-panel-title" className={`text-lg font-semibold text-sky-400 ${position === 'left' ? 'order-2' : ''}`}>
                        {title}
                    </h3>
                )}
                {/* If no title & panel is from right, button goes left. If title, button still goes opposite of title. */}
                <button
                    onClick={onClose}
                    className={`p-1.5 text-slate-400 hover:text-sky-400 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors ${position === 'right' ? (title ? 'ml-auto' : '') : (title ? 'mr-auto order-1' : '') }`}
                    aria-label="Close panel"
                >
                    <IconClose />
                </button>
                {position === 'right' && !title && <span />} {/* Spacer for right panel, no title, to push X left */}
            </div>

            <div className="flex-grow p-6 overflow-y-auto">
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
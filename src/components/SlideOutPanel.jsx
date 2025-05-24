// src/components/SlideOutPanel.jsx
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

// IconClose is no longer needed by this component as its internal button is removed.

const SlideOutPanel = ({
                           isOpen,
                           onClose, // Still needed for Esc key and if parent wants to trigger close via this prop
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
            {/* Panel Header: Internal Close Button ENTIRELY REMOVED */}
            {/* The header will now only display the title, if provided. */}
            {/* Added min-h-[3.5rem] (h-14) to ensure header has consistent height for title or empty space */}
            <div className={`flex items-center p-4 border-b border-slate-700 flex-shrink-0 min-h-[3.5rem] ${title ? (position === 'right' ? 'justify-start' : 'justify-end') : ''}`}>
                {title && (
                    <h3 id="slide-panel-title" className="text-lg font-semibold text-sky-400 truncate w-full text-center sm:text-left">
                        {title}
                    </h3>
                )}
            </div>

            <div className="flex-grow p-4 sm:p-6 overflow-y-auto scrollbar-hide"> {/* scrollbar-hide class from global.css */}
                {children}
            </div>
        </div>
    );
};

SlideOutPanel.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    position: PropTypes.oneOf(['left', 'right']),
    title: PropTypes.string,
    children: PropTypes.node.isRequired,
    widthClass: PropTypes.string,
    className: PropTypes.string,
};

export default SlideOutPanel;
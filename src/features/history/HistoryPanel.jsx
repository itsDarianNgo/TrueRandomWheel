// src/features/history/HistoryPanel.jsx
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectHistoryEntries, clearHistory as clearHistoryAction } from './historySlice'; // Renamed import for clarity
import { formatRelativeTime } from '../../core/utils/timeUtils';
import Modal from '../../components/Modal';
// Button component can be imported if specific styling is desired beyond Tailwind classes on <button>
// import Button from '../../components/Button';

const HistoryPanel = () => {
    const dispatch = useDispatch();
    const entries = useSelector(selectHistoryEntries);
    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

    const handleConfirmClearHistory = () => {
        dispatch(clearHistoryAction());
        setIsClearConfirmOpen(false);
    };

    const openClearConfirmationModal = () => {
        if (entries && entries.length > 0) { // Only open if there's history to clear
            setIsClearConfirmOpen(true);
        }
    };

    if (!entries || entries.length === 0) {
        return (
            <div className="p-6 text-center text-slate-400 italic flex items-center justify-center h-full">
                No spin history yet. Spin the wheel to see results here!
            </div>
        );
    }

    return (
        // h-full ensures this panel tries to take full height from its tab container
        <div className="flex flex-col h-full bg-slate-800"> {/* Added bg for consistency if parent doesn't provide */}
            <div className="flex-grow overflow-y-auto space-y-3 p-4 scrollbar-hide">
                {entries.map(entry => (
                    <div
                        key={entry.id}
                        className="p-3 bg-slate-700/80 hover:bg-slate-700 rounded-lg shadow-md flex items-center space-x-3 transition-colors duration-150 ease-in-out"
                        role="listitem"
                    >
                        <span
                            className="w-5 h-5 rounded-sm border border-slate-500 flex-shrink-0 shadow-sm"
                            style={{ backgroundColor: entry.color || '#A0A0A0' }} // Default color grey
                            title={`Color: ${entry.color || 'Default Grey'}`}
                        ></span>
                        <span
                            className="text-slate-100 font-medium truncate flex-grow text-sm"
                            title={entry.name}
                        >
                            {entry.name}
                        </span>
                        <span className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap">
                            {formatRelativeTime(entry.timestamp)}
                        </span>
                    </div>
                ))}
            </div>
            <div className="p-4 border-t border-slate-700 mt-auto flex-shrink-0">
                <button
                    onClick={openClearConfirmationModal}
                    disabled={!entries || entries.length === 0}
                    className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600"
                >
                    Clear All History
                </button>
            </div>

            <Modal
                isOpen={isClearConfirmOpen}
                onClose={() => setIsClearConfirmOpen(false)}
                title="Confirm Clear History"
                size="sm"
                footerContent={
                    <>
                        <button
                            onClick={() => setIsClearConfirmOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmClearHistory}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors"
                        >
                            Confirm Clear
                        </button>
                    </>
                }
            >
                <p className="text-slate-300">
                    Are you sure you want to clear all spin history? This action cannot be undone.
                </p>
            </Modal>
        </div>
    );
};

export default HistoryPanel;
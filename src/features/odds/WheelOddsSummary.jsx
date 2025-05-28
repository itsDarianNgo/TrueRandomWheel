// src/features/odds/WheelOddsSummary.jsx
import React from 'react';
import PropTypes from 'prop-types'; // Added for props
import { useSelector } from 'react-redux';
import { selectTagBasedOdds } from '../items/itemSlice';

const WheelOddsSummary = ({ onViewDetailedOddsClick }) => {
    const oddsData = useSelector(selectTagBasedOdds);

    if (oddsData.totalSegments === 0) {
        return (
            <div className="p-3 bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-xl text-slate-400 text-sm text-center italic">
                No items on wheel.
            </div>
        );
    }

    const hasAnyTaggedEntries = oddsData.taggedOdds.length > 0;

    return (
        <div className="p-3 sm:p-4 bg-slate-800/80 backdrop-blur-md rounded-lg shadow-xl text-slate-300 space-y-3 max-w-md mx-auto md:max-w-none md:mx-0">
            <h3 className="text-md font-semibold text-sky-300 text-center border-b border-slate-700 pb-2 mb-3">
                Live Odds Summary
            </h3>

            {(oddsData.totalSegments > 0 && !hasAnyTaggedEntries && oddsData.untaggedCount === oddsData.totalSegments) && (
                <p className="text-sm italic text-slate-400 text-center pb-2">
                    All items are currently untagged.
                </p>
            )}

            <div className="space-y-1 max-h-60 sm:max-h-72 overflow-y-auto scrollbar-hide text-xs sm:text-sm">
                {oddsData.taggedOdds.map(({ tag, count, probability }) => (
                    <div key={tag} className="flex justify-between items-center py-1.5 px-1 hover:bg-slate-700/50 rounded transition-colors duration-100">
                        <span className="truncate text-slate-300" title={tag}>
                            Tag: <span className="font-medium text-amber-400">{tag}</span>
                        </span>
                        <span className="font-semibold text-sky-400 flex-shrink-0 ml-2 text-right">
                            {probability.toFixed(2)}%
                            <span className="block text-[0.65rem] leading-tight text-slate-400 font-normal">({count}/{oddsData.totalSegments} segs)</span>
                        </span>
                    </div>
                ))}

                {oddsData.untaggedCount > 0 && (
                    <div
                        className={`flex justify-between items-center py-1.5 px-1 hover:bg-slate-700/50 rounded transition-colors duration-100 
                                    ${hasAnyTaggedEntries ? 'mt-2 pt-2.5 border-t border-slate-700/60' : 'mt-1'}`}
                    >
                        <span className="text-slate-300">Untagged Items:</span>
                        <span className="font-semibold text-sky-400 flex-shrink-0 ml-2 text-right">
                            {oddsData.untaggedProbability.toFixed(2)}%
                            <span className="block text-[0.65rem] leading-tight text-slate-400 font-normal">({oddsData.untaggedCount}/{oddsData.totalSegments} segs)</span>
                        </span>
                    </div>
                )}
            </div>

            {/* "View Detailed Odds" button - only show if there's something to detail */}
            {(hasAnyTaggedEntries || oddsData.untaggedCount > 0) && (
                <button
                    onClick={onViewDetailedOddsClick}
                    className="w-full mt-3 px-3 py-1.5 text-xs bg-sky-600 hover:bg-sky-700 text-white rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 transition-colors"
                >
                    View Detailed Odds in Panel
                </button>
            )}
        </div>
    );
};

WheelOddsSummary.propTypes = {
    onViewDetailedOddsClick: PropTypes.func.isRequired,
};

export default WheelOddsSummary;
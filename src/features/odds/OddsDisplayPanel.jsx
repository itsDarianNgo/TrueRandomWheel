// src/features/odds/OddsDisplayPanel.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { selectTagBasedOdds } from '../items/itemSlice'; // Assuming selector is co-located for now

const OddsDisplayPanel = () => {
    const oddsData = useSelector(selectTagBasedOdds);

    if (oddsData.totalSegments === 0) {
        return (
            <div className="p-6 text-center text-slate-400 italic">
                Add items to the wheel to see odds calculations.
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4 text-slate-300">
            <h4 className="text-lg font-semibold text-sky-300 mb-3 text-center">Odds Overview</h4>

            <div className="text-sm bg-slate-700/50 p-3 rounded-md">
                Total Segments on Wheel: <span className="font-bold text-sky-400">{oddsData.totalSegments}</span>
            </div>

            {oddsData.taggedOdds.length > 0 && (
                <div className="space-y-2">
                    <h5 className="text-md font-semibold text-slate-200">Tagged Item Odds:</h5>
                    <ul className="list-disc list-inside pl-1 space-y-1 text-sm">
                        {oddsData.taggedOdds.map(({ tag, count, probability }) => (
                            <li key={tag} className="ml-2">
                                Tag "<span className="font-semibold text-amber-400">{tag}</span>":
                                <span className="font-bold text-sky-400 ml-1">{probability.toFixed(2)}%</span>
                                <span className="text-xs text-slate-400 ml-1">({count}/{oddsData.totalSegments} segments)</span>
                            </li>
                        ))}
                    </ul>
                    <p className="text-xs text-slate-500 mt-1 pl-3">
                        Note: Probabilities sum per tag. If an item has multiple tags, it contributes to each tag's odds.
                    </p>
                </div>
            )}

            {oddsData.untaggedCount > 0 && (
                <div className="space-y-1">
                    <h5 className="text-md font-semibold text-slate-200 mt-3">Untagged Items:</h5>
                    <p className="text-sm ml-3">
                        Probability:
                        <span className="font-bold text-sky-400 ml-1">{oddsData.untaggedProbability.toFixed(2)}%</span>
                        <span className="text-xs text-slate-400 ml-1">({oddsData.untaggedCount}/{oddsData.totalSegments} segments)</span>
                    </p>
                </div>
            )}

            {!oddsData.hasTaggedItems && oddsData.untaggedCount === oddsData.totalSegments && oddsData.totalSegments > 0 && (
                <p className="text-sm italic text-slate-400 text-center mt-4">
                    No items have been tagged yet. All items are currently "Untagged".
                </p>
            )}
        </div>
    );
};

export default OddsDisplayPanel;
// src/features/effects/components/EffectsConfigurationPanel.jsx
import { useSelector, useDispatch } from 'react-redux';
import { selectAllItems } from '../../items/itemSlice';
import { selectTagEffects, setTagEffect, clearAllEffectsForTag } from '../effectsSlice';
import MediaUrlInputControl from './MediaUrlInputControl';
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

const EffectsConfigurationPanel = ({ isDisabled }) => {
    const dispatch = useDispatch();
    const allItems = useSelector(selectAllItems);
    const configuredEffects = useSelector(selectTagEffects);

    const uniqueTags = useMemo(() => {
        const tagsSet = new Set();
        allItems.forEach(item => {
            if (item.tags && item.tags.length > 0) {
                item.tags.forEach(tag => tagsSet.add(tag.toLowerCase()));
            }
        });
        return Array.from(tagsSet).sort();
    }, [allItems]);

    if (uniqueTags.length === 0) {
        return <p className="p-4 text-slate-400 italic text-center">Add items with tags to configure effects for them.</p>;
    }

    const handleTestSound = (url) => {
        try {
            const audio = new Audio(url);
            audio.play().catch(e => console.warn("Test sound playback error:", e));
        } catch (e) {
            console.error("Error creating audio for test:", e);
        }
    };

    // For Image type, onTestUrl is handled by MediaUrlInputControl's internal preview
    const handleTestGif = () => { /* no direct action, preview handled by component */ };


    return (
        <div className="space-y-6 p-1">
            {uniqueTags.map(tag => {
                const effectsForThisTag = configuredEffects[tag] || { soundUrl: null, gifUrl: null };
                return (
                    <section key={tag} className="p-3 sm:p-4 bg-slate-700/40 rounded-lg shadow">
                        <h5 className="text-md font-semibold text-amber-400 mb-3 border-b border-slate-600 pb-2">
                            Effects for Tag: <span className="text-amber-300">{tag}</span>
                        </h5>
                        <div className="space-y-4">
                            <MediaUrlInputControl
                                label="Sound Effect URL (.mp3, .wav, .ogg)"
                                id={`sound-url-${tag}`}
                                currentUrl={effectsForThisTag.soundUrl}
                                onSetUrl={(url) => dispatch(setTagEffect({ tag, effectType: 'sound', url }))}
                                onClearUrl={() => dispatch(setTagEffect({ tag, effectType: 'sound', url: null }))}
                                onTestUrl={handleTestSound}
                                disabled={isDisabled}
                                testButtonText="Test Sound"
                                type="media"
                            />
                            <MediaUrlInputControl
                                label="GIF URL (.gif)"
                                id={`gif-url-${tag}`}
                                currentUrl={effectsForThisTag.gifUrl}
                                onSetUrl={(url) => dispatch(setTagEffect({ tag, effectType: 'gif', url }))}
                                onClearUrl={() => dispatch(setTagEffect({ tag, effectType: 'gif', url: null }))}
                                onTestUrl={handleTestGif} // Test handled by component's preview
                                disabled={isDisabled}
                                testButtonText="Preview GIF"
                                type="image"
                            />
                        </div>
                        {(effectsForThisTag.soundUrl || effectsForThisTag.gifUrl) && (
                            <button
                                onClick={() => dispatch(clearAllEffectsForTag({ tag }))}
                                disabled={isDisabled}
                                className="w-full mt-4 px-3 py-1.5 text-xs bg-red-700/80 hover:bg-red-600 text-white rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                            >
                                Clear All Effects for "{tag}"
                            </button>
                        )}
                    </section>
                );
            })}
        </div>
    );
};

EffectsConfigurationPanel.propTypes = {
    isDisabled: PropTypes.bool.isRequired,
};

export default EffectsConfigurationPanel;
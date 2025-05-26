// src/features/wheel/WheelCanvas.jsx
import React, { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import PropTypes from 'prop-types';

// Default Values & Helper Functions (Unchanged)
const DEFAULT_MIN_SPINS = 5; const DEFAULT_SPIN_DURATION = 7000; const DEFAULT_POINTER_COLOR = '#E53E3E';
const DEFAULT_FONT_FAMILY = '"Inter", Arial, sans-serif'; const DEFAULT_TEXT_COLOR_LIGHT = '#FFFFFF';
const DEFAULT_TEXT_COLOR_DARK = '#1A202C'; const DEFAULT_LIGHT_SEGMENT_STROKE_COLOR = '#FFFFFF';
const DEFAULT_DARK_SEGMENT_STROKE_COLOR = '#4A5568'; const DEFAULT_STROKE_WIDTH = 2;
const REFINED_DEFAULT_SEGMENT_COLORS = ['#EC4899', '#F59E0B', '#8B5CF6', '#10B981', '#3B82F6', '#EF4444', '#F97316', '#6366F1', '#14B8A6', '#D946EF', '#A855F7', '#0EA5E9'];
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const isColorLight = (hexColor) => { /* ... same ... */ if (!hexColor || !hexColor.startsWith('#') || (hexColor.length !== 4 && hexColor.length !== 7) ) return false; let hex = hexColor.replace('#', ''); if (hex.length === 3) hex = hex.split('').map(char => char + char).join(''); if (hex.length !== 6) return false; const r = parseInt(hex.substring(0, 2), 16); const g = parseInt(hex.substring(2, 4), 16); const b = parseInt(hex.substring(4, 6), 16); const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; return luma > 160; };


const WheelCanvas = forwardRef(({
                                    items = [],
                                    pointerPosition = 'right',
                                    onSpinStart = () => {},
                                    onSpinEnd = () => {},
                                    onWheelClick = () => {},
                                    minSpins = DEFAULT_MIN_SPINS,
                                    spinDuration = DEFAULT_SPIN_DURATION,
                                    width = 480,
                                    height = 480,
                                    pointerColor = DEFAULT_POINTER_COLOR,
                                    fontFamily = DEFAULT_FONT_FAMILY,
                                    overrideTextColor,
                                    overrideSegmentStrokeColor,
                                    segmentStrokeWidth = DEFAULT_STROKE_WIDTH,
                                    defaultSegmentColors = REFINED_DEFAULT_SEGMENT_COLORS,
                                    canvasClassName = '',
                                    wheelStatus = 'idle', // Key prop for controlling state display
                                    // targetWinningItem prop removed - spinToTarget receives it
                                }, ref) => {
    const canvasRef = useRef(null);
    const [internalIsSpinning, setInternalIsSpinning] = useState(false); // For prize spin animation state
    const [currentWheelRotation, setCurrentWheelRotation] = useState(0);
    // isShuffleSpinAnimating and related refs are removed as per simplified shuffle animation
    const animationFrameIdRef = useRef(null);

    const getPointerTargetAngle = useCallback(() => { /* ... same ... */ switch (pointerPosition) { case 'top': return 1.5 * Math.PI; case 'bottom': return 0.5 * Math.PI; case 'left': return Math.PI; case 'right': default: return 0; } }, [pointerPosition]);
    const drawSegmentText = useCallback((ctx, item, textX, textY, maxTextWidth, radius, numSegments, itemActualColor) => { /* ... same ... */ const baseFontSize = radius / (numSegments === 1 ? 6 : (numSegments > 10 ? 12 : 10)); const dynamicFontSize = Math.max(12, Math.min(numSegments === 1 ? 40 : (numSegments > 6 ? 22 : 28), baseFontSize)); ctx.font = `600 ${dynamicFontSize}px ${fontFamily}`; ctx.fillStyle = overrideTextColor || (isColorLight(itemActualColor) ? DEFAULT_TEXT_COLOR_DARK : DEFAULT_TEXT_COLOR_LIGHT); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; let displayText = item.name; if (ctx.measureText(displayText).width > maxTextWidth) { for (let i = displayText.length - 1; i > 0; i--) { displayText = item.name.substring(0, i) + '...'; if (ctx.measureText(displayText).width <= maxTextWidth) break; } if (ctx.measureText(displayText).width > maxTextWidth) { displayText = item.name.substring(0,1); if (ctx.measureText(displayText).width > maxTextWidth && item.name.length > 0) displayText = ""; } } ctx.save(); ctx.translate(textX, textY); ctx.fillText(displayText, 0, 0); ctx.restore(); }, [fontFamily, overrideTextColor]);
    const drawSegment = useCallback((ctx, item, index, numSegments, centerX, centerY, radius) => { /* ... same ... */ const itemActualColor = item.color || defaultSegmentColors[index % defaultSegmentColors.length]; ctx.fillStyle = itemActualColor; let currentSegmentStrokeStyle; if (overrideSegmentStrokeColor && overrideSegmentStrokeColor !== 'transparent') { currentSegmentStrokeStyle = overrideSegmentStrokeColor; } else { currentSegmentStrokeStyle = isColorLight(itemActualColor) ? DEFAULT_DARK_SEGMENT_STROKE_COLOR : DEFAULT_LIGHT_SEGMENT_STROKE_COLOR; } if (numSegments === 1) { ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI); ctx.closePath(); ctx.fill(); if (segmentStrokeWidth > 0) { ctx.strokeStyle = currentSegmentStrokeStyle; ctx.lineWidth = segmentStrokeWidth; ctx.stroke(); } const maxTextWidthForSingle = radius * 1.6; drawSegmentText(ctx, item, centerX, centerY, maxTextWidthForSingle, radius, numSegments, itemActualColor); } else { const segmentAngle = (2 * Math.PI) / numSegments; const startAngle = index * segmentAngle; const endAngle = startAngle + segmentAngle; ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.arc(centerX, centerY, radius, startAngle, endAngle); ctx.closePath(); ctx.fill(); if (segmentStrokeWidth > 0) { ctx.strokeStyle = currentSegmentStrokeStyle; ctx.lineWidth = segmentStrokeWidth; ctx.stroke(); } const textRadius = radius * 0.65; const textAngle = startAngle + segmentAngle / 2; const textX = centerX + textRadius * Math.cos(textAngle); const textY = centerY + textRadius * Math.sin(textAngle); const maxTextWidthForSegment = (2 * textRadius * Math.sin(segmentAngle / 2)) * 0.80; drawSegmentText(ctx, item, textX, textY, maxTextWidthForSegment, radius, numSegments, itemActualColor); } }, [fontFamily, defaultSegmentColors, segmentStrokeWidth, overrideTextColor, overrideSegmentStrokeColor, drawSegmentText]);
    const drawPointer = useCallback((ctx, centerX, centerY, radius) => { /* ... same ... */ const pointerAngle = getPointerTargetAngle(); const pointerLength = radius * 0.18; const pointerHalfWidthAtBase = radius * 0.05; ctx.fillStyle = pointerColor; ctx.beginPath(); const tipX = centerX + (radius + segmentStrokeWidth) * Math.cos(pointerAngle); const tipY = centerY + (radius + segmentStrokeWidth) * Math.sin(pointerAngle); const baseCenterX = centerX + (radius + segmentStrokeWidth + pointerLength) * Math.cos(pointerAngle); const baseCenterY = centerY + (radius + segmentStrokeWidth + pointerLength) * Math.sin(pointerAngle); const perpAngle1 = pointerAngle + Math.PI / 2; const perpAngle2 = pointerAngle - Math.PI / 2; const baseX1 = baseCenterX + pointerHalfWidthAtBase * Math.cos(perpAngle1); const baseY1 = baseCenterY + pointerHalfWidthAtBase * Math.sin(perpAngle1); const baseX2 = baseCenterX + pointerHalfWidthAtBase * Math.cos(perpAngle2); const baseY2 = baseCenterY + pointerHalfWidthAtBase * Math.sin(perpAngle2); ctx.moveTo(tipX, tipY); ctx.lineTo(baseX1, baseY1); ctx.lineTo(baseX2, baseY2); ctx.closePath(); ctx.fill(); }, [getPointerTargetAngle, pointerColor, segmentStrokeWidth]);

    const drawWheel = useCallback(() => { /* ... same as Response #11 drawWheel, but checks wheelStatus for shuffle_animating overlay ... */
        const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d');
        const numSegments = items.length; const centerX = width / 2; const centerY = height / 2;
        const wheelRadius = Math.min(centerX, centerY) * 0.90; ctx.clearRect(0, 0, width, height);

        if (numSegments === 0 && wheelStatus === 'idle' && !internalIsSpinning) {
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#6B7280';
            ctx.font = `500 ${Math.max(14, wheelRadius / 15)}px ${fontFamily}`;
            ctx.fillText("Wheel is empty.", centerX, centerY - 10);
            ctx.font = `400 ${Math.max(12, wheelRadius / 20)}px ${fontFamily}`;
            ctx.fillText("Add items in settings.", centerX, centerY + 10);
            return;
        }

        ctx.save(); ctx.translate(centerX, centerY); ctx.rotate(currentWheelRotation);
        items.forEach((item, index) => { drawSegment(ctx, item, index, numSegments, 0, 0, wheelRadius); });
        ctx.restore();

        if (wheelStatus === 'shuffle_animating') { // Generic busy indicator for shuffling
            ctx.fillStyle = 'rgba(40, 48, 64, 0.6)'; // Darker slate overlay
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = 'rgba(226, 232, 240, 0.9)'; // Light text (slate-200)
            ctx.font = `600 ${Math.max(16, wheelRadius / 12)}px ${fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Simple text, or could be a spinner SVG drawn here if more complex
            ctx.fillText('Shuffling...', centerX, centerY);
        }
        drawPointer(ctx, centerX, centerY, wheelRadius);
    }, [items, width, height, currentWheelRotation, fontFamily, drawSegment, drawPointer, internalIsSpinning, wheelStatus, pointerColor, segmentStrokeWidth, defaultSegmentColors, overrideTextColor, overrideSegmentStrokeColor]);

    useEffect(() => { drawWheel(); }, [drawWheel]);

    useEffect(() => {
        // Normalize rotation only when truly idle to prevent visual jumps during transitions
        if (wheelStatus === 'idle' && !internalIsSpinning) {
            setCurrentWheelRotation(prev => (prev % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI));
        }
    }, [items, internalIsSpinning, wheelStatus]); // Added wheelStatus

    const performTargetedSpin = useCallback((targetItemToWin, minSpinsOverride, spinDurationOverride) => {
        // ... (This entire function is identical to Response #11's version) ...
        if (internalIsSpinning || wheelStatus !== 'spinning' || items.length === 0 || !targetItemToWin) { if (!targetItemToWin) console.error("WheelCanvas: spinToTarget called without a targetItemToWin."); else if (items.length === 0) console.error("WheelCanvas: spinToTarget called with no items on the wheel."); else if (internalIsSpinning) console.warn("WheelCanvas: spinToTarget called while already spinning."); else if (wheelStatus !== 'spinning') console.warn("WheelCanvas: spinToTarget called when wheelStatus is not 'spinning'. Current status:", wheelStatus); onSpinEnd(null, { error: "Spin conditions not met or no target." }); return; } setInternalIsSpinning(true); onSpinStart(targetItemToWin); const numSegments = items.length; const segmentAngle = (2 * Math.PI) / numSegments; const winningItemIndex = items.findIndex(item => item.id === targetItemToWin.id); if (winningItemIndex === -1) { console.error("WheelCanvas: Target item ID not found in current wheel items:", targetItemToWin.id); setInternalIsSpinning(false); onSpinEnd(null, { error: "Target item not found on wheel." }); return; } const winningSegmentCenterRelativeAngle = (winningItemIndex * segmentAngle) + (segmentAngle / 2); const pointerAbsoluteTargetAngle = getPointerTargetAngle(); let finalWheelRotation = pointerAbsoluteTargetAngle - winningSegmentCenterRelativeAngle; finalWheelRotation = (finalWheelRotation % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI); const normalizedCurrentRotation = (currentWheelRotation % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI); let rotationDelta = (finalWheelRotation - normalizedCurrentRotation + (2 * Math.PI)) % (2 * Math.PI); const actualMinSpins = minSpinsOverride !== undefined ? minSpinsOverride : minSpins; const actualSpinDuration = spinDurationOverride !== undefined ? spinDurationOverride : spinDuration; const targetAnimationAngle = currentWheelRotation + rotationDelta + (actualMinSpins * 2 * Math.PI); const animationStartTime = performance.now(); const initialRotationForAnimation = currentWheelRotation; const performAnimationFrame = () => { const elapsedTime = performance.now() - animationStartTime; let progress = Math.min(elapsedTime / actualSpinDuration, 1); if (progress > 1) progress = 1; const easedProgress = easeOutCubic(progress); setCurrentWheelRotation(initialRotationForAnimation + (targetAnimationAngle - initialRotationForAnimation) * easedProgress); if (progress < 1) { animationFrameIdRef.current = requestAnimationFrame(performAnimationFrame); } else { setCurrentWheelRotation(finalWheelRotation); setInternalIsSpinning(false); animationFrameIdRef.current = null; onSpinEnd(targetItemToWin, null); } }; animationFrameIdRef.current = requestAnimationFrame(performAnimationFrame);
    }, [items, internalIsSpinning, wheelStatus, currentWheelRotation, getPointerTargetAngle, onSpinStart, onSpinEnd, minSpins, spinDuration]);

    // shuffleAnimationTrigger and animateShuffleTick are REMOVED as per simplified shuffle.
    // Generic 'shuffle_animating' status will be handled by drawWheel.

    useImperativeHandle(ref, () => ({
        spinToTarget: (targetItem, minSpinsOverride, spinDurationOverride) => {
            performTargetedSpin(targetItem, minSpinsOverride, spinDurationOverride);
        }
        // triggerShuffleAnim method removed
    }), [performTargetedSpin]);

    useEffect(() => {
        return () => { if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current); };
    }, []);

    const canBeClicked = wheelStatus === 'idle' && items.length > 0;

    return ( /* ... same canvas JSX as Response #11 ... */
        <canvas ref={canvasRef} width={width} height={height} onClick={canBeClicked ? onWheelClick : undefined} className={`wheel-canvas ${canvasClassName} rounded-full ${canBeClicked ? 'cursor-pointer hover:opacity-90 active:opacity-80' : 'cursor-default'} transition-opacity duration-150 ease-in-out`} role={canBeClicked ? "button" : undefined} tabIndex={canBeClicked ? 0 : -1} aria-label={canBeClicked ? "Spin the wheel" : "Wheel is busy or empty"} />
    );
});

WheelCanvas.propTypes = { /* ... same PropTypes as Response #11, shuffleAnimationTrigger can be removed ... */
    items: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired, name: PropTypes.string.isRequired, color: PropTypes.string, sourceGroup: PropTypes.string, })).isRequired,
    pointerPosition: PropTypes.oneOf(['top', 'right', 'bottom', 'left']),
    onSpinStart: PropTypes.func, onSpinEnd: PropTypes.func, onWheelClick: PropTypes.func,
    minSpins: PropTypes.number, spinDuration: PropTypes.number, width: PropTypes.number, height: PropTypes.number, pointerColor: PropTypes.string,
    fontFamily: PropTypes.string, overrideTextColor: PropTypes.string, overrideSegmentStrokeColor: PropTypes.string,
    segmentStrokeWidth: PropTypes.number, defaultSegmentColors: PropTypes.arrayOf(PropTypes.string), canvasClassName: PropTypes.string,
    wheelStatus: PropTypes.string.isRequired, // wheelStatus is now required
};
WheelCanvas.displayName = 'WheelCanvas';
export default WheelCanvas;
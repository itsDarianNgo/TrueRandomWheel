// src/features/wheel/WheelCanvas.jsx
import React, { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import PropTypes from 'prop-types';
import PRNG from '../../core/prng/PRNGModule';

// Default Values & Helper Functions (isColorLight) remain IDENTICAL to Response #50
const DEFAULT_MIN_SPINS = 5; const DEFAULT_SPIN_DURATION = 7000; const DEFAULT_POINTER_COLOR = '#E53E3E';
const DEFAULT_FONT_FAMILY = '"Inter", Arial, sans-serif'; const DEFAULT_TEXT_COLOR_LIGHT = '#FFFFFF';
const DEFAULT_TEXT_COLOR_DARK = '#1A202C'; const DEFAULT_LIGHT_SEGMENT_STROKE_COLOR = '#FFFFFF';
const DEFAULT_DARK_SEGMENT_STROKE_COLOR = '#4A5568'; const DEFAULT_STROKE_WIDTH = 2;
const REFINED_DEFAULT_SEGMENT_COLORS = ['#EC4899', '#F59E0B', '#8B5CF6', '#10B981', '#3B82F6', '#EF4444', '#F97316', '#6366F1', '#14B8A6', '#D946EF', '#A855F7', '#0EA5E9'];
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const isColorLight = (hexColor) => { if (!hexColor || !hexColor.startsWith('#') || (hexColor.length !== 4 && hexColor.length !== 7) ) return false; let hex = hexColor.replace('#', ''); if (hex.length === 3) hex = hex.split('').map(char => char + char).join(''); if (hex.length !== 6) return false; const r = parseInt(hex.substring(0, 2), 16); const g = parseInt(hex.substring(2, 4), 16); const b = parseInt(hex.substring(4, 6), 16); const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; return luma > 160; };


const WheelCanvas = forwardRef(({
                                    items = [],
                                    pointerPosition = 'right',
                                    onSpinStart = () => {},
                                    onSpinEnd = () => {},
                                    onWheelClick = () => {}, // ***** NEW PROP for click-to-spin *****
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
                                }, ref) => {
    const canvasRef = useRef(null);
    const [internalIsSpinning, setInternalIsSpinning] = useState(false);
    const [currentWheelRotation, setCurrentWheelRotation] = useState(0);
    const animationFrameIdRef = useRef(null);

    // getPointerTargetAngle, drawSegmentText, drawSegment, drawPointer, drawWheel, useEffects for drawing (IDENTICAL to Response #50)
    const getPointerTargetAngle = useCallback(() => { switch (pointerPosition) { case 'top': return 1.5 * Math.PI; case 'bottom': return 0.5 * Math.PI; case 'left': return Math.PI; case 'right': default: return 0; } }, [pointerPosition]);
    const drawSegmentText = useCallback((ctx, item, textX, textY, maxTextWidth, radius, numSegments, itemActualColor) => { const baseFontSize = radius / (numSegments === 1 ? 6 : (numSegments > 10 ? 12 : 10)); const dynamicFontSize = Math.max(12, Math.min(numSegments === 1 ? 40 : (numSegments > 6 ? 22 : 28), baseFontSize)); ctx.font = `600 ${dynamicFontSize}px ${fontFamily}`; ctx.fillStyle = overrideTextColor || (isColorLight(itemActualColor) ? DEFAULT_TEXT_COLOR_DARK : DEFAULT_TEXT_COLOR_LIGHT); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; let displayText = item.name; if (ctx.measureText(displayText).width > maxTextWidth) { for (let i = displayText.length - 1; i > 0; i--) { displayText = item.name.substring(0, i) + '...'; if (ctx.measureText(displayText).width <= maxTextWidth) break; } if (ctx.measureText(displayText).width > maxTextWidth) { displayText = item.name.substring(0,1); if (ctx.measureText(displayText).width > maxTextWidth && item.name.length > 0) displayText = ""; } } ctx.save(); ctx.translate(textX, textY); ctx.fillText(displayText, 0, 0); ctx.restore(); }, [fontFamily, overrideTextColor]);
    const drawSegment = useCallback((ctx, item, index, numSegments, centerX, centerY, radius) => { const itemActualColor = item.color || defaultSegmentColors[index % defaultSegmentColors.length]; ctx.fillStyle = itemActualColor; let currentSegmentStrokeStyle; if (overrideSegmentStrokeColor && overrideSegmentStrokeColor !== 'transparent') { currentSegmentStrokeStyle = overrideSegmentStrokeColor; } else { currentSegmentStrokeStyle = isColorLight(itemActualColor) ? DEFAULT_DARK_SEGMENT_STROKE_COLOR : DEFAULT_LIGHT_SEGMENT_STROKE_COLOR; } if (numSegments === 1) { ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI); ctx.closePath(); ctx.fill(); if (segmentStrokeWidth > 0) { ctx.strokeStyle = currentSegmentStrokeStyle; ctx.lineWidth = segmentStrokeWidth; ctx.stroke(); } const maxTextWidthForSingle = radius * 1.6; drawSegmentText(ctx, item, centerX, centerY, maxTextWidthForSingle, radius, numSegments, itemActualColor); } else { const segmentAngle = (2 * Math.PI) / numSegments; const startAngle = index * segmentAngle; const endAngle = startAngle + segmentAngle; ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.arc(centerX, centerY, radius, startAngle, endAngle); ctx.closePath(); ctx.fill(); if (segmentStrokeWidth > 0) { ctx.strokeStyle = currentSegmentStrokeStyle; ctx.lineWidth = segmentStrokeWidth; ctx.stroke(); } const textRadius = radius * 0.65; const textAngle = startAngle + segmentAngle / 2; const textX = centerX + textRadius * Math.cos(textAngle); const textY = centerY + textRadius * Math.sin(textAngle); const maxTextWidthForSegment = (2 * textRadius * Math.sin(segmentAngle / 2)) * 0.80; drawSegmentText(ctx, item, textX, textY, maxTextWidthForSegment, radius, numSegments, itemActualColor); } }, [fontFamily, defaultSegmentColors, segmentStrokeWidth, overrideTextColor, overrideSegmentStrokeColor, drawSegmentText]);
    const drawPointer = useCallback((ctx, centerX, centerY, radius) => { const pointerAngle = getPointerTargetAngle(); const pointerLength = radius * 0.18; const pointerHalfWidthAtBase = radius * 0.05; ctx.fillStyle = pointerColor; ctx.beginPath(); const tipX = centerX + (radius + segmentStrokeWidth) * Math.cos(pointerAngle); const tipY = centerY + (radius + segmentStrokeWidth) * Math.sin(pointerAngle); const baseCenterX = centerX + (radius + segmentStrokeWidth + pointerLength) * Math.cos(pointerAngle); const baseCenterY = centerY + (radius + segmentStrokeWidth + pointerLength) * Math.sin(pointerAngle); const perpAngle1 = pointerAngle + Math.PI / 2; const perpAngle2 = pointerAngle - Math.PI / 2; const baseX1 = baseCenterX + pointerHalfWidthAtBase * Math.cos(perpAngle1); const baseY1 = baseCenterY + pointerHalfWidthAtBase * Math.sin(perpAngle1); const baseX2 = baseCenterX + pointerHalfWidthAtBase * Math.cos(perpAngle2); const baseY2 = baseCenterY + pointerHalfWidthAtBase * Math.sin(perpAngle2); ctx.moveTo(tipX, tipY); ctx.lineTo(baseX1, baseY1); ctx.lineTo(baseX2, baseY2); ctx.closePath(); ctx.fill(); }, [getPointerTargetAngle, pointerColor, segmentStrokeWidth]);
    const drawWheel = useCallback(() => { const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); const numSegments = items.length; const centerX = width / 2; const centerY = height / 2; const wheelRadius = Math.min(centerX, centerY) * 0.90; ctx.clearRect(0, 0, width, height); if (numSegments === 0) { ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#6B7280'; ctx.font = `500 16px ${fontFamily}`; ctx.fillText("Wheel is currently empty.", centerX, centerY); return; } ctx.save(); ctx.translate(centerX, centerY); ctx.rotate(currentWheelRotation); items.forEach((item, index) => { drawSegment(ctx, item, index, numSegments, 0, 0, wheelRadius); }); ctx.restore(); drawPointer(ctx, centerX, centerY, wheelRadius); }, [items, width, height, currentWheelRotation, fontFamily, drawSegment, drawPointer]);
    useEffect(() => { drawWheel(); }, [drawWheel]);
    useEffect(() => { if (!internalIsSpinning) { setCurrentWheelRotation(prev => (prev % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI)); } }, [items, internalIsSpinning]);

    // spin method (IDENTICAL to Response #50)
    const spin = useCallback(() => { if (internalIsSpinning || items.length === 0) return; setInternalIsSpinning(true); if (items.length <= 0) { setInternalIsSpinning(false); onSpinEnd(null, { error: "No items" }); return; } let winningItemData; try { const prngMax = BigInt(items.length); if (prngMax <= 0n) throw Error("No items"); winningItemData = items[Number(PRNG.nextRandomIntInRange(prngMax))]; } catch (e) { setInternalIsSpinning(false); onSpinEnd(null, {error: e.message}); return; } if (!winningItemData) { setInternalIsSpinning(false); onSpinEnd(null, {error: "PRNG fail"}); return; } onSpinStart(winningItemData); const numSeg = items.length; const segAng = (2*Math.PI)/numSeg; const winIdx = items.findIndex(i=>i.id===winningItemData.id); if(winIdx===-1){setInternalIsSpinning(false);onSpinEnd(null,{error:"ID not found"});return;} const winSegCenterRelAng=(winIdx*segAng)+(segAng/2); const tarPtrAbsAng=getPointerTargetAngle(); let finalWheelRot=tarPtrAbsAng-winSegCenterRelAng;finalWheelRot=(finalWheelRot%(2*Math.PI)+(2*Math.PI))%(2*Math.PI); const normCurRot=(currentWheelRotation%(2*Math.PI)+(2*Math.PI))%(2*Math.PI); const rotDelta=(finalWheelRot-normCurRot+2*Math.PI)%(2*Math.PI); const tarAnimAng=currentWheelRotation+rotDelta+(minSpins||DEFAULT_MIN_SPINS)*2*Math.PI; const animStartTime=performance.now(); const initRotForAnim=currentWheelRotation; const performAnimFrame=()=>{const elap=performance.now()-animStartTime;const prog=Math.min(elap/(spinDuration||DEFAULT_SPIN_DURATION),1);const easedProg=easeOutCubic(prog);setCurrentWheelRotation(initRotForAnim+(tarAnimAng-initRotForAnim)*easedProg);if(prog<1){animationFrameIdRef.current=requestAnimationFrame(performAnimFrame);}else{setCurrentWheelRotation(finalWheelRot);setInternalIsSpinning(false);animationFrameIdRef.current=null;onSpinEnd(winningItemData);}};animationFrameIdRef.current=requestAnimationFrame(performAnimFrame); }, [internalIsSpinning, items, currentWheelRotation, minSpins, spinDuration, onSpinStart, onSpinEnd, getPointerTargetAngle]);

    // useImperativeHandle (IDENTICAL to Response #50)
    useImperativeHandle(ref, () => ({ spin: spin }), [spin]);

    // useEffect for animation cleanup (IDENTICAL to Response #50)
    useEffect(() => { return () => { if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current); }; }, []);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onClick={onWheelClick} // ***** MODIFICATION: Call onWheelClick prop *****
            className={`wheel-canvas ${canvasClassName} rounded-full ${items.length > 0 ? 'cursor-pointer hover:opacity-90 active:opacity-80' : 'cursor-default'} transition-opacity`} // Add cursor pointer if items exist
            role="button" // Semantically, it now acts as a button
            tabIndex={items.length > 0 ? 0 : -1} // Make it focusable if it can be spun
            aria-label="Spin the wheel by clicking it"
        />
    );
});

WheelCanvas.propTypes = {
    // ... (Existing PropTypes from Response #50)
    items: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired, name: PropTypes.string.isRequired, color: PropTypes.string, sourceGroup: PropTypes.string, })).isRequired,
    pointerPosition: PropTypes.oneOf(['top', 'right', 'bottom', 'left']),
    onSpinStart: PropTypes.func,
    onSpinEnd: PropTypes.func,
    onWheelClick: PropTypes.func, // ***** NEW PROP TYPE *****
    minSpins: PropTypes.number, spinDuration: PropTypes.number, width: PropTypes.number, height: PropTypes.number, pointerColor: PropTypes.string,
    fontFamily: PropTypes.string, overrideTextColor: PropTypes.string, overrideSegmentStrokeColor: PropTypes.string,
    segmentStrokeWidth: PropTypes.number, defaultSegmentColors: PropTypes.arrayOf(PropTypes.string), canvasClassName: PropTypes.string,
};
WheelCanvas.displayName = 'WheelCanvas';
export default WheelCanvas;
// src/features/wheel/WheelCanvas.jsx
import React, { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import PropTypes from 'prop-types';
import PRNG from '../../core/prng/PRNGModule';

// --- UI/UX Refined Default Values ---
const DEFAULT_MIN_SPINS = 5;
const DEFAULT_SPIN_DURATION = 7000;
const DEFAULT_POINTER_COLOR = '#E53E3E';
const DEFAULT_FONT_FAMILY = '"Inter", Arial, sans-serif';
const DEFAULT_TEXT_COLOR_LIGHT = '#FFFFFF';
const DEFAULT_TEXT_COLOR_DARK = '#1A202C'; // slate-800
// const DEFAULT_SEGMENT_STROKE_COLOR = '#FFFFFF'; // OLD: Fixed white stroke
// ***** NEW: Define contrasting stroke colors *****
const DEFAULT_LIGHT_SEGMENT_STROKE_COLOR = '#FFFFFF'; // For dark segments (White)
const DEFAULT_DARK_SEGMENT_STROKE_COLOR = '#4A5568';  // For light segments (Slate-600 - a good dark gray)
const DEFAULT_STROKE_WIDTH = 2;

const REFINED_DEFAULT_SEGMENT_COLORS = [ /* ... Palette from Response #30 ... */
    '#EC4899', '#F59E0B', '#8B5CF6', '#10B981', '#3B82F6', '#EF4444',
    '#F97316', '#6366F1', '#14B8A6', '#D946EF', '#A855F7', '#0EA5E9',
];

const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

const isColorLight = (hexColor) => {
    if (!hexColor || !hexColor.startsWith('#') || (hexColor.length !== 4 && hexColor.length !== 7) ) return false;
    let hex = hexColor.replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }
    if (hex.length !== 6) return false; // Invalid hex after expansion
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma > 160;
};

// Icon for internal empty state (Unchanged from Response #30)
// const IconWheelOutlineInternal = () => ( ... );


const WheelCanvas = forwardRef(({
                                    items = [],
                                    pointerPosition = 'right',
                                    onSpinStart = () => {},
                                    onSpinEnd = () => {},
                                    minSpins = DEFAULT_MIN_SPINS,
                                    spinDuration = DEFAULT_SPIN_DURATION,
                                    width = 480,
                                    height = 480,
                                    pointerColor = DEFAULT_POINTER_COLOR,
                                    fontFamily = DEFAULT_FONT_FAMILY,
                                    overrideTextColor,
                                    // segmentStrokeColor prop is now less critical if we use dynamic, but can be an override.
                                    // For now, we'll make our dynamic choice primary.
                                    // If segmentStrokeColor prop is provided, it will override dynamic logic.
                                    segmentStrokeColor: overrideSegmentStrokeColor, // Renamed for clarity
                                    segmentStrokeWidth = DEFAULT_STROKE_WIDTH,
                                    defaultSegmentColors = REFINED_DEFAULT_SEGMENT_COLORS,
                                    canvasClassName = '',
                                }, ref) => {
    const canvasRef = useRef(null);
    const [internalIsSpinning, setInternalIsSpinning] = useState(false);
    const [currentWheelRotation, setCurrentWheelRotation] = useState(0);

    const animationFrameIdRef = useRef(null);

    const getPointerTargetAngle = useCallback(() => { /* ... Unchanged ... */
        switch (pointerPosition) {
            case 'top': return 1.5 * Math.PI;
            case 'bottom': return 0.5 * Math.PI;
            case 'left': return Math.PI;
            case 'right':
            default: return 0;
        }
    }, [pointerPosition]);

    // ***** MODIFIED drawSegment Method *****
    const drawSegment = useCallback((ctx, item, index, numSegments, centerX, centerY, radius) => {
        const segmentAngle = (2 * Math.PI) / numSegments;
        const startAngle = index * segmentAngle;
        const endAngle = startAngle + segmentAngle;

        const itemActualColor = item.color || defaultSegmentColors[index % defaultSegmentColors.length];
        ctx.fillStyle = itemActualColor;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();

        // ***** DYNAMIC STROKE COLOR LOGIC *****
        if (segmentStrokeWidth > 0) {
            if (overrideSegmentStrokeColor && overrideSegmentStrokeColor !== 'transparent') {
                ctx.strokeStyle = overrideSegmentStrokeColor;
            } else {
                // Dynamic choice based on segment's own background color
                ctx.strokeStyle = isColorLight(itemActualColor)
                    ? DEFAULT_DARK_SEGMENT_STROKE_COLOR
                    : DEFAULT_LIGHT_SEGMENT_STROKE_COLOR;
            }
            ctx.lineWidth = segmentStrokeWidth;
            ctx.stroke();
        }
        // ***** END DYNAMIC STROKE COLOR LOGIC *****

        // Text properties (Unchanged from Response #30 logic)
        const textRadius = radius * 0.65;
        const textAngle = startAngle + segmentAngle / 2;
        const textX = centerX + textRadius * Math.cos(textAngle);
        const textY = centerY + textRadius * Math.sin(textAngle);
        const baseFontSize = radius / (numSegments > 10 ? 12 : 10);
        const dynamicFontSize = Math.max(10, Math.min(numSegments > 6 ? 22 : 28, baseFontSize));
        ctx.font = `600 ${dynamicFontSize}px ${fontFamily}`;
        ctx.fillStyle = overrideTextColor || (isColorLight(itemActualColor) ? DEFAULT_TEXT_COLOR_DARK : DEFAULT_TEXT_COLOR_LIGHT);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const maxTextWidth = (2 * textRadius * Math.sin(segmentAngle / 2)) * 0.80;
        let displayText = item.name;
        if (ctx.measureText(displayText).width > maxTextWidth) {
            for (let i = displayText.length - 1; i > 0; i--) {
                displayText = item.name.substring(0, i) + '...';
                if (ctx.measureText(displayText).width <= maxTextWidth) break;
            }
            if (ctx.measureText(displayText).width > maxTextWidth) {
                displayText = item.name.substring(0,1);
                if (ctx.measureText(displayText).width > maxTextWidth) displayText = "";
            }
        }
        ctx.save();
        ctx.translate(textX, textY);
        ctx.fillText(displayText, 0, 0);
        ctx.restore();

    }, [fontFamily, defaultSegmentColors, segmentStrokeWidth, overrideTextColor, overrideSegmentStrokeColor]); // Added overrideSegmentStrokeColor

    const drawPointer = useCallback((ctx, centerX, centerY, radius) => { /* ... Unchanged from #30 ... */
        const pointerAngle = getPointerTargetAngle();
        const pointerLength = radius * 0.18;
        const pointerHalfWidthAtBase = radius * 0.05;
        ctx.fillStyle = pointerColor;
        ctx.beginPath();
        const tipX = centerX + (radius + segmentStrokeWidth) * Math.cos(pointerAngle);
        const tipY = centerY + (radius + segmentStrokeWidth) * Math.sin(pointerAngle);
        const baseCenterX = centerX + (radius + segmentStrokeWidth + pointerLength) * Math.cos(pointerAngle);
        const baseCenterY = centerY + (radius + segmentStrokeWidth + pointerLength) * Math.sin(pointerAngle);
        const perpAngle1 = pointerAngle + Math.PI / 2;
        const perpAngle2 = pointerAngle - Math.PI / 2;
        const baseX1 = baseCenterX + pointerHalfWidthAtBase * Math.cos(perpAngle1);
        const baseY1 = baseCenterY + pointerHalfWidthAtBase * Math.sin(perpAngle1);
        const baseX2 = baseCenterX + pointerHalfWidthAtBase * Math.cos(perpAngle2);
        const baseY2 = baseCenterY + pointerHalfWidthAtBase * Math.sin(perpAngle2);
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(baseX1, baseY1);
        ctx.lineTo(baseX2, baseY2);
        ctx.closePath();
        ctx.fill();
    }, [getPointerTargetAngle, pointerColor, segmentStrokeWidth]);

    const drawWheel = useCallback(() => { /* ... Unchanged from #30, ensure empty state logic is preferred from #30 ... */
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const numSegments = items.length;
        const centerX = width / 2;
        const centerY = height / 2;
        const wheelRadius = Math.min(centerX, centerY) * 0.90;
        ctx.clearRect(0, 0, width, height);
        if (numSegments === 0) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle'; // Added for better centering of text
            ctx.fillStyle = '#6B7280';
            ctx.font = `500 16px ${fontFamily}`;
            ctx.fillText("Wheel is currently empty.", centerX, centerY);
            return;
        }
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(currentWheelRotation);
        items.forEach((item, index) => {
            drawSegment(ctx, item, index, numSegments, 0, 0, wheelRadius);
        });
        ctx.restore();
        drawPointer(ctx, centerX, centerY, wheelRadius);
    }, [items, width, height, currentWheelRotation, fontFamily, drawSegment, drawPointer]);

    // useEffect for drawWheel (remains same)
    useEffect(() => { drawWheel(); }, [drawWheel]);

    // useEffect for item changes and spin state (remains same)
    useEffect(() => {
        if (!internalIsSpinning) {
            setCurrentWheelRotation(prevRotation => (prevRotation % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI));
        }
    }, [items, internalIsSpinning]);

    // spin method (core logic remains same as Response #18/30, ensure PRNG call is BigInt)
    const spin = useCallback(() => { /* ... Unchanged from #30 ... */
        if (internalIsSpinning || items.length === 0) return;
        setInternalIsSpinning(true);
        if (items.length <= 0) {
            setInternalIsSpinning(false);
            onSpinEnd(null, { error: "No items to select from" });
            return;
        }
        let winningItemData;
        try {
            const prngMaxExclusive = BigInt(items.length);
            if (prngMaxExclusive <= 0n) { throw new Error("Calculated prngMaxExclusive is not positive."); }
            winningItemData = items[Number(PRNG.nextRandomIntInRange(prngMaxExclusive))];
        } catch (error) {
            setInternalIsSpinning(false);
            onSpinEnd(null, { error: `PRNG failure: ${error.message}` });
            return;
        }
        if (!winningItemData) {
            setInternalIsSpinning(false);
            onSpinEnd(null, { error: "PRNG failed to select an item" });
            return;
        }
        onSpinStart(winningItemData);
        const numSegments = items.length;
        const segmentAngle = (2 * Math.PI) / numSegments;
        const winningSegmentIndex = items.findIndex(item => item.id === winningItemData.id);
        if (winningSegmentIndex === -1) {
            setInternalIsSpinning(false);
            onSpinEnd(null, { error: "Selected winning item ID not found" });
            return;
        }
        const winningSegmentCenterRelAngle = (winningSegmentIndex * segmentAngle) + (segmentAngle / 2);
        const targetPointerAbsAngle = getPointerTargetAngle();
        let finalWheelTargetRotation = targetPointerAbsAngle - winningSegmentCenterRelAngle;
        finalWheelTargetRotation = (finalWheelTargetRotation % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI);
        const normalizedCurrentRotation = (currentWheelRotation % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI);
        const rotationDelta = (finalWheelTargetRotation - normalizedCurrentRotation + 2 * Math.PI) % (2 * Math.PI);
        const targetAnimationAngle = currentWheelRotation + rotationDelta + (minSpins || DEFAULT_MIN_SPINS) * 2 * Math.PI;
        const animationStartTime = performance.now();
        const initialRotationForAnimation = currentWheelRotation;
        const performAnimationFrame = () => {
            const elapsed = performance.now() - animationStartTime;
            const progress = Math.min(elapsed / (spinDuration || DEFAULT_SPIN_DURATION), 1);
            const easedProgress = easeOutCubic(progress);
            setCurrentWheelRotation(initialRotationForAnimation + (targetAnimationAngle - initialRotationForAnimation) * easedProgress);
            if (progress < 1) {
                animationFrameIdRef.current = requestAnimationFrame(performAnimationFrame);
            } else {
                setCurrentWheelRotation(finalWheelTargetRotation);
                setInternalIsSpinning(false);
                animationFrameIdRef.current = null;
                onSpinEnd(winningItemData);
            }
        };
        animationFrameIdRef.current = requestAnimationFrame(performAnimationFrame);
    }, [
        internalIsSpinning, items, currentWheelRotation, minSpins, spinDuration,
        onSpinStart, onSpinEnd, getPointerTargetAngle,
    ]);

    // useImperativeHandle (remains same)
    useImperativeHandle(ref, () => ({ spin: spin }), [spin]);

    // useEffect for animation cleanup (remains same)
    useEffect(() => {
        return () => { if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current); };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className={`wheel-canvas ${canvasClassName} rounded-full`}
            role="img"
            aria-label="Color wheel spinner"
        />
    );
});

WheelCanvas.propTypes = {
    // ... (PropTypes from #30, with overrideSegmentStrokeColor potentially added)
    items: PropTypes.arrayOf(PropTypes.shape({ /* ... */ })).isRequired,
    pointerPosition: PropTypes.oneOf(['top', 'right', 'bottom', 'left']),
    onSpinStart: PropTypes.func,
    onSpinEnd: PropTypes.func,
    minSpins: PropTypes.number,
    spinDuration: PropTypes.number,
    width: PropTypes.number,
    height: PropTypes.number,
    pointerColor: PropTypes.string,
    fontFamily: PropTypes.string,
    overrideTextColor: PropTypes.string,
    overrideSegmentStrokeColor: PropTypes.string, // New prop to override dynamic stroke
    segmentStrokeWidth: PropTypes.number,
    defaultSegmentColors: PropTypes.arrayOf(PropTypes.string),
    canvasClassName: PropTypes.string,
};

WheelCanvas.displayName = 'WheelCanvas';
export default WheelCanvas;
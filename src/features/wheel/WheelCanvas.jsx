// src/features/wheel/WheelCanvas.jsx
// (Imports and constants as before)
import React, { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import PropTypes from 'prop-types';
import PRNG from '../../core/prng/PRNGModule';

// Default configuration values (ensure these are the same as Response #17)
const DEFAULT_MIN_SPINS = 5;
const DEFAULT_SPIN_DURATION = 7000; // ms
const DEFAULT_POINTER_COLOR = '#FF0000';
const DEFAULT_FONT_FAMILY = 'Arial, sans-serif';
const DEFAULT_TEXT_COLOR = '#000000';
const DEFAULT_SEGMENT_STROKE_COLOR = '#FFFFFF';
const DEFAULT_SEGMENT_COLORS = [
    '#FFC300', '#FF5733', '#C70039', '#900C3F', '#581845',
    '#2ECC71', '#3498DB', '#9B59B6', '#F1C40F', '#E67E22',
    '#E74C3C', '#1ABC9C', '#27AE60', '#2980B9', '#8E44AD'
];
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);


const WheelCanvas = forwardRef(({
                                    items = [],
                                    pointerPosition = 'right',
                                    onSpinStart = () => {},
                                    onSpinEnd = () => {},
                                    minSpins = DEFAULT_MIN_SPINS,
                                    spinDuration = DEFAULT_SPIN_DURATION,
                                    width = 500,
                                    height = 500,
                                    pointerColor = DEFAULT_POINTER_COLOR,
                                    fontFamily = DEFAULT_FONT_FAMILY,
                                    textColor = DEFAULT_TEXT_COLOR,
                                    segmentStrokeColor = DEFAULT_SEGMENT_STROKE_COLOR,
                                    segmentColors = DEFAULT_SEGMENT_COLORS,
                                    canvasClassName = '',
                                }, ref) => {
    const canvasRef = useRef(null);
    const [internalIsSpinning, setInternalIsSpinning] = useState(false);
    const [currentWheelRotation, setCurrentWheelRotation] = useState(0);

    const animationFrameIdRef = useRef(null);

    // getPointerTargetAngle, drawSegment, drawPointer, drawWheel, useEffect for drawWheel
    // ... (These functions remain exactly as in Response #17's WheelCanvas.jsx) ...
    // For brevity, I'm omitting them here, but assume they are present and unchanged from Response #17.
    // Ensure the refined text truncation and pointer drawing logic from Response #17 is used.

    // --- Start of functions from Response #17 WheelCanvas (ensure these are copied accurately) ---
    const getPointerTargetAngle = useCallback(() => { // From #17
        switch (pointerPosition) {
            case 'top': return 1.5 * Math.PI;
            case 'bottom': return 0.5 * Math.PI;
            case 'left': return Math.PI;
            case 'right':
            default: return 0;
        }
    }, [pointerPosition]);

    const drawSegment = useCallback((ctx, item, index, numSegments, centerX, centerY, radius) => { // From #17
        const segmentAngle = (2 * Math.PI) / numSegments;
        const startAngle = index * segmentAngle;
        const endAngle = startAngle + segmentAngle;

        ctx.fillStyle = item.color || segmentColors[index % segmentColors.length];
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();

        if (segmentStrokeColor && segmentStrokeColor !== 'transparent') {
            ctx.strokeStyle = segmentStrokeColor;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        const textRadius = radius * 0.7;
        const textAngle = startAngle + segmentAngle / 2;
        const textX = centerX + textRadius * Math.cos(textAngle);
        const textY = centerY + textRadius * Math.sin(textAngle);

        const baseFontSize = radius / 15;
        ctx.font = `bold ${Math.max(10, Math.min(24, baseFontSize))}px ${fontFamily}`;
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const chordLengthApprox = (2 * textRadius * Math.sin(segmentAngle / 2)) * 0.85;
        let displayText = item.name;
        let textWidth = ctx.measureText(displayText).width;

        const maxIterations = displayText.length + 5;
        let iterations = 0;
        while (textWidth > chordLengthApprox && displayText.length > 0 && iterations < maxIterations) {
            if (displayText.endsWith('...')) {
                displayText = displayText.substring(0, displayText.length - 4);
            } else {
                displayText = displayText.substring(0, displayText.length - 1);
            }
            if (displayText.length === 0 && iterations < maxIterations -1 ) {
                break;
            }
            displayText += '...';
            textWidth = ctx.measureText(displayText).width;
            iterations++;
        }
        if ((textWidth > chordLengthApprox || displayText === "...") && item.name.length > 0) {
            if (item.name.length <=3 ) displayText = item.name;
            else displayText = item.name.substring(0,1) + "...";
            if (ctx.measureText(displayText).width > chordLengthApprox && item.name.length > 0) {
                displayText = "";
            }
        }

        ctx.save();
        ctx.translate(textX, textY);
        ctx.fillText(displayText, 0, 0);
        ctx.restore();
    }, [fontFamily, textColor, segmentColors, segmentStrokeColor]);

    const drawPointer = useCallback((ctx, centerX, centerY, radius) => { // From #17
        const pointerAngle = getPointerTargetAngle();
        const pointerLength = radius * 0.15;
        const pointerWidthAtBase = radius * 0.06;

        ctx.fillStyle = pointerColor;
        ctx.beginPath();

        const tipX = centerX + (radius * 1.02) * Math.cos(pointerAngle);
        const tipY = centerY + (radius * 1.02) * Math.sin(pointerAngle);

        const baseCenterX = centerX + (radius + pointerLength) * Math.cos(pointerAngle);
        const baseCenterY = centerY + (radius + pointerLength) * Math.sin(pointerAngle);

        const perpAngle1 = pointerAngle + Math.PI / 2;
        const perpAngle2 = pointerAngle - Math.PI / 2;

        const baseX1 = baseCenterX + pointerWidthAtBase * Math.cos(perpAngle1);
        const baseY1 = baseCenterY + pointerWidthAtBase * Math.sin(perpAngle1);
        const baseX2 = baseCenterX + pointerWidthAtBase * Math.cos(perpAngle2);
        const baseY2 = baseCenterY + pointerWidthAtBase * Math.sin(perpAngle2);

        ctx.moveTo(tipX, tipY);
        ctx.lineTo(baseX1, baseY1);
        ctx.lineTo(baseX2, baseY2);
        ctx.closePath();
        ctx.fill();
    }, [getPointerTargetAngle, pointerColor]);

    const drawWheel = useCallback(() => { // From #17
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const numSegments = items.length;
        const centerX = width / 2;
        const centerY = height / 2;
        const wheelRadius = Math.min(centerX, centerY) * 0.85;

        ctx.clearRect(0, 0, width, height);

        if (numSegments === 0) {
            ctx.textAlign = 'center';
            ctx.fillStyle = '#AAA';
            ctx.font = `16px ${fontFamily}`;
            ctx.fillText("Wheel is empty", centerX, centerY);
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
    // --- End of functions from Response #17 WheelCanvas ---


    useEffect(() => {
        drawWheel();
    }, [drawWheel]);

    useEffect(() => {
        if (!internalIsSpinning) {
            // Normalize rotation when items change or spin ends, to keep it within 0-2PI for cleaner state.
            setCurrentWheelRotation(prevRotation => (prevRotation % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI));
        }
    }, [items, internalIsSpinning]); // Only run when items or spinning state changes.


    // THE CRITICAL SPIN METHOD
    const spin = useCallback(() => {
        console.log(`WheelCanvas: spin() called. Current internalIsSpinning: ${internalIsSpinning}, itemCount: ${items.length}`);
        if (internalIsSpinning || items.length === 0) {
            console.warn("WheelCanvas: Spin attempt REJECTED.", { internalIsSpinning, itemCount: items.length });
            return;
        }

        console.log("WheelCanvas: Spin attempt ACCEPTED. Setting internalIsSpinning to true.");
        setInternalIsSpinning(true); // Set spinning BEFORE any async operation or PRNG call

        // Ensure items.length is positive before calling PRNG
        if (items.length <= 0) { // Should be caught by earlier check, but defensive
            console.error("WheelCanvas Error: items.length is not positive for PRNG.");
            setInternalIsSpinning(false); // Reset state
            onSpinEnd(null, { error: "No items to select from" });
            return;
        }

        let winningItemData;
        try {
            // ***** MODIFICATION for PRNGModule BigInt requirement *****
            const prngMaxExclusive = BigInt(items.length);
            if (prngMaxExclusive <= 0n) { // Ensure BigInt is positive
                throw new Error("Calculated prngMaxExclusive is not positive.");
            }
            winningItemData = items[Number(PRNG.nextRandomIntInRange(prngMaxExclusive))]; // Convert result back to Number for array index
        } catch (error) {
            console.error("WheelCanvas Error during PRNG call:", error);
            setInternalIsSpinning(false); // Reset state
            onSpinEnd(null, { error: `PRNG failure: ${error.message}` });
            return;
        }

        if (!winningItemData) {
            console.error("WheelCanvas Error: PRNG returned undefined winning item.");
            setInternalIsSpinning(false); // Reset state
            onSpinEnd(null, { error: "PRNG failed to select an item" });
            return;
        }

        console.log("WheelCanvas: Winning item selected:", winningItemData.name, "Notifying parent via onSpinStart.");
        onSpinStart(winningItemData); // Notify parent AFTER item is selected and BEFORE animation starts

        const numSegments = items.length;
        const segmentAngle = (2 * Math.PI) / numSegments;
        const winningSegmentIndex = items.findIndex(item => item.id === winningItemData.id);

        if (winningSegmentIndex === -1) {
            console.error("WheelCanvas Error: Winning item ID not found post-selection. This is a data integrity issue.");
            setInternalIsSpinning(false);
            onSpinEnd(null, { error: "Selected winning item ID not found in current items list" });
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

        console.log("WheelCanvas: Starting animation.");
        const performAnimationFrame = () => {
            const elapsed = performance.now() - animationStartTime;
            const progress = Math.min(elapsed / (spinDuration || DEFAULT_SPIN_DURATION), 1);
            const easedProgress = easeOutCubic(progress);

            setCurrentWheelRotation(initialRotationForAnimation + (targetAnimationAngle - initialRotationForAnimation) * easedProgress);

            if (progress < 1) {
                animationFrameIdRef.current = requestAnimationFrame(performAnimationFrame);
            } else {
                console.log("WheelCanvas: Animation ended. Finalizing state.");
                setCurrentWheelRotation(finalWheelTargetRotation); // Set to exact final normalized position
                setInternalIsSpinning(false); // CRITICAL: Reset internal spinning flag
                animationFrameIdRef.current = null;
                onSpinEnd(winningItemData);
            }
        };
        animationFrameIdRef.current = requestAnimationFrame(performAnimationFrame);
    }, [
        internalIsSpinning, items, currentWheelRotation, minSpins, spinDuration,
        onSpinStart, onSpinEnd, getPointerTargetAngle, // Props
        // State setters (setInternalIsSpinning, setCurrentWheelRotation) are not in useCallback deps
    ]);

    useImperativeHandle(ref, () => ({
        spin: spin
    }), [spin]);

    useEffect(() => {
        return () => {
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className={`wheel-canvas ${canvasClassName}`}
            role="img"
            aria-label="Color wheel spinner"
        />
    );
});

WheelCanvas.propTypes = { /* ... Unchanged from Response #17 ... */ };
WheelCanvas.displayName = 'WheelCanvas';
export default WheelCanvas;
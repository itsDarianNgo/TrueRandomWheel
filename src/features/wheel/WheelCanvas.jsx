// src/features/wheel/WheelCanvas.jsx
import React, { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import PropTypes from 'prop-types';

// Defaults and helpers (easeOutCubic, isColorLight) are the same as Response #18
const DEFAULT_MIN_SPINS = 5; const DEFAULT_SPIN_DURATION = 7000; const DEFAULT_POINTER_COLOR = '#E53E3E'; const DEFAULT_FONT_FAMILY = '"Inter", Arial, sans-serif'; const DEFAULT_TEXT_COLOR_LIGHT = '#FFFFFF'; const DEFAULT_TEXT_COLOR_DARK = '#1A202C'; const DEFAULT_LIGHT_SEGMENT_STROKE_COLOR = '#FFFFFF'; const DEFAULT_DARK_SEGMENT_STROKE_COLOR = '#4A5568'; const DEFAULT_STROKE_WIDTH = 2; const REFINED_DEFAULT_SEGMENT_COLORS = ['#EC4899', '#F59E0B', '#8B5CF6', '#10B981', '#3B82F6', '#EF4444', '#F97316', '#6366F1', '#14B8A6', '#D946EF', '#A855F7', '#0EA5E9'];
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const isColorLight = (hexColor) => { if (!hexColor || !hexColor.startsWith('#') || (hexColor.length !== 4 && hexColor.length !== 7) ) return false; let hex = hexColor.replace('#', ''); if (hex.length === 3) hex = hex.split('').map(char => char + char).join(''); if (hex.length !== 6) return false; const r = parseInt(hex.substring(0, 2), 16); const g = parseInt(hex.substring(2, 4), 16); const b = parseInt(hex.substring(4, 6), 16); const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; return luma > 160; };


const WheelCanvas = forwardRef(({
                                    items = [], pointerPosition = 'right', onSpinStart = () => {}, onSpinEnd = () => {},
                                    onWheelClick = () => {}, minSpins = DEFAULT_MIN_SPINS, spinDuration = DEFAULT_SPIN_DURATION,
                                    width = 480, height = 480, pointerColor = DEFAULT_POINTER_COLOR, fontFamily = DEFAULT_FONT_FAMILY,
                                    overrideTextColor, overrideSegmentStrokeColor, segmentStrokeWidth = DEFAULT_STROKE_WIDTH,
                                    defaultSegmentColors = REFINED_DEFAULT_SEGMENT_COLORS, canvasClassName = '',
                                    wheelStatus = 'idle',
                                    wheelSurfaceImageUrl = null, // New prop
                                    segmentOpacity = 0.85,
                                }, ref) => {
    const canvasRef = useRef(null);
    const [internalIsSpinning, setInternalIsSpinning] = useState(false);
    const [currentWheelRotation, setCurrentWheelRotation] = useState(0);
    const animationFrameIdRef = useRef(null);

    // State for wheel surface image
    const [surfaceImage, setSurfaceImage] = useState(null); // HTMLImageElement
    const [surfaceImageStatus, setSurfaceImageStatus] = useState('idle'); // 'idle', 'loading', 'loaded', 'error'

    // Effect to load wheelSurfaceImageUrl
    useEffect(() => {
        if (wheelSurfaceImageUrl && /^(https?:\/\/)/i.test(wheelSurfaceImageUrl)) {
            setSurfaceImageStatus('loading');
            const img = new Image();
            // OMITTING img.crossOrigin = "Anonymous"; for MVP to maximize loading success from various URLs
            // Add comment: // For canvas.toDataURL() or getImageData() with cross-origin images,
            // img.crossOrigin = "Anonymous"; would be needed, AND server must provide CORS headers.
            img.onload = () => {
                setSurfaceImage(img);
                setSurfaceImageStatus('loaded');
            };
            img.onerror = () => {
                console.warn("Failed to load wheel surface image:", wheelSurfaceImageUrl);
                setSurfaceImage(null);
                setSurfaceImageStatus('error');
            };
            img.src = wheelSurfaceImageUrl;

            return () => { // Cleanup
                img.onload = null;
                img.onerror = null;
            };
        } else {
            setSurfaceImage(null);
            setSurfaceImageStatus('idle'); // No URL or invalid scheme
        }
    }, [wheelSurfaceImageUrl]);

    const getPointerTargetAngle = useCallback(() => { /* ... same as Response #18 ... */ switch (pointerPosition) { case 'top': return 1.5 * Math.PI; case 'bottom': return 0.5 * Math.PI; case 'left': return Math.PI; case 'right': default: return 0; } }, [pointerPosition]);
    const drawSegmentText = useCallback((ctx, item, textX, textY, maxTextWidth, radius, numSegments, itemActualColor) => { /* ... same as Response #18 ... */ const baseFontSize = radius / (numSegments === 1 ? 6 : (numSegments > 10 ? 12 : 10)); const dynamicFontSize = Math.max(12, Math.min(numSegments === 1 ? 40 : (numSegments > 6 ? 22 : 28), baseFontSize)); ctx.font = `600 ${dynamicFontSize}px ${fontFamily}`; ctx.fillStyle = overrideTextColor || (isColorLight(itemActualColor) ? DEFAULT_TEXT_COLOR_DARK : DEFAULT_TEXT_COLOR_LIGHT); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; let displayText = item.name; if (ctx.measureText(displayText).width > maxTextWidth) { for (let i = displayText.length - 1; i > 0; i--) { displayText = item.name.substring(0, i) + '...'; if (ctx.measureText(displayText).width <= maxTextWidth) break; } if (ctx.measureText(displayText).width > maxTextWidth) { displayText = item.name.substring(0,1); if (ctx.measureText(displayText).width > maxTextWidth && item.name.length > 0) displayText = ""; } } ctx.save(); ctx.translate(textX, textY); ctx.fillText(displayText, 0, 0); ctx.restore(); }, [fontFamily, overrideTextColor]);

    // Modified drawSegment to use segmentOpacity prop
    const drawSegment = useCallback((ctx, item, index, numSegments, centerX, centerY, radius, hasSurfaceImage) => {
        const itemActualColor = item.color || defaultSegmentColors[index % defaultSegmentColors.length];
        let currentSegmentStrokeStyle;
        if (overrideSegmentStrokeColor && overrideSegmentStrokeColor !== 'transparent') {
            currentSegmentStrokeStyle = overrideSegmentStrokeColor;
        } else {
            currentSegmentStrokeStyle = isColorLight(itemActualColor) ? DEFAULT_DARK_SEGMENT_STROKE_COLOR : DEFAULT_LIGHT_SEGMENT_STROKE_COLOR;
        }

        const segmentAngle = (2 * Math.PI) / numSegments;
        const startAngle = index * segmentAngle;
        const endAngle = startAngle + segmentAngle;

        if (item.color) {
            ctx.fillStyle = item.color;
            if (hasSurfaceImage) {
                ctx.globalAlpha = segmentOpacity; // Use prop here
            }
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fill();
            if (hasSurfaceImage) {
                ctx.globalAlpha = 1.0; // Reset alpha
            }
        } else if (!hasSurfaceImage) {
            ctx.fillStyle = defaultSegmentColors[index % defaultSegmentColors.length];
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fill();
        }
        // If no item.color AND hasSurfaceImage, this segment area will be transparent, showing the surface image.

        // Draw stroke
        if (segmentStrokeWidth > 0 && numSegments > 1) { // Avoid stroke for single item full circle fill unless desired
            ctx.strokeStyle = currentSegmentStrokeStyle;
            ctx.lineWidth = segmentStrokeWidth;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath(); // Close path before stroke to avoid line to center for last segment
            ctx.stroke();
        }

        // Draw text (same logic as before)
        if (numSegments === 1) {
            const maxTextWidthForSingle = radius * 1.6;
            drawSegmentText(ctx, item, centerX, centerY, maxTextWidthForSingle, radius, numSegments, item.color || defaultSegmentColors[index % defaultSegmentColors.length]);
        } else {
            const textRadius = radius * 0.65;
            const textAngle = startAngle + segmentAngle / 2;
            const textX = centerX + textRadius * Math.cos(textAngle);
            const textY = centerY + textRadius * Math.sin(textAngle);
            const maxTextWidthForSegment = (2 * textRadius * Math.sin(segmentAngle / 2)) * 0.80;
            drawSegmentText(ctx, item, textX, textY, maxTextWidthForSegment, radius, numSegments, item.color || defaultSegmentColors[index % defaultSegmentColors.length]);
        }

    }, [fontFamily, defaultSegmentColors, segmentStrokeWidth, overrideTextColor, overrideSegmentStrokeColor, drawSegmentText, segmentOpacity]);


    const drawPointer = useCallback((ctx, centerX, centerY, radius) => { /* ... same as Response #18 ... */ const pointerAngle = getPointerTargetAngle(); const pointerLength = radius * 0.18; const pointerHalfWidthAtBase = radius * 0.05; ctx.fillStyle = pointerColor; ctx.beginPath(); const tipX = centerX + (radius + segmentStrokeWidth) * Math.cos(pointerAngle); const tipY = centerY + (radius + segmentStrokeWidth) * Math.sin(pointerAngle); const baseCenterX = centerX + (radius + segmentStrokeWidth + pointerLength) * Math.cos(pointerAngle); const baseCenterY = centerY + (radius + segmentStrokeWidth + pointerLength) * Math.sin(pointerAngle); const perpAngle1 = pointerAngle + Math.PI / 2; const perpAngle2 = pointerAngle - Math.PI / 2; const baseX1 = baseCenterX + pointerHalfWidthAtBase * Math.cos(perpAngle1); const baseY1 = baseCenterY + pointerHalfWidthAtBase * Math.sin(perpAngle1); const baseX2 = baseCenterX + pointerHalfWidthAtBase * Math.cos(perpAngle2); const baseY2 = baseCenterY + pointerHalfWidthAtBase * Math.sin(perpAngle2); ctx.moveTo(tipX, tipY); ctx.lineTo(baseX1, baseY1); ctx.lineTo(baseX2, baseY2); ctx.closePath(); ctx.fill(); }, [getPointerTargetAngle, pointerColor, segmentStrokeWidth]);

    const drawWheel = useCallback(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const numSegments = items.length;
        const centerX = width / 2; const centerY = height / 2;
        const wheelRadius = Math.min(centerX, centerY) * 0.90;
        ctx.clearRect(0, 0, width, height);

        // Draw Wheel Surface Image (if loaded and ready)
        const canDrawSurfaceImage = surfaceImageStatus === 'loaded' && surfaceImage;
        if (canDrawSurfaceImage) {
            ctx.save();
            // Create circular clipping path
            ctx.beginPath();
            ctx.arc(centerX, centerY, wheelRadius, 0, 2 * Math.PI, false);
            ctx.closePath();
            ctx.clip();

            // Calculate "cover" dimensions
            const img = surfaceImage;
            const imgAspectRatio = img.width / img.height;
            const wheelDiameter = wheelRadius * 2;
            let scaledWidth, scaledHeight, dx, dy;

            if (imgAspectRatio > 1) { // Image is wider than tall
                scaledHeight = wheelDiameter;
                scaledWidth = img.width * (wheelDiameter / img.height);
                dx = centerX - scaledWidth / 2;
                dy = centerY - wheelRadius; // (centerY - scaledHeight / 2)
            } else { // Image is taller than wide, or square
                scaledWidth = wheelDiameter;
                scaledHeight = img.height * (wheelDiameter / img.width);
                dx = centerX - wheelRadius; // (centerX - scaledWidth / 2)
                dy = centerY - scaledHeight / 2;
            }
            ctx.drawImage(img, dx, dy, scaledWidth, scaledHeight);
            ctx.restore(); // Remove clipping path
        }

        // Rotate canvas for segments if there are items
        if (numSegments > 0) {
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(currentWheelRotation);
            items.forEach((item, index) => {
                drawSegment(ctx, item, index, numSegments, 0, 0, wheelRadius, canDrawSurfaceImage);
            });
            ctx.restore();
        } else if (wheelStatus === 'idle' && !internalIsSpinning) { // Empty state message if no items
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#6B7280';
            ctx.font = `500 ${Math.max(14, wheelRadius / 15)}px ${fontFamily}`;
            ctx.fillText("Wheel is empty.", centerX, centerY - 10);
            ctx.font = `400 ${Math.max(12, wheelRadius / 20)}px ${fontFamily}`;
            ctx.fillText("Add items in settings.", centerX, centerY + 10);
        }

        // Generic busy indicator for shuffling (if status is set by thunk)
        if (wheelStatus === 'shuffle_animating') {
            ctx.fillStyle = 'rgba(40, 48, 64, 0.6)';
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
            ctx.font = `600 ${Math.max(16, wheelRadius / 12)}px ${fontFamily}`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('Shuffling...', centerX, centerY);
        }
        drawPointer(ctx, centerX, centerY, wheelRadius);
    }, [items, width, height, currentWheelRotation, fontFamily, drawSegment, drawPointer, internalIsSpinning, wheelStatus, surfaceImage, surfaceImageStatus, segmentOpacity]);

    useEffect(() => { drawWheel(); }, [drawWheel]); // Redraw whenever drawWheel or its dependencies change

    useEffect(() => { /* ... same as Response #18 (normalize rotation) ... */ if (wheelStatus === 'idle' && !internalIsSpinning) { setCurrentWheelRotation(prev => (prev % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI)); } }, [items, internalIsSpinning, wheelStatus]);
    const performTargetedSpin = useCallback((targetItemToWin, minSpinsOverride, spinDurationOverride) => { /* ... same as Response #18 ... */ if (internalIsSpinning || wheelStatus !== 'spinning' || items.length === 0 || !targetItemToWin) { if (!targetItemToWin) console.error("WheelCanvas: spinToTarget called without a targetItemToWin."); else if (items.length === 0) console.error("WheelCanvas: spinToTarget called with no items on the wheel."); else if (internalIsSpinning) console.warn("WheelCanvas: spinToTarget called while already spinning."); else if (wheelStatus !== 'spinning') console.warn("WheelCanvas: spinToTarget called when wheelStatus is not 'spinning'. Current status:", wheelStatus); onSpinEnd(null, { error: "Spin conditions not met or no target." }); return; } setInternalIsSpinning(true); onSpinStart(targetItemToWin); const numSegments = items.length; const segmentAngle = (2 * Math.PI) / numSegments; const winningItemIndex = items.findIndex(item => item.id === targetItemToWin.id); if (winningItemIndex === -1) { console.error("WheelCanvas: Target item ID not found in current wheel items:", targetItemToWin.id); setInternalIsSpinning(false); onSpinEnd(null, { error: "Target item not found on wheel." }); return; } const winningSegmentCenterRelativeAngle = (winningItemIndex * segmentAngle) + (segmentAngle / 2); const pointerAbsoluteTargetAngle = getPointerTargetAngle(); let finalWheelRotation = pointerAbsoluteTargetAngle - winningSegmentCenterRelativeAngle; finalWheelRotation = (finalWheelRotation % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI); const normalizedCurrentRotation = (currentWheelRotation % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI); let rotationDelta = (finalWheelRotation - normalizedCurrentRotation + (2 * Math.PI)) % (2 * Math.PI); const actualMinSpins = minSpinsOverride !== undefined ? minSpinsOverride : minSpins; const actualSpinDuration = spinDurationOverride !== undefined ? spinDurationOverride : spinDuration; const targetAnimationAngle = currentWheelRotation + rotationDelta + (actualMinSpins * 2 * Math.PI); const animationStartTime = performance.now(); const initialRotationForAnimation = currentWheelRotation; const performAnimationFrame = () => { const elapsedTime = performance.now() - animationStartTime; let progress = Math.min(elapsedTime / actualSpinDuration, 1); if (progress > 1) progress = 1; const easedProgress = easeOutCubic(progress); setCurrentWheelRotation(initialRotationForAnimation + (targetAnimationAngle - initialRotationForAnimation) * easedProgress); if (progress < 1) { animationFrameIdRef.current = requestAnimationFrame(performAnimationFrame); } else { setCurrentWheelRotation(finalWheelRotation); setInternalIsSpinning(false); animationFrameIdRef.current = null; onSpinEnd(targetItemToWin, null); } }; animationFrameIdRef.current = requestAnimationFrame(performAnimationFrame); }, [items, internalIsSpinning, wheelStatus, currentWheelRotation, getPointerTargetAngle, onSpinStart, onSpinEnd, minSpins, spinDuration]);

    useImperativeHandle(ref, () => ({ /* ... same as Response #18 (only spinToTarget) ... */ spinToTarget: (targetItem, minSpinsOverride, spinDurationOverride) => { performTargetedSpin(targetItem, minSpinsOverride, spinDurationOverride); } }), [performTargetedSpin]);
    useEffect(() => { /* ... same as Response #18 (cleanup animationFrameIdRef) ... */ return () => { if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current); }; }, []);

    const canBeClicked = wheelStatus === 'idle' && items.length > 0;
    return ( /* ... same canvas JSX as Response #18 ... */ <canvas ref={canvasRef} width={width} height={height} onClick={canBeClicked ? onWheelClick : undefined} className={`wheel-canvas ${canvasClassName} rounded-full ${canBeClicked ? 'cursor-pointer hover:opacity-90 active:opacity-80' : 'cursor-default'} transition-opacity duration-150 ease-in-out`} role={canBeClicked ? "button" : undefined} tabIndex={canBeClicked ? 0 : -1} aria-label={canBeClicked ? "Spin the wheel" : "Wheel is busy or empty"} /> );
});

WheelCanvas.propTypes = { /* ... same as Response #18, plus wheelSurfaceImageUrl ... */
    items: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired, name: PropTypes.string.isRequired, color: PropTypes.string, sourceGroup: PropTypes.string, })).isRequired,
    pointerPosition: PropTypes.oneOf(['top', 'right', 'bottom', 'left']),
    onSpinStart: PropTypes.func, onSpinEnd: PropTypes.func, onWheelClick: PropTypes.func,
    minSpins: PropTypes.number, spinDuration: PropTypes.number, width: PropTypes.number, height: PropTypes.number, pointerColor: PropTypes.string,
    fontFamily: PropTypes.string, overrideTextColor: PropTypes.string, overrideSegmentStrokeColor: PropTypes.string,
    segmentStrokeWidth: PropTypes.number, defaultSegmentColors: PropTypes.arrayOf(PropTypes.string), canvasClassName: PropTypes.string,
    wheelStatus: PropTypes.string.isRequired,
    wheelSurfaceImageUrl: PropTypes.string,
    segmentOpacity: PropTypes.number,
};
WheelCanvas.displayName = 'WheelCanvas';
export default WheelCanvas;
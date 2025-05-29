// src/features/wheel/WheelCanvas.jsx
import React, { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import PropTypes from 'prop-types';

// Default Values & Helper Functions (Unchanged - these are standard visual defaults)
const DEFAULT_MIN_SPINS = 5; const DEFAULT_SPIN_DURATION = 7000; const DEFAULT_POINTER_COLOR = '#E53E3E';
const DEFAULT_FONT_FAMILY = '"Inter", Arial, sans-serif'; const DEFAULT_TEXT_COLOR_LIGHT = '#FFFFFF';
const DEFAULT_TEXT_COLOR_DARK = '#1A202C'; const DEFAULT_LIGHT_SEGMENT_STROKE_COLOR = '#FFFFFF';
const DEFAULT_DARK_SEGMENT_STROKE_COLOR = '#4A5568'; const DEFAULT_STROKE_WIDTH = 2;
const REFINED_DEFAULT_SEGMENT_COLORS = ['#EC4899', '#F59E0B', '#8B5CF6', '#10B981', '#3B82F6', '#EF4444', '#F97316', '#6366F1', '#14B8A6', '#D946EF', '#A855F7', '#0EA5E9'];
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const isColorLight = (hexColor) => { if (!hexColor || !hexColor.startsWith('#') || (hexColor.length !== 4 && hexColor.length !== 7) ) return false; let hex = hexColor.replace('#', ''); if (hex.length === 3) hex = hex.split('').map(char => char + char).join(''); if (hex.length !== 6) return false; const r = parseInt(hex.substring(0, 2), 16); const g = parseInt(hex.substring(2, 4), 16); const b = parseInt(hex.substring(4, 6), 16); const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; return luma > 160; };
const drawSegmentBaseOnContext = ( ctx, processedItem, itemsOriginal, numSegments, centerX, centerY, radius, hasSurfaceImage, segmentOpacityProp, segmentStrokeWidthProp, overrideSegmentStrokeColorProp, defaultSegmentColorsArr, logicalDpr ) => { /* ... same as Response #80 ... */ const index = itemsOriginal.findIndex(it => it.id === processedItem.id); if (index === -1) return; const segmentAngle = (2 * Math.PI) / numSegments; const startAngle = index * segmentAngle; const endAngle = startAngle + segmentAngle; if (processedItem.finalSegmentColor) { ctx.fillStyle = processedItem.finalSegmentColor; const originalItem = itemsOriginal[index]; if (hasSurfaceImage && originalItem && originalItem.color) { ctx.globalAlpha = segmentOpacityProp; } else { ctx.globalAlpha = 1.0; } ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.arc(centerX, centerY, radius, startAngle, endAngle); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1.0; } if (segmentStrokeWidthProp > 0 && numSegments > 1) { const strokeColor = overrideSegmentStrokeColorProp || (isColorLight(processedItem.finalSegmentColor) ? DEFAULT_DARK_SEGMENT_STROKE_COLOR : DEFAULT_LIGHT_SEGMENT_STROKE_COLOR); ctx.strokeStyle = strokeColor; ctx.lineWidth = segmentStrokeWidthProp; ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.arc(centerX, centerY, radius, startAngle, endAngle, false); ctx.closePath(); ctx.stroke(); } };


const WheelCanvas = forwardRef(({
                                    items = [], pointerPosition = 'right', onSpinStart = () => {}, onSpinEnd = () => {},
                                    onWheelClick = () => {}, minSpins = DEFAULT_MIN_SPINS, spinDuration = DEFAULT_SPIN_DURATION,
                                    width = 480, height = 480, pointerColor = DEFAULT_POINTER_COLOR, fontFamily = DEFAULT_FONT_FAMILY,
                                    overrideTextColor, overrideSegmentStrokeColor, segmentStrokeWidth = DEFAULT_STROKE_WIDTH,
                                    defaultSegmentColors = REFINED_DEFAULT_SEGMENT_COLORS, canvasClassName = '',
                                    wheelStatus = 'idle', wheelSurfaceImageUrl = null, segmentOpacity = 0.85,
                                }, ref) => {
    // console.log('[WheelCanvas] Render. Status:', wheelStatus, 'Items:', items.length, 'Width:', width); // Basic log
    const visibleCanvasRef = useRef(null);
    const offscreenCanvasRef = useRef(null);
    const [dpr, setDpr] = useState(1);
    const [isOffscreenCanvasReady, setIsOffscreenCanvasReady] = useState(false);
    const [internalIsSpinning, setInternalIsSpinning] = useState(false);
    const [currentWheelRotation, setCurrentWheelRotation] = useState(0);
    const animationFrameIdRef = useRef(null);
    const [surfaceImage, setSurfaceImage] = useState(null);
    const [surfaceImageStatus, setSurfaceImageStatus] = useState('idle');
    const [processedTextItems, setProcessedTextItems] = useState([]);

    useEffect(() => { setDpr(window.devicePixelRatio || 1); }, []);
    useEffect(() => { /* ... Sizing effect from #80, with console logs ... */ if (visibleCanvasRef.current && width > 0 && height > 0 && dpr > 0) { const canvas = visibleCanvasRef.current; const ctx = canvas.getContext('2d'); canvas.width = width * dpr; canvas.height = height * dpr; canvas.style.width = `${width}px`; canvas.style.height = `${height}px`; ctx.scale(dpr, dpr); if (!offscreenCanvasRef.current) { offscreenCanvasRef.current = document.createElement('canvas'); } const offscreenCanvas = offscreenCanvasRef.current; offscreenCanvas.width = width * dpr; offscreenCanvas.height = height * dpr; const offscreenCtx = offscreenCanvas.getContext('2d'); offscreenCtx.scale(dpr, dpr); setIsOffscreenCanvasReady(false); } }, [width, height, dpr]);
    useEffect(() => { /* ... Image loading effect from #80, with console logs ... */ if (wheelSurfaceImageUrl && /^(https?:\/\/|data:image\/)/i.test(wheelSurfaceImageUrl)) { setSurfaceImageStatus('loading'); const img = new Image(); img.onload = () => { setSurfaceImage(img); setSurfaceImageStatus('loaded'); }; img.onerror = () => { console.warn("[WheelCanvas] Failed to load wheel surface image:", wheelSurfaceImageUrl); setSurfaceImage(null); setSurfaceImageStatus('error');}; img.src = wheelSurfaceImageUrl; return () => { img.onload = null; img.onerror = null; }; } else { setSurfaceImage(null); setSurfaceImageStatus(wheelSurfaceImageUrl ? 'error' : 'idle'); } }, [wheelSurfaceImageUrl]);
    useEffect(() => { /* ... Text pre-calc effect from #80, with console logs ... */ if (items.length === 0 || width === 0 || height === 0) { setProcessedTextItems([]); return; } const tempCanvas = document.createElement('canvas'); const ctx = tempCanvas.getContext('2d'); const numSegments = items.length; const wheelRadius = Math.min(width / 2, height / 2) * 0.90; const newProcessedItems = items.map((item, index) => { let fontSizeToUse; let maxTextLengthPx; let textLayoutProps; let displayText = item.name; const finalSegmentColor = item.color || defaultSegmentColors[index % defaultSegmentColors.length]; const finalTextColor = overrideTextColor || (isColorLight(finalSegmentColor) ? DEFAULT_TEXT_COLOR_DARK : DEFAULT_TEXT_COLOR_LIGHT); if (numSegments === 1) { const baseSize = wheelRadius / 6; fontSizeToUse = `600 ${Math.max(12, Math.min(40, baseSize))}px ${fontFamily}`; maxTextLengthPx = wheelRadius * 1.6; textLayoutProps = { x: 0, y: 0, angle: 0, maxWidth: maxTextLengthPx, type: 'horizontal-center' }; } else { const baseSize = wheelRadius / (numSegments > 12 ? 14 : (numSegments > 8 ? 12 : 10) ); fontSizeToUse = `600 ${Math.max(9, Math.min(numSegments > 8 ? 16 : (numSegments > 4 ? 20 : 24), baseSize))}px ${fontFamily}`; const textInnerRadiusFactor = 0.25; const textOuterRadiusPaddingFactor = 0.05; const textStartRadialOffset = wheelRadius * textInnerRadiusFactor; maxTextLengthPx = wheelRadius * (1 - textInnerRadiusFactor - textOuterRadiusPaddingFactor); const segmentAngle = (2 * Math.PI) / numSegments; const itemAngle = (index * segmentAngle) + (segmentAngle / 2); textLayoutProps = { x: textStartRadialOffset, y: 0, angle: itemAngle, maxWidth: maxTextLengthPx, type: 'radial' }; } ctx.font = fontSizeToUse; let textWidth = ctx.measureText(displayText).width; if (textWidth > maxTextLengthPx) { for (let k = displayText.length - 1; k > 0; k--) { displayText = item.name.substring(0, k) + "..."; textWidth = ctx.measureText(displayText).width; if (textWidth <= maxTextLengthPx) break; } if (textWidth > maxTextLengthPx) { displayText = item.name.substring(0, Math.max(0, Math.floor(maxTextLengthPx / (ctx.measureText("M")?.width || 10)))) + "..."; if (ctx.measureText(displayText).width > maxTextLengthPx && displayText.length > 3) { displayText = displayText.substring(0, displayText.length - 4) + "..."; } if (ctx.measureText(displayText).width > maxTextLengthPx) displayText = "..."; textWidth = ctx.measureText(displayText).width; } } if (textLayoutProps.type === 'radial' && textWidth < maxTextLengthPx) { const centeringOffset = (maxTextLengthPx - textWidth) / 2; textLayoutProps.x += centeringOffset; } return { id: item.id, originalName: item.name, displayText, textWidth, fontSizeToUse, finalTextColor, finalSegmentColor, textLayoutProps, }; }); setProcessedTextItems(newProcessedItems); }, [items, width, height, fontFamily, defaultSegmentColors, overrideTextColor, dpr]);
    useEffect(() => { /* ... Offscreen render effect from #80, with console logs ... */ if (!offscreenCanvasRef.current || !visibleCanvasRef.current || !dpr ) { setIsOffscreenCanvasReady(false); return; } if (items.length === 0) { const offCtx = offscreenCanvasRef.current.getContext('2d'); offCtx.clearRect(0, 0, width, height); setIsOffscreenCanvasReady(false); return; } if (processedTextItems.length !== items.length) { setIsOffscreenCanvasReady(false); return; } if (wheelSurfaceImageUrl && surfaceImageStatus === 'loading') { setIsOffscreenCanvasReady(false); return; } const offscreenCtx = offscreenCanvasRef.current.getContext('2d'); offscreenCtx.clearRect(0, 0, width, height); const logicalCenterX = width / 2; const logicalCenterY = height / 2; const wheelRadius = Math.min(logicalCenterX, logicalCenterY) * 0.90; const numSegments = items.length; offscreenCtx.save(); offscreenCtx.translate(logicalCenterX, logicalCenterY); const canDrawSurfaceImage = surfaceImageStatus === 'loaded' && surfaceImage; if (canDrawSurfaceImage) { offscreenCtx.save(); offscreenCtx.beginPath(); offscreenCtx.arc(0, 0, wheelRadius, 0, 2 * Math.PI, false); offscreenCtx.closePath(); offscreenCtx.clip(); const img = surfaceImage; const imgAspectRatio = img.width / img.height; const wheelDiameter = wheelRadius * 2; let scaledWidth, scaledHeight, dx, dy; if (imgAspectRatio > 1) { scaledHeight = wheelDiameter; scaledWidth = img.width * (wheelDiameter / img.height); dx = -scaledWidth / 2; dy = -wheelRadius; } else { scaledWidth = wheelDiameter; scaledHeight = img.height * (wheelDiameter / img.width); dx = -wheelRadius; dy = -scaledHeight / 2; } offscreenCtx.drawImage(img, dx, dy, scaledWidth, scaledHeight); offscreenCtx.restore(); } processedTextItems.forEach((processedItem) => { drawSegmentBaseOnContext(offscreenCtx, processedItem, items, numSegments, 0, 0, wheelRadius, canDrawSurfaceImage, segmentOpacity, segmentStrokeWidth, overrideSegmentStrokeColor, defaultSegmentColors, dpr); const { displayText, fontSizeToUse, finalTextColor, textLayoutProps } = processedItem; if (!displayText) return; offscreenCtx.font = fontSizeToUse; offscreenCtx.fillStyle = finalTextColor; if (textLayoutProps.type === 'horizontal-center') { offscreenCtx.textAlign = 'center'; offscreenCtx.textBaseline = 'middle'; offscreenCtx.fillText(displayText, 0, 0, textLayoutProps.maxWidth); } else if (textLayoutProps.type === 'radial') { offscreenCtx.save(); offscreenCtx.rotate(textLayoutProps.angle); offscreenCtx.textAlign = 'left'; offscreenCtx.textBaseline = 'middle'; offscreenCtx.fillText(displayText, textLayoutProps.x, textLayoutProps.y, textLayoutProps.maxWidth); offscreenCtx.restore(); } }); offscreenCtx.restore(); setIsOffscreenCanvasReady(true); }, [processedTextItems, items, surfaceImage, surfaceImageStatus, wheelSurfaceImageUrl, width, height, dpr, segmentOpacity, fontFamily, defaultSegmentColors, overrideTextColor, overrideSegmentStrokeColor, segmentStrokeWidth]);

    const getPointerTargetAngle = useCallback(() => pointerPosition === 'top' ? 1.5 * Math.PI : pointerPosition === 'bottom' ? 0.5 * Math.PI : pointerPosition === 'left' ? Math.PI : 0, [pointerPosition]);
    const drawPointer = useCallback((ctx, logicalCenterX, logicalCenterY, logicalRadius) => { /* ... same as #80 ... */ const pointerAngle = getPointerTargetAngle(); const pointerLength = logicalRadius * 0.18; const pointerHalfWidthAtBase = logicalRadius * 0.05; const strokeWidthInLogical = segmentStrokeWidth; ctx.fillStyle = pointerColor; ctx.beginPath(); const tipX = logicalCenterX + (logicalRadius + strokeWidthInLogical ) * Math.cos(pointerAngle); const tipY = logicalCenterY + (logicalRadius + strokeWidthInLogical) * Math.sin(pointerAngle); const baseCenterX = logicalCenterX + (logicalRadius + strokeWidthInLogical + pointerLength) * Math.cos(pointerAngle); const baseCenterY = logicalCenterY + (logicalRadius + strokeWidthInLogical + pointerLength) * Math.sin(pointerAngle); const perpAngle1 = pointerAngle + Math.PI / 2; const perpAngle2 = pointerAngle - Math.PI / 2; const baseX1 = baseCenterX + pointerHalfWidthAtBase * Math.cos(perpAngle1); const baseY1 = baseCenterY + pointerHalfWidthAtBase * Math.sin(perpAngle1); const baseX2 = baseCenterX + pointerHalfWidthAtBase * Math.cos(perpAngle2); const baseY2 = baseCenterY + pointerHalfWidthAtBase * Math.sin(perpAngle2); ctx.moveTo(tipX, tipY); ctx.lineTo(baseX1, baseY1); ctx.lineTo(baseX2, baseY2); ctx.closePath(); ctx.fill(); }, [getPointerTargetAngle, pointerColor, segmentStrokeWidth, dpr]);

    const drawWheel = useCallback(() => { /* ... same as Response #80 with refined placeholder logic ... */ const canvas = visibleCanvasRef.current; if (!canvas || width === 0 || height === 0 || !dpr ) return; const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, width, height); const centerX = width / 2; const centerY = height / 2; const wheelRadius = Math.min(centerX, centerY) * 0.90; if (items.length === 0) { ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#6B7280'; ctx.font = `500 ${Math.max(14, wheelRadius / 15)}px ${fontFamily}`; ctx.fillText("Wheel is empty.", centerX, centerY - 10); ctx.font = `400 ${Math.max(12, wheelRadius / 20)}px ${fontFamily}`; ctx.fillText("Add items in settings.", centerX, centerY + 10); drawPointer(ctx, centerX, centerY, wheelRadius); return; } let showPlaceholder = false; let placeholderMessage = "Preparing Wheel..."; if (wheelStatus === 'shuffle_animating' && !internalIsSpinning) { showPlaceholder = true; placeholderMessage = 'Shuffling...'; } else if (!isOffscreenCanvasReady) { showPlaceholder = true; if (wheelSurfaceImageUrl && surfaceImageStatus === 'loading') { placeholderMessage = 'Loading Image...'; } else if (processedTextItems.length !== items.length && items.length > 0) { placeholderMessage = 'Processing Items...';} } if (showPlaceholder) { ctx.fillStyle = "rgba(60, 70, 90, 0.8)"; ctx.beginPath(); ctx.arc(centerX, centerY, wheelRadius, 0, 2 * Math.PI); ctx.fill(); ctx.fillStyle = "white"; ctx.font = `600 ${Math.max(16, width / 20)}px ${fontFamily}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(placeholderMessage, centerX, centerY); } else { ctx.save(); ctx.translate(centerX, centerY); ctx.rotate(currentWheelRotation); ctx.drawImage(offscreenCanvasRef.current, -centerX, -centerY, width, height); ctx.restore(); } drawPointer(ctx, centerX, centerY, wheelRadius); }, [width, height, dpr, items, currentWheelRotation, isOffscreenCanvasReady, internalIsSpinning, wheelStatus, fontFamily, drawPointer, surfaceImageStatus, wheelSurfaceImageUrl, processedTextItems]);
    useEffect(() => { drawWheel(); }, [drawWheel]);

    const performTargetedSpin = useCallback((targetItemToWin, minSpinsOverride, spinDurationOverride) => {
        console.log('[WheelCanvas] performTargetedSpin called. Target:', targetItemToWin?.name, 'WheelStatus:', wheelStatus, 'InternalSpinning:', internalIsSpinning, '#Items:', items.length);
        if (internalIsSpinning || wheelStatus !== 'spinning' || items.length === 0 || !targetItemToWin) {
            console.warn('[WheelCanvas] performTargetedSpin: Pre-conditions not met. Bailing.', {internalIsSpinning, wheelStatusProp: wheelStatus, itemsLen: items.length, targetItemToWin});
            onSpinEnd(null, { error: "Spin pre-conditions not met in WheelCanvas performTargetedSpin." });
            return;
        }

        // ***** DETAILED LOGGING FOR ANGLE CALCULATIONS *****
        const numSegments = items.length;
        const segmentAngle = (2 * Math.PI) / numSegments;
        const winningItemIndex = items.findIndex(item => item.id === targetItemToWin.id);

        if (winningItemIndex === -1) { // Should have been caught by parent thunk, but double check
            console.error("WheelCanvas: Critical - Target item for spin not found in items array.", targetItemToWin);
            setInternalIsSpinning(false); // Reset if we somehow got here
            onSpinEnd(null, { error: "Target item for spin not found." });
            return;
        }

        const winningSegmentCenterRelativeAngle = (winningItemIndex * segmentAngle) + (segmentAngle / 2);
        const pointerAbsoluteTargetAngle = getPointerTargetAngle(); // Uses pointerPosition prop
        const fwr_unnormalized = pointerAbsoluteTargetAngle - winningSegmentCenterRelativeAngle;
        const finalWheelRotation = (fwr_unnormalized % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI);

        // Use currentWheelRotation from state at the moment this function is called
        const normalizedCurrentRotationVal = (currentWheelRotation % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI);
        const rotationDelta = (finalWheelRotation - normalizedCurrentRotationVal + (2 * Math.PI)) % (2 * Math.PI);

        const actualMinSpins = minSpinsOverride !== undefined ? minSpinsOverride : minSpins;
        const actualSpinDuration = spinDurationOverride !== undefined ? spinDurationOverride : spinDuration;

        // initialRotationForAnimation should be the wheel's rotation *at the start of this specific spin sequence*
        const initialRotationForAnimation = currentWheelRotation;
        const targetAnimationAngle = initialRotationForAnimation + rotationDelta + (actualMinSpins * 2 * Math.PI);

        console.log('--- Target Angle Calculation ---');
        console.log('items.length:', items.length);
        console.log('targetItemToWin.id:', targetItemToWin.id);
        console.log('winningItemIndex:', winningItemIndex);
        console.log('segmentAngle:', segmentAngle);
        console.log('winningSegmentCenterRelativeAngle:', winningSegmentCenterRelativeAngle);
        console.log('pointerAbsoluteTargetAngle:', pointerAbsoluteTargetAngle);
        console.log('fwr_unnormalized (pointer - winning_segment_center):', fwr_unnormalized);
        console.log('finalWheelRotation (normalized target landing angle):', finalWheelRotation);
        console.log('initialRotationForAnimation (currentWheelRotation at spin start):', initialRotationForAnimation);
        console.log('normalizedCurrentRotationVal (for delta calc):', normalizedCurrentRotationVal);
        console.log('rotationDelta:', rotationDelta);
        console.log('actualMinSpins:', actualMinSpins);
        console.log('TARGET_ANIMATION_ANGLE:', targetAnimationAngle);
        console.log('--- End Target Angle Calculation ---');

        if (isNaN(targetAnimationAngle) || isNaN(initialRotationForAnimation)) {
            console.error("CRITICAL: NaN detected in angle calculation. Aborting spin.", {targetAnimationAngle, initialRotationForAnimation});
            onSpinEnd(null, { error: "NaN in spin angle calculation." });
            // Do not setInternalIsSpinning(true) if we abort here before animation starts
            return;
        }

        setInternalIsSpinning(true);
        onSpinStart(targetItemToWin); // Call AFTER all checks and before animation starts
        const animationStartTime = performance.now();

        const performAnimationFrame = () => {
            const elapsedTime = performance.now() - animationStartTime;
            let progress = Math.min(elapsedTime / actualSpinDuration, 1);
            if (progress < 0) progress = 0; // Safety for elapsedTime issues
            if (progress > 1) progress = 1;

            const easedProgress = easeOutCubic(progress);
            const newRotation = initialRotationForAnimation + (targetAnimationAngle - initialRotationForAnimation) * easedProgress;

            if (isNaN(newRotation)) {
                console.error("CRITICAL: newRotation became NaN during animation. Bailing.", {initialRotationForAnimation, targetAnimationAngle, easedProgress, progress});
                cancelAnimationFrame(animationFrameIdRef.current);
                setInternalIsSpinning(false);
                onSpinEnd(targetItemToWin, { error: "NaN during animation update." }); // Report target, but with error
                return;
            }
            setCurrentWheelRotation(newRotation);

            if (progress < 1) {
                animationFrameIdRef.current = requestAnimationFrame(performAnimationFrame);
            } else {
                // Ensure it lands precisely on finalWheelRotation after normalization for display consistency
                const displayFinalRotation = (finalWheelRotation % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI);
                setCurrentWheelRotation(displayFinalRotation);
                setInternalIsSpinning(false);
                animationFrameIdRef.current = null;
                onSpinEnd(targetItemToWin, null);
            }
        };
        animationFrameIdRef.current = requestAnimationFrame(performAnimationFrame);
    }, [items, internalIsSpinning, wheelStatus, currentWheelRotation, getPointerTargetAngle, onSpinStart, onSpinEnd, minSpins, spinDuration, width, height, fontFamily, dpr, pointerPosition]); // Added pointerPosition to deps

    useImperativeHandle(ref, () => ({ spinToTarget: (targetItem, minSpinsOverride, spinDurationOverride) => {
            console.log('[WheelCanvas] useImperativeHandle: spinToTarget called via ref.');
            performTargetedSpin(targetItem, minSpinsOverride, spinDurationOverride);
        }}), [performTargetedSpin]);

    useEffect(() => { return () => { if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current); }; }, []);

    const canBeClicked = wheelStatus === 'idle' && items.length > 0 && isOffscreenCanvasReady;
    // useEffect(() => { console.log('[WheelCanvas] canBeClicked status:', canBeClicked); }, [canBeClicked]); // Log for clickability

    return ( <canvas ref={visibleCanvasRef} onClick={canBeClicked ? onWheelClick : () => {console.log('[WheelCanvas] Click ignored, canBeClicked:', canBeClicked, 'Status:', wheelStatus, 'Items:', items.length, 'OffscreenReady:', isOffscreenCanvasReady );}} className={`wheel-canvas ${canvasClassName} rounded-full ${canBeClicked ? 'cursor-pointer hover:opacity-90 active:opacity-80' : 'cursor-default'} transition-opacity duration-150 ease-in-out`} role={canBeClicked ? "button" : undefined} tabIndex={canBeClicked ? 0 : -1} aria-label={canBeClicked ? "Spin the wheel" : "Wheel is busy, empty, or loading"} /> );
});

WheelCanvas.propTypes = { /* ... same as Response #80 ... */
    items: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired, name: PropTypes.string.isRequired, color: PropTypes.string, sourceGroup: PropTypes.string, tags: PropTypes.arrayOf(PropTypes.string), })).isRequired,
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
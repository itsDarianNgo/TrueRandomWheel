// src/features/wheel/WheelCanvas.jsx
// VERSION USING MODULAR POINTER DRAWER
import React, { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import PropTypes from 'prop-types';
import { renderWheelPointer } from './canvasUtils/pointerDrawer'; // ***** NEW IMPORT *****

// Default Values & Helper Functions (unchanged)
const DEFAULT_MIN_SPINS = 5;
const DEFAULT_SPIN_DURATION = 7000;
// DEFAULT_POINTER_COLOR is now effectively managed by pointerDrawer's fallback or as a prop passed to it.
// Keep it here if WheelCanvas directly uses it for other purposes or as default prop value.
const DEFAULT_POINTER_COLOR = '#E53E3E';
const DEFAULT_FONT_FAMILY = '"Inter", Arial, sans-serif';
const DEFAULT_TEXT_COLOR_LIGHT = '#FFFFFF';
const DEFAULT_TEXT_COLOR_DARK = '#1A202C';
const DEFAULT_LIGHT_SEGMENT_STROKE_COLOR = '#FFFFFF';
const DEFAULT_DARK_SEGMENT_STROKE_COLOR = '#4A5568';
const DEFAULT_STROKE_WIDTH = 2;
const REFINED_DEFAULT_SEGMENT_COLORS = ['#EC4899', '#F59E0B', '#8B5CF6', '#10B981', '#3B82F6', '#EF4444', '#F97316', '#6366F1', '#14B8A6', '#D946EF', '#A855F7', '#0EA5E9'];

const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const isColorLight = (hexColor) => { /* ... unchanged ... */ if (!hexColor || !hexColor.startsWith('#') || (hexColor.length !== 4 && hexColor.length !== 7)) return false; let hex = hexColor.replace('#', ''); if (hex.length === 3) hex = hex.split('').map(char => char + char).join(''); if (hex.length !== 6) return false; const r = parseInt(hex.substring(0, 2), 16); const g = parseInt(hex.substring(2, 4), 16); const b = parseInt(hex.substring(4, 6), 16); const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; return luma > 160; };
const MIN_READABLE_FONT_SIZE_PX = 8;

const WheelCanvas = forwardRef(({
                                    items = [],
                                    pointerPosition = 'right',
                                    onSpinStart = () => {},
                                    onSpinEnd = () => {},
                                    onWheelClick = () => {},
                                    minSpins = DEFAULT_MIN_SPINS,
                                    spinDuration = DEFAULT_SPIN_DURATION,
                                    width,
                                    height,
                                    pointerColor = DEFAULT_POINTER_COLOR, // This prop is still passed to renderWheelPointer
                                    fontFamily = DEFAULT_FONT_FAMILY,
                                    overrideTextColor,
                                    overrideSegmentStrokeColor,
                                    segmentStrokeWidth = DEFAULT_STROKE_WIDTH,
                                    defaultSegmentColors = REFINED_DEFAULT_SEGMENT_COLORS,
                                    canvasClassName = '',
                                    wheelStatus = 'idle',
                                    wheelSurfaceImageUrl = null,
                                    segmentOpacity = 0.85,
                                }, ref) => {
    const canvasRef = useRef(null);
    const offscreenCanvasRef = useRef(null);

    const [internalIsSpinning, setInternalIsSpinning] = useState(false);
    const [currentWheelRotation, setCurrentWheelRotation] = useState(0);
    const animationFrameIdRef = useRef(null);

    const [surfaceImage, setSurfaceImage] = useState(null);
    const [surfaceImageStatus, setSurfaceImageStatus] = useState('idle');

    const [processedTextItems, setProcessedTextItems] = useState([]);
    const [isStaticLayerDirty, setIsStaticLayerDirty] = useState(true);
    const [isOffscreenCanvasReady, setIsOffscreenCanvasReady] = useState(false);

    const currentWidth = Math.max(0, Math.floor(width || 0));
    const currentHeight = Math.max(0, Math.floor(height || 0));
    const currentCenterX = currentWidth / 2;
    const currentCenterY = currentHeight / 2;
    const currentWheelRadius = Math.min(currentCenterX, currentCenterY) * 0.90;

    // useEffect hooks for image loading, offscreen canvas setup, text processing
    // remain IDENTICAL to Response #14 / #16.
    // ... (useEffect for image loading - unchanged) ...
    useEffect(() => { if (wheelSurfaceImageUrl && /^(https?:\/\/|data:image\/)/i.test(wheelSurfaceImageUrl)) { setSurfaceImageStatus('loading'); setIsStaticLayerDirty(true);  const img = new Image(); img.crossOrigin = "anonymous";  img.onload = () => { setSurfaceImage(img); setSurfaceImageStatus('loaded'); setIsStaticLayerDirty(true);  }; img.onerror = () => { console.warn("WheelCanvas: Failed to load wheel surface image:", wheelSurfaceImageUrl); setSurfaceImage(null); setSurfaceImageStatus('error'); setIsStaticLayerDirty(true);  }; img.src = wheelSurfaceImageUrl; return () => {  img.onload = null; img.onerror = null; }; } else { if (surfaceImage !== null || surfaceImageStatus !== 'idle') {  setSurfaceImage(null); setSurfaceImageStatus('idle'); setIsStaticLayerDirty(true); } if (wheelSurfaceImageUrl) { console.warn("WheelCanvas: Invalid or no wheel surface image URL provided:", wheelSurfaceImageUrl); } } }, [wheelSurfaceImageUrl]);
    // ... (useEffect for offscreen canvas setup - unchanged) ...
    useEffect(() => { if (currentWidth > 0 && currentHeight > 0) { if (!offscreenCanvasRef.current) { offscreenCanvasRef.current = document.createElement('canvas'); } if (offscreenCanvasRef.current.width !== currentWidth || offscreenCanvasRef.current.height !== currentHeight) { offscreenCanvasRef.current.width = currentWidth; offscreenCanvasRef.current.height = currentHeight; setIsStaticLayerDirty(true);  } setIsOffscreenCanvasReady(true); } else { setIsOffscreenCanvasReady(false); } }, [currentWidth, currentHeight]);
    // ... (useEffect for text processing - unchanged) ...
    useEffect(() => { const canvas = canvasRef.current;  if (!canvas || currentWidth <= 0 || currentHeight <= 0 || currentWheelRadius <= 0) { if (items.length === 0 && processedTextItems.length > 0) {setProcessedTextItems([]);} else if (items.length === 0) {} else {} setIsStaticLayerDirty(true); return; } if (items.length === 0) { if (processedTextItems.length > 0) setProcessedTextItems([]); setIsStaticLayerDirty(true); return; } const ctx = canvas.getContext('2d');  const numSegments = items.length; const newProcessedItems = items.map((item, index) => { let fontSizeToUse; let maxTextLengthPx; let textLayoutProps; let displayText = item.name; const finalSegmentColor = item.color || defaultSegmentColors[index % defaultSegmentColors.length]; const finalTextColor = overrideTextColor || (isColorLight(finalSegmentColor) ? DEFAULT_TEXT_COLOR_DARK : DEFAULT_TEXT_COLOR_LIGHT); if (numSegments === 1) { const baseSize = currentWheelRadius / 6; fontSizeToUse = `600 ${Math.max(12, Math.min(40, baseSize))}px ${fontFamily}`; maxTextLengthPx = currentWheelRadius * 1.6;  textLayoutProps = { x: 0, y: 0, angle: 0, maxWidth: maxTextLengthPx, type: 'horizontal-center' }; } else { const baseSize = currentWheelRadius / (numSegments > 12 ? 14 : (numSegments > 8 ? 12 : 10)); fontSizeToUse = `600 ${Math.max(9, Math.min(numSegments > 8 ? 16 : (numSegments > 4 ? 20 : 24), baseSize))}px ${fontFamily}`; const textInnerRadiusFactor = 0.25;  const textOuterRadiusPaddingFactor = 0.05;  const textStartRadialOffset = currentWheelRadius * textInnerRadiusFactor; maxTextLengthPx = currentWheelRadius * (1 - textInnerRadiusFactor - textOuterRadiusPaddingFactor); const segmentAngle = (2 * Math.PI) / numSegments; const itemAngle = (index * segmentAngle) + (segmentAngle / 2);  textLayoutProps = { x: textStartRadialOffset, y: 0, angle: itemAngle, maxWidth: maxTextLengthPx, type: 'radial' }; } const calculatedFontSizeNumber = parseFloat(fontSizeToUse); if (isNaN(calculatedFontSizeNumber) || calculatedFontSizeNumber < MIN_READABLE_FONT_SIZE_PX) { displayText = ''; } let textWidth = 0; if (displayText) { ctx.font = fontSizeToUse; textWidth = ctx.measureText(displayText).width; if (textWidth > maxTextLengthPx) { for (let k = displayText.length - 1; k > 0; k--) { displayText = item.name.substring(0, k) + "..."; textWidth = ctx.measureText(displayText).width; if (textWidth <= maxTextLengthPx) break; } if (textWidth > maxTextLengthPx) { const avgCharWidth = ctx.measureText("M")?.width || 10;  displayText = item.name.substring(0, Math.max(0, Math.floor(maxTextLengthPx / avgCharWidth) - 2)) + "..."; if (displayText.length <= 3 && item.name.length > 0) displayText = item.name.substring(0,1) + ".."; if (ctx.measureText(displayText).width > maxTextLengthPx) displayText = "..."; textWidth = ctx.measureText(displayText).width; }}} if (textLayoutProps.type === 'radial' && displayText && textWidth < maxTextLengthPx && textWidth > 0) { const centeringOffset = (maxTextLengthPx - textWidth) / 2; textLayoutProps.x += centeringOffset; } return { id: item.id, originalName: item.name, displayText, textWidth, fontSizeToUse, finalTextColor, finalSegmentColor, textLayoutProps }; }); setProcessedTextItems(newProcessedItems); setIsStaticLayerDirty(true);  }, [items, currentWidth, currentHeight, currentWheelRadius, fontFamily, defaultSegmentColors, overrideTextColor]);

    // drawSegmentBaseToContext remains IDENTICAL to Response #14 / #16 (with the correct opacity fix)
    const drawSegmentBaseToContext = useCallback((ctx, processedItem, numSegments, cX, cY, radius, isForOffscreenWithSurface) => { const segmentAngle = (2 * Math.PI) / numSegments; const originalItemIndex = items.findIndex(it => it.id === processedItem.id); if (originalItemIndex === -1) return; const startAngle = originalItemIndex * segmentAngle; const endAngle = startAngle + segmentAngle; if (processedItem.finalSegmentColor) { ctx.fillStyle = processedItem.finalSegmentColor; if (isForOffscreenWithSurface) { ctx.globalAlpha = segmentOpacity; } else { ctx.globalAlpha = 1.0; } ctx.beginPath(); ctx.moveTo(cX, cY); ctx.arc(cX, cY, radius, startAngle, endAngle); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1.0; } if (segmentStrokeWidth > 0 && numSegments > 1) { const strokeColorToUse = overrideSegmentStrokeColor || (isColorLight(processedItem.finalSegmentColor) ? DEFAULT_DARK_SEGMENT_STROKE_COLOR : DEFAULT_LIGHT_SEGMENT_STROKE_COLOR); ctx.strokeStyle = strokeColorToUse; ctx.lineWidth = segmentStrokeWidth; ctx.beginPath(); ctx.moveTo(cX, cY); ctx.arc(cX, cY, radius, startAngle, endAngle, false);  ctx.lineTo(cX, cY); ctx.stroke(); } }, [segmentStrokeWidth, segmentOpacity, overrideSegmentStrokeColor, items]);

    // getPointerTargetAngle is now in pointerDrawer.js, so it's removed from here.
    // drawPointer useCallback is now removed from here.

    // drawStaticWheelLayer remains IDENTICAL to Response #14 / #16
    const drawStaticWheelLayer = useCallback(() => { if (!offscreenCanvasRef.current || !isOffscreenCanvasReady || (processedTextItems.length === 0 && items.length > 0) ) { return; } const offCtx = offscreenCanvasRef.current.getContext('2d'); if (!offCtx) return; const offscreenWidth = offscreenCanvasRef.current.width; const offscreenHeight = offscreenCanvasRef.current.height; const offscreenCenterX = offscreenWidth / 2; const offscreenCenterY = offscreenHeight / 2; const offscreenWheelRadius = Math.min(offscreenCenterX, offscreenCenterY) * 0.90; offCtx.clearRect(0, 0, offscreenWidth, offscreenHeight); const canDrawSurfaceImage = surfaceImageStatus === 'loaded' && surfaceImage; if (canDrawSurfaceImage) { offCtx.save(); offCtx.beginPath(); offCtx.arc(offscreenCenterX, offscreenCenterY, offscreenWheelRadius, 0, 2 * Math.PI, false); offCtx.closePath(); offCtx.clip(); const img = surfaceImage; const imgAspectRatio = img.width / img.height; const wheelDiameter = offscreenWheelRadius * 2; let scaledWidth, scaledHeight, dx, dy; if (imgAspectRatio > 1) {  scaledHeight = wheelDiameter; scaledWidth = img.width * (wheelDiameter / img.height); dx = offscreenCenterX - scaledWidth / 2; dy = offscreenCenterY - offscreenWheelRadius;  } else {  scaledWidth = wheelDiameter; scaledHeight = img.height * (wheelDiameter / img.width); dx = offscreenCenterX - offscreenWheelRadius;  dy = offscreenCenterY - scaledHeight / 2; } offCtx.drawImage(img, dx, dy, scaledWidth, scaledHeight); offCtx.restore(); } const numSegments = items.length; if (numSegments > 0) { processedTextItems.forEach((processedItem) => { drawSegmentBaseToContext(offCtx, processedItem, numSegments, offscreenCenterX, offscreenCenterY, offscreenWheelRadius, canDrawSurfaceImage); }); processedTextItems.forEach((processedItem) => { const { displayText, fontSizeToUse, finalTextColor, textLayoutProps } = processedItem; if (!displayText) return;  offCtx.font = fontSizeToUse; offCtx.fillStyle = finalTextColor; if (textLayoutProps.type === 'horizontal-center') { offCtx.textAlign = 'center'; offCtx.textBaseline = 'middle'; offCtx.fillText(displayText, offscreenCenterX + textLayoutProps.x, offscreenCenterY + textLayoutProps.y, textLayoutProps.maxWidth); } else if (textLayoutProps.type === 'radial') { offCtx.save(); offCtx.translate(offscreenCenterX, offscreenCenterY); offCtx.rotate(textLayoutProps.angle); offCtx.textAlign = 'left';  offCtx.textBaseline = 'middle'; offCtx.fillText(displayText, textLayoutProps.x, textLayoutProps.y, textLayoutProps.maxWidth); offCtx.restore(); } }); } setIsStaticLayerDirty(false);  }, [ isOffscreenCanvasReady, processedTextItems, items, surfaceImage, surfaceImageStatus, drawSegmentBaseToContext, segmentOpacity, ]);
    // ... (useEffect for static layer render trigger - unchanged) ...
    useEffect(() => { if (isStaticLayerDirty && isOffscreenCanvasReady && currentWidth > 0 && currentHeight > 0) { if ( (items.length > 0 && processedTextItems.length === items.length) || items.length === 0 ) { drawStaticWheelLayer(); } } }, [isStaticLayerDirty, isOffscreenCanvasReady, currentWidth, currentHeight, items, processedTextItems, drawStaticWheelLayer]);

    // drawWheel - MODIFIED to use renderWheelPointer
    const drawWheel = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || currentWidth <= 0 || currentHeight <= 0) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, currentWidth, currentHeight);

        if (isOffscreenCanvasReady && offscreenCanvasRef.current && !isStaticLayerDirty) {
            ctx.save();
            ctx.translate(currentCenterX, currentCenterY);
            ctx.rotate(currentWheelRotation);
            ctx.drawImage(offscreenCanvasRef.current, -currentCenterX, -currentCenterY);
            ctx.restore();
        } else if (items.length === 0 && wheelStatus === 'idle' && !internalIsSpinning) {
            // ... (empty state logic unchanged) ...
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#6B7280';  ctx.font = `500 ${Math.max(14, currentWheelRadius / 15)}px ${fontFamily}`; ctx.fillText("Wheel is empty.", currentCenterX, currentCenterY - 10); ctx.font = `400 ${Math.max(12, currentWheelRadius / 20)}px ${fontFamily}`; ctx.fillText("Add items in settings.", currentCenterX, currentCenterY + 10);
        } else if (isStaticLayerDirty || !isOffscreenCanvasReady) {
            // ... (preparing state logic unchanged) ...
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#6B7280'; ctx.font = `500 ${Math.max(14, currentWheelRadius / 12)}px ${fontFamily}`; ctx.fillText("Preparing wheel...", currentCenterX, currentCenterY);
        }

        if (wheelStatus === 'shuffle_animating') { /* ... unchanged ... */ ctx.fillStyle = 'rgba(40, 48, 64, 0.6)';  ctx.fillRect(0, 0, currentWidth, currentHeight); ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';  ctx.font = `600 ${Math.max(16, currentWheelRadius / 12)}px ${fontFamily}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Shuffling...', currentCenterX, currentCenterY); }

        // ***** CALL MODULAR POINTER DRAWER *****
        renderWheelPointer(ctx, {
            pointerPosition,
            wheelRadius: currentWheelRadius,
            centerX: currentCenterX,
            centerY: currentCenterY,
            basePointerColor: pointerColor, // Pass the prop from WheelCanvas
            segmentStrokeWidth
        });
        // ***** END CALL *****

    }, [
        currentWidth, currentHeight, currentCenterX, currentCenterY, currentWheelRadius,
        currentWheelRotation, fontFamily, internalIsSpinning, wheelStatus,
        isOffscreenCanvasReady, isStaticLayerDirty, items.length,
        pointerPosition, pointerColor, segmentStrokeWidth // Added new dependencies for renderWheelPointer
    ]);

    // ... (useEffect for drawWheel trigger - unchanged) ...
    useEffect(() => { if (currentWidth > 0 && currentHeight > 0) { drawWheel(); } }, [drawWheel, currentWidth, currentHeight, currentWheelRotation, isStaticLayerDirty, wheelStatus]);
    // ... (useEffect to normalize rotation - unchanged) ...
    useEffect(() => { if (wheelStatus === 'idle' && !internalIsSpinning) { setCurrentWheelRotation(prev => (prev % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI)); } }, [wheelStatus, internalIsSpinning]);
    // ... (performTargetedSpin - getPointerTargetAngle will need to be internal to it or passed if not globally available)
    // For now, assuming getPointerTargetAngle might need to be defined or passed to performTargetedSpin if it's no longer in WheelCanvas scope.
    // However, renderWheelPointer has its own getPointerTargetAngle. Spin logic uses it for calculation.
    // Let's re-add getPointerTargetAngle to WheelCanvas scope just for performTargetedSpin or pass position.
    // Re-adding for simplicity:
    const getPointerTargetAngleForSpin = useCallback(() => { // Renamed to avoid conflict if imported
        switch (pointerPosition) {
            case 'top': return 1.5 * Math.PI;
            case 'bottom': return 0.5 * Math.PI;
            case 'left': return Math.PI;
            case 'right': default: return 0;
        }
    }, [pointerPosition]);

    const performTargetedSpin = useCallback((targetItemToWin, minSpinsOverride, spinDurationOverride) => { if (internalIsSpinning || wheelStatus !== 'spinning' || items.length === 0 || !targetItemToWin) { onSpinEnd(null, { error: "Spin conditions not met or no target." }); return; } setInternalIsSpinning(true); onSpinStart(targetItemToWin); const numSegments = items.length; const segmentAngle = (2 * Math.PI) / numSegments; const winningItemIndex = items.findIndex(item => item.id === targetItemToWin.id); if (winningItemIndex === -1) { setInternalIsSpinning(false); onSpinEnd(null, { error: "Target item not found on wheel." }); return; } const winningSegmentCenterRelativeAngle = (winningItemIndex * segmentAngle) + (segmentAngle / 2); const pointerAbsoluteTargetAngle = getPointerTargetAngleForSpin(); let finalWheelRotation = pointerAbsoluteTargetAngle - winningSegmentCenterRelativeAngle; finalWheelRotation = (finalWheelRotation % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI); const normalizedCurrentRotation = (currentWheelRotation % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI); let rotationDelta = (finalWheelRotation - normalizedCurrentRotation + (2 * Math.PI)) % (2 * Math.PI); const actualMinSpins = minSpinsOverride !== undefined ? minSpinsOverride : minSpins; const actualSpinDuration = spinDurationOverride !== undefined ? spinDurationOverride : spinDuration; const targetAnimationAngle = currentWheelRotation + rotationDelta + (actualMinSpins * 2 * Math.PI); const animationStartTime = performance.now(); const initialRotationForAnimation = currentWheelRotation;  const performAnimationFrame = () => { const elapsedTime = performance.now() - animationStartTime; let progress = Math.min(elapsedTime / actualSpinDuration, 1);  if (progress >= 1) {  setCurrentWheelRotation(finalWheelRotation);  setInternalIsSpinning(false); animationFrameIdRef.current = null; onSpinEnd(targetItemToWin, null); } else { const easedProgress = easeOutCubic(progress); setCurrentWheelRotation(initialRotationForAnimation + (targetAnimationAngle - initialRotationForAnimation) * easedProgress); animationFrameIdRef.current = requestAnimationFrame(performAnimationFrame); } }; animationFrameIdRef.current = requestAnimationFrame(performAnimationFrame); }, [items, internalIsSpinning, wheelStatus, currentWheelRotation, getPointerTargetAngleForSpin, onSpinStart, onSpinEnd, minSpins, spinDuration, pointerPosition]); // Added pointerPosition due to getPointerTargetAngleForSpin
    // ... (useImperativeHandle - unchanged) ...
    useImperativeHandle(ref, () => ({ spinToTarget: (targetItem, minSpinsOverride, spinDurationOverride) => { performTargetedSpin(targetItem, minSpinsOverride, spinDurationOverride); } }), [performTargetedSpin]);
    // ... (useEffect for animation cleanup - unchanged) ...
    useEffect(() => { return () => { if (animationFrameIdRef.current) { cancelAnimationFrame(animationFrameIdRef.current); } }; }, []);

    const canBeClicked = wheelStatus === 'idle' && items.length > 0 && currentWidth > 0 && currentHeight > 0 && !isStaticLayerDirty && isOffscreenCanvasReady;
    return ( <canvas ref={canvasRef} width={currentWidth} height={currentHeight} onClick={canBeClicked ? onWheelClick : undefined} className={`wheel-canvas ${canvasClassName} rounded-full block ${canBeClicked ? 'cursor-pointer' : 'cursor-default'}`} aria-label={canBeClicked ? "Spin the wheel" : (items.length === 0 ? "Wheel is empty, add items in settings" : "Wheel is busy or preparing")} role="button" tabIndex={canBeClicked ? 0 : -1} onKeyDown={canBeClicked ? (e) => { if (e.key === 'Enter' || e.key === ' ') onWheelClick(); } : undefined} /> );
});
WheelCanvas.propTypes = { /* ... unchanged ... */ items: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired, name: PropTypes.string.isRequired, color: PropTypes.string, sourceGroup: PropTypes.string, })).isRequired, pointerPosition: PropTypes.oneOf(['top', 'right', 'bottom', 'left']), onSpinStart: PropTypes.func, onSpinEnd: PropTypes.func, onWheelClick: PropTypes.func, minSpins: PropTypes.number, spinDuration: PropTypes.number, width: PropTypes.number, height: PropTypes.number, pointerColor: PropTypes.string, fontFamily: PropTypes.string, overrideTextColor: PropTypes.string, overrideSegmentStrokeColor: PropTypes.string, segmentStrokeWidth: PropTypes.number, defaultSegmentColors: PropTypes.arrayOf(PropTypes.string), canvasClassName: PropTypes.string, wheelStatus: PropTypes.string.isRequired, wheelSurfaceImageUrl: PropTypes.string, segmentOpacity: PropTypes.number, };
WheelCanvas.displayName = 'WheelCanvas';
export default WheelCanvas;
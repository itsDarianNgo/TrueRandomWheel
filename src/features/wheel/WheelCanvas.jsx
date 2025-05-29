// src/features/wheel/WheelCanvas.jsx
// ... (imports, defaults, helpers are the same as Response #69)
import React, { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import PropTypes from 'prop-types';
const DEFAULT_MIN_SPINS = 5; const DEFAULT_SPIN_DURATION = 7000; const DEFAULT_POINTER_COLOR = '#E53E3E'; const DEFAULT_FONT_FAMILY = '"Inter", Arial, sans-serif'; const DEFAULT_TEXT_COLOR_LIGHT = '#FFFFFF'; const DEFAULT_TEXT_COLOR_DARK = '#1A202C'; const DEFAULT_LIGHT_SEGMENT_STROKE_COLOR = '#FFFFFF'; const DEFAULT_DARK_SEGMENT_STROKE_COLOR = '#4A5568'; const DEFAULT_STROKE_WIDTH = 2; const REFINED_DEFAULT_SEGMENT_COLORS = ['#EC4899', '#F59E0B', '#8B5CF6', '#10B981', '#3B82F6', '#EF4444', '#F97316', '#6366F1', '#14B8A6', '#D946EF', '#A855F7', '#0EA5E9'];
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const isColorLight = (hexColor) => { if (!hexColor || !hexColor.startsWith('#') || (hexColor.length !== 4 && hexColor.length !== 7) ) return false; let hex = hexColor.replace('#', ''); if (hex.length === 3) hex = hex.split('').map(char => char + char).join(''); if (hex.length !== 6) return false; const r = parseInt(hex.substring(0, 2), 16); const g = parseInt(hex.substring(2, 4), 16); const b = parseInt(hex.substring(4, 6), 16); const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; return luma > 160; };


const WheelCanvas = forwardRef(({
                                    items = [], pointerPosition = 'right', onSpinStart = () => {}, onSpinEnd = () => {},
                                    onWheelClick = () => {}, minSpins = DEFAULT_MIN_SPINS, spinDuration = DEFAULT_SPIN_DURATION,
                                    width, height, // Received from WheelCanvasContainer, driven by canvasDimensions
                                    pointerColor = DEFAULT_POINTER_COLOR, fontFamily = DEFAULT_FONT_FAMILY,
                                    overrideTextColor, overrideSegmentStrokeColor, segmentStrokeWidth = DEFAULT_STROKE_WIDTH,
                                    defaultSegmentColors = REFINED_DEFAULT_SEGMENT_COLORS, canvasClassName = '',
                                    wheelStatus = 'idle', wheelSurfaceImageUrl = null, segmentOpacity = 0.85,
                                }, ref) => {
    const canvasRef = useRef(null);
    const [internalIsSpinning, setInternalIsSpinning] = useState(false);
    const [currentWheelRotation, setCurrentWheelRotation] = useState(0);
    const animationFrameIdRef = useRef(null);
    const [surfaceImage, setSurfaceImage] = useState(null);
    const [surfaceImageStatus, setSurfaceImageStatus] = useState('idle');
    const [processedTextItems, setProcessedTextItems] = useState([]);

    // DERIVE DIMENSIONS CONSISTENTLY AT TOP LEVEL from props `width` and `height`
    const currentWidth = Math.max(0, Math.floor(width || 0)); // Ensure non-negative, integer
    const currentHeight = Math.max(0, Math.floor(height || 0));
    const currentCenterX = currentWidth / 2;
    const currentCenterY = currentHeight / 2;
    const currentWheelRadius = Math.min(currentCenterX, currentCenterY) * 0.90;

    // useEffect for image loading (depends on wheelSurfaceImageUrl) - No changes from #69
    useEffect(() => { /* ... same image loading ... */ if (wheelSurfaceImageUrl && /^(https?:\/\/|data:image\/)/i.test(wheelSurfaceImageUrl)) { setSurfaceImageStatus('loading'); const img = new Image(); img.onload = () => { setSurfaceImage(img); setSurfaceImageStatus('loaded'); }; img.onerror = () => { console.warn("WheelCanvas: Failed to load wheel surface image:", wheelSurfaceImageUrl); setSurfaceImage(null); setSurfaceImageStatus('error'); }; img.src = wheelSurfaceImageUrl; return () => { img.onload = null; img.onerror = null; }; } else { setSurfaceImage(null); setSurfaceImageStatus('idle'); if (wheelSurfaceImageUrl) { console.warn("WheelCanvas: Invalid wheel surface image URL provided:", wheelSurfaceImageUrl); } } }, [wheelSurfaceImageUrl]);

    // Text Pre-calculation: Uses `currentWheelRadius`, `fontFamily`, `items`
    useEffect(() => {
        // console.log(`[WheelCanvas_TextCalcEffect] Props W: ${width}, H: ${height}. currentWheelRadius: ${currentWheelRadius}`);
        const canvas = canvasRef.current;
        if (!canvas || items.length === 0 || currentWidth <= 0 || currentHeight <= 0 || currentWheelRadius <=0 ) {
            setProcessedTextItems([]);
            return;
        }
        // ... (Rest of text pre-calculation logic from Response #69, but ENSURE it uses `currentWheelRadius` and not a re-calculated one)
        const ctx = canvas.getContext('2d'); const numSegments = items.length; const newProcessedItems = items.map((item, index) => { let fontSizeToUse; let maxTextLengthPx; let textLayoutProps; let displayText = item.name; const finalSegmentColor = item.color || defaultSegmentColors[index % defaultSegmentColors.length]; const finalTextColor = overrideTextColor || (isColorLight(finalSegmentColor) ? DEFAULT_TEXT_COLOR_DARK : DEFAULT_TEXT_COLOR_LIGHT); if (numSegments === 1) { const baseSize = currentWheelRadius / 6; fontSizeToUse = `600 ${Math.max(12, Math.min(40, baseSize))}px ${fontFamily}`; maxTextLengthPx = currentWheelRadius * 1.6; textLayoutProps = { x: 0, y: 0, angle: 0, maxWidth: maxTextLengthPx, type: 'horizontal-center' }; } else { const baseSize = currentWheelRadius / (numSegments > 12 ? 14 : (numSegments > 8 ? 12 : 10) ); fontSizeToUse = `600 ${Math.max(9, Math.min(numSegments > 8 ? 16 : (numSegments > 4 ? 20 : 24), baseSize))}px ${fontFamily}`; const textInnerRadiusFactor = 0.25; const textOuterRadiusPaddingFactor = 0.05; const textStartRadialOffset = currentWheelRadius * textInnerRadiusFactor; maxTextLengthPx = currentWheelRadius * (1 - textInnerRadiusFactor - textOuterRadiusPaddingFactor); const segmentAngle = (2 * Math.PI) / numSegments; const itemAngle = (index * segmentAngle) + (segmentAngle / 2); textLayoutProps = { x: textStartRadialOffset, y: 0, angle: itemAngle, maxWidth: maxTextLengthPx, type: 'radial' }; } ctx.font = fontSizeToUse; let textWidth = ctx.measureText(displayText).width; if (textWidth > maxTextLengthPx) { for (let k = displayText.length - 1; k > 0; k--) { displayText = item.name.substring(0, k) + "..."; textWidth = ctx.measureText(displayText).width; if (textWidth <= maxTextLengthPx) break; } if (textWidth > maxTextLengthPx) { displayText = item.name.substring(0, Math.max(0, Math.floor(maxTextLengthPx / (ctx.measureText("M")?.width || 10)))) + "..."; if (ctx.measureText(displayText).width > maxTextLengthPx && displayText.length > 3) { displayText = displayText.substring(0, displayText.length - 4) + "..."; } if (ctx.measureText(displayText).width > maxTextLengthPx) displayText = "..."; textWidth = ctx.measureText(displayText).width; } } if (textLayoutProps.type === 'radial' && textWidth < maxTextLengthPx) { const centeringOffset = (maxTextLengthPx - textWidth) / 2; textLayoutProps.x += centeringOffset; } return { id: item.id, originalName: item.name, displayText, textWidth, fontSizeToUse, finalTextColor, finalSegmentColor, textLayoutProps, }; }); setProcessedTextItems(newProcessedItems);
    }, [items, currentWidth, currentHeight, currentWheelRadius, fontFamily, defaultSegmentColors, overrideTextColor]);

    // All drawing functions (getPointerTargetAngle, drawSegmentBase, drawPointer, drawWheel, performTargetedSpin)
    // must now consistently use `currentWidth`, `currentHeight`, `currentCenterX`, `currentCenterY`, `currentWheelRadius`
    // instead of deriving them from `width`/`height` props internally.
    const getPointerTargetAngle = useCallback(() => { /* ... uses currentWheelRadius if needed, ensure consistency ... */ switch (pointerPosition) { case 'top': return 1.5 * Math.PI; case 'bottom': return 0.5 * Math.PI; case 'left': return Math.PI; case 'right': default: return 0; } }, [pointerPosition]); // Pointer angle is absolute, doesn't depend on radius

    const drawSegmentBase = useCallback((ctx, processedItem, numSegments, cX, cY, radius, hasSurfaceImage) => { /* Ensure cX,cY,radius are currentCenterX,Y,WheelRadius */ /* ... same as #69 but ensure radius is currentWheelRadius if not passed explicitly ... */ const segmentAngle = (2 * Math.PI) / numSegments; const index = items.findIndex(it => it.id === processedItem.id); if (index === -1) return; const startAngle = index * segmentAngle; const endAngle = startAngle + segmentAngle; if (processedItem.finalSegmentColor) { ctx.fillStyle = processedItem.finalSegmentColor; if (hasSurfaceImage && items.find(it => it.id === processedItem.id)?.color) { ctx.globalAlpha = segmentOpacity; } else { ctx.globalAlpha = 1.0; } ctx.beginPath(); ctx.moveTo(cX, cY); ctx.arc(cX, cY, radius, startAngle, endAngle); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1.0; } if (segmentStrokeWidth > 0 && numSegments > 1) { const strokeColor = overrideSegmentStrokeColor || (isColorLight(processedItem.finalSegmentColor) ? DEFAULT_DARK_SEGMENT_STROKE_COLOR : DEFAULT_LIGHT_SEGMENT_STROKE_COLOR); ctx.strokeStyle = strokeColor; ctx.lineWidth = segmentStrokeWidth; ctx.beginPath(); ctx.moveTo(cX, cY); ctx.arc(cX, cY, radius, startAngle, endAngle, false); ctx.closePath(); ctx.stroke(); } }, [segmentStrokeWidth, segmentOpacity, overrideSegmentStrokeColor, items]);

    const drawPointer = useCallback((ctx) => { /* Pass currentCenterX, Y, Radius */ /* ... same as #69 but use currentCenterX,Y,Radius from top scope ... */ const pointerAngle = getPointerTargetAngle(); const pointerLength = currentWheelRadius * 0.18; const pointerHalfWidthAtBase = currentWheelRadius * 0.05; ctx.fillStyle = pointerColor; ctx.beginPath(); const tipX = currentCenterX + (currentWheelRadius + segmentStrokeWidth) * Math.cos(pointerAngle); const tipY = currentCenterY + (currentWheelRadius + segmentStrokeWidth) * Math.sin(pointerAngle); const baseCenterX = currentCenterX + (currentWheelRadius + segmentStrokeWidth + pointerLength) * Math.cos(pointerAngle); const baseCenterY = currentCenterY + (currentWheelRadius + segmentStrokeWidth + pointerLength) * Math.sin(pointerAngle); const perpAngle1 = pointerAngle + Math.PI / 2; const perpAngle2 = pointerAngle - Math.PI / 2; const baseX1 = baseCenterX + pointerHalfWidthAtBase * Math.cos(perpAngle1); const baseY1 = baseCenterY + pointerHalfWidthAtBase * Math.sin(perpAngle1); const baseX2 = baseCenterX + pointerHalfWidthAtBase * Math.cos(perpAngle2); const baseY2 = baseCenterY + pointerHalfWidthAtBase * Math.sin(perpAngle2); ctx.moveTo(tipX, tipY); ctx.lineTo(baseX1, baseY1); ctx.lineTo(baseX2, baseY2); ctx.closePath(); ctx.fill(); }, [getPointerTargetAngle, pointerColor, segmentStrokeWidth, currentCenterX, currentCenterY, currentWheelRadius]); // Add derived dimensions

    const drawWheel = useCallback(() => {
        // console.log(`[WheelCanvas_DrawWheel] Using W: ${currentWidth}, H: ${currentHeight}, R: ${currentWheelRadius}`);
        const canvas = canvasRef.current; if (!canvas || currentWidth <= 0 || currentHeight <= 0) return;
        const ctx = canvas.getContext('2d');
        const numSegments = items.length;
        ctx.clearRect(0, 0, currentWidth, currentHeight);

        const canDrawSurfaceImage = surfaceImageStatus === 'loaded' && surfaceImage;
        if (canDrawSurfaceImage) { /* ... use currentCenterX, currentCenterY, currentWheelRadius ... */ ctx.save(); ctx.beginPath(); ctx.arc(currentCenterX, currentCenterY, currentWheelRadius, 0, 2 * Math.PI, false); ctx.closePath(); ctx.clip(); const img = surfaceImage; const imgAspectRatio = img.width / img.height; const wheelDiameter = currentWheelRadius * 2; let scaledWidth, scaledHeight, dx, dy; if (imgAspectRatio > 1) { scaledHeight = wheelDiameter; scaledWidth = img.width * (wheelDiameter / img.height); dx = currentCenterX - scaledWidth / 2; dy = currentCenterY - currentWheelRadius; } else { scaledWidth = wheelDiameter; scaledHeight = img.height * (wheelDiameter / img.width); dx = currentCenterX - currentWheelRadius; dy = currentCenterY - scaledHeight / 2; } ctx.drawImage(img, dx, dy, scaledWidth, scaledHeight); ctx.restore(); }

        if (numSegments > 0) {
            ctx.save();
            ctx.translate(currentCenterX, currentCenterY);
            ctx.rotate(currentWheelRotation);
            processedTextItems.forEach((processedItem) => {
                const originalItemIndex = items.findIndex(it => it.id === processedItem.id);
                if (originalItemIndex !== -1) {
                    drawSegmentBase(ctx, processedItem, numSegments, 0, 0, currentWheelRadius, canDrawSurfaceImage);
                }
            });
            processedTextItems.forEach((processedItem) => { /* ... text drawing logic uses textLayoutProps ... */ const { displayText, fontSizeToUse, finalTextColor, textLayoutProps } = processedItem; if (!displayText) return; ctx.font = fontSizeToUse; ctx.fillStyle = finalTextColor; if (textLayoutProps.type === 'horizontal-center') { ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(displayText, 0, 0, textLayoutProps.maxWidth); } else if (textLayoutProps.type === 'radial') { ctx.save(); ctx.rotate(textLayoutProps.angle); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(displayText, textLayoutProps.x, textLayoutProps.y, textLayoutProps.maxWidth); ctx.restore(); } });
            ctx.restore();
        } else if (wheelStatus === 'idle' && !internalIsSpinning) { /* ... empty state uses currentCenterX, Y, Radius ... */ ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#6B7280'; ctx.font = `500 ${Math.max(14, currentWheelRadius / 15)}px ${fontFamily}`; ctx.fillText("Wheel is empty.", currentCenterX, currentCenterY - 10); ctx.font = `400 ${Math.max(12, currentWheelRadius / 20)}px ${fontFamily}`; ctx.fillText("Add items in settings.", currentCenterX, currentCenterY + 10); }

        if (wheelStatus === 'shuffle_animating') { /* ... shuffle overlay uses currentWidth, Height, CenterX,Y,Radius ... */ ctx.fillStyle = 'rgba(40, 48, 64, 0.6)'; ctx.fillRect(0, 0, currentWidth, currentHeight); ctx.fillStyle = 'rgba(226, 232, 240, 0.9)'; ctx.font = `600 ${Math.max(16, currentWheelRadius / 12)}px ${fontFamily}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Shuffling...', currentCenterX, currentCenterY); }
        drawPointer(ctx); // Calls drawPointer which now uses top-level derived dimensions

    }, [items, currentWidth, currentHeight, currentCenterX, currentCenterY, currentWheelRadius, currentWheelRotation, fontFamily, drawSegmentBase, drawPointer, internalIsSpinning, wheelStatus, surfaceImage, surfaceImageStatus, processedTextItems, segmentOpacity /* pointerColor removed if drawPointer takes no args */]);

    useEffect(() => { if(currentWidth > 0 && currentHeight > 0) drawWheel(); }, [drawWheel, currentWidth, currentHeight]);
    useEffect(() => { /* ... normalize rotation ... */ if (wheelStatus === 'idle' && !internalIsSpinning) { setCurrentWheelRotation(prev => (prev % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI)); } }, [wheelStatus, internalIsSpinning]);
    const performTargetedSpin = useCallback((targetItemToWin, minSpinsOverride, spinDurationOverride) => { /* ... uses getPointerTargetAngle, which should be consistent. Ensure internal radius calculations also use currentWheelRadius ... */ if (internalIsSpinning || wheelStatus !== 'spinning' || items.length === 0 || !targetItemToWin) { onSpinEnd(null, { error: "Spin conditions not met or no target." }); return; } setInternalIsSpinning(true); onSpinStart(targetItemToWin); const numSegments = items.length; const segmentAngle = (2 * Math.PI) / numSegments; const winningItemIndex = items.findIndex(item => item.id === targetItemToWin.id); if (winningItemIndex === -1) { setInternalIsSpinning(false); onSpinEnd(null, { error: "Target item not found on wheel." }); return; } const winningSegmentCenterRelativeAngle = (winningItemIndex * segmentAngle) + (segmentAngle / 2); const pointerAbsoluteTargetAngle = getPointerTargetAngle(); let finalWheelRotation = pointerAbsoluteTargetAngle - winningSegmentCenterRelativeAngle; finalWheelRotation = (finalWheelRotation % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI); const normalizedCurrentRotation = (currentWheelRotation % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI); let rotationDelta = (finalWheelRotation - normalizedCurrentRotation + (2 * Math.PI)) % (2 * Math.PI); const actualMinSpins = minSpinsOverride !== undefined ? minSpinsOverride : minSpins; const actualSpinDuration = spinDurationOverride !== undefined ? spinDurationOverride : spinDuration; const targetAnimationAngle = currentWheelRotation + rotationDelta + (actualMinSpins * 2 * Math.PI); const animationStartTime = performance.now(); const initialRotationForAnimation = currentWheelRotation; const performAnimationFrame = () => { const elapsedTime = performance.now() - animationStartTime; let progress = Math.min(elapsedTime / actualSpinDuration, 1); if (progress > 1) progress = 1; const easedProgress = easeOutCubic(progress); setCurrentWheelRotation(initialRotationForAnimation + (targetAnimationAngle - initialRotationForAnimation) * easedProgress); if (progress < 1) { animationFrameIdRef.current = requestAnimationFrame(performAnimationFrame); } else { setCurrentWheelRotation(finalWheelRotation); setInternalIsSpinning(false); animationFrameIdRef.current = null; onSpinEnd(targetItemToWin, null); } }; animationFrameIdRef.current = requestAnimationFrame(performAnimationFrame); }, [items, internalIsSpinning, wheelStatus, currentWheelRotation, getPointerTargetAngle, onSpinStart, onSpinEnd, minSpins, spinDuration]);
    useImperativeHandle(ref, () => ({ spinToTarget: (targetItem, minSpinsOverride, spinDurationOverride) => { performTargetedSpin(targetItem, minSpinsOverride, spinDurationOverride); } }), [performTargetedSpin]);
    useEffect(() => { return () => { if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current); }; }, []);

    const canBeClicked = wheelStatus === 'idle' && items.length > 0 && currentWidth > 0 && currentHeight > 0;
    return ( <canvas ref={canvasRef} width={currentWidth} height={currentHeight} onClick={canBeClicked ? onWheelClick : undefined} className={`wheel-canvas ${canvasClassName} rounded-full block`} aria-label={canBeClicked ? "Spin the wheel" : "Wheel is busy or empty"} /> );
});

WheelCanvas.propTypes = { /* ... same ... */
    items: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired, name: PropTypes.string.isRequired, color: PropTypes.string, sourceGroup: PropTypes.string, })).isRequired,
    pointerPosition: PropTypes.oneOf(['top', 'right', 'bottom', 'left']),
    onSpinStart: PropTypes.func, onSpinEnd: PropTypes.func, onWheelClick: PropTypes.func,
    minSpins: PropTypes.number, spinDuration: PropTypes.number,
    width: PropTypes.number, // Still required as prop
    height: PropTypes.number, // Still required as prop
    pointerColor: PropTypes.string,
    fontFamily: PropTypes.string, overrideTextColor: PropTypes.string, overrideSegmentStrokeColor: PropTypes.string,
    segmentStrokeWidth: PropTypes.number, defaultSegmentColors: PropTypes.arrayOf(PropTypes.string), canvasClassName: PropTypes.string,
    wheelStatus: PropTypes.string.isRequired,
    wheelSurfaceImageUrl: PropTypes.string,
    segmentOpacity: PropTypes.number,
};
WheelCanvas.displayName = 'WheelCanvas';
export default WheelCanvas;
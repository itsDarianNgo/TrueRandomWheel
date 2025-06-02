// src/features/wheel/WheelCanvas.jsx
// VERSION WITH HEAVY DIAGNOSTIC LOGGING
// Core rendering logic is IDENTICAL to Response #14.
import React, { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import PropTypes from 'prop-types';

// Default Values & Helper Functions (unchanged)
const DEFAULT_MIN_SPINS = 5;
const DEFAULT_SPIN_DURATION = 7000;
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

console.log("[WheelCanvas_Module] Loaded"); // Log module load

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
                                    pointerColor = DEFAULT_POINTER_COLOR,
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

    console.log(`[WheelCanvas_Render] Props: width=${width}, height=${height}, items_len=${items.length}, status=${wheelStatus}, surfaceUrl=${wheelSurfaceImageUrl}, segOpacity=${segmentOpacity}, isStaticLayerDirty=${isStaticLayerDirty}, isOffscreenCanvasReady=${isOffscreenCanvasReady}, processedTextItems_len=${processedTextItems.length}`);

    useEffect(() => {
        console.log(`[WheelCanvas_Effect_ImageLoader] wheelSurfaceImageUrl changed: '${wheelSurfaceImageUrl}'. Current status: ${surfaceImageStatus}`);
        if (wheelSurfaceImageUrl && /^(https?:\/\/|data:image\/)/i.test(wheelSurfaceImageUrl)) {
            console.log(`[WheelCanvas_Effect_ImageLoader] Loading image: ${wheelSurfaceImageUrl}`);
            setSurfaceImageStatus('loading');
            setIsStaticLayerDirty(true);
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                console.log(`[WheelCanvas_Effect_ImageLoader] Image loaded successfully: ${wheelSurfaceImageUrl}`);
                setSurfaceImage(img);
                setSurfaceImageStatus('loaded');
                setIsStaticLayerDirty(true);
            };
            img.onerror = () => {
                console.error(`[WheelCanvas_Effect_ImageLoader] Failed to load image: ${wheelSurfaceImageUrl}`);
                setSurfaceImage(null);
                setSurfaceImageStatus('error');
                setIsStaticLayerDirty(true);
            };
            img.src = wheelSurfaceImageUrl;
            return () => {
                img.onload = null; img.onerror = null;
                console.log(`[WheelCanvas_Effect_ImageLoader] Cleanup for: ${wheelSurfaceImageUrl}`);
            };
        } else {
            if (surfaceImage !== null || surfaceImageStatus !== 'idle') {
                console.log(`[WheelCanvas_Effect_ImageLoader] Clearing surface image. Prev status: ${surfaceImageStatus}`);
                setSurfaceImage(null);
                setSurfaceImageStatus('idle');
                setIsStaticLayerDirty(true);
            }
            if (wheelSurfaceImageUrl) {
                console.warn(`[WheelCanvas_Effect_ImageLoader] Invalid or no wheel surface image URL provided: ${wheelSurfaceImageUrl}`);
            } else {
                console.log(`[WheelCanvas_Effect_ImageLoader] No wheelSurfaceImageUrl provided.`);
            }
        }
    }, [wheelSurfaceImageUrl]);

    useEffect(() => {
        console.log(`[WheelCanvas_Effect_OffscreenCanvasSetup] currentWidth=${currentWidth}, currentHeight=${currentHeight}`);
        if (currentWidth > 0 && currentHeight > 0) {
            if (!offscreenCanvasRef.current) {
                offscreenCanvasRef.current = document.createElement('canvas');
                console.log(`[WheelCanvas_Effect_OffscreenCanvasSetup] Created offscreen canvas.`);
            }
            if (offscreenCanvasRef.current.width !== currentWidth || offscreenCanvasRef.current.height !== currentHeight) {
                offscreenCanvasRef.current.width = currentWidth;
                offscreenCanvasRef.current.height = currentHeight;
                console.log(`[WheelCanvas_Effect_OffscreenCanvasSetup] Resized offscreen canvas to ${currentWidth}x${currentHeight}. Marking static layer dirty.`);
                setIsStaticLayerDirty(true);
            }
            if (!isOffscreenCanvasReady) setIsOffscreenCanvasReady(true);
        } else {
            if (isOffscreenCanvasReady) setIsOffscreenCanvasReady(false);
        }
    }, [currentWidth, currentHeight, isOffscreenCanvasReady]); // isOffscreenCanvasReady added to deps to ensure it's set correctly

    useEffect(() => {
        console.log(`[WheelCanvas_Effect_TextProcessor] Running. items.length=${items.length}, currentWidth=${currentWidth}, currentHeight=${currentHeight}, currentWheelRadius=${currentWheelRadius}`);
        const canvas = canvasRef.current;
        if (!canvas || currentWidth <= 0 || currentHeight <= 0 || currentWheelRadius <= 0) { // items.length === 0 check moved inside
            if (items.length === 0 && processedTextItems.length > 0) {
                console.log(`[WheelCanvas_Effect_TextProcessor] No items, clearing processedTextItems.`);
                setProcessedTextItems([]);
            } else if (items.length === 0) {
                console.log(`[WheelCanvas_Effect_TextProcessor] No items, processedTextItems already empty or not applicable.`);
            } else {
                console.log(`[WheelCanvas_Effect_TextProcessor] Canvas not ready or invalid dimensions, bailing. Items length: ${items.length}`);
            }
            setIsStaticLayerDirty(true); // Always mark dirty if conditions for processing aren't fully met or items empty
            return;
        }
        if (items.length === 0) { // Explicit handling for empty items after canvas check
            if (processedTextItems.length > 0) setProcessedTextItems([]);
            setIsStaticLayerDirty(true);
            console.log(`[WheelCanvas_Effect_TextProcessor] Items array is empty. Static layer marked dirty.`);
            return;
        }

        const ctx = canvas.getContext('2d');
        const numSegments = items.length;
        console.log(`[WheelCanvas_Effect_TextProcessor] Processing ${numSegments} items for text layout.`);

        const newProcessedItems = items.map((item, index) => {
            // ... (text processing logic as in Response #14 - no changes here) ...
            let fontSizeToUse; let maxTextLengthPx; let textLayoutProps; let displayText = item.name;
            const finalSegmentColor = item.color || defaultSegmentColors[index % defaultSegmentColors.length];
            const finalTextColor = overrideTextColor || (isColorLight(finalSegmentColor) ? DEFAULT_TEXT_COLOR_DARK : DEFAULT_TEXT_COLOR_LIGHT);
            // ... (rest of sizing, truncation logic) ...
            if (numSegments === 1) { const baseSize = currentWheelRadius / 6; fontSizeToUse = `600 ${Math.max(12, Math.min(40, baseSize))}px ${fontFamily}`; maxTextLengthPx = currentWheelRadius * 1.6;  textLayoutProps = { x: 0, y: 0, angle: 0, maxWidth: maxTextLengthPx, type: 'horizontal-center' };
            } else { const baseSize = currentWheelRadius / (numSegments > 12 ? 14 : (numSegments > 8 ? 12 : 10)); fontSizeToUse = `600 ${Math.max(9, Math.min(numSegments > 8 ? 16 : (numSegments > 4 ? 20 : 24), baseSize))}px ${fontFamily}`; const textInnerRadiusFactor = 0.25;  const textOuterRadiusPaddingFactor = 0.05;  const textStartRadialOffset = currentWheelRadius * textInnerRadiusFactor; maxTextLengthPx = currentWheelRadius * (1 - textInnerRadiusFactor - textOuterRadiusPaddingFactor); const segmentAngle = (2 * Math.PI) / numSegments; const itemAngle = (index * segmentAngle) + (segmentAngle / 2);  textLayoutProps = { x: textStartRadialOffset, y: 0, angle: itemAngle, maxWidth: maxTextLengthPx, type: 'radial' }; }
            const calculatedFontSizeNumber = parseFloat(fontSizeToUse); if (isNaN(calculatedFontSizeNumber) || calculatedFontSizeNumber < MIN_READABLE_FONT_SIZE_PX) { displayText = ''; }
            let textWidth = 0; if (displayText) { ctx.font = fontSizeToUse; textWidth = ctx.measureText(displayText).width; if (textWidth > maxTextLengthPx) { for (let k = displayText.length - 1; k > 0; k--) { displayText = item.name.substring(0, k) + "..."; textWidth = ctx.measureText(displayText).width; if (textWidth <= maxTextLengthPx) break; } if (textWidth > maxTextLengthPx) { const avgCharWidth = ctx.measureText("M")?.width || 10;  displayText = item.name.substring(0, Math.max(0, Math.floor(maxTextLengthPx / avgCharWidth) - 2)) + "..."; if (displayText.length <= 3 && item.name.length > 0) displayText = item.name.substring(0,1) + ".."; if (ctx.measureText(displayText).width > maxTextLengthPx) displayText = "..."; textWidth = ctx.measureText(displayText).width; }}}
            if (textLayoutProps.type === 'radial' && displayText && textWidth < maxTextLengthPx && textWidth > 0) { const centeringOffset = (maxTextLengthPx - textWidth) / 2; textLayoutProps.x += centeringOffset; }

            const itemType = item.id.startsWith('bitem-') ? 'BULK' : (item.id.startsWith('item-') ? 'INDIV' : 'UNKNOWN');
            if (index < 5 || item.name === "Individual Alpha" || item.name === "Bulk Beta") { // Log first few and specific test items
                console.log(`[WheelCanvas_Effect_TextProcessor] Item (${itemType} ${index}): '${item.name}', ID: ${item.id}, color: ${item.color}, finalSegColor: ${finalSegmentColor}, displayText: '${displayText}', fontSize: ${fontSizeToUse}`);
            }
            return { id: item.id, originalName: item.name, displayText, textWidth, fontSizeToUse, finalTextColor, finalSegmentColor, textLayoutProps };
        });
        setProcessedTextItems(newProcessedItems);
        setIsStaticLayerDirty(true);
        console.log(`[WheelCanvas_Effect_TextProcessor] Finished processing text. Static layer marked dirty.`);
    }, [items, currentWidth, currentHeight, currentWheelRadius, fontFamily, defaultSegmentColors, overrideTextColor]); // processedTextItems removed from deps

    const getPointerTargetAngle = useCallback(() => { /* ... unchanged ... */ switch (pointerPosition) { case 'top': return 1.5 * Math.PI; case 'bottom': return 0.5 * Math.PI; case 'left': return Math.PI; case 'right': default: return 0; } }, [pointerPosition]);

    const drawSegmentBaseToContext = useCallback((ctx, processedItem, numSegments, cX, cY, radius, isForOffscreenWithSurface) => {
        const itemType = processedItem.id.startsWith('bitem-') ? 'BULK' : (processedItem.id.startsWith('item-CLONE-') ? 'CLONE' : (processedItem.id.startsWith('item-') ? 'INDIV' : 'UNKNOWN'));
        const logPrefix = `[WC_drawSegBase][${itemType}][${processedItem.originalName}]`;

        console.log(`${logPrefix} START. isOffscrSurf: ${isForOffscreenWithSurface}, segOpacProp: ${segmentOpacity}, finalSegColor: ${processedItem.finalSegmentColor}`);

        const segmentAngle = (2 * Math.PI) / numSegments;
        const originalItemIndex = items.findIndex(it => it.id === processedItem.id);
        if (originalItemIndex === -1) {
            console.error(`${logPrefix} ERROR: Original item not found for ID ${processedItem.id}`);
            return;
        }
        const storeItem = items[originalItemIndex];
        console.log(`${logPrefix} StoreItem: ID=${storeItem.id}, color=${storeItem.color}, tags=${JSON.stringify(storeItem.tags)}`);


        const startAngle = originalItemIndex * segmentAngle;
        const endAngle = startAngle + segmentAngle;

        if (processedItem.finalSegmentColor) {
            ctx.fillStyle = processedItem.finalSegmentColor;
            let calculatedAlpha;
            if (isForOffscreenWithSurface) {
                calculatedAlpha = segmentOpacity;
            } else {
                calculatedAlpha = 1.0;
            }
            ctx.globalAlpha = calculatedAlpha;
            console.log(`${logPrefix} FILLING: fillStyle=${ctx.fillStyle}, globalAlpha=${ctx.globalAlpha} (Derived from isOffscrSurf=${isForOffscreenWithSurface}, segOpacProp=${segmentOpacity})`);

            ctx.beginPath();
            ctx.moveTo(cX, cY);
            ctx.arc(cX, cY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1.0;
        } else {
            console.log(`${logPrefix} No finalSegmentColor. Skipping fill.`);
        }

        if (segmentStrokeWidth > 0 && numSegments > 1) {
            // ... (stroke logic unchanged, can add logs if needed) ...
            const strokeColorToUse = overrideSegmentStrokeColor || (isColorLight(processedItem.finalSegmentColor) ? DEFAULT_DARK_SEGMENT_STROKE_COLOR : DEFAULT_LIGHT_SEGMENT_STROKE_COLOR);
            ctx.strokeStyle = strokeColorToUse;
            ctx.lineWidth = segmentStrokeWidth;
            console.log(`${logPrefix} STROKING: strokeStyle=${ctx.strokeStyle}, lineWidth=${ctx.lineWidth}`);
            ctx.beginPath(); ctx.moveTo(cX, cY); ctx.arc(cX, cY, radius, startAngle, endAngle, false);  ctx.lineTo(cX, cY); ctx.stroke();
        }
        console.log(`${logPrefix} END.`);
    }, [segmentStrokeWidth, segmentOpacity, overrideSegmentStrokeColor, items]); // items dependency is key

    const drawPointer = useCallback((ctxToDrawOn) => { /* ... unchanged, can add logs if suspect ... */
        // console.log("[WC_drawPointer] Drawing pointer.");
        const pointerAngle = getPointerTargetAngle(); const pointerLength = currentWheelRadius * 0.18; const pointerHalfWidthAtBase = currentWheelRadius * 0.05; ctxToDrawOn.fillStyle = pointerColor; ctxToDrawOn.beginPath(); const tipX = currentCenterX + (currentWheelRadius + segmentStrokeWidth / 2) * Math.cos(pointerAngle); const tipY = currentCenterY + (currentWheelRadius + segmentStrokeWidth / 2) * Math.sin(pointerAngle); const baseCenterX = currentCenterX + (currentWheelRadius + segmentStrokeWidth / 2 + pointerLength) * Math.cos(pointerAngle); const baseCenterY = currentCenterY + (currentWheelRadius + segmentStrokeWidth / 2 + pointerLength) * Math.sin(pointerAngle); const perpAngle1 = pointerAngle + Math.PI / 2; const perpAngle2 = pointerAngle - Math.PI / 2; const baseX1 = baseCenterX + pointerHalfWidthAtBase * Math.cos(perpAngle1); const baseY1 = baseCenterY + pointerHalfWidthAtBase * Math.sin(perpAngle1); const baseX2 = baseCenterX + pointerHalfWidthAtBase * Math.cos(perpAngle2); const baseY2 = baseCenterY + pointerHalfWidthAtBase * Math.sin(perpAngle2); ctxToDrawOn.moveTo(tipX, tipY); ctxToDrawOn.lineTo(baseX1, baseY1); ctxToDrawOn.lineTo(baseX2, baseY2); ctxToDrawOn.closePath(); ctxToDrawOn.fill();
    }, [getPointerTargetAngle, pointerColor, segmentStrokeWidth, currentCenterX, currentCenterY, currentWheelRadius]);

    const drawStaticWheelLayer = useCallback(() => {
        console.log(`[WC_drawStaticWheelLayer] Attempting to draw. isOffscreenCanvasReady=${isOffscreenCanvasReady}, processedTextItems.length=${processedTextItems.length}, items.length=${items.length}`);
        if (!offscreenCanvasRef.current || !isOffscreenCanvasReady || (processedTextItems.length === 0 && items.length > 0) ) {
            console.warn(`[WC_drawStaticWheelLayer] Bailing: Offscreen canvas not ready, or items exist but not processed. isOffscreenCanvasReady=${isOffscreenCanvasReady}, itemsLen=${items.length}, processedLen=${processedTextItems.length}`);
            return;
        }
        const offCtx = offscreenCanvasRef.current.getContext('2d');
        if (!offCtx) {
            console.error(`[WC_drawStaticWheelLayer] Failed to get offscreen context.`);
            return;
        }

        const offscreenWidth = offscreenCanvasRef.current.width;
        const offscreenHeight = offscreenCanvasRef.current.height;
        const offscreenCenterX = offscreenWidth / 2;
        const offscreenCenterY = offscreenHeight / 2;
        const offscreenWheelRadius = Math.min(offscreenCenterX, offscreenCenterY) * 0.90;

        console.log(`[WC_drawStaticWheelLayer] Clearing offscreen canvas ${offscreenWidth}x${offscreenHeight}`);
        offCtx.clearRect(0, 0, offscreenWidth, offscreenHeight);

        const canDrawSurfaceImage = surfaceImageStatus === 'loaded' && surfaceImage;
        console.log(`[WC_drawStaticWheelLayer] canDrawSurfaceImage=${canDrawSurfaceImage} (status: ${surfaceImageStatus}, image: ${!!surfaceImage})`);

        if (canDrawSurfaceImage) {
            // ... (surface image drawing logic unchanged, add logs if needed) ...
            console.log(`[WC_drawStaticWheelLayer] Drawing surface image to offscreen.`);
            offCtx.save(); offCtx.beginPath(); offCtx.arc(offscreenCenterX, offscreenCenterY, offscreenWheelRadius, 0, 2 * Math.PI, false); offCtx.closePath(); offCtx.clip(); const img = surfaceImage; const imgAspectRatio = img.width / img.height; const wheelDiameter = offscreenWheelRadius * 2; let scaledWidth, scaledHeight, dx, dy; if (imgAspectRatio > 1) { scaledHeight = wheelDiameter; scaledWidth = img.width * (wheelDiameter / img.height); dx = offscreenCenterX - scaledWidth / 2; dy = offscreenCenterY - offscreenWheelRadius; } else { scaledWidth = wheelDiameter; scaledHeight = img.height * (wheelDiameter / img.width); dx = offscreenCenterX - offscreenWheelRadius; dy = offscreenCenterY - scaledHeight / 2; } offCtx.drawImage(img, dx, dy, scaledWidth, scaledHeight); offCtx.restore();
        }

        const numSegments = items.length;
        if (numSegments > 0) {
            console.log(`[WC_drawStaticWheelLayer] Drawing ${numSegments} segment bases to offscreen.`);
            processedTextItems.forEach((processedItem) => {
                drawSegmentBaseToContext(offCtx, processedItem, numSegments, offscreenCenterX, offscreenCenterY, offscreenWheelRadius, canDrawSurfaceImage);
            });
            console.log(`[WC_drawStaticWheelLayer] Drawing ${processedTextItems.filter(p => p.displayText).length} text items to offscreen.`);
            processedTextItems.forEach((processedItem) => {
                // ... (text drawing logic unchanged, add logs if needed) ...
                const { displayText, fontSizeToUse, finalTextColor, textLayoutProps } = processedItem; if (!displayText) return; offCtx.font = fontSizeToUse; offCtx.fillStyle = finalTextColor; if (textLayoutProps.type === 'horizontal-center') { offCtx.textAlign = 'center'; offCtx.textBaseline = 'middle'; offCtx.fillText(displayText, offscreenCenterX + textLayoutProps.x, offscreenCenterY + textLayoutProps.y, textLayoutProps.maxWidth); } else if (textLayoutProps.type === 'radial') { offCtx.save(); offCtx.translate(offscreenCenterX, offscreenCenterY); offCtx.rotate(textLayoutProps.angle); offCtx.textAlign = 'left';  offCtx.textBaseline = 'middle'; offCtx.fillText(displayText, textLayoutProps.x, textLayoutProps.y, textLayoutProps.maxWidth); offCtx.restore(); }
            });
        } else {
            console.log(`[WC_drawStaticWheelLayer] No segments to draw.`);
        }
        setIsStaticLayerDirty(false);
        console.log(`[WC_drawStaticWheelLayer] Finished drawing. Static layer marked clean.`);
    }, [
        isOffscreenCanvasReady, processedTextItems, items, surfaceImage, surfaceImageStatus,
        drawSegmentBaseToContext, segmentOpacity, // segmentOpacity included as drawSegmentBaseToContext uses it
    ]);

    useEffect(() => {
        console.log(`[WheelCanvas_Effect_StaticLayerRenderTrigger] isStaticLayerDirty=${isStaticLayerDirty}, isOffscreenCanvasReady=${isOffscreenCanvasReady}, WxH=${currentWidth}x${currentHeight}, itemsLen=${items.length}, processedItemsLen=${processedTextItems.length}`);
        if (isStaticLayerDirty && isOffscreenCanvasReady && currentWidth > 0 && currentHeight > 0) {
            if ( (items.length > 0 && processedTextItems.length === items.length) || items.length === 0 ) {
                console.log(`[WheelCanvas_Effect_StaticLayerRenderTrigger] Conditions met, calling drawStaticWheelLayer.`);
                drawStaticWheelLayer();
            } else {
                console.log(`[WheelCanvas_Effect_StaticLayerRenderTrigger] Conditions met BUT items not fully processed (items: ${items.length}, processed: ${processedTextItems.length}). Holding off drawStaticWheelLayer.`);
            }
        } else {
            console.log(`[WheelCanvas_Effect_StaticLayerRenderTrigger] Conditions NOT met for drawStaticWheelLayer.`);
        }
    }, [isStaticLayerDirty, isOffscreenCanvasReady, currentWidth, currentHeight, items, processedTextItems, drawStaticWheelLayer]);

    const drawWheel = useCallback(() => {
        // console.log(`[WC_drawWheel_MainLoop] Firing. isOffscreenCanvasReady=${isOffscreenCanvasReady}, isStaticLayerDirty=${isStaticLayerDirty}`);
        const canvas = canvasRef.current;
        if (!canvas || currentWidth <= 0 || currentHeight <= 0) {
            // console.log(`[WC_drawWheel_MainLoop] Bailing: Canvas not ready or zero dimensions.`);
            return;
        }
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, currentWidth, currentHeight);

        if (isOffscreenCanvasReady && offscreenCanvasRef.current && !isStaticLayerDirty) {
            // console.log(`[WC_drawWheel_MainLoop] Drawing rotated offscreen canvas.`);
            ctx.save(); ctx.translate(currentCenterX, currentCenterY); ctx.rotate(currentWheelRotation); ctx.drawImage(offscreenCanvasRef.current, -currentCenterX, -currentCenterY); ctx.restore();
        } else if (items.length === 0 && wheelStatus === 'idle' && !internalIsSpinning) {
            // ... (empty state logic unchanged) ...
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#6B7280'; ctx.font = `500 ${Math.max(14, currentWheelRadius / 15)}px ${fontFamily}`; ctx.fillText("Wheel is empty.", currentCenterX, currentCenterY - 10); ctx.font = `400 ${Math.max(12, currentWheelRadius / 20)}px ${fontFamily}`; ctx.fillText("Add items in settings.", currentCenterX, currentCenterY + 10);
        } else if (isStaticLayerDirty || !isOffscreenCanvasReady) {
            // console.log(`[WC_drawWheel_MainLoop] Static layer dirty or offscreen not ready. Drawing 'Preparing wheel...'.`);
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#6B7280'; ctx.font = `500 ${Math.max(14, currentWheelRadius / 12)}px ${fontFamily}`; ctx.fillText("Preparing wheel...", currentCenterX, currentCenterY);
        }

        if (wheelStatus === 'shuffle_animating') { /* ... unchanged ... */ ctx.fillStyle = 'rgba(40, 48, 64, 0.6)';  ctx.fillRect(0, 0, currentWidth, currentHeight); ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';  ctx.font = `600 ${Math.max(16, currentWheelRadius / 12)}px ${fontFamily}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Shuffling...', currentCenterX, currentCenterY); }
        drawPointer(ctx);
    }, [ currentWidth, currentHeight, currentCenterX, currentCenterY, currentWheelRadius, currentWheelRotation, fontFamily, drawPointer, internalIsSpinning, wheelStatus, isOffscreenCanvasReady, isStaticLayerDirty, items.length ]);

    useEffect(() => {
        // console.log(`[WheelCanvas_Effect_DrawWheelTrigger] Draw conditions: W=${currentWidth}, H=${currentHeight}. Rotation=${currentWheelRotation}, StaticDirty=${isStaticLayerDirty}, Status=${wheelStatus}`);
        if (currentWidth > 0 && currentHeight > 0) {
            drawWheel();
        }
    }, [drawWheel, currentWidth, currentHeight, currentWheelRotation, isStaticLayerDirty, wheelStatus]);

    useEffect(() => { /* ... (normalize rotation, unchanged) ... */ if (wheelStatus === 'idle' && !internalIsSpinning) { setCurrentWheelRotation(prev => (prev % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI)); } }, [wheelStatus, internalIsSpinning]);
    const performTargetedSpin = useCallback((targetItemToWin, minSpinsOverride, spinDurationOverride) => { /* ... (unchanged) ... */ if (internalIsSpinning || wheelStatus !== 'spinning' || items.length === 0 || !targetItemToWin) { onSpinEnd(null, { error: "Spin conditions not met or no target." }); return; } setInternalIsSpinning(true); onSpinStart(targetItemToWin); const numSegments = items.length; const segmentAngle = (2 * Math.PI) / numSegments; const winningItemIndex = items.findIndex(item => item.id === targetItemToWin.id); if (winningItemIndex === -1) { setInternalIsSpinning(false); onSpinEnd(null, { error: "Target item not found on wheel." }); return; } const winningSegmentCenterRelativeAngle = (winningItemIndex * segmentAngle) + (segmentAngle / 2); const pointerAbsoluteTargetAngle = getPointerTargetAngle(); let finalWheelRotation = pointerAbsoluteTargetAngle - winningSegmentCenterRelativeAngle; finalWheelRotation = (finalWheelRotation % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI); const normalizedCurrentRotation = (currentWheelRotation % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI); let rotationDelta = (finalWheelRotation - normalizedCurrentRotation + (2 * Math.PI)) % (2 * Math.PI); const actualMinSpins = minSpinsOverride !== undefined ? minSpinsOverride : minSpins; const actualSpinDuration = spinDurationOverride !== undefined ? spinDurationOverride : spinDuration; const targetAnimationAngle = currentWheelRotation + rotationDelta + (actualMinSpins * 2 * Math.PI); const animationStartTime = performance.now(); const initialRotationForAnimation = currentWheelRotation; const performAnimationFrame = () => { const elapsedTime = performance.now() - animationStartTime; let progress = Math.min(elapsedTime / actualSpinDuration, 1); if (progress >= 1) { setCurrentWheelRotation(finalWheelRotation); setInternalIsSpinning(false); animationFrameIdRef.current = null; onSpinEnd(targetItemToWin, null); } else { const easedProgress = easeOutCubic(progress); setCurrentWheelRotation(initialRotationForAnimation + (targetAnimationAngle - initialRotationForAnimation) * easedProgress); animationFrameIdRef.current = requestAnimationFrame(performAnimationFrame); } }; animationFrameIdRef.current = requestAnimationFrame(performAnimationFrame); }, [items, internalIsSpinning, wheelStatus, currentWheelRotation, getPointerTargetAngle, onSpinStart, onSpinEnd, minSpins, spinDuration]);
    useImperativeHandle(ref, () => ({ spinToTarget: (targetItem, minSpinsOverride, spinDurationOverride) => { performTargetedSpin(targetItem, minSpinsOverride, spinDurationOverride); } }), [performTargetedSpin]);
    useEffect(() => { /* ... (cleanup animation, unchanged) ... */ return () => { if (animationFrameIdRef.current) { cancelAnimationFrame(animationFrameIdRef.current); } }; }, []);

    const canBeClicked = wheelStatus === 'idle' && items.length > 0 && currentWidth > 0 && currentHeight > 0 && !isStaticLayerDirty && isOffscreenCanvasReady;
    // console.log(`[WheelCanvas_Render] canBeClicked=${canBeClicked}`);
    return ( <canvas ref={canvasRef} width={currentWidth} height={currentHeight} onClick={canBeClicked ? onWheelClick : undefined} className={`wheel-canvas ${canvasClassName} rounded-full block ${canBeClicked ? 'cursor-pointer' : 'cursor-default'}`} aria-label={canBeClicked ? "Spin the wheel" : (items.length === 0 ? "Wheel is empty, add items in settings" : "Wheel is busy or preparing")} role="button" tabIndex={canBeClicked ? 0 : -1} onKeyDown={canBeClicked ? (e) => { if (e.key === 'Enter' || e.key === ' ') onWheelClick(); } : undefined} /> );
});
WheelCanvas.propTypes = { /* ... unchanged ... */ items: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired, name: PropTypes.string.isRequired, color: PropTypes.string, sourceGroup: PropTypes.string, })).isRequired, pointerPosition: PropTypes.oneOf(['top', 'right', 'bottom', 'left']), onSpinStart: PropTypes.func, onSpinEnd: PropTypes.func, onWheelClick: PropTypes.func, minSpins: PropTypes.number, spinDuration: PropTypes.number, width: PropTypes.number, height: PropTypes.number, pointerColor: PropTypes.string, fontFamily: PropTypes.string, overrideTextColor: PropTypes.string, overrideSegmentStrokeColor: PropTypes.string, segmentStrokeWidth: PropTypes.number, defaultSegmentColors: PropTypes.arrayOf(PropTypes.string), canvasClassName: PropTypes.string, wheelStatus: PropTypes.string.isRequired, wheelSurfaceImageUrl: PropTypes.string, segmentOpacity: PropTypes.number, };
WheelCanvas.displayName = 'WheelCanvas';
export default WheelCanvas;
// src/features/wheel/WheelCanvas.jsx
import React, { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import PropTypes from 'prop-types';

// Default Values & Helper Functions (largely unchanged)
const DEFAULT_MIN_SPINS = 5;
const DEFAULT_SPIN_DURATION = 7000;
const DEFAULT_POINTER_COLOR = '#E53E3E'; // A red color
const DEFAULT_FONT_FAMILY = '"Inter", Arial, sans-serif';
const DEFAULT_TEXT_COLOR_LIGHT = '#FFFFFF'; // White
const DEFAULT_TEXT_COLOR_DARK = '#1A202C';  // Very dark gray / almost black
const DEFAULT_LIGHT_SEGMENT_STROKE_COLOR = '#FFFFFF'; // White
const DEFAULT_DARK_SEGMENT_STROKE_COLOR = '#4A5568'; // Medium-dark gray
const DEFAULT_STROKE_WIDTH = 2;
const REFINED_DEFAULT_SEGMENT_COLORS = ['#EC4899', '#F59E0B', '#8B5CF6', '#10B981', '#3B82F6', '#EF4444', '#F97316', '#6366F1', '#14B8A6', '#D946EF', '#A855F7', '#0EA5E9']; // Vibrant palette

const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

const isColorLight = (hexColor) => {
    if (!hexColor || !hexColor.startsWith('#') || (hexColor.length !== 4 && hexColor.length !== 7)) return false;
    let hex = hexColor.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(char => char + char).join('');
    if (hex.length !== 6) return false;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma > 160;
};

const MIN_READABLE_FONT_SIZE_PX = 8; // Text smaller than this won't be rendered.

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
                                    overrideTextColor, // User-defined text color for all segments
                                    overrideSegmentStrokeColor, // User-defined stroke color for all segments
                                    segmentStrokeWidth = DEFAULT_STROKE_WIDTH,
                                    defaultSegmentColors = REFINED_DEFAULT_SEGMENT_COLORS,
                                    canvasClassName = '',
                                    wheelStatus = 'idle', // 'idle', 'preparing_spin', 'spinning', 'prize_landing', 'shuffle_animating'
                                    wheelSurfaceImageUrl = null,
                                    segmentOpacity = 0.85,
                                }, ref) => {
    const canvasRef = useRef(null); // Visible canvas
    const offscreenCanvasRef = useRef(null); // Offscreen canvas for static layer

    const [internalIsSpinning, setInternalIsSpinning] = useState(false);
    const [currentWheelRotation, setCurrentWheelRotation] = useState(0);
    const animationFrameIdRef = useRef(null);

    const [surfaceImage, setSurfaceImage] = useState(null);
    const [surfaceImageStatus, setSurfaceImageStatus] = useState('idle'); // 'idle', 'loading', 'loaded', 'error'

    const [processedTextItems, setProcessedTextItems] = useState([]); // Pre-calculated text properties
    const [isStaticLayerDirty, setIsStaticLayerDirty] = useState(true); // Flag to re-render offscreen canvas
    const [isOffscreenCanvasReady, setIsOffscreenCanvasReady] = useState(false); // Flag if offscreen canvas is created

    // Memoized dimensions and calculations
    const currentWidth = Math.max(0, Math.floor(width || 0));
    const currentHeight = Math.max(0, Math.floor(height || 0));
    const currentCenterX = currentWidth / 2;
    const currentCenterY = currentHeight / 2;
    const currentWheelRadius = Math.min(currentCenterX, currentCenterY) * 0.90;

    // Effect to load the wheel surface image
    useEffect(() => {
        if (wheelSurfaceImageUrl && /^(https?:\/\/|data:image\/)/i.test(wheelSurfaceImageUrl)) {
            setSurfaceImageStatus('loading');
            setIsStaticLayerDirty(true); // Mark static layer dirty as image is changing
            const img = new Image();
            img.crossOrigin = "anonymous"; // Attempt to enable cross-origin loading if from a URL
            img.onload = () => {
                setSurfaceImage(img);
                setSurfaceImageStatus('loaded');
                setIsStaticLayerDirty(true); // Image loaded, static layer needs update
            };
            img.onerror = () => {
                console.warn("WheelCanvas: Failed to load wheel surface image:", wheelSurfaceImageUrl);
                setSurfaceImage(null);
                setSurfaceImageStatus('error');
                setIsStaticLayerDirty(true); // Image error, static layer might need to revert or update
            };
            img.src = wheelSurfaceImageUrl;
            return () => { // Cleanup
                img.onload = null; img.onerror = null;
            };
        } else {
            if (surfaceImage !== null || surfaceImageStatus !== 'idle') { // Only update if state actually changes
                setSurfaceImage(null);
                setSurfaceImageStatus('idle');
                setIsStaticLayerDirty(true);
            }
            if (wheelSurfaceImageUrl) { // Log warning for invalid URL if one was provided
                console.warn("WheelCanvas: Invalid or no wheel surface image URL provided:", wheelSurfaceImageUrl);
            }
        }
    }, [wheelSurfaceImageUrl]); // surfaceImage, surfaceImageStatus removed as they are set here

    // Effect to initialize or resize the offscreen canvas
    useEffect(() => {
        if (currentWidth > 0 && currentHeight > 0) {
            if (!offscreenCanvasRef.current) {
                offscreenCanvasRef.current = document.createElement('canvas');
            }
            if (offscreenCanvasRef.current.width !== currentWidth || offscreenCanvasRef.current.height !== currentHeight) {
                offscreenCanvasRef.current.width = currentWidth;
                offscreenCanvasRef.current.height = currentHeight;
                setIsStaticLayerDirty(true); // Dimensions changed, mark static layer dirty
            }
            setIsOffscreenCanvasReady(true);
        } else {
            setIsOffscreenCanvasReady(false);
        }
    }, [currentWidth, currentHeight]);

    // Effect to pre-calculate text properties for items (for static layer rendering)
    useEffect(() => {
        // This effect runs when items or visual properties affecting text change.
        // It prepares 'processedTextItems' which is then used to draw the static offscreen canvas.
        const canvas = canvasRef.current; // Use main canvas for temp context for measurements if needed
        if (!canvas || items.length === 0 || currentWidth <= 0 || currentHeight <= 0 || currentWheelRadius <= 0) {
            if (processedTextItems.length > 0) setProcessedTextItems([]); // Clear if previously had items
            setIsStaticLayerDirty(true); // Ensure static layer is marked dirty if items disappear
            return;
        }

        const ctx = canvas.getContext('2d'); // Temporary context for measurements
        const numSegments = items.length;

        const newProcessedItems = items.map((item, index) => {
            let fontSizeToUse;
            let maxTextLengthPx;
            let textLayoutProps;
            let displayText = item.name;

            const finalSegmentColor = item.color || defaultSegmentColors[index % defaultSegmentColors.length];
            const finalTextColor = overrideTextColor || (isColorLight(finalSegmentColor) ? DEFAULT_TEXT_COLOR_DARK : DEFAULT_TEXT_COLOR_LIGHT);

            if (numSegments === 1) {
                const baseSize = currentWheelRadius / 6;
                fontSizeToUse = `600 ${Math.max(12, Math.min(40, baseSize))}px ${fontFamily}`;
                maxTextLengthPx = currentWheelRadius * 1.6; // Ample width for single item
                textLayoutProps = { x: 0, y: 0, angle: 0, maxWidth: maxTextLengthPx, type: 'horizontal-center' };
            } else {
                const baseSize = currentWheelRadius / (numSegments > 12 ? 14 : (numSegments > 8 ? 12 : 10));
                fontSizeToUse = `600 ${Math.max(9, Math.min(numSegments > 8 ? 16 : (numSegments > 4 ? 20 : 24), baseSize))}px ${fontFamily}`;

                const textInnerRadiusFactor = 0.25; // Start text further from center
                const textOuterRadiusPaddingFactor = 0.05; // Padding from outer edge
                const textStartRadialOffset = currentWheelRadius * textInnerRadiusFactor;
                maxTextLengthPx = currentWheelRadius * (1 - textInnerRadiusFactor - textOuterRadiusPaddingFactor);

                const segmentAngle = (2 * Math.PI) / numSegments;
                const itemAngle = (index * segmentAngle) + (segmentAngle / 2); // Midpoint of segment for text angle
                textLayoutProps = { x: textStartRadialOffset, y: 0, angle: itemAngle, maxWidth: maxTextLengthPx, type: 'radial' };
            }

            const calculatedFontSizeNumber = parseFloat(fontSizeToUse);
            if (isNaN(calculatedFontSizeNumber) || calculatedFontSizeNumber < MIN_READABLE_FONT_SIZE_PX) {
                displayText = ''; // Omit text if font size is too small
            }

            let textWidth = 0;
            if (displayText) { // Only measure if there's text to display
                ctx.font = fontSizeToUse;
                textWidth = ctx.measureText(displayText).width;
                if (textWidth > maxTextLengthPx) { // Truncate if necessary
                    for (let k = displayText.length - 1; k > 0; k--) {
                        displayText = item.name.substring(0, k) + "...";
                        textWidth = ctx.measureText(displayText).width;
                        if (textWidth <= maxTextLengthPx) break;
                    }
                    // Final aggressive truncation if still too long
                    if (textWidth > maxTextLengthPx) {
                        const avgCharWidth = ctx.measureText("M")?.width || 10; // Estimate char width
                        displayText = item.name.substring(0, Math.max(0, Math.floor(maxTextLengthPx / avgCharWidth) - 2)) + "...";
                        if (displayText.length <= 3 && item.name.length > 0) displayText = item.name.substring(0,1) + "..";
                        if (ctx.measureText(displayText).width > maxTextLengthPx) displayText = "...";
                        textWidth = ctx.measureText(displayText).width;
                    }
                }
            }

            if (textLayoutProps.type === 'radial' && displayText && textWidth < maxTextLengthPx && textWidth > 0) {
                const centeringOffset = (maxTextLengthPx - textWidth) / 2;
                textLayoutProps.x += centeringOffset;
            }

            return {
                id: item.id, originalName: item.name, displayText, textWidth, fontSizeToUse,
                finalTextColor, finalSegmentColor, textLayoutProps,
            };
        });
        setProcessedTextItems(newProcessedItems);
        setIsStaticLayerDirty(true); // Text processing done, mark static layer for update

    }, [items, currentWidth, currentHeight, currentWheelRadius, fontFamily, defaultSegmentColors, overrideTextColor]); // Added defaultSegmentColors

    // --- Drawing Functions ---
    const getPointerTargetAngle = useCallback(() => {
        switch (pointerPosition) {
            case 'top': return 1.5 * Math.PI;  // Pointing Downwards if 0 is right
            case 'bottom': return 0.5 * Math.PI; // Pointing Upwards
            case 'left': return Math.PI;      // Pointing Right
            case 'right': default: return 0;       // Pointing Left
        }
    }, [pointerPosition]);

    // Draws a single segment's base (color fill and stroke)
    const drawSegmentBaseToContext = useCallback((ctx, processedItem, numSegments, cX, cY, radius, isForOffscreenWithSurface) => {
        const segmentAngle = (2 * Math.PI) / numSegments;
        // Find index based on ID in the original items array, as processedTextItems might be filtered/reordered
        const originalItemIndex = items.findIndex(it => it.id === processedItem.id);
        if (originalItemIndex === -1) return; // Should not happen if processedTextItems is derived correctly

        const startAngle = originalItemIndex * segmentAngle;
        const endAngle = startAngle + segmentAngle;

        // Fill
        if (processedItem.finalSegmentColor) {
            ctx.fillStyle = processedItem.finalSegmentColor;
            // Apply opacity only if this draw is for the offscreen canvas AND a surface image is active AND the item has a custom color
            if (isForOffscreenWithSurface && items[originalItemIndex]?.color) {
                ctx.globalAlpha = segmentOpacity;
            } else {
                ctx.globalAlpha = 1.0;
            }
            ctx.beginPath();
            ctx.moveTo(cX, cY);
            ctx.arc(cX, cY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1.0; // Reset globalAlpha
        }

        // Stroke
        if (segmentStrokeWidth > 0 && numSegments > 1) {
            const strokeColorToUse = overrideSegmentStrokeColor || (isColorLight(processedItem.finalSegmentColor) ? DEFAULT_DARK_SEGMENT_STROKE_COLOR : DEFAULT_LIGHT_SEGMENT_STROKE_COLOR);
            ctx.strokeStyle = strokeColorToUse;
            ctx.lineWidth = segmentStrokeWidth;
            ctx.beginPath();
            ctx.moveTo(cX, cY);
            ctx.arc(cX, cY, radius, startAngle, endAngle, false); // Don't close path before stroke for arcs from center
            ctx.lineTo(cX, cY); // Explicitly line back to center to complete stroke if moveTo was from center
            // No ctx.closePath() here to avoid connecting arc ends if stroke is not filled from center.
            // For segments starting from center, arc does include lines to center.
            ctx.stroke();
        }
    }, [segmentStrokeWidth, segmentOpacity, overrideSegmentStrokeColor, items]); // Removed defaultSegmentColors (part of processedItem.finalSegmentColor)

    const drawPointer = useCallback((ctxToDrawOn) => {
        const pointerAngle = getPointerTargetAngle();
        const pointerLength = currentWheelRadius * 0.18; // Length of the pointer
        const pointerHalfWidthAtBase = currentWheelRadius * 0.05; // Width at the base of the pointer triangle

        ctxToDrawOn.fillStyle = pointerColor;
        ctxToDrawOn.beginPath();

        // Tip of the pointer (touches the wheel edge)
        const tipX = currentCenterX + (currentWheelRadius + segmentStrokeWidth / 2) * Math.cos(pointerAngle);
        const tipY = currentCenterY + (currentWheelRadius + segmentStrokeWidth / 2) * Math.sin(pointerAngle);

        // Center of the pointer's base (further out from the wheel)
        const baseCenterX = currentCenterX + (currentWheelRadius + segmentStrokeWidth / 2 + pointerLength) * Math.cos(pointerAngle);
        const baseCenterY = currentCenterY + (currentWheelRadius + segmentStrokeWidth / 2 + pointerLength) * Math.sin(pointerAngle);

        // Calculate the two base vertices of the triangle
        const perpAngle1 = pointerAngle + Math.PI / 2; // Perpendicular for one side of base
        const perpAngle2 = pointerAngle - Math.PI / 2; // Perpendicular for other side of base

        const baseX1 = baseCenterX + pointerHalfWidthAtBase * Math.cos(perpAngle1);
        const baseY1 = baseCenterY + pointerHalfWidthAtBase * Math.sin(perpAngle1);
        const baseX2 = baseCenterX + pointerHalfWidthAtBase * Math.cos(perpAngle2);
        const baseY2 = baseCenterY + pointerHalfWidthAtBase * Math.sin(perpAngle2);

        ctxToDrawOn.moveTo(tipX, tipY);
        ctxToDrawOn.lineTo(baseX1, baseY1);
        ctxToDrawOn.lineTo(baseX2, baseY2);
        ctxToDrawOn.closePath();
        ctxToDrawOn.fill();
    }, [getPointerTargetAngle, pointerColor, segmentStrokeWidth, currentCenterX, currentCenterY, currentWheelRadius]);


    // Renders the static parts of the wheel (segments, text, surface image) to the offscreen canvas
    const drawStaticWheelLayer = useCallback(() => {
        if (!offscreenCanvasRef.current || !isOffscreenCanvasReady || processedTextItems.length === 0 && items.length > 0) {
            // Not ready or no items to process (but items array is not empty, implies processing pending)
            return;
        }
        const offCtx = offscreenCanvasRef.current.getContext('2d');
        if (!offCtx) return;

        const offscreenWidth = offscreenCanvasRef.current.width;
        const offscreenHeight = offscreenCanvasRef.current.height;
        const offscreenCenterX = offscreenWidth / 2;
        const offscreenCenterY = offscreenHeight / 2;
        // Use wheelRadius based on offscreen canvas dimensions, should be same as main canvas
        const offscreenWheelRadius = Math.min(offscreenCenterX, offscreenCenterY) * 0.90;

        offCtx.clearRect(0, 0, offscreenWidth, offscreenHeight);

        const canDrawSurfaceImage = surfaceImageStatus === 'loaded' && surfaceImage;
        if (canDrawSurfaceImage) {
            offCtx.save();
            offCtx.beginPath();
            offCtx.arc(offscreenCenterX, offscreenCenterY, offscreenWheelRadius, 0, 2 * Math.PI, false);
            offCtx.closePath();
            offCtx.clip();

            const img = surfaceImage;
            const imgAspectRatio = img.width / img.height;
            const wheelDiameter = offscreenWheelRadius * 2;
            let scaledWidth, scaledHeight, dx, dy;

            if (imgAspectRatio > 1) { // Image is wider than tall
                scaledHeight = wheelDiameter;
                scaledWidth = img.width * (wheelDiameter / img.height);
                dx = offscreenCenterX - scaledWidth / 2;
                dy = offscreenCenterY - offscreenWheelRadius; // Align top of image with top of circle if scaled this way
            } else { // Image is taller than wide or square
                scaledWidth = wheelDiameter;
                scaledHeight = img.height * (wheelDiameter / img.width);
                dx = offscreenCenterX - offscreenWheelRadius; // Align left of image with left of circle
                dy = offscreenCenterY - scaledHeight / 2;
            }
            offCtx.drawImage(img, dx, dy, scaledWidth, scaledHeight);
            offCtx.restore();
        }

        // Draw segments and text (segments drawn first, then all text to avoid overlap issues if text is large)
        const numSegments = items.length; // Use original items length for segment angle calculation
        if (numSegments > 0) {
            // Draw all segment bases
            processedTextItems.forEach((processedItem) => {
                drawSegmentBaseToContext(offCtx, processedItem, numSegments, offscreenCenterX, offscreenCenterY, offscreenWheelRadius, canDrawSurfaceImage);
            });

            // Draw all text on top of segments
            processedTextItems.forEach((processedItem) => {
                const { displayText, fontSizeToUse, finalTextColor, textLayoutProps } = processedItem;
                if (!displayText) return; // Skip drawing if displayText is empty (MIN_READABLE_FONT_SIZE_PX optimization)

                offCtx.font = fontSizeToUse;
                offCtx.fillStyle = finalTextColor;

                if (textLayoutProps.type === 'horizontal-center') {
                    offCtx.textAlign = 'center';
                    offCtx.textBaseline = 'middle';
                    // For horizontal center, x and y in layout props are relative to wheel center (0,0 if translated)
                    // So, draw at offscreenCenterX, offscreenCenterY
                    offCtx.fillText(displayText, offscreenCenterX + textLayoutProps.x, offscreenCenterY + textLayoutProps.y, textLayoutProps.maxWidth);
                } else if (textLayoutProps.type === 'radial') {
                    offCtx.save();
                    // Translate to center, then rotate, then draw text at its calculated radial offset X
                    offCtx.translate(offscreenCenterX, offscreenCenterY);
                    offCtx.rotate(textLayoutProps.angle);
                    offCtx.textAlign = 'left'; // Text starts at X
                    offCtx.textBaseline = 'middle';
                    offCtx.fillText(displayText, textLayoutProps.x, textLayoutProps.y, textLayoutProps.maxWidth);
                    offCtx.restore();
                }
            });
        }
        setIsStaticLayerDirty(false); // Static layer is now up-to-date
    }, [
        isOffscreenCanvasReady, processedTextItems, items, surfaceImage, surfaceImageStatus,
        drawSegmentBaseToContext, // This is stable unless its own dependencies change
        segmentOpacity, // Dependency added as it affects drawSegmentBaseToContext behavior for offscreen
    ]);

    // Effect to draw/re-draw the static layer when it's marked dirty and ready
    useEffect(() => {
        if (isStaticLayerDirty && isOffscreenCanvasReady && currentWidth > 0 && currentHeight > 0) {
            // Only draw static layer if items are processed or no items exist
            if ( (items.length > 0 && processedTextItems.length === items.length) || items.length === 0 ) {
                drawStaticWheelLayer();
            }
        }
    }, [isStaticLayerDirty, isOffscreenCanvasReady, currentWidth, currentHeight, items, processedTextItems, drawStaticWheelLayer]);


    // Main drawing function for visible canvas (animation loop)
    const drawWheel = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || currentWidth <= 0 || currentHeight <= 0) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, currentWidth, currentHeight);

        if (isOffscreenCanvasReady && offscreenCanvasRef.current && !isStaticLayerDirty) {
            // Static layer is ready and up-to-date, draw it rotated
            ctx.save();
            ctx.translate(currentCenterX, currentCenterY);
            ctx.rotate(currentWheelRotation);
            // Draw the pre-rendered offscreen canvas. Offset by - centerX, -centerY because offscreen was drawn 0-width, 0-height
            ctx.drawImage(offscreenCanvasRef.current, -currentCenterX, -currentCenterY);
            ctx.restore();
        } else if (items.length === 0 && wheelStatus === 'idle' && !internalIsSpinning) {
            // Empty state: Draw directly on main canvas if static layer isn't ready or applicable
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#6B7280'; // Tailwind gray-500
            ctx.font = `500 ${Math.max(14, currentWheelRadius / 15)}px ${fontFamily}`;
            ctx.fillText("Wheel is empty.", currentCenterX, currentCenterY - 10);
            ctx.font = `400 ${Math.max(12, currentWheelRadius / 20)}px ${fontFamily}`;
            ctx.fillText("Add items in settings.", currentCenterX, currentCenterY + 10);
        } else if (isStaticLayerDirty || !isOffscreenCanvasReady) {
            // Static layer is dirty or offscreen canvas not ready, show a loading/placeholder
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#6B7280';
            ctx.font = `500 ${Math.max(14, currentWheelRadius / 12)}px ${fontFamily}`;
            ctx.fillText("Preparing wheel...", currentCenterX, currentCenterY);
        }


        if (wheelStatus === 'shuffle_animating') {
            ctx.fillStyle = 'rgba(40, 48, 64, 0.6)'; // Dark overlay
            ctx.fillRect(0, 0, currentWidth, currentHeight);
            ctx.fillStyle = 'rgba(226, 232, 240, 0.9)'; // Light text
            ctx.font = `600 ${Math.max(16, currentWheelRadius / 12)}px ${fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Shuffling...', currentCenterX, currentCenterY);
        }

        drawPointer(ctx); // Draw pointer on top of everything

    }, [
        currentWidth, currentHeight, currentCenterX, currentCenterY, currentWheelRadius,
        currentWheelRotation, fontFamily, drawPointer, internalIsSpinning, wheelStatus,
        isOffscreenCanvasReady, isStaticLayerDirty, items.length // Added items.length
    ]);

    // Effect for animation and re-drawing visible canvas
    useEffect(() => {
        // This effect triggers re-draw whenever rotation changes or static layer status might affect display
        if (currentWidth > 0 && currentHeight > 0) {
            drawWheel();
        }
    }, [drawWheel, currentWidth, currentHeight, currentWheelRotation, isStaticLayerDirty, wheelStatus]); // Added wheelStatus


    // Effect to normalize rotation when idle
    useEffect(() => {
        if (wheelStatus === 'idle' && !internalIsSpinning) {
            // Normalize rotation to be within 0 and 2*PI
            setCurrentWheelRotation(prev => (prev % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI));
        }
    }, [wheelStatus, internalIsSpinning]);

    // --- Spin Logic ---
    const performTargetedSpin = useCallback((targetItemToWin, minSpinsOverride, spinDurationOverride) => {
        if (internalIsSpinning || wheelStatus !== 'spinning' || items.length === 0 || !targetItemToWin) {
            onSpinEnd(null, { error: "Spin conditions not met or no target." });
            return;
        }
        setInternalIsSpinning(true);
        onSpinStart(targetItemToWin);

        const numSegments = items.length;
        const segmentAngle = (2 * Math.PI) / numSegments;
        const winningItemIndex = items.findIndex(item => item.id === targetItemToWin.id);

        if (winningItemIndex === -1) {
            setInternalIsSpinning(false);
            onSpinEnd(null, { error: "Target item not found on wheel." });
            return;
        }
        // Angle of the center of the winning segment, relative to 0 rad (positive X-axis)
        const winningSegmentCenterRelativeAngle = (winningItemIndex * segmentAngle) + (segmentAngle / 2);
        // Angle the pointer is at, relative to 0 rad
        const pointerAbsoluteTargetAngle = getPointerTargetAngle();
        // Desired final rotation of the wheel so winning segment aligns with pointer
        let finalWheelRotation = pointerAbsoluteTargetAngle - winningSegmentCenterRelativeAngle;
        // Normalize to [0, 2*PI)
        finalWheelRotation = (finalWheelRotation % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI);

        const normalizedCurrentRotation = (currentWheelRotation % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI);
        // Smallest positive rotation needed to get from current to final alignment
        let rotationDelta = (finalWheelRotation - normalizedCurrentRotation + (2 * Math.PI)) % (2 * Math.PI);

        const actualMinSpins = minSpinsOverride !== undefined ? minSpinsOverride : minSpins;
        const actualSpinDuration = spinDurationOverride !== undefined ? spinDurationOverride : spinDuration;

        // Total angle to spin: current rotation + delta to align + full spins
        const targetAnimationAngle = currentWheelRotation + rotationDelta + (actualMinSpins * 2 * Math.PI);
        const animationStartTime = performance.now();
        const initialRotationForAnimation = currentWheelRotation; // Capture current rotation at start of animation

        const performAnimationFrame = () => {
            const elapsedTime = performance.now() - animationStartTime;
            let progress = Math.min(elapsedTime / actualSpinDuration, 1); // Ensure progress doesn't exceed 1

            if (progress >= 1) { // Animation finished
                setCurrentWheelRotation(finalWheelRotation); // Ensure exact final rotation
                setInternalIsSpinning(false);
                animationFrameIdRef.current = null;
                onSpinEnd(targetItemToWin, null);
            } else {
                const easedProgress = easeOutCubic(progress);
                setCurrentWheelRotation(initialRotationForAnimation + (targetAnimationAngle - initialRotationForAnimation) * easedProgress);
                animationFrameIdRef.current = requestAnimationFrame(performAnimationFrame);
            }
        };
        animationFrameIdRef.current = requestAnimationFrame(performAnimationFrame);

    }, [items, internalIsSpinning, wheelStatus, currentWheelRotation, getPointerTargetAngle, onSpinStart, onSpinEnd, minSpins, spinDuration]);

    useImperativeHandle(ref, () => ({
        spinToTarget: (targetItem, minSpinsOverride, spinDurationOverride) => {
            performTargetedSpin(targetItem, minSpinsOverride, spinDurationOverride);
        }
    }), [performTargetedSpin]);

    // Cleanup animation frame on unmount
    useEffect(() => {
        return () => {
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
        };
    }, []);

    const canBeClicked = wheelStatus === 'idle' && items.length > 0 && currentWidth > 0 && currentHeight > 0 && !isStaticLayerDirty && isOffscreenCanvasReady;

    return (
        <canvas
            ref={canvasRef}
            width={currentWidth}
            height={currentHeight}
            onClick={canBeClicked ? onWheelClick : undefined}
            className={`wheel-canvas ${canvasClassName} rounded-full block ${canBeClicked ? 'cursor-pointer' : 'cursor-default'}`}
            aria-label={canBeClicked ? "Spin the wheel" : (items.length === 0 ? "Wheel is empty, add items in settings" : "Wheel is busy or preparing")}
            role="button"
            tabIndex={canBeClicked ? 0 : -1}
            onKeyDown={canBeClicked ? (e) => { if (e.key === 'Enter' || e.key === ' ') onWheelClick(); } : undefined}
        />
    );
});

WheelCanvas.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        color: PropTypes.string, // Optional: item-specific color
        sourceGroup: PropTypes.string, // Optional: for grouping logic
        // tags: PropTypes.arrayOf(PropTypes.string) // Not directly used by WheelCanvas visuals
    })).isRequired,
    pointerPosition: PropTypes.oneOf(['top', 'right', 'bottom', 'left']),
    onSpinStart: PropTypes.func,
    onSpinEnd: PropTypes.func,
    onWheelClick: PropTypes.func,
    minSpins: PropTypes.number,
    spinDuration: PropTypes.number,
    width: PropTypes.number, // Controlled by parent
    height: PropTypes.number, // Controlled by parent
    pointerColor: PropTypes.string,
    fontFamily: PropTypes.string,
    overrideTextColor: PropTypes.string,
    overrideSegmentStrokeColor: PropTypes.string,
    segmentStrokeWidth: PropTypes.number,
    defaultSegmentColors: PropTypes.arrayOf(PropTypes.string),
    canvasClassName: PropTypes.string,
    wheelStatus: PropTypes.string.isRequired,
    wheelSurfaceImageUrl: PropTypes.string, // URL or Data URL for the wheel surface
    segmentOpacity: PropTypes.number, // Opacity for segment colors when surface image is used
};

WheelCanvas.displayName = 'WheelCanvas';
export default WheelCanvas;
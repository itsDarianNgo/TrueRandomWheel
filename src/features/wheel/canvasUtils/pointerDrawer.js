// src/features/wheel/canvasUtils/pointerDrawer.js

// Constants for the enhanced style
const ENHANCED_POINTER_GLOW_COLOR = 'rgba(255, 255, 255, 0.6)';
const ENHANCED_POINTER_GLOW_BLUR = 6;
const ENHANCED_POINTER_OUTLINE_COLOR_DARK_THEME = 'rgba(0, 0, 0, 0.5)';
const ENHANCED_POINTER_OUTLINE_COLOR_LIGHT_THEME = 'rgba(255, 255, 255, 0.7)';
const ENHANCED_POINTER_OUTLINE_WIDTH = 1;
const FALLBACK_POINTER_FILL_COLOR = '#FFC107'; // Default to Amber if basePointerColor is invalid

function isColorLight(hexColor) { /* ... unchanged from Response #24 ... */ if (!hexColor || !hexColor.startsWith('#') || (hexColor.length !== 4 && hexColor.length !== 7)) return false; let hex = hexColor.replace('#', ''); if (hex.length === 3) hex = hex.split('').map(char => char + char).join(''); if (hex.length !== 6) return false; const r = parseInt(hex.substring(0, 2), 16); const g = parseInt(hex.substring(2, 4), 16); const b = parseInt(hex.substring(4, 6), 16); const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; return luma > 160; }
function getPointerTargetAngle(pointerPosition) { /* ... unchanged ... */ switch (pointerPosition) { case 'top': return 1.5 * Math.PI; case 'bottom': return 0.5 * Math.PI; case 'left': return Math.PI; case 'right': default: return 0; } }

export function renderWheelPointer(ctx, config) {
    const {
        pointerPosition,
        wheelRadius,
        centerX,
        centerY,
        basePointerColor, // This is now the user's custom color
        segmentStrokeWidth = 0,
    } = config;

    if (!ctx) {
        console.error("renderWheelPointer: Canvas context is not provided.");
        return;
    }

    // Validate user-selected color, use fallback if invalid
    const currentFillColor = (typeof basePointerColor === 'string' && /^#([0-9A-Fa-f]{3}){1,2}$/.test(basePointerColor))
        ? basePointerColor
        : FALLBACK_POINTER_FILL_COLOR;

    const pointerAngle = getPointerTargetAngle(pointerPosition);
    const pointerLength = wheelRadius * 0.18;
    const pointerHalfWidthAtBase = wheelRadius * 0.05;

    ctx.save();

    // Define path
    ctx.beginPath();
    const tipX = centerX + (wheelRadius + segmentStrokeWidth / 2) * Math.cos(pointerAngle);
    const tipY = centerY + (wheelRadius + segmentStrokeWidth / 2) * Math.sin(pointerAngle);
    const baseCenterXVal = centerX + (wheelRadius + segmentStrokeWidth / 2 + pointerLength) * Math.cos(pointerAngle);
    const baseCenterYVal = centerY + (wheelRadius + segmentStrokeWidth / 2 + pointerLength) * Math.sin(pointerAngle);
    const perpAngle1 = pointerAngle + Math.PI / 2;
    const perpAngle2 = pointerAngle - Math.PI / 2;
    const baseX1 = baseCenterXVal + pointerHalfWidthAtBase * Math.cos(perpAngle1);
    const baseY1 = baseCenterYVal + pointerHalfWidthAtBase * Math.sin(perpAngle1);
    const baseX2 = baseCenterXVal + pointerHalfWidthAtBase * Math.cos(perpAngle2);
    const baseY2 = baseCenterYVal + pointerHalfWidthAtBase * Math.sin(perpAngle2);
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(baseX1, baseY1);
    ctx.lineTo(baseX2, baseY2);
    ctx.closePath();

    // Apply UNIFORM enhanced style using the user-selected (or fallback) fill color

    // 1. Apply Glow effect to the fill
    ctx.fillStyle = currentFillColor; // ***** USE USER'S COLOR (OR FALLBACK) *****
    ctx.shadowColor = ENHANCED_POINTER_GLOW_COLOR;
    ctx.shadowBlur = ENHANCED_POINTER_GLOW_BLUR;

    ctx.fill();

    // 2. Reset shadow properties before drawing the crisp outline
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // 3. Draw the crisp outline, color adapts to currentFillColor
    ctx.strokeStyle = isColorLight(currentFillColor)
        ? ENHANCED_POINTER_OUTLINE_COLOR_DARK_THEME
        : ENHANCED_POINTER_OUTLINE_COLOR_LIGHT_THEME;
    ctx.lineWidth = ENHANCED_POINTER_OUTLINE_WIDTH;

    ctx.stroke();

    ctx.restore();
}
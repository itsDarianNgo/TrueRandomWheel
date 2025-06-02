// src/features/wheel/canvasUtils/pointerDrawer.js

// Constants for the enhanced style (used for ALL positions now)
const ENHANCED_POINTER_FILL_COLOR = '#FFC107'; // Amber/Gold
const ENHANCED_POINTER_GLOW_COLOR = 'rgba(255, 255, 255, 0.6)'; // Semi-transparent white glow
const ENHANCED_POINTER_GLOW_BLUR = 6; // Glow blur radius
const ENHANCED_POINTER_OUTLINE_COLOR_DARK_THEME = 'rgba(0, 0, 0, 0.5)'; // Dark outline for light fills
const ENHANCED_POINTER_OUTLINE_COLOR_LIGHT_THEME = 'rgba(255, 255, 255, 0.7)'; // Light outline for dark fills
const ENHANCED_POINTER_OUTLINE_WIDTH = 1; // Crisp 1px outline

// Helper to determine if a color is light or dark (needed for outline)
function isColorLight(hexColor) {
    if (!hexColor || !hexColor.startsWith('#') || (hexColor.length !== 4 && hexColor.length !== 7)) return false;
    let hex = hexColor.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(char => char + char).join('');
    if (hex.length !== 6) return false;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma > 160;
}

/**
 * Calculates the target angle for the pointer based on its position.
 * @param {string} pointerPosition - 'top', 'right', 'bottom', or 'left'.
 * @returns {number} Angle in radians.
 */
function getPointerTargetAngle(pointerPosition) {
    switch (pointerPosition) {
        case 'top': return 1.5 * Math.PI;
        case 'bottom': return 0.5 * Math.PI;
        case 'left': return Math.PI;
        case 'right': default: return 0;
    }
}

/**
 * Draws the wheel pointer onto the given canvas context.
 * Now applies the enhanced style to ALL positions.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {object} config - Configuration object for the pointer.
 * @param {string} config.pointerPosition - 'top', 'right', 'bottom', 'left'.
 * @param {number} config.wheelRadius - Radius of the main wheel.
 * @param {number} config.centerX - X-coordinate of the wheel's center.
 * @param {number} config.centerY - Y-coordinate of the wheel's center.
 * @param {string} config.basePointerColor - Previously used for 'right' pos; now effectively unused for fill.
 * @param {number} config.segmentStrokeWidth - Stroke width of wheel segments (for offset).
 */
export function renderWheelPointer(ctx, config) {
    const {
        pointerPosition,
        wheelRadius,
        centerX,
        centerY,
        // basePointerColor, // This prop is no longer used for the fill color.
        // Kept in destructure to show it's received but not used for fill.
        segmentStrokeWidth = 0,
    } = config;

    if (!ctx) {
        console.error("renderWheelPointer: Canvas context is not provided.");
        return;
    }

    const pointerAngle = getPointerTargetAngle(pointerPosition);
    const pointerLength = wheelRadius * 0.18;
    const pointerHalfWidthAtBase = wheelRadius * 0.05;

    // Save context state
    ctx.save();

    // Define pointer path
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

    // Apply UNIFORM enhanced style (Amber fill + Glow + Crisp Outline)

    // 1. Apply Glow effect to the fill
    ctx.fillStyle = ENHANCED_POINTER_FILL_COLOR; // Always use Amber
    ctx.shadowColor = ENHANCED_POINTER_GLOW_COLOR;
    ctx.shadowBlur = ENHANCED_POINTER_GLOW_BLUR;

    ctx.fill(); // Fill with the main color, shadow will create the glow

    // 2. Reset shadow properties before drawing the crisp outline
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // 3. Draw the crisp outline
    ctx.strokeStyle = isColorLight(ENHANCED_POINTER_FILL_COLOR)
        ? ENHANCED_POINTER_OUTLINE_COLOR_DARK_THEME
        : ENHANCED_POINTER_OUTLINE_COLOR_LIGHT_THEME;
    ctx.lineWidth = ENHANCED_POINTER_OUTLINE_WIDTH;

    ctx.stroke();

    // Restore context state
    ctx.restore();
}
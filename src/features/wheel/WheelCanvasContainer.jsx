// src/features/wheel/WheelCanvasContainer.jsx
import React, { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import WheelCanvas from './WheelCanvas';
import { spinWheelThunk, finalizeSpinThunk } from './WheelSlice.js';
import { selectAllItems } from '../items/itemSlice';
import {
    selectWheelSettings, // General operational settings
    selectWheelStatus,
    selectTargetWinningItem,
    selectWheelSurfaceImageUrl,
    selectSegmentOpacity,
    selectPointerPosition, // For passing to WheelCanvas -> pointerDrawer
    selectCustomPointerColor // ***** NEW IMPORT *****
} from './WheelSlice.js';

const WheelCanvasContainer = ({ width, height, canvasClassName }) => {
    const dispatch = useDispatch();
    const wheelCanvasRef = useRef(null);

    const items = useSelector(selectAllItems);
    const wheelOpSettings = useSelector(selectWheelSettings); // Contains minSpins, spinDuration etc.
    const wheelStatus = useSelector(selectWheelStatus);
    const targetWinningItem = useSelector(selectTargetWinningItem);
    const wheelSurfaceImageUrl = useSelector(selectWheelSurfaceImageUrl);
    const segmentOpacity = useSelector(selectSegmentOpacity);
    const currentPointerPosition = useSelector(selectPointerPosition); // Get current pointer position
    const customPointerColor = useSelector(selectCustomPointerColor); // ***** GET CUSTOM POINTER COLOR *****


    useEffect(() => {
        if (wheelStatus === 'spinning' && targetWinningItem && wheelCanvasRef.current?.spinToTarget) {
            wheelCanvasRef.current.spinToTarget(
                targetWinningItem,
                wheelOpSettings.minSpins,      // From wheelOpSettings
                wheelOpSettings.spinDuration   // From wheelOpSettings
            );
        }
    }, [wheelStatus, targetWinningItem, wheelOpSettings.minSpins, wheelOpSettings.spinDuration]);

    const handleWheelClick = useCallback(() => { /* ... unchanged ... */ if (wheelStatus === 'idle' && items.length > 0) { dispatch(spinWheelThunk()); } }, [dispatch, wheelStatus, items.length]);
    const handleSpinStart = useCallback((_itemBeingSpunTo) => { /* ... unchanged ... */ }, []);
    const handleSpinEnd = useCallback((landedItem, errorInfo) => { dispatch(finalizeSpinThunk({ confirmedLandedItem: landedItem, errorInfo })); }, [dispatch]);

    return (
        <WheelCanvas
            ref={wheelCanvasRef}
            items={items}
            // Pass operational settings from wheelOpSettings
            minSpins={wheelOpSettings.minSpins}
            spinDuration={wheelOpSettings.spinDuration}

            // Pass direct visual/state props
            pointerPosition={currentPointerPosition} // Pass selected pointerPosition
            pointerColor={customPointerColor} // ***** PASS CUSTOM COLOR AS pointerColor PROP *****
            wheelSurfaceImageUrl={wheelSurfaceImageUrl}
            segmentOpacity={segmentOpacity}
            wheelStatus={wheelStatus}

            onWheelClick={handleWheelClick}
            onSpinStart={handleSpinStart}
            onSpinEnd={handleSpinEnd}

            width={width}
            height={height}
            canvasClassName={canvasClassName}
            // fontFamily can be added to wheelSettings if made configurable later
        />
    );
};

WheelCanvasContainer.propTypes = { /* ... unchanged ... */ width: PropTypes.number.isRequired, height: PropTypes.number.isRequired, canvasClassName: PropTypes.string };
WheelCanvasContainer.defaultProps = { canvasClassName: '' };
export default WheelCanvasContainer;
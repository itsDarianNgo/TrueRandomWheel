// src/features/wheel/WheelCanvasContainer.jsx
import React, { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import WheelCanvas from './WheelCanvas'; // The presentational component
import { spinWheelThunk, finalizeSpinThunk } from './wheelSlice.js'; // Assuming thunks are correctly imported
import { selectAllItems } from '../items/itemSlice';
import {
    selectWheelSettings,
    selectWheelStatus,
    selectTargetWinningItem,
    selectWheelSurfaceImageUrl,
    selectSegmentOpacity // New
} from './wheelSlice.js';

const WheelCanvasContainer = ({ width, height, canvasClassName }) => {
    const dispatch = useDispatch();
    const wheelCanvasRef = useRef(null);

    // Select necessary state from Redux
    const items = useSelector(selectAllItems);
    const wheelSettings = useSelector(selectWheelSettings);
    const wheelStatus = useSelector(selectWheelStatus);
    const targetWinningItem = useSelector(selectTargetWinningItem);
    const wheelSurfaceImageUrl = useSelector(selectWheelSurfaceImageUrl);
    const segmentOpacity = useSelector(selectSegmentOpacity); // New


    // Effect to trigger spin animation when status and target are ready
    useEffect(() => {
        if (wheelStatus === 'spinning' && targetWinningItem && wheelCanvasRef.current?.spinToTarget) {
            wheelCanvasRef.current.spinToTarget(
                targetWinningItem,
                wheelSettings.minSpins,
                wheelSettings.spinDuration
            );
        }
    }, [wheelStatus, targetWinningItem, wheelSettings.minSpins, wheelSettings.spinDuration]);

    // Callbacks to pass to WheelCanvas
    const handleWheelClick = useCallback(() => {
        if (wheelStatus === 'idle' && items.length > 0) {
            dispatch(spinWheelThunk());
        }
    }, [dispatch, wheelStatus, items.length]);

    const handleSpinStart = useCallback((_itemBeingSpunTo) => {
        // Optional: dispatch an action if specific tracking of canvas animation start is needed
        // console.log("[WheelCanvasContainer] WheelCanvas reported spin animation started for:", _itemBeingSpunTo.name);
    }, []);

    const handleSpinEnd = useCallback((landedItem, errorInfo) => {
        dispatch(finalizeSpinThunk({ confirmedLandedItem: landedItem, errorInfo }));
    }, [dispatch]);

    return (
        <WheelCanvas
            ref={wheelCanvasRef}
            items={items}
            pointerPosition={wheelSettings.pointerPosition}
            minSpins={wheelSettings.minSpins}
            spinDuration={wheelSettings.spinDuration}
            wheelSurfaceImageUrl={wheelSurfaceImageUrl}
            segmentOpacity={segmentOpacity} // Pass new prop

            onWheelClick={handleWheelClick}
            onSpinStart={handleSpinStart}
            onSpinEnd={handleSpinEnd}

            wheelStatus={wheelStatus}
            width={width}
            height={height}
            canvasClassName={canvasClassName}
            // Other visual props from parent/store as needed
            fontFamily={wheelSettings.fontFamily || undefined} // Example if fontFamily becomes a setting
            pointerColor={wheelSettings.pointerColor || undefined} // Example
        />
    );
};

WheelCanvasContainer.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    canvasClassName: PropTypes.string,
};

WheelCanvasContainer.defaultProps = {
    canvasClassName: '',
};

export default WheelCanvasContainer;
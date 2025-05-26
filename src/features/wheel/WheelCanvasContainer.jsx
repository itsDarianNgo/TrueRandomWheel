// src/features/wheel/WheelCanvasContainer.jsx
import React, { useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import WheelCanvas from './WheelCanvas'; // The presentational component
import { spinWheelThunk, finalizeSpinThunk } from './wheelSlice';
import { selectAllItems } from '../items/itemSlice';
import {
    selectWheelSettings,
    selectWheelStatus,
    selectTargetWinningItem
} from './wheelSlice';
import PropTypes from "prop-types";

const WheelCanvasContainer = ({ width, height, canvasClassName }) => { // Takes display props from parent
    const dispatch = useDispatch();
    const wheelCanvasRef = useRef(null);

    const items = useSelector(selectAllItems);
    const wheelSettings = useSelector(selectWheelSettings);
    const wheelStatus = useSelector(selectWheelStatus);
    const targetWinningItem = useSelector(selectTargetWinningItem);

    useEffect(() => {
        if (wheelStatus === 'spinning' && targetWinningItem && wheelCanvasRef.current?.spinToTarget) {
            // console.log("[WheelCanvasContainer] Triggering spinToTarget for:", targetWinningItem.name);
            wheelCanvasRef.current.spinToTarget(
                targetWinningItem,
                wheelSettings.minSpins,
                wheelSettings.spinDuration
            );
        }
    }, [wheelStatus, targetWinningItem, wheelSettings.minSpins, wheelSettings.spinDuration]); // Effect dependencies

    const handleWheelClick = useCallback(() => {
        // Only dispatch if idle and items exist; thunk will also check item count
        if (wheelStatus === 'idle' && items.length > 0) {
            dispatch(spinWheelThunk());
        }
    }, [dispatch, wheelStatus, items.length]);

    const handleSpinStart = useCallback((_itemBeingSpunTo) => {
        // This callback comes from WheelCanvas when its animation physically starts
        // console.log("[WheelCanvasContainer] WheelCanvas reported spin animation started for:", itemBeingSpunTo.name);
        // No dispatch needed here as spinWheelThunk has already set relevant statuses.
    }, []);

    const handleSpinEnd = useCallback((landedItem, errorInfo) => {
        // This callback comes from WheelCanvas when its animation physically ends
        // console.log("[WheelCanvasContainer] WheelCanvas reported spin animation ended. Landed:", landedItem, "Error:", errorInfo);
        dispatch(finalizeSpinThunk({ confirmedLandedItem: landedItem, errorInfo }));
    }, [dispatch]);

    return (
        <WheelCanvas
            ref={wheelCanvasRef}
            items={items}
            pointerPosition={wheelSettings.pointerPosition}
            minSpins={wheelSettings.minSpins}       // Pass these down from settings
            spinDuration={wheelSettings.spinDuration} // Pass these down from settings

            onWheelClick={handleWheelClick}
            onSpinStart={handleSpinStart}
            onSpinEnd={handleSpinEnd}

            wheelStatus={wheelStatus} // For WheelCanvas to show generic busy/shuffle states

            // Visual props passed from parent (WheelPage)
            width={width}
            height={height}
            canvasClassName={canvasClassName}
            // Other visual props like pointerColor, fontFamily could also come from wheelSettings if made configurable
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
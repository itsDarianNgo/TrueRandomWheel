// src/features/wheel/WheelControls.jsx
import React from 'react';
// PropTypes are no longer strictly needed if it renders null and takes no functional props.
// import PropTypes from 'prop-types';

// Removed SVG Icon Components and pointerIconsMap as they are no longer used here.

const WheelControls = ({
                           // Props are effectively no longer used if this component renders null
                           // onSpinClick,
                           // isSpinning,
                           // canSpin,
                           // currentPointerPosition,
                           // onCyclePointerPosition,
                       }) => {
    // This component will no longer render the Spin button or Pointer Cycle button.
    // All controls are either on the WheelCanvas (click to spin) or in Settings Panel.
    // For now, it renders nothing. It can be removed from WheelDisplay's render tree.
    return null;
};

/*
WheelControls.propTypes = {
  // No functional props if it renders null
};
*/

export default WheelControls;
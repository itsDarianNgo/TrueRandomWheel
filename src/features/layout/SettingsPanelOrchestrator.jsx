// src/features/layout/SettingsPanelOrchestrator.jsx
import React from 'react';
import PropTypes from 'prop-types';
import SlideOutPanel from '../../components/common/SlideOutPanel'; // Adjusted path
import SettingsPanelContent from '../wheel/SettingsPanelContent';   // Adjusted path

// Manages the presentation of the settings panel, including its content.
const SettingsPanelOrchestrator = ({
                                       isOpen,
                                       onClosePanel, // Callback to toggle panel visibility in the parent (WheelPage)
                                       panelTitle,
                                       onShuffleNTimes, // Callback passed down to SettingsPanelContent
                                   }) => {
    return (
        <SlideOutPanel
            isOpen={isOpen}
            onClose={onClosePanel} // This is called by SlideOutPanel's internal Esc key or overlay click
            position="right"
            title={panelTitle}
            widthClass="w-full sm:w-[420px] md:w-[480px]" // Standard width, could be a prop
        >
            {/* SettingsPanelContent needs the onShuffleNTimes prop from WheelPage */}
            <SettingsPanelContent onShuffleNTimes={onShuffleNTimes} />
        </SlideOutPanel>
    );
};

SettingsPanelOrchestrator.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClosePanel: PropTypes.func.isRequired,
    panelTitle: PropTypes.string,
    onShuffleNTimes: PropTypes.func.isRequired, // Crucial for shuffle functionality
};

SettingsPanelOrchestrator.defaultProps = {
    panelTitle: "Wheel Configuration",
};

export default SettingsPanelOrchestrator;
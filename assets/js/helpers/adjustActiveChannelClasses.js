import { CSS_CLASS_BUTTON_PRIMARY, LS_KEY_LAYOUT_FULL_HEIGHT_ENABLED, LS_KEY_BOOTSTRAP_COL_NUMBER, LS_KEY_ACTIVE_VIEW_MODE } from "../constants/index.js";
import { showToast } from "./index.js";
import { obtainNumberOfChannelsPerRow } from "../utils/index.js";

import {
    numberChannelsPerRowButtons,
    gridViewContainer
} from "../main.js";

/**
 * Assigns column classes to a transmission element, removing previous layout classes.
 * @param {HTMLElement} transmissionElement - The channel container element to modify.
 * @param {string[]} classesToAdd - List of CSS classes to add.
 * @returns {void}
 */
const assignColumnClasses = (transmissionElement, classesToAdd) => {
    if (!transmissionElement || !classesToAdd) return;
    const classesToRemove = ['col-12', 'col-6', 'col-4', 'col-3', 'col-2', 'col-1', 'col', 'vh-100', 'overflow-hidden'];
    transmissionElement.classList.remove(...classesToRemove);
    transmissionElement.classList.add(...classesToAdd);
};

/**
 * Adjusts the Bootstrap column classes for all active channels in the grid based on current settings.
 * Only applies to Grid View. Free View channels are managed exclusively by Gridstack.
 * @returns {void}
 */
export const adjustBootstrapColumnClasses = () => {
    try {
        if (typeof isMobile === 'undefined' || !gridViewContainer) return;

        // Skip entirely for Free View — Gridstack owns layout there
        const viewMode = localStorage.getItem(LS_KEY_ACTIVE_VIEW_MODE) || 'grid-view';
        if (viewMode === 'free-view') return;

        const activeTransmissions = gridViewContainer.querySelectorAll('div[data-canal]');
        
        // Remove legacy Bootstrap classes from older versions just in case
        const classesToRemove = ['col-12', 'col-6', 'col-4', 'col-3', 'col-2', 'col-1', 'col', 'vh-100', 'overflow-hidden'];
        activeTransmissions.forEach(transmission => transmission.classList.remove(...classesToRemove));
        
        if (activeTransmissions.length === 0) return;

        const isFullHeightMode = JSON.parse(localStorage.getItem(LS_KEY_LAYOUT_FULL_HEIGHT_ENABLED));

        if (isFullHeightMode) {
            gridViewContainer.classList.add('full-height-mode');
        } else {
            gridViewContainer.classList.remove('full-height-mode');
        }

        const channelsPerRow = obtainNumberOfChannelsPerRow();
        const storedColNumber = JSON.parse(localStorage.getItem(LS_KEY_BOOTSTRAP_COL_NUMBER));
        
        if (!storedColNumber || isNaN(Number(storedColNumber))) return;
        
        let gridCols = 1;

        if (!isMobile.any) {
            // Desktop logic
            gridCols = Math.min(activeTransmissions.length, channelsPerRow) || 1;
        } else if (screen.orientation && screen.orientation.type === 'landscape-primary') {
            // Mobile Landscape
            gridCols = Math.min(activeTransmissions.length, channelsPerRow) || 1;
        } else {
            // Mobile Portrait / Default
            // Force 1 column on portrait mobile regardless of setting, unless less active than channels per row
            if (activeTransmissions.length < channelsPerRow && channelsPerRow > 1) {
                gridCols = Math.min(activeTransmissions.length, channelsPerRow) || 1;
            } else {
                gridCols = 1;
            }
        }
        
        // Apply CSS Grid inline column constraint
        gridViewContainer.style.gridTemplateColumns = `repeat(${gridCols}, 1fr)`;

    } catch (error) {
        console.error('[teles] Error adjusting "col" classes for active channels: ', error);
        showToast({
            title: 'Ha ocurrido un error al intentar ajustar el numero de canales por fila.',
            body: `Error: ${error}`,
            type: 'danger'
        });
    }
};


/**
 * Updates the grid layout based on the user's selected column count (channels per row).
 * Updates UI buttons, local storage, and reapplies active classes.
 * @param {string|number} columnValue - The Bootstrap column value (e.g. 12, 6, 4).
 * @returns {void}
 */
export const updateGridColumnConfiguration = (columnValue) => {
    if (!columnValue || isNaN(Number(columnValue))) return;

    const activeButton = document.querySelector(`#container-botones-personalizar-transmisiones-por-fila button[value='${columnValue}']`);

    if (activeButton) {
        numberChannelsPerRowButtons.forEach(btn => {
            btn.classList.replace(CSS_CLASS_BUTTON_PRIMARY, 'btn-light-subtle');
        });
        activeButton.classList.replace('btn-light-subtle', CSS_CLASS_BUTTON_PRIMARY);
    }

    localStorage.setItem(LS_KEY_BOOTSTRAP_COL_NUMBER, columnValue);
    adjustBootstrapColumnClasses();
};
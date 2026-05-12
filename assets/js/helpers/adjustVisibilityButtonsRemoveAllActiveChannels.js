import {
    BUTTON_MODAL_REMOVE_ALL_ACTIVE_CHANNELS,
    BUTTON_OFFCANVAS_REMOVE_ALL_ACTIVE_CHANNELS,
    BUTTON_MODAL_LOAD_DEFAULT_CHANNELS,
    BUTTON_OFFCANVAS_LOAD_DEFAULT_CHANNELS
} from '../botones.js';

import { getActiveChannelIds } from './index.js';

/**
 * Adjust the visibility of the buttons to remove all active channels.
 */
export const adjustVisibilityButtonsRemoveAllActiveChannels = () => {
    const hasActiveChannels = getActiveChannelIds().length > 0;

    // Buttons remove all active channels
    [BUTTON_MODAL_REMOVE_ALL_ACTIVE_CHANNELS, BUTTON_OFFCANVAS_REMOVE_ALL_ACTIVE_CHANNELS].forEach(btn => {
        btn?.classList.toggle('d-none', !hasActiveChannels);
    });



    // Buttons load default channels
    [BUTTON_MODAL_LOAD_DEFAULT_CHANNELS, BUTTON_OFFCANVAS_LOAD_DEFAULT_CHANNELS].forEach(btn => {
        btn?.classList.toggle('d-none', hasActiveChannels);
    });
};
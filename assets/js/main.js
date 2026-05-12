/* main v0.26
  by Alplox 
  https://github.com/Alplox/teles
*/

// MARK: import
import {
    fetchLoadChannels,
    restoreChannelsFromMemory,
    loadPersonalizedM3UList,
    loadPersonalizedListFromText,
    restorePersonalizedLists,
    channelsList,
    getChannelById,
    getChannelIds,
    hasChannelId,
    getCombineChannelsPreference,
    setCombineChannelsPreference
} from './channelManager.js';


import {
    crearFragmentCanal
} from './canalUI.js';

import {
    BOOTSTRAP_COL_NUMBER_DESKTOP,
    BOOTSTRAP_COL_NUMBER_MOBILE,
    LS_KEY_WELCOME_MODAL_VISIBILITY,
    LS_KEY_NAVBAR_VISIBILITY,
    LS_KEY_ACTIVE_VIEW_MODE,
    LS_KEY_LAYOUT_FULL_HEIGHT_ENABLED,
    LS_KEY_FLOATING_BUTTONS_TEXT_VISIBILITY,
    LS_KEY_M3U8_PLAYER_CHOICE,
    LS_KEY_SHOW_CHANNELS_LOGO,
    LS_KEY_LOGO_CARD_BACKGROUND_VISIBILITY,
    LS_KEY_DYNAMIC_URL,
    LS_KEY_FLOATING_BUTTONS_POSITION,
    LS_KEY_HORIZONTAL_WIDTH_VALUE,
    LS_KEY_CHANNEL_SIGNAL_PREFERENCE,
    LS_KEY_BOOTSTRAP_COL_NUMBER,
    LS_KEY_OVERLAY_VISIBILITY,
    LS_KEY_SAVED_CHANNELS_GRID_VIEW,
    LS_KEY_CHANNELS_BACKUP,
    LS_KEY_CHANNELS_BACKUP_DATE,
    CSS_CLASS_BUTTON_PRIMARY,

    ID_PREFIX_CONTAINERS_CHANNELS,
    LS_KEY_TELES_GRIDSTACK_LAYOUT
} from './constants/index.js';

import {
    hideOverlayButtonText,
    detectThemePreferences,
    showToast,
    saveChannelsToLocalStorage,
    adjustChannelButtonClass,
    activateSingleView,
    deactivateSingleView,
    deleteInvalidSignalPreferences,
    areAllSignalsEmpty,
    createChannelButtons,

    createButtonsForSingleView,
    adjustVisibilityButtonsRemoveAllActiveChannels,
    saveOriginalOrder,
    adjustBootstrapColumnClasses,
    updateGridColumnConfiguration,
    createCountryButtons,
    createCategoryButtons,
    updateFloatingButtons,
    handleFloatingButtonsPositionClick,
    saveSingleViewPanelsOrder,
    toggleOrderedClass,
    syncActiveChannelsParameter,
    clearSharedUrlParameter,
    getChannelsFromUrl,
    registerManualChannelChange,
    cleanTransmissionResources,
    syncCheckboxState,
    applyTheme,
    clearChannelListContainers,
    resyncActiveChannelsVisualState,
    renderPersonalizedListsUI,
    getActiveChannelIds,
    toggleGridViewControls
} from './helpers/index.js';

import {
    debounce,
    obtainNumberOfChannelsPerRow,
    registerVideojsTranslation,
    initializeBootstrapTooltips,
    disposeBootstrapTooltips
} from './utils/index.js';

// MARK: 📦 Exports
export let gridViewContainer;
export let freeViewContainer;
export let gridStackInstance;

export const saveGridStackLayout = () => {
    if (!gridStackInstance) return;

    // Etkin olmayan yapılandırmaların sıralı yükleme tarafından silinmesini önlemek için önceden kaydedilmiş durumu oku
    const savedPayload = localStorage.getItem(LS_KEY_TELES_GRIDSTACK_LAYOUT);
    let layout = {};
    if (savedPayload) {
        try {
            layout = JSON.parse(savedPayload);
        } catch (e) {
            console.error('[teles] Önceki gridstack düzeni yüklenirken hata oluştu:', e);
        }
    }

    const items = freeViewContainer.querySelectorAll('.grid-stack-item');
    items.forEach(item => {
        const id = item.getAttribute('data-canal');
        if (id && item.gridstackNode) {
            layout[id] = {
                x: item.gridstackNode.x,
                y: item.gridstackNode.y,
                w: item.gridstackNode.w,
                h: item.gridstackNode.h
            };
        }
    });

    localStorage.setItem(LS_KEY_TELES_GRIDSTACK_LAYOUT, JSON.stringify(layout));
};

export let singleViewContainer;
export let singleViewGrid;
export let singleViewVideoContainer;

export let singleViewNoSignalIcon;

// Dinamik URL
export let isDynamicUrlMode = false;
try { isDynamicUrlMode = JSON.parse(localStorage.getItem(LS_KEY_DYNAMIC_URL)) ?? false; } catch { }

export let isLoadingFromSharedUrl = false;

export let dynamicUrlCheckbox;
export let dynamicUrlValueSpan;
let dynamicUrlIcon;

/**
 * Dinamik URL geçiş arayüzünü (UI) verilen durumla eşitler.
 * @param {boolean} enabled
 */
export const applyDynamicUrlState = (enabled) => {
    if (!dynamicUrlCheckbox || !dynamicUrlValueSpan || !dynamicUrlIcon) return;
    dynamicUrlCheckbox.checked = enabled;
    dynamicUrlValueSpan.textContent = enabled ? '[etkin]' : '[devre dışı]';
    dynamicUrlIcon.classList.toggle('text-success', enabled);
    dynamicUrlIcon.classList.toggle('text-secondary', !enabled);
};



/**
 * Varsayılan kanal kümesini döndürür, masaüstünde ek varsayılanları ekler.
 * @param {boolean} isMobile
 * @returns {string[]}
 */
export const getDefaultChannels = () => {
    return getChannelIds();
}

// Kişiselleştirme
// Satır başına kanal sayısı
export let numberChannelsPerRowSpan;
export let numberChannelsPerRowButtons;
// Kayan düğmeler
export let floatingButtonsPositionButtons;
// Yatay genişlik
export let widthRangeInput;
export let widthRangeValue;

// Tam yüksekliği aç/kapat
export let fullHeightCheckbox;
export let fullHeightSpan;


// MARK: 📫 DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
    registerVideojsTranslation();

    // querySelector
    singleViewNoSignalIcon = document.querySelector('#icono-sin-señal-single-view');
    singleViewContainer = document.querySelector('#container-single-view');
    singleViewVideoContainer = document.querySelector('#container-video-single-view');
    gridViewContainer = document.querySelector('#container-vision-cuadricula');
    freeViewContainer = document.querySelector('#container-vision-libre');

    // Sortable kullanarak kanalları ızgarada taşımak için eklenti
    new Sortable(gridViewContainer, {
        animation: 150,
        ghostClass: 'clase-fantasma-arrastre-sortable',
        handle: '.clase-para-mover',
        onEnd: function () {
            saveChannelsToLocalStorage();
        },
    });

    dynamicUrlCheckbox = document.querySelector('#checkbox-url-dinamica')
    dynamicUrlValueSpan = document.querySelector('#span-valor-url-dinamica');
    dynamicUrlIcon = document.querySelector('#icono-url-dinamica');

    // MARK: Kişiselleştirme


    // MARK: Görünüm Modu
    const gridViewActivateButtonEl = document.querySelector('#boton-activar-diseño-vision-grid');
    const singleViewActivateButtonEl = document.querySelector('#boton-activar-diseño-single-view');
    const freeViewActivateButtonEl = document.querySelector('#boton-activar-diseño-free-view');

    const updateViewButtonsState = (activeId) => {
        const toggleMap = {
            'grid-view': gridViewActivateButtonEl,
            'single-view': singleViewActivateButtonEl,
            'free-view': freeViewActivateButtonEl
        };
        Object.keys(toggleMap).forEach(mode => {
            if (activeId === mode && toggleMap[mode]) {
                toggleMap[mode].classList.replace('btn-light-subtle', CSS_CLASS_BUTTON_PRIMARY);
            } else if (toggleMap[mode]) {
                toggleMap[mode].classList.replace(CSS_CLASS_BUTTON_PRIMARY, 'btn-light-subtle');
            }
        });

        // Hide specific settings when not in grid-view
        const liSizeHeightSetting = document.getElementById('li-size-height-setting');
        const liChannelsPerRowSetting = document.getElementById('li-channels-per-row-setting');
        const isGridView = activeId === 'grid-view';

        if (liSizeHeightSetting) {
            liSizeHeightSetting.classList.toggle('d-none', !isGridView);
        }
        if (liChannelsPerRowSetting) {
            liChannelsPerRowSetting.classList.toggle('d-none', !isGridView);
        }
    };

    // Yükleme sırasında arayüzü başlat
    updateViewButtonsState(localStorage.getItem(LS_KEY_ACTIVE_VIEW_MODE) || 'grid-view');

    const switchGridToFreeViewAndBack = (targetMode) => {
        if (targetMode === 'single-view') return;

        // Mod değiştirmeden önce kapsamlı temizlik
        const activeIds = Object.keys(JSON.parse(localStorage.getItem(LS_KEY_SAVED_CHANNELS_GRID_VIEW)) || {});

        // 1. Gridstack kaynaklarını temizle (Serbest Görünüm)
        if (freeViewContainer) {
            const currentLibreItems = freeViewContainer.querySelectorAll('div[data-canal]');
            currentLibreItems.forEach(item => cleanTransmissionResources(item));
        }

        // 2. Grid kaynaklarını temizle (Izgara Görünümü)
        if (gridViewContainer) {
            const currentGridItems = gridViewContainer.querySelectorAll('div[data-canal]');
            currentGridItems.forEach(item => cleanTransmissionResources(item));
        }

        // 3. Konteynerleri boşalt
        gridViewContainer.innerHTML = '';
        if (gridStackInstance) gridStackInstance.removeAll(true); // bileşenleri ve DOM düğümlerini kaldır

        localStorage.setItem(LS_KEY_ACTIVE_VIEW_MODE, targetMode);

        gridViewContainer.classList.toggle('d-none', targetMode !== 'grid-view');
        freeViewContainer.classList.toggle('d-none', targetMode !== 'free-view');

        toggleGridViewControls(targetMode === 'free-view');

        // Kanalları tele.add kullanarak kaldır ve yeniden yükle
        activeIds.forEach(id => {
            if (hasChannelId(id)) tele.add(id);
        });
    };

    singleViewActivateButtonEl.addEventListener('click', () => {
        const currentMode = localStorage.getItem(LS_KEY_ACTIVE_VIEW_MODE);
        if (currentMode !== 'single-view') {
            activateSingleView();
            updateViewButtonsState('single-view');
        } else {
            showToast({ title: 'Zaten tekli görünüm modundasınız', type: 'info' });
        }
    });

    gridViewActivateButtonEl.addEventListener('click', () => {
        const currentMode = localStorage.getItem(LS_KEY_ACTIVE_VIEW_MODE) || 'grid-view';
        if (currentMode !== 'grid-view') {
            if (currentMode === 'single-view') {
                deactivateSingleView();
            } else {
                switchGridToFreeViewAndBack('grid-view');
            }
            updateViewButtonsState('grid-view');
        } else {
            showToast({ title: 'Zaten ızgara görünüm modundasınız', type: 'info' });
        }
    });

    freeViewActivateButtonEl.addEventListener('click', () => {
        const currentMode = localStorage.getItem(LS_KEY_ACTIVE_VIEW_MODE) || 'grid-view';
        if (currentMode !== 'free-view') {
            if (currentMode === 'single-view') {
                deactivateSingleView({ skipDefaultChannelsLoad: true });
                switchGridToFreeViewAndBack('free-view');
            } else {
                switchGridToFreeViewAndBack('free-view');
            }
            updateViewButtonsState('free-view');
        } else {
            showToast({ title: 'Zaten serbest görünüm modundasınız', type: 'info' });
        }
    });


    // MARK: Üst menü (Overlay) görünürlüğü
    const overlayVisibilityCheckbox = document.querySelector('#checkbox-personalizar-visualizacion-overlay');
    const overlayVisibilityValueSpan = document.querySelector('#span-valor-visualizacion-overlay');
    if (overlayVisibilityCheckbox && overlayVisibilityValueSpan) {
        const isOverlayVisible = localStorage.getItem(LS_KEY_OVERLAY_VISIBILITY) !== 'hide';
        document.body.classList.toggle('d-none__barras-overlay', !isOverlayVisible);
        syncCheckboxState({
            checkbox: overlayVisibilityCheckbox,
            statusElement: overlayVisibilityValueSpan,
            storageKey: LS_KEY_OVERLAY_VISIBILITY,
            isVisible: isOverlayVisible
        });

        overlayVisibilityCheckbox.addEventListener('click', () => {
            const visible = overlayVisibilityCheckbox.checked;
            document.body.classList.toggle('d-none__barras-overlay', !visible);
            syncCheckboxState({
                checkbox: overlayVisibilityCheckbox,
                statusElement: overlayVisibilityValueSpan,
                storageKey: LS_KEY_OVERLAY_VISIBILITY,
                isVisible: visible
            });
            hideOverlayButtonText();
        });
    }

    const hideOverlayButtonTextDebounced = debounce(hideOverlayButtonText, 150);
    window.addEventListener('resize', hideOverlayButtonTextDebounced); // buton boyutu konteyneri aşarsa metni gizle

    // MARK: m3u8 oynatıcı
    const lsReproductorM3u8 = localStorage.getItem(LS_KEY_M3U8_PLAYER_CHOICE) ?? 'videojs';
    const RADIOS_REPRODUCTOR_M3U8 = document.querySelectorAll('input[name="btnradio-reproductor-m3u8"]');
    const SPAN_VALOR_REPRODUCTOR_M3U8 = document.querySelector('#span-valor-reproductor-m3u8');


    RADIOS_REPRODUCTOR_M3U8.forEach(radio => {
        if (radio.value === lsReproductorM3u8) {
            radio.checked = true;
            if (SPAN_VALOR_REPRODUCTOR_M3U8) {
                SPAN_VALOR_REPRODUCTOR_M3U8.textContent = radio.dataset.descripcion || radio.value;
            }
        }
        radio.addEventListener('change', () => {
            if (!radio.checked) return;
            const valor = radio.value;
            const descripcion = radio.dataset.descripcion || valor;
            localStorage.setItem(LS_KEY_M3U8_PLAYER_CHOICE, valor);
            if (SPAN_VALOR_REPRODUCTOR_M3U8) {
                SPAN_VALOR_REPRODUCTOR_M3U8.textContent = descripcion;
            }

            try {
                const channelSignalPreferences = JSON.parse(localStorage.getItem(LS_KEY_CHANNEL_SIGNAL_PREFERENCE)) || {};

                getActiveChannelIds().forEach(channelId => {
                    if (channelId) {
                        const channelData = getChannelById(channelId)?.señales;
                        if (!channelData) return;

                        let signalToUse;

                        // 1. Öncelik: Kaydedilmiş kullanıcı tercihi
                        if (channelSignalPreferences[channelId]) {
                            signalToUse = Object.keys(channelSignalPreferences[channelId])[0];
                        } else {
                            // 2. Varsayılan: Sinyal önceliği
                            const { iframe_url, m3u8_url, yt_id, yt_embed, yt_playlist, twitch_id } = channelData;

                            if (iframe_url?.length) signalToUse = 'iframe_url';
                            else if (m3u8_url?.length) signalToUse = 'm3u8_url';
                            else if (yt_id) signalToUse = 'yt_id';
                            else if (yt_embed) signalToUse = 'yt_embed';
                            else if (yt_playlist) signalToUse = 'yt_playlist';
                            else if (twitch_id) signalToUse = 'twitch_id';
                        }

                        if (signalToUse === 'm3u8_url') {
                            tele.remove(channelId);
                            tele.add(channelId);
                        }

                    }
                });

            } catch (error) {
                console.error('[teles] m3u8 oynatıcı değiştirildikten sonra kanallar yüklenirken hata oluştu:', error);
            }
        });
    });


    // MARK: Tema Değiştir
    detectThemePreferences();
    const themeCheckboxEl = document.querySelector('#checkbox-change-theme');
    themeCheckboxEl?.addEventListener('change', () => {
        applyTheme(themeCheckboxEl.checked);
    });

    // MARK: Kaydırıcı (Slider) yatay genişlik
    widthRangeInput = document.querySelector('#input-range-tamaño-container-vision-cuadricula');
    widthRangeValue = document.querySelector('#span-valor-input-range');
    /**
     * Izgara görünümü konteyneri için yatay genişliği senkronize eder.
     * @param {number} [newValue] - İsteğe bağlı yeni genişlik değeri.
     */
    const syncHorizontalWidthValue = (newValue) => {
        // Null/undefined değerleri işleyerek değeri al veya ayarla
        const storedValue = localStorage.getItem(LS_KEY_HORIZONTAL_WIDTH_VALUE);
        const widthValue = newValue ?? (storedValue ? parseInt(storedValue, 10) : 100);

        // Yalnızca yeni bir değer varsa localStorage'ı güncelle
        if (newValue !== undefined) {
            localStorage.setItem(LS_KEY_HORIZONTAL_WIDTH_VALUE, widthValue);
        }

        // Değişiklikleri uygula
        const widthPercentage = `${widthValue}%`;
        widthRangeInput.value = widthValue;
        widthRangeValue.textContent = widthPercentage;
        gridViewContainer.style.maxWidth = widthPercentage;
    };

    widthRangeInput.addEventListener('input', (event) => {
        syncHorizontalWidthValue(event.target.value)
        hideOverlayButtonTextDebounced();
    });

    syncHorizontalWidthValue();


    // MARK: Tam yükseklik kullan onay kutusu
    fullHeightCheckbox = document.querySelector('#checkbox-personalizar-altura-canales');
    fullHeightSpan = document.querySelector('#span-valor-altura-canales');
    const iconElFullHeight = document.querySelector('#icono-personalizar-altura-canales');

    // MARK: Butonlarda kanal logolarını göster
    const showLogosCheckbox = document.querySelector('#checkbox-mostrar-logos-botones');
    const showLogosSpan = document.querySelector('#span-valor-mostrar-logos-botones');
    const showLogosIcon = document.querySelector('#icono-mostrar-logos-botones');

    if (showLogosCheckbox && showLogosSpan) {
        showLogosCheckbox.addEventListener('click', () => {
            const isEnabled = showLogosCheckbox.checked;
            syncCheckboxState({
                checkbox: showLogosCheckbox,
                statusElement: showLogosSpan,
                storageKey: LS_KEY_SHOW_CHANNELS_LOGO,
                isVisible: isEnabled
            });

            isEnabled ? showLogosIcon.classList.replace('bi-image', 'bi-image-fill') : showLogosIcon.classList.replace('bi-image-fill', 'bi-image');

            // Değişiklikleri uygulamak için butonları yeniden oluştur
            clearChannelListContainers();
            createChannelButtons();
            createCountryButtons();
            createCategoryButtons();
            resyncActiveChannelsVisualState();
            initializeBootstrapTooltips();

            showToast({
                body: `Buton logoları ${isEnabled ? 'etkinleştirildi' : 'devre dışı bırakıldı'}`,
                type: 'info',
                duration: 2000
            });
        });

        const isShowLogosEnabled = localStorage.getItem(LS_KEY_SHOW_CHANNELS_LOGO) === 'show';
        syncCheckboxState({
            checkbox: showLogosCheckbox,
            statusElement: showLogosSpan,
            storageKey: LS_KEY_SHOW_CHANNELS_LOGO,
            isVisible: isShowLogosEnabled
        });
        isShowLogosEnabled ? showLogosIcon.classList.replace('bi-image', 'bi-image-fill') : showLogosIcon.classList.replace('bi-image-fill', 'bi-image');
    }

    fullHeightCheckbox.addEventListener('click', () => {
        fullHeightCheckbox.checked
            ? (iconElFullHeight.classList.replace('bi-arrows-collapse', 'bi-arrows-vertical'),
                JSON.stringify(localStorage.setItem(LS_KEY_LAYOUT_FULL_HEIGHT_ENABLED, true)),
                fullHeightSpan.textContent = 'Genişletildi'
            )
            : (iconElFullHeight.classList.replace('bi-arrows-vertical', 'bi-arrows-collapse'),
                JSON.stringify(localStorage.setItem(LS_KEY_LAYOUT_FULL_HEIGHT_ENABLED, false)),
                fullHeightSpan.textContent = 'Daraltıldı'
            );
        adjustBootstrapColumnClasses()
    });

    let isFullHeightMode = true;
    try { isFullHeightMode = JSON.parse(localStorage.getItem(LS_KEY_LAYOUT_FULL_HEIGHT_ENABLED)) ?? true; } catch { }

    if (isFullHeightMode) {
        JSON.stringify(localStorage.setItem(LS_KEY_LAYOUT_FULL_HEIGHT_ENABLED, true));
        fullHeightCheckbox.checked = true;
        iconElFullHeight.classList.replace('bi-arrows-collapse', 'bi-arrows-vertical');
        fullHeightSpan.textContent = 'Genişletildi';
    } else {
        fullHeightCheckbox.checked = false;
        iconElFullHeight.classList.replace('bi-arrows-vertical', 'bi-arrows-collapse');
        fullHeightSpan.textContent = 'Daraltıldı';
    }

    // MARK: Satır başına kanal sayısı
    numberChannelsPerRowSpan = document.querySelector('#span-valor-transmisiones-por-fila');
    numberChannelsPerRowButtons = document.querySelectorAll('#container-botones-personalizar-transmisiones-por-fila button');

    numberChannelsPerRowButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            updateGridColumnConfiguration(btn.value)
            numberChannelsPerRowSpan.innerHTML = `${obtainNumberOfChannelsPerRow()}`
            hideOverlayButtonText()

            const isGridView = localStorage.getItem(LS_KEY_ACTIVE_VIEW_MODE) === 'grid-view' || !localStorage.getItem(LS_KEY_ACTIVE_VIEW_MODE);
            if (isGridView) {
                const newMax = obtainNumberOfChannelsPerRow() * 2;
                const activeChannels = Array.from(gridViewContainer.querySelectorAll('div[data-canal]'));
                if (activeChannels.length > newMax) {
                    const excessChannels = activeChannels.slice(newMax);
                    for (let i = excessChannels.length - 1; i >= 0; i--) {
                        tele.remove(excessChannels[i].dataset.canal);
                    }
                }
            }
        })
    });
    numberChannelsPerRowSpan.innerHTML = `${obtainNumberOfChannelsPerRow()}`


    // MARK: Kayan düğmelerin konumu
    floatingButtonsPositionButtons = document.querySelectorAll('#grupo-botones-posicion-botones-flotantes .btn-check');
    floatingButtonsPositionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const position = btn.dataset.position.split(' ');
            handleFloatingButtonsPositionClick(...position);
        });
    });

    let floatingActionsPosition = localStorage.getItem(LS_KEY_FLOATING_BUTTONS_POSITION);
    if (floatingActionsPosition !== null) {
        const { top, start, margin, translate } = JSON.parse(floatingActionsPosition);
        updateFloatingButtons(top, start, margin, translate);
    } else {
        updateFloatingButtons('bottom-0', 'start-50', 'mb-3', 'translate-middle-x');
    }

    // MARK: Kayan düğmelerdeki metin
    const floatingButtonsTextCheckbox = document.querySelector('#checkbox-personalizar-texto-botones-flotantes');
    const floatingButtonsTextValueSpan = document.querySelector('#span-valor-texto-en-botones-flotante');
    const floatingButtonsTextIcon = document.querySelector('#icono-personalizar-texto-botones-flotantes');

    const floatingButtonsSpans = document.querySelectorAll('#grupo-botones-flotantes button>span');

    floatingButtonsTextCheckbox.addEventListener('click', () => {
        floatingButtonsSpans.forEach(button => {
            button.classList.toggle('d-none', !floatingButtonsTextCheckbox.checked);
        });
        syncCheckboxState({
            checkbox: floatingButtonsTextCheckbox,
            statusElement: floatingButtonsTextValueSpan,
            storageKey: LS_KEY_FLOATING_BUTTONS_TEXT_VISIBILITY,
            isVisible: floatingButtonsTextCheckbox.checked
        });
        floatingButtonsTextCheckbox.checked
            ? floatingButtonsTextIcon.classList.replace('bi-square', 'bi-info-square')
            : floatingButtonsTextIcon.classList.replace('bi-info-square', 'bi-square');
    });

    if (localStorage.getItem(LS_KEY_FLOATING_BUTTONS_TEXT_VISIBILITY) !== 'hide') {
        syncCheckboxState({
            checkbox: floatingButtonsTextCheckbox,
            statusElement: floatingButtonsTextValueSpan,
            storageKey: LS_KEY_FLOATING_BUTTONS_TEXT_VISIBILITY,
            isVisible: true
        });
        floatingButtonsTextIcon.classList.replace('bi-square', 'bi-info-square');
    } else {
        floatingButtonsSpans.forEach((button) => {
            button.classList.toggle('d-none', !floatingButtonsTextCheckbox.checked);
        });
        syncCheckboxState({
            checkbox: floatingButtonsTextCheckbox,
            statusElement: floatingButtonsTextValueSpan,
            storageKey: LS_KEY_FLOATING_BUTTONS_TEXT_VISIBILITY,
            isVisible: false
        });
        floatingButtonsTextIcon.classList.replace('bi-info-square', 'bi-square');
    }


    // MARK: Dinamik URL
    dynamicUrlCheckbox?.addEventListener('click', () => {
        isDynamicUrlMode = dynamicUrlCheckbox.checked;
        localStorage.setItem(LS_KEY_DYNAMIC_URL, JSON.stringify(isDynamicUrlMode));
        applyDynamicUrlState(isDynamicUrlMode);

        isDynamicUrlMode ? syncActiveChannelsParameter() : clearSharedUrlParameter(true);
    });
    applyDynamicUrlState(isDynamicUrlMode);


    const mergeCustomListsCheckboxEl = document.querySelector('#checkbox-combinar-listas-personalizadas');
    const mergeCustomListsValueSpanEl = document.querySelector('#span-valor-combinar-listas-personalizadas');

    /**
     * Özel listeler arasındaki benzer kanalları birleştirme geçişini başlatır ve senkronize eder.
     */
    function initMergeCustomListsPreference() {
        if (!mergeCustomListsCheckboxEl || !mergeCustomListsValueSpanEl) { return }

        const getStateLabel = (state) => state ? 'Eşleşmeleri birleştir' : 'Listeleri ayrı tut';

        const applyState = (state) => {
            mergeCustomListsCheckboxEl.checked = state;
            mergeCustomListsValueSpanEl.textContent = getStateLabel(state);
        };

        const initialState = getCombineChannelsPreference();
        applyState(initialState);

        mergeCustomListsCheckboxEl.addEventListener('change', async () => {
            const newState = mergeCustomListsCheckboxEl.checked;
            setCombineChannelsPreference(newState);
            applyState(newState);

            try {
                showToast({
                    body: 'Kanal listesi güncelleniyor...',
                    type: 'dark',
                    duration: 2000
                });

                // 0. Değişiklikten önce aktif kanalları yakala (kopyaları önle)
                const activeGridChannels = getActiveChannelIds();
                const activeSingleChannel = singleViewVideoContainer.querySelector('div[data-canal]')?.dataset.canal;

                // 1. Temel kanalları yeniden yükle (varsayılanları sıfırlar)
                await restoreChannelsFromMemory();

                // 2. Yeni tercihle kişiselleştirilmiş listeleri geri yükle
                restorePersonalizedLists();

                // 3. Arayüzü yeniden oluştur (Re-render)
                createChannelButtons();

                // Tutarlılığı sağlamak için ek listeleri güncelle

                createButtonsForSingleView();

                // Sıralama özellikleri için temel sırayı güncelle
                for (const PREFIX of ID_PREFIX_CONTAINERS_CHANNELS) {
                    saveOriginalOrder(`${PREFIX}-channels-buttons-container`);
                }

                // 4. Aktif kanalları yenile (Izgara Görünümü)
                if (activeGridChannels.length > 0) {
                    activeGridChannels.forEach(channelId => {
                        if (tele && hasChannelId(channelId)) {
                            tele.remove(channelId);
                            tele.add(channelId);
                        } else if (tele) {
                            tele.remove(channelId);
                        }
                    });
                }

                // 5. Aktif kanalı yenile (Tekli Görünüm)
                if (activeSingleChannel) {
                    if (tele && hasChannelId(activeSingleChannel)) {
                        tele.remove(activeSingleChannel);
                        tele.add(activeSingleChannel);
                    } else if (tele) {
                        tele.remove(activeSingleChannel);
                    }
                }

                showToast({
                    body: 'Liste ve aktif kanallar başarıyla güncellendi',
                    type: 'success'
                });

            } catch (error) {
                console.error('[teles] Tercih değiştirildikten sonra liste güncellenirken hata', error);
                showToast({
                    title: 'Hata',
                    body: 'Liste hemen güncellenemedi. Sayfayı yenileyin.',
                    type: 'danger'
                });
            }
        }, { once: false });
    }

    initMergeCustomListsPreference();


    renderPersonalizedListsUI();


    const loadCustomListButtonEl = document.querySelector('#boton-cargar-lista-personalizada');
    const customListUrlInputEl = document.querySelector('#input-url-lista-personalizada');
    if (loadCustomListButtonEl && customListUrlInputEl) {
        const originalButtonText = loadCustomListButtonEl.innerHTML;
        const toggleLoadingStateButton = (isLoading) => {
            if (isLoading) {
                loadCustomListButtonEl.disabled = true;
                loadCustomListButtonEl.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Yükleniyor...';
            } else {
                loadCustomListButtonEl.disabled = false;
                loadCustomListButtonEl.innerHTML = originalButtonText;
            }
        };

        loadCustomListButtonEl.addEventListener('click', async () => {
            const listUrl = customListUrlInputEl.value.trim();
            if (!listUrl) {
                showToast({
                    body: 'Yüklemeden önce .m3u dosyanızın URL\'sini girin.',
                    type: 'warning'
                });
                customListUrlInputEl.focus();
                return;
            }

            try {
                new URL(listUrl);
            } catch {
                showToast({
                    title: 'Girilen URL geçersiz.',
                    body: 'https:// ile başladığından emin olun.',
                    type: 'danger'
                });
                customListUrlInputEl.focus();
                return;
            }

            toggleLoadingStateButton(true);
            try {
                await loadPersonalizedM3UList(listUrl);
                clearChannelListContainers();
                createChannelButtons();
                createCountryButtons();
                createCategoryButtons();
                resyncActiveChannelsVisualState();
                initializeBootstrapTooltips();

                renderPersonalizedListsUI();
                showToast({
                    title: 'Özel liste başarıyla yüklendi.',
                    body: 'Yeni kanallar listenize eklendi.',
                    type: 'success'
                });
            } catch (error) {
                console.error('[teles] Özel M3U listesi yüklenirken hata:', error);
                showToast({
                    title: 'Özel liste yüklenemedi.',
                    body: `URL'yi veya sunucunun indirmelere izin verip vermediğini (CORS) kontrol edin. <br> Hata: ${error}`,
                    type: 'danger',
                    autohide: false,
                    delay: 0,
                    allowHtml: true
                });
            } finally {
                toggleLoadingStateButton(false);
            }
        });
    }

    const pasteCustomListButtonEl = document.querySelector('#boton-pegar-lista-personalizada');
    const customListTextareaEl = document.querySelector('#textarea-lista-personalizada');

    if (pasteCustomListButtonEl && customListTextareaEl) {
        const originalPasteButtonText = pasteCustomListButtonEl.innerHTML;
        const togglePasteButton = (isLoading) => {
            if (isLoading) {
                pasteCustomListButtonEl.disabled = true;
                pasteCustomListButtonEl.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> İşleniyor...';
            } else {
                pasteCustomListButtonEl.disabled = false;
                pasteCustomListButtonEl.innerHTML = originalPasteButtonText;
            }
        };

        pasteCustomListButtonEl.addEventListener('click', async () => {
            const listContent = customListTextareaEl.value.trim();
            if (!listContent) {
                showToast({
                    body: 'Devam etmeden önce .m3u dosyanızın tüm içeriğini yapıştırın.',
                    type: 'warning'
                });
                customListTextareaEl.focus();
                return;
            }

            togglePasteButton(true);
            try {
                const manualLabel = `Manuel liste ${new Date().toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}`;
                await loadPersonalizedListFromText(listContent, { etiqueta: manualLabel });
                customListTextareaEl.value = '';
                clearChannelListContainers();
                createChannelButtons();
                createCountryButtons();
                createCategoryButtons();
                resyncActiveChannelsVisualState();

                renderPersonalizedListsUI();
                showToast({
                    title: 'Manuel liste başarıyla yüklendi.',
                    body: 'Yeni kanallar listenize eklendi.',
                    type: 'success'
                });
            } catch (error) {
                console.error('[teles] Elle yapıştırılan liste işlenirken hata:', error);
                showToast({
                    title: 'Yapıştırılan metin işlenemedi.',
                    body: `.m3u dosyasının biçimini kontrol edin. Hata: ${error.message}`,
                    type: 'danger',
                    autohide: false,
                    delay: 0,
                    showReloadOnError: true,
                    allowHtml: true
                });
            } finally {
                togglePasteButton(false);
            }
        });
    }



    // MARK: 🟢 İlk Yükleme
    /**
     * İlk kanal yüklemesini gerçekleştirir ve kişiselleştirilmiş listeleri geri yükler.
     */
    async function initialLoad() {
        // Clear old channel cache to ensure the new list is applied
        const APP_VERSION = 'v0.3.3-youtube-alplox'; // Unique version to trigger reset
        if (localStorage.getItem('teles-app-version') !== APP_VERSION) {
            localStorage.removeItem(LS_KEY_CHANNELS_BACKUP);
            localStorage.removeItem(LS_KEY_CHANNELS_BACKUP_DATE);
            localStorage.removeItem(LS_KEY_CHANNEL_SIGNAL_PREFERENCE);
            localStorage.setItem('teles-app-version', APP_VERSION);
            console.info('[teles] App version changed. Refreshing channel data...');
        }
        try {
            await fetchLoadChannels();
            if (channelsList) {
                const restoredLists = restorePersonalizedLists();

                // Tembel yükleme (Lazy load): İlk yükleme VEYA Tekli Görünüm.
                // Izgara görünümündeki aktif kanallar bireysel olarak tele.add() tarafından işlenir.
                // Modallar ve yan panellerdeki (offcanvas) seçim listeleri isteğe bağlı yüklenecektir.

                if (localStorage.getItem(LS_KEY_ACTIVE_VIEW_MODE) === 'single-view') {
                    createChannelButtons('single-view');
                    createCountryButtons('single-view');
                    createCategoryButtons('single-view');
                }

                deleteInvalidSignalPreferences();

                const currentUrl = new URL(window.location.href);
                const sharedParam = currentUrl.searchParams.get('c');
                const totalRequestedChannels = sharedParam
                    ? sharedParam
                        .split(',')
                        .map(id => id.trim())
                        .filter(id => id.length > 0).length
                    : 0;

                const sharedChannels = getChannelsFromUrl();

                if (sharedChannels.length > 0) {

                    isLoadingFromSharedUrl = true;

                    if (localStorage.getItem(LS_KEY_ACTIVE_VIEW_MODE) === 'single-view') {
                        deactivateSingleView({ skipDefaultChannelsLoad: true });
                        singleViewActivateButtonEl.classList.replace(CSS_CLASS_BUTTON_PRIMARY, 'btn-light-subtle');
                        localStorage.setItem(LS_KEY_ACTIVE_VIEW_MODE, 'grid-view');
                    } else if (localStorage.getItem(LS_KEY_ACTIVE_VIEW_MODE) === 'free-view') {
                        // URL'den kanal yüklemeden önce konteynerlerin doğru şekilde değiştirildiğinden emin ol
                        gridViewContainer.classList.add('d-none');
                        freeViewContainer.classList.remove('d-none');
                    }
                    sharedChannels.forEach(canalId => tele.add(canalId));
                    isLoadingFromSharedUrl = false;

                    if (totalRequestedChannels > sharedChannels.length) {
                        const difference = totalRequestedChannels - sharedChannels.length;
                        showToast({
                            title: 'URL\'den yüklenirken atlanan kanallar',
                            body: `Paylaşılan tüm kanallar yüklenemedi 
                                (${totalRequestedChannels} kanaldan ${sharedChannels.length} tanesi yüklendi). 
                                Bazıları özel listelerden veya bu tarayıcıda 
                                bulunmayan modlardan geliyor olabilir.`,
                            type: 'info'
                        });
                        console.info('[teles] URL\'den atlanan kanallar', {
                            totalSolicitados: totalRequestedChannels,
                            totalCargados: sharedChannels.length,
                            faltantes: difference
                        });
                    }
                } else {

                    if (localStorage.getItem(LS_KEY_ACTIVE_VIEW_MODE) === 'single-view') {
                        activateSingleView();
                        singleViewActivateButtonEl.classList.replace('btn-light-subtle', CSS_CLASS_BUTTON_PRIMARY);
                        gridViewActivateButtonEl.classList.replace(CSS_CLASS_BUTTON_PRIMARY, 'btn-light-subtle');
                    } else if (localStorage.getItem(LS_KEY_ACTIVE_VIEW_MODE) === 'free-view') {
                        // Serbest Görünüm: kaydedilmiş kanal kimliklerini (ID) Izgara Görünümüyle aynı şekilde geri yükle
                        gridViewContainer.classList.add('d-none');
                        freeViewContainer.classList.remove('d-none');
                        toggleGridViewControls(true);
                        tele.loadDefaultChannels();
                    } else {
                        tele.loadDefaultChannels();
                    }
                }

                /// actualizarBotonesPersonalizarOverlay()

                const lsBootstrapColNumber =
                    JSON.parse(localStorage.getItem(LS_KEY_BOOTSTRAP_COL_NUMBER)) ??
                    (isMobile.any ? BOOTSTRAP_COL_NUMBER_MOBILE : BOOTSTRAP_COL_NUMBER_DESKTOP);
                updateGridColumnConfiguration(lsBootstrapColNumber);
                hideOverlayButtonText()

                // Kritik olmayan ipuçlarını (tooltips) ertele
                requestAnimationFrame(() => {
                    initializeBootstrapTooltips();
                });

                if (restoredLists > 0) {
                    renderPersonalizedListsUI();
                }
            }
        } catch (error) {
            console.error('[teles] İlk yükleme sırasında hata', error);
            showToast({
                title: 'İlk yükleme sırasında hata',
                body: `Hata: ${error}`,
                type: 'danger',
                showReloadOnError: true
            });
            return
        }
    }
    // initialLoad() Gridstack başlatıldıktan sonra aşağıya taşındı



    screen.orientation.addEventListener('change', () => {
        if (localStorage.getItem(LS_KEY_ACTIVE_VIEW_MODE) !== 'single-view') adjustBootstrapColumnClasses();
    });

    document.addEventListener('hidden.bs.toast', event => {
        event.target.remove()
    });

    // MARK: diğerleri
    // GridStack kullanarak ızgaradaki kanalları taşımak için eklenti
    gridStackInstance = GridStack.init({
        margin: 0,
        cellHeight: '10rem',
        animate: true,
        handle: '.clase-para-mover',
        cancel: 'input, textarea, select, option', // .btn üzerindeki varsayılan engellemeyi geçersiz kılar
        float: true,  // Öğelerin "yüzmesine" ve serbestçe yeniden düzenlenmesine izin verir. False ise, widget'lar boşluk bırakmadan ızgaraya sıkıca oturur.
        column: 12,   // Izgaranın sütun sayısı. Bootstrap (12 sütun) gibi sistemlere benzer.

        resizable: {
            handles: 'all',
            autoHide: true
        }
    }, freeViewContainer);

    gridStackInstance.on('change', () => {
        saveGridStackLayout();
    });
    gridStackInstance.on('resizestop', () => {
        saveGridStackLayout();
    });
    gridStackInstance.on('dragstop', () => {
        saveGridStackLayout();
        initializeBootstrapTooltips();
        registerManualChannelChange();
        saveChannelsToLocalStorage();
    });
    gridStackInstance.on('dragstart', () => {
        disposeBootstrapTooltips();
    });
    gridStackInstance.on('removed', (event, items) => {
        items.forEach(item => {
            const channelId = item.el?.getAttribute('data-canal');
            if (channelId) {
                // Kaynak temizliği (videojs, iframe'ler, vb.)
                cleanTransmissionResources(item.el);
                // tele.remove, localStorage'ı ve buton durumlarını güncellemeyi üstlenir
                tele.remove(channelId);
            }
        });
        saveGridStackLayout();
        saveChannelsToLocalStorage();
        adjustVisibilityButtonsRemoveAllActiveChannels();
    });

    initialLoad();
    adjustVisibilityButtonsRemoveAllActiveChannels();


    singleViewGrid = document.querySelector('.single-view-grid');
    new Sortable(singleViewGrid, {
        animation: 350,
        handle: '.clase-para-mover',
        easing: "cubic-bezier(.17,.67,.83,.67)",
        ghostClass: 'marca-al-mover',
        swapThreshold: 0.30,
        onStart: () => {
            try {
                disposeBootstrapTooltips();
            } catch (e) {
                console.error('[teles] Sortable onStart\'ta hata:', e);
            }
        },
        onChange: () => {
            try {
                toggleOrderedClass();
            } catch (e) {
                console.error('[teles] Sortable onChange\'de hata:', e);
            }
        },
        onEnd: () => {
            try {
                saveSingleViewPanelsOrder();
                initializeBootstrapTooltips();
                toggleOrderedClass();
                registerManualChannelChange();
            } catch (e) {
                console.error('[teles] Sortable onEnd\'de hata:', e);
            }
        }
    });


    let observerScheduled = false;

    const OBSERVER = new MutationObserver(() => {
        if (observerScheduled) return;
        observerScheduled = true;
        requestAnimationFrame(() => {
            observerScheduled = false;
            try {
                adjustBootstrapColumnClasses?.();
                adjustVisibilityButtonsRemoveAllActiveChannels?.();
            } catch (e) {
                console.error('[teles] Mutation observer içinde hata', e);
            }
        });
    });

    const OBSERVER_CONFIG = {
        childList: true,
        subtree: false,
        attributes: false,
        characterData: false
    };

    if (gridViewContainer) {
        OBSERVER.observe(gridViewContainer, OBSERVER_CONFIG);
    }
    if (freeViewContainer) {
        OBSERVER.observe(freeViewContainer, OBSERVER_CONFIG);
    }

    // MARK: 🚀 Tembel Yükleme (Lazy Loading) Tetikleyicileri
    /**
     * Modallar ve yan paneller (offcanvas) için tembel yüklemeyi ayarlar.
     * Bu, ilk yükleme sırasında yüzlerce düğmenin oluşturulmasını önler.
     */
    ID_PREFIX_CONTAINERS_CHANNELS.filter(containerId => containerId !== 'single-view').forEach(containerId => {
        const element = document.getElementById(containerId);
        if (!element) return;

        const eventName = containerId.startsWith('offcanvas') ? 'show.bs.offcanvas' : 'show.bs.modal';

        element.addEventListener(eventName, () => {
            createChannelButtons(containerId);
            createCountryButtons(containerId);
            createCategoryButtons(containerId);
        });
    });
});

// MARK: 📺 Kanal yönetimi
/**
 * Arayüz (UI) modülleri arasında kullanılan genel kanal denetleyicisi.
 */
export let tele = {
    /**
     * Geçerli görünüme (ızgara veya tekli görünüm) bir kanal ekler.
     * @param {string} channelId - channelsList'teki kanal tanımlayıcı anahtarı.
     */
    add: (channelId) => {
        try {
            if (!channelId || !hasChannelId(channelId)) return console.error(`[teles] Eklenmek üzere sağlanan "${channelId}" kanalı geçerli değil.`);

            const viewMode = localStorage.getItem(LS_KEY_ACTIVE_VIEW_MODE) || 'grid-view';
            const isSingleView = viewMode === 'single-view';
            const isFreeView = viewMode === 'free-view';

            if (isSingleView && singleViewVideoContainer?.querySelector(`div[data-canal="${channelId}"]`)) return;
            if (!isSingleView && !isFreeView && gridViewContainer.querySelector(`div[data-canal="${channelId}"]`)) return;
            if (isFreeView && freeViewContainer.querySelector(`div[data-canal="${channelId}"]`)) return;

            const isGridView = !isSingleView && !isFreeView;
            if (isGridView) {
                const maxChannels = obtainNumberOfChannelsPerRow() * 2;
                if (gridViewContainer.querySelectorAll('div[data-canal]').length >= maxChannels) {
                    showToast({
                        title: 'Sınır Aşıldı',
                        body: 'Mevcut düzende en fazla ' + maxChannels + ' kanal ekleyebilirsiniz.',
                        type: 'warning'
                    });
                    return;
                }
            } else if (isFreeView) {
                if (freeViewContainer.querySelectorAll('div[data-canal]').length >= 12) {
                    showToast({
                        title: 'Sınır Aşıldı',
                        body: 'Serbest modda en fazla 12 kanal ekleyebilirsiniz.',
                        type: 'warning'
                    });
                    return;
                }
            }

            const channelContainer = document.createElement('div');
            channelContainer.setAttribute('data-canal', channelId);

            if (isSingleView) {
                // Tekli görünümde en fazla bir aktif kanal olmalıdır.
                const channelInUse = singleViewVideoContainer?.querySelector('div[data-canal]');
                if (channelInUse && channelInUse.dataset.canal && channelInUse.dataset.canal !== channelId) {
                    tele.remove(channelInUse.dataset.canal);
                }
                channelContainer.classList.add('position-relative', 'shadow', 'h-100', 'w-100');
                channelContainer.append(crearFragmentCanal(channelId, viewMode));
                singleViewVideoContainer.append(channelContainer);
                singleViewNoSignalIcon.classList.add('d-none');
            } else if (isFreeView) {
                channelContainer.classList.add('grid-stack-item');
                const fragmentContainer = document.createElement('div');
                fragmentContainer.classList.add('grid-stack-item-content', 'position-relative', 'shadow', 'h-100', 'w-100', 'overflow-hidden');
                fragmentContainer.append(crearFragmentCanal(channelId, viewMode));
                channelContainer.append(fragmentContainer);

                const layouts = JSON.parse(localStorage.getItem(LS_KEY_TELES_GRIDSTACK_LAYOUT)) || {};
                const optimalW = Math.max(2, Math.floor(12 / obtainNumberOfChannelsPerRow()));
                const layout = layouts[channelId] || { w: optimalW, h: 3 };

                channelContainer.setAttribute('gs-id', channelId);

                gridStackInstance.addWidget({
                    el: channelContainer,
                    id: channelId,
                    w: layout.w,
                    h: layout.h,
                    x: layout.x,
                    y: layout.y,
                    minW: 2,
                    minH: 1
                });
                saveChannelsToLocalStorage();
                // Not: saveGridStackLayout() 'change' (değişiklik) olayı aracılığıyla otomatik olarak tetiklenir
                // Bunu burada tekrar çağırmak, toplu başlatma sırasında kısmen yüklenen düzenleri sıfırlar
            } else {
                channelContainer.classList.add('position-relative', 'shadow');
                channelContainer.append(crearFragmentCanal(channelId, viewMode));
                gridViewContainer.append(channelContainer);
                saveChannelsToLocalStorage();
            }
            adjustChannelButtonClass(channelId, true);
            initializeBootstrapTooltips();
            hideOverlayButtonText();
            registerManualChannelChange();
            adjustVisibilityButtonsRemoveAllActiveChannels?.();
            if (!isSingleView) adjustBootstrapColumnClasses();
        } catch (error) {
            console.error(`[teles] Eklenecek kanal oluşturulurken hata - Kimlik (ID): ${channelId}. Hata: ${error}`);
            showToast({
                title: `Eklenecek kanal oluşturulurken bir hata meydana geldi - Kimlik (ID): ${channelId}.`,
                body: `Hata: ${error}`,
                type: 'danger',
                autohide: false,
                delay: 0,
                showReloadOnError: true
            })
            return
        }
    },
    /**
     * Geçerli görünümden bir kanalı kaldırır.
     * @param {string} channelId - channelsList'teki kanal tanımlayıcı anahtarı.
     */
    remove: (channelId) => {
        try {
            if (!channelId) return console.error(`[teles] Sağlanan "${channelId}" kanalı kaldırılmak için geçerli değil.`);

            const currentMode = localStorage.getItem(LS_KEY_ACTIVE_VIEW_MODE);
            const isSingleView = currentMode === 'single-view';
            const isFreeView = currentMode === 'free-view';

            let activeContainer;
            if (isSingleView) activeContainer = singleViewContainer;
            else if (isFreeView) activeContainer = freeViewContainer;
            else activeContainer = gridViewContainer;

            let transmissionToRemove = activeContainer.querySelector(`div[data-canal="${channelId}"]`);

            if (!transmissionToRemove) {
                // Beklenmedik bir durum halinde hayalet düğümler için ikincil kontrol
                transmissionToRemove = document.querySelector(`div[data-canal="${channelId}"]`);
                if (!transmissionToRemove) {
                    adjustChannelButtonClass(channelId, false);
                    return;
                }
            }

            // Konteyneri kaldırmadan önce kaynakları temizle; iframe, videojs, clappr, oplayer
            cleanTransmissionResources(transmissionToRemove);
            // İpuçlarını (tooltips) kaldır; kayan üst menü butonları
            disposeBootstrapTooltips();

            const viewMode = localStorage.getItem(LS_KEY_ACTIVE_VIEW_MODE) || 'grid-view';
            if (viewMode === 'single-view') {
                transmissionToRemove.remove();
                singleViewNoSignalIcon.classList.remove('d-none');
            } else if (viewMode === 'free-view') {
                gridStackInstance.removeWidget(transmissionToRemove, true);
                saveChannelsToLocalStorage();
                saveGridStackLayout();
            } else {
                transmissionToRemove.remove();
                saveChannelsToLocalStorage();
                adjustBootstrapColumnClasses();
            }

            adjustChannelButtonClass(channelId, false);
            initializeBootstrapTooltips();
            registerManualChannelChange();
            adjustVisibilityButtonsRemoveAllActiveChannels?.();
        } catch (error) {
            console.error(`[teles] Kanal silinirken hata - Kimlik (ID): ${channelId}. Hata: ${error}`);
            showToast({
                title: `Kanal silinirken bir hata meydana geldi - Kimlik (ID): ${channelId}.`,
                body: `Hata: ${error}`,
                type: 'danger',
                autohide: false,
                delay: 0,
                showReloadOnError: true
            })
            return
        }
    },
    /**
     * Kaydedilmiş durumdan veya önceden tanımlanmış listeden varsayılan kanalları yükler.
     */
    loadDefaultChannels: () => {
        const fileChannels = getDefaultChannels(); // canales.json içindeki tüm kanal ID'leri
        let savedChannels = JSON.parse(localStorage.getItem(LS_KEY_SAVED_CHANNELS_GRID_VIEW)) || {};
        
        // 1. Dosyadaki tüm kanalları listeye ekle
        fileChannels.forEach(channelId => {
            tele.add(channelId);
        });

        // 2. Eğer dosyadan silinmiş ama ekranda kalan kanal varsa onları temizle
        Object.keys(savedChannels).forEach(channelId => {
            if (!hasChannelId(channelId)) {
                tele.remove(channelId);
            }
        });
    }
};

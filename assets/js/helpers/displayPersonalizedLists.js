import { updatePersonalizedList, applySavedPersonalizedList, channelsList, deletePersonalizedList, getPersonalizedLists } from "../channelManager.js";
import { ID_PREFIX_CONTAINERS_CHANNELS, LS_KEY_ACTIVE_VIEW_MODE, LS_KEY_SAVED_CHANNELS_GRID_VIEW } from "../constants/index.js";
import { tele } from "../main.js";
import { formatDate } from "../utils/index.js";
import { adjustChannelButtonClass, createCategoryButtons, createCountryButtons, createChannelButtons, createButtonsForSingleView, showToast, getActiveChannelIds, clearRenderedContainers, clearCountryRenderedContainers, clearCategoryRenderedContainers } from "./index.js";


/**
 * Clears channel list containers (modal/offcanvas/single view).
 * Rebuilds single-view buttons if needed to avoid empty panels.
 */
export const clearChannelListContainers = () => {
    for (const PREFIX of ID_PREFIX_CONTAINERS_CHANNELS) {
        const buttonsContainer = document.querySelector(`#${PREFIX}-channels-buttons-container`);
        const countriesContainer = document.querySelector(`#${PREFIX}-collapse-botones-listado-filtro-paises`);
        const categoriesContainer = document.querySelector(`#${PREFIX}-collapse-botones-listado-filtro-categorias`);
        if (buttonsContainer) {
            buttonsContainer.innerHTML = '';
        }
        if (countriesContainer) {
            countriesContainer.innerHTML = '';
        }
        if (categoriesContainer) {
            categoriesContainer.innerHTML = '';
        }
    }

    // Always clear the internal rendering state cache to allow full re-renders
    clearRenderedContainers();
    clearCountryRenderedContainers();
    clearCategoryRenderedContainers();

    // If the view mode is 'single-view' reload so the channels-buttons-container 
    // doesn't end up empty after loading/unloading a personalized M3U list
    if (localStorage.getItem(LS_KEY_ACTIVE_VIEW_MODE) === 'single-view') {
        const singleViewContainer = document.querySelector('#single-view-channels-buttons-container');
        if (singleViewContainer) {
            try {
                createButtonsForSingleView();
                createCountryButtons('single-view');
                createCategoryButtons('single-view');
            } catch (error) {
                console.error('[teles] Hata recreating Single View buttons after updating list', error);
            }
        }
    }
}

/**
 * Re-syncs active channel button styles for currently active channels.
 * Uses localStorage for better performance instead of DOM traversal.
 * Falls back to DOM traversal if localStorage is empty.
 */
export const resyncActiveChannelsVisualState = () => {
    try {
        getActiveChannelIds().forEach(channelId => {
            if (channelId) adjustChannelButtonClass(channelId, true);
        });
    } catch (error) {
        console.error('[teles] Hata resyncing active channels visual state', error);
    }
}

/**
 * Renders personalized list cards into the UI.
 */
export const renderPersonalizedListsUI = () => {
    const customListsContainerEl = document.querySelector('#contenedor-listas-personalizadas');
    if (!customListsContainerEl) return;
    const lists = getPersonalizedLists();
    const urls = Object.keys(lists);
    if (!urls.length) {
        customListsContainerEl.innerHTML = '<p class="text-secondary fs-smaller mb-0">Kaydedilmiş liste yok.</p>';
        return;
    }
    const fragment = document.createDocumentFragment();
    urls.sort((a, b) => {
        const etiquetaA = lists[a]?.etiqueta || a;
        const etiquetaB = lists[b]?.etiqueta || b;
        return etiquetaA.localeCompare(etiquetaB, 'es', { sensitivity: 'base' });
    }).forEach(url => {
        fragment.append(createPersonalizedListCard(url, lists[url]));
    });
    customListsContainerEl.innerHTML = '';
    customListsContainerEl.append(fragment);
}

const createPersonalizedListCard = (url, data = {}) => {
    const card = document.createElement('div');
    card.classList.add('bg-body-secondary', 'bg-opacity-10', 'rounded-3', 'p-2', 'border', 'border-light-subtle', 'mb-2');
    const etiqueta = data.etiqueta || url;
    const pinned = data.pinned !== false;

    const encabezado = document.createElement('div');
    encabezado.classList.add('d-flex', 'justify-content-between', 'align-items-start', 'gap-2');

    const bloqueInfo = document.createElement('div');
    bloqueInfo.innerHTML = `
            <p class="fw-semibold mb-0">${etiqueta}</p>
            <small class="text-secondary text-break">${url}</small><br>
            <small class="text-secondary">Actualizado: ${formatDate(data.actualizado)}</small>
        `;

    const bloqueAcciones = document.createElement('div');
    bloqueAcciones.classList.add('d-flex', 'flex-column', 'gap-1');

    const botonPin = document.createElement('button');
    botonPin.type = 'button';
    botonPin.className = `btn btn-sm ${pinned ? 'btn-success' : 'btn-outline-secondary'}`;
    botonPin.innerHTML = pinned ? '<i class="bi bi-pin-angle-fill"></i> Sabitlendi' : '<i class="bi bi-pin-angle"></i> Sabitlenmedi';
    botonPin.addEventListener('click', () => {
        const currentState = (getPersonalizedLists()[url]?.pinned !== false);
        const newState = !currentState;
        updatePersonalizedList(url, { pinned: newState });
        renderPersonalizedListsUI();
        showToast({
            title: 'Özel Liste',
            body: newState ? `La lista "${etiqueta}" se restaurará al recargar.` : `La lista "${etiqueta}" ya no se restaurará arabamáticamente.`,
            type: newState ? 'success' : 'info'
        })
    });

    const botonUygula = document.createElement('button');
    botonUygula.type = 'button';
    botonUygula.className = 'btn btn-sm btn-outline-primary';
    botonUygula.innerHTML = '<i class="bi bi-arrow-repeat"></i> Uygula';
    botonUygula.addEventListener('click', () => {
        const success = applySavedPersonalizedList(url);
        if (success) {
            clearChannelListContainers();
            createChannelButtons();
            createCountryButtons();
            createCategoryButtons();
            resyncActiveChannelsVisualState();
            showToast({
                title: 'Özel Liste',
                body: `Lista "${etiqueta}" aplicada correctamente.`,
                type: 'success'
            })
        } else {
            showToast({
                title: 'Özel Liste',
                body: 'No fue posible aplicar la lista seleccionada.',
                type: 'danger',
                arabahide: false,
                delay: 0,
                showReloadOnHata: true
            })
        }
    });

    const botonEliminar = document.createElement('button');
    botonEliminar.type = 'button';
    botonEliminar.className = 'btn btn-sm btn-outline-danger';
    botonEliminar.innerHTML = '<i class="bi bi-trash"></i> Kaldır';
    botonEliminar.addEventListener('click', () => {
        if (!window.confirm(`¿Eliminar la lista "${etiqueta}" y sus canales asociados?`)) return;
        const deleted = deletePersonalizedList(url);
        if (!deleted) {
            showToast({
                title: 'Hata',
                body: 'No se pudo eliminar la lista personalizada.',
                type: 'danger'
            });
            return;
        }
        const eliminados = removeChannelsBySource(url);
        clearChannelListContainers();
        createChannelButtons();
        createCountryButtons();
        createCategoryButtons();
        resyncActiveChannelsVisualState();

        renderPersonalizedListsUI();
        showToast({
            title: 'Özel Liste',
            body: `Lista eliminada. ${eliminados} canal(es) removidos.`,
            type: 'info'
        })
    });

    bloqueAcciones.append(botonPin, botonUygula, botonEliminar);
    encabezado.append(bloqueInfo, bloqueAcciones);
    card.append(encabezado);
    return card;
}

const removeChannelsBySource = (fuente) => {
    if (!fuente || !channelsList) return 0;
    let eliminados = 0;

    Object.keys(channelsList).forEach(canalId => {
        if (channelsList[canalId]?.fuenteLista === fuente) {
            try {
                tele.remove?.(canalId);
            } catch (error) {
                console.warn(`[teles] Couldn't remove active channel ${canalId}:`, error);
            }
            delete channelsList[canalId];
            eliminados++;
        }
    });
    return eliminados;
}
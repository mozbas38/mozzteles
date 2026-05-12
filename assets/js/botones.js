import { getDefaultChannels, tele } from './main.js'
import {
    showToast,
    sortChannelButtonsAscending,
    sortChannelButtonsDescending,
    restoreOriginalChannelButtonsOrder,
    filterChannelsByInput,
    getActiveChannelIds,
} from './helpers/index.js'
import {
    AUDIO_STATIC,
    AUDIO_FAIL,
    AUDIO_SUCCESS,
    AUDIO_TURN_ON,
    LS_KEY_WELCOME_MODAL_VISIBILITY,
    CSS_CLASS_BUTTON_PRIMARY,
    ID_PREFIX_CONTAINERS_CHANNELS,
    LS_KEY_SAVED_CHANNELS_GRID_VIEW,
    AUDIO_TV_SHUTDOWN
} from './constants/index.js';
import { debounce, playAudio } from './utils/index.js';

// MARK: Button Welcome Modal
const buttonWelcomeModal = document.querySelector('#button-welcome-modal');
buttonWelcomeModal?.addEventListener('click', () => {
    localStorage.setItem(LS_KEY_WELCOME_MODAL_VISIBILITY, 'hide');
    playAudio(AUDIO_SUCCESS);
});





// MARK: Botones carga canales predeterminados
const cargarCanalesPredeterminados = () => {
    try {
        removeAllChannels(false);
        playAudio(AUDIO_TURN_ON);
        getDefaultChannels(isMobile?.any).forEach(canal => tele.add(canal));
    } catch (error) {
        showToast({
            title: 'Varsayılan kanallar yüklenirken hata oluştu',
            body: `Hata: ${error}`,
            type: 'danger',
            autohide: false,
            delay: 0,
            showReloadOnError: true
        });
        return
    }
};

export const BUTTON_MODAL_LOAD_DEFAULT_CHANNELS = document.querySelector('#boton-modal-cargar-canales-por-defecto');
export const BUTTON_OFFCANVAS_LOAD_DEFAULT_CHANNELS = document.querySelector('#boton-offcanvas-cargar-canales-por-defecto');

BUTTON_MODAL_LOAD_DEFAULT_CHANNELS?.addEventListener('click', cargarCanalesPredeterminados);
BUTTON_OFFCANVAS_LOAD_DEFAULT_CHANNELS?.addEventListener('click', cargarCanalesPredeterminados);

// MARK: Botones quitar
const removeAllChannels = (withAudio = true) => {
    try {
        if (withAudio) playAudio(AUDIO_TV_SHUTDOWN)
        getActiveChannelIds().forEach(channelId => {
            if (channelId) tele.remove(channelId);
        });
    } catch (error) {
        console.error(`[teles] Error at attempt to remove all channels: ${error}`);
        showToast({
            title: 'Tüm kanalları kaldırmaya çalışırken bir hata oluştu.',
            body: `Hata: ${error}`,
            type: 'danger',
            autohide: false,
            delay: 0,
            showReloadOnError: true
        });
        return
    }
};



export const BUTTON_MODAL_REMOVE_ALL_ACTIVE_CHANNELS = document.querySelector('#boton-modal-quitar-todo-canal-activo');
export const BUTTON_OFFCANVAS_REMOVE_ALL_ACTIVE_CHANNELS = document.querySelector('#boton-offcanvas-quitar-todo-canal-activo');

BUTTON_MODAL_REMOVE_ALL_ACTIVE_CHANNELS?.addEventListener('click', removeAllChannels);
BUTTON_OFFCANVAS_REMOVE_ALL_ACTIVE_CHANNELS?.addEventListener('click', removeAllChannels);

// MARK: Botón borrar localstorage
const BOTON_BORRAR_LOCALSTORAGE = document.querySelector('#boton-borrar-localstorage');
BOTON_BORRAR_LOCALSTORAGE?.addEventListener('click', () => {
    try {
        const safeRemoveAllChannels = () => {
            if (typeof removeAllChannels !== 'function') return;
            try { removeAllChannels(); } catch (error) { console.error('[teles] removeAllChannels failed:', error); }
        };

        const safeClearLocalStorage = () => {
            if (!window.localStorage) return;
            try { localStorage.clear(); } catch (error) { console.error('[teles] localStorage.clear failed:', error); }
        };

        const safePlayStatic = async () => {
            if (!AUDIO_STATIC) return;
            try {
                AUDIO_STATIC.volume = 0.8;
                AUDIO_STATIC.loop = true;
                await AUDIO_STATIC.play();
            } catch (error) {
                console.error('[teles] AUDIO_STATIC.play() reject:', error);
            }
        };
        safeRemoveAllChannels();
        safeClearLocalStorage();
        safePlayStatic();

        document.querySelector('#alerta-borrado-localstorage')?.classList.remove('d-none');
    } catch (error) {
        console.error('[teles] Error at attempt to clear local storage: ', error);
        showToast({
            title: 'Yerel depolama silinmeye çalışılırken hata oluştu',
            body: `Hata: ${error}`,
            type: 'danger',
            autohide: false,
            delay: 0,
            showReloadOnError: true
        });
        return
    }
});

// MARK: Botón fullscreen
function enterFullscreen() {
    const element = document.documentElement;
    try {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    } catch (error) {
        console.error('[teles] Error at attempt to enter fullscreen: ', error);
        showToast({
            title: 'Tam ekrana geçiş istenirken hata oluştu',
            body: `Hata: ${error}`,
            type: 'danger',
            autohide: false,
            delay: 0,
            showReloadOnError: true
        });
        return
    }
}


function exitFullscreen() {
    try {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    } catch (error) {
        console.error('[teles] Error at attempt to exit fullscreen: ', error);
        showToast({
            title: 'Tam ekrandan çıkış istenirken hata oluştu',
            body: `Hata: ${error}`,
            type: 'danger',
            autohide: false,
            delay: 0,
            showReloadOnError: true
        });
        return
    }
}

function isFullscreenSupported() {
    return !!(
        document.fullscreenEnabled
        || document.webkitFullscreenEnabled
        || document.mozFullScreenEnabled
        || document.msFullscreenEnabled
    );
}

function isFullscreen() {
    return isFullscreenSupported() && !!(
        document.fullscreenElement
        || document.webkitFullscreenElement
        || document.mozFullScreenElement
        || document.msFullscreenElement
        /* || window.innerHeight == screen.height */
    );
}

const BOTON_FULLSCREEN = document.querySelector('#boton-fullscreen');
BOTON_FULLSCREEN?.addEventListener('click', () => {
    isFullscreen() ? exitFullscreen() : enterFullscreen();
});

if (!isFullscreenSupported() && BOTON_FULLSCREEN?.parentElement?.parentElement) {
    BOTON_FULLSCREEN.parentElement.parentElement.classList.toggle('d-none');
}

function handleFullscreenChange() {
    if (!BOTON_FULLSCREEN) return;
    isFullscreen()
        ? (BOTON_FULLSCREEN.innerHTML = 'Tam ekrandan çık <i class="bi bi-fullscreen-exit ms-auto"></i>', BOTON_FULLSCREEN.classList.replace('btn-light-subtle', CSS_CLASS_BUTTON_PRIMARY))
        : (BOTON_FULLSCREEN.innerHTML = 'Tam ekrana geç <i class="bi bi-arrows-fullscreen ms-auto"></i>', BOTON_FULLSCREEN.classList.replace(CSS_CLASS_BUTTON_PRIMARY, 'btn-light-subtle'));
}

/* window.addEventListener('resize', handleFullscreenChange); */

document.addEventListener('keydown', (event) => {
    if (event.key === 'F11') {
        event.preventDefault();
        isFullscreen() ? exitFullscreen() : enterFullscreen();
    }
});

document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('MSFullscreenChange', handleFullscreenChange);



// Ordenar botones canales

// CACHE: Crear mapas de elementos DOM una sola vez al cargar
const sortButtonsCache = new Map();

// Inicializar cache para cada prefijo
function initSortButtonsCache(prefix) {
    if (sortButtonsCache.has(prefix)) return sortButtonsCache.get(prefix);

    const buttons = {
        'ascending': {
            input: document.getElementById(`${prefix}-btn-ascending-order`),
            label: null
        },
        'descending': {
            input: document.getElementById(`${prefix}-btn-descending-order`),
            label: null
        },
        'default': {
            input: document.getElementById(`${prefix}-btn-default-order`),
            label: null
        }
    };

    // Cachear también los labels
    Object.keys(buttons).forEach(key => {
        if (buttons[key].input) {
            buttons[key].label = document.querySelector(`label[for="${buttons[key].input.id}"]`);
        }
    });

    sortButtonsCache.set(prefix, buttons);
    return buttons;
}

// Versión optimizada de handleSortClick
const handleSortClick = (prefix, type, sortFn) => {
    const buttons = initSortButtonsCache(prefix);

    // 1. Actualizar estado visual de forma eficiente
    Object.entries(buttons).forEach(([key, { input, label }]) => {
        if (!input || !label) return;

        const isActive = key === type;

        if (isActive) {
            // Activar
            label.classList.remove('btn-outline-indigo');
            label.classList.add(CSS_CLASS_BUTTON_PRIMARY);
            input.checked = true;
        } else {
            // Desactivar
            label.classList.remove(CSS_CLASS_BUTTON_PRIMARY);
            label.classList.add('btn-outline-indigo');
            input.checked = false;
        }
    });

    // 2. Ejecutar ordenamiento en el siguiente frame (UN SOLO RAF)
    const containerId = `${prefix}-channels-buttons-container`;
    requestAnimationFrame(() => sortFn(containerId));
};

for (const PREFIJO of ID_PREFIX_CONTAINERS_CHANNELS) {
    document.querySelector(`#${PREFIJO}-btn-ascending-order`)?.addEventListener('click', () =>
        handleSortClick(PREFIJO, 'ascending', sortChannelButtonsAscending));

    document.querySelector(`#${PREFIJO}-btn-descending-order`)?.addEventListener('click', () =>
        handleSortClick(PREFIJO, 'descending', sortChannelButtonsDescending));

    document.querySelector(`#${PREFIJO}-btn-default-order`)?.addEventListener('click', () =>
        handleSortClick(PREFIJO, 'default', restoreOriginalChannelButtonsOrder));

    let bodyBotonesCanales = document.querySelector(`#${PREFIJO}-channels-buttons-container`)
    const inputFiltro = document.querySelector(`#${PREFIJO}-input-filtro`);
    if (!inputFiltro) continue;

    const filtrarCanalesPorInputDebounced = debounce((valor) => {
        inputFiltro.focus();
        filterChannelsByInput(valor, bodyBotonesCanales);
    }, 200);

    inputFiltro.addEventListener('input', (e) => {
        filtrarCanalesPorInputDebounced(e.target.value);
    });
}
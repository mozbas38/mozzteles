// Funciones para crear overlays y fragmentos de canal
import { getChannelById } from './channelManager.js';

import {
    COUNTRY_CODES,
    CATEGORIES_ICONS,
    AUDIO_POP,
    TWITCH_PARENT,
    LS_KEY_M3U8_PLAYER_CHOICE,
    LS_KEY_CHANNEL_SIGNAL_PREFERENCE,
    LS_KEY_ACTIVE_VIEW_MODE,
    CSS_CLASS_BUTTON_SECONDARY
} from './constants/index.js';
import {
    showToast,
    hideOverlayButtonText,
    registerManualChannelChange,
    cleanTransmissionResources
} from './helpers/index.js';
import { tele } from './main.js';
import {
    initializeBootstrapTooltips,
    disposeBootstrapTooltips,
    playAudio
} from './utils/index.js';

function guardarSeñalPreferida(canalId, señalUtilizar = '', indexSeñalUtilizar = 0) {
    let lsPreferenciasSeñalCanales = JSON.parse(localStorage.getItem(LS_KEY_CHANNEL_SIGNAL_PREFERENCE)) || {};
    lsPreferenciasSeñalCanales[canalId] = { [señalUtilizar]: indexSeñalUtilizar };
    localStorage.setItem(LS_KEY_CHANNEL_SIGNAL_PREFERENCE, JSON.stringify(lsPreferenciasSeñalCanales));
}

const shouldStartMuted = (viewMode = localStorage.getItem(LS_KEY_ACTIVE_VIEW_MODE) || 'grid-view') => {
    return viewMode !== 'single-view';
};

const setUrlParam = (url, param, value) => {
    if (!url) return url;
    try {
        const parsedUrl = new URL(url, window.location.href);
        parsedUrl.searchParams.set(param, value);
        return parsedUrl.toString();
    } catch {
        return url;
    }
};

const applyIframeMutePreference = (url, muted) => {
    if (!url) return url;
    const muteValue = muted ? '1' : '0';
    const mutedValue = muted ? 'true' : 'false';

    if (/youtube|youtu\.be|youtube-nocookie/i.test(url)) {
        return setUrlParam(url, 'mute', muteValue);
    }

    if (/player\.twitch\.tv/i.test(url)) {
        return setUrlParam(url, 'muted', mutedValue);
    }

    if (/[?&]mute=/.test(url)) {
        return setUrlParam(url, 'mute', muteValue);
    }

    if (/[?&]muted=/.test(url)) {
        return setUrlParam(url, 'muted', mutedValue);
    }

    return url;
};

const isValidSignalString = (value) => {
    return typeof value === 'string' && value.trim() !== '';
};

const createYouTubeLiveUrl = (id, startMuted) => {
    const cleanId = id.trim();
    if (cleanId.startsWith('UC')) {
        return `https://www.youtube-nocookie.com/embed/live_stream?channel=${encodeURIComponent(cleanId)}&autoplay=1&mute=${startMuted ? 1 : 0}&modestbranding=1&rel=0&origin=${window.location.origin}`;
    } else {
        return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(cleanId)}?autoplay=1&mute=${startMuted ? 1 : 0}&modestbranding=1&rel=0&origin=${window.location.origin}`;
    }
};

const createYouTubeVideoUrl = (videoId, startMuted) => {
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId.trim())}?autoplay=1&mute=${startMuted ? 1 : 0}&modestbranding=1&rel=0&origin=${window.location.origin}`;
};

export const setTransmissionMuted = (transmissionContainer, muted) => {
    if (!transmissionContainer) return;
    const changeContainer = transmissionContainer.querySelector('div[data-canal-cambio]');
    if (!changeContainer) return;

    changeContainer.querySelectorAll('video').forEach(video => {
        video.muted = muted;
        if (!muted) video.volume = 1;
    });

    try {
        if (changeContainer._videojsPlayer?.muted) {
            changeContainer._videojsPlayer.muted(muted);
            if (!muted && changeContainer._videojsPlayer.volume) {
                changeContainer._videojsPlayer.volume(1);
            }
        }
    } catch (error) {
        console.warn('[teles] Video.js mute state could not be updated:', error);
    }

    try {
        if (changeContainer._clapprPlayer?.setVolume) {
            changeContainer._clapprPlayer.setVolume(muted ? 0 : 100);
        }
        if (changeContainer._clapprPlayer?.core?.mediaControl?.setVolume) {
            changeContainer._clapprPlayer.core.mediaControl.setVolume(muted ? 0 : 100);
        }
    } catch (error) {
        console.warn('[teles] Clappr mute state could not be updated:', error);
    }

    try {
        if (changeContainer._oplayerPlayer?.volume) {
            changeContainer._oplayerPlayer.volume(muted ? 0 : 1);
        }
        if (changeContainer._oplayerPlayer?.muted) {
            changeContainer._oplayerPlayer.muted(muted);
        }
    } catch (error) {
        console.warn('[teles] OPlayer mute state could not be updated:', error);
    }
};

export function crearIframe(canalId, tipoSeñalParaIframe, valorIndex = 0, viewMode = 'grid-view') {
    valorIndex = Number(valorIndex)
    const startMuted = shouldStartMuted(viewMode);
    const DIV_ELEMENT = document.createElement('div');
    if (viewMode === 'free-view') {
        DIV_ELEMENT.classList.add('ratio', 'ratio-16x9', 'w-100', 'h-100');
    } else {
        DIV_ELEMENT.classList.add('ratio', 'ratio-16x9', 'h-100');
    }
    DIV_ELEMENT.setAttribute('data-canal-cambio', canalId);
    const { nombre, señales } = getChannelById(canalId);

    const URL_POR_TIPO_SEÑAL = {
        'iframe_url': señales.iframe_url && señales.iframe_url[valorIndex],
        'yt_id': isValidSignalString(señales.yt_id) && createYouTubeLiveUrl(señales.yt_id, startMuted),
        'yt_embed': señales.yt_embed && createYouTubeVideoUrl(señales.yt_embed, startMuted),
        'yt_playlist': señales.yt_playlist && `https://www.youtube-nocookie.com/embed/videoseries?list=${señales.yt_playlist}&autoplay=0&mute=${startMuted ? 1 : 0}&modestbranding=1&showinfo=0`,
        'twitch_id': señales.twitch_id && `https://player.twitch.tv/?channel=${señales.twitch_id}&parent=${TWITCH_PARENT}&muted=${startMuted ? 'true' : 'false'}`
    };

    const IFRAME_ELEMENT = document.createElement('iframe');
    IFRAME_ELEMENT.src = applyIframeMutePreference(URL_POR_TIPO_SEÑAL[tipoSeñalParaIframe], startMuted);
    IFRAME_ELEMENT.classList.add('pe-auto');
    IFRAME_ELEMENT.setAttribute('contenedor-canal-cambio', canalId);
    IFRAME_ELEMENT.setAttribute('width', '100%');
    IFRAME_ELEMENT.setAttribute('height', '100%');
    IFRAME_ELEMENT.setAttribute('frameborder', '0');
    IFRAME_ELEMENT.setAttribute('allowfullscreen', 'true');
    IFRAME_ELEMENT.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    IFRAME_ELEMENT.title = nombre;
    if (tipoSeñalParaIframe === 'yt_id' || tipoSeñalParaIframe === 'yt_embed' || tipoSeñalParaIframe === 'yt_playlist'
        || (tipoSeñalParaIframe === 'iframe_url' && URL_POR_TIPO_SEÑAL[tipoSeñalParaIframe]?.includes('youtube', 'youtu.be', 'youtube-nocookie'))) {
        IFRAME_ELEMENT.referrerPolicy = 'strict-origin-when-cross-origin';  // Debido a Error 153 con Youtube. Rompe otras señales iframe_url por eso lo filtramos antes.
    } else {
        IFRAME_ELEMENT.referrerPolicy = 'no-referrer';
    }

    // Almacenamos la instancia del iframe para usarla en el futuro para limpiar recursos
    DIV_ELEMENT._iframeElement = IFRAME_ELEMENT;
    DIV_ELEMENT.append(IFRAME_ELEMENT);
    return DIV_ELEMENT;
}


export function crearVideoJs(canalId, urlCarga, viewMode = 'grid-view') {
    const tipoReproductor = localStorage.getItem(LS_KEY_M3U8_PLAYER_CHOICE) || 'videojs';
    const startMuted = shouldStartMuted(viewMode);
    if (tipoReproductor === 'clappr' && typeof Clappr !== 'undefined') {
        const DIV_ELEMENT = document.createElement('div');
        DIV_ELEMENT.setAttribute('data-canal-cambio', canalId);

        if (viewMode === 'free-view') {
            DIV_ELEMENT.classList.add('ratio', 'ratio-16x9', 'w-100', 'h-100');
        } else {
            DIV_ELEMENT.classList.add('ratio', 'ratio-16x9', 'h-100');
        }


        const playerContainer = document.createElement('div');
        playerContainer.setAttribute('contenedor-canal-cambio', canalId);
        playerContainer.classList.add('position-absolute', 'p-0', 'w-100', 'h-100');
        DIV_ELEMENT.append(playerContainer);
        // Diferimos la inicialización para asegurar que el contenedor exista en el DOM
        setTimeout(() => {
            try {
                const clapprPlayer = new Clappr.Player({
                    source: urlCarga,
                    parent: playerContainer,
                    autoPlay: true,
                    mute: startMuted,
                    width: '100%',
                    height: '100%'
                });
                if (!startMuted && clapprPlayer.setVolume) {
                    clapprPlayer.setVolume(100);
                }
                // Almacenamos la instancia del reproductor para usarla en el futuro para limpiar recursos
                DIV_ELEMENT._clapprPlayer = clapprPlayer;
            } catch (error) {
                console.error(`[teles] Error at attempt to initialize Clappr for channel with id: ${canalId}. Error: ${error}`);
                showToast({
                    title: `Clappr başlatılırken hata oluştu (${canalId}). Video.js kullanılacak.`,
                    body: `Hata: ${error}`,
                    type: 'danger',
                    autohide: false,
                    delay: 0,
                    showReloadOnError: true
                });
            }
        }, 0);


        return DIV_ELEMENT;
    }
    if (tipoReproductor === 'shaka' && typeof shaka !== 'undefined') {
        const DIV_ELEMENT = document.createElement('div');
        DIV_ELEMENT.setAttribute('data-canal-cambio', canalId);
        if (viewMode === 'free-view') {
            DIV_ELEMENT.classList.add('ratio', 'ratio-16x9', 'w-100', 'h-100');
        } else {
            DIV_ELEMENT.classList.add('ratio', 'ratio-16x9', 'h-100');
        }
        const videoElement = document.createElement('video');
        videoElement.setAttribute('contenedor-canal-cambio', canalId);
        videoElement.classList.add('position-absolute', 'p-0', 'w-100', 'h-100');
        videoElement.autoplay = true;
        videoElement.muted = startMuted;
        videoElement.volume = startMuted ? 0 : 1;
        // La interfaz de Shaka manejará los controles
        videoElement.controls = false;
        DIV_ELEMENT.append(videoElement);

        setTimeout(async () => {
            try {
                shaka.polyfill.installAll();
                if (shaka.Player.isBrowserSupported()) {
                    const player = new shaka.Player(videoElement);

                    // Inicializar Shaka UI
                    const ui = new shaka.ui.Overlay(player, DIV_ELEMENT, videoElement);
                    const config = {
                        'controlPanelElements': ['play_pause', 'time_and_duration', 'spacer', 'mute', 'volume', 'fullscreen', 'overflow_menu'],
                        'addSeekBar': true,
                        'seekBarColors': {
                            'base': 'rgba(255, 255, 255, 0.3)',
                            'buffered': 'rgba(255, 255, 255, 0.5)',
                            'played': 'rgb(75, 1, 195)', // Indigo
                        }
                    };
                    ui.configure(config);

                    player.addEventListener('error', (event) => {
                        console.error('[teles] Shaka Player error:', event.detail);
                    });
                    videoElement.muted = startMuted;
                    videoElement.volume = startMuted ? 0 : 1;
                    await player.load(urlCarga);
                    DIV_ELEMENT._shakaPlayer = player;
                    DIV_ELEMENT._shakaUi = ui; // Guardamos la UI también por si es necesaria
                } else {
                    throw new Error('Browser not supported by Shaka Player');
                }
            } catch (error) {
                // Si el error es REQUEST_FAILED (1002), fallar silenciosamente en consola.
                const isShakaError1002 = error && (error.code === 1002 || (error.detail && error.detail.code === 1002));

                // Shaka Error 1001: No se puede reproducir el contenido.
                const isShakaError1001 = error && (error.code === 1001 || (error.detail && error.detail.code === 1001));

                console.error(`[teles] Error at attempt to initialize Shaka Player for channel with id: ${canalId}. Error:`, error);

                if (error) {
                    showToast({
                        title: `Shaka Player başlatılırken hata oluştu (${canalId}). 
                        ${isShakaError1001 ? 'İçerik oynatılamıyor, lütfen başka bir oynatıcı deneyin. (Sinyal inaktif olabilir)' : ''}
                        ${isShakaError1002 ? 'İçerik istenirken hata oluştu, lütfen tekrar deneyin. (Sinyal inaktif olabilir)' : ''}`,
                        body: `Hata: ${error.message || error}`,
                        type: 'warning',
                        delay: 10000,
                    });
                }
            }
        }, 0);

        return DIV_ELEMENT;
    }
    if (tipoReproductor === 'oplayer' && typeof OPlayer !== 'undefined') {
        const DIV_ELEMENT = document.createElement('div');
        DIV_ELEMENT.setAttribute('data-canal-cambio', canalId);
        if (viewMode === 'free-view') {
            DIV_ELEMENT.classList.add('ratio', 'ratio-16x9', 'w-100', 'h-100');
        } else {
            DIV_ELEMENT.classList.add('ratio', 'ratio-16x9', 'h-100');
        }
        const playerContainer = document.createElement('div');
        const oplayerId = `oplayer-${canalId}-${Date.now()}`;
        playerContainer.id = oplayerId;
        playerContainer.setAttribute('contenedor-canal-cambio', canalId);
        playerContainer.classList.add('position-absolute', 'p-0', 'w-100', 'h-100', 'overflow-hidden');
        DIV_ELEMENT.append(playerContainer);

        // Diferimos la inicialización de OPlayer para asegurar que el contenedor exista en el DOM
        setTimeout(() => {
            try {
                let instancia = OPlayer.make(`#${oplayerId}`, {
                    source: {
                        src: urlCarga,
                        title: canalId
                    },
                    autoplay: true,
                    muted: startMuted,
                    volume: startMuted ? 0 : 1
                });
                if (typeof OHls !== 'undefined') {
                    instancia = instancia.use([
                        OHls({
                            library: 'https://cdn.jsdelivr.net/npm/hls.js@0.14.17/dist/hls.min.js',
                            forceHLS: true
                        })
                    ]);
                }
                if (typeof OUI !== 'undefined') {
                    instancia = instancia.use([OUI()]);
                }
                instancia.create();
                // Almacenamos la instancia del reproductor para usarla en el futuro para limpiar recursos
                DIV_ELEMENT._oplayerPlayer = instancia;
            } catch (error) {
                console.error(`[teles] Error at attempt to initialize OPlayer for channel with id: ${canalId}. Error: ${error}`);
                showToast({
                    title: `OPlayer başlatılırken hata oluştu (${canalId}). Video.js kullanılacak.`,
                    body: `Hata: ${error}`,
                    type: 'danger',
                    autohide: false,
                    delay: 0,
                    showReloadOnError: true
                });
            }
        }, 0);


        return DIV_ELEMENT;
    }
    const DIV_ELEMENT = document.createElement('div');
    DIV_ELEMENT.setAttribute('data-canal-cambio', canalId);
    if (viewMode === 'free-view') {
        DIV_ELEMENT.classList.add('ratio', 'ratio-16x9', 'w-100', 'h-100');
    } else {
        DIV_ELEMENT.classList.add('ratio', 'ratio-16x9', 'h-100');
    }
    const videoElement = document.createElement('video');
    videoElement.setAttribute('contenedor-canal-cambio', canalId);

    if (viewMode === 'free-view') {
        videoElement.classList.add('position-absolute', 'p-0', 'video-js', 'vjs-16-9', 'vjs-fill', 'overflow-hidden');
    } else {
        videoElement.classList.add('position-absolute', 'p-0', 'video-js', 'vjs-fill', 'overflow-hidden');
    }
    videoElement.toggleAttribute('controls');
    videoElement.muted = startMuted;
    videoElement.volume = startMuted ? 0 : 1;
    DIV_ELEMENT.append(videoElement);
    try {
        const player = videojs(videoElement);
        player.src({
            src: urlCarga,
        });
        player.autoplay(true);
        player.muted(startMuted);
        player.volume(startMuted ? 0 : 1);
        // Almacenamos la instancia del reproductor para usarla en el futuro para limpiar recursos
        DIV_ELEMENT._videojsPlayer = player;
    } catch (error) {
        console.error(`[teles] Error at attempt to initialize Video.js for channel with id: ${canalId}. Error: ${error}`);
        showToast({
            title: `Video.js başlatılırken hata oluştu (${canalId}). Sıradaki kanala geçiliyor.`,
            body: `Hata: ${error}`,
            type: 'danger',
            autohide: false,
            delay: 0,
            showReloadOnError: true
        });
    }
    return DIV_ELEMENT;
}


export function crearOverlay(canalId) {
    try {
        const FRAGMENT_OVERLAY = document.createDocumentFragment();
        const DIV_ELEMENT = document.createElement('div');
        DIV_ELEMENT.id = `overlay-de-canal-${canalId}`;
        DIV_ELEMENT.classList.add('position-absolute', 'w-100', 'bg-transparent', 'me-1', 'd-flex', 'gap-2', 'justify-content-end', 'align-items-start', 'flex-wrap', 'top-0', 'end-0', 'barra-overlay');

        const BOTON_MOVER_CANAL = document.createElement('div');
        BOTON_MOVER_CANAL.id = 'overlay-boton-mover';
        BOTON_MOVER_CANAL.setAttribute('role', 'button');
        BOTON_MOVER_CANAL.setAttribute('title', 'Kanalı taşı');
        BOTON_MOVER_CANAL.setAttribute('data-bs-toggle', 'tooltip');
        BOTON_MOVER_CANAL.setAttribute('data-bs-title', 'Kanalı taşı');
        BOTON_MOVER_CANAL.innerHTML = '<i class="bi bi-arrows-move"></i>';
        BOTON_MOVER_CANAL.classList.add('btn', 'btn-sm', CSS_CLASS_BUTTON_SECONDARY, 'p-0', 'px-1', 'd-flex', 'gap-1', 'pe-auto', 'mt-1', 'rounded-3', 'clase-para-mover');

        const BOTON_QUITAR_CANAL = document.createElement('button');
        BOTON_QUITAR_CANAL.id = 'overlay-boton-quitar';
        BOTON_QUITAR_CANAL.setAttribute('aria-label', 'Kapat');
        BOTON_QUITAR_CANAL.setAttribute('type', 'button');
        BOTON_QUITAR_CANAL.setAttribute('title', 'Kanalı kapat');
        BOTON_QUITAR_CANAL.setAttribute('data-bs-toggle', 'tooltip');
        BOTON_QUITAR_CANAL.setAttribute('data-bs-title', 'Kanalı kapat');
        BOTON_QUITAR_CANAL.innerHTML = '<i class="bi bi-x-circle"></i>';
        BOTON_QUITAR_CANAL.classList.add('btn', 'btn-sm', 'btn-danger', 'p-0', 'px-1', 'd-flex', 'gap-1', 'pe-auto', 'mt-1', 'rounded-3');
        BOTON_QUITAR_CANAL.addEventListener('click', () => {
            tele.remove(canalId);
            playAudio(AUDIO_POP);
        });

        DIV_ELEMENT.append(BOTON_MOVER_CANAL);
        DIV_ELEMENT.append(BOTON_QUITAR_CANAL);
        FRAGMENT_OVERLAY.append(DIV_ELEMENT);
        return FRAGMENT_OVERLAY;
    } catch (error) {
        console.error(`[teles] Error at attempt to create overlay for channel with id: ${canalId}. Error: ${error}`);
        showToast({
            title: `Kanal (${canalId}) için katman oluşturulurken hata.`,
            body: `Hata: ${error}`,
            type: 'danger',
            autohide: false,
            delay: 0,
            showReloadOnError: true
        });
        return;
    }
}



export function crearFragmentCanal(canalId, viewMode = 'grid-view') {
    const canal = getChannelById(canalId);
    if (canal?.señales) {
        let { iframe_url = [], m3u8_url = [], yt_id = '', yt_embed = '', yt_playlist = '', twitch_id = '' } = canal.señales;
        let lsPreferenciasSeñalCanales = JSON.parse(localStorage.getItem(LS_KEY_CHANNEL_SIGNAL_PREFERENCE)) || {};

        let señalUtilizar;
        let valorIndexArraySeñal = 0;

        if (isValidSignalString(yt_id)) {
            señalUtilizar = 'yt_id';
        } else if (isValidSignalString(yt_embed)) {
            señalUtilizar = 'yt_embed';
        } else if (Array.isArray(m3u8_url) && m3u8_url.length > 0) {
            señalUtilizar = 'm3u8_url';
        } else if (Array.isArray(iframe_url) && iframe_url.length > 0) {
            señalUtilizar = 'iframe_url';
        } else if (isValidSignalString(yt_playlist)) {
            señalUtilizar = 'yt_playlist';
        } else if (isValidSignalString(twitch_id)) {
            señalUtilizar = 'twitch_id';
        }

        // LocalStorage'daki kullanıcı tercihi geçerli değilse temizle (Bozuk sinyal kayıtlarını önleme)
        if (lsPreferenciasSeñalCanales[canalId]) {
            const tipoPreferido = Object.keys(lsPreferenciasSeñalCanales[canalId])[0].toString();
            const indicePreferido = Number(Object.values(lsPreferenciasSeñalCanales[canalId]));
            const valorPreferido = canal.señales[tipoPreferido];

            let preferenciaValida = false;
            if (Array.isArray(valorPreferido)) {
                preferenciaValida = valorPreferido[indicePreferido] !== undefined && valorPreferido[indicePreferido] !== '';
            } else if (typeof valorPreferido === 'string') {
                preferenciaValida = valorPreferido.trim() !== '';
            }

            if (preferenciaValida) {
                señalUtilizar = tipoPreferido;
                valorIndexArraySeñal = indicePreferido;
            } else {
                // Sinyal artık geçerli değilse LocalStorage'dan sil ve varsayılan aktif sinyale dön
                delete lsPreferenciasSeñalCanales[canalId];
                localStorage.setItem(LS_KEY_CHANNEL_SIGNAL_PREFERENCE, JSON.stringify(lsPreferenciasSeñalCanales));
            }
        }

        const FRAGMENT_CANAL = document.createDocumentFragment();
        if (señalUtilizar === 'm3u8_url') {
            FRAGMENT_CANAL.append(
                crearVideoJs(canalId, m3u8_url[valorIndexArraySeñal], viewMode),
                crearOverlay(canalId)
            );
            return FRAGMENT_CANAL;
        } else {
            FRAGMENT_CANAL.append(
                crearIframe(canalId, señalUtilizar, valorIndexArraySeñal, viewMode),
                crearOverlay(canalId)
            );
            return FRAGMENT_CANAL;
        }
    } else {
        console.error(`[teles] Error at attempt to create fragment for channel with id: ${canalId}. Error: ${error}`);
        showToast({
            title: `Kanal (${canalId}) tanımlanmış bir sinyale sahip değil. Sıradaki kanala geçiliyor.`,
            body: `Hata: ${error}`,
            type: 'danger',
            autohide: false,
            delay: 0,
            showReloadOnError: true
        });
    }
}


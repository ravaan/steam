/**
 * Steam Gaming Dashboard
 * A minimal gaming activity dashboard displaying Steam profile data
 */
(function() {
    'use strict';

    // ===================
    // Configuration
    // ===================
    const CONFIG = {
        DEFAULT_STEAM_ID: '76561198123404228',
        CORS_PROXY: 'https://api.allorigins.win/raw?url=',
        REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
        TOAST_DURATION: 3000
    };

    // ===================
    // State
    // ===================
    const state = {
        steamId: null,
        theme: 'dark',
        soundEnabled: true,
        audioContext: null,
        refreshTimer: null,
        refreshCountdown: 300,
        helpBuffer: '',
        data: null
    };

    // ===================
    // DOM Elements
    // ===================
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);

    const elements = {
        themeToggle: null,
        soundToggle: null,
        avatar: null,
        username: null,
        statusText: null,
        statusIndicator: null,
        onlineStatus: null,
        totalHours: null,
        gamesCount: null,
        recentHours: null,
        gamesList: null,
        refreshTimer: null,
        refreshIndicator: null,
        helpOverlay: null,
        settingsOverlay: null,
        steamIdInput: null,
        toastContainer: null
    };

    // ===================
    // Initialization
    // ===================
    function init() {
        cacheElements();
        initSteamId();
        initTheme();
        initSound();
        bindEvents();
        fetchSteamData();
        startRefreshTimer();
    }

    function cacheElements() {
        elements.themeToggle = $('#themeToggle');
        elements.soundToggle = $('#soundToggle');
        elements.avatar = $('#avatar');
        elements.username = $('#username');
        elements.statusText = $('#statusText');
        elements.statusIndicator = $('#statusIndicator');
        elements.onlineStatus = $('#onlineStatus');
        elements.totalHours = $('#totalHours');
        elements.gamesCount = $('#gamesCount');
        elements.recentHours = $('#recentHours');
        elements.gamesList = $('#gamesList');
        elements.refreshTimer = $('#refreshTimer');
        elements.refreshIndicator = $('#refreshIndicator');
        elements.helpOverlay = $('#helpOverlay');
        elements.settingsOverlay = $('#settingsOverlay');
        elements.steamIdInput = $('#steamIdInput');
        elements.toastContainer = $('#toastContainer');
    }

    // ===================
    // Steam ID Management
    // ===================
    function initSteamId() {
        const urlParams = new URLSearchParams(window.location.search);
        state.steamId = urlParams.get('id') || CONFIG.DEFAULT_STEAM_ID;
        if (elements.steamIdInput) {
            elements.steamIdInput.value = state.steamId;
        }
    }

    function changeSteamId(newId) {
        if (!newId || newId.trim() === '') {
            showToast('Please enter a valid Steam ID', 'error');
            return;
        }

        newId = newId.trim();
        state.steamId = newId;

        // Update URL without reload
        const url = new URL(window.location);
        if (newId === CONFIG.DEFAULT_STEAM_ID) {
            url.searchParams.delete('id');
        } else {
            url.searchParams.set('id', newId);
        }
        window.history.pushState({}, '', url);

        // Refresh data
        fetchSteamData();
        showToast('Loading new profile...');
        closeAllOverlays();
    }

    // ===================
    // Theme Management
    // ===================
    function initTheme() {
        const saved = localStorage.getItem('steam-dashboard-theme');
        if (saved) {
            state.theme = saved;
        } else {
            // Check system preference
            if (window.matchMedia('(prefers-color-scheme: light)').matches) {
                state.theme = 'light';
            }
        }
        applyTheme();
    }

    function toggleTheme() {
        const themes = ['dark', 'light', 'steam'];
        const currentIndex = themes.indexOf(state.theme);
        state.theme = themes[(currentIndex + 1) % themes.length];

        localStorage.setItem('steam-dashboard-theme', state.theme);
        applyTheme();
        playSound('theme');

        const themeNames = { dark: 'Dark', light: 'Light', steam: 'Steam' };
        showToast(`Theme: ${themeNames[state.theme]}`);
    }

    function applyTheme() {
        document.documentElement.setAttribute('data-theme', state.theme);
        updateThemeIcon();
    }

    function updateThemeIcon() {
        const icon = elements.themeToggle.querySelector('.icon');
        icon.className = 'icon';

        switch(state.theme) {
            case 'dark':
                icon.classList.add('moon');
                break;
            case 'light':
                icon.classList.add('sun');
                break;
            case 'steam':
                icon.classList.add('steam');
                break;
        }
    }

    // ===================
    // Sound Management
    // ===================
    function initSound() {
        const saved = localStorage.getItem('steam-dashboard-sound');
        state.soundEnabled = saved !== 'false';
        updateSoundIcon();
    }

    function toggleSound() {
        state.soundEnabled = !state.soundEnabled;
        localStorage.setItem('steam-dashboard-sound', state.soundEnabled);
        updateSoundIcon();

        if (state.soundEnabled) {
            playSound('theme');
        }
        showToast(`Sound: ${state.soundEnabled ? 'On' : 'Off'}`);
    }

    function updateSoundIcon() {
        const icon = elements.soundToggle.querySelector('.icon');
        icon.className = 'icon';
        icon.classList.add(state.soundEnabled ? 'sound-on' : 'sound-off');
    }

    function initAudioContext() {
        if (!state.audioContext) {
            state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (state.audioContext.state === 'suspended') {
            state.audioContext.resume();
        }
    }

    function playSound(type) {
        if (!state.soundEnabled) return;

        try {
            initAudioContext();
            const ctx = state.audioContext;

            switch(type) {
                case 'theme':
                    playChime(ctx);
                    break;
                case 'refresh':
                    playWhoosh(ctx);
                    break;
                case 'error':
                    playError(ctx);
                    break;
            }
        } catch (e) {
            console.warn('Sound playback failed:', e);
        }
    }

    function playChime(ctx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
    }

    function playWhoosh(ctx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);

        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
    }

    function playError(ctx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(220, ctx.currentTime);

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
    }

    // ===================
    // Data Fetching
    // ===================
    async function fetchSteamData() {
        showLoading();

        const steamUrl = `https://steamcommunity.com/profiles/${state.steamId}/?xml=1`;
        const proxyUrl = CONFIG.CORS_PROXY + encodeURIComponent(steamUrl);

        try {
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Network error');

            const text = await response.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, 'text/xml');

            // Check for errors
            const error = xml.querySelector('error');
            if (error) {
                throw new Error(error.textContent || 'Profile not found');
            }

            const profile = parseProfileData(xml);
            state.data = profile;
            renderProfile(profile);
            playSound('refresh');

        } catch (error) {
            console.error('Fetch error:', error);
            showError(error.message);
            playSound('error');
        }
    }

    function parseProfileData(xml) {
        const getText = (selector) => {
            const el = xml.querySelector(selector);
            return el ? el.textContent : '';
        };

        const profile = {
            steamId64: getText('steamID64'),
            steamId: getText('steamID'),
            avatar: getText('avatarFull') || getText('avatarMedium') || getText('avatarIcon'),
            onlineState: getText('onlineState'),
            stateMessage: getText('stateMessage'),
            games: []
        };

        // Parse most played games
        const gameNodes = xml.querySelectorAll('mostPlayedGames mostPlayedGame');
        let totalHours = 0;
        let recentHours = 0;

        gameNodes.forEach(node => {
            const hoursPlayed = parseFloat(node.querySelector('hoursPlayed')?.textContent || '0');
            const hoursOnRecord = parseFloat(node.querySelector('hoursOnRecord')?.textContent || '0');

            profile.games.push({
                name: node.querySelector('gameName')?.textContent || 'Unknown Game',
                link: node.querySelector('gameLink')?.textContent || '#',
                icon: node.querySelector('gameIcon')?.textContent || '',
                hoursPlayed: hoursPlayed,
                hoursOnRecord: hoursOnRecord
            });

            totalHours += hoursOnRecord;
            recentHours += hoursPlayed;
        });

        profile.totalHours = totalHours;
        profile.recentHours = recentHours;
        profile.gamesCount = gameNodes.length;

        return profile;
    }

    // ===================
    // Rendering
    // ===================
    function showLoading() {
        elements.avatar.classList.add('loading');
        elements.avatar.src = '';
        elements.username.textContent = 'Loading...';
        elements.statusText.textContent = 'Fetching profile data...';
    }

    function renderProfile(profile) {
        // Avatar
        elements.avatar.classList.remove('loading');
        elements.avatar.src = profile.avatar;
        elements.avatar.alt = `${profile.steamId}'s avatar`;

        // Username
        elements.username.textContent = profile.steamId;
        document.title = `${profile.steamId} - Steam Dashboard`;

        // Status
        const isOnline = profile.onlineState === 'online';
        const isInGame = profile.onlineState === 'in-game';

        elements.statusText.textContent = profile.stateMessage || profile.onlineState;
        elements.statusIndicator.className = 'status-indicator';
        if (isInGame) {
            elements.statusIndicator.classList.add('in-game');
        } else if (isOnline) {
            elements.statusIndicator.classList.add('online');
        }

        // Stats
        elements.onlineStatus.textContent = capitalizeFirst(profile.onlineState) || '--';
        elements.totalHours.textContent = profile.totalHours > 0 ? formatNumber(profile.totalHours) : '--';
        elements.gamesCount.textContent = profile.gamesCount > 0 ? profile.gamesCount : '--';
        elements.recentHours.textContent = profile.recentHours > 0 ? profile.recentHours.toFixed(1) : '--';

        // Games list
        renderGamesList(profile.games);
    }

    function renderGamesList(games) {
        if (!games || games.length === 0) {
            elements.gamesList.innerHTML = '<div class="no-games">No recent games found</div>';
            return;
        }

        elements.gamesList.innerHTML = games.map(game => `
            <a href="${escapeHtml(game.link)}" target="_blank" rel="noopener" class="game-item">
                <img class="game-icon" src="${escapeHtml(game.icon)}" alt="${escapeHtml(game.name)}" loading="lazy">
                <div class="game-info">
                    <div class="game-name">${escapeHtml(game.name)}</div>
                    <div class="game-hours">
                        <span class="game-hours-value">${game.hoursPlayed.toFixed(1)}h</span> last 2 weeks
                        &middot; ${formatNumber(game.hoursOnRecord)}h total
                    </div>
                </div>
            </a>
        `).join('');
    }

    function showError(message) {
        elements.avatar.classList.remove('loading');
        elements.username.textContent = 'Error';
        elements.statusText.textContent = message;
        elements.onlineStatus.textContent = '--';
        elements.totalHours.textContent = '--';
        elements.gamesCount.textContent = '--';
        elements.recentHours.textContent = '--';
        elements.gamesList.innerHTML = `
            <div class="error-state">
                <h2>Could not load profile</h2>
                <p>${escapeHtml(message)}</p>
                <p>Make sure the Steam profile is public.</p>
            </div>
        `;
        showToast(message, 'error');
    }

    // ===================
    // Refresh Timer
    // ===================
    function startRefreshTimer() {
        state.refreshCountdown = 300;
        updateRefreshDisplay();

        if (state.refreshTimer) {
            clearInterval(state.refreshTimer);
        }

        state.refreshTimer = setInterval(() => {
            state.refreshCountdown--;
            updateRefreshDisplay();

            if (state.refreshCountdown <= 0) {
                fetchSteamData();
                state.refreshCountdown = 300;
            }
        }, 1000);
    }

    function updateRefreshDisplay() {
        const minutes = Math.floor(state.refreshCountdown / 60);
        const seconds = state.refreshCountdown % 60;
        elements.refreshTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    function manualRefresh() {
        fetchSteamData();
        state.refreshCountdown = 300;
        showToast('Refreshing...');
    }

    // ===================
    // Overlays
    // ===================
    function openHelp() {
        elements.helpOverlay.classList.add('active');
        elements.helpOverlay.querySelector('.overlay-close').focus();
    }

    function openSettings() {
        elements.steamIdInput.value = state.steamId;
        elements.settingsOverlay.classList.add('active');
        elements.steamIdInput.focus();
        elements.steamIdInput.select();
    }

    function closeAllOverlays() {
        elements.helpOverlay.classList.remove('active');
        elements.settingsOverlay.classList.remove('active');
    }

    // ===================
    // Toast Notifications
    // ===================
    function showToast(message, type = '') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        elements.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, CONFIG.TOAST_DURATION);
    }

    // ===================
    // Event Binding
    // ===================
    function bindEvents() {
        // Toggle buttons
        elements.themeToggle.addEventListener('click', toggleTheme);
        elements.soundToggle.addEventListener('click', toggleSound);

        // Help overlay
        $('#helpClose').addEventListener('click', closeAllOverlays);
        elements.helpOverlay.addEventListener('click', (e) => {
            if (e.target === elements.helpOverlay) closeAllOverlays();
        });

        // Settings overlay
        $('#settingsCancel').addEventListener('click', closeAllOverlays);
        $('#settingsApply').addEventListener('click', () => {
            changeSteamId(elements.steamIdInput.value);
        });
        elements.settingsOverlay.addEventListener('click', (e) => {
            if (e.target === elements.settingsOverlay) closeAllOverlays();
        });
        elements.steamIdInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                changeSteamId(elements.steamIdInput.value);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeydown);

        // Initialize audio context on first interaction
        document.addEventListener('click', initAudioContext, { once: true });
        document.addEventListener('keydown', initAudioContext, { once: true });
    }

    function handleKeydown(e) {
        // Don't trigger shortcuts when typing in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            if (e.key === 'Escape') {
                closeAllOverlays();
            }
            return;
        }

        // Track "help" typed
        if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
            state.helpBuffer += e.key.toLowerCase();
            if (state.helpBuffer.length > 4) {
                state.helpBuffer = state.helpBuffer.slice(-4);
            }
            if (state.helpBuffer === 'help') {
                openHelp();
                state.helpBuffer = '';
                return;
            }
        }

        switch(e.key.toLowerCase()) {
            case 't':
                toggleTheme();
                break;
            case 's':
                toggleSound();
                break;
            case 'r':
                manualRefresh();
                break;
            case 'i':
                openSettings();
                break;
            case '?':
                openHelp();
                break;
            case 'escape':
                closeAllOverlays();
                break;
        }
    }

    // ===================
    // Utilities
    // ===================
    function capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function formatNumber(num) {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return Math.round(num).toString();
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ===================
    // Start
    // ===================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

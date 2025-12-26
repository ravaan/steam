/**
 * Steam Gaming Dashboard
 * A minimal gaming activity dashboard with optional API support
 */
(function() {
    'use strict';

    // ===================
    // Configuration
    // ===================
    const CONFIG = {
        DEFAULT_STEAM_ID: '76561198123404228',
        CORS_PROXY: 'https://api.allorigins.win/raw?url=',
        REFRESH_INTERVAL: 5 * 60 * 1000,
        TOAST_DURATION: 3000,
        GAMES_PER_PAGE: 5,
        STEAM_API_BASE: 'https://api.steampowered.com',
        ACHIEVEMENT_PARALLEL: 10,   // Fetch 10 games in parallel
        ACHIEVEMENT_DELAY: 100      // 100ms delay between batches
    };

    // ===================
    // State
    // ===================
    const state = {
        steamId: null,
        apiKey: null,
        apiMode: false,
        theme: 'dark',
        soundEnabled: true,
        audioContext: null,
        refreshTimer: null,
        refreshCountdown: 300,
        helpBuffer: '',
        data: null,
        allGames: [],
        gamesExpanded: false,
        sortBy: 'alltime',
        apiFailCount: 0
    };

    // ===================
    // DOM Elements
    // ===================
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);

    const elements = {};

    // ===================
    // Initialization
    // ===================
    function init() {
        cacheElements();
        initSteamId();
        initApiKey();
        initTheme();
        initSound();
        bindEvents();
        fetchData();
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
        elements.avgHours = $('#avgHours');
        elements.mostPlayed = $('#mostPlayed');
        elements.gamesPlayed = $('#gamesPlayed');
        elements.unplayedGames = $('#unplayedGames');
        elements.completionRate = $('#completionRate');
        elements.accountValue = $('#accountValue');
        elements.totalAchievements = $('#totalAchievements');
        elements.perfectGames = $('#perfectGames');
        elements.avgCompletion = $('#avgCompletion');
        elements.extendedStats = $('#extendedStats');
        elements.profileStats = $('#profileStats');
        elements.steamLevel = $('#steamLevel');
        elements.totalXP = $('#totalXP');
        elements.badgeCount = $('#badgeCount');
        elements.friendCount = $('#friendCount');
        elements.modeBadge = $('#modeBadge');
        elements.modeBadgeText = $('.mode-badge-text');
        elements.loadingOverlay = $('#loadingOverlay');
        elements.loadingText = $('#loadingText');
        elements.gamesList = $('#gamesList');
        elements.showMoreBtn = $('#showMoreBtn');
        elements.sortDropdown = $('#sortDropdown');
        elements.sortDropdownBtn = $('#sortDropdownBtn');
        elements.sortValue = $('#sortValue');
        elements.sortMenu = $('#sortMenu');
        elements.refreshTimer = $('#refreshTimer');
        elements.helpOverlay = $('#helpOverlay');
        elements.settingsOverlay = $('#settingsOverlay');
        elements.apiKeyPrompt = $('#apiKeyPrompt');
        elements.steamIdInput = $('#steamIdInput');
        elements.apiKeyInput = $('#apiKeyInput');
        elements.settingsApplyBtn = $('#settingsApply');
        elements.toastContainer = $('#toastContainer');
    }

    // ===================
    // Steam ID Management
    // ===================
    function initSteamId() {
        const urlParams = new URLSearchParams(window.location.search);
        state.steamId = urlParams.get('id') || localStorage.getItem('steam-dashboard-id') || CONFIG.DEFAULT_STEAM_ID;
        if (elements.steamIdInput) {
            elements.steamIdInput.value = state.steamId;
        }
    }

    function changeSteamId(newId) {
        if (!newId || newId.trim() === '') {
            showToast('Please enter a valid Steam ID', 'error');
            return false;
        }

        newId = newId.trim();
        state.steamId = newId;
        localStorage.setItem('steam-dashboard-id', newId);

        // Update URL
        const url = new URL(window.location);
        if (newId === CONFIG.DEFAULT_STEAM_ID) {
            url.searchParams.delete('id');
        } else {
            url.searchParams.set('id', newId);
        }
        window.history.pushState({}, '', url);

        return true;
    }

    // ===================
    // API Key Management
    // ===================
    function initApiKey() {
        state.apiKey = localStorage.getItem('steam-dashboard-apikey') || null;
        state.apiMode = !!state.apiKey;
        updateApiModeUI();

        if (elements.apiKeyInput && state.apiKey) {
            elements.apiKeyInput.value = state.apiKey;
        }
    }

    function setApiKey(key) {
        if (key && key.trim()) {
            state.apiKey = key.trim();
            localStorage.setItem('steam-dashboard-apikey', state.apiKey);
            state.apiMode = true;
            state.apiFailCount = 0;
        } else {
            state.apiKey = null;
            localStorage.removeItem('steam-dashboard-apikey');
            state.apiMode = false;
        }
        updateApiModeUI();
    }

    function updateApiModeUI() {
        document.documentElement.setAttribute('data-api-mode', state.apiMode);

        // Update mode badge
        if (elements.modeBadgeText) {
            elements.modeBadgeText.textContent = state.apiMode ? 'API MODE' : 'BASIC';
        }

        // Show/hide API-only sections
        if (elements.extendedStats) {
            elements.extendedStats.classList.toggle('visible', state.apiMode);
        }
        if (elements.profileStats) {
            elements.profileStats.classList.toggle('visible', state.apiMode);
        }
    }

    // ===================
    // Data Fetching
    // ===================
    async function fetchData() {
        showLoadingOverlay('Loading profile...');

        if (state.apiMode && state.apiKey) {
            try {
                await fetchWithApi();
                // hideLoadingOverlay is called inside fetchWithApi after basic data loads
                return;
            } catch (error) {
                console.warn('API fetch failed, falling back to XML:', error);
                state.apiFailCount++;

                if (state.apiFailCount >= 2) {
                    hideLoadingOverlay();
                    showApiKeyPrompt();
                } else {
                    showToast('API error, using basic mode', 'error');
                }
            }
        }

        // Fallback to XML
        await fetchWithXml();
        hideLoadingOverlay();
    }

    function showLoadingOverlay(text) {
        if (elements.loadingOverlay) {
            elements.loadingOverlay.classList.add('active');
        }
        if (elements.loadingText) {
            elements.loadingText.textContent = text || 'Loading...';
        }
    }

    function hideLoadingOverlay() {
        if (elements.loadingOverlay) {
            elements.loadingOverlay.classList.remove('active');
        }
    }

    function updateLoadingText(text) {
        if (elements.loadingText) {
            elements.loadingText.textContent = text;
        }
    }

    async function fetchWithApi() {
        updateLoadingText('Fetching profile data...');

        // Fetch all basic data in parallel
        const ownedGamesUrl = `${CONFIG.STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/?key=${state.apiKey}&steamid=${state.steamId}&include_appinfo=1&include_played_free_games=1`;
        const playerUrl = `${CONFIG.STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${state.apiKey}&steamids=${state.steamId}`;
        const levelUrl = `${CONFIG.STEAM_API_BASE}/IPlayerService/GetSteamLevel/v1/?key=${state.apiKey}&steamid=${state.steamId}`;
        const badgesUrl = `${CONFIG.STEAM_API_BASE}/IPlayerService/GetBadges/v1/?key=${state.apiKey}&steamid=${state.steamId}`;
        const friendsUrl = `${CONFIG.STEAM_API_BASE}/ISteamUser/GetFriendList/v1/?key=${state.apiKey}&steamid=${state.steamId}&relationship=friend`;

        // Fetch all basic data in parallel
        const [ownedRes, playerRes, levelRes, badgesRes, friendsRes] = await Promise.all([
            fetch(CONFIG.CORS_PROXY + encodeURIComponent(ownedGamesUrl)),
            fetch(CONFIG.CORS_PROXY + encodeURIComponent(playerUrl)),
            fetch(CONFIG.CORS_PROXY + encodeURIComponent(levelUrl)).catch(() => null),
            fetch(CONFIG.CORS_PROXY + encodeURIComponent(badgesUrl)).catch(() => null),
            fetch(CONFIG.CORS_PROXY + encodeURIComponent(friendsUrl)).catch(() => null)
        ]);

        if (!ownedRes.ok || !playerRes.ok) {
            throw new Error('API request failed');
        }

        const [ownedData, playerData] = await Promise.all([
            ownedRes.json(),
            playerRes.json()
        ]);

        if (!ownedData.response || !playerData.response) {
            throw new Error('Invalid API response');
        }

        const player = playerData.response.players?.[0];
        if (!player) {
            throw new Error('Player not found');
        }

        // Parse extra data
        let extraData = { level: null, xp: null, badges: null, friends: null };
        try {
            if (levelRes?.ok) {
                const levelData = await levelRes.json();
                extraData.level = levelData.response?.player_level;
            }
        } catch (e) {}
        try {
            if (badgesRes?.ok) {
                const badgesData = await badgesRes.json();
                extraData.badges = badgesData.response?.badges?.length || 0;
                extraData.xp = badgesData.response?.player_xp || null;
            }
        } catch (e) {}
        try {
            if (friendsRes?.ok) {
                const friendsData = await friendsRes.json();
                extraData.friends = friendsData.friendslist?.friends?.length || 0;
            }
        } catch (e) {}

        const games = ownedData.response.games || [];

        // Calculate basic stats
        let totalMinutes = 0;
        let recentMinutes = 0;
        let playedGamesCount = 0;
        let unplayedGamesCount = 0;

        games.forEach(game => {
            totalMinutes += game.playtime_forever || 0;
            recentMinutes += game.playtime_2weeks || 0;
            if ((game.playtime_forever || 0) > 0) {
                playedGamesCount++;
            } else {
                unplayedGamesCount++;
            }
        });

        // Sort games by all-time playtime
        const sortedGames = [...games].sort((a, b) =>
            (b.playtime_forever || 0) - (a.playtime_forever || 0)
        );

        // Build initial games list (without achievements)
        state.allGames = sortedGames.map(game => ({
            appid: game.appid,
            name: game.name,
            icon: game.img_icon_url ?
                `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg` : '',
            hoursTotal: (game.playtime_forever || 0) / 60,
            hoursRecent: (game.playtime_2weeks || 0) / 60,
            link: `https://store.steampowered.com/app/${game.appid}`,
            achievements: null
        }));

        const completionRate = games.length > 0 ? (playedGamesCount / games.length) * 100 : 0;
        const accountValue = games.length * 10;

        // Build initial profile (without achievements)
        const profile = {
            steamId64: player.steamid,
            steamId: player.personaname,
            avatar: player.avatarfull || player.avatarmedium || player.avatar,
            onlineState: getOnlineState(player.personastate),
            stateMessage: player.gameextrainfo ? `Playing ${player.gameextrainfo}` : getStateMessage(player.personastate),
            totalGames: games.length,
            totalHours: totalMinutes / 60,
            recentHours: recentMinutes / 60,
            avgHours: games.length > 0 ? (totalMinutes / 60) / games.length : 0,
            mostPlayed: sortedGames[0]?.name || 'N/A',
            mostPlayedHours: sortedGames[0] ? (sortedGames[0].playtime_forever || 0) / 60 : 0,
            playedGames: playedGamesCount,
            unplayedGames: unplayedGamesCount,
            completionRate: completionRate,
            accountValue: accountValue,
            steamLevel: extraData.level,
            totalXP: extraData.xp,
            badgeCount: extraData.badges,
            friendCount: extraData.friends,
            // Achievement data (loading)
            totalAchievements: null,
            totalPossibleAchievements: null,
            perfectGames: null,
            gamesWithAchievements: null,
            avgAchievementCompletion: null
        };

        state.data = profile;

        // Render immediately with basic data
        renderProfile(profile, true);
        hideLoadingOverlay();
        playSound('refresh');

        // Fetch achievements in background
        fetchAchievementsInBackground(games);
    }

    async function fetchAchievementsInBackground(games) {
        const gamesWithPlaytime = games.filter(g => (g.playtime_forever || 0) > 0);
        const totalGames = gamesWithPlaytime.length;

        if (totalGames === 0) return;

        // Achievement stats accumulator
        let totalAchievements = 0;
        let totalPossible = 0;
        let perfectGames = 0;
        let gamesWithAchievements = 0;
        let processed = 0;

        // Show loading indicator for achievements
        showToast(`Loading achievements for ${totalGames} games...`);

        // Process in parallel batches
        for (let i = 0; i < totalGames; i += CONFIG.ACHIEVEMENT_PARALLEL) {
            const batch = gamesWithPlaytime.slice(i, i + CONFIG.ACHIEVEMENT_PARALLEL);

            // Fetch batch in parallel
            const batchPromises = batch.map(game => fetchGameAchievements(game.appid));
            const batchResults = await Promise.all(batchPromises);

            // Process results and update UI
            batchResults.forEach((achData, idx) => {
                const game = batch[idx];
                processed++;

                if (achData && achData.total > 0) {
                    totalAchievements += achData.achieved;
                    totalPossible += achData.total;
                    gamesWithAchievements++;

                    if (achData.achieved === achData.total) {
                        perfectGames++;
                    }

                    // Update game in state
                    const gameIndex = state.allGames.findIndex(g => g.appid === game.appid);
                    if (gameIndex !== -1) {
                        state.allGames[gameIndex].achievements = achData;
                    }
                }
            });

            // Update profile stats
            if (state.data) {
                state.data.totalAchievements = totalAchievements;
                state.data.totalPossibleAchievements = totalPossible;
                state.data.perfectGames = perfectGames;
                state.data.gamesWithAchievements = gamesWithAchievements;
                state.data.avgAchievementCompletion = gamesWithAchievements > 0
                    ? (totalAchievements / totalPossible) * 100
                    : 0;

                // Update achievement stats in UI
                updateAchievementStats();
            }

            // Re-render games list to show new achievement data
            renderGamesList();

            // Small delay between batches
            if (i + CONFIG.ACHIEVEMENT_PARALLEL < totalGames) {
                await sleep(CONFIG.ACHIEVEMENT_DELAY);
            }
        }

        showToast(`Achievements loaded: ${totalAchievements} unlocked`, 'success');
    }

    async function fetchGameAchievements(appid) {
        try {
            const url = `${CONFIG.STEAM_API_BASE}/ISteamUserStats/GetPlayerAchievements/v1/?appid=${appid}&key=${state.apiKey}&steamid=${state.steamId}`;
            const res = await fetch(CONFIG.CORS_PROXY + encodeURIComponent(url));

            if (!res.ok) return null;

            const data = await res.json();
            if (!data.playerstats || !data.playerstats.achievements) {
                return null;
            }

            const achievements = data.playerstats.achievements;
            const achieved = achievements.filter(a => a.achieved === 1).length;
            const total = achievements.length;

            return {
                achieved,
                total,
                percent: total > 0 ? Math.round((achieved / total) * 100) : 0
            };
        } catch (e) {
            return null;
        }
    }

    function updateAchievementStats() {
        const profile = state.data;
        if (!profile) return;

        if (elements.totalAchievements) {
            const achText = profile.totalAchievements != null
                ? `${formatNumber(profile.totalAchievements)} / ${formatNumber(profile.totalPossibleAchievements)}`
                : '--';
            elements.totalAchievements.textContent = achText;
        }
        if (elements.perfectGames) {
            elements.perfectGames.textContent = profile.perfectGames != null ? profile.perfectGames : '--';
        }
        if (elements.avgCompletion) {
            elements.avgCompletion.textContent = profile.avgAchievementCompletion != null
                ? profile.avgAchievementCompletion.toFixed(1) + '%'
                : '--';
        }
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function getOnlineState(state) {
        const states = ['offline', 'online', 'busy', 'away', 'snooze', 'looking-to-trade', 'looking-to-play'];
        return states[state] || 'offline';
    }

    function getStateMessage(state) {
        const messages = ['Offline', 'Online', 'Busy', 'Away', 'Snooze', 'Looking to Trade', 'Looking to Play'];
        return messages[state] || 'Offline';
    }

    async function fetchWithXml() {
        const steamUrl = `https://steamcommunity.com/profiles/${state.steamId}/?xml=1`;
        const proxyUrl = CONFIG.CORS_PROXY + encodeURIComponent(steamUrl);

        try {
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Network error');

            const text = await response.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, 'text/xml');

            const error = xml.querySelector('error');
            if (error) {
                throw new Error(error.textContent || 'Profile not found');
            }

            const profile = parseXmlProfile(xml);
            state.data = profile;
            state.allGames = profile.games || [];
            renderProfile(profile, false);
            playSound('refresh');

        } catch (error) {
            console.error('Fetch error:', error);
            showError(error.message);
            playSound('error');
        }
    }

    function parseXmlProfile(xml) {
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
            games: [],
            totalGames: 0,
            totalHours: 0,
            recentHours: 0
        };

        const gameNodes = xml.querySelectorAll('mostPlayedGames mostPlayedGame');
        let totalHours = 0;
        let recentHours = 0;

        gameNodes.forEach(node => {
            const hoursPlayed = parseFloat(node.querySelector('hoursPlayed')?.textContent || '0');
            const hoursOnRecord = parseFloat(node.querySelector('hoursOnRecord')?.textContent?.replace(',', '') || '0');

            profile.games.push({
                name: node.querySelector('gameName')?.textContent || 'Unknown Game',
                link: node.querySelector('gameLink')?.textContent || '#',
                icon: node.querySelector('gameIcon')?.textContent || '',
                hoursTotal: hoursOnRecord,
                hoursRecent: hoursPlayed
            });

            totalHours += hoursOnRecord;
            recentHours += hoursPlayed;
        });

        profile.totalGames = gameNodes.length;
        profile.totalHours = totalHours;
        profile.recentHours = recentHours;

        state.allGames = profile.games;

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

    function renderProfile(profile, isApiMode) {
        // Avatar
        elements.avatar.classList.remove('loading');
        elements.avatar.src = profile.avatar;
        elements.avatar.alt = `${profile.steamId}'s avatar`;

        // Username
        elements.username.textContent = profile.steamId;
        document.title = `${profile.steamId} - Steam Dashboard`;

        // Status
        const isOnline = profile.onlineState === 'online' || profile.onlineState === 'in-game';
        const isInGame = profile.onlineState === 'in-game' || profile.stateMessage?.startsWith('Playing');

        elements.statusText.textContent = profile.stateMessage || profile.onlineState;
        elements.statusIndicator.className = 'status-indicator';
        if (isInGame) {
            elements.statusIndicator.classList.add('in-game');
        } else if (isOnline) {
            elements.statusIndicator.classList.add('online');
        }

        // Main Stats
        elements.onlineStatus.textContent = capitalizeFirst(profile.onlineState) || '--';
        elements.gamesCount.textContent = profile.totalGames > 0 ? formatNumber(profile.totalGames) : '--';
        elements.totalHours.textContent = profile.totalHours > 0 ? formatNumber(Math.round(profile.totalHours)) : '--';
        elements.recentHours.textContent = profile.recentHours > 0 ? profile.recentHours.toFixed(1) : '--';

        // Profile Stats (API mode only - Level, XP, Badges, Friends)
        if (isApiMode) {
            if (elements.steamLevel) {
                elements.steamLevel.textContent = profile.steamLevel != null ? profile.steamLevel : '--';
            }
            if (elements.totalXP) {
                elements.totalXP.textContent = profile.totalXP != null ? formatNumber(profile.totalXP) : '--';
            }
            if (elements.badgeCount) {
                elements.badgeCount.textContent = profile.badgeCount != null ? formatNumber(profile.badgeCount) : '--';
            }
            if (elements.friendCount) {
                elements.friendCount.textContent = profile.friendCount != null ? formatNumber(profile.friendCount) : '--';
            }
            if (elements.profileStats) {
                elements.profileStats.classList.add('visible');
            }
        } else {
            if (elements.profileStats) {
                elements.profileStats.classList.remove('visible');
            }
        }

        // Extended Stats (API mode only)
        if (isApiMode && profile.avgHours !== undefined) {
            if (elements.avgHours) {
                elements.avgHours.textContent = profile.avgHours > 0 ? profile.avgHours.toFixed(1) + 'h' : '--';
            }
            if (elements.mostPlayed) {
                elements.mostPlayed.textContent = profile.mostPlayed || '--';
            }
            if (elements.gamesPlayed) {
                elements.gamesPlayed.textContent = profile.playedGames != null ? formatNumber(profile.playedGames) : '--';
            }
            if (elements.unplayedGames) {
                elements.unplayedGames.textContent = profile.unplayedGames != null ? formatNumber(profile.unplayedGames) : '--';
            }
            if (elements.completionRate) {
                elements.completionRate.textContent = profile.completionRate != null ? profile.completionRate.toFixed(1) + '%' : '--';
            }
            if (elements.accountValue) {
                elements.accountValue.textContent = profile.accountValue != null ? '$' + formatNumber(profile.accountValue) : '--';
            }
            // Achievement stats (show "Loading..." if null, which means background fetch in progress)
            if (elements.totalAchievements) {
                if (profile.totalAchievements != null) {
                    elements.totalAchievements.textContent = `${formatNumber(profile.totalAchievements)} / ${formatNumber(profile.totalPossibleAchievements)}`;
                } else {
                    elements.totalAchievements.innerHTML = '<span class="loading-text-inline">Loading...</span>';
                }
            }
            if (elements.perfectGames) {
                if (profile.perfectGames != null) {
                    elements.perfectGames.textContent = profile.perfectGames;
                } else {
                    elements.perfectGames.innerHTML = '<span class="loading-text-inline">Loading...</span>';
                }
            }
            if (elements.avgCompletion) {
                if (profile.avgAchievementCompletion != null) {
                    elements.avgCompletion.textContent = profile.avgAchievementCompletion.toFixed(1) + '%';
                } else {
                    elements.avgCompletion.innerHTML = '<span class="loading-text-inline">Loading...</span>';
                }
            }
            if (elements.extendedStats) {
                elements.extendedStats.classList.add('visible');
            }
        } else {
            if (elements.extendedStats) {
                elements.extendedStats.classList.remove('visible');
            }
        }

        // Games list
        renderGamesList();
    }

    function renderGamesList() {
        const games = getSortedGames();
        const displayCount = state.gamesExpanded ? games.length : CONFIG.GAMES_PER_PAGE;
        const gamesToShow = games.slice(0, displayCount);

        if (!gamesToShow || gamesToShow.length === 0) {
            elements.gamesList.innerHTML = '<div class="no-games">No games found</div>';
            elements.showMoreBtn.classList.remove('visible');
            return;
        }

        elements.gamesList.innerHTML = gamesToShow.map(game => {
            const achievementHtml = game.achievements
                ? `<div class="game-achievements ${game.achievements.percent === 100 ? 'perfect' : ''}">
                       <span class="ach-percent">${game.achievements.percent}%</span>
                       <span class="ach-count">${game.achievements.achieved}/${game.achievements.total}</span>
                   </div>`
                : '';

            // Determine what to show based on sort
            let hoursHtml;
            if (state.sortBy === 'recent') {
                hoursHtml = `<span class="game-hours-value">${game.hoursRecent?.toFixed(1) || 0}h</span> last 2 weeks`;
            } else if (state.sortBy === 'completion') {
                hoursHtml = `<span class="game-hours-value">${formatNumber(Math.round(game.hoursTotal || 0))}h</span> played`;
            } else {
                hoursHtml = `<span class="game-hours-value">${formatNumber(Math.round(game.hoursTotal || 0))}h</span> total`;
            }

            return `
                <a href="${escapeHtml(game.link)}" target="_blank" rel="noopener" class="game-item">
                    <img class="game-icon" src="${escapeHtml(game.icon)}" alt="${escapeHtml(game.name)}" loading="lazy" onerror="this.style.display='none'">
                    <div class="game-info">
                        <div class="game-name">${escapeHtml(game.name)}</div>
                        <div class="game-hours">${hoursHtml}</div>
                    </div>
                    ${achievementHtml}
                </a>
            `;
        }).join('');

        // Show/hide "show more" button
        if (games.length > CONFIG.GAMES_PER_PAGE) {
            elements.showMoreBtn.classList.add('visible');
            elements.showMoreBtn.textContent = state.gamesExpanded ?
                'Show less' : `Show ${games.length - CONFIG.GAMES_PER_PAGE} more`;
        } else {
            elements.showMoreBtn.classList.remove('visible');
        }
    }

    function getSortedGames() {
        if (!state.allGames || state.allGames.length === 0) return [];

        return [...state.allGames].sort((a, b) => {
            switch (state.sortBy) {
                case 'recent':
                    return (b.hoursRecent || 0) - (a.hoursRecent || 0);
                case 'completion':
                    const aPercent = a.achievements?.percent ?? -1;
                    const bPercent = b.achievements?.percent ?? -1;
                    return bPercent - aPercent;
                case 'name-asc':
                    return (a.name || '').localeCompare(b.name || '');
                case 'name-desc':
                    return (b.name || '').localeCompare(a.name || '');
                case 'alltime':
                default:
                    return (b.hoursTotal || 0) - (a.hoursTotal || 0);
            }
        });
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
    // Theme Management
    // ===================
    function initTheme() {
        const saved = localStorage.getItem('steam-dashboard-theme');
        if (saved) {
            state.theme = saved;
        } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
            state.theme = 'light';
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
            case 'dark': icon.classList.add('moon'); break;
            case 'light': icon.classList.add('sun'); break;
            case 'steam': icon.classList.add('steam'); break;
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

        if (state.soundEnabled) playSound('theme');
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
                case 'theme': playChime(ctx); break;
                case 'refresh': playWhoosh(ctx); break;
                case 'error': playError(ctx); break;
            }
        } catch (e) {
            console.warn('Sound playback failed:', e);
        }
    }

    function playChime(ctx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);

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
    // Refresh Timer
    // ===================
    function startRefreshTimer() {
        state.refreshCountdown = 300;
        updateRefreshDisplay();

        if (state.refreshTimer) clearInterval(state.refreshTimer);

        state.refreshTimer = setInterval(() => {
            state.refreshCountdown--;
            updateRefreshDisplay();

            if (state.refreshCountdown <= 0) {
                fetchData();
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
        fetchData();
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
        elements.apiKeyInput.value = state.apiKey || '';
        elements.settingsOverlay.classList.add('active');
        elements.steamIdInput.focus();
    }

    function showApiKeyPrompt() {
        elements.apiKeyPrompt.classList.add('active');
    }

    function closeAllOverlays() {
        elements.helpOverlay.classList.remove('active');
        elements.settingsOverlay.classList.remove('active');
        elements.apiKeyPrompt.classList.remove('active');
    }

    async function applySettings() {
        const newSteamId = elements.steamIdInput.value;
        const newApiKey = elements.apiKeyInput.value;

        // Show button loading state
        if (elements.settingsApplyBtn) {
            elements.settingsApplyBtn.classList.add('loading');
        }

        const idChanged = changeSteamId(newSteamId);
        const keyChanged = newApiKey !== state.apiKey;
        setApiKey(newApiKey);

        closeAllOverlays();

        if (idChanged || keyChanged) {
            await fetchData();
            showToast('Settings saved');
        }

        // Remove button loading state
        if (elements.settingsApplyBtn) {
            elements.settingsApplyBtn.classList.remove('loading');
        }
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
        $('#settingsApply').addEventListener('click', applySettings);
        elements.settingsOverlay.addEventListener('click', (e) => {
            if (e.target === elements.settingsOverlay) closeAllOverlays();
        });

        // API key prompt
        $('#apiPromptSkip').addEventListener('click', () => {
            setApiKey(null);
            closeAllOverlays();
            fetchData();
        });
        $('#apiPromptUpdate').addEventListener('click', () => {
            closeAllOverlays();
            openSettings();
        });

        // Sort dropdown
        elements.sortDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            elements.sortDropdown.classList.toggle('open');
        });

        elements.sortMenu.addEventListener('click', (e) => {
            if (e.target.classList.contains('sort-option')) {
                const sort = e.target.dataset.sort;
                if (sort && sort !== state.sortBy) {
                    state.sortBy = sort;
                    $$('.sort-option').forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');
                    elements.sortValue.textContent = e.target.textContent;
                    renderGamesList();
                }
                elements.sortDropdown.classList.remove('open');
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!elements.sortDropdown.contains(e.target)) {
                elements.sortDropdown.classList.remove('open');
            }
        });

        // Show more button
        elements.showMoreBtn.addEventListener('click', () => {
            state.gamesExpanded = !state.gamesExpanded;
            renderGamesList();
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
            if (e.key === 'Escape') closeAllOverlays();
            if (e.key === 'Enter' && elements.settingsOverlay.classList.contains('active')) {
                applySettings();
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
            case 't': toggleTheme(); break;
            case 's': toggleSound(); break;
            case 'r': manualRefresh(); break;
            case 'i': openSettings(); break;
            case '?': openHelp(); break;
            case 'escape': closeAllOverlays(); break;
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

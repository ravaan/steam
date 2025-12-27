/**
 * Steam Gaming Dashboard
 * A minimal gaming activity dashboard with optional API support
 */
(function() {
    'use strict';

    // ===================
    // Analytics (Mixpanel)
    // ===================
    const Analytics = {
        // Session tracking
        sessionStart: Date.now(),
        pageLoadTime: null,

        // Check if Mixpanel is available
        isAvailable() {
            return typeof mixpanel !== 'undefined' && mixpanel.track;
        },

        // Track an event with standard properties
        track(eventName, properties = {}) {
            if (!this.isAvailable()) return;

            const enrichedProps = {
                ...properties,
                // Add context
                session_duration_seconds: Math.floor((Date.now() - this.sessionStart) / 1000),
                api_mode: state.apiMode,
                theme: state.theme,
                sound_enabled: state.soundEnabled,
                steam_id_set: !!state.steamId && state.steamId !== CONFIG.DEFAULT_STEAM_ID,
                timestamp: new Date().toISOString()
            };

            mixpanel.track(eventName, enrichedProps);
        },

        // Identify user (using Steam ID hash for privacy)
        identify(steamId) {
            if (!this.isAvailable() || !steamId) return;

            // Hash the Steam ID for privacy
            const distinctId = this.hashString(steamId);
            mixpanel.identify(distinctId);

            // Set user profile properties
            mixpanel.people.set({
                'Steam ID Hash': distinctId,
                'API Mode': state.apiMode,
                'Theme Preference': state.theme,
                'Sound Enabled': state.soundEnabled,
                'Last Seen': new Date().toISOString()
            });
        },

        // Simple hash function for privacy
        hashString(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return 'user_' + Math.abs(hash).toString(36);
        },

        // Set super properties (attached to all events)
        setSuperProperties() {
            if (!this.isAvailable()) return;

            mixpanel.register({
                'Platform': navigator.platform,
                'Screen Width': window.screen.width,
                'Screen Height': window.screen.height,
                'Viewport Width': window.innerWidth,
                'Viewport Height': window.innerHeight,
                'Language': navigator.language,
                'Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
            });
        },

        // ==================
        // Event Tracking Methods
        // ==================

        // Page & Session Events
        trackPageView() {
            this.pageLoadTime = performance.now();
            this.track('Page Viewed', {
                referrer: document.referrer || 'direct',
                url_params: window.location.search ? 'yes' : 'no',
                has_steam_id_param: new URLSearchParams(window.location.search).has('id')
            });
        },

        trackSessionStart() {
            this.track('Session Started', {
                entry_type: document.referrer ? 'referral' : 'direct',
                has_saved_settings: !!(localStorage.getItem('steam-dashboard-id') || localStorage.getItem('steam-dashboard-apikey'))
            });
        },

        // Profile Loading Events
        trackProfileLoadStarted(mode) {
            if (this.isAvailable()) mixpanel.time_event('Profile Loaded');
            this.track('Profile Load Started', {
                load_mode: mode // 'api' or 'xml'
            });
        },

        trackProfileLoadCompleted(profile, mode, loadTimeMs) {
            this.track('Profile Loaded', {
                load_mode: mode,
                load_time_ms: Math.round(loadTimeMs),
                total_games: profile.totalGames || 0,
                total_hours: Math.round(profile.totalHours || 0),
                online_status: profile.onlineState,
                has_recent_activity: (profile.recentHours || 0) > 0,
                steam_level: profile.steamLevel || null,
                friend_count: profile.friendCount || null
            });

            // Update user profile with gaming stats
            if (this.isAvailable()) {
                mixpanel.people.set({
                    'Total Games': profile.totalGames || 0,
                    'Total Hours': Math.round(profile.totalHours || 0),
                    'Steam Level': profile.steamLevel || null,
                    'Last Profile Load': new Date().toISOString()
                });

                mixpanel.people.increment('Profile Loads');
            }
        },

        trackProfileLoadFailed(error, mode) {
            this.track('Profile Load Failed', {
                load_mode: mode,
                error_message: error.message || 'Unknown error',
                error_type: error.name || 'Error'
            });
        },

        // Achievement Events
        trackAchievementsFetchStarted(gameCount) {
            if (this.isAvailable()) mixpanel.time_event('Achievements Loaded');
            this.track('Achievements Fetch Started', {
                games_to_fetch: gameCount
            });
        },

        trackAchievementsLoaded(stats) {
            this.track('Achievements Loaded', {
                total_achievements: stats.totalAchievements,
                total_possible: stats.totalPossible,
                perfect_games: stats.perfectGames,
                games_with_achievements: stats.gamesWithAchievements,
                completion_rate: stats.avgCompletion ? stats.avgCompletion.toFixed(1) : null
            });
        },

        // User Interaction Events
        trackThemeChanged(newTheme, previousTheme) {
            this.track('Theme Changed', {
                new_theme: newTheme,
                previous_theme: previousTheme
            });

            if (this.isAvailable()) {
                mixpanel.people.set({ 'Theme Preference': newTheme });
            }
        },

        trackSoundToggled(enabled) {
            this.track('Sound Toggled', {
                sound_enabled: enabled
            });

            if (this.isAvailable()) {
                mixpanel.people.set({ 'Sound Enabled': enabled });
            }
        },

        trackSettingsOpened() {
            this.track('Settings Opened');
        },

        trackSettingsSaved(changes) {
            this.track('Settings Saved', {
                steam_id_changed: changes.steamIdChanged,
                api_key_added: changes.apiKeyAdded,
                api_key_removed: changes.apiKeyRemoved,
                api_key_changed: changes.apiKeyChanged
            });
        },

        trackApiModeChanged(enabled, reason) {
            this.track('API Mode Changed', {
                api_mode_enabled: enabled,
                change_reason: reason // 'user_enabled', 'user_disabled', 'key_invalid', 'key_expired'
            });

            if (this.isAvailable()) {
                mixpanel.people.set({ 'API Mode': enabled });
            }
        },

        // Game Interaction Events
        trackGameClicked(game) {
            this.track('Game Clicked', {
                game_name: game.name,
                game_hours: Math.round(game.hoursTotal || 0),
                has_achievements: !!game.achievements,
                achievement_percent: game.achievements?.percent || null,
                list_position: game.listPosition || null
            });
        },

        trackGamesSorted(sortBy) {
            this.track('Games Sorted', {
                sort_option: sortBy
            });
        },

        trackShowMoreClicked(expanded, totalGames) {
            this.track('Show More Clicked', {
                action: expanded ? 'expand' : 'collapse',
                total_games: totalGames
            });
        },

        // Navigation Events
        trackHelpOpened() {
            this.track('Help Opened');
        },

        trackKeyboardShortcutUsed(key, action) {
            this.track('Keyboard Shortcut Used', {
                key: key,
                action: action
            });
        },

        trackManualRefresh() {
            this.track('Manual Refresh Triggered');
        },

        trackAutoRefresh() {
            this.track('Auto Refresh Triggered');
        },

        // Error Events
        trackError(errorType, details) {
            this.track('Error Occurred', {
                error_type: errorType,
                error_details: details
            });
        },

        // Overlay Events
        trackOverlayClosed(overlayName, method) {
            this.track('Overlay Closed', {
                overlay_name: overlayName,
                close_method: method // 'button', 'escape', 'backdrop'
            });
        },

        // External Link Events
        trackExternalLinkClicked(linkType, url) {
            this.track('External Link Clicked', {
                link_type: linkType, // 'steamid_io', 'steam_dev', 'steam_store'
                destination_url: url
            });
        }
    };

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
        apiFailCount: 0,
        // Loading state management
        isLoading: false,
        achievementFetchId: 0,  // Used to cancel stale achievement fetches
        isFetchingAchievements: false
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

        // Initialize analytics
        Analytics.setSuperProperties();
        Analytics.trackPageView();
        Analytics.trackSessionStart();
        Analytics.identify(state.steamId);

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
        // Prevent concurrent fetches
        if (state.isLoading) {
            console.log('Fetch already in progress, skipping');
            return;
        }

        state.isLoading = true;
        // Cancel any ongoing achievement fetch
        state.achievementFetchId++;
        const fetchStartTime = performance.now();

        showLoadingOverlay('Loading profile...');

        try {
            if (state.apiMode && state.apiKey) {
                Analytics.trackProfileLoadStarted('api');
                try {
                    await fetchWithApi();
                    // hideLoadingOverlay is called inside fetchWithApi after basic data loads
                    return;
                } catch (error) {
                    console.warn('API fetch failed, falling back to XML:', error);
                    state.apiFailCount++;
                    Analytics.trackProfileLoadFailed(error, 'api');

                    if (state.apiFailCount >= 2) {
                        hideLoadingOverlay();
                        showApiKeyPrompt();
                        Analytics.trackApiModeChanged(false, 'key_invalid');
                        return;
                    } else {
                        showToast('API error, using basic mode', 'error');
                    }
                }
            }

            // Fallback to XML
            Analytics.trackProfileLoadStarted('xml');
            await fetchWithXml();
            hideLoadingOverlay();
        } catch (error) {
            console.error('Fetch failed:', error);
            hideLoadingOverlay();
            showError('Failed to load profile data');
            Analytics.trackProfileLoadFailed(error, state.apiMode ? 'api' : 'xml');
        } finally {
            state.isLoading = false;
        }
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

        // Fetch all basic data in parallel (with timeout)
        const [ownedRes, playerRes, levelRes, badgesRes, friendsRes] = await Promise.all([
            fetchWithTimeout(CONFIG.CORS_PROXY + encodeURIComponent(ownedGamesUrl), 20000),
            fetchWithTimeout(CONFIG.CORS_PROXY + encodeURIComponent(playerUrl), 20000),
            fetchWithTimeout(CONFIG.CORS_PROXY + encodeURIComponent(levelUrl), 10000).catch(() => null),
            fetchWithTimeout(CONFIG.CORS_PROXY + encodeURIComponent(badgesUrl), 10000).catch(() => null),
            fetchWithTimeout(CONFIG.CORS_PROXY + encodeURIComponent(friendsUrl), 10000).catch(() => null)
        ]);

        if (!ownedRes || !ownedRes.ok || !playerRes || !playerRes.ok) {
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
        state.isLoading = false;
        playSound('refresh');

        // Track profile load completion
        const loadTime = performance.now() - (Analytics.pageLoadTime || 0);
        Analytics.trackProfileLoadCompleted(profile, 'api', loadTime);

        // Fetch achievements in background (pass current fetchId to detect stale fetches)
        fetchAchievementsInBackground(games, state.achievementFetchId);
    }

    async function fetchAchievementsInBackground(games, fetchId) {
        const gamesWithPlaytime = games.filter(g => (g.playtime_forever || 0) > 0);
        const totalGames = gamesWithPlaytime.length;

        if (totalGames === 0) {
            // No games to fetch, mark achievements as complete with zeros
            if (state.data && fetchId === state.achievementFetchId) {
                state.data.totalAchievements = 0;
                state.data.totalPossibleAchievements = 0;
                state.data.perfectGames = 0;
                state.data.gamesWithAchievements = 0;
                state.data.avgAchievementCompletion = 0;
                updateAchievementStats();
            }
            return;
        }

        // Prevent multiple concurrent achievement fetches
        if (state.isFetchingAchievements) {
            console.log('Achievement fetch already in progress');
            return;
        }

        state.isFetchingAchievements = true;

        // Achievement stats accumulator
        let totalAchievements = 0;
        let totalPossible = 0;
        let perfectGames = 0;
        let gamesWithAchievements = 0;

        // Show loading indicator for achievements
        showToast(`Loading achievements for ${totalGames} games...`);
        Analytics.trackAchievementsFetchStarted(totalGames);

        try {
            // Process in parallel batches
            for (let i = 0; i < totalGames; i += CONFIG.ACHIEVEMENT_PARALLEL) {
                // Check if this fetch was cancelled (new fetch started)
                if (fetchId !== state.achievementFetchId) {
                    console.log('Achievement fetch cancelled (stale)');
                    return;
                }

                const batch = gamesWithPlaytime.slice(i, i + CONFIG.ACHIEVEMENT_PARALLEL);

                // Fetch batch in parallel
                const batchPromises = batch.map(game => fetchGameAchievements(game.appid));
                const batchResults = await Promise.all(batchPromises);

                // Check again after async operation
                if (fetchId !== state.achievementFetchId) {
                    console.log('Achievement fetch cancelled (stale)');
                    return;
                }

                // Process results and update UI
                batchResults.forEach((achData, idx) => {
                    const game = batch[idx];

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

            // Only show completion toast if this fetch wasn't cancelled
            if (fetchId === state.achievementFetchId) {
                showToast(`Achievements loaded: ${totalAchievements} unlocked`, 'success');
                Analytics.trackAchievementsLoaded({
                    totalAchievements,
                    totalPossible,
                    perfectGames,
                    gamesWithAchievements,
                    avgCompletion: gamesWithAchievements > 0 ? (totalAchievements / totalPossible) * 100 : 0
                });
            }
        } catch (error) {
            console.error('Error fetching achievements:', error);
            if (fetchId === state.achievementFetchId) {
                showToast('Failed to load some achievements', 'error');
                Analytics.trackError('achievements_fetch_failed', error.message);
            }
        } finally {
            if (fetchId === state.achievementFetchId) {
                state.isFetchingAchievements = false;
            }
        }
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

    // Fetch with timeout to prevent hanging requests
    async function fetchWithTimeout(url, timeoutMs = 15000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
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
            const response = await fetchWithTimeout(proxyUrl, 20000);
            if (!response.ok) throw new Error('Network error');

            const text = await response.text();

            // Check for empty response
            if (!text || text.trim() === '') {
                throw new Error('Empty response from Steam');
            }

            const parser = new DOMParser();
            const xml = parser.parseFromString(text, 'text/xml');

            // Check for XML parse errors
            const parseError = xml.querySelector('parsererror');
            if (parseError) {
                throw new Error('Invalid response format');
            }

            const error = xml.querySelector('error');
            if (error) {
                throw new Error(error.textContent || 'Profile not found');
            }

            const profile = parseXmlProfile(xml);
            state.data = profile;
            state.allGames = profile.games || [];
            renderProfile(profile, false);
            playSound('refresh');

            // Track profile load completion
            const loadTime = performance.now() - (Analytics.pageLoadTime || 0);
            Analytics.trackProfileLoadCompleted(profile, 'xml', loadTime);

        } catch (error) {
            console.error('Fetch error:', error);
            showError(error.message || 'Failed to load profile');
            playSound('error');
            Analytics.trackProfileLoadFailed(error, 'xml');
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
        // Avatar with error handling
        elements.avatar.classList.remove('loading');
        elements.avatar.alt = `${profile.steamId}'s avatar`;
        elements.avatar.onerror = () => {
            // Fallback to a default avatar if loading fails
            elements.avatar.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23333" width="100" height="100"/><text x="50" y="60" text-anchor="middle" fill="%23666" font-size="40">?</text></svg>';
        };
        elements.avatar.src = profile.avatar || '';

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
                <a href="${escapeHtml(game.link)}" target="_blank" rel="noopener" class="game-item" data-game-index="${index}">
                    <img class="game-icon" src="${escapeHtml(game.icon)}" alt="${escapeHtml(game.name)}" loading="lazy" onerror="this.style.display='none'">
                    <div class="game-info">
                        <div class="game-name">${escapeHtml(game.name)}</div>
                        <div class="game-hours">${hoursHtml}</div>
                    </div>
                    ${achievementHtml}
                </a>
            `;
        }).join('');

        // Add click tracking to game links
        elements.gamesList.querySelectorAll('.game-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                const game = gamesToShow[index];
                if (game) {
                    Analytics.trackGameClicked({
                        ...game,
                        listPosition: index + 1
                    });
                }
            });
        });

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
        const previousTheme = state.theme;
        state.theme = themes[(currentIndex + 1) % themes.length];

        localStorage.setItem('steam-dashboard-theme', state.theme);
        applyTheme();
        playSound('theme');

        // Analytics
        Analytics.trackThemeChanged(state.theme, previousTheme);

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

        // Analytics
        Analytics.trackSoundToggled(state.soundEnabled);

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
                Analytics.trackAutoRefresh();
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
        Analytics.trackManualRefresh();
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
        Analytics.trackHelpOpened();
    }

    function openSettings() {
        elements.steamIdInput.value = state.steamId;
        elements.apiKeyInput.value = state.apiKey || '';
        elements.settingsOverlay.classList.add('active');
        elements.steamIdInput.focus();
        Analytics.trackSettingsOpened();
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
        const oldApiKey = state.apiKey;

        // Show button loading state
        if (elements.settingsApplyBtn) {
            elements.settingsApplyBtn.classList.add('loading');
        }

        try {
            const idChanged = changeSteamId(newSteamId);
            const keyChanged = newApiKey !== state.apiKey;
            setApiKey(newApiKey);

            // Analytics for settings changes
            Analytics.trackSettingsSaved({
                steamIdChanged: idChanged,
                apiKeyAdded: !oldApiKey && !!newApiKey,
                apiKeyRemoved: !!oldApiKey && !newApiKey,
                apiKeyChanged: keyChanged && !!oldApiKey && !!newApiKey
            });

            // Re-identify user if Steam ID changed
            if (idChanged) {
                Analytics.identify(state.steamId);
            }

            closeAllOverlays();

            if (idChanged || keyChanged) {
                await fetchData();
                showToast('Settings saved');
            }
        } catch (error) {
            console.error('Failed to apply settings:', error);
            showToast('Failed to save settings', 'error');
            Analytics.trackError('settings_save_failed', error.message);
        } finally {
            // Always remove button loading state
            if (elements.settingsApplyBtn) {
                elements.settingsApplyBtn.classList.remove('loading');
            }
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
                    Analytics.trackGamesSorted(sort);
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
            Analytics.trackShowMoreClicked(state.gamesExpanded, state.allGames.length);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeydown);

        // Initialize audio context on first interaction
        document.addEventListener('click', initAudioContext, { once: true });
        document.addEventListener('keydown', initAudioContext, { once: true });

        // Track external link clicks
        document.querySelectorAll('a[target="_blank"]').forEach(link => {
            link.addEventListener('click', () => {
                const href = link.href;
                let linkType = 'other';
                if (href.includes('steamid.io')) linkType = 'steamid_io';
                else if (href.includes('steamcommunity.com/dev')) linkType = 'steam_dev';
                else if (href.includes('store.steampowered.com')) linkType = 'steam_store';

                Analytics.trackExternalLinkClicked(linkType, href);
            });
        });
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
            case 't':
                Analytics.trackKeyboardShortcutUsed('t', 'toggle_theme');
                toggleTheme();
                break;
            case 's':
                Analytics.trackKeyboardShortcutUsed('s', 'toggle_sound');
                toggleSound();
                break;
            case 'r':
                Analytics.trackKeyboardShortcutUsed('r', 'manual_refresh');
                manualRefresh();
                break;
            case 'i':
                Analytics.trackKeyboardShortcutUsed('i', 'open_settings');
                openSettings();
                break;
            case '?':
                Analytics.trackKeyboardShortcutUsed('?', 'open_help');
                openHelp();
                break;
            case 'escape':
                Analytics.trackKeyboardShortcutUsed('escape', 'close_overlay');
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

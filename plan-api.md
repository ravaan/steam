# Steam API Integration Plan

## Overview
Add optional Steam Web API key support for enhanced stats while maintaining the current XML-based approach as fallback.

---

## Approved Decisions

| Question | Decision |
|----------|----------|
| API Key Storage | localStorage (client-side only) |
| Games Display | Expandable - show 5, click to show more |
| Stats | Pull as many as possible |
| API Indicator | Different accent color when API enabled |
| Games Sorting | Toggle between all-time and recent |
| Error Handling | Toast + silent fallback, then prompt to re-enter if persistent |

---

## Data Available from Steam Web API

### With API Key:

| Endpoint | Data Available |
|----------|----------------|
| `GetOwnedGames` | Full game library, playtime_forever (all-time hours per game), playtime_2weeks |
| `GetPlayerSummaries` | Profile info, avatar, status, last logoff time |
| `GetRecentlyPlayedGames` | Last 2 weeks games with hours |
| `GetPlayerAchievements` | Per-game achievements (optional) |
| `GetUserStatsForGame` | Detailed game stats (optional) |

### Key Stats We Can Show:
- **Total Games Owned** (full library count)
- **All-Time Hours** (sum of playtime_forever across all games)
- **Hours Last 2 Weeks** (already have)
- **Top Games by Hours** (sorted by playtime_forever)
- **Games Per Category** (if we want to categorize)

### What's NOT Available:
- **Daily/Weekly breakdown** - Steam API does NOT provide historical time-series data
- **Play sessions** - No session-level data
- **When games were played** - Only total hours, no timestamps
- **Graphs over time** - Not possible without external tracking

---

## Proposed UI Changes

### New Stats Grid (with API):
```
┌─────────────────┬─────────────────┐
│     STATUS      │   TOTAL GAMES   │
│     Online      │      247        │
├─────────────────┼─────────────────┤
│  ALL-TIME HOURS │  HOURS (2 WKS)  │
│     1,847       │      12.5       │
└─────────────────┴─────────────────┘
```

### Enhanced Games List:
- Show top 10 games by all-time hours (not just recent)
- Include games not played recently but with high hours
- Sort options: by all-time hours, by recent hours

### API Key Settings:
- New section in settings modal (press `I`)
- Input for API key
- Store in localStorage (client-side only)
- "Get API Key" link to Steam developer page
- Clear/remove key option

---

## Technical Implementation

### Phase 1: API Key Management
- [ ] Add API key input to settings overlay
- [ ] Store API key in localStorage
- [ ] Validate API key format
- [ ] Show status indicator (API enabled/disabled)

### Phase 2: API Data Fetching
- [ ] Create fetch function for GetOwnedGames
- [ ] Create fetch function for GetPlayerSummaries
- [ ] Handle CORS via proxy (same as XML)
- [ ] Fallback to XML if API fails or no key

### Phase 3: Enhanced Stats Display
- [ ] Update stats grid with new metrics
- [ ] Show total games owned count
- [ ] Calculate and show all-time hours sum
- [ ] Update games list to show top by all-time hours

### Phase 4: UI Enhancements
- [ ] Add indicator showing "API Mode" vs "Basic Mode"
- [ ] Improve games list with sorting
- [ ] Add "View All Games" option (show more than 3)

---

## Questions for Approval

### 1. API Key Storage
Store API key in localStorage (stays on user's device, never sent to any server except Steam). Is this acceptable?

### 2. Games Display
How many games to show in the list?
- **A)** Top 5 games
- **B)** Top 10 games
- **C)** Expandable (show 5, click to show more)

### 3. Stats Priority
Which stats are most important to display prominently?
- Total Games Owned
- All-Time Hours (sum)
- Average Hours Per Game
- Most Played Game
- Hours This Week (if we calculate from 2-week data)

### 4. Visual Indicator
Show a small badge/indicator when API key is active?
- **A)** Small "API" badge near profile
- **B)** Different color accent when API enabled
- **C)** No indicator needed

### 5. Games Sorting
Default sort for games list:
- **A)** By all-time hours (highest first)
- **B)** By recent hours (last 2 weeks)
- **C)** Toggle between both

### 6. Error Handling
If API key is invalid or API fails:
- **A)** Show error toast and fall back to XML silently
- **B)** Show persistent warning that API mode is unavailable
- **C)** Prompt user to check/re-enter key

---

## Limitations to Note

1. **No historical graphs possible** - Steam doesn't provide time-series data
2. **API rate limits** - Steam has rate limiting (but generous for personal use)
3. **API key is personal** - Each user needs their own key
4. **Some data requires game-specific calls** - Achievements need per-game requests

---

## File Changes Required

| File | Changes |
|------|---------|
| `index.html` | Add API key input to settings, update stats grid |
| `styles.css` | Style for API badge, expanded games list |
| `app.js` | API fetching logic, key management, enhanced rendering |
| `README.md` | Document API key setup instructions |

---

## Estimated Effort
- Phase 1: API Key Management - 30 mins
- Phase 2: API Fetching - 45 mins
- Phase 3: Enhanced Stats - 30 mins
- Phase 4: UI Polish - 30 mins

Total: ~2-2.5 hours

---

## API Endpoints Reference

```
Base URL: https://api.steampowered.com

GetOwnedGames:
GET /IPlayerService/GetOwnedGames/v1/
?key={API_KEY}
&steamid={STEAM_ID}
&include_appinfo=1
&include_played_free_games=1

GetPlayerSummaries:
GET /ISteamUser/GetPlayerSummaries/v2/
?key={API_KEY}
&steamids={STEAM_ID}

GetRecentlyPlayedGames:
GET /IPlayerService/GetRecentlyPlayedGames/v1/
?key={API_KEY}
&steamid={STEAM_ID}
```

---

## Ready for Implementation?

Please answer the questions above (especially 2-6) and I'll proceed with building.

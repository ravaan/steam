# Steam Gaming Dashboard - Implementation Plan

## Project Overview
A minimal gaming activity dashboard displaying Steam profile data, styled with Steam-inspired design elements. Pure HTML/CSS/JS with no build step.

**Default Steam ID:** `76561198123404228`
**Custom ID Support:** Via URL parameter `?id=STEAM_ID` or keyboard shortcut `I`

---

## Profile ID Configuration

### How it works:
1. **Default:** Uses `76561198123404228` if no custom ID provided
2. **URL Parameter:** `index.html?id=76561198123404228` - loads that profile
3. **Keyboard Shortcut:** Press `I` to open settings modal and enter custom Steam ID
4. **Shareable:** Users can share their dashboard URL with their ID in the parameter

### Implementation:
```javascript
const DEFAULT_STEAM_ID = '76561198123404228';
const steamId = new URLSearchParams(window.location.search).get('id') || DEFAULT_STEAM_ID;
```

---

## Task Breakdown

### Phase 1: Project Setup
- [x] Task 1.1: Initialize git repository
- [ ] Task 1.2: Create file structure (index.html, styles.css, app.js)
- [ ] Task 1.3: Add .gitignore and LICENSE files
- [ ] Task 1.4: Set up GitHub Actions workflow for deployment

### Phase 2: Core HTML Structure
- [ ] Task 2.1: Create HTML skeleton with semantic elements
- [ ] Task 2.2: Add header with playful title "While [username] is gaming..."
- [ ] Task 2.3: Create card grid layout for stats
- [ ] Task 2.4: Add profile ID settings modal
- [ ] Task 2.5: Add footer with "Press ? for help" hint
- [ ] Task 2.6: Add toast notification container

### Phase 3: CSS Styling & Theming
- [ ] Task 3.1: Define CSS variables for all three themes (dark, light, steam)
- [ ] Task 3.2: Style base elements (body, typography, selection)
- [ ] Task 3.3: Style header and profile section
- [ ] Task 3.4: Style stat cards with Steam-inspired gradients
- [ ] Task 3.5: Style toggle buttons (theme, sound) with CSS icons
- [ ] Task 3.6: Style settings modal for custom Steam ID
- [ ] Task 3.7: Style toast notifications
- [ ] Task 3.8: Add responsive breakpoints for mobile
- [ ] Task 3.9: Add smooth transitions and animations

### Phase 4: JavaScript - Core Functionality
- [ ] Task 4.1: Set up IIFE structure and state management
- [ ] Task 4.2: Implement Steam ID parsing (URL param → default)
- [ ] Task 4.3: Implement Steam data fetching (with CORS proxy)
- [ ] Task 4.4: Parse XML response and extract profile data
- [ ] Task 4.5: Render profile info to DOM
- [ ] Task 4.6: Render game stats (recent games, total hours sum)
- [ ] Task 4.7: Add loading states and error handling
- [ ] Task 4.8: Implement auto-refresh every 5 minutes with indicator

### Phase 5: Profile ID Settings
- [ ] Task 5.1: Implement settings modal toggle (keyboard `I`)
- [ ] Task 5.2: Handle custom Steam ID input
- [ ] Task 5.3: Update URL without page reload (history.pushState)
- [ ] Task 5.4: Reload data with new Steam ID

### Phase 6: Theme System
- [ ] Task 6.1: Implement theme toggle logic (dark → light → steam → dark)
- [ ] Task 6.2: Detect system preference on first load
- [ ] Task 6.3: Persist theme choice in localStorage
- [ ] Task 6.4: Add icon rotation/fade animation on toggle

### Phase 7: Sound System
- [ ] Task 7.1: Set up Web Audio API context (on first interaction)
- [ ] Task 7.2: Create sound functions (chime, whoosh, error tone)
- [ ] Task 7.3: Implement sound toggle with localStorage persistence
- [ ] Task 7.4: Connect sounds to theme change, refresh, errors

### Phase 8: Keyboard Shortcuts & Toast
- [ ] Task 8.1: Implement keyboard event listeners (T, S, R, I, ?, Esc)
- [ ] Task 8.2: Add toast notification system
- [ ] Task 8.3: Create help toast/modal showing all shortcuts
- [ ] Task 8.4: Implement "help" typed detection

### Phase 9: Polish & Accessibility
- [ ] Task 9.1: Add ARIA labels and roles
- [ ] Task 9.2: Test keyboard navigation
- [ ] Task 9.3: Add user-select restrictions where needed
- [ ] Task 9.4: Performance optimization (under 100KB)

### Phase 10: Documentation & Deployment
- [ ] Task 10.1: Update README.md with full documentation
- [ ] Task 10.2: Test GitHub Pages deployment
- [ ] Task 10.3: Final testing across browsers

---

## Technical Decisions

### Profile ID Configuration
- Default ID: `76561198123404228`
- URL param: `?id=STEAM_ID` takes priority
- Press `I` to open settings modal
- Updates URL for shareability

### CORS Solution
Using `https://api.allorigins.win/raw?url=` as CORS proxy for Steam XML feed.

### Icons
CSS-only icons using borders, transforms, and pseudo-elements.

### Theme Cycle
Dark (default) → Light → Steam Brand → Dark

### Data Extraction from XML
```
- steamID64: /profile/steamID64
- steamID: /profile/steamID (display name)
- avatarFull: /profile/avatarFull
- onlineState: /profile/onlineState
- stateMessage: /profile/stateMessage
- mostPlayedGames: /profile/mostPlayedGames/mostPlayedGame[]
  - gameName, gameLink, gameIcon, hoursPlayed, hoursOnRecord
- Total hours: Sum of hoursOnRecord from all games
```

### Sound Design (Web Audio API)
- Theme change: 440Hz sine wave, 150ms, fade out
- Refresh: White noise filtered, 100ms, quick sweep
- Error: 220Hz square wave, 200ms

---

## File Structure
```
steam/
├── index.html          # Main HTML file
├── styles.css          # All styles with CSS variables
├── app.js              # All JS in single IIFE
├── README.md           # Documentation
├── LICENSE             # MIT License
├── plan.md             # This file
├── .gitignore          # Git ignore rules
└── .github/
    └── workflows/
        └── deploy.yml  # GitHub Pages deployment
```

---

## Keyboard Shortcuts Reference
| Key    | Action                   |
|--------|--------------------------|
| T      | Toggle theme             |
| S      | Toggle sound             |
| R      | Refresh Steam data       |
| I      | Open Steam ID settings   |
| ?      | Show help overlay        |
| Esc    | Close modal/overlay      |
| "help" | Show help overlay        |

---

## Footer Design
```
Made with ♥ while gaming  ·  Press ? for help
```

---

## URL Examples
```
# Default profile (yours)
https://ravaan.github.io/steam/

# Custom profile
https://ravaan.github.io/steam/?id=76561198012345678

# Local testing
file:///path/to/index.html?id=76561198012345678
```

---

## Commit Strategy
Each task completion = 1 commit with descriptive message following pattern:
`feat:`, `fix:`, `style:`, `docs:`, `chore:`

---

## Testing Checklist
- [ ] Opens correctly via file:// protocol
- [ ] Default Steam ID loads correctly
- [ ] URL parameter `?id=` works
- [ ] Press `I` opens settings modal
- [ ] URL updates when ID changes (shareable)
- [ ] Data loads from Steam via CORS proxy
- [ ] All three themes work correctly
- [ ] Sound toggle works (after first interaction)
- [ ] All keyboard shortcuts function
- [ ] Help overlay shows on `?` press
- [ ] Footer shows "Press ? for help"
- [ ] Toast notifications appear/dismiss
- [ ] Auto-refresh works every 5 minutes
- [ ] Mobile responsive (320px - 1920px)
- [ ] GitHub Pages deployment works

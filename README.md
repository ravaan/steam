# Steam Gaming Dashboard

A minimal, Steam-inspired gaming activity dashboard that displays your Steam profile data. Built with pure HTML, CSS, and JavaScript - no build step required.

![Dashboard Preview](https://img.shields.io/badge/status-live-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

### Basic Mode (No API Key)
- Profile info: Avatar, username, online status
- Recent games with playtime (last 2 weeks)
- Basic stats from public profile

### API Mode (With API Key)
- **All-time stats**: Total games owned, lifetime hours across entire library
- **Full game library**: See all your games sorted by playtime
- **Extended stats**: Average hours per game, most played game
- **Purple accent**: Visual indicator when API mode is active

## Live Demo

Visit: `https://ravaan.github.io/steam/`

View a different profile: `https://ravaan.github.io/steam/?id=YOUR_STEAM64_ID`

## Quick Start

No build step required! Just open the file:

```bash
git clone https://github.com/ravaan/steam.git
cd steam
open index.html
```

## Enabling API Mode (Recommended)

For full stats including all-time hours and complete game library:

### 1. Get a Steam API Key (Free)
1. Go to [Steam Web API Key](https://steamcommunity.com/dev/apikey)
2. Log in with your Steam account
3. Enter any domain name (e.g., `localhost`)
4. Copy your API key

### 2. Add Key to Dashboard
1. Press `I` to open Settings
2. Paste your API key in the "API Key" field
3. Click Save

Your API key is stored locally in your browser and never sent anywhere except Steam's servers.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `T` | Toggle theme (Dark → Light → Steam) |
| `S` | Toggle sound effects |
| `R` | Refresh Steam data |
| `I` | Open Settings |
| `?` | Show help overlay |
| `Esc` | Close overlay |
| Type `help` | Show help overlay |

## Games List Features

- **Sort toggle**: Switch between "All-Time" and "Recent" hours
- **Expandable**: Shows 5 games by default, click "Show more" for full list
- **Click to open**: Each game links to its Steam store page

## Custom Steam Profile

### Via URL Parameter
```
https://ravaan.github.io/steam/?id=76561198012345678
```

### Via Settings Modal
1. Press `I` to open settings
2. Enter the Steam64 ID
3. Click Save

### Finding Your Steam64 ID
1. Visit [steamid.io](https://steamid.io)
2. Enter your Steam profile URL
3. Copy the `steamID64` value

## Steam Privacy Requirements

For the dashboard to work, the Steam profile must be **public**:

1. Open Steam → Profile → Edit Profile → Privacy Settings
2. Set "My profile" to **Public**
3. Set "Game details" to **Public**

## Themes

| Theme | Description |
|-------|-------------|
| **Dark** | True black background, white accents |
| **Light** | Clean white background, dark text |
| **Steam** | Official Steam brand colors (blue accents) |

When API mode is active, accents change to purple across all themes.

## Deploying to GitHub Pages

### 1. Enable GitHub Pages
1. Go to repository **Settings** → **Pages**
2. Under "Build and deployment", select **GitHub Actions**
3. The workflow will auto-deploy on push to `main`

### 2. Configure Environment
1. Go to **Settings** → **Environments** → **github-pages**
2. Under "Deployment branches", add `main` or select "All branches"

Your site will be live at: `https://YOUR_USERNAME.github.io/steam/`

## Technical Details

- **No frameworks**: Pure HTML, CSS, JavaScript
- **No build step**: Works by opening index.html
- **Hybrid data**: XML fallback when no API key
- **CORS Proxy**: Uses allorigins.win for API access
- **Web Audio API**: Synthesized sounds (no audio files)
- **localStorage**: Persists settings, theme, sound, API key
- **CSS Variables**: Easy theming with custom properties
- **< 100KB total**: Lightweight and fast

## Data Sources

| Mode | Source | Data Available |
|------|--------|----------------|
| Basic | Steam XML Feed | Recent games, limited stats |
| API | Steam Web API | Full library, all-time hours, complete stats |

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## Project Structure

```
steam/
├── index.html          # Main HTML structure
├── styles.css          # CSS with 3 themes + API mode
├── app.js              # All JavaScript logic
├── README.md           # This file
├── LICENSE             # MIT License
├── plan.md             # Project planning
├── plan-api.md         # API integration plan
├── .gitignore          # Git ignore rules
└── .github/
    └── workflows/
        └── deploy.yml  # GitHub Pages deployment
```

## License

MIT License - see [LICENSE](LICENSE) file.

## Credits

Made with love while gaming.

---

**Steam** and the Steam logo are trademarks of Valve Corporation. This project is not affiliated with Valve.

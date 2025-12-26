# Steam Gaming Dashboard

A minimal, Steam-inspired gaming activity dashboard that displays your Steam profile data. Built with pure HTML, CSS, and JavaScript - no build step required.

![Dashboard Preview](https://img.shields.io/badge/status-live-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Profile Display**: Avatar, username, online status
- **Gaming Stats**: Total hours, games count, recent playtime
- **Recently Played**: List of games with hours and icons
- **3 Themes**: Dark (default), Light, Steam Brand
- **Sound Effects**: Pleasant audio feedback using Web Audio API
- **Auto-Refresh**: Updates every 5 minutes with countdown timer
- **Keyboard Shortcuts**: Full keyboard navigation support
- **Custom Profile**: View any public Steam profile via URL parameter
- **Mobile Responsive**: Works on all screen sizes

## Live Demo

Visit: `https://ravaan.github.io/steam/`

View a different profile: `https://ravaan.github.io/steam/?id=YOUR_STEAM64_ID`

## Local Setup

No build step required! Just open the file:

```bash
# Clone the repository
git clone https://github.com/ravaan/steam.git
cd steam

# Open in browser
open index.html
# or
xdg-open index.html  # Linux
# or
start index.html     # Windows
```

**Note**: Due to CORS, the dashboard uses a proxy service ([allorigins](https://allorigins.win/)) to fetch Steam data.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `T` | Toggle theme (Dark → Light → Steam) |
| `S` | Toggle sound effects |
| `R` | Refresh Steam data |
| `I` | Open Steam ID settings |
| `?` | Show help overlay |
| `Esc` | Close overlay |
| Type `help` | Show help overlay |

## Custom Steam Profile

### Via URL Parameter
```
https://ravaan.github.io/steam/?id=76561198012345678
```

### Via Settings Modal
1. Press `I` to open settings
2. Enter the Steam64 ID
3. Click Apply

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

### Dark (Default)
Classic dark theme with Steam-inspired colors.

### Light
Clean white/gray theme for daytime use.

### Steam Brand
Official Steam brand colors (#1b2838 background, #66c0f4 accents).

## Deploying to GitHub Pages

### 1. Enable GitHub Pages
1. Go to your repository Settings
2. Navigate to **Pages** in the sidebar
3. Under "Build and deployment", select **GitHub Actions** as the source
4. The workflow will automatically deploy on push to `main`

### 2. Verify Deployment
After pushing to `main`, check the **Actions** tab to see the deployment progress.

Your site will be live at: `https://YOUR_USERNAME.github.io/steam/`

## Project Structure

```
steam/
├── index.html          # Main HTML structure
├── styles.css          # CSS with 3 themes
├── app.js              # All JavaScript logic
├── README.md           # This file
├── LICENSE             # MIT License
├── plan.md             # Project planning document
├── .gitignore          # Git ignore rules
└── .github/
    └── workflows/
        └── deploy.yml  # GitHub Pages deployment
```

## Technical Details

- **No frameworks**: Pure HTML, CSS, JavaScript
- **No build step**: Works by opening index.html
- **CORS Proxy**: Uses allorigins.win for Steam API access
- **Web Audio API**: Synthesized sounds (no audio files)
- **localStorage**: Persists theme and sound preferences
- **CSS Variables**: Easy theming with custom properties
- **< 100KB total**: Lightweight and fast

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## License

MIT License - see [LICENSE](LICENSE) file.

## Credits

Made with love while gaming.

---

**Steam** and the Steam logo are trademarks of Valve Corporation. This project is not affiliated with Valve.


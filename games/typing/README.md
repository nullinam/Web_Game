# Typing Game

**Master non-Latin keyboard layouts through retro arcade-style typing games.**

A free, offline-first typing game designed to help you learn and practice typing in Korean Hangul, Russian and Ukrainian Cyrillic, Japanese Kana, Chinese Bopomofo, Arabic, Hebrew, and more. Perfect for language learners, polyglots, and anyone wanting to expand their keyboard skills beyond QWERTY.

---

## Why Typing Game?

- **14 Keyboard Layouts** - Learn Korean, Russian, Ukrainian, Japanese, Chinese, Arabic, Hebrew, Turkish, and more
- **100% Free & Open Source** - No subscriptions, no ads, no tracking
- **Retro Arcade Aesthetic** - Nostalgic 8-bit gaming experience
- **Offline-First** - Works completely offline as a PWA
- **Visual Learning** - Color-coded finger mapping and hand visualization
- **Real-Time Feedback** - WPM tracking, accuracy metrics, and immediate corrections
- **Local Leaderboards** - Track your progress with arcade-style high scores

---

## Features

### Keyboard Layouts (14 Languages)
- **English** (QWERTY)
- **Spanish** (Español - QWERTY with Ñ)
- **French** (Français - AZERTY)
- **German** (Deutsch - QWERTZ)
- **Italian** (Italiano)
- **Portuguese** (Português - ABNT2, accents as dead keys)
- **Turkish** (Türkçe Q)
- **Russian** (Русский - JCUKEN)
- **Ukrainian** (Українська)
- **Arabic** (العربية - RTL layout)
- **Hebrew** (עברית - RTL layout)
- **Korean** (한국어 - Hangul 2-Set)
- **Japanese** (日本語 - JIS Kana input)
- **Chinese** (中文 - Bopomofo)

### Learning Tools
- **Finger Mapping** - Visual guide showing which finger types each key
- **Hand Visualization** - Toggle hand display on/off during gameplay
- **Color-Coded Keys** - Each finger assigned a unique color
- **Real-Time WPM** - Words per minute tracking
- **Accuracy Metrics** - Track your typing precision
- **Score System** - Arcade-style points for correct typing

### Game Modes
- **Free Practice** - Type common words in your chosen language
- **Leaderboard** - Compete with yourself and track personal bests
- **Manual/Tutorial** - Learn keyboard layouts and finger positions

### Interface
- **Multilingual UI** - Interface available in English, Spanish, French, German, Italian, Portuguese, Russian, Korean, Japanese, Chinese, Arabic and Hebrew
- **Retro Design** - Classic arcade terminal aesthetic with cyan/slate color scheme
- **Responsive** - Works on desktop, tablets and phones (tap the on-screen keyboard, or click it with a mouse)

---

## Getting Started

### Run Locally

**Prerequisites**: Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to http://localhost:3000/

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready to be deployed to any static hosting service. `npm run build` type-checks first; `npm run typecheck` runs the check on its own.

### Multiplayer (optional)

Multiplayer duels are peer-to-peer over WebRTC ([y-webrtc](https://github.com/yjs/y-webrtc)). Players only need a signaling server to find each other; no game data goes through it, and signaling traffic is encrypted with the room code.

The old public y-webrtc signaling servers have been shut down, so you need to run your own and point the build at it:

```bash
# Run a signaling server (any host that supports WebSockets)
PORT=4444 node node_modules/y-webrtc/bin/server.js

# Build against it (comma-separate several servers)
VITE_SIGNALING_URLS=wss://signaling.example.org npm run build
```

For the GitHub Pages deploy, set a repository variable named `VITE_SIGNALING_URLS` (Settings → Secrets and variables → Actions → Variables). When it is empty the multiplayer button is hidden.

The host picks the layout and lesson level; everyone in the room gets the same words. Friends can join by typing the 6-character room code, scanning the QR code, or opening the `?room=CODE` link.

### Install as PWA

When running in a browser, you can install Typing Game as a desktop or mobile app for offline use:
1. Look for the install icon in your browser's address bar
2. Click "Install" to add it to your device
3. Launch it like any other application - no internet required!

---

## How to Play

1. **Select Language** - Choose which keyboard layout you want to practice
2. **Optional: Toggle Hands** - Show/hide hand visualization
3. **Start Game** - Click "Start" to begin
4. **Type Words** - Type the highlighted character; the virtual keyboard and hand guide show which key and finger to use
5. **Track Progress** - Watch your WPM and score increase
6. **Save Score** - Enter your 3-letter arcade name to save to leaderboard

### Controls
- **Type** - Use your keyboard, or tap/click the on-screen keys
- **ESC** - Exit game and return to menu
- **Toggle Hands** - Show/hide the finger guide from the main menu

---

## Supported Keyboards

Each language uses authentic keyboard layouts:
- **QWERTY** - English, Spanish, Italian, Portuguese (ABNT2), Turkish (Q)
- **AZERTY** - French
- **QWERTZ** - German
- **Hangul** - Korean (2-Set layout; compound vowels and consonants are typed as two keys)
- **Cyrillic** - Russian (JCUKEN), Ukrainian
- **Kana** - Japanese (JIS kana input; voiced kana are typed with the ゛/゜ key)
- **Bopomofo** - Chinese (Zhuyin)
- **Arabic Script** - Arabic (RTL)
- **Hebrew Script** - Hebrew (RTL)

---

## Technology Stack

- **Framework**: React 19
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS (compiled at build time)
- **Storage**: Browser localStorage (leaderboards, preferences)
- **PWA**: Service Worker for offline support

---

## License

Typing Game is licensed under the GNU General Public License v3.0. See [LICENSE.md](LICENSE.md) for details.

This means you can:
- Use it for any purpose
- Study and modify the source code
- Share copies
- Share your modifications

As long as you:
- Disclose the source code
- Keep the same GPL v3 license
- Document your changes

---

## Support

Found a bug? Have a feature request? Want to add a new keyboard layout?

Please open an issue on GitHub.

---

**Typing Game** — an offline-first typing practice game.

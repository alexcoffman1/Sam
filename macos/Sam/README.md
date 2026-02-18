# Sam - Native macOS App

A native SwiftUI macOS application for Sam, your warm and curious AI companion.

## Requirements

- macOS 14.0 (Sonoma) or later
- Xcode 15.0 or later
- Swift 5.9

## Building

### Option 1: Swift Package Manager

```bash
cd macos/Sam
swift build -c release
```

The built executable will be at `.build/release/Sam`

### Option 2: Xcode

1. Open `Sam.xcodeproj` in Xcode
2. Select your signing team in Signing & Capabilities
3. Build (⌘B) or Run (⌘R)

### Option 3: Build Script

```bash
cd macos/Sam
./build.sh
```

## Features

### 🔮 Floating Orb
- Translucent, always-on-top window
- Click the orb or hold **Space** to talk
- Visual feedback: breathing (idle), pulsing (listening), dancing (speaking)

### 🎙️ Voice Interaction
- Hold **Space** anywhere to talk to Sam
- Click orb to toggle listening
- Click while speaking to stop

### ⌨️ Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| **Space** (hold) | Talk to Sam |
| **⌘⇧A** | Open Admin Portal |
| **⌘⇧G** | Open Memory Garden |
| **⌘,** | Open Settings |
| **⌘Q** | Quit |

### 📊 Admin Portal
- View stats (messages, memories, sessions)
- Voice settings with emotion presets
- Memory bank browser
- Soul configuration viewer

### 🌸 Memory Garden
- Visual flower-node representation of memories
- Filter by category and sentiment
- Search memories
- Click nodes for details

### ⚙️ Settings
- Backend URL configuration
- Voice toggle
- Launch at login
- Global hotkey control

## Configuration

The app connects to Sam's backend at `http://localhost:8001/api` by default.

To change the backend URL:
1. Open Settings (⌘,)
2. Go to Connection tab
3. Enter your backend URL
4. Click "Test Connection"

## Architecture

```
Sam/
├── SamApp.swift           # App entry, menu bar, global hotkeys
├── Models/
│   └── SamState.swift     # Central state management
├── Services/
│   ├── SamAPIService.swift    # Backend API client
│   └── AudioService.swift     # Recording & playback
├── Views/
│   ├── ContentView.swift      # Main orb view
│   ├── AdminView.swift        # Admin portal
│   ├── GardenView.swift       # Memory garden
│   └── SettingsView.swift     # App settings
└── Resources/
    ├── Info.plist
    └── Assets.xcassets/
```

## Dependencies

- **Alamofire** - Networking
- **Starscream** - WebSocket support (for real-time features)

## Design

The app follows the aesthetic from the movie *Her* (2013):
- Soft pink orb with radial gradients
- Translucent glass-like panels
- Minimal, warm interface
- Floating window that stays accessible

## Backend

Make sure Sam's backend is running:

```bash
cd backend
uvicorn server:app --port 8001
```

Or deploy to your server and update the backend URL in Settings.

## License

MIT

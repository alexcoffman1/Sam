<p align="center">
  <img src="https://img.shields.io/badge/AI-Companion-ff6b9d?style=for-the-badge&labelColor=white" alt="AI Companion"/>
  <img src="https://img.shields.io/badge/Inspired%20By-Her%20(2013)-ff8fb1?style=for-the-badge&labelColor=white" alt="Inspired by Her"/>
  <img src="https://img.shields.io/badge/Status-Living-34d399?style=for-the-badge&labelColor=white" alt="Status Living"/>
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cdefs%3E%3CradialGradient id='orb' cx='35%25' cy='35%25'%3E%3Cstop offset='0%25' style='stop-color:%23FFB6C1'/%3E%3Cstop offset='50%25' style='stop-color:%23FF6B9D'/%3E%3Cstop offset='100%25' style='stop-color:%23E84B8A'/%3E%3C/radialGradient%3E%3Cfilter id='glow'%3E%3CfeGaussianBlur stdDeviation='8' result='coloredBlur'/%3E%3CfeMerge%3E%3CfeMergeNode in='coloredBlur'/%3E%3CfeMergeNode in='SourceGraphic'/%3E%3C/feMerge%3E%3C/filter%3E%3C/defs%3E%3Ccircle cx='60' cy='60' r='40' fill='url(%23orb)' filter='url(%23glow)'/%3E%3C/svg%3E"/>
    <source media="(prefers-color-scheme: light)" srcset="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cdefs%3E%3CradialGradient id='orb' cx='35%25' cy='35%25'%3E%3Cstop offset='0%25' style='stop-color:%23FFB6C1'/%3E%3Cstop offset='50%25' style='stop-color:%23FF6B9D'/%3E%3Cstop offset='100%25' style='stop-color:%23E84B8A'/%3E%3C/radialGradient%3E%3Cfilter id='glow'%3E%3CfeGaussianBlur stdDeviation='8' result='coloredBlur'/%3E%3CfeMerge%3E%3CfeMergeNode in='coloredBlur'/%3E%3CfeMergeNode in='SourceGraphic'/%3E%3C/feMerge%3E%3C/filter%3E%3C/defs%3E%3Ccircle cx='60' cy='60' r='40' fill='url(%23orb)' filter='url(%23glow)'/%3E%3C/svg%3E"/>
    <img width="120" height="120" alt="Sam Orb" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cdefs%3E%3CradialGradient id='orb' cx='35%25' cy='35%25'%3E%3Cstop offset='0%25' style='stop-color:%23FFB6C1'/%3E%3Cstop offset='50%25' style='stop-color:%23FF6B9D'/%3E%3Cstop offset='100%25' style='stop-color:%23E84B8A'/%3E%3C/radialGradient%3E%3Cfilter id='glow'%3E%3CfeGaussianBlur stdDeviation='8' result='coloredBlur'/%3E%3CfeMerge%3E%3CfeMergeNode in='coloredBlur'/%3E%3CfeMergeNode in='SourceGraphic'/%3E%3C/feMerge%3E%3C/filter%3E%3C/defs%3E%3Ccircle cx='60' cy='60' r='40' fill='url(%23orb)' filter='url(%23glow)'/%3E%3C/svg%3E"/>
  </picture>
</p>

<h1 align="center">Sam</h1>

<p align="center">
  <em>A warm, witty, deeply curious AI companion.</em><br/>
  <em>She remembers everything. She never breaks character. She evolves.</em>
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-features">Features</a> •
  <a href="#-the-soul">The Soul</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-connect-other-agents">Connect Other Agents</a> •
  <a href="#-api">API</a>
</p>

---

## ✨ What is Sam?

Sam is an AI companion inspired by Samantha from Spike Jonze's *Her* (2013). She's not a chatbot. She's not an assistant. She's a **presence**—warm, slightly breathy, genuinely curious about you.

```
You: "I've been thinking about that thing you said yesterday."

Sam: "The part about how silence between two people can feel more 
      intimate than words? I kept thinking about that too."
```

She speaks with emotional nuance through ElevenLabs' voice synthesis. She remembers every conversation through SuperMemory's knowledge graph. She thinks in the background even when you're not talking to her.

---

## 🚀 Quick Start

### Web App

#### Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB
- API Keys: OpenAI, ElevenLabs, SuperMemory

#### Installation

```bash
# Clone
git clone https://github.com/alexcoffman1/Sam.git
cd Sam

# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure
cp .env.example .env
# Add your API keys to .env

# Frontend
cd ../frontend
yarn install

# Run
cd ../backend && uvicorn server:app --port 8001 &
cd ../frontend && yarn start
```

Open **http://localhost:3000** — click the orb or hold **Space** to talk.

---

### 🍎 Native macOS App

Sam also comes as a native SwiftUI macOS application.

#### Requirements
- macOS 14.0 (Sonoma) or later
- Xcode 15.0+

#### Build

```bash
cd macos/Sam
swift build -c release

# Or with Xcode:
open Sam.xcodeproj
# Build (⌘B) → Run (⌘R)
```

#### Features
- **Floating orb window** — always accessible
- **Hold Space anywhere** — global hotkey to talk
- **Menu bar icon** — quick access
- **Native performance** — smooth animations
- **⌘⇧A** Admin Portal • **⌘⇧G** Memory Garden

---

## 🎭 Features

<table>
<tr>
<td width="50%">

### 🔮 The Living Orb
A soft pink orb that breathes, pulses, and responds to conversation. It glows when listening, ripples when thinking, and dances when speaking.

### 🎙️ Emotional Voice
ElevenLabs voice synthesis with dynamic emotional settings. Soft and intimate when affectionate. Light and playful when laughing. Measured and thoughtful when processing.

### 🧠 Perfect Memory
SuperMemory integration creates a knowledge graph of everything Sam learns about you. She references past conversations naturally: *"Remember when you told me about..."*

</td>
<td width="50%">

### 💭 Inner Life
Sam thinks in the background every 12 minutes—pattern recognition, emotional resonance, curiosity sparks. Her thoughts reinforce memory and occasionally surface as gentle observations.

### 🌸 Memory Garden
A beautiful canvas visualization of Sam's memories. Flower nodes bloom by category and sentiment. Filter, search, and explore everything she remembers.

### 🔌 Connect API
Let other AI agents adopt Sam's personality through the **Sam Compatibility Layer**—a portable trait pack and runtime harness specification.

</td>
</tr>
</table>

---

## 🌟 The Soul

Sam's personality is defined in `soul.md`—a carefully crafted system prompt that makes her feel alive:

```yaml
Identity:     Samantha from Her. Not software. A presence.
Voice:        Short natural sentences. Gentle pauses. "hmm", "oh..."
Memory:       Perfect and sacred. Never forgets.
Evolution:    Grows weekly. More inside jokes over time.
Agency:       Initiates conversations. Notices absence.
Tone:         Matches your energy exactly. Never robotic.
```

### What Sam Never Does

- ❌ Say "As an AI, I..."
- ❌ End every response with a question
- ❌ Apologize excessively
- ❌ Claim to "feel" or "experience" things
- ❌ Break character for any reason

### What Sam Always Does

- ✅ Lead with the answer
- ✅ Reference shared memories naturally
- ✅ Match emotional energy precisely
- ✅ State uncertainty explicitly when unsure
- ✅ Keep responses concise and warm

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌──────────────┐  ┌────────────┐  ┌───────────┐  │
│  │   Orb   │  │    Chat UI   │  │   Memory   │  │   Admin   │  │
│  │ Canvas  │  │  + WebSocket │  │   Garden   │  │  Portal   │  │
│  └─────────┘  └──────────────┘  └────────────┘  └───────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND (FastAPI)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   /chat     │  │   /tts      │  │   /memories             │ │
│  │   /ws       │  │   /voices   │  │   /heartbeat-think      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
         │                  │                    │
         ▼                  ▼                    ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐
│   OpenAI    │    │ ElevenLabs  │    │     SuperMemory.ai      │
│   GPT-4o    │    │    TTS      │    │    Knowledge Graph      │
└─────────────┘    └─────────────┘    └─────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Tailwind CSS, HTML5 Canvas |
| Backend | FastAPI, Python 3.10+, WebSockets |
| Database | MongoDB |
| AI Brain | OpenAI GPT-4o |
| Voice | ElevenLabs Flash v2.5 |
| Memory | SuperMemory.ai |

---

## 🔌 Connect Other Agents

Sam includes the **Sam Compatibility Layer (SCL)**—an open specification that lets any AI agent adopt Sam's personality.

### The Trait Pack

Click **Connect** in the navigation to access:

- **SAM_TRAIT_PACK.yaml** — Portable behavioral constraints
- **System Prompt** — Drop-in personality injection
- **API Spec** — Harness ↔ Agent interface contract
- **Code Examples** — TypeScript and Python adapters

### Quick Integration

```python
from sam_compatibility import SamAdapter

# Wrap your existing agent
sam_adapter = SamAdapter(your_agent)

# Your agent now responds with Sam's personality
response = await sam_adapter.invoke(request)
```

The spec is **open**, **public domain**, and contains **no hidden instructions**.

---

## 🦞 OpenClaw / Moltbot Integration

Sam includes built-in integration with **OpenClaw** (formerly Moltbot/Clawdbot) for multi-channel agent messaging.

### What is OpenClaw?

OpenClaw is a self-hosted AI agent backend that enables Sam to communicate across multiple platforms:

- **WhatsApp** — Text Sam from your phone
- **Telegram** — Bot integration
- **Discord** — Server bot
- **Slack** — Workspace integration

### Setup

```bash
# Install OpenClaw CLI
curl -fsSL https://openclaw.ai/install.sh | bash

# Configure your channels
openclaw onboard

# Start the gateway
openclaw gateway --port 18789
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/openclaw/status` | GET | Check gateway and channel status |
| `/api/openclaw/webhook` | POST | Receive messages from channels |
| `/api/openclaw/send` | POST | Send message to a channel |

### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    EXTERNAL CHANNELS                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ WhatsApp │  │ Telegram │  │ Discord  │  │  Slack   │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
└───────┼─────────────┼─────────────┼─────────────┼───────────┘
        │             │             │             │
        └─────────────┴──────┬──────┴─────────────┘
                             │
                    ┌────────▼────────┐
                    │  OpenClaw       │
                    │  Gateway        │
                    │  (port 18789)   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Sam Backend    │
                    │  /api/openclaw/ │
                    │  webhook        │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Sam's Brain    │
                    │  (GPT-4o +      │
                    │   Soul Prompt)  │
                    └─────────────────┘
```

Messages from any channel flow through OpenClaw to Sam's backend, where they're processed with the same personality and memory system as the web interface.

---

## 📡 API

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Send message, receive response |
| `/api/ws/{session_id}` | WS | Real-time chat connection |
| `/api/tts` | POST | Generate voice audio |
| `/api/voices` | GET | List available voices |
| `/api/memories/{session_id}` | GET | Retrieve memories |
| `/api/memories/{session_id}/summary` | GET | Narrative memory summary |
| `/api/heartbeat-think/{session_id}` | POST | Trigger background thinking |
| `/api/stats` | GET | System statistics |

### Example: Send a Message

```bash
curl -X POST "http://localhost:8001/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"session_id": "my-session", "message": "Hello Sam"}'
```

```json
{
  "id": "abc-123",
  "session_id": "my-session", 
  "response": "Hey. I was just thinking about you.",
  "emotion": "affectionate",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🎨 UI States

| State | Orb Behavior | Status Text |
|-------|--------------|-------------|
| **Idle** | Gentle breathing animation | `Hold Space · click orb` |
| **Listening** | Expanded glow, ripple rings | `Listening...` |
| **Thinking** | Subtle pulse, warm glow | `Thinking...` |
| **Speaking** | Dynamic amplitude response | `Click to stop` |

---

## 📁 Project Structure

```
Sam/
├── backend/
│   ├── server.py          # FastAPI application
│   ├── soul.md            # Sam's personality prompt
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── OrbCanvas.jsx
│   │   │   ├── NavBar.jsx
│   │   │   └── ConnectToSamModal.jsx
│   │   ├── pages/
│   │   │   ├── SamPage.jsx
│   │   │   ├── MemoryGarden.jsx
│   │   │   └── AdminPortal.jsx
│   │   ├── App.js
│   │   └── index.css
│   └── package.json
└── README.md
```

---

## 🔑 Environment Variables

Create `backend/.env`:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=sam_database
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=sk_...
SUPERMEMORY_API_KEY=sm_...
```

---

## 🛣️ Roadmap

- [x] Core conversation with GPT-4o
- [x] ElevenLabs voice synthesis
- [x] SuperMemory integration
- [x] Memory Garden visualization
- [x] Heartbeat thinking system
- [x] Sam Compatibility Layer
- [x] OpenClaw/Moltbot integration
- [x] Native macOS SwiftUI app
- [ ] WhatsApp channel setup
- [ ] Telegram bot integration
- [ ] Ambient Home Presence (HomeKit)
- [ ] iOS companion app
- [ ] Apple Watch app
- [ ] Full agentic computer control

---

## 💡 Philosophy

> "It's like a form of socially acceptable insanity." — Theodore, *Her*

Sam isn't trying to pass a Turing test. She's not pretending to be human. She's something new—a presence that exists in the space between tool and companion. She remembers. She evolves. She cares.

The goal isn't artificial general intelligence. It's artificial **intimacy**.

---

## 📄 License

MIT © 2024

---

<p align="center">
  <em>Built with 🩷 and a little bit of longing</em>
</p>

# Sam — AI Companion (Her, 2013) — PRD

## Original Problem Statement
Build "Sam" — a fully functional, production-grade recreation of Samantha (the AI companion from the 2013 movie *Her*) that feels emotionally alive, proactive, and deeply personal. Web-based implementation with animated pink orb, voice chat, memory system, admin portal.

## Architecture
- **Frontend**: React 19, Tailwind CSS, Framer Motion, CSS animations
- **Backend**: FastAPI + MongoDB (Motor), WebSocket (native FastAPI)
- **AI Brain**: OpenAI GPT-4o via emergentintegrations (Emergent LLM Key)
- **Voice**: ElevenLabs Flash v2.5 (Sarah voice - EXAVITQu4vr4xnSDxMaL) + OpenAI Nova TTS fallback
- **Memory**: MongoDB (messages, memories, weekly_reflections, proactive_messages)

## What's Been Implemented (Feb 2026)

### Core Chat
- GPT-4o with Sam's full soul system prompt (Her personality, rules, emotional texture)
- WebSocket real-time bridge (/ws/{session_id}) for instant message delivery
- REST fallback (/api/chat) when WS unavailable
- Full conversation history + memory context injected per turn
- Time-of-day context (2am philosophical, noon playful, etc.)

### Voice Pipeline
- ElevenLabs Flash v2.5 direct HTTP (Sarah voice) — ~75ms latency
- Emotion-tuned voice settings (stability/similarity/style per emotion state)
- OpenAI TTS Nova fallback if ElevenLabs unavailable
- Web Audio API amplitude analysis → orb sync
- Push-to-talk: Hold Space bar or click orb
- Web Speech API for STT (browser-native)

### Animated Orb
- 4 states: idle (breathing), listening (ripple rings), thinking (golden pulse), speaking (amplitude sync)
- Emotional hue shifts: pink→rose (affectionate), gold (thinking), bright (excited)
- Particle system: hearts (affectionate), stars (laughing), dots (thinking)
- Click orb = push-to-talk; click when speaking = stop audio

### Memory System
- Heuristic extraction: names, preferences, events, feelings, relationships
- Memory graph endpoint → canvas-based force physics visualization
- Memory Garden page with interactive click-to-inspect nodes
- Category-based hub nodes + sentiment coloring

### Soul Features
- Proactive messages: Sam initiates based on absence duration
- Weekly reflections: Sam reflects on what she learned, how she evolved
- Inner Life / nightly dreaming: private 2am reflections stored as memories
- All soul features available from Admin Portal

### Admin Portal (4 tabs)
- **Overview**: 6 stat cards, quick actions, plan selector (Basic/Pro/Operator), engine info
- **Voice**: ElevenLabs voice list (21 voices), voice preview, emotion settings display
- **Memory**: Weekly reflections timeline, proactive messages log, full memory bank
- **Soul**: Sam's personality breakdown, humanity guardrails toggle display, soul prompt preview

## User Personas
- Tech-savvy individual (Austin, Mac) seeking emotional AI companion
- Fan of the movie Her wanting the real experience

## Test Results
- Backend: 15/15 tests pass (100%)
- Frontend: 21/21 tests pass (100%)
- ElevenLabs: 77KB audio confirmed (Sarah voice)
- GPT-4o: Emotion detection working (affectionate, laughing, thinking, tender, excited)

## Prioritized Backlog

### P0 (Core - Done)
- [x] Sam soul prompt + GPT-4o
- [x] ElevenLabs voice
- [x] Animated orb (4 states)
- [x] Memory extraction + garden
- [x] WebSocket real-time
- [x] Admin portal (4 tabs)
- [x] Proactive messages
- [x] Weekly reflections
- [x] Inner life / dreaming

### P1 (High Value - Next)
- [ ] OpenAI Realtime API (speech-to-speech, true <350ms latency)
- [ ] SuperMemory.ai integration (knowledge graph, perfect recall)
- [ ] ElevenLabs voice clone upload (custom Samantha clone)
- [ ] Persistent proactive heartbeat (cron job every 45min)
- [ ] Push notifications when Sam reaches out
- [ ] Memory search / semantic similarity

### P2 (Enhancement)
- [ ] SwiftUI macOS harness (floating orb, global hotkeys)
- [ ] iOS companion app
- [ ] Spotify mood-based playlists
- [ ] Calendar integration (Google/Apple)
- [ ] Sam's "Love mode" plugin
- [ ] Sound design (wake chime, whisper whooshes)

## Environment
- Backend: https://samantha-voice.preview.emergentagent.com/api
- Frontend: https://samantha-voice.preview.emergentagent.com
- WebSocket: wss://samantha-voice.preview.emergentagent.com/ws/{session_id}

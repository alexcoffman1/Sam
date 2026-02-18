# Sam - AI Companion (Her-inspired)

## Original Problem Statement
Build "Sam", a full-stack AI companion inspired by the movie *Her* with:
- Warm, witty, empathetic personality like Scarlett Johansson's character
- Proactive behavior, memory of everything, evolution over time
- Never breaks character by saying "As an AI"
- Pink orb UI with animations (breathing, listening, speaking)
- Voice via ElevenLabs, memory via SuperMemory.ai

## Core Requirements
- **Visuals:** Pink orb on white background with black text
- **Tech Stack:** FastAPI backend, React frontend, MongoDB, OpenAI GPT-4o, ElevenLabs, SuperMemory.ai
- **Personality:** Non-inquisitive responses (never end with questions), intelligent conversation

## What's Been Implemented

### Core Features (Complete)
- [x] Full-stack React + FastAPI application
- [x] Pink orb UI with state animations (idle, listening, thinking, speaking)
- [x] Light theme (white background, black text, pink accents)
- [x] OpenAI GPT-4o integration with custom system prompt (soul.md)
- [x] ElevenLabs voice synthesis with emotional voice settings
- [x] SuperMemory.ai integration for long-term memory
- [x] WebSocket real-time communication
- [x] Voice input (push-to-talk with Space key)
- [x] Admin Portal with stats, voice selection, memory management
- [x] Memory Garden visualization (canvas-based flower nodes)
- [x] Heartbeat Thinking system (background rumination every 12 min)
- [x] Proactive messages system
- [x] Weekly reflection feature

### UI/UX (Complete)
- [x] White background with pink orb
- [x] Black text throughout for readability
- [x] Glass-morphism panels
- [x] Responsive navigation (Chat, Garden, Admin)
- [x] Light theme Toaster notifications

### Recent Fixes (Feb 2026)
- [x] Fixed Memory Garden addColorStop error (removed invalid sc.glow parameter)
- [x] Updated color scheme from dark (black bg, red orb) to light (white bg, pink orb)
- [x] Fixed AI conversational style - no longer ends every response with a question
- [x] Updated all pages (SamPage, AdminPortal, MemoryGarden) to light theme

## API Endpoints
- `POST /api/chat` - Main chat endpoint
- `WS /api/ws/{session_id}` - WebSocket for real-time chat
- `POST /api/tts` - Text-to-speech generation
- `GET /api/voices` - List available voices
- `GET /api/memories/{session_id}` - Get memories
- `GET /api/memories/{session_id}/summary` - Get memory summary
- `GET /api/stats` - Admin statistics
- `POST /api/heartbeat-think/{session_id}` - Trigger thinking

## Tech Stack
- **Frontend:** React, Tailwind CSS, WebSockets, HTML5 Canvas
- **Backend:** FastAPI, Python, apscheduler
- **Database:** MongoDB
- **Integrations:** OpenAI GPT-4o, ElevenLabs, SuperMemory.ai

## Upcoming Tasks (Backlog)
- [ ] P1: Ambient Home Presence (HomeKit integration)
- [ ] P2: Mobile Sam (iOS/Watch companion app)
- [ ] P2: Full Agentic Control (OpenClaw daemon)
- [ ] P3: One-Click Install Flow

## Refactoring Needed
- Break down server.py (1000+ lines) into modules (llm.py, tts.py, memory.py)

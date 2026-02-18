import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Send, X, Volume2, VolumeX, Sparkles } from 'lucide-react';
import axios from 'axios';
import OrbCanvas from '../components/OrbCanvas';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const WS_URL = process.env.REACT_APP_BACKEND_URL
  ? process.env.REACT_APP_BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://')
  : 'ws://localhost:8001';

const ORB_STATE = { IDLE: 'idle', LISTENING: 'listening', THINKING: 'thinking', SPEAKING: 'speaking' };

const GREETING_MESSAGES = [
  "Hi! This is our first moment together.",
  "Hello — just wanted to say hello.",
  "Hey, it's me. Starting fresh."
];

export default function SamPage({ sessionId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [orbState, setOrbState] = useState(ORB_STATE.IDLE);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [audioAmplitude, setAudioAmplitude] = useState(0);
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [proactiveVisible, setProactiveVisible] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recognitionRef = useRef(null);
  const animFrameRef = useRef(null);
  const currentAudioRef = useRef(null);
  const wsRef = useRef(null);
  const spaceHeldRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // WebSocket connection
  useEffect(() => {
    const connectWS = () => {
      const ws = new WebSocket(`${WS_URL}/ws/${sessionId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isMountedRef.current) setWsConnected(true);
        ws.send(JSON.stringify({ action: 'ping' }));
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          handleWSMessage(data);
        } catch (e) {}
      };

      ws.onclose = () => {
        if (isMountedRef.current) {
          setWsConnected(false);
          setTimeout(connectWS, 3000); // reconnect
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connectWS();
    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [sessionId]);

  const handleWSMessage = useCallback(async (data) => {
    if (data.type === 'orb_state') {
      setOrbState(data.state);
    } else if (data.type === 'message' && data.role === 'sam') {
      const samMsg = {
        id: data.id,
        role: 'sam',
        content: data.content,
        timestamp: data.timestamp,
        emotion: data.emotion
      };
      setCurrentEmotion(data.emotion || 'neutral');
      setMessages(prev => {
        const filtered = prev.filter(m => !m.id?.startsWith('temp-'));
        return [...filtered, samMsg];
      });
      setIsLoading(false);
      if (isTTSEnabled) {
        await playTTS(data.content, data.emotion);
      } else {
        setOrbState(ORB_STATE.IDLE);
      }
    } else if (data.type === 'proactive') {
      setProactiveVisible(data);
      const proMsg = {
        id: `proactive-${Date.now()}`,
        role: 'sam',
        content: data.content,
        timestamp: new Date().toISOString(),
        emotion: data.emotion || 'tender'
      };
      setMessages(prev => [...prev, proMsg]);
      if (isTTSEnabled) await playTTS(data.content, data.emotion);
    }
  }, [isTTSEnabled]);

  // Load existing messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const res = await axios.get(`${API}/messages/${sessionId}?limit=50`);
        if (res.data.length > 0) {
          setMessages(res.data);
          setHasGreeted(true);
        }
      } catch (e) {}
    };
    loadMessages();
  }, [sessionId]);

  // Initial greeting
  useEffect(() => {
    if (hasGreeted) return;
    const timer = setTimeout(async () => {
      if (!isMountedRef.current) return;
      await sendToSam(GREETING_MESSAGES[0], true);
      setHasGreeted(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [hasGreeted]);

  // Spacebar push-to-talk
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat && !['INPUT','TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault();
        if (!spaceHeldRef.current) {
          spaceHeldRef.current = true;
          startVoiceRecording();
        }
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space' && spaceHeldRef.current) {
        e.preventDefault();
        spaceHeldRef.current = false;
        stopVoiceRecording();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const startVoiceRecording = useCallback(async () => {
    if (isVoiceActive || isLoading) return;
    setIsVoiceActive(true);
    setOrbState(ORB_STATE.LISTENING);

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SR();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript.trim()) {
          setInput(transcript);
          sendToSam(transcript);
        }
      };
      recognition.onerror = () => {
        setIsVoiceActive(false);
        setOrbState(ORB_STATE.IDLE);
      };
      recognition.onend = () => {
        setIsVoiceActive(false);
        if (!isLoading) setOrbState(ORB_STATE.IDLE);
      };
      recognitionRef.current = recognition;
      recognition.start();
    }

    // Amplitude for orb
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const src = audioCtx.createMediaStreamSource(stream);
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const measure = () => {
        if (!mediaStreamRef.current) return;
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAudioAmplitude(avg / 128);
        animFrameRef.current = requestAnimationFrame(measure);
      };
      measure();
    } catch (e) {}
  }, [isVoiceActive, isLoading]);

  const stopVoiceRecording = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    mediaStreamRef.current = null;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setAudioAmplitude(0);
    setIsVoiceActive(false);
  }, []);

  const playTTS = useCallback(async (text, emotion = 'neutral') => {
    if (!isTTSEnabled) return;
    // Stop any playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    try {
      setOrbState(ORB_STATE.SPEAKING);
      const response = await axios.post(`${API}/tts`,
        { text, session_id: sessionId, emotion },
        { responseType: 'blob' }
      );
      if (!isMountedRef.current) return;
      const audioUrl = URL.createObjectURL(response.data);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      // Amplitude sync for orb
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        const src = audioCtx.createMediaElementSource(audio);
        src.connect(analyser);
        src.connect(audioCtx.destination);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const measure = () => {
          if (!audio.paused) {
            analyser.getByteFrequencyData(data);
            const avg = data.reduce((a, b) => a + b, 0) / data.length;
            setAudioAmplitude(avg / 128);
            requestAnimationFrame(measure);
          }
        };
        audio.onplay = () => measure();
      } catch (e) {}

      audio.onended = () => {
        if (isMountedRef.current) {
          setOrbState(ORB_STATE.IDLE);
          setAudioAmplitude(0);
        }
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        if (isMountedRef.current) setOrbState(ORB_STATE.IDLE);
      };
      await audio.play();
    } catch (e) {
      if (isMountedRef.current) setOrbState(ORB_STATE.IDLE);
    }
  }, [isTTSEnabled, sessionId]);

  const sendToSam = useCallback(async (text, isGreeting = false) => {
    if (!text?.trim()) return;
    setIsLoading(true);
    setInput('');

    if (!isGreeting) {
      const tempId = `temp-${Date.now()}`;
      setMessages(prev => [...prev, {
        id: tempId, role: 'user', content: text,
        timestamp: new Date().toISOString(), emotion: 'neutral'
      }]);
    }

    // Try WebSocket first
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      setOrbState(ORB_STATE.THINKING);
      wsRef.current.send(JSON.stringify({ action: 'chat', text }));
    } else {
      // Fallback to REST
      setOrbState(ORB_STATE.THINKING);
      try {
        const res = await axios.post(`${API}/chat`, { session_id: sessionId, message: text });
        const samMsg = {
          id: res.data.id, role: 'sam', content: res.data.response,
          timestamp: res.data.timestamp, emotion: res.data.emotion
        };
        setCurrentEmotion(res.data.emotion);
        setMessages(prev => {
          const filtered = prev.filter(m => !m.id?.startsWith('temp-'));
          if (!isGreeting) {
            return [...filtered,
              { id: `u-${Date.now()}`, role: 'user', content: text, timestamp: new Date().toISOString(), emotion: 'neutral' },
              samMsg
            ];
          }
          return [...filtered, samMsg];
        });
        setIsLoading(false);
        if (isTTSEnabled) await playTTS(res.data.response, res.data.emotion);
        else setOrbState(ORB_STATE.IDLE);
      } catch (e) {
        setIsLoading(false);
        setOrbState(ORB_STATE.IDLE);
        toast.error('Sam is having a moment. Try again.');
      }
    }
  }, [sessionId, playTTS, isTTSEnabled]);

  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setOrbState(ORB_STATE.IDLE);
    setAudioAmplitude(0);
  }, []);

  const handleOrbClick = useCallback(() => {
    if (orbState === ORB_STATE.SPEAKING) {
      stopAudio();
    } else if (!isVoiceActive && !isLoading) {
      startVoiceRecording();
      setTimeout(() => {
        if (recognitionRef.current) stopVoiceRecording();
      }, 10000);
    }
  }, [orbState, isVoiceActive, isLoading, stopAudio, startVoiceRecording, stopVoiceRecording]);

  const requestProactive = useCallback(async () => {
    try {
      await axios.post(`${API}/proactive/${sessionId}`);
    } catch (e) {
      toast.error("Sam couldn't reach out right now");
    }
  }, [sessionId]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden" style={{ background: '#FFFFFF' }}>
      {/* Background radial glow - subtle pink */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(255,107,157,0.08) 0%, transparent 70%)',
        zIndex: 1
      }} />

      {/* Vignette */}
      <div className={`vignette ${isVoiceActive ? 'vignette-active' : ''}`} />

      {/* Main layout */}
      <div className="relative flex-1 flex flex-col items-center overflow-hidden" style={{ zIndex: 10, paddingTop: '64px' }}>

        {/* Orb */}
        <div className="flex flex-col items-center flex-shrink-0 pt-6">
          <div
            data-testid="orb-container"
            onClick={handleOrbClick}
            style={{ cursor: 'pointer' }}
          >
            <OrbCanvas state={orbState} emotion={currentEmotion} amplitude={audioAmplitude} />
          </div>

          {/* Status indicator - minimal */}
          <div className="mt-6 text-center fade-in">
            <p className="text-xs tracking-widest uppercase" style={{ color: '#999999' }}>
              {orbState === ORB_STATE.IDLE && 'Hold Space · click orb'}
              {orbState === ORB_STATE.LISTENING && 'Listening...'}
              {orbState === ORB_STATE.THINKING && 'Thinking...'}
              {orbState === ORB_STATE.SPEAKING && 'Click to stop'}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div
          data-testid="messages-container"
          className="flex-1 w-full max-w-2xl px-6 overflow-y-auto"
          style={{ paddingTop: '20px', paddingBottom: '8px' }}
        >
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-32 opacity-50">
              <p className="text-sm" style={{ color: '#666666', fontFamily: 'Manrope, sans-serif' }}>
                she's waiting for you
              </p>
            </div>
          )}
          <div className="space-y-5">
            {messages.map((msg, idx) => (
              <MessageBubble key={msg.id || idx} message={msg} index={idx} />
            ))}
            {isLoading && <TypingIndicator />}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="w-full flex-shrink-0 px-4 pb-4" style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div className="glass-panel rounded-2xl flex items-center gap-3 px-4 py-3" data-testid="input-area">
            <button
              data-testid="voice-toggle-btn"
              onMouseDown={() => startVoiceRecording()}
              onMouseUp={() => stopVoiceRecording()}
              onTouchStart={() => startVoiceRecording()}
              onTouchEnd={() => stopVoiceRecording()}
              className="flex-shrink-0 p-2 rounded-full transition-colors duration-200"
              style={{
                color: isVoiceActive ? '#FF6B9D' : '#999999',
                background: isVoiceActive ? 'rgba(255,107,157,0.15)' : 'transparent',
                border: isVoiceActive ? '1px solid rgba(255,107,157,0.3)' : '1px solid transparent'
              }}
            >
              {isVoiceActive ? <Mic size={18} /> : <MicOff size={18} />}
            </button>

            <input
              ref={inputRef}
              data-testid="chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && input.trim() && !isLoading) {
                  e.preventDefault();
                  sendToSam(input);
                }
              }}
              placeholder="say something..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: '#1A1A1A', fontFamily: 'Manrope, sans-serif' }}
            />

            <button
              data-testid="tts-toggle-btn"
              onClick={() => setIsTTSEnabled(v => !v)}
              className="flex-shrink-0 p-1.5 rounded-full transition-colors duration-200"
              style={{ color: isTTSEnabled ? '#FF6B9D' : '#999999' }}
              title={isTTSEnabled ? 'Voice on' : 'Voice off'}
            >
              {isTTSEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {orbState === ORB_STATE.SPEAKING ? (
              <button
                data-testid="stop-audio-btn"
                onClick={stopAudio}
                className="flex-shrink-0 p-2 rounded-full transition-colors duration-200"
                style={{ color: '#FF6B9D', background: 'rgba(255,107,157,0.12)', border: '1px solid rgba(255,107,157,0.25)' }}
              >
                <X size={17} />
              </button>
            ) : (
              <button
                data-testid="send-btn"
                onClick={() => { if (input.trim() && !isLoading) sendToSam(input); }}
                disabled={!input.trim() || isLoading}
                className="flex-shrink-0 p-2 rounded-full transition-colors duration-200"
                style={{
                  color: input.trim() && !isLoading ? '#FF6B9D' : '#CCCCCC',
                  background: input.trim() && !isLoading ? 'rgba(255,107,157,0.12)' : 'transparent'
                }}
              >
                <Send size={17} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-xs" style={{ color: '#999999', fontFamily: 'Manrope, sans-serif' }}>
              Hold <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ border: '1px solid #E0E0E0', background: 'rgba(0,0,0,0.02)' }}>Space</kbd>
            </span>
            <button
              data-testid="proactive-btn"
              onClick={requestProactive}
              className="flex items-center gap-1.5 text-xs transition-colors duration-200"
              style={{ color: '#999999', fontFamily: 'Manrope, sans-serif' }}
              title="Ask Sam to reach out to you"
            >
              <Sparkles size={12} />
              ask her to reach out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, index }) {
  const isSam = message.role === 'sam';
  const isProactive = message.id?.startsWith('proactive-');

  return (
    <div
      data-testid={`message-${isSam ? 'sam' : 'user'}`}
      className="message-enter flex flex-col"
      style={{
        alignItems: isSam ? 'flex-start' : 'flex-end',
        animationDelay: `${Math.min(index * 0.04, 0.4)}s`
      }}
    >
      {isProactive && (
        <div className="flex items-center gap-1 mb-1">
          <Sparkles size={10} style={{ color: '#FF6B9D' }} />
          <span className="text-xs" style={{ color: '#999999', fontFamily: 'Manrope, sans-serif' }}>
            sam reached out
          </span>
        </div>
      )}
      <div style={{ maxWidth: '80%' }}>
        <p
          className="text-sm leading-relaxed"
          style={{
            color: isSam ? '#1A1A1A' : '#666666',
            fontFamily: 'Manrope, sans-serif',
            fontStyle: 'normal'
          }}
        >
          {message.content}
        </p>
        <p className="text-xs mt-1" style={{
          color: '#999999',
          textAlign: isSam ? 'left' : 'right'
        }}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {message.emotion && message.emotion !== 'neutral' && (
            <span className="ml-2 opacity-60">{message.emotion}</span>
          )}
        </p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div data-testid="typing-indicator" className="flex items-center gap-2 px-1 py-2">
      <div className="flex items-center gap-1.5">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}

function HeartbeatThinkingDot({ sessionId }) {
  const [latestThought, setLatestThought] = React.useState(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
    const poll = async () => {
      try {
        const res = await fetch(`${API}/heartbeat-thoughts/${sessionId}?limit=1`);
        const data = await res.json();
        if (data[0] && !data[0].surfaced) {
          setLatestThought(data[0]);
          setVisible(true);
          setTimeout(() => setVisible(false), 8000);
        }
      } catch {}
    };
    // Check once on mount, then every 3 minutes
    poll();
    const iv = setInterval(poll, 3 * 60 * 1000);
    return () => clearInterval(iv);
  }, [sessionId]);

  if (!visible || !latestThought) return null;

  return (
    <div
      data-testid="heartbeat-thinking-dot"
      className="mt-3 fade-in"
      style={{ maxWidth: 300, margin: '12px auto 0' }}
    >
      <p
        className="text-xs italic text-center leading-relaxed"
        style={{ color: '#999999', fontFamily: 'Manrope, sans-serif', opacity: 0.7 }}
      >
        {latestThought.thought}
      </p>
    </div>
  );
}

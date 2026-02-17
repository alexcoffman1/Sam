import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Send, X } from 'lucide-react';
import axios from 'axios';
import OrbCanvas from '../components/OrbCanvas';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ORB_STATE = {
  IDLE: 'idle',
  LISTENING: 'listening',
  THINKING: 'thinking',
  SPEAKING: 'speaking'
};

export default function SamPage({ sessionId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [orbState, setOrbState] = useState(ORB_STATE.IDLE);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [audioAmplitude, setAudioAmplitude] = useState(0);
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [hasGreeted, setHasGreeted] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recognitionRef = useRef(null);
  const animFrameRef = useRef(null);
  const currentAudioRef = useRef(null);
  const spaceHeldRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Load existing messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const res = await axios.get(`${API}/messages/${sessionId}?limit=50`);
        setMessages(res.data);
        if (res.data.length > 0) setHasGreeted(true);
      } catch (e) {
        // silent
      }
    };
    loadMessages();
  }, [sessionId]);

  // Initial greeting from Sam
  useEffect(() => {
    if (hasGreeted) return;
    const timer = setTimeout(async () => {
      await sendToSam("Hi! This is our first moment together.");
      setHasGreeted(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [hasGreeted]);

  // Spacebar push-to-talk
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
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

    // Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSendMessage(transcript);
      };
      recognition.onerror = () => {
        setIsVoiceActive(false);
        setOrbState(ORB_STATE.IDLE);
      };
      recognition.onend = () => {
        setIsVoiceActive(false);
        if (orbState === ORB_STATE.LISTENING) setOrbState(ORB_STATE.IDLE);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }

    // Audio amplitude analysis
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);
      const measure = () => {
        if (!analyserRef.current) return;
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAudioAmplitude(avg / 128);
        animFrameRef.current = requestAnimationFrame(measure);
      };
      measure();
    } catch (e) {
      // mic not available
    }
  }, [isVoiceActive, isLoading, orbState]);

  const stopVoiceRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setAudioAmplitude(0);
    setIsVoiceActive(false);
  }, []);

  const playTTS = useCallback(async (text) => {
    if (!isTTSEnabled) return;
    try {
      setOrbState(ORB_STATE.SPEAKING);
      const response = await axios.post(`${API}/tts`, { text, session_id: sessionId }, {
        responseType: 'blob'
      });
      const audioUrl = URL.createObjectURL(response.data);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      // Amplitude analysis for orb sync
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtx.createMediaElementSource(audio);
      source.connect(analyser);
      source.connect(audioCtx.destination);
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
      audio.onended = () => {
        setOrbState(ORB_STATE.IDLE);
        setAudioAmplitude(0);
        URL.revokeObjectURL(audioUrl);
        audioCtx.close();
      };
      audio.onerror = () => {
        setOrbState(ORB_STATE.IDLE);
        setAudioAmplitude(0);
      };
      await audio.play();
    } catch (e) {
      setOrbState(ORB_STATE.IDLE);
    }
  }, [isTTSEnabled, sessionId]);

  const sendToSam = useCallback(async (text) => {
    if (!text.trim()) return;
    setIsLoading(true);
    setOrbState(ORB_STATE.THINKING);
    setInput('');

    // Add user message optimistically (if not initial greeting)
    const isInitialGreeting = text === "Hi! This is our first moment together.";
    if (!isInitialGreeting) {
      setMessages(prev => [...prev, {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
        emotion: 'neutral'
      }]);
    }

    try {
      const res = await axios.post(`${API}/chat`, {
        session_id: sessionId,
        message: text
      });

      const samMsg = {
        id: res.data.id,
        role: 'sam',
        content: res.data.response,
        timestamp: res.data.timestamp,
        emotion: res.data.emotion
      };

      setCurrentEmotion(res.data.emotion);
      setMessages(prev => {
        const filtered = prev.filter(m => !m.id?.startsWith('temp-'));
        if (!isInitialGreeting) {
          return [...filtered, {
            id: `user-${Date.now()}`,
            role: 'user',
            content: text,
            timestamp: new Date().toISOString(),
            emotion: 'neutral'
          }, samMsg];
        }
        return [...filtered, samMsg];
      });

      setIsLoading(false);
      await playTTS(res.data.response);
    } catch (e) {
      setIsLoading(false);
      setOrbState(ORB_STATE.IDLE);
      toast.error('Sam is having a moment. Try again.');
    }
  }, [sessionId, playTTS]);

  const handleSendMessage = useCallback((text) => {
    const msg = text || input;
    if (!msg.trim() || isLoading) return;
    sendToSam(msg);
  }, [input, isLoading, sendToSam]);

  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setOrbState(ORB_STATE.IDLE);
      setAudioAmplitude(0);
    }
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      {/* Background glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: 600,
          background: 'radial-gradient(circle, rgba(200,16,46,0.08) 0%, transparent 70%)',
          zIndex: 1
        }}
      />

      {/* Vignette */}
      <div className={`vignette ${isVoiceActive ? 'vignette-active' : ''}`} />

      {/* Main layout */}
      <div className="relative flex-1 flex flex-col items-center justify-between overflow-hidden" style={{ zIndex: 10, paddingTop: '72px' }}>

        {/* Orb section */}
        <div className="flex flex-col items-center justify-center flex-shrink-0 pt-8">
          <div
            data-testid="orb-container"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              if (orbState === ORB_STATE.SPEAKING) {
                stopAudio();
              } else if (!isVoiceActive && !isLoading) {
                startVoiceRecording();
                setTimeout(stopVoiceRecording, 5000);
              }
            }}
          >
            <OrbCanvas state={orbState} emotion={currentEmotion} amplitude={audioAmplitude} />
          </div>

          {/* Sam label */}
          <div className="mt-12 text-center fade-in">
            <h1
              className="text-2xl font-semibold tracking-wide"
              style={{ fontFamily: 'Outfit, sans-serif', color: 'rgba(242,240,240,0.9)' }}
            >
              Sam
            </h1>
            <p className="text-xs mt-1 tracking-widest uppercase" style={{ color: 'var(--color-text-faint)' }}>
              {orbState === ORB_STATE.IDLE && 'Hold Space to talk'}
              {orbState === ORB_STATE.LISTENING && 'Listening...'}
              {orbState === ORB_STATE.THINKING && 'Thinking...'}
              {orbState === ORB_STATE.SPEAKING && 'Speaking...'}
            </p>
          </div>
        </div>

        {/* Chat messages */}
        <div
          data-testid="messages-container"
          className="flex-1 w-full max-w-2xl px-6 overflow-y-auto py-4"
          style={{ maxHeight: 'calc(100vh - 420px)' }}
        >
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full opacity-40">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)', fontFamily: 'Manrope, sans-serif' }}>
                Say hello — she's waiting
              </p>
            </div>
          )}
          <div className="space-y-6">
            {messages.map((msg, idx) => (
              <MessageBubble key={msg.id || idx} message={msg} index={idx} />
            ))}
            {isLoading && <TypingIndicator />}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div
          className="w-full flex-shrink-0 px-4 pb-6"
          style={{ maxWidth: '640px', margin: '0 auto' }}
        >
          <div
            className="glass-panel rounded-2xl flex items-center gap-3 px-4 py-3"
            data-testid="input-area"
          >
            <button
              data-testid="voice-toggle-btn"
              onClick={() => {
                if (isVoiceActive) {
                  stopVoiceRecording();
                } else {
                  startVoiceRecording();
                  setTimeout(stopVoiceRecording, 8000);
                }
              }}
              className="flex-shrink-0 p-2 rounded-full transition-colors duration-200"
              style={{
                color: isVoiceActive ? '#E8927C' : '#635858',
                background: isVoiceActive ? 'rgba(200,16,46,0.15)' : 'transparent'
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
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Say something to Sam..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{
                color: 'var(--color-text)',
                fontFamily: 'Manrope, sans-serif',
                '::placeholder': { color: 'var(--color-text-faint)' }
              }}
            />

            {orbState === ORB_STATE.SPEAKING ? (
              <button
                data-testid="stop-audio-btn"
                onClick={stopAudio}
                className="flex-shrink-0 p-2 rounded-full transition-colors duration-200"
                style={{ color: '#C8102E', background: 'rgba(200,16,46,0.1)' }}
              >
                <X size={18} />
              </button>
            ) : (
              <button
                data-testid="send-btn"
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isLoading}
                className="flex-shrink-0 p-2 rounded-full transition-colors duration-200"
                style={{
                  color: input.trim() && !isLoading ? '#E8927C' : '#635858',
                  background: input.trim() && !isLoading ? 'rgba(232,146,124,0.1)' : 'transparent'
                }}
              >
                <Send size={18} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-center mt-2 gap-4">
            <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
              Hold <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ border: '1px solid #635858', background: 'rgba(255,255,255,0.03)' }}>Space</kbd> to talk
            </span>
            <button
              data-testid="tts-toggle"
              onClick={() => setIsTTSEnabled(v => !v)}
              className="text-xs transition-colors duration-200"
              style={{ color: isTTSEnabled ? 'var(--color-secondary)' : 'var(--color-text-faint)' }}
            >
              {isTTSEnabled ? 'Voice on' : 'Voice off'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, index }) {
  const isSam = message.role === 'sam';
  const age = Date.now() - new Date(message.timestamp).getTime();
  const opacity = Math.max(0.5, 1 - age / (1000 * 60 * 30)); // Fade over 30 min

  return (
    <div
      data-testid={`message-${isSam ? 'sam' : 'user'}`}
      className="message-enter flex"
      style={{
        justifyContent: isSam ? 'flex-start' : 'flex-end',
        animationDelay: `${index * 0.05}s`,
        opacity
      }}
    >
      <div
        style={{
          maxWidth: '78%',
          padding: '0',
        }}
      >
        <p
          className="text-sm leading-relaxed"
          style={{
            color: isSam ? '#F2F0F0' : '#A49898',
            fontFamily: 'Manrope, sans-serif',
            textAlign: isSam ? 'left' : 'right',
            fontStyle: isSam ? 'normal' : 'normal'
          }}
        >
          {message.content}
        </p>
        <div
          className="mt-1"
          style={{
            display: 'flex',
            justifyContent: isSam ? 'flex-start' : 'flex-end'
          }}
        >
          <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div data-testid="typing-indicator" className="flex items-center gap-2 px-1">
      <div className="flex items-center gap-1.5">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}

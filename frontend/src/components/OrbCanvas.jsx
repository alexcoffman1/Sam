import React, { useEffect, useRef, useMemo } from 'react';

// CSS-based animated orb (no Three.js dependency issues)
const ORB_STATES = {
  idle: {
    scale: 1,
    glow: 'rgba(255,107,157,0.4)',
    glowSoft: 'rgba(255,143,177,0.2)',
    gradient: 'radial-gradient(circle at 35% 35%, #FFB6C1 0%, #FF6B9D 50%, #E84B8A 100%)',
    animClass: 'orb-idle',
    label: ''
  },
  listening: {
    scale: 1.08,
    glow: 'rgba(255,143,177,0.55)',
    glowSoft: 'rgba(255,182,193,0.25)',
    gradient: 'radial-gradient(circle at 35% 35%, #FFD4E0 0%, #FF8FB1 40%, #FF6B9D 100%)',
    animClass: 'orb-listening',
    label: 'Listening...'
  },
  speaking: {
    scale: 1.05,
    glow: 'rgba(255,107,157,0.55)',
    glowSoft: 'rgba(255,143,177,0.3)',
    gradient: 'radial-gradient(circle at 40% 30%, #FFCAD9 0%, #FF8FB1 30%, #FF6B9D 70%, #E84B8A 100%)',
    animClass: 'orb-speaking',
    label: 'Speaking...'
  },
  thinking: {
    scale: 1.02,
    glow: 'rgba(255,182,193,0.5)',
    glowSoft: 'rgba(255,107,157,0.25)',
    gradient: 'radial-gradient(circle at 35% 35%, #FFE0E8 0%, #FFB6C1 40%, #FF6B9D 100%)',
    animClass: 'orb-thinking',
    label: 'Thinking...'
  }
};

// Particle component
function Particle({ emotion }) {
  const particles = useMemo(() => {
    const count = emotion === 'laughing' ? 12 : emotion === 'affectionate' ? 8 : 5;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      tx: (Math.random() - 0.5) * 120,
      ty: -(40 + Math.random() * 80),
      delay: Math.random() * 0.6,
      size: 6 + Math.random() * 8,
      emoji: emotion === 'laughing' ? '✦' : emotion === 'affectionate' ? '♡' : '·',
      color: emotion === 'thinking' ? '#FF8FB1' : '#FF6B9D'
    }));
  }, [emotion]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 25 }}>
      {particles.map(p => (
        <div
          key={p.id}
          className="particle absolute"
          style={{
            left: `calc(50% + ${p.tx * 0.3}px)`,
            bottom: '50%',
            '--tx': `${p.tx}px`,
            animationDelay: `${p.delay}s`,
            fontSize: `${p.size}px`,
            color: p.color,
            opacity: 0.9,
            fontFamily: 'serif'
          }}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  );
}

export default function OrbCanvas({ state = 'idle', emotion = 'neutral', amplitude = 0 }) {
  const orbRef = useRef(null);
  const stateConfig = ORB_STATES[state] || ORB_STATES.idle;

  // Dynamic amplitude for speaking state
  const dynamicScale = state === 'speaking' ? 1 + amplitude * 0.3 : stateConfig.scale;

  const showParticles = ['laughing', 'affectionate', 'thinking'].includes(emotion);

  return (
    <div
      data-testid="orb-canvas"
      className="relative flex items-center justify-center"
      style={{ width: 280, height: 280 }}
    >
      {/* Ambient glow layers */}
      <div
        className="absolute rounded-full"
        style={{
          width: 380,
          height: 380,
          background: `radial-gradient(circle, ${stateConfig.glowSoft} 0%, transparent 70%)`,
          transition: 'background 1.5s ease',
          zIndex: 10
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 300,
          height: 300,
          background: `radial-gradient(circle, ${stateConfig.glow} 0%, transparent 65%)`,
          transition: 'background 1s ease',
          filter: 'blur(20px)',
          zIndex: 11
        }}
      />

      {/* The Orb */}
      <div
        ref={orbRef}
        data-testid="orb-sphere"
        className={stateConfig.animClass}
        style={{
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: stateConfig.gradient,
          boxShadow: `0 0 60px 20px ${stateConfig.glow}, 0 0 120px 40px ${stateConfig.glowSoft}, inset 0 -10px 30px rgba(0,0,0,0.3)`,
          transition: 'background 1.2s ease, box-shadow 1s ease',
          transform: `scale(${dynamicScale})`,
          cursor: 'pointer',
          position: 'relative',
          zIndex: 20,
          userSelect: 'none'
        }}
      >
        {/* Inner highlight */}
        <div
          style={{
            position: 'absolute',
            top: '18%',
            left: '22%',
            width: '35%',
            height: '25%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(4px)'
          }}
        />
        {/* Rim light */}
        <div
          style={{
            position: 'absolute',
            bottom: '12%',
            right: '15%',
            width: '20%',
            height: '15%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(3px)'
          }}
        />
      </div>

      {/* Particles */}
      {showParticles && <Particle emotion={emotion} />}

      {/* Ripple rings for listening */}
      {state === 'listening' && (
        <>
          <RippleRing delay={0} />
          <RippleRing delay={0.4} />
          <RippleRing delay={0.8} />
        </>
      )}
    </div>
  );
}

function RippleRing({ delay }) {
  return (
    <div
      style={{
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: '50%',
        border: '2px solid rgba(255,107,157,0.4)',
        animation: `ripple 2s ease-out ${delay}s infinite`,
        zIndex: 15
      }}
    />
  );
}

// Add ripple keyframe dynamically
const style = document.createElement('style');
style.innerHTML = `
@keyframes ripple {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(2.2); opacity: 0; }
}
`;
document.head.appendChild(style);

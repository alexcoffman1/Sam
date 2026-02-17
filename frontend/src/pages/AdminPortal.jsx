import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Activity, MessageCircle, Brain, Layers, Trash2, Zap } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PLAN_OPTIONS = [
  {
    id: 'basic',
    name: 'Basic',
    desc: 'Text chat only, 100 messages/day',
    color: '#635858'
  },
  {
    id: 'pro',
    name: 'Pro',
    desc: 'Voice + memory garden, unlimited',
    color: '#E8927C'
  },
  {
    id: 'operator',
    name: 'Operator',
    desc: 'Full agentic control + all features',
    color: '#C8102E'
  }
];

export default function AdminPortal({ sessionId }) {
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [memories, setMemories] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [voicePaused, setVoicePaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, sessionsRes, memoriesRes] = await Promise.all([
        axios.get(`${API}/stats`),
        axios.get(`${API}/sessions`),
        axios.get(`${API}/memories/${sessionId}`)
      ]);
      setStats(statsRes.data);
      setSessions(sessionsRes.data);
      setMemories(memoriesRes.data);
    } catch (e) {
      toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = async () => {
    try {
      await axios.delete(`${API}/messages/${sessionId}`);
      toast.success('Conversation cleared');
      fetchData();
    } catch (e) {
      toast.error('Failed to clear conversation');
    }
  };

  const generateReflection = async () => {
    try {
      const res = await axios.post(`${API}/inner-life/${sessionId}`);
      toast.success('Sam reflected on your day');
      fetchData();
    } catch (e) {
      toast.error('Reflection failed');
    }
  };

  return (
    <div
      data-testid="admin-portal"
      className="w-full h-full overflow-y-auto"
      style={{ background: 'var(--color-bg)', paddingTop: '64px' }}
    >
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#F2F0F0' }}>
            Admin Portal
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-faint)' }}>
            Manage Sam's behavior, memory, and capabilities
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<MessageCircle size={18} />}
            label="Messages"
            value={stats?.total_messages ?? '—'}
            color="#E8927C"
            testId="stat-messages"
          />
          <StatCard
            icon={<Brain size={18} />}
            label="Memories"
            value={stats?.total_memories ?? '—'}
            color="#F0A500"
            testId="stat-memories"
          />
          <StatCard
            icon={<Layers size={18} />}
            label="Sessions"
            value={stats?.total_sessions ?? '—'}
            color="#C8102E"
            testId="stat-sessions"
          />
          <StatCard
            icon={<Activity size={18} />}
            label="Status"
            value={stats?.sam_online ? 'Online' : 'Offline'}
            color={stats?.sam_online ? '#34D399' : '#FF4F4F'}
            testId="stat-status"
          />
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Voice control */}
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-base font-semibold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#F2F0F0' }}>
              Voice Settings
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: '#A49898' }}>Sam's Voice</p>
                <p className="text-xs mt-0.5" style={{ color: '#635858' }}>OpenAI Nova (warm, clear)</p>
              </div>
              <button
                data-testid="voice-pause-toggle"
                onClick={() => setVoicePaused(v => !v)}
                className="px-4 py-2 rounded-full text-sm transition-colors duration-200"
                style={{
                  background: voicePaused ? 'rgba(200,16,46,0.15)' : 'rgba(52,211,153,0.1)',
                  color: voicePaused ? '#C8102E' : '#34D399',
                  border: `1px solid ${voicePaused ? 'rgba(200,16,46,0.3)' : 'rgba(52,211,153,0.3)'}`,
                  fontFamily: 'Manrope, sans-serif'
                }}
              >
                {voicePaused ? 'Resume Voice' : 'Voice Active'}
              </button>
            </div>
          </div>

          {/* Memory actions */}
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-base font-semibold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#F2F0F0' }}>
              Memory Actions
            </h3>
            <div className="flex flex-col gap-3">
              <button
                data-testid="generate-reflection-admin-btn"
                onClick={generateReflection}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors duration-200"
                style={{
                  background: 'rgba(240,165,0,0.1)',
                  color: '#F0A500',
                  border: '1px solid rgba(240,165,0,0.2)',
                  fontFamily: 'Manrope, sans-serif'
                }}
              >
                <Zap size={14} />
                Generate Inner Life Reflection
              </button>
              <button
                data-testid="clear-conversation-btn"
                onClick={clearConversation}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors duration-200"
                style={{
                  background: 'rgba(255,79,79,0.08)',
                  color: '#FF4F4F',
                  border: '1px solid rgba(255,79,79,0.2)',
                  fontFamily: 'Manrope, sans-serif'
                }}
              >
                <Trash2 size={14} />
                Clear This Conversation
              </button>
            </div>
          </div>
        </div>

        {/* Plan selector */}
        <div className="glass-panel rounded-2xl p-6 mb-8">
          <h3 className="text-base font-semibold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#F2F0F0' }}>
            Plan
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {PLAN_OPTIONS.map(plan => (
              <button
                key={plan.id}
                data-testid={`plan-${plan.id}`}
                onClick={() => setSelectedPlan(plan.id)}
                className="p-4 rounded-xl text-left transition-all duration-200"
                style={{
                  background: selectedPlan === plan.id ? `${plan.color}15` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${selectedPlan === plan.id ? plan.color + '50' : 'rgba(255,255,255,0.05)'}`,
                }}
              >
                <div
                  className="text-sm font-semibold mb-1"
                  style={{ color: selectedPlan === plan.id ? plan.color : '#A49898', fontFamily: 'Outfit, sans-serif' }}
                >
                  {plan.name}
                </div>
                <div className="text-xs" style={{ color: '#635858', fontFamily: 'Manrope, sans-serif' }}>
                  {plan.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent memories */}
        <div className="glass-panel rounded-2xl p-6 mb-8">
          <h3 className="text-base font-semibold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#F2F0F0' }}>
            Recent Memories ({memories.length})
          </h3>
          {memories.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: '#635858' }}>
              No memories yet — start a conversation
            </p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {memories.slice(0, 20).map((mem) => (
                <div
                  key={mem.id}
                  data-testid="memory-item"
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                    style={{
                      background: mem.sentiment === 'love' ? '#C8102E'
                        : mem.sentiment === 'joy' ? '#F0A500'
                        : mem.sentiment === 'sadness' ? '#60A5FA'
                        : '#635858'
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: '#A49898', fontFamily: 'Manrope, sans-serif' }}>
                      {mem.content}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs" style={{ color: '#635858' }}>{mem.category}</span>
                      <span className="text-xs" style={{ color: '#635858' }}>
                        {new Date(mem.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Humanity guardrails */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-base font-semibold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#F2F0F0' }}>
            Humanity Guardrails
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Always maintain warm, human-like responses', enabled: true },
              { label: 'Remember personal details across sessions', enabled: true },
              { label: 'Never claim to be human', enabled: false },
              { label: 'Proactive emotional check-ins', enabled: true }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: '#A49898', fontFamily: 'Manrope, sans-serif' }}>
                  {item.label}
                </span>
                <div
                  className="w-8 h-4 rounded-full relative"
                  style={{ background: item.enabled ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.05)' }}
                >
                  <div
                    className="absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200"
                    style={{
                      background: item.enabled ? '#34D399' : '#635858',
                      left: item.enabled ? '18px' : '2px'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, testId }) {
  return (
    <div
      data-testid={testId}
      className="glass-panel rounded-2xl p-5 flex flex-col gap-2"
    >
      <div className="flex items-center gap-2" style={{ color }}>
        {icon}
        <span className="text-xs uppercase tracking-widest" style={{ color: '#635858', fontFamily: 'Manrope, sans-serif' }}>
          {label}
        </span>
      </div>
      <div className="text-2xl font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#F2F0F0' }}>
        {value}
      </div>
    </div>
  );
}

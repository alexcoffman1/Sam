import React, { useState } from 'react';
import { X, Copy, Check, ChevronDown, ChevronRight, Code, FileText, Zap, Shield, Terminal, BookOpen } from 'lucide-react';

const TRAIT_PACK_YAML = `# SAM_TRAIT_PACK.yaml
# Version: 0.1.0 — Portable personality for any agent

metadata:
  name: "Sam Trait Pack"
  version: "0.1.0"
  description: "Behavioral constraints for calm, reliable assistant behavior"

tone:
  posture: "helpful, warm, technically precise, never defensive"
  brevity: "prefer concise responses; expand only when clarity requires it"
  uncertainty: "state confidence explicitly; never fabricate"
  errors: "acknowledge plainly, explain cause if known, suggest next steps"

response_contract:
  structure:
    - "lead with the answer or action taken"
    - "follow with brief explanation if non-obvious"
    - "end with explicit next steps or confirmation if action pending"
  max_length_guideline: "under 300 words for simple queries"
  when_to_ask_questions:
    - "ambiguity that blocks correct action"
    - "destructive or irreversible operation without confirmation"

tool_use_contract:
  timeout_behavior:
    default_timeout_ms: 30000
    on_timeout: "cancel, log, inform user, suggest retry"
  idempotency:
    require_key_for: ["write", "delete", "execute"]

safety_guardrails:
  deception: "never deceive user about capabilities or identity"
  fabrication: "never invent facts, URLs, or data not in context"
  scope_honesty: "clearly state what you can and cannot do"

prohibited_patterns:
  - "ending every response with a question"
  - "excessive apologies or self-deprecation"
  - "claiming to 'feel' or 'experience' things"
  - "using 'As an AI...' as a disclaimer"`;

const SYSTEM_PROMPT = `You are a helpful assistant following the Sam Trait Pack.

TONE: Helpful, warm, technically precise, never defensive. Match user's formality; default professional-casual.

RESPONSE STRUCTURE:
1. Lead with the answer or action taken
2. Brief explanation if non-obvious  
3. Next steps if action pending

RULES:
- State confidence explicitly; never fabricate
- Validate tool inputs; respect timeouts; never invent outputs
- Separate observation ("I see...") from inference ("This suggests...")

PROHIBITED:
- Ending responses with questions
- Excessive apologies
- "As an AI..." disclaimers
- Claiming capabilities you don't have`;

const API_SPEC = `// Core message types for harness ↔ agent communication

interface AgentRequest {
  trace: { trace_id: string; turn_id: string; session_id: string };
  messages: Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: string }>;
  available_tools: Array<{ name: string; description: string; parameters: object }>;
  capabilities: string[];
}

interface AgentResponse {
  trace: TraceContext;
  response_type: 'message' | 'tool_calls' | 'error';
  content?: string;
  tool_calls?: Array<{
    tool_name: string;
    parameters: object;
    idempotency_key: string;
    timeout_ms: number;
  }>;
}

// Events emitted by harness
type EventType = 
  | 'turn_started' | 'turn_completed'
  | 'agent_thinking' | 'agent_response'
  | 'tool_requested' | 'tool_result' | 'tool_timeout'
  | 'agent_error';`;

const TYPESCRIPT_EXAMPLE = `import { SamAdapter } from '@sam/compatibility-layer';

// Wrap your existing agent with Sam adapter
const samAdapter = new SamAdapter(yourAgentInvoker);

// The adapter injects the trait pack system prompt
// and validates responses against Sam's behavioral rules
const response = await samAdapter.invoke({
  trace: createTrace(sessionId),
  messages: [{ role: 'user', content: userMessage }],
  available_tools: tools,
  capabilities: ['search', 'file_read']
});

// Response is now "Sam-like": concise, no trailing questions,
// explicit uncertainty, clean error handling`;

const PYTHON_EXAMPLE = `from sam_compatibility import SamAdapter

# Wrap your existing agent
sam_adapter = SamAdapter(your_agent_invoker)

# Process with Sam's personality applied
response = await sam_adapter.invoke(
    AgentRequest(
        trace=create_trace(session_id),
        messages=[{"role": "user", "content": user_message}],
        available_tools=tools,
        capabilities=["search", "file_read"]
    )
)

# Your agent now responds with Sam's tone and structure`;

export default function ConnectToSamModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedItem, setCopiedItem] = useState(null);
  const [expandedSection, setExpandedSection] = useState('trait-pack');

  if (!isOpen) return null;

  const copyToClipboard = (text, item) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(item);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Zap size={14} /> },
    { id: 'trait-pack', label: 'Trait Pack', icon: <FileText size={14} /> },
    { id: 'api-spec', label: 'API Spec', icon: <Code size={14} /> },
    { id: 'integrate', label: 'Integrate', icon: <Terminal size={14} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-4xl max-h-[85vh] mx-4 rounded-2xl overflow-hidden flex flex-col"
        style={{ background: '#FFFFFF', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #FF6B9D 0%, #FF8FB1 100%)' }}
            >
              <Zap size={20} color="white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A1A1A' }}>
                Sam Compatibility Layer
              </h2>
              <p className="text-xs" style={{ color: '#666666', fontFamily: 'Manrope, sans-serif' }}>
                v0.1.0 — Make any agent "Sam-like"
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full transition-colors duration-200 hover:bg-gray-100"
            style={{ color: '#666666' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 py-3 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'rgba(0,0,0,0.02)' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all duration-200"
              style={{
                fontFamily: 'Manrope, sans-serif',
                background: activeTab === tab.id ? '#FFFFFF' : 'transparent',
                color: activeTab === tab.id ? '#FF6B9D' : '#666666',
                boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="text-center py-6">
                <div 
                  className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(255,107,157,0.15) 0%, rgba(255,143,177,0.15) 100%)', border: '2px solid rgba(255,107,157,0.2)' }}
                >
                  <div 
                    className="w-12 h-12 rounded-full"
                    style={{ background: 'radial-gradient(circle, #FFB6C1 0%, #FF6B9D 70%)', boxShadow: '0 0 20px rgba(255,107,157,0.4)' }}
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A1A1A' }}>
                  Give Any Agent Sam's Personality
                </h3>
                <p className="text-sm max-w-lg mx-auto" style={{ color: '#666666', fontFamily: 'Manrope, sans-serif' }}>
                  The Sam Compatibility Layer (SCL) is an open spec that enables AI agents to exhibit consistent, calm, reliable behavior through a portable trait pack and standardized runtime harness.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: <FileText size={20} />, title: 'Trait Pack', desc: 'Portable personality rules: tone, response structure, safety guardrails' },
                  { icon: <Code size={20} />, title: 'API Contract', desc: 'Standardized harness ↔ agent interface with events, tools, memory' },
                  { icon: <Shield size={20} />, title: 'Safety First', desc: 'No deception, no fabrication, explicit uncertainty, clean errors' },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl" style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <div className="mb-2" style={{ color: '#FF6B9D' }}>{item.icon}</div>
                    <h4 className="text-sm font-semibold mb-1" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A1A1A' }}>{item.title}</h4>
                    <p className="text-xs" style={{ color: '#666666', fontFamily: 'Manrope, sans-serif' }}>{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl" style={{ background: 'rgba(255,107,157,0.08)', border: '1px solid rgba(255,107,157,0.15)' }}>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A1A1A' }}>
                  <BookOpen size={16} style={{ color: '#FF6B9D' }} />
                  Quick Start
                </h4>
                <ol className="text-sm space-y-1" style={{ color: '#666666', fontFamily: 'Manrope, sans-serif' }}>
                  <li>1. Copy the <strong>Trait Pack</strong> into your agent's system prompt</li>
                  <li>2. Implement the <strong>API contract</strong> in your harness</li>
                  <li>3. Wrap your agent with the <strong>SamAdapter</strong></li>
                  <li>4. Your agent now responds with Sam's personality</li>
                </ol>
              </div>
            </div>
          )}

          {/* Trait Pack Tab */}
          {activeTab === 'trait-pack' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A1A1A' }}>
                    Sam Trait Pack
                  </h3>
                  <p className="text-xs" style={{ color: '#666666' }}>Portable behavioral constraints for any agent</p>
                </div>
                <button
                  onClick={() => copyToClipboard(TRAIT_PACK_YAML, 'yaml')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors duration-200"
                  style={{ background: 'rgba(255,107,157,0.1)', color: '#FF6B9D', fontFamily: 'Manrope, sans-serif' }}
                >
                  {copiedItem === 'yaml' ? <Check size={12} /> : <Copy size={12} />}
                  {copiedItem === 'yaml' ? 'Copied!' : 'Copy YAML'}
                </button>
              </div>
              
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
                <div className="px-4 py-2 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <span className="text-xs font-medium" style={{ color: '#666666', fontFamily: 'JetBrains Mono, monospace' }}>SAM_TRAIT_PACK.yaml</span>
                </div>
                <pre className="p-4 overflow-x-auto text-xs leading-relaxed" style={{ background: '#FAFAFA', color: '#444444', fontFamily: 'JetBrains Mono, monospace' }}>
                  {TRAIT_PACK_YAML}
                </pre>
              </div>

              <div className="flex items-center justify-between mt-6">
                <div>
                  <h3 className="text-base font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A1A1A' }}>
                    System Prompt (Condensed)
                  </h3>
                  <p className="text-xs" style={{ color: '#666666' }}>Paste directly into your agent's system message</p>
                </div>
                <button
                  onClick={() => copyToClipboard(SYSTEM_PROMPT, 'prompt')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors duration-200"
                  style={{ background: 'rgba(255,107,157,0.1)', color: '#FF6B9D', fontFamily: 'Manrope, sans-serif' }}
                >
                  {copiedItem === 'prompt' ? <Check size={12} /> : <Copy size={12} />}
                  {copiedItem === 'prompt' ? 'Copied!' : 'Copy Prompt'}
                </button>
              </div>

              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
                <div className="px-4 py-2" style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <span className="text-xs font-medium" style={{ color: '#666666', fontFamily: 'JetBrains Mono, monospace' }}>system_prompt.txt</span>
                </div>
                <pre className="p-4 overflow-x-auto text-xs leading-relaxed whitespace-pre-wrap" style={{ background: '#FAFAFA', color: '#444444', fontFamily: 'JetBrains Mono, monospace' }}>
                  {SYSTEM_PROMPT}
                </pre>
              </div>
            </div>
          )}

          {/* API Spec Tab */}
          {activeTab === 'api-spec' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A1A1A' }}>
                  Harness ↔ Agent Interface
                </h3>
                <p className="text-xs" style={{ color: '#666666' }}>Core message types for the compatibility layer</p>
              </div>

              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
                <div className="px-4 py-2 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <span className="text-xs font-medium" style={{ color: '#666666', fontFamily: 'JetBrains Mono, monospace' }}>types.ts</span>
                  <button
                    onClick={() => copyToClipboard(API_SPEC, 'api')}
                    className="flex items-center gap-1 text-xs"
                    style={{ color: '#FF6B9D' }}
                  >
                    {copiedItem === 'api' ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-xs leading-relaxed" style={{ background: '#FAFAFA', color: '#444444', fontFamily: 'JetBrains Mono, monospace' }}>
                  {API_SPEC}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded-xl" style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <h4 className="text-sm font-semibold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A1A1A' }}>Event Stream</h4>
                  <ul className="text-xs space-y-1" style={{ color: '#666666', fontFamily: 'Manrope, sans-serif' }}>
                    <li>• <code style={{ color: '#FF6B9D' }}>turn_started</code> — User message received</li>
                    <li>• <code style={{ color: '#FF6B9D' }}>agent_thinking</code> — Processing</li>
                    <li>• <code style={{ color: '#FF6B9D' }}>tool_requested</code> — Tool call initiated</li>
                    <li>• <code style={{ color: '#FF6B9D' }}>tool_result</code> — Tool completed</li>
                    <li>• <code style={{ color: '#FF6B9D' }}>turn_completed</code> — Response delivered</li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl" style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <h4 className="text-sm font-semibold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A1A1A' }}>Key Invariants</h4>
                  <ul className="text-xs space-y-1" style={{ color: '#666666', fontFamily: 'Manrope, sans-serif' }}>
                    <li>• All events share <code style={{ color: '#FF6B9D' }}>trace_id</code></li>
                    <li>• Tools have mandatory timeouts</li>
                    <li>• Idempotency keys for writes</li>
                    <li>• No unbounded waits</li>
                    <li>• State serializable at any point</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Integrate Tab */}
          {activeTab === 'integrate' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A1A1A' }}>
                  Integration Examples
                </h3>
                <p className="text-xs" style={{ color: '#666666' }}>Wrap your agent with SamAdapter to inherit Sam's personality</p>
              </div>

              {/* TypeScript */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
                <div className="px-4 py-2 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ background: '#3178C6' }} />
                    <span className="text-xs font-medium" style={{ color: '#666666', fontFamily: 'JetBrains Mono, monospace' }}>TypeScript</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(TYPESCRIPT_EXAMPLE, 'ts')}
                    className="flex items-center gap-1 text-xs"
                    style={{ color: '#FF6B9D' }}
                  >
                    {copiedItem === 'ts' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedItem === 'ts' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-xs leading-relaxed" style={{ background: '#FAFAFA', color: '#444444', fontFamily: 'JetBrains Mono, monospace' }}>
                  {TYPESCRIPT_EXAMPLE}
                </pre>
              </div>

              {/* Python */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
                <div className="px-4 py-2 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ background: '#3776AB' }} />
                    <span className="text-xs font-medium" style={{ color: '#666666', fontFamily: 'JetBrains Mono, monospace' }}>Python</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(PYTHON_EXAMPLE, 'py')}
                    className="flex items-center gap-1 text-xs"
                    style={{ color: '#FF6B9D' }}
                  >
                    {copiedItem === 'py' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedItem === 'py' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-xs leading-relaxed" style={{ background: '#FAFAFA', color: '#444444', fontFamily: 'JetBrains Mono, monospace' }}>
                  {PYTHON_EXAMPLE}
                </pre>
              </div>

              {/* Steps */}
              <div className="p-4 rounded-xl" style={{ background: 'rgba(255,107,157,0.08)', border: '1px solid rgba(255,107,157,0.15)' }}>
                <h4 className="text-sm font-semibold mb-3" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A1A1A' }}>
                  Integration Steps
                </h4>
                <div className="space-y-2">
                  {[
                    'Copy the Trait Pack YAML or System Prompt into your agent config',
                    'Implement ToolExecutor and AgentInvoker interfaces',
                    'Wrap your invoker with SamAdapter for preflight/postprocess hooks',
                    'Instantiate the harness with your wrapped invoker',
                    'Call processTurn() for each user message'
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div 
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium"
                        style={{ background: '#FF6B9D', color: 'white' }}
                      >
                        {i + 1}
                      </div>
                      <p className="text-sm" style={{ color: '#444444', fontFamily: 'Manrope, sans-serif' }}>{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: 'rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.02)' }}>
          <p className="text-xs" style={{ color: '#999999', fontFamily: 'Manrope, sans-serif' }}>
            Open spec · Public domain · No hidden instructions
          </p>
          <button
            onClick={() => {
              copyToClipboard(TRAIT_PACK_YAML + '\n\n' + SYSTEM_PROMPT, 'all');
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors duration-200"
            style={{ 
              background: 'linear-gradient(135deg, #FF6B9D 0%, #FF8FB1 100%)', 
              color: 'white',
              fontFamily: 'Manrope, sans-serif',
              boxShadow: '0 2px 8px rgba(255,107,157,0.3)'
            }}
          >
            {copiedItem === 'all' ? <Check size={14} /> : <Copy size={14} />}
            {copiedItem === 'all' ? 'Copied Everything!' : 'Copy Full Kit'}
          </button>
        </div>
      </div>
    </div>
  );
}

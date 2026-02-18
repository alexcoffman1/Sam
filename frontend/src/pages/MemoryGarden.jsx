import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import { RefreshCw, Plus, BookOpen, X, Volume2, Search, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SENTIMENT_COLORS = {
  love:      { fill: '#C8102E', label: 'love' },
  joy:       { fill: '#F0A500', label: 'joy' },
  sadness:   { fill: '#60A5FA', label: 'sadness' },
  curiosity: { fill: '#E8927C', label: 'curiosity' },
  neutral:   { fill: '#7a6060', label: 'neutral' },
};

const CATEGORY_META = {
  person:     { symbol: '●', color: '#E8927C', label: 'People'      },
  event:      { symbol: '◆', color: '#F0A500', label: 'Events'      },
  feeling:    { symbol: '♡', color: '#C8102E', label: 'Feelings'    },
  preference: { symbol: '★', color: '#60A5FA', label: 'Preferences' },
  thought:    { symbol: '◎', color: '#A49898', label: 'Thoughts'    },
};

/* ─── draw a flower node on canvas ─── */
function drawFlower(ctx, x, y, r, color, petals, t) {
  petals = petals || 6;
  t = t || 0;
  const pulse = 1 + Math.sin(t + x * 0.01) * 0.06;
  const pr = r * pulse;

  // Outer glow — use globalAlpha to avoid rgba strings entirely
  const prev = ctx.globalAlpha;
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, pr * 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.arc(x, y, pr * 2.0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = prev;

  // Petals
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(t * 0.15);
  ctx.globalAlpha = 0.65;
  ctx.fillStyle = color;
  for (let i = 0; i < petals; i++) {
    const angle = (i / petals) * Math.PI * 2;
    const px = Math.cos(angle) * pr * 1.4;
    const py = Math.sin(angle) * pr * 1.4;
    ctx.beginPath();
    ctx.ellipse(px * 0.6, py * 0.6, pr * 0.7, pr * 0.45, angle, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = prev;
  ctx.restore();

  // Core circle — solid, no gradient
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, pr, 0, Math.PI * 2);
  ctx.fill();

  // Highlight dot
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - pr * 0.25, y - pr * 0.25, pr * 0.38, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = prev;
}

/* ─── draw a hub node (category) ─── */
function drawHub(ctx, x, y, r, color, label, t) {
  t = t || 0;
  const pulse = 1 + Math.sin(t * 0.5 + x) * 0.04;
  const pr = r * pulse;
  const prev = ctx.globalAlpha;

  // Outer rings
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x, y, pr * 2.2, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 0.22;
  ctx.beginPath(); ctx.arc(x, y, pr * 1.6, 0, Math.PI * 2); ctx.stroke();

  // Fill
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, pr, 0, Math.PI * 2); ctx.fill();

  ctx.globalAlpha = prev;

  // Label
  ctx.fillStyle = '#F2F0F0';
  ctx.font = 'bold 11px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label.toUpperCase(), x, y);
}

/* ─── draw curved vine link ─── */
function drawVine(ctx, sx, sy, tx, ty, color) {
  const mx = (sx + tx) / 2 + (Math.random() * 20 - 10);
  const my = (sy + ty) / 2 + (Math.random() * 20 - 10);
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.quadraticCurveTo(mx, my, tx, ty);
  ctx.strokeStyle = color + '30';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 5]);
  ctx.stroke();
  ctx.setLineDash([]);
}

export default function MemoryGarden({ sessionId }) {
  const [memories, setMemories]         = useState([]);
  const [graphData, setGraphData]       = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode]   = useState(null);
  const [isLoading, setIsLoading]       = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary]           = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [filterCat, setFilterCat]       = useState('all');
  const [filterSentiment, setFilterSentiment] = useState('all');
  const [searchTerm, setSearchTerm]     = useState('');
  const [sidebarOpen, setSidebarOpen]   = useState(true);

  const audioRef   = useRef(null);
  const canvasRef  = useRef(null);
  const animRef    = useRef(null);
  const nodesRef   = useRef([]);
  const linksRef   = useRef([]);

  /* ── fetch data ── */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [graphRes, memRes] = await Promise.all([
        axios.get(`${API}/memories/${sessionId}/graph`),
        axios.get(`${API}/memories/${sessionId}`)
      ]);
      setGraphData(graphRes.data);
      setMemories(memRes.data);
    } catch (e) {
      toast.error('Could not load memory garden');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── stats derived ── */
  const stats = useMemo(() => {
    const byCat = {}; const bySent = {};
    memories.forEach(m => {
      byCat[m.category]  = (byCat[m.category]  || 0) + 1;
      bySent[m.sentiment] = (bySent[m.sentiment] || 0) + 1;
    });
    return { byCat, bySent, total: memories.length };
  }, [memories]);

  /* ── filtered sidebar list ── */
  const filteredMemories = useMemo(() => {
    return memories.filter(m => {
      if (filterCat !== 'all' && m.category !== filterCat) return false;
      if (filterSentiment !== 'all' && m.sentiment !== filterSentiment) return false;
      if (searchTerm && !m.content.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [memories, filterCat, filterSentiment, searchTerm]);

  /* ── initialise node positions ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || graphData.nodes.length === 0) return;
    const W = canvas.offsetWidth || 900;
    const H = canvas.offsetHeight || 600;

    nodesRef.current = graphData.nodes.map((node, i) => {
      const existing = nodesRef.current.find(n => n.id === node.id);
      if (existing) return { ...node, x: existing.x, y: existing.y, vx: 0, vy: 0 };
      const angle = (i / graphData.nodes.length) * Math.PI * 2;
      const r = node.type === 'category' ? 60 : 100 + Math.random() * 180;
      return { ...node, x: W / 2 + Math.cos(angle) * r, y: H / 2 + Math.sin(angle) * r, vx: 0, vy: 0 };
    });
    linksRef.current = graphData.links;
  }, [graphData]);

  /* ── physics + draw loop ── */
  useEffect(() => {
    let t = 0;
    const simulate = () => {
      const nodes = nodesRef.current;
      const links = linksRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const W = canvas.offsetWidth || 900;
      const H = canvas.offsetHeight || 600;
      canvas.width  = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      t += 0.016;

      /* physics */
      const cx = W / 2, cy = H / 2;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.vx += (cx - n.x) * 0.0015;
        n.vy += (cy - n.y) * 0.0015;
        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j];
          const dx = n.x - m.x, dy = n.y - m.y;
          const dist = Math.sqrt(dx*dx + dy*dy) || 1;
          const ideal = n.type === 'category' || m.type === 'category' ? 90 : 70;
          if (dist < ideal) {
            const f = (ideal - dist) / dist * 0.6;
            n.vx += dx*f; n.vy += dy*f; m.vx -= dx*f; m.vy -= dy*f;
          }
        }
        links.forEach(lk => {
          const src = nodes.find(x => x.id === lk.source);
          const tgt = nodes.find(x => x.id === lk.target);
          if (!src || !tgt) return;
          const dx = tgt.x - src.x, dy = tgt.y - src.y;
          const dist = Math.sqrt(dx*dx + dy*dy) || 1;
          const target = 120;
          const f = (dist - target) / dist * 0.025;
          src.vx += dx*f; src.vy += dy*f;
          tgt.vx -= dx*f; tgt.vy -= dy*f;
        });
        n.vx *= 0.82; n.vy *= 0.82;
        n.x  = Math.max(40, Math.min(W - 40, n.x + n.vx));
        n.y  = Math.max(40, Math.min(H - 40, n.y + n.vy));
      }

      /* draw */
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H);

      // Subtle grid
      ctx.strokeStyle = 'rgba(0,0,0,0.04)'; ctx.lineWidth = 1;
      for (let gx = 0; gx < W; gx += 60) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (let gy = 0; gy < H; gy += 60) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

      // Vines / links
      links.forEach(lk => {
        const src = nodes.find(n => n.id === lk.source);
        const tgt = nodes.find(n => n.id === lk.target);
        if (!src || !tgt) return;
        const sc = SENTIMENT_COLORS[tgt.sentiment] || SENTIMENT_COLORS.neutral;
        drawVine(ctx, src.x, src.y, tgt.x, tgt.y, sc.fill);
      });

      // Nodes
      nodes.forEach(node => {
        const isSelected = selectedNode?.id === node.id;
        const isHovered  = hoveredNode?.id  === node.id;
        const sc = SENTIMENT_COLORS[node.sentiment] || SENTIMENT_COLORS.neutral;
        const cat = CATEGORY_META[node.category] || {};

        if (node.type === 'category') {
          const color = cat.color || '#A49898';
          drawHub(ctx, node.x, node.y, (node.size || 18) * (isHovered ? 1.3 : 1), color, node.label || '', t);
        } else {
          const petals = node.category === 'feeling' ? 8 : node.category === 'person' ? 5 : 6;
          const r = (node.size || 9) * (isSelected ? 1.5 : isHovered ? 1.3 : 1);
          drawFlower(ctx, node.x, node.y, r, sc.fill, petals, t);

          // Selection ring
          if (isSelected) {
            ctx.beginPath(); ctx.arc(node.x, node.y, r * 2.2, 0, Math.PI * 2);
            ctx.strokeStyle = sc.fill + 'aa'; ctx.lineWidth = 2; ctx.stroke();
          }

          // Label on hover / selected
          if (isHovered || isSelected) {
            const label = node.label || '';
            ctx.font = '10px Manrope, sans-serif';
            const tw = ctx.measureText(label).width;
            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            ctx.beginPath();
            ctx.roundRect(node.x - tw/2 - 6, node.y + r * 2.4, tw + 12, 18, 4);
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = '#1A1A1A';
            ctx.textAlign = 'center';
            ctx.fillText(label, node.x, node.y + r * 2.4 + 13);
          }
        }
      });

      // Floating count badge top-right of canvas
      ctx.font = '11px Manrope, sans-serif';
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.textAlign = 'right';
      ctx.fillText(`${nodes.filter(n => n.type !== 'category').length} memories`, W - 12, 20);

      animRef.current = requestAnimationFrame(simulate);
    };

    animRef.current = requestAnimationFrame(simulate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [graphData, selectedNode, hoveredNode]);

  /* ── canvas interaction ── */
  const getNodeAtPoint = useCallback((x, y) => {
    return nodesRef.current.find(n => {
      const dx = n.x - x, dy = n.y - y;
      const r = (n.size || 9) * 2.5;
      return Math.sqrt(dx*dx + dy*dy) < r;
    }) || null;
  }, []);

  const handleCanvasClick = useCallback(e => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const hit = getNodeAtPoint(e.clientX - rect.left, e.clientY - rect.top);
    setSelectedNode(hit?.type !== 'category' ? hit : null);
  }, [getNodeAtPoint]);

  const handleCanvasMove = useCallback(e => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const hit = getNodeAtPoint(e.clientX - rect.left, e.clientY - rect.top);
    setHoveredNode(hit);
    if (canvasRef.current) canvasRef.current.style.cursor = hit ? 'pointer' : 'default';
  }, [getNodeAtPoint]);

  /* ── actions ── */
  const generateInnerLife = useCallback(async () => {
    setIsGenerating(true);
    try {
      await axios.post(`${API}/inner-life/${sessionId}`);
      toast.success('Sam reflected...');
      await fetchData();
    } catch { toast.error('Reflection failed'); }
    finally { setIsGenerating(false); }
  }, [sessionId, fetchData]);

  const summarizeGarden = useCallback(async () => {
    setIsSummarizing(true); setSummary(null);
    try {
      const res = await axios.get(`${API}/memories/${sessionId}/summary`);
      setSummary(res.data);
    } catch { toast.error('Summary failed'); }
    finally { setIsSummarizing(false); }
  }, [sessionId]);

  const playSummaryAudio = useCallback(async () => {
    if (!summary?.summary) return;
    if (audioRef.current) {
      audioRef.current.pause(); audioRef.current = null; setIsPlayingAudio(false); return;
    }
    setIsPlayingAudio(true);
    try {
      const res = await axios.post(`${API}/tts`,
        { text: summary.summary, session_id: sessionId, emotion: 'affectionate' },
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(res.data);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setIsPlayingAudio(false); audioRef.current = null; URL.revokeObjectURL(url); };
      audio.onerror = () => { setIsPlayingAudio(false); audioRef.current = null; };
      await audio.play();
    } catch { setIsPlayingAudio(false); toast.error('Voice playback failed'); }
  }, [summary, sessionId]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ background: '#FFFFFF', paddingTop: '64px' }}>

      {/* ── Top bar ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A1A1A' }}>
              Memory Garden
            </h2>
            <p className="text-xs" style={{ color: '#666666' }}>
              {stats.total} memories · {Object.keys(stats.byCat).length} categories
            </p>
          </div>

          {/* Category pill filters */}
          <div className="hidden md:flex items-center gap-1.5">
            <FilterPill label="All" active={filterCat === 'all'} onClick={() => setFilterCat('all')} />
            {Object.entries(CATEGORY_META).map(([k, v]) => (
              stats.byCat[k] ? (
                <FilterPill key={k} label={`${v.symbol} ${v.label}`} count={stats.byCat[k]}
                  active={filterCat === k} color={v.color} onClick={() => setFilterCat(filterCat === k ? 'all' : k)} />
              ) : null
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button data-testid="summarize-garden-btn" onClick={summarizeGarden} disabled={isSummarizing}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all duration-200"
            style={{ background: 'rgba(0,0,0,0.04)', color: isSummarizing ? '#CCCCCC' : '#1A1A1A', border: '1px solid rgba(0,0,0,0.08)', fontFamily: 'Manrope, sans-serif' }}>
            <BookOpen size={14} />
            {isSummarizing ? 'Reflecting...' : 'What do you remember?'}
          </button>
          <button data-testid="generate-reflection-btn" onClick={generateInnerLife} disabled={isGenerating}
            className="flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-all duration-200"
            style={{ background: 'rgba(255,107,157,0.1)', color: isGenerating ? '#CCCCCC' : '#FF6B9D', border: '1px solid rgba(255,107,157,0.2)', fontFamily: 'Manrope, sans-serif' }}>
            <Plus size={14} />
            {isGenerating ? '...' : 'Inner Life'}
          </button>
          <button data-testid="refresh-garden-btn" onClick={fetchData} disabled={isLoading}
            className="p-2 rounded-full transition-colors duration-200"
            style={{ color: isLoading ? '#CCCCCC' : '#666666', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Sam summary panel ── */}
      {(summary || isSummarizing) && (
        <div data-testid="garden-summary-panel"
          className="flex-shrink-0 mx-4 mt-3 glass-panel rounded-xl px-5 py-4 message-enter flex items-start gap-4">
          {isSummarizing ? (
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5"><div className="typing-dot"/><div className="typing-dot"/><div className="typing-dot"/></div>
              <span className="text-sm" style={{ color: '#666666', fontFamily: 'Manrope, sans-serif' }}>Sam is looking through her garden...</span>
            </div>
          ) : summary && (<>
            <div className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5"
              style={{ background: 'radial-gradient(circle, #FFB6C1, #FF6B9D)', boxShadow: '0 0 12px rgba(255,107,157,0.4)' }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase tracking-widest" style={{ color: '#666666', fontFamily: 'Manrope, sans-serif' }}>
                  sam · {summary.memory_count} memories
                </span>
                {(summary.categories || []).map(c => (
                  <span key={c} className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(0,0,0,0.05)', color: CATEGORY_META[c]?.color || '#666666', fontFamily: 'Manrope, sans-serif' }}>
                    {CATEGORY_META[c]?.symbol} {c}
                  </span>
                ))}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#1A1A1A', fontFamily: 'Manrope, sans-serif' }}>{summary.summary}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button data-testid="play-summary-audio-btn" onClick={playSummaryAudio}
                className="p-1.5 rounded-full transition-colors duration-200"
                style={{ color: isPlayingAudio ? '#FF6B9D' : '#999999' }} title="Hear Sam say this">
                <Volume2 size={14} />
              </button>
              <button data-testid="close-summary-btn"
                onClick={() => { setSummary(null); audioRef.current?.pause(); audioRef.current = null; setIsPlayingAudio(false); }}
                className="p-1.5 rounded-full" style={{ color: '#999999' }}>
                <X size={14} />
              </button>
            </div>
          </>)}
        </div>
      )}

      {/* ── Main body: canvas + sidebar ── */}
      <div className="flex-1 flex overflow-hidden gap-0 min-h-0">

        {/* Canvas */}
        <div className="relative flex-1 min-w-0 m-3 mr-0 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
          {memories.length === 0 && !isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: '#FFFFFF' }}>
              <div className="text-5xl mb-4" style={{ color: '#E0E0E0' }}>◎</div>
              <p className="text-sm" style={{ color: '#999999', fontFamily: 'Manrope, sans-serif' }}>
                start a conversation — every memory blooms here
              </p>
            </div>
          ) : (
            <canvas
              data-testid="memory-canvas"
              ref={canvasRef}
              className="w-full h-full block"
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMove}
              onMouseLeave={() => setHoveredNode(null)}
            />
          )}

          {/* Selected node detail card */}
          {selectedNode && (
            <div data-testid="selected-node-info"
              className="absolute bottom-4 left-4 glass-panel rounded-xl p-4 message-enter"
              style={{ maxWidth: 320, minWidth: 220 }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span style={{ color: SENTIMENT_COLORS[selectedNode.sentiment]?.fill || '#999999', fontSize: 12 }}>
                      {CATEGORY_META[selectedNode.category]?.symbol || '●'}
                    </span>
                    <span className="text-xs uppercase tracking-widest" style={{ color: '#666666', fontFamily: 'Manrope, sans-serif' }}>
                      {selectedNode.category} · {selectedNode.sentiment}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#1A1A1A', fontFamily: 'Manrope, sans-serif' }}>
                    {selectedNode.full_content || selectedNode.label}
                  </p>
                  {selectedNode.timestamp && (
                    <p className="text-xs mt-2" style={{ color: '#999999' }}>
                      {new Date(selectedNode.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <button onClick={() => setSelectedNode(null)} style={{ color: '#999999', flexShrink: 0 }}>
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Sentiment legend — bottom right of canvas */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
            {Object.entries(SENTIMENT_COLORS).map(([s, c]) =>
              stats.bySent[s] ? (
                <button key={s}
                  onClick={() => setFilterSentiment(filterSentiment === s ? 'all' : s)}
                  className="flex items-center gap-1.5 text-xs transition-opacity duration-200"
                  style={{ opacity: filterSentiment !== 'all' && filterSentiment !== s ? 0.3 : 1 }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.fill, boxShadow: `0 0 5px ${c.fill}` }} />
                  <span style={{ color: '#666666', fontFamily: 'Manrope, sans-serif' }}>{s}</span>
                  <span style={{ color: '#999999', fontFamily: 'Manrope, sans-serif' }}>({stats.bySent[s]})</span>
                </button>
              ) : null
            )}
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="flex-shrink-0 flex flex-col overflow-hidden m-3 ml-2 rounded-2xl glass-panel"
          style={{ width: sidebarOpen ? 280 : 36, transition: 'width 0.3s ease', border: '1px solid rgba(0,0,0,0.08)' }}>

          {/* Sidebar toggle */}
          <button onClick={() => setSidebarOpen(v => !v)}
            className="flex items-center justify-between px-3 py-3 flex-shrink-0 transition-colors duration-200"
            style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', color: '#666666' }}>
            {sidebarOpen && <span className="text-xs uppercase tracking-widest" style={{ fontFamily: 'Manrope, sans-serif', color: '#666666' }}>Memories</span>}
            <ChevronDown size={14} style={{ transform: sidebarOpen ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 0.3s' }} />
          </button>

          {sidebarOpen && (<>
            {/* Search */}
            <div className="px-3 pt-3 pb-2 flex-shrink-0">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}>
                <Search size={12} style={{ color: '#999999', flexShrink: 0 }} />
                <input
                  data-testid="memory-search-input"
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="search memories..."
                  className="bg-transparent outline-none w-full"
                  style={{ fontSize: 12, color: '#1A1A1A', fontFamily: 'Manrope, sans-serif' }}
                />
                {searchTerm && <button onClick={() => setSearchTerm('')}><X size={10} style={{ color: '#999999' }} /></button>}
              </div>
            </div>

            {/* Stats bars */}
            <div className="px-3 pb-3 flex-shrink-0">
              <div className="space-y-1.5">
                {Object.entries(CATEGORY_META).map(([k, v]) => {
                  const count = stats.byCat[k] || 0;
                  if (!count) return null;
                  const pct = stats.total ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={k} className="flex items-center gap-2">
                      <span style={{ color: v.color, fontSize: 10, width: 10, flexShrink: 0 }}>{v.symbol}</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: v.color, opacity: 0.8 }} />
                      </div>
                      <span style={{ color: '#666666', fontSize: 10, fontFamily: 'Manrope, sans-serif', minWidth: 16, textAlign: 'right' }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Memory list */}
            <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1.5" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              {filteredMemories.length === 0 ? (
                <p className="text-xs text-center pt-6" style={{ color: '#999999', fontFamily: 'Manrope, sans-serif' }}>
                  {searchTerm ? 'no matches' : 'no memories yet'}
                </p>
              ) : filteredMemories.map(mem => (
                <button key={mem.id}
                  data-testid="memory-list-item"
                  onClick={() => {
                    const node = nodesRef.current.find(n => n.id === mem.id);
                    setSelectedNode(node || null);
                  }}
                  className="w-full text-left p-2.5 rounded-lg transition-colors duration-150 group"
                  style={{
                    background: selectedNode?.id === mem.id ? 'rgba(255,107,157,0.1)' : 'rgba(0,0,0,0.02)',
                    border: `1px solid ${selectedNode?.id === mem.id ? 'rgba(255,107,157,0.25)' : 'rgba(0,0,0,0.06)'}`,
                    marginTop: '6px'
                  }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span style={{ color: CATEGORY_META[mem.category]?.color || '#999999', fontSize: 9 }}>
                      {CATEGORY_META[mem.category]?.symbol}
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: SENTIMENT_COLORS[mem.sentiment]?.fill || '#999999' }} />
                    <span className="text-xs" style={{ color: '#999999', fontFamily: 'Manrope, sans-serif' }}>
                      {new Date(mem.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed line-clamp-2"
                    style={{ color: selectedNode?.id === mem.id ? '#1A1A1A' : '#666666', fontFamily: 'Manrope, sans-serif' }}>
                    {mem.content}
                  </p>
                </button>
              ))}
            </div>
          </>)}
        </div>
      </div>
    </div>
  );
}

/* ── Helper components ── */
function FilterPill({ label, count, active, color, onClick }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1 px-3 py-1 rounded-full text-xs transition-all duration-200"
      style={{
        background: active ? (color ? `${color}18` : 'rgba(200,16,46,0.15)') : 'rgba(255,255,255,0.03)',
        color: active ? (color || '#E8927C') : '#635858',
        border: `1px solid ${active ? (color ? color + '40' : 'rgba(200,16,46,0.3)') : 'rgba(255,255,255,0.06)'}`,
        fontFamily: 'Manrope, sans-serif'
      }}>
      {label}
      {count !== undefined && <span style={{ color: active ? (color || '#E8927C') : '#3a2828' }}>({count})</span>}
    </button>
  );
}

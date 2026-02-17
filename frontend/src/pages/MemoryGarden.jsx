import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { RefreshCw, Plus } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SENTIMENT_COLORS = {
  love: '#C8102E',
  joy: '#F0A500',
  sadness: '#60A5FA',
  curiosity: '#E8927C',
  neutral: '#635858'
};

const CATEGORY_SHAPES = {
  person: '●',
  event: '◆',
  feeling: '♡',
  preference: '★',
  thought: '◎'
};

export default function MemoryGarden({ sessionId }) {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const nodesRef = useRef([]);
  const [tick, setTick] = useState(0);

  const fetchGraph = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API}/memories/${sessionId}/graph`);
      setGraphData(res.data);
    } catch (e) {
      toast.error('Could not load memory garden');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  // Initialize physics simulation positions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || graphData.nodes.length === 0) return;
    const W = canvas.offsetWidth || 800;
    const H = canvas.offsetHeight || 600;

    const positioned = graphData.nodes.map((node, i) => {
      const existing = nodesRef.current.find(n => n.id === node.id);
      if (existing) return { ...node, x: existing.x, y: existing.y, vx: existing.vx || 0, vy: existing.vy || 0 };
      const angle = (i / graphData.nodes.length) * Math.PI * 2;
      const r = node.type === 'category' ? 80 : 120 + Math.random() * 100;
      return {
        ...node,
        x: W / 2 + Math.cos(angle) * r,
        y: H / 2 + Math.sin(angle) * r,
        vx: 0,
        vy: 0
      };
    });
    nodesRef.current = positioned;
    setTick(t => t + 1);
  }, [graphData]);

  // Physics tick
  useEffect(() => {
    const simulate = () => {
      const nodes = nodesRef.current;
      if (!nodes.length) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const W = canvas.offsetWidth || 800;
      const H = canvas.offsetHeight || 600;
      const cx = W / 2, cy = H / 2;

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        // Center gravity
        n.vx += (cx - n.x) * 0.002;
        n.vy += (cy - n.y) * 0.002;

        // Repulsion
        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j];
          const dx = n.x - m.x;
          const dy = n.y - m.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = 60;
          if (dist < minDist) {
            const f = (minDist - dist) / dist * 0.5;
            n.vx += dx * f;
            n.vy += dy * f;
            m.vx -= dx * f;
            m.vy -= dy * f;
          }
        }

        // Spring forces along links
        graphData.links.forEach(link => {
          const src = nodes.find(n => n.id === link.source);
          const tgt = nodes.find(n => n.id === link.target);
          if (!src || !tgt) return;
          const dx = tgt.x - src.x;
          const dy = tgt.y - src.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const target = 100;
          const f = (dist - target) / dist * 0.03;
          src.vx += dx * f;
          src.vy += dy * f;
          tgt.vx -= dx * f;
          tgt.vy -= dy * f;
        });

        // Damping
        n.vx *= 0.85;
        n.vy *= 0.85;
        n.x += n.vx;
        n.y += n.vy;

        // Boundary
        n.x = Math.max(30, Math.min(W - 30, n.x));
        n.y = Math.max(30, Math.min(H - 30, n.y));
      }

      // Draw
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = '#090505';
      ctx.fillRect(0, 0, W, H);

      // Links
      graphData.links.forEach(link => {
        const src = nodes.find(n => n.id === link.source);
        const tgt = nodes.find(n => n.id === link.target);
        if (!src || !tgt) return;
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = 'rgba(163,88,88,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Nodes
      const now = Date.now();
      nodes.forEach(node => {
        const color = SENTIMENT_COLORS[node.sentiment] || '#635858';
        const size = (node.size || 10) * (node.type === 'category' ? 1.4 : 1);
        const pulse = 1 + Math.sin(now / 1000 + node.x) * 0.08;

        // Glow
        const grd = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, size * 2.5 * pulse);
        grd.addColorStop(0, color + '55');
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(node.x, node.y, size * 2.5 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, size * pulse, 0, Math.PI * 2);
        ctx.fillStyle = node === selectedNode ? '#F2F0F0' : color;
        ctx.fill();
        if (node.type === 'category') {
          ctx.strokeStyle = color + 'aa';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Label
        ctx.fillStyle = 'rgba(242,240,240,0.7)';
        ctx.font = node.type === 'category' ? '11px Outfit, sans-serif' : '9px Manrope, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.label?.slice(0, 18) || '', node.x, node.y + size * pulse + 12);
      });

      animRef.current = requestAnimationFrame(simulate);
    };

    animRef.current = requestAnimationFrame(simulate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [graphData, selectedNode]);

  // Canvas click handler
  const handleCanvasClick = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hit = nodesRef.current.find(n => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) < (n.size || 10) * 2;
    });
    setSelectedNode(hit || null);
  }, []);

  const generateInnerLife = useCallback(async () => {
    setIsGenerating(true);
    try {
      const res = await axios.post(`${API}/inner-life/${sessionId}`);
      toast.success('Sam reflected...');
      await fetchGraph();
    } catch (e) {
      toast.error('Reflection failed');
    } finally {
      setIsGenerating(false);
    }
  }, [sessionId, fetchGraph]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden" style={{ background: 'var(--color-bg)', paddingTop: '64px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 flex-shrink-0">
        <div>
          <h2 className="text-xl font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#F2F0F0' }}>
            Memory Garden
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-faint)' }}>
            {graphData.nodes.length} memories blooming
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            data-testid="generate-reflection-btn"
            onClick={generateInnerLife}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm glass-panel transition-colors duration-200"
            style={{ color: isGenerating ? '#635858' : '#E8927C', fontFamily: 'Manrope, sans-serif' }}
          >
            <Plus size={14} />
            {isGenerating ? 'Reflecting...' : 'Inner Life'}
          </button>
          <button
            data-testid="refresh-garden-btn"
            onClick={fetchGraph}
            disabled={isLoading}
            className="p-2 rounded-full glass-panel transition-colors duration-200"
            style={{ color: isLoading ? '#635858' : '#A49898' }}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative flex-1 mx-4 mb-4 rounded-2xl overflow-hidden glass-panel">
        {graphData.nodes.length === 0 && !isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ color: 'var(--color-text-muted)' }}>
            <div className="text-4xl mb-4" style={{ color: '#635858' }}>◎</div>
            <p className="text-sm" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Start a conversation to grow your memory garden
            </p>
          </div>
        ) : (
          <canvas
            data-testid="memory-canvas"
            ref={canvasRef}
            style={{ width: '100%', height: '100%', display: 'block' }}
            width={1200}
            height={700}
            onClick={handleCanvasClick}
          />
        )}

        {/* Selected node info */}
        {selectedNode && (
          <div
            data-testid="selected-node-info"
            className="absolute bottom-4 left-4 right-4 glass-panel rounded-xl p-4"
            style={{ maxWidth: 400 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ color: SENTIMENT_COLORS[selectedNode.sentiment] || '#635858' }}>
                    {CATEGORY_SHAPES[selectedNode.category] || '●'}
                  </span>
                  <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-faint)' }}>
                    {selectedNode.category || selectedNode.type}
                  </span>
                </div>
                <p className="text-sm" style={{ color: '#F2F0F0', fontFamily: 'Manrope, sans-serif' }}>
                  {selectedNode.label}
                </p>
                {selectedNode.timestamp && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>
                    {new Date(selectedNode.timestamp).toLocaleDateString()}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-sm"
                style={{ color: 'var(--color-text-faint)' }}
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pb-4 flex-shrink-0">
        {Object.entries(SENTIMENT_COLORS).map(([sentiment, color]) => (
          <div key={sentiment} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-xs" style={{ color: 'var(--color-text-faint)', fontFamily: 'Manrope, sans-serif' }}>
              {sentiment}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

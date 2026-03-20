import { useEffect, useRef, useState, useCallback } from 'react';
import type { GraphData } from '../lib/graph';

interface Props {
  data: GraphData;
  currentSlug?: string;
  compact?: boolean;
}

interface SimNode {
  id: string;
  label: string;
  group: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  isCurrent: boolean;
}

interface SimEdge {
  source: string;
  target: string;
}

const GROUP_COLORS = [
  '#89b4fa', '#a6e3a1', '#fab387', '#cba6f7',
  '#f38ba8', '#f9e2af', '#89dceb', '#94e2d5',
];

function useForceLayout(nodes: SimNode[], edges: SimEdge[], width: number, height: number) {
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (nodes.length === 0) return;

    // Initialize
    const nodeMap = new Map<string, SimNode>();
    for (const n of nodes) {
      n.x = Math.random() * width;
      n.y = Math.random() * height;
      n.vx = 0;
      n.vy = 0;
      nodeMap.set(n.id, n);
    }

    const K = 0.01;
    const REPULSION = 800;
    const DAMPING = 0.7;
    const CENTER_FORCE = 0.02;

    let tick = 0;
    const MAX_TICKS = 200;

    function step() {
      if (tick >= MAX_TICKS) return;
      tick++;

      // Repulsion — scale by node size so larger nodes push more
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = b.x - a.x || 0.1;
          const dy = b.y - a.y || 0.1;
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
          const force = (REPULSION * (a.r + b.r) / 12) / (dist * dist);
          a.vx -= (dx / dist) * force;
          a.vy -= (dy / dist) * force;
          b.vx += (dx / dist) * force;
          b.vy += (dy / dist) * force;
        }
      }

      // Attraction along edges
      for (const e of edges) {
        const a = nodeMap.get(e.source), b = nodeMap.get(e.target);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
        const ideal = 120;
        const force = (dist - ideal) * K;
        a.vx += (dx / dist) * force;
        a.vy += (dy / dist) * force;
        b.vx -= (dx / dist) * force;
        b.vy -= (dy / dist) * force;
      }

      // Center force
      for (const n of nodes) {
        n.vx += (width / 2 - n.x) * CENTER_FORCE;
        n.vy += (height / 2 - n.y) * CENTER_FORCE;
        n.vx *= DAMPING;
        n.vy *= DAMPING;
        n.x += n.vx;
        n.y += n.vy;
        n.x = Math.max(20, Math.min(width - 20, n.x));
        n.y = Math.max(20, Math.min(height - 20, n.y));
      }

      const pos = new Map<string, { x: number; y: number }>();
      for (const n of nodes) pos.set(n.id, { x: n.x, y: n.y });
      setPositions(new Map(pos));

      frameRef.current = requestAnimationFrame(step);
    }

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [nodes.length, edges.length, width, height]); // eslint-disable-line

  return positions;
}

export default function GraphView({ data, currentSlug, compact = false }: Props) {
  const containerRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: compact ? 280 : 800, h: compact ? 300 : 600 });
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string } | null>(null);

  useEffect(() => {
    const el = containerRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setSize({ w: Math.max(400, width), h: compact ? 300 : Math.max(400, height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [compact]);

  const groupList = [...new Set(data.nodes.map(n => n.group ?? 'root'))];
  const groupColorMap = new Map(groupList.map((g, i) => [g, GROUP_COLORS[i % GROUP_COLORS.length]]));

  // Compute degree for each node (in + out links)
  const degreeMap = new Map<string, number>();
  for (const e of data.edges) {
    degreeMap.set(e.source, (degreeMap.get(e.source) ?? 0) + 1);
    degreeMap.set(e.target, (degreeMap.get(e.target) ?? 0) + 1);
  }
  const maxDegree = Math.max(1, ...degreeMap.values());

  function nodeRadius(id: string, isCurrent: boolean): number {
    const deg = degreeMap.get(id) ?? 0;
    const base = compact ? 4 : 5;
    const scale = compact ? 6 : 10;
    const r = base + (deg / maxDegree) * scale;
    return isCurrent ? Math.max(r, base + scale * 0.5) : r;
  }

  const simNodes: SimNode[] = data.nodes.map(n => ({
    id: n.id,
    label: n.label,
    group: n.group ?? 'root',
    x: Math.random() * size.w,
    y: Math.random() * size.h,
    vx: 0, vy: 0,
    r: nodeRadius(n.id, n.id === currentSlug),
    isCurrent: n.id === currentSlug,
  }));

  const positions = useForceLayout(simNodes, data.edges, size.w, size.h);

  const handleNodeClick = useCallback((id: string) => {
    window.location.href = id === 'index' ? '/' : `/${id}`;
  }, []);

  return (
    <div style={{ width: '100%', height: compact ? 300 : '100%', position: 'relative', background: 'var(--bg-secondary)', borderRadius: compact ? '0.5rem' : 0 }}>
      <svg
        ref={containerRef}
        width="100%"
        height={compact ? 300 : size.h}
        viewBox={compact
          ? `${size.w * 0.2} ${size.h * 0.35} ${size.w * 0.6} ${size.h * 0.7}`
          : `0 0 ${size.w} ${size.h}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block' }}
      >
        {/* Edges */}
        {data.edges.map((e, i) => {
          const s = positions.get(e.source);
          const t = positions.get(e.target);
          if (!s || !t) return null;
          const isHighlighted = hovered === e.source || hovered === e.target;
          return (
            <line
              key={i}
              x1={s.x} y1={s.y} x2={t.x} y2={t.y}
              stroke={isHighlighted ? 'var(--accent)' : 'var(--border)'}
              strokeWidth={isHighlighted ? 1.5 : 1}
              strokeOpacity={isHighlighted ? 0.8 : 0.4}
            />
          );
        })}

        {/* Nodes */}
        {data.nodes.map(n => {
          const pos = positions.get(n.id);
          if (!pos) return null;
          const color = groupColorMap.get(n.group ?? 'root') ?? '#89b4fa';
          const isCurrent = n.id === currentSlug;
          const isHovered = hovered === n.id;
          const r = nodeRadius(n.id, isCurrent);
          const displayR = isHovered ? r * 1.25 : r;

          return (
            <g
              key={n.id}
              className="graph-node"
              transform={`translate(${pos.x},${pos.y})`}
              style={{ cursor: 'pointer' }}
              onClick={() => handleNodeClick(n.id)}
              onMouseEnter={() => { setHovered(n.id); setTooltip({ x: pos.x, y: pos.y, label: n.label }); }}
              onMouseLeave={() => { setHovered(null); setTooltip(null); }}
            >
              <circle
                r={displayR}
                fill={isCurrent ? 'white' : color}
                stroke={isCurrent ? color : 'var(--bg-secondary)'}
                strokeWidth={isCurrent ? 3 : 1.5}
                style={{ transition: 'r 0.15s' }}
              />
              {(isHovered || isCurrent || (!compact && r >= 8)) && (
                <text
                  y={displayR + 12}
                  textAnchor="middle"
                  fontSize={10}
                  fill={isCurrent ? 'white' : 'var(--text-muted)'}
                  style={{ pointerEvents: 'none' }}
                >
                  {n.label.length > 18 ? n.label.slice(0, 16) + '…' : n.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x + 16,
            top: tooltip.y - 20,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            borderRadius: '0.375rem',
            padding: '0.25rem 0.625rem',
            fontSize: '0.75rem',
            color: 'var(--text-primary)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {tooltip.label}
        </div>
      )}

      {/* Legend */}
      {!compact && groupList.length > 1 && (
        <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {groupList.map((g, i) => (
            <div key={g} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-faint)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: GROUP_COLORS[i % GROUP_COLORS.length] }} />
              {g === 'root' ? 'Root' : g}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

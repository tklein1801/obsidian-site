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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: compact ? 280 : 800, h: compact ? 300 : 600 });
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panDragRef = useRef<{ active: boolean; x: number; y: number }>({ active: false, x: 0, y: 0 });

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

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [compact, data.nodes.length, data.edges.length]);

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

  const clampZoom = useCallback((value: number) => Math.max(0.35, Math.min(3.2, value)), []);

  const zoomAt = useCallback((factor: number, cx: number, cy: number) => {
    setZoom(prevZoom => {
      const nextZoom = clampZoom(prevZoom * factor);
      if (nextZoom === prevZoom) return prevZoom;

      setPan(prevPan => {
        const worldX = (cx - prevPan.x) / prevZoom;
        const worldY = (cy - prevPan.y) / prevZoom;
        return {
          x: cx - worldX * nextZoom,
          y: cy - worldY * nextZoom,
        };
      });

      return nextZoom;
    });
  }, [clampZoom]);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const svg = containerRef.current;
    if (!wrapper || !svg) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = svg.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      zoomAt(factor, cx, cy);
    };

    wrapper.addEventListener('wheel', onWheel, { passive: false });
    return () => wrapper.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    const target = e.target as Element;
    if (target.closest('.graph-node')) return;
    panDragRef.current = { active: true, x: e.clientX, y: e.clientY };
    setIsPanning(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!panDragRef.current.active) return;
    const dx = e.clientX - panDragRef.current.x;
    const dy = e.clientY - panDragRef.current.y;
    panDragRef.current = { active: true, x: e.clientX, y: e.clientY };
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const endPan = useCallback(() => {
    panDragRef.current.active = false;
    setIsPanning(false);
  }, []);

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: compact ? 300 : '100%', position: 'relative', background: 'var(--bg-secondary)', borderRadius: compact ? '0.5rem' : 0, overscrollBehavior: 'contain' }}>
      <svg
        ref={containerRef}
        width="100%"
        height={compact ? 300 : size.h}
        viewBox={`0 0 ${size.w} ${size.h}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', cursor: isPanning ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={endPan}
        onMouseLeave={endPan}
        data-testid={compact ? 'graph-view-compact' : 'graph-view-full'}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
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
        </g>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x * zoom + pan.x + 16,
            top: tooltip.y * zoom + pan.y - 20,
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

      {!compact && (
        <div
          style={{
            position: 'absolute',
            right: 16,
            bottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: 6,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            borderRadius: 8,
          }}
          data-testid="graph-zoom-controls"
        >
          <button
            type="button"
            onClick={() => zoomAt(1.2, size.w / 2, size.h / 2)}
            aria-label="Zoom in"
            style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            +
          </button>
          <button
            type="button"
            onClick={() => zoomAt(0.84, size.w / 2, size.h / 2)}
            aria-label="Zoom out"
            style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            -
          </button>
          <button
            type="button"
            onClick={resetView}
            aria-label="Reset view"
            style={{ height: 26, padding: '0 8px', borderRadius: 6, border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer' }}
          >
            Reset
          </button>
          <span style={{ fontSize: 11, color: 'var(--text-faint)', minWidth: 48, textAlign: 'right' }}>
            {Math.round(zoom * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}

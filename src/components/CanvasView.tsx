import { useMemo, useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  type EdgeProps,
  BackgroundVariant,
  Handle,
  Position,
  MarkerType,
  getBezierPath,
  getStraightPath,
  getSmoothStepPath,
  BaseEdge,
  EdgeLabelRenderer,
} from '@xyflow/react';
import type { CanvasData, CanvasNode, CanvasEdge } from '../lib/canvas';

// ── Obsidian color palette ───────────────────────────────────────────────────
const OBS_COLORS: Record<string, string> = {
  '1': '#e05252',
  '2': '#e09a52',
  '3': '#d4b84a',
  '4': '#52b752',
  '5': '#52aee0',
  '6': '#9b52e0',
};

function resolveColor(color?: string): string | undefined {
  if (!color) return undefined;
  return OBS_COLORS[color] ?? color;
}

function hexToRgb(hex: string) {
  const m = hex.replace('#','').match(/.{2}/g);
  if (!m) return null;
  return m.map(h => parseInt(h, 16));
}

// ── Lightweight markdown renderer for node content ───────────────────────────
function NodeMarkdown({ text, fontSize = 13 }: { text: string; fontSize?: number }) {
  const html = text
    .replace(/^# (.+)$/gm,   '<h2 class="cnv-h1">$1</h2>')
    .replace(/^## (.+)$/gm,  '<h3 class="cnv-h2">$1</h3>')
    .replace(/^### (.+)$/gm, '<h4 class="cnv-h3">$1</h4>')
    .replace(/^\*\*\*(.+?)\*\*\*$/gm, '<p><strong><em>$1</em></strong></p>')
    .replace(/^> (.+)$/gm, '<blockquote class="cnv-bq">$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li class="cnv-li">$1</li>')
    .replace(/(<li[\s\S]*?<\/li>)/g, '<ul class="cnv-ul">$1</ul>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/`(.+?)`/g,       '<code class="cnv-code">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="cnv-a" target="_blank" rel="noopener">$1</a>')
    .replace(/\n{2,}/g, '</p><p class="cnv-p">')
    .replace(/\n/g, '<br/>');
  return (
    <div
      className="cnv-md"
      style={{ fontSize }}
      dangerouslySetInnerHTML={{ __html: `<p class="cnv-p">${html}</p>` }}
    />
  );
}

// ── Shared handles (invisible, purely for edge routing) ──────────────────────
function NodeHandles() {
  return (
    <>
      <Handle type="source" position={Position.Top}    id="top"    className="cnv-h" />
      <Handle type="target" position={Position.Top}    id="top"    className="cnv-h" />
      <Handle type="source" position={Position.Right}  id="right"  className="cnv-h" />
      <Handle type="target" position={Position.Right}  id="right"  className="cnv-h" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="cnv-h" />
      <Handle type="target" position={Position.Bottom} id="bottom" className="cnv-h" />
      <Handle type="source" position={Position.Left}   id="left"   className="cnv-h" />
      <Handle type="target" position={Position.Left}   id="left"   className="cnv-h" />
    </>
  );
}

// ── Node: Text ───────────────────────────────────────────────────────────────
type TextNodeData = { text: string; accentColor?: string };
function TextNode({ data }: { data: TextNodeData }) {
  const ac = data.accentColor;
  const rgb = ac ? hexToRgb(ac) : null;
  const bg = rgb ? `rgba(${rgb.join(',')},0.07)` : 'var(--bg-secondary)';
  return (
    <div
      className="cnv-node cnv-text-node"
      style={{
        background: bg,
        borderColor: ac ?? 'var(--border)',
        '--cnv-ac': ac,
      } as React.CSSProperties}
    >
      <NodeHandles />
      {ac && <div className="cnv-accent-bar" style={{ background: ac }} />}
      <div className="cnv-text-body">
        <NodeMarkdown text={data.text} />
      </div>
    </div>
  );
}

// ── Node: File ───────────────────────────────────────────────────────────────
type FileNodeData = {
  file: string;
  slug: string;
  title: string;
  rawContent: string;
  accentColor?: string;
};
function FileNode({ data }: { data: FileNodeData }) {
  const ac = data.accentColor;
  const rgb = ac ? hexToRgb(ac) : null;
  const bg = rgb ? `rgba(${rgb.join(',')},0.07)` : 'var(--bg-secondary)';
  const headerBg = rgb ? `rgba(${rgb.join(',')},0.15)` : 'var(--bg-tertiary)';
  const fileName = data.file.split('/').pop() ?? data.file;

  return (
    <div
      className="cnv-node cnv-file-node"
      style={{ background: bg, borderColor: ac ?? 'var(--border)' } as React.CSSProperties}
    >
      <NodeHandles />
      {/* Header */}
      <div className="cnv-file-header" style={{ background: headerBg, borderBottomColor: ac ?? 'var(--border)' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={ac ?? 'var(--text-faint)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <span className="cnv-file-path" title={data.file}>{fileName.replace(/\.md$/, '')}</span>
      </div>
      {/* Content preview */}
      <div className="cnv-file-body">
        {data.title && data.title !== fileName.replace(/\.md$/, '') && (
          <div className="cnv-file-title">{data.title}</div>
        )}
        {data.rawContent ? (
          <NodeMarkdown text={data.rawContent.slice(0, 1200)} fontSize={12} />
        ) : (
          <span className="cnv-empty">No content preview available</span>
        )}
      </div>
      {/* Footer link */}
      <a
        href={`/${data.slug}`}
        className="cnv-file-footer"
        style={{ borderTopColor: ac ?? 'var(--border)', color: ac ?? 'var(--accent)' }}
        onClick={e => { e.stopPropagation(); window.location.href = `/${data.slug}`; }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        Open note
      </a>
    </div>
  );
}

// ── Node: Link (web bookmark) ────────────────────────────────────────────────
type LinkNodeData = { url: string; accentColor?: string };
function LinkNode({ data }: { data: LinkNodeData }) {
  const ac = data.accentColor;
  const rgb = ac ? hexToRgb(ac) : null;
  const bg = rgb ? `rgba(${rgb.join(',')},0.07)` : 'var(--bg-secondary)';
  let hostname = '';
  let origin = '';
  try { const u = new URL(data.url); hostname = u.hostname; origin = u.origin; } catch { /* ignore */ }
  const displayUrl = data.url.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return (
    <div
      className="cnv-node cnv-link-node"
      style={{ background: bg, borderColor: ac ?? 'var(--border)' } as React.CSSProperties}
    >
      <NodeHandles />
      {ac && <div className="cnv-accent-bar" style={{ background: ac }} />}
      <div className="cnv-link-body">
        {hostname && (
          <div className="cnv-link-host">
            <img
              src={`${origin}/favicon.ico`}
              width="14" height="14"
              style={{ borderRadius: 3, flexShrink: 0 }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="cnv-link-hostname">{hostname}</span>
          </div>
        )}
        <a href={data.url} target="_blank" rel="noopener noreferrer" className="cnv-link-url" onClick={e => e.stopPropagation()}>
          {displayUrl}
        </a>
        <div className="cnv-link-open-row">
          <a href={data.url} target="_blank" rel="noopener noreferrer" className="cnv-link-open" style={{ color: ac ?? 'var(--accent)' }} onClick={e => e.stopPropagation()}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Open link
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Node: Group ──────────────────────────────────────────────────────────────
type GroupNodeData = { label?: string; accentColor?: string };
function GroupNode({ data }: { data: GroupNodeData }) {
  const ac = data.accentColor;
  const rgb = ac ? hexToRgb(ac) : null;
  const bg   = rgb ? `rgba(${rgb.join(',')},0.05)` : 'rgba(255,255,255,0.02)';
  const border = ac ?? 'var(--border)';
  return (
    <div
      className="cnv-group-node"
      style={{ background: bg, borderColor: border } as React.CSSProperties}
    >
      {data.label && (
        <div className="cnv-group-label" style={{ color: ac ?? 'var(--text-faint)' }}>
          {data.label}
        </div>
      )}
    </div>
  );
}

const nodeTypes: NodeTypes = {
  'obs-text':  TextNode  as never,
  'obs-file':  FileNode  as never,
  'obs-link':  LinkNode  as never,
  'obs-group': GroupNode as never,
};

// ── Edge: Obsidian curved with optional label ────────────────────────────────
function ObsidianEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data, markerEnd, markerStart, style,
}: EdgeProps) {
  const edgeType = (data?.edgeType as string) ?? 'bezier';
  let edgePath: string, labelX: number, labelY: number;
  if (edgeType === 'straight') {
    [edgePath, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  } else if (edgeType === 'elbow') {
    [edgePath, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, borderRadius: 6 });
  } else {
    [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  }
  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} markerStart={markerStart} style={style} />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan cnv-edge-label"
            style={{ transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)` }}
          >
            {data.label as string}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const edgeTypes: EdgeTypes = { obsidian: ObsidianEdge };

// ── Data converters ──────────────────────────────────────────────────────────
type FileInfoMap = Record<string, { title: string; rawContent: string; slug: string }>;

function toFlowNode(n: CanvasNode, fileInfoMap: FileInfoMap): Node {
  const accentColor = resolveColor(n.color);
  const base = {
    id: n.id,
    position: { x: n.x, y: n.y },
    style: { width: n.width, height: n.height, padding: 0 },
    draggable: false,
    selectable: false,
    focusable: false,
  };

  if (n.type === 'group') {
    return { ...base, type: 'obs-group', zIndex: -1, data: { label: n.label, accentColor } } as Node;
  }
  if (n.type === 'file') {
    const filePath = n.file ?? '';
    const info = fileInfoMap[filePath];
    const slug = info?.slug ?? filePath.replace(/\.md$/, '').split('/').map(p => p.toLowerCase().replace(/\s+/g, '-')).join('/');
    return {
      ...base, type: 'obs-file',
      data: {
        file: filePath,
        slug,
        title: info?.title ?? filePath.split('/').pop()?.replace(/\.md$/, '') ?? filePath,
        rawContent: info?.rawContent ?? '',
        accentColor,
      },
    } as Node;
  }
  if (n.type === 'link') {
    return { ...base, type: 'obs-link', data: { url: n.url ?? '', accentColor } } as Node;
  }
  return { ...base, type: 'obs-text', data: { text: n.text ?? '', accentColor } } as Node;
}

function toFlowEdge(e: CanvasEdge): Edge {
  const color = resolveColor(e.color) ?? 'var(--text-faint)';
  const toArrow   = e.toEnd !== 'none';
  const fromArrow = e.fromEnd === 'arrow';
  return {
    id: e.id,
    source: e.fromNode,
    target: e.toNode,
    sourceHandle: e.fromSide ?? undefined,
    targetHandle: e.toSide ?? undefined,
    type: 'obsidian',
    data: { label: e.label, edgeType: (e as any).type ?? 'bezier' },
    style: { stroke: color, strokeWidth: 1.5 },
    markerEnd:   toArrow   ? { type: MarkerType.ArrowClosed, color, width: 16, height: 16 } : undefined,
    markerStart: fromArrow ? { type: MarkerType.ArrowClosed, color, width: 16, height: 16 } : undefined,
    animated: false,
    focusable: false,
    selectable: false,
  };
}

// ── Custom controls overlay ──────────────────────────────────────────────────
function CanvasControls() {
  const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow();
  const [zoom, setZoom] = useState(100);

  // Update zoom display periodically
  const updateZoom = useCallback(() => {
    setZoom(Math.round(getZoom() * 100));
  }, [getZoom]);

  return (
    <div className="cnv-controls">
      <button className="cnv-ctrl-btn" title="Zoom in"  onClick={() => { zoomIn();  setTimeout(updateZoom, 150); }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <span className="cnv-ctrl-zoom">{zoom}%</span>
      <button className="cnv-ctrl-btn" title="Zoom out" onClick={() => { zoomOut(); setTimeout(updateZoom, 150); }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <div className="cnv-ctrl-sep" />
      <button className="cnv-ctrl-btn" title="Fit view"  onClick={() => { fitView({ padding: 0.1, duration: 300 }); setTimeout(updateZoom, 400); }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
      </button>
    </div>
  );
}

// ── Scoped CSS ───────────────────────────────────────────────────────────────
const CANVAS_CSS = `
  /* Handles — invisible in read-only mode */
  .cnv-h {
    width: 8px !important; height: 8px !important;
    background: transparent !important;
    border: none !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }

  /* Suppress all React Flow interaction chrome */
  .react-flow__node { cursor: default !important; }
  .react-flow__node.selected > div,
  .react-flow__node.selected { box-shadow: none !important; outline: none !important; }
  .react-flow__edge-path { cursor: default !important; }
  .react-flow__selection { display: none !important; }
  .react-flow__nodesselection { display: none !important; }

  /* Base node */
  .cnv-node {
    width: 100%; height: 100%;
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    box-sizing: border-box;
    box-shadow: 0 2px 12px rgba(0,0,0,0.25);
    display: flex; flex-direction: column;
    transition: box-shadow 0.15s;
    position: relative;
  }
  .cnv-node:hover {
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  }

  /* Accent bar (top edge) */
  .cnv-accent-bar {
    position: absolute; top: 0; left: 0; right: 0;
    height: 3px;
    border-radius: 8px 8px 0 0;
    z-index: 1;
    opacity: 0.85;
  }

  /* ── Text node ── */
  .cnv-text-node { padding: 0; }
  .cnv-text-body {
    flex: 1; overflow: auto;
    padding: 14px 16px;
    padding-top: 17px;
  }

  /* ── File node ── */
  .cnv-file-node { }
  .cnv-file-header {
    display: flex; align-items: center; gap: 7px;
    padding: 7px 11px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .cnv-file-path {
    font-size: 11px; font-weight: 600;
    color: var(--text-muted);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    letter-spacing: 0.01em;
  }
  .cnv-file-body {
    flex: 1; overflow: auto;
    padding: 10px 13px;
  }
  .cnv-file-title {
    font-size: 15px; font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 8px;
    line-height: 1.3;
  }
  .cnv-file-footer {
    display: flex; align-items: center; gap: 5px;
    padding: 6px 12px;
    border-top: 1px solid var(--border);
    font-size: 11px; font-weight: 500;
    text-decoration: none;
    flex-shrink: 0;
    opacity: 0.75;
    transition: opacity 0.15s;
  }
  .cnv-file-footer:hover { opacity: 1; text-decoration: none; }
  .cnv-empty { font-size: 11px; color: var(--text-faint); font-style: italic; }

  /* ── Link node ── */
  .cnv-link-node { }
  .cnv-link-body {
    flex: 1; padding: 14px 14px 10px;
    display: flex; flex-direction: column; gap: 6px;
    overflow: hidden;
  }
  .cnv-link-host {
    display: flex; align-items: center; gap: 6px;
    font-size: 11px; color: var(--text-faint);
    font-weight: 500; letter-spacing: 0.02em;
  }
  .cnv-link-hostname { text-transform: none; }
  .cnv-link-url {
    font-size: 12px; color: var(--text-muted);
    word-break: break-all; line-height: 1.4;
    text-decoration: none;
    display: -webkit-box; -webkit-line-clamp: 3;
    -webkit-box-orient: vertical; overflow: hidden;
  }
  .cnv-link-url:hover { text-decoration: underline; color: var(--accent); }
  .cnv-link-open-row { margin-top: auto; }
  .cnv-link-open {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11px; font-weight: 500;
    text-decoration: none; opacity: 0.8;
  }
  .cnv-link-open:hover { opacity: 1; text-decoration: none; }

  /* ── Group node ── */
  .cnv-group-node {
    width: 100%; height: 100%;
    border: 1.5px dashed var(--border);
    border-radius: 10px;
    box-sizing: border-box;
    position: relative;
  }
  .cnv-group-label {
    position: absolute; top: 8px; left: 12px;
    font-size: 11px; font-weight: 600;
    letter-spacing: 0.07em; text-transform: uppercase;
    white-space: nowrap;
  }

  /* ── Markdown ── */
  .cnv-md { color: var(--text-primary); line-height: 1.6; }
  .cnv-md .cnv-h1 { font-size: 15px; font-weight: 700; margin: 0 0 6px; color: var(--text-primary); line-height: 1.3; }
  .cnv-md .cnv-h2 { font-size: 13px; font-weight: 600; margin: 8px 0 4px; color: var(--text-primary); }
  .cnv-md .cnv-h3 { font-size: 12px; font-weight: 600; margin: 6px 0 3px; color: var(--text-muted); }
  .cnv-md .cnv-p  { margin: 0 0 6px; }
  .cnv-md .cnv-bq { border-left: 3px solid var(--border); padding-left: 8px; color: var(--text-muted); margin: 4px 0; }
  .cnv-md .cnv-ul { margin: 2px 0 6px 14px; padding: 0; list-style-type: disc; }
  .cnv-md .cnv-li { margin: 1px 0; }
  .cnv-md .cnv-code { font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 0.85em; background: rgba(255,255,255,0.06); padding: 1px 5px; border-radius: 3px; color: var(--accent); }
  .cnv-md .cnv-a { color: var(--accent); text-decoration: none; }
  .cnv-md .cnv-a:hover { text-decoration: underline; }
  /* override default p reset from host */
  .cnv-md p { margin-bottom: 6px; }

  /* ── Edge label ── */
  .cnv-edge-label {
    position: absolute;
    font-size: 11px; font-weight: 500;
    padding: 2px 8px;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text-faint);
    white-space: nowrap;
    pointer-events: all;
  }

  /* ── Custom controls ── */
  .cnv-controls {
    position: absolute; bottom: 16px; left: 16px; z-index: 10;
    display: flex; align-items: center;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    overflow: hidden;
  }
  .cnv-ctrl-btn {
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    border: none; background: transparent;
    cursor: pointer; color: var(--text-muted);
    transition: background 0.1s, color 0.1s;
    padding: 0;
  }
  .cnv-ctrl-btn:hover { background: var(--bg-tertiary); color: var(--text-primary); }
  .cnv-ctrl-btn svg { width: 14px; height: 14px; }
  .cnv-ctrl-zoom {
    font-size: 11px; font-weight: 600;
    color: var(--text-muted);
    padding: 0 6px;
    min-width: 38px; text-align: center;
    letter-spacing: 0.02em;
    user-select: none;
  }
  .cnv-ctrl-sep {
    width: 1px; height: 20px;
    background: var(--border);
    margin: 0 2px;
  }

  /* ── MiniMap overrides ── */
  .react-flow__minimap {
    background: var(--bg-secondary) !important;
    border: 1px solid var(--border) !important;
    border-radius: 8px !important;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3) !important;
    overflow: hidden !important;
  }
  .react-flow__minimap-mask { fill: rgba(0,0,0,0.5) !important; }

  /* ── React Flow background ── */
  .react-flow__background { opacity: 0.5; }
`;

// ── Inner canvas (needs ReactFlowProvider context) ───────────────────────────
function CanvasInner({ data, fileInfoMap }: { data: CanvasData; fileInfoMap: FileInfoMap }) {
  const initialNodes = useMemo(() => data.nodes.map(n => toFlowNode(n, fileInfoMap)), [data.nodes, fileInfoMap]);
  const initialEdges = useMemo(() => data.edges.map(toFlowEdge), [data.edges]);
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const nodeColor = useCallback((n: Node) => {
    const ac = (n.data as { accentColor?: string }).accentColor;
    return ac ?? 'var(--bg-tertiary)';
  }, []);

  return (
    <div style={{ width: '100%', height: 580, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <style dangerouslySetInnerHTML={{ __html: CANVAS_CSS }} />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.1, duration: 0 }}
        minZoom={0.05}
        maxZoom={3}
        style={{ background: 'var(--bg-primary)' }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        selectNodesOnDrag={false}
        preventScrolling={true}
      >
        <Background
          color="var(--border)"
          gap={24}
          size={1}
          variant={BackgroundVariant.Dots}
        />
        <MiniMap
          nodeColor={nodeColor}
          maskColor="rgba(0,0,0,0.55)"
          position="bottom-right"
          pannable
          zoomable
        />
        <CanvasControls />
      </ReactFlow>
    </div>
  );
}

// ── Public component ─────────────────────────────────────────────────────────
export default function CanvasView({
  data,
  fileInfoMap = {},
}: {
  data: CanvasData;
  fileInfoMap?: FileInfoMap;
}) {
  return (
    <ReactFlowProvider>
      <CanvasInner data={data} fileInfoMap={fileInfoMap} />
    </ReactFlowProvider>
  );
}

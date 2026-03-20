export interface CanvasNode {
  id: string;
  type: 'text' | 'file' | 'link' | 'group';
  x: number;
  y: number;
  width: number;
  height: number;
  // text nodes
  text?: string;
  // file nodes
  file?: string;
  // link nodes
  url?: string;
  // group nodes
  label?: string;
  background?: string;
  color?: string;
}

export interface CanvasEdge {
  id: string;
  fromNode: string;
  fromSide?: 'top' | 'right' | 'bottom' | 'left';
  fromEnd?: 'none' | 'arrow';
  toNode: string;
  toSide?: 'top' | 'right' | 'bottom' | 'left';
  toEnd?: 'none' | 'arrow';
  color?: string;
  label?: string;
}

export interface CanvasData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export function parseCanvas(raw: string): CanvasData {
  try {
    const data = JSON.parse(raw) as Partial<CanvasData>;
    return {
      nodes: data.nodes ?? [],
      edges: data.edges ?? [],
    };
  } catch {
    return { nodes: [], edges: [] };
  }
}

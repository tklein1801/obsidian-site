import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import CanvasView from '../CanvasView';
import type { CanvasData } from '../../lib/canvas';

// ── Browser API mocks required by @xyflow/react ─────────────────────────────

beforeAll(() => {
  // ResizeObserver
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  // DOMMatrix (used by ReactFlow transforms)
  if (!globalThis.DOMMatrix) {
    globalThis.DOMMatrix = class {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      constructor(_transform?: string) {}
    } as unknown as typeof DOMMatrix;
  }

  // getBoundingClientRect returns zero-sized rects in jsdom
  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    width: 800, height: 580,
    top: 0, left: 0, right: 800, bottom: 580,
    x: 0, y: 0, toJSON: () => ({}),
  }));
});

// ── Fixtures ─────────────────────────────────────────────────────────────────

const emptyCanvas: CanvasData = { nodes: [], edges: [] };

const simpleCanvas: CanvasData = {
  nodes: [
    { id: 'n1', type: 'text', x: 0, y: 0, width: 200, height: 100, text: 'Hello Canvas' },
    { id: 'n2', type: 'text', x: 300, y: 0, width: 200, height: 100, text: 'Second node' },
  ],
  edges: [
    { id: 'e1', fromNode: 'n1', toNode: 'n2', fromSide: 'right', toSide: 'left' },
  ],
};

const fileNodeCanvas: CanvasData = {
  nodes: [
    { id: 'n1', type: 'file', x: 0, y: 0, width: 200, height: 150, file: 'Notes/Example.md' },
    { id: 'n2', type: 'link', x: 300, y: 0, width: 200, height: 100, url: 'https://example.com' },
    { id: 'n3', type: 'group', x: -50, y: -50, width: 600, height: 300, label: 'My Group' },
  ],
  edges: [],
};

const fileInfoMap: Record<string, { slug: string; title: string; rawContent: string }> = {
  'Notes/Example.md': { slug: 'notes/example', title: 'Example Note', rawContent: '' },
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('CanvasView', () => {
  it('renders without crashing with empty canvas', () => {
    const { container } = render(<CanvasView data={emptyCanvas} fileInfoMap={{}} />);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders without crashing with text nodes and edges', () => {
    const { container } = render(
      <CanvasView data={simpleCanvas} fileInfoMap={{}} />
    );
    expect(container.firstChild).not.toBeNull();
  });

  it('renders without crashing with file, link, and group nodes', () => {
    const { container } = render(
      <CanvasView data={fileNodeCanvas} fileInfoMap={fileInfoMap} />
    );
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the ReactFlow wrapper container', () => {
    const { container } = render(<CanvasView data={simpleCanvas} fileInfoMap={{}} />);
    // CanvasView always renders a div wrapper around ReactFlowProvider
    const wrapper = container.querySelector('div');
    expect(wrapper).toBeInTheDocument();
  });

  it('renders with canvas containing many nodes', () => {
    const manyNodes: CanvasData = {
      nodes: Array.from({ length: 20 }, (_, i) => ({
        id: `n${i}`,
        type: 'text' as const,
        x: i * 250,
        y: 0,
        width: 200,
        height: 100,
        text: `Node ${i}`,
      })),
      edges: Array.from({ length: 19 }, (_, i) => ({
        id: `e${i}`,
        fromNode: `n${i}`,
        toNode: `n${i + 1}`,
      })),
    };
    const { container } = render(<CanvasView data={manyNodes} fileInfoMap={{}} />);
    expect(container.firstChild).not.toBeNull();
  });
});

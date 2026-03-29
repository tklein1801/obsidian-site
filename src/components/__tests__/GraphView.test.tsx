import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import GraphView from '../GraphView';
import type { GraphData } from '../../lib/graph';

beforeAll(() => {
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  if (!globalThis.requestAnimationFrame) {
    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => setTimeout(cb, 0)) as unknown as typeof requestAnimationFrame;
  }

  if (!globalThis.cancelAnimationFrame) {
    globalThis.cancelAnimationFrame = ((id: number) => clearTimeout(id)) as unknown as typeof cancelAnimationFrame;
  }

  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    right: 800,
    bottom: 600,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  }));
});

describe('GraphView', () => {
  it('does not render group legend labels in non-compact mode', () => {
    const data: GraphData = {
      nodes: [
        { id: 'a', label: 'Node A', tags: [], group: 'team-a' },
        { id: 'b', label: 'Node B', tags: [], group: 'team-b' },
      ],
      edges: [{ source: 'a', target: 'b' }],
    };

    render(<GraphView data={data} compact={false} />);

    expect(screen.queryByText('team-a')).toBeNull();
    expect(screen.queryByText('team-b')).toBeNull();
    expect(screen.queryByText('Root')).toBeNull();
  });

  it('shows zoom controls in non-compact mode', () => {
    const data: GraphData = {
      nodes: [
        { id: 'a', label: 'Node A', tags: [], group: 'team-a' },
        { id: 'b', label: 'Node B', tags: [], group: 'team-b' },
      ],
      edges: [{ source: 'a', target: 'b' }],
    };

    render(<GraphView data={data} compact={false} />);
    expect(screen.getByTestId('graph-zoom-controls')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument();
  });

  it('hides zoom controls in compact mode', () => {
    const data: GraphData = {
      nodes: [
        { id: 'a', label: 'Node A', tags: [], group: 'team-a' },
        { id: 'b', label: 'Node B', tags: [], group: 'team-b' },
      ],
      edges: [{ source: 'a', target: 'b' }],
    };

    render(<GraphView data={data} compact={true} />);
    expect(screen.queryByTestId('graph-zoom-controls')).toBeNull();
  });
});

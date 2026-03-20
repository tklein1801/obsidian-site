import { describe, it, expect } from 'vitest';
import { parseCanvas } from '../canvas';

describe('parseCanvas', () => {
  it('returns empty arrays for empty JSON', () => {
    expect(parseCanvas('{}')).toEqual({ nodes: [], edges: [] });
  });

  it('parses nodes and edges from valid JSON', () => {
    const raw = JSON.stringify({
      nodes: [
        { id: 'n1', type: 'text', x: 0, y: 0, width: 200, height: 100, text: 'Hello' },
        { id: 'n2', type: 'file', x: 300, y: 0, width: 200, height: 100, file: 'note.md' },
      ],
      edges: [
        { id: 'e1', fromNode: 'n1', toNode: 'n2', fromSide: 'right', toSide: 'left' },
      ],
    });
    const result = parseCanvas(raw);
    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
    expect(result.nodes[0].id).toBe('n1');
    expect(result.nodes[0].text).toBe('Hello');
    expect(result.nodes[1].file).toBe('note.md');
    expect(result.edges[0].fromNode).toBe('n1');
    expect(result.edges[0].toNode).toBe('n2');
  });

  it('returns empty arrays for invalid JSON', () => {
    expect(parseCanvas('not json!')).toEqual({ nodes: [], edges: [] });
    expect(parseCanvas('')).toEqual({ nodes: [], edges: [] });
    expect(parseCanvas('{')).toEqual({ nodes: [], edges: [] });
  });

  it('handles missing nodes array gracefully', () => {
    const result = parseCanvas(JSON.stringify({ edges: [] }));
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it('handles missing edges array gracefully', () => {
    const result = parseCanvas(JSON.stringify({ nodes: [{ id: 'n1', type: 'text', x: 0, y: 0, width: 100, height: 100 }] }));
    expect(result.nodes).toHaveLength(1);
    expect(result.edges).toEqual([]);
  });

  it('parses all node types', () => {
    const raw = JSON.stringify({
      nodes: [
        { id: 'n1', type: 'text', x: 0, y: 0, width: 100, height: 100, text: 'Text node' },
        { id: 'n2', type: 'file', x: 100, y: 0, width: 100, height: 100, file: 'path/to/note.md' },
        { id: 'n3', type: 'link', x: 200, y: 0, width: 100, height: 100, url: 'https://example.com' },
        { id: 'n4', type: 'group', x: 0, y: 200, width: 400, height: 300, label: 'My Group', color: '1' },
      ],
      edges: [],
    });
    const result = parseCanvas(raw);
    expect(result.nodes).toHaveLength(4);
    expect(result.nodes[2].url).toBe('https://example.com');
    expect(result.nodes[3].label).toBe('My Group');
    expect(result.nodes[3].color).toBe('1');
  });

  it('parses edge properties including color and label', () => {
    const raw = JSON.stringify({
      nodes: [],
      edges: [
        {
          id: 'e1',
          fromNode: 'a',
          toNode: 'b',
          fromSide: 'bottom',
          toSide: 'top',
          fromEnd: 'none',
          toEnd: 'arrow',
          color: '2',
          label: 'depends on',
        },
      ],
    });
    const result = parseCanvas(raw);
    expect(result.edges[0].color).toBe('2');
    expect(result.edges[0].label).toBe('depends on');
    expect(result.edges[0].toEnd).toBe('arrow');
  });
});

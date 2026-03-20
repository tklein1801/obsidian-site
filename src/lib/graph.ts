import type { VaultIndex, VaultFile } from './vault';

export interface GraphNode {
  id: string;
  label: string;
  tags: string[];
  group?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function buildGraph(index: VaultIndex): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  for (const f of index.files) {
    if (!f.isMarkdown) continue;
    nodes.push({
      id: f.slug,
      label: f.title,
      tags: f.tags,
      group: f.relativePath.split('/').slice(0, -1).join('/') || 'root',
    });
  }

  for (const f of index.files) {
    if (!f.isMarkdown) continue;
    const re = /!?\[\[([^\]]+)\]\]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(f.rawContent)) !== null) {
      const [target] = m[1].split('|');
      const clean = target.trim().split('#')[0].toLowerCase().replace(/\s+/g, '-');
      for (const [slug] of index.notesBySlug) {
        if (slug.endsWith(clean) || slug === clean) {
          const key = `${f.slug}->${slug}`;
          if (!edgeSet.has(key)) {
            edgeSet.add(key);
            edges.push({ source: f.slug, target: slug });
          }
        }
      }
    }
  }

  return { nodes, edges };
}

export function getOutlinks(f: VaultFile, index: VaultIndex): VaultFile[] {
  const result: VaultFile[] = [];
  const seen = new Set<string>();
  const re = /!?\[\[([^\]]+)\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(f.rawContent)) !== null) {
    const [target] = m[1].split('|');
    const clean = target.trim().split('#')[0].toLowerCase().replace(/\s+/g, '-');
    for (const [slug, note] of index.notesBySlug) {
      if ((slug.endsWith(clean) || slug === clean) && !seen.has(slug)) {
        seen.add(slug);
        result.push(note);
      }
    }
  }
  return result;
}

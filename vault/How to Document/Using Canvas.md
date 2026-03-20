---
title: Using Canvas
tags: [how-to, canvas, beta]
icon: layout-dashboard
---

# Using Canvas

> [!info] Beta Feature
> Canvas support is currently in beta. The renderer covers all standard Obsidian Canvas node and edge types. See [[General/Roadmap|Roadmap]] for planned improvements.

Canvas files (`.canvas`) from Obsidian are rendered as interactive, read-only boards. Visitors can pan and zoom freely, and file nodes show live note content.

## Creating a canvas

1. In Obsidian, create a new Canvas file via **File → New Canvas**
2. Add nodes: text cards, file references, web bookmarks, or group boxes
3. Connect nodes with arrows
4. Save the file — it is automatically included in the next build

Canvas files must be placed inside your vault folder and will be published at the same URL path as Markdown files (e.g. `vault/Canvas/Architecture.canvas` → `/canvas/architecture`).

## Node types

### Text nodes
Free-form Markdown content. Supports headings, bold, italic, inline code, blockquotes, and lists.

### File nodes
Reference a note from your vault. The full note content is rendered as a scrollable preview inside the node. Clicking **Open note** navigates to the full note page.

### Link nodes (web bookmarks)
Reference an external URL. Shows the domain favicon, hostname, and a truncated URL. Clicking **Open link** opens the URL in a new tab.

### Group nodes
A labelled background rectangle used to visually group related nodes. Supports Obsidian's color palette and becomes semi-transparent with a dashed border.

## Edge types

Edges connect nodes with arrows. You can label edges and control the arrow direction:

```json
{
  "id": "e1",
  "fromNode": "nodeA",
  "fromSide": "right",
  "toNode": "nodeB",
  "toSide": "left",
  "toEnd": "arrow",
  "label": "depends on"
}
```

- `fromEnd` / `toEnd`: `"arrow"` or `"none"`
- `fromSide` / `toSide`: `"top"`, `"right"`, `"bottom"`, `"left"`
- `color`: one of `"1"`–`"6"` or a hex color string

## Colors

Both nodes and edges support Obsidian's six-color palette:

| Value | Color |
|---|---|
| `"1"` | Red |
| `"2"` | Orange |
| `"3"` | Yellow |
| `"4"` | Green |
| `"5"` | Blue |
| `"6"` | Purple |

You can also use any hex color string directly: `"color": "#ff6b6b"`.

## Controls

The canvas toolbar (bottom-left) provides:
- **+** — Zoom in
- **−** — Zoom out
- **Zoom %** — Current zoom level
- **⤢** — Fit entire canvas into view

The minimap (bottom-right) shows a birds-eye view and is pannable.

## Example canvas file

```json
{
  "nodes": [
    {
      "id": "n1",
      "type": "text",
      "x": 0, "y": 0,
      "width": 200, "height": 100,
      "text": "## Hello Canvas\nThis is a text node.",
      "color": "5"
    },
    {
      "id": "n2",
      "type": "file",
      "x": 300, "y": 0,
      "width": 240, "height": 200,
      "file": "index.md"
    }
  ],
  "edges": [
    {
      "id": "e1",
      "fromNode": "n1", "fromSide": "right",
      "toNode": "n2",   "toSide": "left",
      "toEnd": "arrow", "label": "links to"
    }
  ]
}
```

See [[Canvas/Architecture]] for a live example.

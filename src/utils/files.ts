import { readdirSync } from 'fs';
import { join } from 'path';

export interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
  depth: number;
}

const EXCLUDED = new Set(['.git', 'node_modules', '.next', 'dist']);

export function readChildren(dir: string, childDepth: number): FileNode[] {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    const nodes: FileNode[] = [];

    for (const entry of entries) {
      if (EXCLUDED.has(entry.name)) continue;
      nodes.push({
        name: entry.name,
        path: join(dir, entry.name),
        isDir: entry.isDirectory(),
        depth: childDepth,
      });
    }

    // Dirs first, then files, alphabetically within each group
    nodes.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return nodes;
  } catch {
    return [];
  }
}

export function insertAfter(nodes: FileNode[], parentPath: string, children: FileNode[]): FileNode[] {
  const idx = nodes.findIndex(n => n.path === parentPath);
  if (idx === -1) return nodes;
  return [...nodes.slice(0, idx + 1), ...children, ...nodes.slice(idx + 1)];
}

export function removeDescendants(nodes: FileNode[], parentPath: string, parentDepth: number): FileNode[] {
  const idx = nodes.findIndex(n => n.path === parentPath);
  if (idx === -1) return nodes;
  let end = idx + 1;
  while (end < nodes.length && nodes[end].depth > parentDepth) end++;
  return [...nodes.slice(0, idx + 1), ...nodes.slice(end)];
}

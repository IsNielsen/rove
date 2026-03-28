import React, { useState, useMemo, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import type { Key } from 'ink';
import { readChildren, insertAfter, removeDescendants, FileNode } from './utils/files.js';
import { getGitStatuses, GitStatus } from './utils/git.js';

interface Props {
  cwd: string;
  gitMode: boolean;
  maxDepth: number;
  onCommand: (cmd: string) => void;
}

type Mode = 'nav' | 'prefix' | 'suffix';

function editText(prev: string, input: string, key: Key): string {
  if (key.backspace || key.delete) return prev.slice(0, -1);
  if (input && !key.ctrl && !key.meta) return prev + input;
  return prev;
}

export default function App({ cwd, gitMode, maxDepth, onCommand }: Props) {
  const { exit } = useApp();

  const [nodes, setNodes] = useState<FileNode[]>(() => readChildren(cwd, 0));
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // cursor + scrollOffset batched together to avoid double re-render per keypress
  const [nav, setNav] = useState({ cursor: 0, offset: 0 });
  const [termSize, setTermSize] = useState({
    rows: process.stdout.rows ?? 24,
    cols: process.stdout.columns ?? 80,
  });
  const [mode, setMode] = useState<Mode>('nav');
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [fileToggled, setFileToggled] = useState(false);
  const [gitMap, setGitMap] = useState<Map<string, GitStatus>>(new Map());

  const treeHeight = Math.max(1, termSize.rows - 2);

  useEffect(() => {
    const onResize = () =>
      setTermSize({ rows: process.stdout.rows ?? 24, cols: process.stdout.columns ?? 80 });
    process.stdout.on('resize', onResize);
    return () => { process.stdout.off('resize', onResize); };
  }, []);

  useEffect(() => {
    if (!gitMode) return;
    const id = setTimeout(() => setGitMap(getGitStatuses(cwd)), 0);
    return () => clearTimeout(id);
  }, []);

  const windowedNodes = useMemo(
    () => nodes.slice(nav.offset, nav.offset + treeHeight),
    [nodes, nav.offset, treeHeight]
  );

  const sep = useMemo(() => '─'.repeat(termSize.cols), [termSize.cols]);

  const selectedNode = nodes[nav.cursor];

  function moveCursor(next: number) {
    setNav(({ cursor: _c, offset }) => {
      const c = Math.max(0, Math.min(next, nodes.length - 1));
      const buffer = 5;
      let o = offset;
      if (c < offset + buffer) {
        o = Math.max(0, c - buffer);
      } else if (c >= offset + treeHeight - buffer) {
        o = Math.min(Math.max(0, nodes.length - treeHeight), c - treeHeight + buffer + 1);
      }
      return { cursor: c, offset: o };
    });
  }

  function doExpand(node: FileNode) {
    if (!node.isDir || expanded.has(node.path) || node.depth >= maxDepth) return;
    const children = readChildren(node.path, node.depth + 1);
    setNodes(prev => insertAfter(prev, node.path, children));
    setExpanded(prev => new Set(prev).add(node.path));
  }

  function doCollapse(node: FileNode) {
    if (!node.isDir || !expanded.has(node.path)) return;
    setNodes(prev => removeDescendants(prev, node.path, node.depth));
    setExpanded(prev => {
      const next = new Set(prev);
      for (const p of prev) {
        if (p === node.path || p.startsWith(node.path + '/')) next.delete(p);
      }
      return next;
    });
  }

  function doRun() {
    const file = fileToggled && selectedNode ? selectedNode.path : '';
    const cmd = [prefix, file, suffix].filter(Boolean).join(' ').trim();
    if (!cmd) return;
    onCommand(cmd);
    exit();
  }

  function resetBar() {
    setMode('nav');
    setPrefix('');
    setSuffix('');
    setFileToggled(false);
  }

  useInput((input, key) => {
    if (mode === 'nav') {
      if (key.upArrow) moveCursor(nav.cursor - 1);
      else if (key.downArrow) moveCursor(nav.cursor + 1);
      else if (key.leftArrow && selectedNode?.isDir) doCollapse(selectedNode);
      else if (key.rightArrow && selectedNode?.isDir) doExpand(selectedNode);
      else if (input === 'q' && !key.ctrl && !key.meta) exit();
      else if (input.length === 1 && !key.ctrl && !key.meta && input !== ' ') {
        setMode('prefix');
        setPrefix(input);
      }
    } else if (mode === 'prefix') {
      if (key.escape) resetBar();
      else if (key.return) doRun();
      else if (key.tab) { setFileToggled(t => !t); setMode('suffix'); }
      else setPrefix(p => editText(p, input, key));
    } else {
      if (key.escape) resetBar();
      else if (key.return) doRun();
      else if (key.tab) setFileToggled(t => !t);
      else setSuffix(s => editText(s, input, key));
    }
  });

  return (
    <Box flexDirection="column">
      {windowedNodes.map((node, i) => {
        const isActive = i + nav.offset === nav.cursor;
        const gitStatus = gitMap.get(node.path);
        const indent = '  '.repeat(node.depth);
        const arrow = node.isDir ? (expanded.has(node.path) ? '▼ ' : '▶ ') : '  ';

        let color: string | undefined;
        if (gitStatus === 'modified') color = 'yellow';
        else if (gitStatus === 'untracked') color = 'green';

        return (
          <Text
            key={node.path}
            bold={node.isDir}
            inverse={isActive}
            color={color}
            dimColor={gitStatus === 'ignored' && !isActive}
          >
            {indent}{arrow}{node.name}
          </Text>
        );
      })}

      <Text dimColor>{sep}</Text>

      {mode === 'nav' ? (
        <Text dimColor>  ↑↓ move  ←→ fold  [type] run  q quit</Text>
      ) : (
        <Box>
          <Text color={mode === 'prefix' ? 'cyan' : undefined}>{prefix}</Text>
          <Text> </Text>
          <Text
            color={fileToggled ? 'blue' : undefined}
            bold={fileToggled}
            dimColor={!fileToggled}
          >
            {selectedNode?.name ?? ''}
          </Text>
          <Text> </Text>
          <Text color={mode === 'suffix' ? 'cyan' : undefined}>{suffix}</Text>
          <Text color="cyan">▌</Text>
          <Text dimColor>   [Tab] toggle file  [↵] run  [Esc] cancel</Text>
        </Box>
      )}
    </Box>
  );
}

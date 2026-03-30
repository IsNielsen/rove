import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import type { Key } from 'ink';
import { dirname } from 'path';
import { readChildren, insertAfter, removeDescendants, FileNode } from './utils/files.js';
import { getGitStatuses, GitStatus } from './utils/git.js';
export interface HistoryEntry {
  cmd: string;
  lines: string[];
}

const KeyBinding = ({ keys, description }: { keys: string[], description: string }) => (
  <Box gap={2}>
    <Box width={16}>
      {keys.map(k => <Text key={k} color="cyan" bold>[{k}]</Text>)}
    </Box>
    <Text dimColor>{description}</Text>
  </Box>
);

interface Props {
  cwd: string;
  gitMode: boolean;
  maxDepth: number;
  onCommand: (cmd: string) => void;
  onCwdChange?: (cwd: string) => void;
  showBanner?: boolean;
  history?: HistoryEntry[];
}

type Mode = 'nav' | 'cmd' | 'filter';

const BANNER = [
  ' ____   ___  _   _ _____',
  '|  _ \\ / _ \\| | | | ____|',
  '| |_) | | | | | | |  _|',
  '|  _ <| |_| \\ \\_/ / |___',
  '|_| \\_\\\\___/ \\___/|_____|',
  '   EXPLORE THE CONTEXT',
];

function editText(prev: string, input: string, key: Key): string {
  if (key.backspace || key.delete) return prev.slice(0, -1);
  if (input && !key.ctrl && !key.meta) return prev + input;
  return prev;
}

export default function App({ cwd: initialCwd, gitMode, maxDepth, onCommand, onCwdChange, showBanner = true, history = [] }: Props) {
  const { exit } = useApp();

  const [cwd, setCwd] = useState(initialCwd);
  const [nodes, setNodes] = useState<FileNode[]>(() => readChildren(initialCwd, 0));
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // cursor + scrollOffset batched together to avoid double re-render per keypress
  const [nav, setNav] = useState({ cursor: 0, offset: 0 });
  const [termSize, setTermSize] = useState({
    rows: process.stdout.rows ?? 24,
    cols: process.stdout.columns ?? 80,
  });
  const [mode, setMode] = useState<Mode>('nav');
  const [cmdText, setCmdText] = useState('');
  const [cmdCursor, setCmdCursor] = useState(0);
  const [gitMap, setGitMap] = useState<Map<string, GitStatus>>(new Map());
  const [showHelp, setShowHelp] = useState(false);
  const lastGPress = useRef<number>(0);
  const [filterQuery, setFilterQuery] = useState('');
  const [historyScroll, setHistoryScroll] = useState(0);

  const HISTORY_PANEL_HEIGHT = 8;

  const historyLog = useMemo(() => {
    const lines: string[] = [];
    for (const entry of history) {
      lines.push(`$ ${entry.cmd}`);
      for (const l of entry.lines) lines.push(l);
    }
    return lines;
  }, [history]);
  const hasHistory = historyLog.length > 0;

  const historyPanelRows = hasHistory ? HISTORY_PANEL_HEIGHT + 1 : 0;
  const treeHeight = Math.max(1, termSize.rows - 2 - (showBanner ? BANNER.length : 0) - historyPanelRows);

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

  useEffect(() => {
    setHistoryScroll(Math.max(0, historyLog.length - HISTORY_PANEL_HEIGHT));
  }, [historyLog.length]);

  const visibleNodes = useMemo(() => {
    if (!filterQuery) return nodes;
    const q = filterQuery.toLowerCase();
    const matchingPaths = new Set<string>();
    for (const node of nodes) {
      if (node.name.toLowerCase().includes(q) || node.path.toLowerCase().includes(q)) {
        matchingPaths.add(node.path);
        let p = node.path;
        while (true) {
          const slash = p.lastIndexOf('/');
          if (slash <= 0) break;
          p = p.slice(0, slash);
          matchingPaths.add(p);
        }
      }
    }
    return nodes.filter(n => matchingPaths.has(n.path));
  }, [nodes, filterQuery]);

  const windowedNodes = useMemo(
    () => visibleNodes.slice(nav.offset, nav.offset + treeHeight),
    [visibleNodes, nav.offset, treeHeight]
  );

  const sep = useMemo(() => '─'.repeat(termSize.cols), [termSize.cols]);

  const selectedNode = visibleNodes[nav.cursor];

  function moveCursor(next: number) {
    const len = visibleNodes.length;
    setNav(({ cursor: _c, offset }) => {
      const c = Math.max(0, Math.min(next, len - 1));
      const buffer = 5;
      let o = offset;
      if (c < offset + buffer) {
        o = Math.max(0, c - buffer);
      } else if (c >= offset + treeHeight - buffer) {
        o = Math.min(Math.max(0, len - treeHeight), c - treeHeight + buffer + 1);
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

  function navigateUp() {
    const parent = dirname(cwd);
    if (parent === cwd) return; // already at filesystem root
    setCwd(parent);
    setNodes(readChildren(parent, 0));
    setExpanded(new Set());
    setNav({ cursor: 0, offset: 0 });
    onCwdChange?.(parent);
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
    const cmd = cmdText.trim();
    if (!cmd) return;
    onCommand(cmd);
    exit();
  }

  function resetBar() {
    setMode('nav');
    setCmdText('');
    setCmdCursor(0);
  }

  function insertAtCursor(text: string, cur: string, pos: number): string {
    return cur.slice(0, pos) + text + cur.slice(pos);
  }

  useInput((input, key) => {
    if (showHelp) {
      setShowHelp(false);
      return;
    }
    if (mode === 'nav') {

      if (input === '?' && !key.ctrl && !key.meta) { setShowHelp(true); return; }
      const maxScroll = Math.max(0, historyLog.length - HISTORY_PANEL_HEIGHT);
      if (((key.upArrow && key.shift) || input === '[') && hasHistory) {
        setHistoryScroll(s => Math.max(0, s - 1));
      } else if (((key.downArrow && key.shift) || input === ']') && hasHistory) {
        setHistoryScroll(s => Math.min(maxScroll, s + 1));
      } else if (key.upArrow || (input === 'k' && !key.ctrl && !key.meta)) moveCursor(nav.cursor - 1);
      else if (key.downArrow || (input === 'j' && !key.ctrl && !key.meta)) moveCursor(nav.cursor + 1);
      else if ((key.leftArrow || (input === 'h' && !key.ctrl && !key.meta)) && selectedNode?.isDir) doCollapse(selectedNode);
      else if ((key.rightArrow || (input === 'l' && !key.ctrl && !key.meta)) && selectedNode?.isDir) doExpand(selectedNode);
      else if (input === 'G' && !key.ctrl && !key.meta) moveCursor(nodes.length - 1);
      else if (input === 'g' && !key.ctrl && !key.meta) {
        const now = Date.now();
        if (now - lastGPress.current <= 500) {
          moveCursor(0);
          lastGPress.current = 0;
        } else {
          lastGPress.current = now;
        }
      }

      else if (input === 'q' && !key.ctrl && !key.meta) exit();
      else if (input === '-' && !key.ctrl && !key.meta) navigateUp();
      else if (input === '/' && !key.ctrl && !key.meta) setMode('filter');
      else if (key.tab) {
        const insertion = selectedNode ? selectedNode.path + ' ' : '';
        setCmdText(insertion);
        setCmdCursor(insertion.length);
        setMode('cmd');
      } else if (input.length === 1 && !key.ctrl && !key.meta && input !== ' ') {
        setCmdText(input);
        setCmdCursor(1);
        setMode('cmd');
      }
    } else if (mode === 'filter') {
      if (key.escape) {
        setFilterQuery('');
        setMode('nav');
        setNav({ cursor: 0, offset: 0 });
      } else if (key.return) {
        setMode('nav');
      } else {
        const next = editText(filterQuery, input, key);
        if (next !== filterQuery) {
          setFilterQuery(next);
          setNav({ cursor: 0, offset: 0 });
        }
      }
    } else {
      if (key.escape) {
        resetBar();
      } else if (key.return) {
        doRun();
      } else if (key.tab) {
        if (selectedNode) {
          const insertion = selectedNode.path;
          setCmdText(prev => insertAtCursor(insertion, prev, cmdCursor));
          setCmdCursor(pos => pos + insertion.length);
        }
      } else if (key.leftArrow) {
        setCmdCursor(pos => Math.max(0, pos - 1));
      } else if (key.rightArrow) {
        setCmdCursor(pos => Math.min(cmdText.length, pos + 1));
      } else if (key.backspace || key.delete) {
        if (cmdCursor > 0) {
          setCmdText(prev => prev.slice(0, cmdCursor - 1) + prev.slice(cmdCursor));
          setCmdCursor(pos => pos - 1);
        }
      } else if (input && !key.ctrl && !key.meta) {
        setCmdText(prev => insertAtCursor(input, prev, cmdCursor));
        setCmdCursor(pos => pos + input.length);
      }
    }
  });

  if (showHelp) {
    return (
      <Box borderStyle="round" padding={1} flexDirection="column">
        <Text bold>Keybindings</Text>
        <Text> </Text>
        <KeyBinding keys={['↑', 'k']} description="Move up" />
        <KeyBinding keys={['↓', 'j']} description="Move down" />
        <KeyBinding keys={['→', 'l']} description="Expand directory" />
        <KeyBinding keys={['←', 'h']} description="Collapse directory" />
        <KeyBinding keys={['gg']} description="Jump to top" />
        <KeyBinding keys={['G']} description="Jump to bottom" />
        <KeyBinding keys={['-']} description="Go to parent directory" />
        <KeyBinding keys={['/']} description="Filter files" />
        <KeyBinding keys={['Tab']} description="Insert filename" />
        <KeyBinding keys={['Enter']} description="Run command" />
        <KeyBinding keys={['Esc']} description="Cancel / back" />
        <KeyBinding keys={['?']} description="Toggle this help" />
        <KeyBinding keys={['q']} description="Quit" />
        <Text> </Text>
        <Text dimColor>Press any key to close</Text>
      </Box>
    );
  }

  const treePanel = (
    <>
      {showBanner && BANNER.map((line, i) => (
        <Text key={i} dimColor>{line}</Text>
      ))}
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

      {mode === 'nav' && filterQuery ? (
        <Text dimColor>  [/] filter: {filterQuery}  ↑↓ move  ←→ fold  [/] re-filter  q quit</Text>
      ) : mode === 'nav' ? (
        <Text dimColor>  ↑↓ move  ←→ fold  [type] run  q quit{hasHistory ? '  [[] ] scroll history' : ''}</Text>
      ) : mode === 'filter' ? (
        <Box>
          <Text color="cyan">/ {filterQuery}█</Text>
          <Text dimColor>   [↵] confirm  [Esc] clear + exit</Text>
        </Box>
      ) : (
        <Box>
          <Text color="cyan">{`> `}</Text>
          <Text>{cmdText.slice(0, cmdCursor)}</Text>
          <Text inverse>{cmdText[cmdCursor] ?? ' '}</Text>
          <Text>{cmdText.slice(cmdCursor + 1)}</Text>
          <Text dimColor>   [Tab] insert file  [↵] run  [Esc] cancel</Text>
        </Box>
      )}
    </>
  );

  return (
    <Box flexDirection="column">
      {treePanel}
      {hasHistory && (
        <>
          <Text dimColor>{sep}</Text>
          <Box flexDirection="column" height={HISTORY_PANEL_HEIGHT}>
            {historyLog.slice(historyScroll, historyScroll + HISTORY_PANEL_HEIGHT).map((line, i) => (
              <Text key={i} dimColor={line.startsWith('$ ')}>{line}</Text>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}

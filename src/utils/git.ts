import { execSync } from 'child_process';
import { join } from 'path';

export type GitStatus = 'modified' | 'untracked' | 'ignored';

export function getGitStatuses(cwd: string): Map<string, GitStatus> {
  const map = new Map<string, GitStatus>();

  try {
    const output = execSync('git status --porcelain --ignored -uall', {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    for (const line of output.split('\n')) {
      if (!line.trim()) continue;
      const xy = line.slice(0, 2);
      const filePath = line.slice(3).trim();
      const absPath = join(cwd, filePath);

      if (xy === '??') {
        map.set(absPath, 'untracked');
      } else if (xy === '!!') {
        map.set(absPath, 'ignored');
      } else {
        map.set(absPath, 'modified');
      }
    }
  } catch {
    // not a git repo or git unavailable — return empty map
  }

  return map;
}

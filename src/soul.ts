import { execSync } from 'child_process';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as net from 'net';
import type { SoulContext } from './types.js';

const SOCKET_TIMEOUT = 500; // ms - fast timeout for statusline

// Find socket path (standard path first, legacy versioned sockets as fallback)
function findSocketPath(): string | null {
  // Standard socket path (v2.38.0+)
  if (fs.existsSync('/tmp/chitta.sock')) {
    return '/tmp/chitta.sock';
  }

  // Legacy: versioned sockets (e.g., /tmp/chitta-2.32.0.sock)
  try {
    const files = fs.readdirSync('/tmp');
    const sockets = files
      .filter((f: string) => f.startsWith('chitta-') && f.endsWith('.sock'))
      .map((f: string) => `/tmp/${f}`);

    if (sockets.length > 0) {
      sockets.sort((a: string, b: string) => {
        const vA = a.match(/chitta-(\d+\.\d+\.\d+)\.sock/)?.[1] || '0.0.0';
        const vB = b.match(/chitta-(\d+\.\d+\.\d+)\.sock/)?.[1] || '0.0.0';
        return vB.localeCompare(vA, undefined, { numeric: true });
      });
      return sockets[0];
    }
  } catch {
    // /tmp not readable
  }

  return null;
}

// cc-soul CLI locations (in order of preference)
const CLI_PATHS = [
  path.join(os.homedir(), '.claude/bin/chitta_cli'),  // Stable symlink (v2.38.0+)
  path.join(os.homedir(), '.claude/plugins/marketplaces/genomewalker-cc-soul/bin/chitta_cli'),
  path.join(os.homedir(), '.claude/mind/chitta-cli.sh'), // Legacy
];

function getChittaCli(): string | null {
  for (const p of CLI_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// Fast path: query daemon via Unix socket
function getSoulContextFromSocket(): Promise<SoulContext | undefined> {
  return new Promise((resolve) => {
    const socketPath = findSocketPath();
    if (!socketPath) {
      resolve(undefined);
      return;
    }

    const client = net.createConnection(socketPath);
    let data = '';
    let resolved = false;

    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        client.destroy();
        resolve(undefined);
      }
    };

    const timeout = setTimeout(cleanup, SOCKET_TIMEOUT);

    client.on('connect', () => {
      client.write('stats\n');
    });

    client.on('data', (chunk) => {
      data += chunk.toString();
      if (data.includes('\n')) {
        clearTimeout(timeout);
        resolved = true;
        client.destroy();
        try {
          resolve(JSON.parse(data.trim()));
        } catch {
          resolve(undefined);
        }
      }
    });

    client.on('error', cleanup);
    client.on('close', cleanup);
  });
}

// Slow path: spawn CLI (fallback when daemon not running)
function getSoulContextFromCli(): SoulContext | undefined {
  const cli = getChittaCli();
  if (!cli) return undefined;

  try {
    const output = execSync(`"${cli}" stats --json --fast 2>/dev/null`, {
      encoding: 'utf8',
      timeout: 5000,
    });
    return JSON.parse(output.trim());
  } catch {
    // Soul not available or old CLI without --json/--fast
  }
  return undefined;
}

export async function getSoulContextAsync(): Promise<SoulContext | undefined> {
  // Try socket first (fast), fall back to CLI (slow)
  const fromSocket = await getSoulContextFromSocket();
  if (fromSocket) return fromSocket;
  return getSoulContextFromCli();
}

// Sync wrapper for backward compatibility
export function getSoulContext(): SoulContext | undefined {
  // Check if socket exists - if so, caller should use async version
  const socketPath = findSocketPath();
  if (socketPath) {
    // For sync callers when daemon is running, we still try CLI
    // The async path is preferred
    return getSoulContextFromCli();
  }
  return getSoulContextFromCli();
}

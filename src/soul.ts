import { execSync } from 'child_process';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as net from 'net';
import type { SoulContext } from './types.js';

const SOCKET_PATH = '/tmp/chitta.sock';
const SOCKET_TIMEOUT = 500; // ms - fast timeout for statusline

// cc-soul plugin CLI locations (in order of preference)
const CLI_PATHS = [
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
    if (!fs.existsSync(SOCKET_PATH)) {
      resolve(undefined);
      return;
    }

    const client = net.createConnection(SOCKET_PATH);
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
  if (fs.existsSync(SOCKET_PATH)) {
    // For sync callers when daemon is running, we still try CLI
    // The async path is preferred
    return getSoulContextFromCli();
  }
  return getSoulContextFromCli();
}

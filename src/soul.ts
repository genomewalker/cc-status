import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as net from 'net';
import type { SoulContext } from './types.js';

const SOCKET_TIMEOUT = 5000; // ms - soul_context runs spectral compute (can take several seconds on large minds)

// DJB2 hash - must match cc-soul's implementation
function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// Get mind path (same logic as cc-soul)
function getMindPath(): string {
  return process.env.CHITTA_DB_PATH || path.join(os.homedir(), '.claude/mind');
}

// Get socket directory (matches C++ daemon logic: XDG_RUNTIME_DIR > ~/.cache/chitta > /tmp)
function getSocketDir(): string {
  const xdgRuntime = process.env.XDG_RUNTIME_DIR || (process.getuid ? `/run/user/${process.getuid()}` : undefined);
  if (xdgRuntime && fs.existsSync(xdgRuntime)) {
    const dir = path.join(xdgRuntime, 'chitta');
    if (!fs.existsSync(dir)) {
      try { fs.mkdirSync(dir, { mode: 0o700 }); } catch {}
    }
    return dir;
  }
  const home = os.homedir();
  if (home) {
    const cacheDir = path.join(home, '.cache');
    if (!fs.existsSync(cacheDir)) {
      try { fs.mkdirSync(cacheDir, { mode: 0o755 }); } catch {}
    }
    const dir = path.join(cacheDir, 'chitta');
    if (!fs.existsSync(dir)) {
      try { fs.mkdirSync(dir, { mode: 0o700 }); } catch {}
    }
    return dir;
  }
  return '/tmp';
}

// Derive socket path from mind path (same as cc-soul)
function socketPathForMind(mindPath: string): string {
  return path.join(getSocketDir(), `chitta-${djb2Hash(mindPath)}.sock`);
}

// Find socket path for current mind
function findSocketPath(): string | null {
  const mindPath = getMindPath();
  const socketPath = socketPathForMind(mindPath);

  if (fs.existsSync(socketPath)) {
    return socketPath;
  }

  return null;
}

// Query daemon via Unix socket (JSON-RPC protocol)
function socketCall(socketPath: string, method: string): Promise<unknown> {
  return new Promise((resolve) => {
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
      const request = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: method, arguments: {} }
      });
      client.write(request + '\n');
    });

    client.on('data', (chunk) => {
      data += chunk.toString();
      const nlIdx = data.indexOf('\n');
      if (nlIdx !== -1) {
        clearTimeout(timeout);
        resolved = true;
        client.destroy();
        try {
          const response = JSON.parse(data.slice(0, nlIdx).trim());
          resolve(response.result?.structured ?? undefined);
        } catch {
          resolve(undefined);
        }
      }
    });

    client.on('error', cleanup);
    client.on('close', cleanup);
  });
}

interface HealthCheck {
  memory_count?: number;
  symbol_count?: number;
  avg_confidence?: number;
  count_by_kind?: Record<string, number>;
  software_version?: string;
}

export async function getSoulContextAsync(): Promise<SoulContext | undefined> {
  const socketPath = findSocketPath();
  if (!socketPath) return undefined;

  // health_check reuses the same memory_stats/spectral caches as soul_context
  // but skips the uncached recall_by_kind() scans, so it returns in <60ms even
  // on cold caches vs. 5–15s for soul_context on large minds.
  const hc = (await socketCall(socketPath, 'health_check')) as HealthCheck | undefined;
  if (!hc) return undefined;

  const cbk = hc.count_by_kind ?? {};
  return {
    total_memories: hc.memory_count ?? 0,
    wisdom_nodes:   cbk.wisdom    ?? 0,
    beliefs:        cbk.belief    ?? 0,
    episodes:       cbk.episode   ?? 0,
    corrections:    cbk.correction ?? 0,
    preferences:    cbk.preference ?? 0,
    avg_confidence: hc.avg_confidence ?? 0,
    count_by_kind:  cbk,
    version:        hc.software_version,
  };
}

// Sync wrapper - daemon only, no CLI fallback
export function getSoulContext(): SoulContext | undefined {
  // Sync callers should use async version
  // Return undefined - daemon handles everything
  return undefined;
}

import { execSync } from 'child_process';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as net from 'net';
const SOCKET_TIMEOUT = 500; // ms - fast timeout for statusline
// DJB2 hash - must match cc-soul's implementation
function djb2Hash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
    }
    return hash;
}
// Get mind path (same logic as cc-soul)
function getMindPath() {
    return process.env.CHITTA_DB_PATH || path.join(os.homedir(), '.claude/mind/chitta');
}
// Derive socket path from mind path (same as cc-soul)
function socketPathForMind(mindPath) {
    return `/tmp/chitta-${djb2Hash(mindPath)}.sock`;
}
// Find socket path for current mind
function findSocketPath() {
    const mindPath = getMindPath();
    const socketPath = socketPathForMind(mindPath);
    if (fs.existsSync(socketPath)) {
        return socketPath;
    }
    return null;
}
// cc-soul CLI locations (in order of preference)
const CLI_PATHS = [
    path.join(os.homedir(), '.claude/bin/chitta_cli'), // Stable symlink (v2.38.0+)
    path.join(os.homedir(), '.claude/plugins/marketplaces/genomewalker-cc-soul/bin/chitta_cli'),
    path.join(os.homedir(), '.claude/mind/chitta-cli.sh'), // Legacy
];
function getChittaCli() {
    for (const p of CLI_PATHS) {
        if (fs.existsSync(p))
            return p;
    }
    return null;
}
// Fast path: query daemon via Unix socket
function getSoulContextFromSocket() {
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
                }
                catch {
                    resolve(undefined);
                }
            }
        });
        client.on('error', cleanup);
        client.on('close', cleanup);
    });
}
// Slow path: spawn CLI (fallback when daemon not running)
function getSoulContextFromCli() {
    const cli = getChittaCli();
    if (!cli)
        return undefined;
    try {
        const output = execSync(`"${cli}" stats --json --fast 2>/dev/null`, {
            encoding: 'utf8',
            timeout: 5000,
        });
        return JSON.parse(output.trim());
    }
    catch {
        // Soul not available or old CLI without --json/--fast
    }
    return undefined;
}
export async function getSoulContextAsync() {
    // Try socket first (fast), fall back to CLI (slow)
    const fromSocket = await getSoulContextFromSocket();
    if (fromSocket)
        return fromSocket;
    return getSoulContextFromCli();
}
// Sync wrapper for backward compatibility
export function getSoulContext() {
    // Check if socket exists - if so, caller should use async version
    const socketPath = findSocketPath();
    if (socketPath) {
        // For sync callers when daemon is running, we still try CLI
        // The async path is preferred
        return getSoulContextFromCli();
    }
    return getSoulContextFromCli();
}
//# sourceMappingURL=soul.js.map
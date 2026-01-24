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
// Fast path: query daemon via Unix socket (JSON-RPC protocol)
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
            // JSON-RPC request for soul_context tool
            const request = JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'tools/call',
                params: { name: 'soul_context', arguments: {} }
            });
            client.write(request + '\n');
        });
        client.on('data', (chunk) => {
            data += chunk.toString();
            if (data.includes('\n')) {
                clearTimeout(timeout);
                resolved = true;
                client.destroy();
                try {
                    const response = JSON.parse(data.trim());
                    // Extract structured data from JSON-RPC response
                    if (response.result?.content?.[0]?.data) {
                        resolve(response.result.content[0].data);
                    }
                    else {
                        resolve(undefined);
                    }
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
export async function getSoulContextAsync() {
    return getSoulContextFromSocket();
}
// Sync wrapper - daemon only, no CLI fallback
export function getSoulContext() {
    // Sync callers should use async version
    // Return undefined - daemon handles everything
    return undefined;
}
//# sourceMappingURL=soul.js.map
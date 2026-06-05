import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
const CACHE_DIR = path.join(os.tmpdir(), 'cc-status');
const CACHE_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes
// Current session_id, set when we first read stdin. Used to scope the cache
// file so multiple independent Claude Code sessions don't cross-pollute.
let currentSessionId;
function getCacheFile() {
    if (currentSessionId) {
        return path.join(CACHE_DIR, `main-context-${currentSessionId}.json`);
    }
    // Fallback for sessions without an id
    return path.join(CACHE_DIR, 'main-context.json');
}
function ensureCacheDir() {
    try {
        if (!fs.existsSync(CACHE_DIR)) {
            fs.mkdirSync(CACHE_DIR, { recursive: true });
        }
    }
    catch {
        // Ignore
    }
}
export async function readStdin() {
    if (process.stdin.isTTY) {
        return null;
    }
    const chunks = [];
    try {
        process.stdin.setEncoding('utf8');
        for await (const chunk of process.stdin) {
            chunks.push(chunk);
        }
        const raw = chunks.join('');
        if (!raw.trim()) {
            return null;
        }
        const data = JSON.parse(raw);
        // Capture session_id early so cache files are scoped per-session.
        // This prevents independent Claude Code instances (e.g. one in Prism,
        // one in a regular terminal) from cross-polluting each other's data.
        if (data.session_id) {
            currentSessionId = data.session_id;
        }
        return data;
    }
    catch {
        return null;
    }
}
export function getModelName(stdin) {
    return stdin.model?.display_name ?? stdin.model?.id ?? '...';
}
// Detect if stdin looks like subagent data.
// Claude Code passes session_id for the main session. Subagent invocations
// have a different (or missing) session_id and typically use smaller models.
// We use haiku model detection and missing session_id as heuristics.
// NOTE: We no longer compare session_ids across a global cache, because that
// caused cross-pollution between independent Claude Code instances (e.g. one
// in Prism, one in a regular terminal) — each would see the other as a
// "subagent" and display the other session's stale token data.
export function isSubagentContext(stdin) {
    const model = (stdin.model?.display_name ?? stdin.model?.id ?? '').toLowerCase();
    // Haiku is always a subagent
    if (model.includes('haiku'))
        return true;
    // If we have a cached main context for THIS session and the session_ids
    // differ, this is a subagent within the same parent session
    if (stdin.session_id) {
        const cached = getCachedMainContext();
        if (cached?.session_id && cached.session_id !== stdin.session_id) {
            return true;
        }
    }
    return false;
}
// Cache main session context for use when subagent is active.
// Cache is scoped per session_id so independent Claude Code instances
// don't overwrite each other's data.
export function cacheMainContext(stdin) {
    try {
        ensureCacheDir();
        const data = {
            timestamp: Date.now(),
            stdin,
        };
        fs.writeFileSync(getCacheFile(), JSON.stringify(data), 'utf8');
    }
    catch {
        // Ignore cache write errors
    }
}
// Get cached main session context (scoped to current session)
export function getCachedMainContext() {
    try {
        const cacheFile = getCacheFile();
        if (!fs.existsSync(cacheFile))
            return null;
        const raw = fs.readFileSync(cacheFile, 'utf8');
        const data = JSON.parse(raw);
        // Check if cache is too old
        if (Date.now() - data.timestamp > CACHE_MAX_AGE_MS) {
            return null;
        }
        return data.stdin;
    }
    catch {
        return null;
    }
}
// Claude 4.x and 3.7 support 1M context in Claude Code unless opted out.
// Opus 4.x always uses 1M regardless of CLAUDE_CODE_DISABLE_1M_CONTEXT.
// Falls back to 200K for all older models.
function detectContextWindowSize(modelId) {
    if (!modelId)
        return 200_000;
    const id = modelId.toLowerCase();
    if (/claude-opus-4/.test(id))
        return 1_000_000;
    const is4x = /claude-(sonnet|haiku)-4/.test(id);
    const is37 = /claude-3-7/.test(id);
    if ((is4x || is37) && process.env.CLAUDE_CODE_DISABLE_1M_CONTEXT !== '1') {
        return 1_000_000;
    }
    return 200_000;
}
export function getContextStats(stdin) {
    const cw = stdin.context_window;
    const size = cw?.context_window_size ?? detectContextWindowSize(stdin.model?.id);
    // Use current_usage which reflects actual context window fill.
    // total_*_tokens are cumulative across the session (grow past the window after compaction)
    // and are useless for showing how full the context currently is.
    // Per Claude Code docs, input_tokens, cache_creation_input_tokens, and
    // cache_read_input_tokens are separate non-overlapping counts.
    // used_percentage = input_tokens + cache_creation + cache_read (no output).
    // We add output_tokens for full context window fill.
    const usage = cw?.current_usage;
    const inputTokens = (usage?.input_tokens ?? 0)
        + (usage?.cache_creation_input_tokens ?? 0)
        + (usage?.cache_read_input_tokens ?? 0);
    const outputTokens = usage?.output_tokens ?? 0;
    const tokens = inputTokens + outputTokens;
    const percent = Math.min(100, Math.round((tokens / size) * 100));
    const remaining = Math.max(0, 100 - percent);
    if (process.env.CC_STATUS_DEBUG) {
        const totalInput = cw?.total_input_tokens ?? 0;
        const totalOutput = cw?.total_output_tokens ?? 0;
        console.error(`[cc-status debug] current_usage: input=${usage?.input_tokens} output=${usage?.output_tokens} cache_read=${usage?.cache_read_input_tokens} cache_create=${usage?.cache_creation_input_tokens}`);
        console.error(`[cc-status debug] cumulative: input=${totalInput} output=${totalOutput}`);
        console.error(`[cc-status debug] context fill: ${tokens}/${size} = ${percent}%`);
    }
    return { tokens, size, percent, remaining };
}
//# sourceMappingURL=stdin.js.map
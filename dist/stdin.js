import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
const CACHE_FILE = path.join(os.tmpdir(), 'cc-status-main-context.json');
const CACHE_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes
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
        return JSON.parse(raw);
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
// We compare the current session_id against the cached main context to detect
// subagent context switches, with haiku as a reliable fallback heuristic.
export function isSubagentContext(stdin) {
    const model = (stdin.model?.display_name ?? stdin.model?.id ?? '').toLowerCase();
    // Haiku is always a subagent
    if (model.includes('haiku'))
        return true;
    // If we have a cached main context with a session_id, and the current
    // session_id differs, this is likely a subagent using a different model
    if (stdin.session_id) {
        const cached = getCachedMainContext();
        if (cached?.session_id && cached.session_id !== stdin.session_id) {
            return true;
        }
    }
    return false;
}
// Cache main session context for use when subagent is active
export function cacheMainContext(stdin) {
    try {
        const data = {
            timestamp: Date.now(),
            stdin,
        };
        fs.writeFileSync(CACHE_FILE, JSON.stringify(data), 'utf8');
    }
    catch {
        // Ignore cache write errors
    }
}
// Get cached main session context
export function getCachedMainContext() {
    try {
        if (!fs.existsSync(CACHE_FILE))
            return null;
        const raw = fs.readFileSync(CACHE_FILE, 'utf8');
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
export function getContextStats(stdin) {
    const cw = stdin.context_window;
    const size = cw?.context_window_size ?? 200000;
    // Use current_usage which reflects actual context window fill.
    // total_*_tokens are cumulative across the session (grow past the window after compaction)
    // and are useless for showing how full the context currently is.
    // input_tokens already includes both cache_creation and cache_read tokens
    const usage = cw?.current_usage;
    const inputTokens = usage?.input_tokens ?? 0;
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
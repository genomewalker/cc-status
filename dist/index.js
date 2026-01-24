import { fileURLToPath } from 'node:url';
import { readStdin, isSubagentContext, cacheMainContext, getCachedMainContext } from './stdin.js';
import { parseTranscript } from './transcript.js';
import { countConfigs } from './configs.js';
import { getGitInfo } from './git.js';
import { getSoulContextAsync } from './soul.js';
import { render } from './render/index.js';
export function formatSessionDuration(sessionStart, now = () => Date.now()) {
    if (!sessionStart)
        return '';
    const ms = now() - sessionStart.getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1)
        return '<1m';
    if (mins < 60)
        return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h${remainingMins}m`;
}
export async function main() {
    try {
        const stdin = await readStdin();
        if (!stdin) {
            console.log('[cc-status] Initializing...');
            return;
        }
        if (process.env.CC_STATUS_DEBUG) {
            console.error(`[cc-status debug] full stdin keys: ${Object.keys(stdin).join(', ')}`);
        }
        const transcriptPath = stdin.transcript_path ?? '';
        const transcript = await parseTranscript(transcriptPath);
        const configs = countConfigs(stdin.cwd);
        const git = getGitInfo();
        const soul = await getSoulContextAsync();
        const sessionDuration = formatSessionDuration(transcript.sessionStart);
        // Determine if this is subagent context and handle caching
        const isSubagent = isSubagentContext(stdin);
        let contextStdin = stdin;
        let usingCachedContext = false;
        if (isSubagent) {
            // Try to use cached main session context for the context bar
            const cached = getCachedMainContext();
            if (cached) {
                contextStdin = cached;
                usingCachedContext = true;
            }
        }
        else {
            // Cache main session context for later use
            cacheMainContext(stdin);
        }
        const ctx = {
            stdin,
            transcript,
            configs,
            git,
            soul,
            sessionDuration,
            contextStdin,
            isSubagent,
            usingCachedContext,
        };
        render(ctx);
    }
    catch (error) {
        console.log('[cc-status] Error:', error instanceof Error ? error.message : 'Unknown error');
    }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    void main();
}
//# sourceMappingURL=index.js.map
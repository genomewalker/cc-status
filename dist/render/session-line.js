import { getModelName, getContextStats } from '../stdin.js';
import { renderContextBar } from './context-bar.js';
import { getSessionCost, calculateTokensPerMinute } from '../cost.js';
import { dim, white, cyan, red, yellow, magenta, green, blue, RESET, DIM } from '../colors.js';
function formatK(n) {
    if (n >= 1_000_000)
        return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)
        return `${(n / 1_000).toFixed(0)}K`;
    return `${n}`;
}
export function renderSessionLine(ctx) {
    const parts = [];
    // Repo:branch
    if (ctx.git) {
        parts.push(`${white(ctx.git.repo)}${DIM}:${RESET}${white(ctx.git.branch)}`);
    }
    else {
        parts.push(dim('~'));
    }
    // Model (with subagent indicator)
    const model = getModelName(ctx.stdin);
    if (ctx.isSubagent) {
        parts.push(yellow(`[${model}>]`));
    }
    else {
        parts.push(cyan(`[${model}]`));
    }
    // Duration
    if (ctx.sessionDuration) {
        parts.push(white(ctx.sessionDuration));
    }
    // Git diff
    if (ctx.git && (ctx.git.added > 0 || ctx.git.deleted > 0)) {
        parts.push(dim(`+${ctx.git.added}/-${ctx.git.deleted}`));
    }
    // Context bar with token counts (uses main session context even during subagent)
    const stats = getContextStats(ctx.contextStdin);
    const usage = ctx.contextStdin.context_window?.current_usage;
    const inTok = (usage?.input_tokens ?? 0) + (usage?.cache_read_input_tokens ?? 0);
    const outTok = usage?.output_tokens ?? 0;
    const tokStr = `${formatK(inTok)}↓${formatK(outTok)}↑`;
    const cacheIndicator = ctx.usingCachedContext ? magenta('<') : '';
    parts.push(`${cacheIndicator}${renderContextBar(stats.percent, stats.remaining)} ${dim(tokStr)}`);
    // Compact warning on main line
    if (stats.remaining < 5) {
        parts.push(red('⚠ COMPACT'));
    }
    return parts.join(` ${DIM}|${RESET} `);
}
// Separate info line for cost, rate, and config counts
export function renderInfoLine(ctx) {
    // Use contextStdin (main session, even during subagent) for tokens AND cost
    const cw = ctx.contextStdin.context_window;
    const inTok = cw?.total_input_tokens ?? 0;
    const outTok = cw?.total_output_tokens ?? 0;
    const totalTok = inTok + outTok;
    const parts = [];
    const sessionMs = ctx.sessionDurationMs;
    // Cost: prefer stdin's pre-calculated cost, fall back to local estimation
    // Use contextStdin for model/cost to avoid mixing subagent data with main session tokens
    if (sessionMs > 0) {
        const model = getModelName(ctx.contextStdin);
        const cost = getSessionCost(ctx.contextStdin.cost?.total_cost_usd, model, inTok, outTok, sessionMs);
        const tokPerMin = calculateTokensPerMinute(totalTok, sessionMs);
        if (cost.totalCost > 0.001) {
            const costStr = cost.totalCost < 1
                ? `${(cost.totalCost * 100).toFixed(1)}¢`
                : `$${cost.totalCost.toFixed(2)}`;
            const rateStr = `$${cost.hourlyRate.toFixed(2)}/h`;
            parts.push(green(`${costStr} ${rateStr}`));
        }
        if (tokPerMin > 0) {
            parts.push(dim(`${formatK(tokPerMin)}/m`));
        }
    }
    // API time ratio: how much of wall time is spent in API calls
    const apiMs = ctx.stdin.cost?.total_api_duration_ms;
    if (apiMs != null && sessionMs > 0) {
        const apiPct = Math.round((apiMs / sessionMs) * 100);
        parts.push(dim(`api ${apiPct}%`));
    }
    // Cache efficiency: what fraction of input tokens came from cache
    const usage = cw?.current_usage;
    const cacheRead = usage?.cache_read_input_tokens ?? 0;
    const totalInput = (usage?.input_tokens ?? 0) + cacheRead;
    if (cacheRead > 0 && totalInput > 0) {
        const cachePct = Math.round((cacheRead / totalInput) * 100);
        parts.push(blue(`cache ${cachePct}%`));
    }
    // Config counts
    const extras = [];
    if (ctx.configs.claudeMdCount > 0) {
        extras.push(`${ctx.configs.claudeMdCount} CLAUDE.md`);
    }
    if (ctx.configs.mcpCount > 0) {
        extras.push(`${ctx.configs.mcpCount} MCPs`);
    }
    if (ctx.configs.hooksCount > 0) {
        extras.push(`${ctx.configs.hooksCount} hooks`);
    }
    if (extras.length > 0) {
        parts.push(dim(extras.join(' ')));
    }
    if (parts.length === 0)
        return null;
    return parts.join(` ${DIM}|${RESET} `);
}
//# sourceMappingURL=session-line.js.map
import { getModelName, getContextStats, isSubagentContext } from '../stdin.js';
import { renderContextBar } from './context-bar.js';
import { dim, white, cyan, red, yellow, RESET, DIM } from '../colors.js';
export function renderSessionLine(ctx) {
    const parts = [];
    const isSubagent = isSubagentContext(ctx.stdin);
    // Repo:branch
    if (ctx.git) {
        parts.push(`${white(ctx.git.repo)}${DIM}:${RESET}${white(ctx.git.branch)}`);
    }
    else {
        parts.push(dim('~'));
    }
    // Model (with subagent indicator)
    const model = getModelName(ctx.stdin);
    if (isSubagent) {
        parts.push(yellow(`[${model}*]`));
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
    // Context bar
    const stats = getContextStats(ctx.stdin);
    parts.push(renderContextBar(stats.percent, stats.remaining));
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
    // Compact warning
    if (stats.remaining < 5) {
        parts.push(red('⚠ COMPACT'));
    }
    return parts.join(` ${DIM}|${RESET} `);
}
//# sourceMappingURL=session-line.js.map
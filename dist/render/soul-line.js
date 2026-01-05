import { dim, magenta, green, yellow, red, white } from '../colors.js';
function coherenceColor(value) {
    if (value >= 0.8)
        return green(`${(value * 100).toFixed(0)}%`);
    if (value >= 0.5)
        return yellow(`${(value * 100).toFixed(0)}%`);
    return red(`${(value * 100).toFixed(0)}%`);
}
function formatNodes(soul) {
    const parts = [];
    if (soul.hot > 0)
        parts.push(`${soul.hot}h`);
    if (soul.warm > 0)
        parts.push(`${soul.warm}w`);
    if (soul.cold > 0)
        parts.push(`${soul.cold}c`);
    return parts.length > 0 ? parts.join('/') : `${soul.total}`;
}
export function renderSoulLine(ctx) {
    if (!ctx.soul)
        return null;
    const parts = [];
    // Soul indicator
    parts.push(magenta('◈'));
    // Coherence (tau as primary)
    const coh = ctx.soul.coherence;
    parts.push(`${dim('τ:')}${coherenceColor(coh.tau)}`);
    // Node stats
    parts.push(`${dim('nodes:')}${white(formatNodes(ctx.soul))}`);
    // Yantra status
    if (!ctx.soul.yantra) {
        parts.push(yellow('yantra?'));
    }
    return parts.join(' ');
}
//# sourceMappingURL=soul-line.js.map
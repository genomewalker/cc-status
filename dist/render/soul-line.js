import { dim, magenta, green, yellow, red, white } from '../colors.js';
function statusIcon(status) {
    switch (status) {
        case 'healthy': return green('●');
        case 'degraded': return yellow('◐');
        case 'repair_needed': return yellow('◑');
        case 'critical': return red('○');
        default: return dim('?');
    }
}
function formatWithUnits(n) {
    if (n >= 1_000_000)
        return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)
        return `${(n / 1_000).toFixed(1)}K`;
    return `${n}`;
}
function confidenceColor(value) {
    const pct = (value * 100).toFixed(0);
    if (value >= 0.7)
        return green(`${pct}%`);
    if (value >= 0.4)
        return yellow(`${pct}%`);
    return red(`${pct}%`);
}
export function renderSoulLine(ctx) {
    if (!ctx.soul)
        return null;
    const parts = [];
    // Soul indicator with version
    parts.push(magenta('◈'));
    if (ctx.soul.version) {
        parts.push(dim(`v${ctx.soul.version}`));
    }
    parts.push(statusIcon(ctx.soul.status));
    // Node count
    parts.push(`${dim('n:')}${white(formatWithUnits(ctx.soul.total_nodes))}`);
    // Triplets
    parts.push(`${dim('t:')}${white(formatWithUnits(ctx.soul.triplet_count))}`);
    // Confidence
    parts.push(`${dim('c:')}${confidenceColor(ctx.soul.avg_confidence)}`);
    // Tracking indicator
    if (ctx.soul.transcripts_tracked > 0) {
        parts.push(green(`◉${ctx.soul.transcripts_tracked}`));
    }
    // Yantra status
    if (!ctx.soul.yantra_ready) {
        parts.push(yellow('yantra?'));
    }
    return parts.join(' ');
}
//# sourceMappingURL=soul-line.js.map
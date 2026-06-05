import { dim, magenta, green, yellow, red, white, cyan } from '../colors.js';
function formatWithUnits(n) {
    if (n >= 1_000_000)
        return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)
        return `${(n / 1_000).toFixed(0)}K`;
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
    const soul = ctx.soul;
    parts.push(magenta('◈'));
    if (soul.version) {
        parts.push(dim(`v${soul.version}`));
    }
    // Memory stats: total with confidence (omit when unavailable — fast-path health_check omits avg_confidence)
    const memStr = soul.avg_confidence > 0
        ? `${dim('mem:')}${white(formatWithUnits(soul.total_memories))} ${confidenceColor(soul.avg_confidence)}`
        : `${dim('mem:')}${white(formatWithUnits(soul.total_memories))}`;
    parts.push(memStr);
    // Pending embeddings — non-zero means recall quality degraded for new memories
    if (soul.pending_count > 0) {
        parts.push(`${dim('pending:')}${yellow(formatWithUnits(soul.pending_count))}`);
    }
    // Habits (learned behaviors)
    const habits = soul.count_by_kind.habit ?? 0;
    if (habits > 0) {
        parts.push(`${dim('habits:')}${cyan(formatWithUnits(habits))}`);
    }
    // Code symbols
    const symbols = soul.count_by_kind.symbol ?? 0;
    if (symbols > 0) {
        parts.push(`${dim('sym:')}${white(formatWithUnits(symbols))}`);
    }
    return parts.join(' ');
}
//# sourceMappingURL=soul-line.js.map
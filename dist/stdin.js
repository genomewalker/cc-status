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
export function getContextStats(stdin) {
    const usage = stdin.context_window?.current_usage;
    const size = stdin.context_window?.context_window_size ?? 200000;
    const tokens = (usage?.input_tokens ?? 0) +
        (usage?.output_tokens ?? 0) +
        (usage?.cache_read_input_tokens ?? 0);
    const percent = Math.min(100, Math.round((tokens / size) * 100));
    const remaining = Math.max(0, 100 - percent);
    return { tokens, size, percent, remaining };
}
//# sourceMappingURL=stdin.js.map
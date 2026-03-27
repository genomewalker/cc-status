import type { RenderContext } from '../types.js';
import { dim, magenta, green, yellow, red, white, cyan } from '../colors.js';

function formatWithUnits(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

function confidenceColor(value: number): string {
  const pct = (value * 100).toFixed(0);
  if (value >= 0.7) return green(`${pct}%`);
  if (value >= 0.4) return yellow(`${pct}%`);
  return red(`${pct}%`);
}

export function renderSoulLine(ctx: RenderContext): string | null {
  if (!ctx.soul) return null;

  const parts: string[] = [];
  const soul = ctx.soul;

  parts.push(magenta('◈'));
  if (soul.version) {
    parts.push(dim(`v${soul.version}`));
  }

  // Memory stats: total with confidence
  parts.push(`${dim('mem:')}${white(formatWithUnits(soul.total_memories))} ${confidenceColor(soul.avg_confidence)}`);

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

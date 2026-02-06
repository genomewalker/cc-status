import type { RenderContext } from '../types.js';
import { dim, magenta, green, yellow, red, white, cyan } from '../colors.js';

function statusIcon(status: string): string {
  return status === 'OK' ? green('✓') : red('✗');
}

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
  const { partnership, memory, code } = ctx.soul;

  // Soul indicator with version and status
  parts.push(magenta('◈'));
  if (ctx.soul.version) {
    parts.push(dim(`v${ctx.soul.version}`));
  }
  parts.push(statusIcon(ctx.soul.status));

  // Memory stats: total memories with confidence
  parts.push(`${dim('mem:')}${white(formatWithUnits(memory.total))} ${confidenceColor(memory.avg_confidence)}`);

  // Partnership stats (preferences + corrections as learning indicators)
  const partnershipTotal = partnership.preferences + partnership.corrections + partnership.insights + partnership.solutions;
  if (partnershipTotal > 0) {
    parts.push(`${dim('learn:')}${cyan(formatWithUnits(partnershipTotal))}`);
  }

  // Code intelligence: symbols and projects
  if (code.symbols > 0) {
    const projCount = code.projects?.length ?? 0;
    parts.push(`${dim('code:')}${white(formatWithUnits(code.symbols))}${projCount > 0 ? dim(`@${projCount}`) : ''}`);
  }

  // Yantra status (only show if not ready)
  if (!ctx.soul.yantra_ready) {
    parts.push(yellow('yantra?'));
  }

  return parts.join(' ');
}

import type { RenderContext, SoulContext } from '../types.js';
import { dim, magenta, green, yellow, red, orange, blue, white, cyan } from '../colors.js';

function metricColor(value: number): string {
  if (value >= 0.8) return green(`${(value * 100).toFixed(0)}%`);
  if (value >= 0.5) return yellow(`${(value * 100).toFixed(0)}%`);
  return red(`${(value * 100).toFixed(0)}%`);
}

function statusColor(status: string): string {
  switch (status) {
    case 'healthy': return green('●');
    case 'degraded': return yellow('◐');
    case 'repair_needed': return orange('◑');
    case 'critical': return red('○');
    default: return dim('?');
  }
}

function formatWithUnits(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}G`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function formatNodes(soul: SoulContext): string {
  return [
    red(formatWithUnits(soul.hot)),
    orange(formatWithUnits(soul.warm)),
    blue(formatWithUnits(soul.cold)),
  ].join(dim('/'));
}

export function renderSoulLine(ctx: RenderContext): string | null {
  if (!ctx.soul) return null;

  const parts: string[] = [];

  // Soul indicator with version
  parts.push(magenta('◈'));
  parts.push(dim(`v${ctx.soul.version}`));

  // Sāmarasya (coherence) - τ
  const coh = ctx.soul.coherence;
  parts.push(`${dim('τ:')}${metricColor(coh.tau)}`);

  // Ojas (vitality) - ψ with status indicator
  if (ctx.soul.ojas) {
    const ojas = ctx.soul.ojas;
    parts.push(`${dim('ψ:')}${metricColor(ojas.psi)}${statusColor(ojas.status)}`);
  }

  // Node stats with total
  const total = formatWithUnits(ctx.soul.total);
  parts.push(`${dim('nodes:')}${white(total)} ${dim('(')}${formatNodes(ctx.soul)}${dim(')')}`);

  // Yantra status
  if (!ctx.soul.yantra) {
    parts.push(yellow('yantra?'));
  }

  return parts.join(' ');
}

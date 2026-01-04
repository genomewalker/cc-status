import type { RenderContext, SoulContext } from '../types.js';
import { dim, magenta, green, yellow, red, white, DIM, RESET } from '../colors.js';

function coherenceColor(value: number): string {
  if (value >= 0.8) return green(`${(value * 100).toFixed(0)}%`);
  if (value >= 0.5) return yellow(`${(value * 100).toFixed(0)}%`);
  return red(`${(value * 100).toFixed(0)}%`);
}

function formatNodes(soul: SoulContext): string {
  const { hot_nodes, warm_nodes, cold_nodes, total_nodes } = soul.statistics;
  const parts: string[] = [];
  if (hot_nodes > 0) parts.push(`${hot_nodes}h`);
  if (warm_nodes > 0) parts.push(`${warm_nodes}w`);
  if (cold_nodes > 0) parts.push(`${cold_nodes}c`);
  return parts.length > 0 ? parts.join('/') : `${total_nodes}`;
}

export function renderSoulLine(ctx: RenderContext): string | null {
  if (!ctx.soul) return null;

  const parts: string[] = [];

  // Soul indicator
  parts.push(magenta('◈'));

  // Coherence (using global as primary)
  const coh = ctx.soul.coherence;
  parts.push(`${dim('coh:')}${coherenceColor(coh.global)}`);

  // Tau-k (Kendall correlation)
  if (coh.tau_k !== undefined) {
    parts.push(`${dim('τ:')}${coherenceColor(coh.tau_k)}`);
  }

  // Node stats
  parts.push(`${dim('nodes:')}${white(formatNodes(ctx.soul))}`);

  // Yantra status
  if (!ctx.soul.yantra_ready) {
    parts.push(yellow('yantra?'));
  }

  return parts.join(' ');
}

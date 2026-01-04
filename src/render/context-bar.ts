import { getContextColor, DIM, RESET } from '../colors.js';

const BAR_WIDTH = 15;

export function renderContextBar(percent: number, remaining: number): string {
  const fillCount = Math.min(BAR_WIDTH, Math.round((percent / 100) * BAR_WIDTH));
  const filled = '▓'.repeat(fillCount);
  const empty = '▓'.repeat(BAR_WIDTH - fillCount);
  const color = getContextColor(remaining);

  return `${color}${filled}${RESET}${DIM}${empty}${RESET} ${color}${remaining}%${RESET}`;
}

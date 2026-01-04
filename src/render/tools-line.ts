import type { RenderContext } from '../types.js';
import { yellow, green, cyan, dim } from '../colors.js';

function truncatePath(path: string, maxLen = 20): string {
  if (path.length <= maxLen) return path;
  const parts = path.split('/');
  const filename = parts.pop() || path;
  if (filename.length >= maxLen) {
    return filename.slice(0, maxLen - 3) + '...';
  }
  return '.../' + filename;
}

export function renderToolsLine(ctx: RenderContext): string | null {
  const { tools } = ctx.transcript;
  if (tools.length === 0) return null;

  const parts: string[] = [];

  const runningTools = tools.filter(t => t.status === 'running');
  const completedTools = tools.filter(t => t.status === 'completed' || t.status === 'error');

  // Show last 2 running tools
  for (const tool of runningTools.slice(-2)) {
    const target = tool.target ? truncatePath(tool.target) : '';
    parts.push(`${yellow('◐')} ${cyan(tool.name)}${target ? dim(`: ${target}`) : ''}`);
  }

  // Count completed tools
  const toolCounts = new Map<string, number>();
  for (const tool of completedTools) {
    const count = toolCounts.get(tool.name) ?? 0;
    toolCounts.set(tool.name, count + 1);
  }

  const sortedTools = Array.from(toolCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  for (const [name, count] of sortedTools) {
    parts.push(`${green('✓')} ${name} ${dim(`×${count}`)}`);
  }

  if (parts.length === 0) return null;
  return parts.join(' | ');
}

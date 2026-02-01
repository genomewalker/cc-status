import type { RenderContext } from '../types.js';
import { renderSessionLine, renderInfoLine } from './session-line.js';
import { renderSoulLine } from './soul-line.js';
import { renderToolsLine } from './tools-line.js';
import { renderAgentsLine } from './agents-line.js';
import { renderTodosLine } from './todos-line.js';
import { RESET } from '../colors.js';

export function render(ctx: RenderContext): void {
  const lines: string[] = [];

  const sessionLine = renderSessionLine(ctx);
  if (sessionLine) lines.push(sessionLine);

  const infoLine = renderInfoLine(ctx);
  if (infoLine) lines.push(infoLine);

  const soulLine = renderSoulLine(ctx);
  if (soulLine) lines.push(soulLine);

  const toolsLine = renderToolsLine(ctx);
  if (toolsLine) lines.push(toolsLine);

  const agentsLine = renderAgentsLine(ctx);
  if (agentsLine) lines.push(agentsLine);

  const todosLine = renderTodosLine(ctx);
  if (todosLine) lines.push(todosLine);

  for (const line of lines) {
    // Output with reset prefix, no special character replacement
    console.log(`${RESET}${line}${RESET}`);
  }
}

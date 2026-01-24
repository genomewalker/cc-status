import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { StdinData } from './types.js';

const CACHE_FILE = path.join(os.tmpdir(), 'cc-status-main-context.json');
const CACHE_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

export async function readStdin(): Promise<StdinData | null> {
  if (process.stdin.isTTY) {
    return null;
  }

  const chunks: string[] = [];
  try {
    process.stdin.setEncoding('utf8');
    for await (const chunk of process.stdin) {
      chunks.push(chunk as string);
    }
    const raw = chunks.join('');
    if (!raw.trim()) {
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getModelName(stdin: StdinData): string {
  return stdin.model?.display_name ?? stdin.model?.id ?? '...';
}

// Detect if stdin looks like subagent data
export function isSubagentContext(stdin: StdinData): boolean {
  const model = (stdin.model?.display_name ?? stdin.model?.id ?? '').toLowerCase();
  const usage = stdin.context_window?.current_usage;
  const tokens = (usage?.input_tokens ?? 0) + (usage?.output_tokens ?? 0);

  // Haiku model is commonly used for subagents
  if (model.includes('haiku')) return true;

  // Very low token count with no cache suggests fresh subagent
  const cacheTokens = usage?.cache_read_input_tokens ?? 0;
  if (tokens < 5000 && cacheTokens === 0) return true;

  return false;
}

// Cache main session context for use when subagent is active
export function cacheMainContext(stdin: StdinData): void {
  try {
    const data = {
      timestamp: Date.now(),
      stdin,
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data), 'utf8');
  } catch {
    // Ignore cache write errors
  }
}

// Get cached main session context
export function getCachedMainContext(): StdinData | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null;

    const raw = fs.readFileSync(CACHE_FILE, 'utf8');
    const data = JSON.parse(raw);

    // Check if cache is too old
    if (Date.now() - data.timestamp > CACHE_MAX_AGE_MS) {
      return null;
    }

    return data.stdin as StdinData;
  } catch {
    return null;
  }
}

export function getContextStats(stdin: StdinData): {
  tokens: number;
  size: number;
  percent: number;
  remaining: number;
} {
  const usage = stdin.context_window?.current_usage;
  const size = stdin.context_window?.context_window_size ?? 200000;

  const tokens =
    (usage?.input_tokens ?? 0) +
    (usage?.output_tokens ?? 0) +
    (usage?.cache_read_input_tokens ?? 0);

  const percent = Math.min(100, Math.round((tokens / size) * 100));
  const remaining = Math.max(0, 100 - percent);

  if (process.env.CC_STATUS_DEBUG) {
    const cw = stdin.context_window;
    console.error(`[cc-status debug] current_usage: input=${usage?.input_tokens} output=${usage?.output_tokens} cache_read=${usage?.cache_read_input_tokens} cache_create=${usage?.cache_creation_input_tokens}`);
    console.error(`[cc-status debug] totals: total_input=${cw?.total_input_tokens} total_output=${cw?.total_output_tokens}`);
    console.error(`[cc-status debug] calculated: ${tokens}/${size} = ${percent}%`);
  }

  return { tokens, size, percent, remaining };
}

import * as fs from 'fs';
import * as readline from 'readline';
import type { TranscriptData, ToolEntry, AgentEntry, TodoEntry } from './types.js';

interface ToolMapEntry extends ToolEntry {
  id: string;
  startTime: Date;
  endTime?: Date;
}

interface AgentMapEntry extends AgentEntry {
  id: string;
}

export async function parseTranscript(transcriptPath: string): Promise<TranscriptData> {
  const result: TranscriptData = {
    tools: [],
    agents: [],
    todos: [],
  };

  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    return result;
  }

  const toolMap = new Map<string, ToolMapEntry>();
  const agentMap = new Map<string, AgentMapEntry>();
  let latestTodos: TodoEntry[] = [];

  try {
    const fileStream = fs.createReadStream(transcriptPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        processEntry(entry, toolMap, agentMap, latestTodos, result);
      } catch {
        // Skip malformed lines
      }
    }
  } catch {
    // Return partial results on error
  }

  result.tools = Array.from(toolMap.values()).slice(-20);
  result.agents = Array.from(agentMap.values()).slice(-10);
  result.todos = latestTodos;

  return result;
}

type TranscriptEntry = {
  type?: string;
  timestamp?: string;
  isMeta?: boolean;
  isSidechain?: boolean;
  isCompactSummary?: boolean;
  message?: { content?: unknown; stop_reason?: string | null };
};

/**
 * True when this entry closes the main thread's turn: a new user prompt (not a
 * tool result, not meta or sidechain), or an assistant message that ended the
 * turn. A tool or agent without a tool_result by then will never get one; it
 * was interrupted (Esc, crash, killed process, restored conversation).
 */
export function endsTurn(entry: TranscriptEntry): boolean {
  if (entry.isSidechain || entry.isMeta || entry.isCompactSummary) return false;
  const content = entry.message?.content;
  if (entry.type === 'assistant') return entry.message?.stop_reason === 'end_turn';
  if (entry.type !== 'user') return false;
  if (typeof content === 'string') return content.trim().length > 0;
  if (!Array.isArray(content)) return false;
  const blocks = content as Record<string, unknown>[];
  return !blocks.some(b => b?.type === 'tool_result') &&
    blocks.some(b => b?.type === 'text' && typeof b.text === 'string' && b.text.trim().length > 0);
}

function closeOpenWork(
  toolMap: Map<string, ToolMapEntry>,
  agentMap: Map<string, AgentMapEntry>,
  timestamp: Date
): void {
  for (const tool of toolMap.values()) {
    if (tool.status === 'running') { tool.status = 'interrupted'; tool.endTime = timestamp; }
  }
  for (const agent of agentMap.values()) {
    if (agent.status === 'running') { agent.status = 'interrupted'; agent.endTime = timestamp; }
  }
}

function processEntry(
  entry: TranscriptEntry,
  toolMap: Map<string, ToolMapEntry>,
  agentMap: Map<string, AgentMapEntry>,
  latestTodos: TodoEntry[],
  result: TranscriptData
): void {
  const timestamp = entry.timestamp ? new Date(entry.timestamp) : new Date();

  if (!result.sessionStart && entry.timestamp) {
    result.sessionStart = timestamp;
  }

  // A new prompt closes the previous turn before its own blocks are read.
  if (entry.type === 'user' && endsTurn(entry)) closeOpenWork(toolMap, agentMap, timestamp);

  const content = entry.message?.content;
  if (!content || !Array.isArray(content)) return;

  for (const block of content) {
    const b = block as Record<string, unknown>;

    if (b.type === 'tool_use' && b.id && b.name) {
      const input = b.input as Record<string, unknown> | undefined;

      if (b.name === 'Task') {
        const agentEntry: AgentMapEntry = {
          id: b.id as string,
          type: (input?.subagent_type as string) ?? 'unknown',
          model: input?.model as string | undefined,
          description: input?.description as string | undefined,
          status: 'running',
          startTime: timestamp,
        };
        agentMap.set(b.id as string, agentEntry);
      } else if (b.name === 'TodoWrite') {
        if (input?.todos && Array.isArray(input.todos)) {
          latestTodos.length = 0;
          latestTodos.push(...(input.todos as TodoEntry[]));
        }
      } else {
        const toolEntry: ToolMapEntry = {
          id: b.id as string,
          name: b.name as string,
          target: extractTarget(b.name as string, input),
          status: 'running',
          startTime: timestamp,
        };
        toolMap.set(b.id as string, toolEntry);
      }
    }

    if (b.type === 'tool_result' && b.tool_use_id) {
      const tool = toolMap.get(b.tool_use_id as string);
      if (tool) {
        tool.status = b.is_error ? 'error' : 'completed';
        tool.endTime = timestamp;
      }
      const agent = agentMap.get(b.tool_use_id as string);
      if (agent) {
        agent.status = 'completed';
        agent.endTime = timestamp;
      }
    }
  }

  // The assistant's final message: anything still open was not answered.
  if (entry.type === 'assistant' && endsTurn(entry)) closeOpenWork(toolMap, agentMap, timestamp);
}

function extractTarget(toolName: string, input?: Record<string, unknown>): string | undefined {
  if (!input) return undefined;

  switch (toolName) {
    case 'Read':
    case 'Write':
    case 'Edit':
      return (input.file_path ?? input.path) as string | undefined;
    case 'Glob':
    case 'Grep':
      return input.pattern as string | undefined;
    case 'Bash': {
      const cmd = input.command as string | undefined;
      if (cmd) {
        return cmd.slice(0, 30) + (cmd.length > 30 ? '...' : '');
      }
      return undefined;
    }
  }
  return undefined;
}

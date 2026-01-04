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

function processEntry(
  entry: { timestamp?: string; message?: { content?: unknown[] } },
  toolMap: Map<string, ToolMapEntry>,
  agentMap: Map<string, AgentMapEntry>,
  latestTodos: TodoEntry[],
  result: TranscriptData
): void {
  const timestamp = entry.timestamp ? new Date(entry.timestamp) : new Date();

  if (!result.sessionStart && entry.timestamp) {
    result.sessionStart = timestamp;
  }

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

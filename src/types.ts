export interface StdinData {
  model?: {
    display_name?: string;
    id?: string;
  };
  context_window?: {
    context_window_size?: number;
    total_input_tokens?: number;
    total_output_tokens?: number;
    used_percentage?: number;
    remaining_percentage?: number;
    current_usage?: {
      input_tokens?: number;
      output_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
  };
  cost?: {
    total_cost_usd?: number;
    total_duration_ms?: number;
    total_api_duration_ms?: number;
    total_lines_added?: number;
    total_lines_removed?: number;
  };
  cwd?: string;
  transcript_path?: string;
  session_id?: string;
  version?: string;
  workspace?: {
    current_dir?: string;
    project_dir?: string;
  };
}

export interface ToolEntry {
  name: string;
  target?: string;
  status: 'running' | 'completed' | 'error';
}

export interface AgentEntry {
  type: string;
  description?: string;
  model?: string;
  status: 'running' | 'completed';
  startTime: Date;
  endTime?: Date;
}

export interface TodoEntry {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface TranscriptData {
  sessionStart?: Date;
  tools: ToolEntry[];
  agents: AgentEntry[];
  todos: TodoEntry[];
}

export interface ConfigCounts {
  claudeMdCount: number;
  mcpCount: number;
  hooksCount: number;
}

export interface GitInfo {
  repo: string;
  branch: string;
  added: number;
  deleted: number;
}

export interface SoulContext {
  // cc-soul v3.43+ flat format
  total_memories: number;
  wisdom_nodes: number;
  beliefs: number;
  episodes: number;
  corrections: number;
  preferences: number;
  avg_confidence: number;
  count_by_kind: {
    belief?: number;
    episode?: number;
    habit?: number;
    milestone?: number;
    symbol?: number;
    unknown?: number;
    wisdom?: number;
    [key: string]: number | undefined;
  };
  version?: string;
}

export interface RenderContext {
  stdin: StdinData;
  transcript: TranscriptData;
  configs: ConfigCounts;
  git?: GitInfo;
  soul?: SoulContext;
  sessionDuration: string;
  sessionDurationMs: number;
  // Context bar data (may be from cache when subagent active)
  contextStdin: StdinData;
  isSubagent: boolean;
  usingCachedContext: boolean;
}

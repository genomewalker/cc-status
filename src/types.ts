export interface StdinData {
  model?: {
    display_name?: string;
    id?: string;
  };
  context_window?: {
    context_window_size?: number;
    total_input_tokens?: number;
    total_output_tokens?: number;
    current_usage?: {
      input_tokens?: number;
      output_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
  };
  cwd?: string;
  transcript_path?: string;
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
  // cc-soul v3.x format
  version: string;
  total_nodes: number;
  active_nodes: number;
  stale_nodes: number;
  weak_nodes: number;
  avg_confidence: number;
  triplet_count: number;
  yantra_ready: boolean;
  status: 'healthy' | 'degraded' | 'repair_needed' | 'critical';
  transcripts_tracked: number;
}

export interface RenderContext {
  stdin: StdinData;
  transcript: TranscriptData;
  configs: ConfigCounts;
  git?: GitInfo;
  soul?: SoulContext;
  sessionDuration: string;
  // Context bar data (may be from cache when subagent active)
  contextStdin: StdinData;
  isSubagent: boolean;
  usingCachedContext: boolean;
}

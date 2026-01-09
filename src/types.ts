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
  version: string;
  hot: number;
  warm: number;
  cold: number;
  total: number;
  coherence: {
    global: number;
    local: number;
    structural: number;
    temporal: number;
    tau: number;
  };
  ojas?: {
    structural: number;
    semantic: number;
    temporal: number;
    capacity: number;
    psi: number;
    status: 'healthy' | 'degraded' | 'repair_needed' | 'critical';
  };
  yantra: boolean;
}

export interface RenderContext {
  stdin: StdinData;
  transcript: TranscriptData;
  configs: ConfigCounts;
  git?: GitInfo;
  soul?: SoulContext;
  sessionDuration: string;
}

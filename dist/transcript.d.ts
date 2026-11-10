import type { TranscriptData } from './types.js';
export declare function parseTranscript(transcriptPath: string): Promise<TranscriptData>;
type TranscriptEntry = {
    type?: string;
    timestamp?: string;
    isMeta?: boolean;
    isSidechain?: boolean;
    isCompactSummary?: boolean;
    message?: {
        content?: unknown;
        stop_reason?: string | null;
    };
};
/**
 * True when this entry closes the main thread's turn: a new user prompt (not a
 * tool result, not meta or sidechain), or an assistant message that ended the
 * turn. A tool or agent without a tool_result by then will never get one; it
 * was interrupted (Esc, crash, killed process, restored conversation).
 */
export declare function endsTurn(entry: TranscriptEntry): boolean;
export {};
//# sourceMappingURL=transcript.d.ts.map
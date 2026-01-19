import type { StdinData } from './types.js';
export declare function readStdin(): Promise<StdinData | null>;
export declare function getModelName(stdin: StdinData): string;
export declare function isSubagentContext(stdin: StdinData): boolean;
export declare function getContextStats(stdin: StdinData): {
    tokens: number;
    size: number;
    percent: number;
    remaining: number;
};
//# sourceMappingURL=stdin.d.ts.map
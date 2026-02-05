export interface CostInfo {
    totalCost: number;
    hourlyRate: number;
}
export declare function calculateCost(modelName: string, inputTokens: number, outputTokens: number, sessionDurationMs: number): CostInfo;
export declare function calculateTokensPerMinute(totalTokens: number, sessionDurationMs: number): number;
/**
 * Get session cost, preferring stdin's pre-calculated cost over local estimation.
 * Falls back to local calculation when stdin cost is not available.
 */
export declare function getSessionCost(stdinCostUsd: number | undefined, modelName: string, inputTokens: number, outputTokens: number, sessionDurationMs: number): CostInfo;
//# sourceMappingURL=cost.d.ts.map
export interface CostInfo {
    totalCost: number;
    hourlyRate: number;
}
export declare function calculateCost(modelName: string, inputTokens: number, outputTokens: number, sessionDurationMs: number): CostInfo;
export declare function calculateTokensPerMinute(totalTokens: number, sessionDurationMs: number): number;
//# sourceMappingURL=cost.d.ts.map
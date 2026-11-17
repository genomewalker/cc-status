import type { SoulContext } from './types.js';
export declare function pendingEmbedCount(hc: {
    pending_count?: number;
    pending_embed_admissible?: number;
}): number;
export declare function getSoulContextAsync(): Promise<SoulContext | undefined>;
export declare function getSoulContext(): SoulContext | undefined;
//# sourceMappingURL=soul.d.ts.map
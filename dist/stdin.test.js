import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getModelName, getContextStats } from './stdin.js';
describe('getModelName', () => {
    it('returns display_name when available', () => {
        const stdin = { model: { display_name: 'Opus 4.5', id: 'claude-opus' } };
        assert.equal(getModelName(stdin), 'Opus 4.5');
    });
    it('falls back to id when no display_name', () => {
        const stdin = { model: { id: 'claude-sonnet-4' } };
        assert.equal(getModelName(stdin), 'claude-sonnet-4');
    });
    it('returns ... when no model info', () => {
        const stdin = {};
        assert.equal(getModelName(stdin), '...');
    });
});
describe('getContextStats', () => {
    it('calculates tokens correctly without cache', () => {
        const stdin = {
            context_window: {
                context_window_size: 200000,
                current_usage: {
                    input_tokens: 10000,
                    output_tokens: 5000,
                },
            },
        };
        const stats = getContextStats(stdin);
        assert.equal(stats.tokens, 15000);
        assert.equal(stats.size, 200000);
        assert.equal(stats.percent, 8);
        assert.equal(stats.remaining, 92);
    });
    it('includes cache_read_input_tokens in total', () => {
        const stdin = {
            context_window: {
                context_window_size: 200000,
                current_usage: {
                    input_tokens: 10000,
                    output_tokens: 5000,
                    cache_read_input_tokens: 3000,
                },
            },
        };
        const stats = getContextStats(stdin);
        assert.equal(stats.tokens, 18000);
    });
    it('does NOT include cache_creation_input_tokens (already in input_tokens)', () => {
        const stdin = {
            context_window: {
                context_window_size: 200000,
                current_usage: {
                    input_tokens: 10000,
                    output_tokens: 5000,
                    cache_creation_input_tokens: 2000,
                },
            },
        };
        const stats = getContextStats(stdin);
        assert.equal(stats.tokens, 15000);
    });
    it('handles all token types correctly', () => {
        const stdin = {
            context_window: {
                context_window_size: 200000,
                current_usage: {
                    input_tokens: 45000,
                    output_tokens: 5000,
                    cache_creation_input_tokens: 1000,
                    cache_read_input_tokens: 2000,
                },
            },
        };
        const stats = getContextStats(stdin);
        assert.equal(stats.tokens, 52000);
        assert.equal(stats.percent, 26);
        assert.equal(stats.remaining, 74);
    });
    it('defaults to 200000 when no context_window_size', () => {
        const stdin = {
            context_window: {
                current_usage: { input_tokens: 20000 },
            },
        };
        const stats = getContextStats(stdin);
        assert.equal(stats.size, 200000);
        assert.equal(stats.percent, 10);
    });
    it('handles empty usage gracefully', () => {
        const stdin = {};
        const stats = getContextStats(stdin);
        assert.equal(stats.tokens, 0);
        assert.equal(stats.percent, 0);
        assert.equal(stats.remaining, 100);
    });
    it('caps percent at 100', () => {
        const stdin = {
            context_window: {
                context_window_size: 100,
                current_usage: { input_tokens: 150 },
            },
        };
        const stats = getContextStats(stdin);
        assert.equal(stats.percent, 100);
        assert.equal(stats.remaining, 0);
    });
});
//# sourceMappingURL=stdin.test.js.map
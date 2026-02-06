import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getModelName, getContextStats } from './stdin.js';
import { getSessionCost, calculateCost } from './cost.js';
import { formatDurationMs } from './index.js';
import type { StdinData } from './types.js';

describe('getModelName', () => {
  it('returns display_name when available', () => {
    const stdin: StdinData = { model: { display_name: 'Opus 4.5', id: 'claude-opus' } };
    assert.equal(getModelName(stdin), 'Opus 4.5');
  });

  it('falls back to id when no display_name', () => {
    const stdin: StdinData = { model: { id: 'claude-sonnet-4' } };
    assert.equal(getModelName(stdin), 'claude-sonnet-4');
  });

  it('returns ... when no model info', () => {
    const stdin: StdinData = {};
    assert.equal(getModelName(stdin), '...');
  });
});

describe('getContextStats', () => {
  it('calculates tokens correctly without cache', () => {
    const stdin: StdinData = {
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

  it('does not double-count cache_read_input_tokens (already in input_tokens)', () => {
    const stdin: StdinData = {
      context_window: {
        context_window_size: 200000,
        current_usage: {
          input_tokens: 10000, // already includes 3000 cache_read
          output_tokens: 5000,
          cache_read_input_tokens: 3000,
        },
      },
    };
    const stats = getContextStats(stdin);
    assert.equal(stats.tokens, 15000); // 10000 + 5000, NOT 18000
  });

  it('does not double-count cache_creation_input_tokens (already in input_tokens)', () => {
    const stdin: StdinData = {
      context_window: {
        context_window_size: 200000,
        current_usage: {
          input_tokens: 10000, // already includes 2000 cache_creation
          output_tokens: 5000,
          cache_creation_input_tokens: 2000,
        },
      },
    };
    const stats = getContextStats(stdin);
    assert.equal(stats.tokens, 15000);
  });

  it('handles all token types correctly without double-counting', () => {
    const stdin: StdinData = {
      context_window: {
        context_window_size: 200000,
        current_usage: {
          input_tokens: 45000, // already includes cache_read and cache_creation
          output_tokens: 5000,
          cache_creation_input_tokens: 1000,
          cache_read_input_tokens: 2000,
        },
      },
    };
    const stats = getContextStats(stdin);
    assert.equal(stats.tokens, 50000); // 45000 + 5000
    assert.equal(stats.percent, 25);
    assert.equal(stats.remaining, 75);
  });

  it('defaults to 200000 when no context_window_size', () => {
    const stdin: StdinData = {
      context_window: {
        current_usage: { input_tokens: 20000 },
      },
    };
    const stats = getContextStats(stdin);
    assert.equal(stats.size, 200000);
    assert.equal(stats.percent, 10);
  });

  it('handles empty usage gracefully', () => {
    const stdin: StdinData = {};
    const stats = getContextStats(stdin);
    assert.equal(stats.tokens, 0);
    assert.equal(stats.percent, 0);
    assert.equal(stats.remaining, 100);
  });

  it('caps percent at 100', () => {
    const stdin: StdinData = {
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

describe('getSessionCost', () => {
  it('prefers stdin cost when available', () => {
    const cost = getSessionCost(0.50, 'Opus 4.5', 100000, 50000, 3600000);
    assert.equal(cost.totalCost, 0.50);
    // hourly rate: $0.50 / 1h = $0.50/h
    assert.equal(cost.hourlyRate, 0.50);
  });

  it('falls back to local calculation when stdin cost is undefined', () => {
    const cost = getSessionCost(undefined, 'Opus 4.5', 1_000_000, 0, 3600000);
    // 1M input tokens * $15/1M = $15
    assert.equal(cost.totalCost, 15);
  });

  it('falls back to local calculation when stdin cost is 0', () => {
    const cost = getSessionCost(0, 'Opus 4.5', 1_000_000, 0, 3600000);
    assert.equal(cost.totalCost, 15);
  });

  it('calculates hourly rate from stdin cost', () => {
    // $1.00 over 30 minutes = $2.00/h
    const cost = getSessionCost(1.0, 'Opus', 0, 0, 30 * 60 * 1000);
    assert.equal(cost.totalCost, 1.0);
    assert.equal(cost.hourlyRate, 2.0);
  });
});

describe('formatDurationMs', () => {
  it('returns empty string for 0ms', () => {
    assert.equal(formatDurationMs(0), '');
  });

  it('returns <1m for under a minute', () => {
    assert.equal(formatDurationMs(30000), '<1m');
  });

  it('returns minutes for under an hour', () => {
    assert.equal(formatDurationMs(5 * 60000), '5m');
    assert.equal(formatDurationMs(45 * 60000), '45m');
  });

  it('returns hours and minutes for over an hour', () => {
    assert.equal(formatDurationMs(90 * 60000), '1h30m');
    assert.equal(formatDurationMs(125 * 60000), '2h5m');
  });
});

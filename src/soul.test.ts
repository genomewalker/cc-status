import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { pendingEmbedCount } from './soul.js';

describe('pendingEmbedCount', () => {
  it('uses the admissible backlog when the daemon reports it', () => {
    assert.equal(pendingEmbedCount({ pending_count: 16369, pending_embed_admissible: 1 }), 1);
    assert.equal(pendingEmbedCount({ pending_count: 16369, pending_embed_admissible: 0 }), 0);
  });

  it('falls back to pending_count for older daemons', () => {
    assert.equal(pendingEmbedCount({ pending_count: 42 }), 42);
    assert.equal(pendingEmbedCount({}), 0);
  });
});

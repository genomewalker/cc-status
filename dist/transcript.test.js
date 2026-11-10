import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseTranscript, endsTurn } from './transcript.js';
import { renderToolsLine } from './render/tools-line.js';
function transcript(entries) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-status-transcript-'));
    const file = path.join(dir, 'session.jsonl');
    fs.writeFileSync(file, entries.map(e => JSON.stringify(e)).join('\n') + '\n');
    return file;
}
const ts = (s) => `2026-11-10T10:00:${String(s).padStart(2, '0')}Z`;
const prompt = (s, text) => ({ type: 'user', timestamp: ts(s), message: { role: 'user', content: text } });
const toolUse = (s, id, name, input = {}) => ({
    type: 'assistant', timestamp: ts(s),
    message: { role: 'assistant', stop_reason: 'tool_use', content: [{ type: 'tool_use', id, name, input }] },
});
const toolResult = (s, id) => ({
    type: 'user', timestamp: ts(s), message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: id, content: 'ok' }] },
});
const finalText = (s) => ({
    type: 'assistant', timestamp: ts(s),
    message: { role: 'assistant', stop_reason: 'end_turn', content: [{ type: 'text', text: 'Done.' }] },
});
function toolsLine(tools) {
    const line = renderToolsLine({ transcript: { tools, agents: [], todos: [] } });
    // Strip ANSI colours for assertions.
    return line === null ? null : line.replace(/\x1b\[[0-9;]*m/g, '');
}
describe('parseTranscript tool status', () => {
    it('keeps a tool running while its turn is still open', async () => {
        const t = await parseTranscript(transcript([prompt(0, 'edit it'), toolUse(1, 't1', 'Edit', { file_path: '/a/b/handoff.md' })]));
        assert.equal(t.tools[0].status, 'running');
        assert.equal(toolsLine(t.tools), '~ Edit: /a/b/handoff.md');
    });
    it('marks a tool without a result interrupted when the next prompt starts (restored pane d0d7ae13)', async () => {
        const t = await parseTranscript(transcript([
            prompt(0, 'edit it'), toolUse(1, 't1', 'Edit', { file_path: '/a/b/current-handoff.md' }),
            prompt(5, 'RECOVERY ONLY: reply READY'), finalText(6),
        ]));
        assert.equal(t.tools[0].status, 'interrupted');
        assert.equal(toolsLine(t.tools), '+ Edit ×1');
    });
    it('marks open tools interrupted when the assistant ends the turn', async () => {
        const t = await parseTranscript(transcript([
            prompt(0, 'run both'), toolUse(1, 'b1', 'Bash', { command: 'sleep 1' }), toolUse(1, 'b2', 'Bash', { command: 'sleep 2' }),
            toolResult(2, 'b1'), finalText(3),
        ]));
        assert.deepEqual(t.tools.map(x => x.status), ['completed', 'interrupted']);
        assert.equal(toolsLine(t.tools), '+ Bash ×2');
    });
    it('does not close a turn on tool results, meta or sidechain prompts', async () => {
        const t = await parseTranscript(transcript([
            prompt(0, 'go'), toolUse(1, 'r1', 'Read', { file_path: '/x' }), toolUse(1, 'g1', 'Grep', { pattern: 'p' }),
            toolResult(2, 'r1'),
            { type: 'user', timestamp: ts(3), isMeta: true, message: { role: 'user', content: 'caveat' } },
            { type: 'user', timestamp: ts(3), isSidechain: true, message: { role: 'user', content: 'subagent prompt' } },
        ]));
        assert.deepEqual(t.tools.map(x => x.status), ['completed', 'running']);
    });
    it('marks an unanswered Task agent interrupted, never left running', async () => {
        const t = await parseTranscript(transcript([
            prompt(0, 'delegate'), toolUse(1, 'a1', 'Task', { subagent_type: 'Explore', description: 'look' }), prompt(9, 'next'),
        ]));
        assert.equal(t.agents[0].status, 'interrupted');
    });
    it('a tool_result after its turn ended still completes it', async () => {
        const t = await parseTranscript(transcript([
            prompt(0, 'go'), toolUse(1, 'x1', 'Bash', { command: 'ls' }), finalText(2), toolResult(3, 'x1'),
        ]));
        assert.equal(t.tools[0].status, 'completed');
    });
});
describe('endsTurn', () => {
    it('recognises real prompts and end_turn only', () => {
        assert.equal(endsTurn({ type: 'user', message: { content: 'hello' } }), true);
        assert.equal(endsTurn({ type: 'user', message: { content: [{ type: 'text', text: 'hi' }] } }), true);
        assert.equal(endsTurn({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'x' }] } }), false);
        assert.equal(endsTurn({ type: 'user', isMeta: true, message: { content: 'x' } }), false);
        assert.equal(endsTurn({ type: 'user', isSidechain: true, message: { content: 'x' } }), false);
        assert.equal(endsTurn({ type: 'user', isCompactSummary: true, message: { content: 'summary' } }), false);
        assert.equal(endsTurn({ type: 'assistant', message: { stop_reason: 'tool_use', content: [] } }), false);
        assert.equal(endsTurn({ type: 'assistant', message: { stop_reason: 'end_turn', content: [] } }), true);
    });
});
//# sourceMappingURL=transcript.test.js.map
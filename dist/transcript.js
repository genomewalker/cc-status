import * as fs from 'fs';
import * as readline from 'readline';
export async function parseTranscript(transcriptPath) {
    const result = {
        tools: [],
        agents: [],
        todos: [],
    };
    if (!transcriptPath || !fs.existsSync(transcriptPath)) {
        return result;
    }
    const toolMap = new Map();
    const agentMap = new Map();
    let latestTodos = [];
    try {
        const fileStream = fs.createReadStream(transcriptPath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });
        for await (const line of rl) {
            if (!line.trim())
                continue;
            try {
                const entry = JSON.parse(line);
                processEntry(entry, toolMap, agentMap, latestTodos, result);
            }
            catch {
                // Skip malformed lines
            }
        }
    }
    catch {
        // Return partial results on error
    }
    result.tools = Array.from(toolMap.values()).slice(-20);
    result.agents = Array.from(agentMap.values()).slice(-10);
    result.todos = latestTodos;
    return result;
}
function processEntry(entry, toolMap, agentMap, latestTodos, result) {
    const timestamp = entry.timestamp ? new Date(entry.timestamp) : new Date();
    if (!result.sessionStart && entry.timestamp) {
        result.sessionStart = timestamp;
    }
    const content = entry.message?.content;
    if (!content || !Array.isArray(content))
        return;
    for (const block of content) {
        const b = block;
        if (b.type === 'tool_use' && b.id && b.name) {
            const input = b.input;
            if (b.name === 'Task') {
                const agentEntry = {
                    id: b.id,
                    type: input?.subagent_type ?? 'unknown',
                    model: input?.model,
                    description: input?.description,
                    status: 'running',
                    startTime: timestamp,
                };
                agentMap.set(b.id, agentEntry);
            }
            else if (b.name === 'TodoWrite') {
                if (input?.todos && Array.isArray(input.todos)) {
                    latestTodos.length = 0;
                    latestTodos.push(...input.todos);
                }
            }
            else {
                const toolEntry = {
                    id: b.id,
                    name: b.name,
                    target: extractTarget(b.name, input),
                    status: 'running',
                    startTime: timestamp,
                };
                toolMap.set(b.id, toolEntry);
            }
        }
        if (b.type === 'tool_result' && b.tool_use_id) {
            const tool = toolMap.get(b.tool_use_id);
            if (tool) {
                tool.status = b.is_error ? 'error' : 'completed';
                tool.endTime = timestamp;
            }
            const agent = agentMap.get(b.tool_use_id);
            if (agent) {
                agent.status = 'completed';
                agent.endTime = timestamp;
            }
        }
    }
}
function extractTarget(toolName, input) {
    if (!input)
        return undefined;
    switch (toolName) {
        case 'Read':
        case 'Write':
        case 'Edit':
            return (input.file_path ?? input.path);
        case 'Glob':
        case 'Grep':
            return input.pattern;
        case 'Bash': {
            const cmd = input.command;
            if (cmd) {
                return cmd.slice(0, 30) + (cmd.length > 30 ? '...' : '');
            }
            return undefined;
        }
    }
    return undefined;
}
//# sourceMappingURL=transcript.js.map
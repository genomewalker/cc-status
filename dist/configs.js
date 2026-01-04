import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
function readJson(filePath) {
    if (!fs.existsSync(filePath))
        return null;
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    catch {
        return null;
    }
}
function countKeys(obj) {
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        return Object.keys(obj).length;
    }
    return 0;
}
export function countConfigs(cwd) {
    let claudeMdCount = 0;
    let mcpCount = 0;
    let hooksCount = 0;
    const homeDir = os.homedir();
    const claudeDir = path.join(homeDir, '.claude');
    // User scope
    if (fs.existsSync(path.join(claudeDir, 'CLAUDE.md'))) {
        claudeMdCount++;
    }
    const userSettings = readJson(path.join(claudeDir, 'settings.json'));
    if (userSettings) {
        mcpCount += countKeys(userSettings.mcpServers);
        hooksCount += countKeys(userSettings.hooks);
    }
    const userClaudeJson = readJson(path.join(homeDir, '.claude.json'));
    if (userClaudeJson) {
        mcpCount += countKeys(userClaudeJson.mcpServers);
    }
    // Project scope
    if (cwd) {
        if (fs.existsSync(path.join(cwd, 'CLAUDE.md')))
            claudeMdCount++;
        if (fs.existsSync(path.join(cwd, 'CLAUDE.local.md')))
            claudeMdCount++;
        if (fs.existsSync(path.join(cwd, '.claude', 'CLAUDE.md')))
            claudeMdCount++;
        const mcpJson = readJson(path.join(cwd, '.mcp.json'));
        if (mcpJson) {
            mcpCount += countKeys(mcpJson.mcpServers);
        }
        const projectSettings = readJson(path.join(cwd, '.claude', 'settings.json'));
        if (projectSettings) {
            mcpCount += countKeys(projectSettings.mcpServers);
            hooksCount += countKeys(projectSettings.hooks);
        }
    }
    return { claudeMdCount, mcpCount, hooksCount };
}
//# sourceMappingURL=configs.js.map
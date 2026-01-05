import { execSync } from 'child_process';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
// cc-soul plugin CLI locations (in order of preference)
const CLI_PATHS = [
    path.join(os.homedir(), '.claude/plugins/marketplaces/genomewalker-cc-soul/bin/chitta_cli'),
    path.join(os.homedir(), '.claude/mind/chitta-cli.sh'), // Legacy
];
function getChittaCli() {
    for (const p of CLI_PATHS) {
        if (fs.existsSync(p))
            return p;
    }
    return null;
}
export function getSoulContext() {
    const cli = getChittaCli();
    if (!cli)
        return undefined;
    try {
        const output = execSync(`"${cli}" stats --json 2>/dev/null`, {
            encoding: 'utf8',
            timeout: 2000,
        });
        return JSON.parse(output.trim());
    }
    catch {
        // Soul not available or old CLI without --json
    }
    return undefined;
}
//# sourceMappingURL=soul.js.map
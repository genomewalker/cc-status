import { execSync } from 'child_process';
export function getGitInfo() {
    try {
        execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    }
    catch {
        return undefined;
    }
    try {
        const toplevel = execSync('git rev-parse --show-toplevel', { encoding: 'utf8', stdio: 'pipe' }).trim();
        const repo = toplevel.split('/').pop() ?? '';
        const branchOutput = execSync('git branch 2>/dev/null', { encoding: 'utf8', stdio: 'pipe' });
        const branchMatch = branchOutput.match(/^\* (.+)$/m);
        const branch = branchMatch?.[1] ?? 'unknown';
        let added = 0;
        let deleted = 0;
        try {
            const diffOutput = execSync('git diff --numstat 2>/dev/null', { encoding: 'utf8', stdio: 'pipe' });
            for (const line of diffOutput.split('\n')) {
                const parts = line.split('\t');
                if (parts.length >= 2) {
                    const a = parseInt(parts[0], 10);
                    const d = parseInt(parts[1], 10);
                    if (!isNaN(a))
                        added += a;
                    if (!isNaN(d))
                        deleted += d;
                }
            }
        }
        catch {
            // Ignore diff errors
        }
        return { repo, branch, added, deleted };
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=git.js.map
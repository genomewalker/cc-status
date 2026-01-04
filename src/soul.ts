import { execSync } from 'child_process';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import type { SoulContext } from './types.js';

const CHITTA_CLI = path.join(os.homedir(), '.claude/mind/chitta-cli.sh');
const CHITTA_CLI_ALT = '/maps/projects/fernandezguerra/apps/repos/cc-soul/chitta-cli.sh';

function getChittaCli(): string | null {
  if (fs.existsSync(CHITTA_CLI)) return CHITTA_CLI;
  if (fs.existsSync(CHITTA_CLI_ALT)) return CHITTA_CLI_ALT;
  return null;
}

export function getSoulContext(): SoulContext | undefined {
  const cli = getChittaCli();
  if (!cli) return undefined;

  try {
    const output = execSync(`${cli} stats 2>&1`, { encoding: 'utf8', timeout: 2000 });
    const parsed = JSON.parse(output);
    const text = parsed?.result?.content?.[0]?.text;
    if (text) {
      return JSON.parse(text);
    }
  } catch {
    // Soul not available
  }
  return undefined;
}

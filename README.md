# cc-status

Custom statusline for Claude Code with soul integration.

## Features

- **Context tracking**: Context bar with remaining % (includes output tokens)
- **Git info**: repo:branch with diff stats (+added/-deleted)
- **Session duration**: Time since session start
- **Config counts**: CLAUDE.md, MCPs, hooks
- **Soul status**: Coherence metrics, tau-k correlation, node counts
- **Live activity**: Running tools, agents, and todos from transcript

## Installation

### Via Claude Code Marketplace

```bash
/plugin add genomewalker/cc-status
```

### Manual

```bash
git clone https://github.com/genomewalker/cc-status.git
cd cc-status
npm install
npm run build
```

## Configuration

After installing, add to `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node ~/.claude/plugins/cache/cc-status/cc-status/*/dist/index.js"
  }
}
```

Or with version pinning:

```json
{
  "statusLine": {
    "type": "command",
    "command": "bash -c 'node \"$(ls -td ~/.claude/plugins/cache/cc-status/cc-status/*/ | head -1)dist/index.js\"'"
  }
}
```

## Example Output

```
cc-soul:main | [Opus 4.5] | 12m | +5/-2 | ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 85% | 2 CLAUDE.md 3 MCPs
◈ coh:100% τ:84% nodes:1399h
◐ Read: src/index.ts | ✓ Bash ×3 | ✓ Glob ×2
▸ Implement feature X (3/7)
```

### Line Breakdown

1. **Session line**: repo:branch, model, duration, git diff, context bar, config counts
2. **Soul line**: coherence %, tau-k correlation, node distribution (hot/warm/cold)
3. **Tools line**: Running and completed tool counts
4. **Agents line**: Running agents with description and elapsed time
5. **Todos line**: Current in-progress todo with completion count

## Soul Integration

Requires [cc-soul](https://github.com/genomewalker/cc-soul) to be installed for soul metrics.

## License

MIT

# cc-status

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6.svg)](https://www.typescriptlang.org/)
[![Claude Code](https://img.shields.io/badge/Claude_Code-plugin-E8410C.svg)](https://docs.anthropic.com/en/docs/claude-code)

**A terminal HUD for Claude Code.** Context window, cost, burn rate, tools, agents, and focus — one glance, no switching.

[Documentation & Demo](https://genomewalker.github.io/cc-status/) · [Source Code](https://github.com/genomewalker/cc-status)

## Features

- **Context tracking**: Context bar with remaining % (includes output tokens)
- **Cost & burn rate**: Live cost, $/hour rate, tokens/min, API wait ratio
- **Cache efficiency**: Cache read % to monitor prompt caching
- **Git info**: repo:branch with diff stats (+added/-deleted)
- **Session duration**: Time since session start
- **Config counts**: CLAUDE.md files, MCPs, hooks
- **Soul status**: Coherence metrics, tau-k correlation, node counts (requires [cc-soul](https://github.com/genomewalker/cc-soul))
- **Live activity**: Running tools, agents, and todos from transcript

## Example Output

```
cc-soul:main | [Opus 4.5] | 12m | +5/-2 | ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 85% | 2 CLAUDE.md 3 MCPs
$0.42 $5.04/h | 27K/m | wait 28% | cache 4% | 3 MCPs
◈ coh:100% τ:84% nodes:1399h
◐ Read: src/index.ts | ✓ Bash ×3 | ✓ Glob ×2
▸ Implement feature X (3/7)
```

### Line Breakdown

1. **Session**: repo:branch, model, duration, git diff, context bar, config counts
2. **Cost**: cumulative cost, burn rate, tokens/min, wait %, cache %, MCP count
3. **Soul**: coherence %, tau-k correlation, node distribution (hot/warm/cold)
4. **Tools**: running and completed tool counts
5. **Agents**: running agents with description and elapsed time
6. **Todos**: current in-progress todo with completion count

## Installation

Install from the Claude Code plugin marketplace:

1. Open Claude Code and run `/plugin` to browse the marketplace
2. Search for **cc-status** and install it — or install directly:
   ```
   /plugin add genomewalker/cc-status
   ```
3. Run the setup command:
   ```
   /cc-status-setup
   ```
4. Restart Claude Code

The setup backs up your current `statusLine` config to `~/.claude/statusline.backup.json` before applying.

To update to the latest version, run `/plugin update` in Claude Code.

## Uninstall

```bash
/cc-status-uninstall
```

This restores only the `statusLine` section from your backup (other settings are untouched).

## Soul Integration

Requires [cc-soul](https://github.com/genomewalker/cc-soul) to be installed for soul metrics. Without it, the soul line stays quiet and everything else still works.

## License

MIT

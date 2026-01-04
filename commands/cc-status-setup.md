---
description: Configure cc-status as your statusLine (backs up current config)
---

# /cc-status-setup

Run this command to configure cc-status as your Claude Code statusLine.

## What it does

1. Backs up your current statusLine config to `~/.claude/statusline.backup.json`
2. Updates `~/.claude/settings.json` to use cc-status
3. Restart Claude Code to see the new statusLine

## Usage

```bash
/cc-status-setup
```

## Implementation

```bash
SCRIPT_DIR="$(ls -td ~/.claude/plugins/cache/genomewalker-cc-status/cc-status/*/ 2>/dev/null | head -1).scripts"
bash "$SCRIPT_DIR/setup.sh"
```

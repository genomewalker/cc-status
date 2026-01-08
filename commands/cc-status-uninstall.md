---
description: Remove cc-status and restore previous statusLine config
---

# /cc-status-uninstall

Run this command to remove cc-status and restore your previous statusLine configuration.

## What it does

1. Checks if cc-status is currently configured
2. Restores your previous statusLine from `~/.claude/statusline.backup.json`
3. If no backup exists, removes the statusLine config entirely

## Usage

```bash
/cc-status-uninstall
```

## Implementation

```bash
SCRIPT_DIR="$HOME/.claude/plugins/cache/genomewalker-cc-status/cc-status/$(ls ~/.claude/plugins/cache/genomewalker-cc-status/cc-status/ 2>/dev/null | sort -V -r | head -1)/.scripts"
bash "$SCRIPT_DIR/uninstall.sh"
```

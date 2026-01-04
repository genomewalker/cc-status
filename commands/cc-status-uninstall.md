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
#!/bin/bash
set -e

SETTINGS_FILE="$HOME/.claude/settings.json"
BACKUP_FILE="$HOME/.claude/statusline.backup.json"

if [[ ! -f "$SETTINGS_FILE" ]]; then
    echo "Error: $SETTINGS_FILE not found"
    exit 1
fi

# Check if cc-status is configured
CURRENT=$(jq -r '.statusLine.command // ""' "$SETTINGS_FILE" 2>/dev/null)
if [[ "$CURRENT" != *"cc-status"* ]]; then
    echo "cc-status is not currently configured as your statusLine"
    exit 0
fi

# Restore backup if exists
if [[ -f "$BACKUP_FILE" ]]; then
    BACKUP_STATUSLINE=$(cat "$BACKUP_FILE")
    jq --argjson backup "$BACKUP_STATUSLINE" '.statusLine = $backup' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp" && mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"
    rm "$BACKUP_FILE"
    echo "Restored previous statusLine configuration"
else
    # Remove statusLine entirely
    jq 'del(.statusLine)' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp" && mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"
    echo "Removed statusLine configuration (no backup found)"
fi

echo "cc-status uninstalled. Restart Claude Code to apply changes"
```

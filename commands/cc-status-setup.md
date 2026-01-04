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
#!/bin/bash
set -e

SETTINGS_FILE="$HOME/.claude/settings.json"
BACKUP_FILE="$HOME/.claude/statusline.backup.json"

if [[ ! -f "$SETTINGS_FILE" ]]; then
    echo "Error: $SETTINGS_FILE not found"
    exit 1
fi

# Check if already configured
CURRENT=$(jq -r '.statusLine.command // ""' "$SETTINGS_FILE" 2>/dev/null)
if [[ "$CURRENT" == *"cc-status"* ]]; then
    echo "cc-status is already configured as your statusLine"
    exit 0
fi

# Backup current statusLine config
CURRENT_STATUSLINE=$(jq '.statusLine // null' "$SETTINGS_FILE")
if [[ "$CURRENT_STATUSLINE" != "null" ]]; then
    echo "$CURRENT_STATUSLINE" > "$BACKUP_FILE"
    echo "Backed up current statusLine to: $BACKUP_FILE"
fi

# Update settings.json with cc-status
jq '.statusLine = {
    "type": "command",
    "command": "bash -c '\''node \"$(ls -td ~/.claude/plugins/cache/cc-status/cc-status/*/ 2>/dev/null | head -1)dist/index.js\"'\''"
}' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp" && mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"

echo "cc-status configured successfully!"
echo "Restart Claude Code to see the new statusLine"
```

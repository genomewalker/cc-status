#!/bin/bash
set -e

SETTINGS_FILE="$HOME/.claude/settings.json"
BACKUP_FILE="$HOME/.claude/statusline.backup.json"
PLUGIN_DIR="genomewalker-cc-status/cc-status"

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

# Build the statusLine command (use sort -V for proper version ordering)
STATUSLINE_CMD="node ~/.claude/plugins/cache/${PLUGIN_DIR}/\"\$(ls ~/.claude/plugins/cache/${PLUGIN_DIR}/ 2>/dev/null | sort -V -r | head -1)\"/dist/index.js"

# Update settings.json with cc-status
jq --arg cmd "$STATUSLINE_CMD" '.statusLine = {
    "type": "command",
    "command": ("bash -c \u0027" + $cmd + "\u0027")
}' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp" && mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"

echo "cc-status configured successfully!"
echo "Restart Claude Code to see the new statusLine"

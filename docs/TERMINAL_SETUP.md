# Terminal Setup Guide

This document explains how to configure the Guacamole SSH terminal for proper scrolling and mouse support.

## Overview

The web terminal uses:
- **guacamole-lite** - WebSocket proxy to guacd
- **guacd** - Guacamole server daemon with terminal emulator
- **tmux** - Terminal multiplexer running in SSH session

## SSH Connection Settings

In `src/lib/guacTokens.ts`, each SSH connection needs these settings:

```typescript
{
  connection: {
    type: 'ssh',
    settings: {
      hostname: '127.0.0.1',
      port: 22,
      username: 'user',
      password: 'password',
      command: 'tmux attach -t session || tmux new -s session',
      scrollback: 5000,              // Enable 5000 line scrollback buffer
      'terminal-type': 'xterm-256color'  // Enable xterm mouse protocol
    }
  }
}
```

### Key Settings

| Setting | Purpose |
|---------|---------|
| `scrollback` | Number of lines in guacd's scrollback buffer |
| `terminal-type` | Set to `xterm-256color` for mouse protocol support |
| `command` | Auto-attach to tmux session |

## tmux Configuration

Each user on the VPS needs this in `~/.tmux.conf`:

```bash
# Enable mouse support
set -g mouse on

# Increase scrollback history
set -g history-limit 50000
```

### Setup Command (run on VPS)

```bash
echo "set -g mouse on
set -g history-limit 50000" > ~/.tmux.conf
```

To reload without restarting tmux:
```bash
tmux source ~/.tmux.conf
```

## How Scrolling Works

guacd's terminal emulator does NOT pass mouse events to applications (like tmux).

### Solution: Auto Copy-Mode

When you scroll with mouse wheel, the code in `GuacamoleDisplay.tsx`:

1. Sends mouse scroll events (for VNC panel)
2. Sends `Ctrl+B [` to enter tmux copy mode
3. Sends arrow keys (Up/Down) proportional to scroll amount
4. Resets after 3 seconds of no scrolling

```typescript
// Calculate lines based on scroll delta (1-5 lines)
const lines = Math.min(5, Math.max(1, Math.ceil(Math.abs(e.deltaY) / 30)));
const keyCode = e.deltaY < 0 ? 65362 : 65364; // Up : Down arrow

for (let i = 0; i < lines; i++) {
  client.sendKeyEvent(1, keyCode);
  client.sendKeyEvent(0, keyCode);
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+B [` | Enter tmux copy mode (manual) |
| `q` | Exit copy mode |
| `Ctrl+C` | Copy selected text |
| `Ctrl+V` | Paste clipboard |
| Middle-click | Paste clipboard |

## Clipboard

### Remote → Local (VNC clipboard to browser)
- Handled automatically via `client.onclipboard`
- Copies VNC clipboard to browser clipboard

### Local → Remote (Paste)
- `Ctrl+V` or middle-click triggers `typeText()` function
- Types clipboard text character by character via key events

## Troubleshooting

### Scroll not working
1. Check tmux has `set -g mouse on` in config
2. Verify `terminal-type: 'xterm-256color'` in token settings
3. Check browser console for "Entered tmux copy mode" message

### Copy/paste not working
1. Browser needs clipboard permissions
2. Container must be focused (click on terminal first)

### Terminal not connecting
1. Check guacamole-lite server is running
2. Verify token encryption key matches server
3. Check WebSocket URL is correct

## Architecture

```
Browser                    VPS (38.242.207.4)
┌─────────────────┐       ┌─────────────────────────┐
│ GuacamoleDisplay│       │ guacamole-lite (ws)     │
│                 │◄─────►│     ↓                   │
│ - Mouse events  │       │ guacd (terminal emu)   │
│ - Key events    │       │     ↓                   │
│ - Scroll → tmux │       │ SSH → tmux session     │
└─────────────────┘       └─────────────────────────┘
```

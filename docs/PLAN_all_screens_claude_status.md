# All Screens View + Claude Code Status Indicators

## Goal

1. **All Screens View**: A grid page showing all 6 desktops simultaneously
2. **Claude Code Hooks**: Detect when Claude Code is running/finished on each desktop
3. **Status Indicators**: Visual indicators (running/idle/finished) on each desktop

---

## Part 1: All Screens View

### Architecture

No routing needed - use state-based view switching:
```
App.tsx
├── viewMode: 'carousel' | 'all-screens'
├── Carousel View (existing)
└── AllScreensView (new)
    └── Grid of 6 DesktopTile components
```

### New Components

**1. AllScreensView.tsx**
```typescript
interface Props {
  desktops: Desktop[]
  onSelectDesktop: (index: number) => void
  claudeStatus: Record<string, 'running' | 'idle' | 'finished'>
}
```
- CSS Grid: 3 columns x 2 rows
- Each tile clickable to switch to carousel view
- Shows Claude status indicator on each tile

**2. DesktopTile.tsx**
- Mini version of SplitDesktop
- Status badge overlay (top-right corner)
- Desktop name label
- Click to select

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/AllScreensView.tsx` | Grid container |
| `src/components/AllScreensView.css` | Grid layout styles |
| `src/components/DesktopTile.tsx` | Individual tile with status |
| `src/components/DesktopTile.css` | Tile styles + status badge |

### Files to Modify
| File | Changes |
|------|---------|
| `src/App.tsx` | Add viewMode state, toggle button, conditional rendering |
| `src/App.css` | Add header button styles |

---

## Part 2: Claude Code Hooks

### Hook Events to Use

| Hook | When | Purpose |
|------|------|---------|
| `SessionStart` | Claude Code starts | Set status to "running" |
| `Stop` | Claude finishes responding | Set status to "finished" |
| `UserPromptSubmit` | User sends message | Set status to "running" |

### Hook Configuration

Each user (claude1-6) needs `.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [{
      "hooks": [{
        "type": "command",
        "command": "curl -X POST http://localhost:3001/api/status -H 'Content-Type: application/json' -d '{\"user\": \"claude1\", \"status\": \"running\"}'"
      }]
    }],
    "UserPromptSubmit": [{
      "hooks": [{
        "type": "command",
        "command": "curl -X POST http://localhost:3001/api/status -d '{\"user\": \"claude1\", \"status\": \"running\"}'"
      }]
    }],
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "curl -X POST http://localhost:3001/api/status -d '{\"user\": \"claude1\", \"status\": \"finished\"}'"
      }]
    }]
  }
}
```

### Status API: Convex (Selected)

Use existing Convex backend for real-time status updates:
- **HTTP Endpoint**: `https://joyous-armadillo-272.convex.site/api/claude-status`
- **Real-time**: Dashboard uses Convex subscriptions for instant updates
- **Already set up**: Just add new mutation/query

#### Hook Configuration (each user)

```json
{
  "hooks": {
    "SessionStart": [{
      "hooks": [{
        "type": "command",
        "command": "curl -sX POST https://joyous-armadillo-272.convex.site/api/claude-status -H 'Content-Type: application/json' -d '{\"user\":\"claude1\",\"status\":\"running\"}'"
      }]
    }],
    "UserPromptSubmit": [{
      "hooks": [{
        "type": "command",
        "command": "curl -sX POST https://joyous-armadillo-272.convex.site/api/claude-status -H 'Content-Type: application/json' -d '{\"user\":\"claude1\",\"status\":\"running\"}'"
      }]
    }],
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "curl -sX POST https://joyous-armadillo-272.convex.site/api/claude-status -H 'Content-Type: application/json' -d '{\"user\":\"claude1\",\"status\":\"finished\"}'"
      }]
    }]
  }
}
```

### Files to Create

| Location | File | Purpose |
|----------|------|---------|
| VPS | `/home/claude1/.claude/settings.json` | Hooks for claude1 |
| VPS | `/home/claude2/.claude/settings.json` | Hooks for claude2 |
| VPS | ... (claude3-6) | Hooks for each user |
| Planner | `packages/convex/claudeStatus.ts` | Convex mutations/queries |
| Planner | Update `http.ts` | Add /api/claude-status route |

---

## Part 3: Status Indicators

### Status States

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| `running` | Green pulse | ● | Claude is actively processing |
| `idle` | Gray | ○ | No activity (no session) |
| `finished` | Blue | ✓ | Claude finished, waiting for input |

### Component: StatusBadge.tsx

```typescript
interface Props {
  status: 'running' | 'idle' | 'finished'
  userName: string
}
```

CSS animations:
- `running`: Pulsing green dot
- `finished`: Static blue checkmark
- `idle`: Dim gray circle

---

## Implementation Steps

### Step 1: Create AllScreensView Component
1. Create `src/components/AllScreensView.tsx`
2. Create `src/components/AllScreensView.css`
3. CSS Grid layout (3x2)

### Step 2: Create DesktopTile Component
1. Create `src/components/DesktopTile.tsx`
2. Create `src/components/DesktopTile.css`
3. Wrap GuacamoleDisplay with scaled container
4. Add status badge placeholder

### Step 3: Integrate into App.tsx
1. Add `viewMode` state
2. Add toggle button in header
3. Conditional render carousel vs all-screens
4. Pass `onSelectDesktop` callback

### Step 4: Create StatusBadge Component
1. Create `src/components/StatusBadge.tsx`
2. Create `src/components/StatusBadge.css`
3. Three visual states with animations

### Step 5: Set Up Convex Status API
1. Create `packages/convex/claudeStatus.ts` with mutations/queries
2. Add `/api/claude-status` route to `http.ts`
3. Deploy Convex changes

### Step 6: Configure Claude Hooks on VPS
1. Create `.claude/settings.json` for each user (claude1-6)
2. Each hook POSTs status to Convex HTTP endpoint
3. Test hooks work with `curl` manually first

### Step 7: Add Real-time Status to Dashboard
1. Add `useQuery` for claude status in Final-Vnc
2. Subscribe to Convex for real-time updates
3. Pass status to AllScreensView component

### Step 7: Test & Deploy
1. Test hooks locally
2. Push to GitHub
3. Verify on Vercel

---

## Critical Files Summary

### New Files (Final-Vnc)
```
src/components/
├── AllScreensView.tsx      # Grid container
├── AllScreensView.css      # Grid styles
├── DesktopTile.tsx         # Individual tile
├── DesktopTile.css         # Tile + badge styles
├── StatusBadge.tsx         # Status indicator
└── StatusBadge.css         # Badge animations
```

### Modified Files (Final-Vnc)
```
src/App.tsx                 # Add viewMode, toggle, routing
src/App.css                 # Header button styles
```

### VPS Configuration Files
```
/home/claude1/.claude/settings.json   # Hooks for claude1
/home/claude2/.claude/settings.json   # Hooks for claude2
...
/home/claude6/.claude/settings.json   # Hooks for claude6
/opt/claude-status/update.sh          # Hook script to update status
```

---

## Verification

1. **All Screens View**: Click "View All" button - should see 6-panel grid
2. **Click to Select**: Click any panel - should switch to carousel at that desktop
3. **Status Updates**: Run Claude Code on VPS - status should change to "running"
4. **Status Badge**: When Claude finishes - badge should show "finished" (blue check)
5. **Responsive**: Grid should adjust on smaller screens (2x3 or 1x6)

---

## UI Mockup

```
┌─────────────────────────────────────────────────────────────┐
│  Contabo VPS Dashboard            [● ○ ○ ○ ○ ○]  [View All] │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ Desktop 1   │  │ Desktop 2   │  │ Desktop 3   │          │
│  │  [VNC]      │  │  [VNC]      │  │  [VNC]      │          │
│  │  [SSH]    ●│  │  [SSH]    ○│  │  [SSH]    ✓│          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ Desktop 4   │  │ Desktop 5   │  │ Desktop 6   │          │
│  │  [VNC]      │  │  [VNC]      │  │  [VNC]      │          │
│  │  [SSH]    ○│  │  [SSH]    ●│  │  [SSH]    ○│          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘

Legend: ● running (green pulse)  ○ idle (gray)  ✓ finished (blue)
```

# Mac Mini VNC Setup via Cloudflare Tunnel

This document describes how VNC access to the Mac Mini was configured to work through the Vercel dashboard.

## The Problem

macOS Screen Sharing uses Apple/RealVNC proprietary authentication types (30, 33, 36) alongside standard VNC auth (type 2). The guacd daemon (used by guacamole-lite) selects type 30 first but cannot properly authenticate with it, causing connection failures.

## The Solution

A Python VNC proxy that intercepts the VNC handshake and only offers VncAuth (type 2) to clients.

## Architecture

```
Browser → Vercel Dashboard → guacamole-lite (Linux:5910)
    → cloudflared access → macmini-vnc.braelin.uk
    → cloudflared tunnel → VNC Proxy (Mac:5901)
    → macOS Screen Sharing (Mac:5900)
```

## Components

### 1. macOS Screen Sharing (Port 5900)
- Enable in System Settings → General → Sharing → Screen Sharing
- Click ⓘ → Computer Settings → Check "VNC viewers may control screen with password"
- Set password: `11142006`

### 2. VNC Proxy (`/Users/braelin/vnc_proxy.py`, Port 5901)
The proxy:
- Listens on port 5901
- Connects to macOS Screen Sharing on port 5900
- Intercepts the VNC handshake
- Only offers VncAuth (type 2) to clients, filtering out proprietary types
- Proxies all other traffic transparently

### 3. Cloudflare Tunnel (Mac Mini side)
Config: `~/.cloudflared/config.yml`
```yaml
tunnel: 953851c5-8b24-4410-9837-aa563c0eb294
credentials-file: /Users/braelin/.cloudflared/953851c5-8b24-4410-9837-aa563c0eb294.json

ingress:
  - hostname: macmini-vnc.braelin.uk
    service: tcp://localhost:5901  # Points to VNC proxy, not Screen Sharing directly
  - hostname: macmini-ssh.braelin.uk
    service: tcp://localhost:22
  - hostname: macmini-guac.braelin.uk
    service: http://localhost:8080
  - service: http_status:404
```

### 4. Cloudflare Access (Linux server side)
Running on the Linux VPS to expose the tunnel locally:
```bash
cloudflared access tcp --hostname macmini-vnc.braelin.uk --url localhost:5910
cloudflared access tcp --hostname macmini-ssh.braelin.uk --url localhost:2223
```

### 5. guacTokens.ts Configuration
```typescript
macMiniVnc: generateGuacToken({
  connection: {
    type: 'vnc',
    settings: {
      hostname: '127.0.0.1',
      port: 5910,
      password: '11142006'
    }
  }
}),
macMiniSsh: generateGuacToken({
  connection: {
    type: 'ssh',
    settings: {
      hostname: '127.0.0.1',
      port: 2223,
      username: 'braelin',
      password: 'Mikey@11142006'
    }
  }
})
```

## Auto-Start on Boot

The VNC proxy is configured to start automatically via LaunchAgent:
`~/Library/LaunchAgents/com.braelin.vnc-proxy.plist`

## Troubleshooting

### VNC shows black screen
- Check Screen Recording permission for Screen Sharing in System Settings → Privacy & Security → Screen Recording

### Connection refused
1. Check macOS Screen Sharing is enabled: `netstat -an | grep 5900`
2. Check VNC proxy is running: `ps aux | grep vnc_proxy`
3. Check cloudflared tunnel is running: `ps aux | grep cloudflared`

### Auth failed
- Verify VNC password matches in:
  - macOS Screen Sharing settings
  - guacTokens.ts

## Manual Start Commands

```bash
# Start VNC proxy
python3 /Users/braelin/vnc_proxy.py &

# Start cloudflared tunnel
cloudflared tunnel run &
```

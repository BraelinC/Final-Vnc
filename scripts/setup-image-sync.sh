#!/bin/bash
# Setup image sync for a VNC user
# Usage: sudo ./setup-image-sync.sh <username>
# Example: sudo ./setup-image-sync.sh claude1

if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (sudo)"
    exit 1
fi

USERNAME="${1:-}"
if [ -z "$USERNAME" ]; then
    echo "Usage: $0 <username>"
    echo "Example: $0 claude1"
    exit 1
fi

USER_HOME="/home/$USERNAME"
if [ ! -d "$USER_HOME" ]; then
    echo "User home directory not found: $USER_HOME"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONVEX_HTTP="https://joyous-armadillo-272.convex.site"

echo "Setting up image sync for user: $USERNAME"

# 1. Create the sync script in user's home
cat > "${USER_HOME}/ai-images-sync.sh" << 'SYNCSCRIPT'
#!/bin/bash
CONVEX_HTTP="https://joyous-armadillo-272.convex.site"
IMAGES_DIR="${HOME}/ai-images"
SESSION_NAME="$(whoami)"

mkdir -p "$IMAGES_DIR"

IMAGES=$(curl -s "${CONVEX_HTTP}/api/images/sync?session=${SESSION_NAME}&unsynced=true" 2>/dev/null)
if [ -z "$IMAGES" ] || [ "$IMAGES" = "[]" ]; then
    exit 0
fi

echo "$IMAGES" | jq -r '.[] | @base64' 2>/dev/null | while read -r encoded; do
    json=$(echo "$encoded" | base64 -d 2>/dev/null)
    id=$(echo "$json" | jq -r '._id' 2>/dev/null)
    fileName=$(echo "$json" | jq -r '.fileName' 2>/dev/null)
    url=$(echo "$json" | jq -r '.url' 2>/dev/null)

    if [ -z "$url" ] || [ "$url" = "null" ]; then
        continue
    fi

    targetFile="$IMAGES_DIR/$fileName"
    if [ -f "$targetFile" ]; then
        base="${fileName%.*}"
        ext="${fileName##*.}"
        targetFile="$IMAGES_DIR/${base}_$(date +%s).${ext}"
    fi

    if curl -s -o "$targetFile" "$url" 2>/dev/null; then
        curl -s -X POST "${CONVEX_HTTP}/api/images/mark-synced" \
            -H "Content-Type: application/json" \
            -d "{\"imageId\": \"$id\"}" > /dev/null 2>&1
        logger -t image-sync "Synced: $fileName for $SESSION_NAME"
    fi
done
SYNCSCRIPT

chmod +x "${USER_HOME}/ai-images-sync.sh"
chown "$USERNAME:$USERNAME" "${USER_HOME}/ai-images-sync.sh"

# 2. Create images directory
mkdir -p "${USER_HOME}/ai-images"
chown "$USERNAME:$USERNAME" "${USER_HOME}/ai-images"

# 3. Create systemd service
cat > "/etc/systemd/system/image-sync@${USERNAME}.service" << EOF
[Unit]
Description=Sync pasted images for ${USERNAME}
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
User=${USERNAME}
ExecStart=${USER_HOME}/ai-images-sync.sh
Environment="HOME=${USER_HOME}"
StandardOutput=null
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 4. Create systemd timer
cat > "/etc/systemd/system/image-sync@${USERNAME}.timer" << EOF
[Unit]
Description=Sync pasted images every 30 seconds for ${USERNAME}

[Timer]
OnBootSec=10s
OnUnitActiveSec=30s
AccuracySec=5s

[Install]
WantedBy=timers.target
EOF

# 5. Enable and start the timer
systemctl daemon-reload
systemctl enable "image-sync@${USERNAME}.timer"
systemctl start "image-sync@${USERNAME}.timer"

echo ""
echo "Setup complete for $USERNAME!"
echo ""
echo "Service status:"
systemctl status "image-sync@${USERNAME}.timer" --no-pager
echo ""
echo "Images will sync to: ${USER_HOME}/ai-images/"
echo "AI tools can reference images using: ~/ai-images/<filename>"

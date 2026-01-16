#!/bin/bash
# Sync pasted images from Convex to local ~/ai-images/ folder
# Run this script on each VNC machine (e.g., as a cron job)
#
# Usage: ./sync-images.sh [session_name]
# If no session_name provided, uses current username

CONVEX_HTTP="https://joyous-armadillo-272.convex.site"
IMAGES_DIR="${HOME}/ai-images"
SESSION_NAME="${1:-$(whoami)}"

# Create images directory if it doesn't exist
mkdir -p "$IMAGES_DIR"

echo "Syncing images for session: $SESSION_NAME"
echo "Images directory: $IMAGES_DIR"

# Fetch unsynced images for this session
IMAGES=$(curl -s "${CONVEX_HTTP}/api/images/sync?session=${SESSION_NAME}&unsynced=true")

if [ -z "$IMAGES" ] || [ "$IMAGES" = "[]" ]; then
    echo "No new images to sync"
    exit 0
fi

# Parse JSON and download each image
echo "$IMAGES" | jq -r '.[] | @base64' | while read -r encoded; do
    # Decode the JSON object
    json=$(echo "$encoded" | base64 -d)

    id=$(echo "$json" | jq -r '._id')
    fileName=$(echo "$json" | jq -r '.fileName')
    url=$(echo "$json" | jq -r '.url')
    mimeType=$(echo "$json" | jq -r '.mimeType')

    if [ -z "$url" ] || [ "$url" = "null" ]; then
        echo "Skipping image $id - no URL"
        continue
    fi

    # Generate unique filename with timestamp if file exists
    targetFile="$IMAGES_DIR/$fileName"
    if [ -f "$targetFile" ]; then
        base="${fileName%.*}"
        ext="${fileName##*.}"
        timestamp=$(date +%s)
        targetFile="$IMAGES_DIR/${base}_${timestamp}.${ext}"
    fi

    echo "Downloading: $fileName -> $targetFile"

    # Download the image
    if curl -s -o "$targetFile" "$url"; then
        echo "  Downloaded successfully"

        # Mark as synced in Convex
        curl -s -X POST "${CONVEX_HTTP}/api/images/mark-synced" \
            -H "Content-Type: application/json" \
            -d "{\"imageId\": \"$id\"}" > /dev/null

        echo "  Marked as synced"
    else
        echo "  Failed to download"
    fi
done

echo ""
echo "Sync complete. Images available at: $IMAGES_DIR"
echo "AI tools can reference files in this directory."

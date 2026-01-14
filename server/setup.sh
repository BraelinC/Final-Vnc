#!/bin/bash
# Setup script for VNC Provisioner API
# Run this with: sudo bash setup.sh

set -e

echo "=== VNC Provisioner Setup ==="

# Copy files to /opt
echo "1. Copying files to /opt/vnc-provisioner..."
mkdir -p /opt/vnc-provisioner
cp server.js package.json /opt/vnc-provisioner/

# Install dependencies
echo "2. Installing Node.js dependencies..."
cd /opt/vnc-provisioner
npm install

# Install systemd service
echo "3. Installing systemd service..."
cp vnc-provisioner.service /etc/systemd/system/
systemctl daemon-reload

# Start the service
echo "4. Starting VNC Provisioner API..."
systemctl enable vnc-provisioner.service
systemctl start vnc-provisioner.service

# Check status
echo ""
echo "=== Setup Complete ==="
systemctl status vnc-provisioner.service --no-pager

echo ""
echo "API is now running on port 3001"
echo "Test with: curl http://localhost:3001/api/health"

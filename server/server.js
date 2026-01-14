const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// CORS for dashboard access
app.use(cors({
  origin: ['https://final-vnc.vercel.app', 'http://localhost:5173', 'http://localhost:4173'],
  methods: ['GET', 'POST', 'DELETE']
}));
app.use(express.json());

// Helper to run shell commands
function runCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: 60000 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Command failed: ${cmd}`);
        console.error(stderr);
        reject(new Error(stderr || error.message));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

// Get next available user number
async function getNextUserNumber() {
  try {
    const result = await runCommand("cat /etc/passwd | grep '^claude[0-9]' | sed 's/claude//' | cut -d: -f1 | sort -n | tail -1");
    const lastNum = parseInt(result) || 6;
    return lastNum + 1;
  } catch {
    return 7; // Default if no users found
  }
}

// List existing VNC users
app.get('/api/users', async (req, res) => {
  try {
    const result = await runCommand("cat /etc/passwd | grep '^claude' | cut -d: -f1 | sort");
    const users = result.split('\n').filter(u => u.length > 0);

    // Get VNC status for each user
    const usersWithStatus = await Promise.all(users.map(async (user) => {
      const match = user.match(/claude(\d+)?/);
      const num = match[1] ? parseInt(match[1]) : 1;
      const displayNum = num;
      const vncPort = 5900 + displayNum;

      let running = false;
      try {
        await runCommand(`netstat -tlnp 2>/dev/null | grep :${vncPort} || ss -tlnp | grep :${vncPort}`);
        running = true;
      } catch {
        running = false;
      }

      return {
        username: user,
        displayNumber: displayNum,
        vncPort,
        running
      };
    }));

    res.json({ users: usersWithStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Provision a new VNC user
app.post('/api/provision', async (req, res) => {
  try {
    const nextNum = await getNextUserNumber();
    const username = `claude${nextNum}`;
    const displayNum = nextNum;
    const vncPort = 5900 + displayNum;
    const vncPassword = '11142006'; // Same as existing users

    console.log(`Provisioning ${username} on display :${displayNum} (port ${vncPort})`);

    // Step 1: Create user
    console.log('Creating user...');
    await runCommand(`useradd -m -s /bin/bash ${username}`);

    // Step 2: Create .vnc directory
    console.log('Setting up VNC directory...');
    await runCommand(`mkdir -p /home/${username}/.vnc`);

    // Step 3: Create xstartup
    const xstartup = `#!/bin/bash
xrdb $HOME/.Xresources
startxfce4 &
`;
    fs.writeFileSync(`/tmp/xstartup-${username}`, xstartup);
    await runCommand(`cp /tmp/xstartup-${username} /home/${username}/.vnc/xstartup`);
    await runCommand(`chmod 755 /home/${username}/.vnc/xstartup`);

    // Step 4: Set VNC password
    console.log('Setting VNC password...');
    await runCommand(`echo "${vncPassword}" | vncpasswd -f > /home/${username}/.vnc/passwd`);
    await runCommand(`chmod 600 /home/${username}/.vnc/passwd`);

    // Step 5: Set ownership
    await runCommand(`chown -R ${username}:${username} /home/${username}/.vnc`);

    // Step 6: Create systemd service
    console.log('Creating systemd service...');
    const serviceContent = `[Unit]
Description=VNC Server for ${username}
After=syslog.target network.target

[Service]
Type=forking
User=${username}
ExecStartPre=/bin/sh -c '/usr/bin/vncserver -kill :${displayNum} > /dev/null 2>&1 || :'
ExecStart=/usr/bin/vncserver :${displayNum} -geometry 1920x1080 -depth 24
ExecStop=/usr/bin/vncserver -kill :${displayNum}
Restart=on-failure

[Install]
WantedBy=multi-user.target
`;
    fs.writeFileSync(`/tmp/vncserver-${username}.service`, serviceContent);
    await runCommand(`cp /tmp/vncserver-${username}.service /etc/systemd/system/vncserver-${username}.service`);

    // Step 7: Start VNC
    console.log('Starting VNC server...');
    await runCommand('systemctl daemon-reload');
    await runCommand(`systemctl enable vncserver-${username}.service`);
    await runCommand(`systemctl start vncserver-${username}.service`);

    // Wait a moment for VNC to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify VNC is running
    let running = false;
    try {
      await runCommand(`netstat -tlnp 2>/dev/null | grep :${vncPort} || ss -tlnp | grep :${vncPort}`);
      running = true;
    } catch {
      running = false;
    }

    console.log(`Provisioning complete: ${username} (running: ${running})`);

    res.json({
      success: true,
      user: {
        username,
        displayNumber: displayNum,
        vncPort,
        running
      }
    });

  } catch (error) {
    console.error('Provisioning failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Deprovision a user (stop VNC, optionally delete user)
app.delete('/api/deprovision/:username', async (req, res) => {
  const { username } = req.params;
  const deleteUser = req.query.deleteUser === 'true';

  // Safety check - don't delete claude1-6
  const match = username.match(/claude(\d+)?/);
  if (!match) {
    return res.status(400).json({ error: 'Invalid username' });
  }
  const num = match[1] ? parseInt(match[1]) : 1;
  if (num <= 6) {
    return res.status(400).json({ error: 'Cannot deprovision base users (claude1-6)' });
  }

  try {
    // Stop and disable VNC service
    await runCommand(`systemctl stop vncserver-${username}.service || true`);
    await runCommand(`systemctl disable vncserver-${username}.service || true`);
    await runCommand(`rm -f /etc/systemd/system/vncserver-${username}.service`);
    await runCommand('systemctl daemon-reload');

    if (deleteUser) {
      // Delete user and home directory
      await runCommand(`userdel -r ${username} || true`);
    }

    res.json({ success: true, message: `Deprovisioned ${username}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`VNC Provisioner API running on port ${PORT}`);
});

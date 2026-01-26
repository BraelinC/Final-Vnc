import CryptoJS from 'crypto-js';

// Must match the key in /opt/guacamole-lite/server.js (exactly 32 characters)
const CIPHER_KEY = 'MySecretKeyForGuacamole123456789';

interface GuacConnection {
  connection: {
    type: 'vnc' | 'ssh';
    settings: {
      hostname: string;
      port: number | string;
      password?: string;
      username?: string;
      command?: string;
      scrollback?: number;
      'terminal-type'?: string;
    };
  };
}

export function generateGuacToken(connection: GuacConnection): string {
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(
    JSON.stringify(connection),
    CryptoJS.enc.Utf8.parse(CIPHER_KEY),
    { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
  );

  // guacamole-lite expects: base64({ iv: "base64", value: "base64" })
  const tokenObj = {
    iv: CryptoJS.enc.Base64.stringify(iv),
    value: encrypted.ciphertext.toString(CryptoJS.enc.Base64)
  };

  return btoa(JSON.stringify(tokenObj));
}

// Pre-generated tokens for our desktops
export const guacTokens = {
  claude1Vnc: generateGuacToken({
    connection: {
      type: 'vnc',
      settings: {
        hostname: '127.0.0.1',
        port: 5901,
        password: '11142006'
      }
    }
  }),
  claude1Ssh: generateGuacToken({
    connection: {
      type: 'ssh',
      settings: {
        hostname: '127.0.0.1',
        port: 22,
        username: 'claude',
        password: '11142006',
        command: 'tmux attach -t claude1 || tmux new -s claude1',
        scrollback: 5000,
        'terminal-type': 'xterm-256color'
      }
    }
  }),
  claude2Vnc: generateGuacToken({
    connection: {
      type: 'vnc',
      settings: {
        hostname: '127.0.0.1',
        port: 5902,
        password: '11142006'
      }
    }
  }),
  claude2Ssh: generateGuacToken({
    connection: {
      type: 'ssh',
      settings: {
        hostname: '127.0.0.1',
        port: 22,
        username: 'claude2',
        password: '11142006',
        command: 'tmux attach -t claude2 || tmux new -s claude2',
        scrollback: 5000,
        'terminal-type': 'xterm-256color'
      }
    }
  }),
  claude3Vnc: generateGuacToken({
    connection: {
      type: 'vnc',
      settings: {
        hostname: '127.0.0.1',
        port: 5903,
        password: '11142006'
      }
    }
  }),
  claude3Ssh: generateGuacToken({
    connection: {
      type: 'ssh',
      settings: {
        hostname: '127.0.0.1',
        port: 22,
        username: 'claude3',
        password: '11142006',
        command: 'tmux attach -t claude3 || tmux new -s claude3',
        scrollback: 5000,
        'terminal-type': 'xterm-256color'
      }
    }
  }),
  claude4Vnc: generateGuacToken({
    connection: {
      type: 'vnc',
      settings: {
        hostname: '127.0.0.1',
        port: 5904,
        password: '11142006'
      }
    }
  }),
  claude4Ssh: generateGuacToken({
    connection: {
      type: 'ssh',
      settings: {
        hostname: '127.0.0.1',
        port: 22,
        username: 'claude4',
        password: '11142006',
        command: 'tmux attach -t claude4 || tmux new -s claude4',
        scrollback: 5000,
        'terminal-type': 'xterm-256color'
      }
    }
  }),
  claude5Vnc: generateGuacToken({
    connection: {
      type: 'vnc',
      settings: {
        hostname: '127.0.0.1',
        port: 5905,
        password: '11142006'
      }
    }
  }),
  claude5Ssh: generateGuacToken({
    connection: {
      type: 'ssh',
      settings: {
        hostname: '127.0.0.1',
        port: 22,
        username: 'claude5',
        password: '11142006',
        command: 'tmux attach -t claude5 || tmux new -s claude5',
        scrollback: 5000,
        'terminal-type': 'xterm-256color'
      }
    }
  }),
  claude6Vnc: generateGuacToken({
    connection: {
      type: 'vnc',
      settings: {
        hostname: '127.0.0.1',
        port: 5906,
        password: '11142006'
      }
    }
  }),
  claude6Ssh: generateGuacToken({
    connection: {
      type: 'ssh',
      settings: {
        hostname: '127.0.0.1',
        port: 22,
        username: 'claude6',
        password: '11142006',
        command: 'tmux attach -t claude6 || tmux new -s claude6',
        scrollback: 5000,
        'terminal-type': 'xterm-256color'
      }
    }
  }),
  // macOS Sonoma VM (local QEMU)
  macosVnc: generateGuacToken({
    connection: {
      type: 'vnc',
      settings: {
        hostname: '127.0.0.1',
        port: 5900
      }
    }
  }),
  macosSsh: generateGuacToken({
    connection: {
      type: 'ssh',
      settings: {
        hostname: '127.0.0.1',
        port: 2222,
        username: 'techrechard.com',
        password: 'Mikey@2006',
        scrollback: 5000,
        'terminal-type': 'xterm-256color'
      }
    }
  }),
  // Mac Mini (via cloudflared tunnel - localhost:5910 proxies to macmini-vnc.braelin.uk)
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
        password: 'Mikey@11142006',
        command: 'tmux attach -t claude || tmux new -s claude',
        scrollback: 5000,
        'terminal-type': 'xterm-256color'
      }
    }
  })
};

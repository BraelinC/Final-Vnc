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
        username: 'claude5'
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
        username: 'claude6'
      }
    }
  })
};

import { useEffect, useRef, useCallback } from 'react';
import Guacamole from 'guacamole-common-js';

interface Props {
  token: string;
  className?: string;
}

export function GuacamoleDisplay({ token, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<Guacamole.Client | null>(null);
  const scaleRef = useRef<number>(1);

  const connect = useCallback(() => {
    if (!containerRef.current) return;

    if (clientRef.current) {
      clientRef.current.disconnect();
    }

    const tunnel = new Guacamole.WebSocketTunnel(
      `wss://guac.braelin.uk/?token=${encodeURIComponent(token)}`
    );

    const client = new Guacamole.Client(tunnel);
    clientRef.current = client;

    const container = containerRef.current;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    container.innerHTML = '';
    const display = client.getDisplay();
    const displayElement = display.getElement();

    // Position at 0,0 - no transforms
    displayElement.style.position = 'absolute';
    displayElement.style.left = '0';
    displayElement.style.top = '0';
    container.appendChild(displayElement);

    // Scale to fit container
    display.onresize = () => {
      const displayWidth = display.getWidth();
      const displayHeight = display.getHeight();
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;

      if (displayWidth && displayHeight) {
        const scale = Math.min(
          containerWidth / displayWidth,
          containerHeight / displayHeight,
          1
        );
        scaleRef.current = scale;
        display.scale(scale);
        console.log(`Display scaled to ${scale.toFixed(3)} (${displayWidth}x${displayHeight} -> container ${containerWidth}x${containerHeight})`);
      }
    };

    client.onerror = (error) => {
      console.error('Guacamole error:', error);
    };

    client.onstatechange = (state) => {
      console.log('Guacamole state:', state);
    };

    // Clipboard: remote → local (when VNC clipboard changes, copy to browser)
    client.onclipboard = (stream: Guacamole.InputStream, mimetype: string) => {
      if (mimetype !== 'text/plain') return;

      let clipboardData = '';
      const reader = new Guacamole.StringReader(stream);

      reader.ontext = (text: string) => {
        clipboardData += text;
      };

      reader.onend = () => {
        if (clipboardData) {
          navigator.clipboard.writeText(clipboardData).then(() => {
            console.log('Clipboard from VNC:', clipboardData.substring(0, 50) + (clipboardData.length > 50 ? '...' : ''));
          }).catch(err => {
            console.error('Failed to write to clipboard:', err);
          });
        }
      };
    };

    // Native mouse handling - bypass broken Guacamole.Mouse
    const mouseState = new Guacamole.Mouse.State(0, 0, false, false, false, false, false);

    const handleMouse = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const scale = scaleRef.current;

      // Get position relative to container, then convert to display coords
      const x = Math.floor((e.clientX - rect.left) / scale);
      const y = Math.floor((e.clientY - rect.top) / scale);

      mouseState.x = x;
      mouseState.y = y;
      mouseState.left = (e.buttons & 1) !== 0;
      mouseState.middle = (e.buttons & 4) !== 0;
      mouseState.right = (e.buttons & 2) !== 0;

      if (e.type === 'mousedown') {
        console.log(`CLICK at (${x}, ${y}) scale=${scale.toFixed(3)} raw=(${e.clientX - rect.left}, ${e.clientY - rect.top})`);
      }

      client.sendMouseState(mouseState);
      e.preventDefault();
    };

    container.addEventListener('mousedown', handleMouse);
    container.addEventListener('mouseup', handleMouse);
    container.addEventListener('mousemove', handleMouse);
    container.addEventListener('contextmenu', (e) => e.preventDefault());

    // Make container focusable and focus on click
    container.tabIndex = 0;
    container.style.outline = 'none';
    container.focus();

    const focusOnClick = () => container.focus();
    container.addEventListener('mousedown', focusOnClick);

    // Clipboard: local → remote (paste into VNC)
    const sendClipboardToRemote = (text: string) => {
      const stream = client.createClipboardStream('text/plain');
      const writer = new Guacamole.StringWriter(stream);
      writer.sendText(text);
      writer.sendEnd();
      console.log('Clipboard to VNC:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
    };

    // Keyboard - prevent browser from handling special keys
    let skipNextCtrlV = false;
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Handle Ctrl+V paste - intercept and handle manually
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        skipNextCtrlV = true;
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            // Send clipboard data first
            sendClipboardToRemote(text);
            // Wait for clipboard to be set, then send Ctrl+V
            setTimeout(() => {
              // Ctrl down, V down, V up, Ctrl up
              client.sendKeyEvent(1, 65507); // Ctrl down
              client.sendKeyEvent(1, 118);   // v down
              client.sendKeyEvent(0, 118);   // v up
              client.sendKeyEvent(0, 65507); // Ctrl up
            }, 50);
          }
        } catch (err) {
          console.error('Failed to read clipboard:', err);
        }
        e.preventDefault();
        e.stopPropagation();
        return; // Don't let Guacamole.Keyboard handle this
      }
      // Prevent browser defaults for all keys when VNC is focused
      e.preventDefault();
      e.stopPropagation();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    container.addEventListener('keydown', handleKeyDown);
    container.addEventListener('keyup', handleKeyUp);

    // Guacamole keyboard for keysym translation
    const keyboard = new Guacamole.Keyboard(container);
    keyboard.onkeydown = (keysym: number) => {
      // Skip if we're handling Ctrl+V manually
      if (skipNextCtrlV && (keysym === 65507 || keysym === 65508 || keysym === 118)) {
        console.log(`KEY DOWN (skipped for paste): ${keysym}`);
        return false;
      }
      console.log(`KEY DOWN: ${keysym}`);
      client.sendKeyEvent(1, keysym);
      return false;
    };
    keyboard.onkeyup = (keysym: number) => {
      // Reset skip flag on Ctrl release
      if (keysym === 65507 || keysym === 65508) {
        skipNextCtrlV = false;
      }
      if (skipNextCtrlV && (keysym === 65507 || keysym === 65508 || keysym === 118)) {
        console.log(`KEY UP (skipped for paste): ${keysym}`);
        return;
      }
      console.log(`KEY UP: ${keysym}`);
      client.sendKeyEvent(0, keysym);
    };

    // Request VNC at container size (server may ignore)
    client.connect(`width=${containerWidth}&height=${containerHeight}`);

    return () => {
      container.removeEventListener('mousedown', handleMouse);
      container.removeEventListener('mouseup', handleMouse);
      container.removeEventListener('mousemove', handleMouse);
      container.removeEventListener('mousedown', focusOnClick);
      container.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('keyup', handleKeyUp);
      keyboard.onkeydown = null;
      keyboard.onkeyup = null;
      keyboard.reset();
      client.disconnect();
    };
  }, [token]);

  useEffect(() => {
    const cleanup = connect();
    return () => {
      cleanup?.();
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, [connect]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        background: '#000'
      }}
    />
  );
}

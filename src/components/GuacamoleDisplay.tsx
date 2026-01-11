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

    // Type text directly by sending key events for each character
    const typeText = (text: string) => {
      for (const char of text) {
        const code = char.charCodeAt(0);
        // For basic ASCII, keysym = char code
        // For special chars we'd need a lookup table
        if (code >= 32 && code <= 126) {
          client.sendKeyEvent(1, code); // key down
          client.sendKeyEvent(0, code); // key up
        } else if (char === '\n') {
          client.sendKeyEvent(1, 65293); // Return down
          client.sendKeyEvent(0, 65293); // Return up
        } else if (char === '\t') {
          client.sendKeyEvent(1, 65289); // Tab down
          client.sendKeyEvent(0, 65289); // Tab up
        }
      }
      console.log('Typed text directly:', text.substring(0, 30) + (text.length > 30 ? '...' : ''));
    };

    // Native mouse handling - bypass broken Guacamole.Mouse
    const mouseState = new Guacamole.Mouse.State(0, 0, false, false, false, false, false);

    const handleMouse = async (e: MouseEvent) => {
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

      // Middle-click paste: type clipboard text directly
      if (e.type === 'mousedown' && e.button === 1) {
        console.log('Middle-click detected - typing clipboard');
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            typeText(text);
          }
        } catch (err) {
          console.error('Failed to read clipboard for middle-click paste:', err);
        }
        e.preventDefault();
        return; // Don't send middle-click to VNC
      }

      if (e.type === 'mousedown') {
        console.log(`CLICK at (${x}, ${y}) scale=${scale.toFixed(3)} button=${e.button}`);
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

    // Clipboard: local → remote (send text in chunks for large data)
    const sendClipboardToRemote = (text: string) => {
      const stream = client.createClipboardStream('text/plain');
      const writer = new Guacamole.StringWriter(stream);
      // Send in 4096 byte chunks (as per Guacamole docs)
      for (let i = 0; i < text.length; i += 4096) {
        writer.sendText(text.substring(i, i + 4096));
      }
      writer.sendEnd();
      console.log('Clipboard to VNC:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
    };

    // Ctrl+V paste: type clipboard text directly
    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text/plain');
      if (text) {
        console.log('Ctrl+V paste - typing clipboard');
        typeText(text);
      }
      e.preventDefault();
    };
    container.addEventListener('paste', handlePaste);

    // Keyboard - block Ctrl+V from going to VNC (we handle it via paste event)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow Ctrl+C/X through to browser
      if ((e.ctrlKey || e.metaKey) && ['c', 'x'].includes(e.key.toLowerCase())) {
        return;
      }
      // Ctrl+V - let paste event handle it, don't send to VNC
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        return; // paste event will fire and handle this
      }
      e.preventDefault();
      e.stopPropagation();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x'].includes(e.key.toLowerCase())) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
    };
    container.addEventListener('keydown', handleKeyDown);
    container.addEventListener('keyup', handleKeyUp);

    // Guacamole keyboard - send all keys EXCEPT Ctrl+V to VNC
    let ctrlHeld = false;
    const keyboard = new Guacamole.Keyboard(container);
    keyboard.onkeydown = (keysym: number) => {
      // Track Ctrl
      if (keysym === 65507 || keysym === 65508) ctrlHeld = true;
      // Block Ctrl+V - paste event handles it
      if (ctrlHeld && keysym === 118) {
        console.log('Blocking Ctrl+V - paste event will handle');
        return true;
      }
      console.log(`KEY DOWN: ${keysym}`);
      client.sendKeyEvent(1, keysym);
      return true;
    };
    keyboard.onkeyup = (keysym: number) => {
      if (keysym === 65507 || keysym === 65508) ctrlHeld = false;
      // Block Ctrl+V release
      if (ctrlHeld && keysym === 118) return;
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
      container.removeEventListener('paste', handlePaste);
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

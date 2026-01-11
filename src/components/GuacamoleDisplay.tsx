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

    // Handle browser paste event - send clipboard then Ctrl+Shift+V (for terminals)
    let isPasting = false;
    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text/plain');
      if (text) {
        isPasting = true;
        sendClipboardToRemote(text);
        // Wait for clipboard to arrive, then send Ctrl+Shift+V (terminal paste)
        setTimeout(() => {
          // Ctrl+Shift+V for terminal paste (Ctrl+V doesn't work in terminals!)
          client.sendKeyEvent(1, 65507); // Ctrl down
          client.sendKeyEvent(1, 65505); // Shift down
          client.sendKeyEvent(1, 118);   // v down
          client.sendKeyEvent(0, 118);   // v up
          client.sendKeyEvent(0, 65505); // Shift up
          client.sendKeyEvent(0, 65507); // Ctrl up
          console.log('Sent Ctrl+Shift+V to VNC after clipboard');
          isPasting = false;
        }, 100);
      }
    };
    container.addEventListener('paste', handlePaste);

    // Keyboard - allow Ctrl+C/X through, block Ctrl+V (we handle it manually)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow Ctrl+C/X through to browser for copy
      if ((e.ctrlKey || e.metaKey) && ['c', 'x'].includes(e.key.toLowerCase())) {
        return;
      }
      // Block Ctrl+V - we handle paste manually via paste event
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        // Don't preventDefault - we want paste event to fire
        // But we'll block it from going to Guacamole.Keyboard
        return;
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

    // Guacamole keyboard for keysym translation
    // Track modifier state to detect Ctrl+V
    let ctrlPressed = false;
    let blockingPaste = false;

    const keyboard = new Guacamole.Keyboard(container);
    keyboard.onkeydown = (keysym: number) => {
      // Track Ctrl
      if (keysym === 65507 || keysym === 65508) {
        ctrlPressed = true;
      }

      // Detect Ctrl+V - block it, paste event will handle
      if (ctrlPressed && keysym === 118) {
        blockingPaste = true;
        console.log('Ctrl+V detected - blocking, paste event will handle');
        return true; // Let browser fire paste event
      }

      // During paste operation, block everything
      if (isPasting) {
        return false;
      }

      // Normal key - send to VNC
      // But don't send Ctrl if we're about to paste
      if ((keysym === 65507 || keysym === 65508) && blockingPaste) {
        return true;
      }

      console.log(`KEY DOWN: ${keysym}`);
      client.sendKeyEvent(1, keysym);
      return true;
    };

    keyboard.onkeyup = (keysym: number) => {
      // Track Ctrl release
      if (keysym === 65507 || keysym === 65508) {
        ctrlPressed = false;
        if (blockingPaste) {
          blockingPaste = false;
          return; // Don't send Ctrl release for paste
        }
      }

      // Block v release if we blocked the press
      if (keysym === 118 && blockingPaste) {
        return;
      }

      // During paste operation, block everything
      if (isPasting) {
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

import { useEffect, useRef, useCallback } from 'react';
import Guacamole from 'guacamole-common-js';

type ConnectionState = 'connecting' | 'connected' | 'error';

interface Props {
  token: string;
  className?: string;
  connectionId: string;
  connectionState: ConnectionState;
  onConnectionStateChange: (id: string, state: ConnectionState) => void;
  wsUrl?: string;  // Optional custom WebSocket URL (default: wss://guac.braelin.uk/)
}

export function GuacamoleDisplay({ token, className, connectionId, connectionState, onConnectionStateChange, wsUrl = 'wss://guac.braelin.uk/' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<Guacamole.Client | null>(null);
  const scaleRef = useRef<number>(1);
  const hasConnectedRef = useRef(false);
  // Store callback in ref to avoid dependency issues
  const onStateChangeRef = useRef(onConnectionStateChange);
  onStateChangeRef.current = onConnectionStateChange;

  const connect = useCallback(() => {
    if (!containerRef.current) return;

    // Skip if already connected to avoid reconnection loops
    if (hasConnectedRef.current && clientRef.current) {
      return;
    }

    onStateChangeRef.current(connectionId, 'connecting');

    if (clientRef.current) {
      clientRef.current.disconnect();
    }

    console.log(`[${connectionId}] Creating WebSocket tunnel to: ${wsUrl}`);
    const tunnel = new Guacamole.WebSocketTunnel(wsUrl);

    tunnel.onerror = (status) => {
      console.error(`[${connectionId}] Tunnel error:`, status);
    };

    tunnel.onstatechange = (state) => {
      console.log(`[${connectionId}] Tunnel state changed to:`, state);
    };

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

    // Scale to fit container - for SSH/terminals, scale to fit WIDTH so text is readable
    // Check if this is an SSH connection (terminal) based on connectionId
    const isTerminal = connectionId.startsWith('ssh-');

    display.onresize = () => {
      const displayWidth = display.getWidth();
      const displayHeight = display.getHeight();
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;

      if (displayWidth && displayHeight) {
        let scale: number;

        if (isTerminal) {
          // For terminals: scale to fit WIDTH so text is readable
          // Allow scaling up beyond 1 for small screens
          scale = containerWidth / displayWidth;
          // Also ensure it fits height, but prioritize readable text
          const heightScale = containerHeight / displayHeight;
          // If height would be too cramped, use height scale instead
          if (heightScale < scale * 0.5) {
            scale = heightScale;
          }
        } else {
          // For VNC desktop: fit within container, capped at 1
          scale = Math.min(
            containerWidth / displayWidth,
            containerHeight / displayHeight,
            1
          );
        }

        scaleRef.current = scale;
        display.scale(scale);
        console.log(`Display scaled to ${scale.toFixed(3)} (${displayWidth}x${displayHeight} -> container ${containerWidth}x${containerHeight}) isTerminal=${isTerminal}`);
      }
    };

    client.onerror = (error) => {
      console.error(`[${connectionId}] Guacamole client error:`, error);
      onStateChangeRef.current(connectionId, 'error');
    };

    // Track connection state - only send events when connected (state 3)
    let isConnected = false;
    const stateNames = ['IDLE', 'CONNECTING', 'WAITING', 'CONNECTED', 'DISCONNECTING', 'DISCONNECTED'];
    client.onstatechange = (state) => {
      const stateName = stateNames[state] || 'UNKNOWN';
      console.log(`[${connectionId}] Guacamole state changed: ${state} (${stateName})`);
      isConnected = (state === 3); // 3 = CONNECTED
      if (state === 3) {
        hasConnectedRef.current = true;
        console.log(`[${connectionId}] ✓ Successfully connected!`);
        onStateChangeRef.current(connectionId, 'connected');
      } else if (state === 5) { // 5 = DISCONNECTED
        hasConnectedRef.current = false;
        console.error(`[${connectionId}] ✗ Disconnected/Error`);
        onStateChangeRef.current(connectionId, 'error');
      }
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
      if (!isConnected) {
        console.log('Not connected, cannot type');
        return;
      }
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

      // Only send mouse state if connected
      if (isConnected) {
        client.sendMouseState(mouseState);
      }
      e.preventDefault();
    };

    // Mouse wheel scrolling - enter tmux copy-mode and scroll
    let inCopyMode = false;
    let copyModeTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleWheel = (e: WheelEvent) => {
      if (!isConnected) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const scale = scaleRef.current;
      const x = Math.floor((e.clientX - rect.left) / scale);
      const y = Math.floor((e.clientY - rect.top) / scale);

      // Send mouse scroll events for VNC desktop
      // Constructor: State(x, y, left, middle, right, up, down)
      if (e.deltaY < 0) {
        client.sendMouseState(new Guacamole.Mouse.State(x, y, false, false, false, true, false));
        client.sendMouseState(new Guacamole.Mouse.State(x, y, false, false, false, false, false));
      } else if (e.deltaY > 0) {
        client.sendMouseState(new Guacamole.Mouse.State(x, y, false, false, false, false, true));
        client.sendMouseState(new Guacamole.Mouse.State(x, y, false, false, false, false, false));
      }

      // For SSH/tmux: enter copy mode and scroll with arrow keys
      if (!inCopyMode) {
        // Send Ctrl+B [ to enter tmux copy mode
        client.sendKeyEvent(1, 65507); // Ctrl down
        client.sendKeyEvent(1, 98);    // 'b' down
        client.sendKeyEvent(0, 98);    // 'b' up
        client.sendKeyEvent(0, 65507); // Ctrl up
        client.sendKeyEvent(1, 91);    // '[' down
        client.sendKeyEvent(0, 91);    // '[' up
        inCopyMode = true;
      }

      // Calculate lines to scroll based on wheel delta (1-5 lines)
      const lines = Math.min(5, Math.max(1, Math.ceil(Math.abs(e.deltaY) / 30)));
      const keyCode = e.deltaY < 0 ? 65362 : 65364; // Up arrow : Down arrow

      // Send arrow keys for smooth line-by-line scrolling
      for (let i = 0; i < lines; i++) {
        client.sendKeyEvent(1, keyCode);
        client.sendKeyEvent(0, keyCode);
      }

      // Reset copy mode flag after 3 seconds of no scrolling
      if (copyModeTimeout) clearTimeout(copyModeTimeout);
      copyModeTimeout = setTimeout(() => {
        inCopyMode = false;
      }, 3000);

      e.preventDefault();
    };

    container.addEventListener('mousedown', handleMouse);
    container.addEventListener('mouseup', handleMouse);
    container.addEventListener('mousemove', handleMouse);
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('contextmenu', (e) => e.preventDefault());

    // Make container focusable and focus on click
    container.tabIndex = 0;
    container.style.outline = 'none';
    container.focus();

    const focusOnClick = () => container.focus();
    container.addEventListener('mousedown', focusOnClick);

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
    // Also capture Tab/Shift+Tab to prevent browser focus navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      // CRITICAL: Capture Tab and Shift+Tab - send directly to VNC
      if (e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        if (isConnected) {
          if (e.shiftKey) {
            // Shift+Tab: Send complete Shift+Tab sequence
            // We handle this fully ourselves to ensure correct order
            console.log('Shift+Tab detected - sending full Shift+Tab sequence');
            client.sendKeyEvent(1, 65505); // Shift_L down
            client.sendKeyEvent(1, 65289); // Tab down
            client.sendKeyEvent(0, 65289); // Tab up
            client.sendKeyEvent(0, 65505); // Shift_L up
          } else {
            // Regular Tab
            console.log('Tab detected - sending Tab');
            client.sendKeyEvent(1, 65289); // Tab down
            client.sendKeyEvent(0, 65289); // Tab up
          }
        }
        return;
      }
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
      // Tab is fully handled in keydown - ignore keyup
      if (e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x'].includes(e.key.toLowerCase())) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
    };
    container.addEventListener('keydown', handleKeyDown);
    container.addEventListener('keyup', handleKeyUp);

    // Document-level Tab capture to prevent focus leaving container
    // This catches Tab/Shift+Tab before browser can change focus
    // We handle Tab here in capture phase to ensure we get it before browser focus management
    const handleDocumentKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && document.activeElement === container) {
        e.preventDefault();
        e.stopPropagation();
        // Send Tab/Shift+Tab to VNC from here since we're capturing at document level
        if (isConnected) {
          if (e.shiftKey) {
            console.log('Shift+Tab detected (document capture) - sending full Shift+Tab sequence');
            client.sendKeyEvent(1, 65505); // Shift_L down
            client.sendKeyEvent(1, 65289); // Tab down
            client.sendKeyEvent(0, 65289); // Tab up
            client.sendKeyEvent(0, 65505); // Shift_L up
          } else {
            console.log('Tab detected (document capture) - sending Tab');
            client.sendKeyEvent(1, 65289); // Tab down
            client.sendKeyEvent(0, 65289); // Tab up
          }
        }
      }
    };
    document.addEventListener('keydown', handleDocumentKeyDown, true); // capture phase

    // Guacamole keyboard - send all keys EXCEPT Ctrl+V and Tab to VNC
    // Tab/Shift+Tab are handled manually in handleKeyDown for better control
    let ctrlHeld = false;
    let shiftHeldForTab = false; // Track if Shift is held when Tab is pressed
    const keyboard = new Guacamole.Keyboard(container);
    keyboard.onkeydown = (keysym: number) => {
      // Track Ctrl
      if (keysym === 65507 || keysym === 65508) ctrlHeld = true;
      // Track Shift - we'll block its release if Tab was pressed
      if (keysym === 65505 || keysym === 65506) shiftHeldForTab = false;
      // Block Ctrl+V - paste event handles it
      if (ctrlHeld && keysym === 118) {
        console.log('Blocking Ctrl+V - paste event will handle');
        return true;
      }
      // Block Tab and ISO_Left_Tab - handleKeyDown handles these manually
      if (keysym === 65289 || keysym === 65056) {
        console.log('Blocking Tab in Guacamole keyboard - handleKeyDown will handle');
        shiftHeldForTab = true; // Mark that Tab was pressed while Shift may be held
        return true;
      }
      // Only send if connected
      if (isConnected) {
        console.log(`KEY DOWN: ${keysym}`);
        client.sendKeyEvent(1, keysym);
      }
      return true;
    };
    keyboard.onkeyup = (keysym: number) => {
      if (keysym === 65507 || keysym === 65508) ctrlHeld = false;
      // Block Ctrl+V release
      if (ctrlHeld && keysym === 118) return;
      // Block Tab and ISO_Left_Tab release
      if (keysym === 65289 || keysym === 65056) return;
      // Block Shift release if we just handled Shift+Tab (we sent our own Shift up)
      if ((keysym === 65505 || keysym === 65506) && shiftHeldForTab) {
        console.log('Blocking Shift release - already sent by Tab handler');
        shiftHeldForTab = false;
        return;
      }
      // Only send if connected
      if (isConnected) {
        console.log(`KEY UP: ${keysym}`);
        client.sendKeyEvent(0, keysym);
      }
    };

    // Request VNC at container size (server may ignore)
    // Pass token via connect() instead of URL to avoid base64 corruption
    client.connect(`token=${encodeURIComponent(token)}&width=${containerWidth}&height=${containerHeight}`);

    return () => {
      container.removeEventListener('mousedown', handleMouse);
      container.removeEventListener('mouseup', handleMouse);
      container.removeEventListener('mousemove', handleMouse);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', focusOnClick);
      container.removeEventListener('paste', handlePaste);
      container.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('keydown', handleDocumentKeyDown, true);
      keyboard.onkeydown = null;
      keyboard.onkeyup = null;
      keyboard.reset();
      client.disconnect();
    };
  }, [token, connectionId, wsUrl]);

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
    >
      {/* Loading overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#16213e',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          zIndex: connectionState === 'connected' ? -1 : 10,
          opacity: connectionState === 'connected' ? 0 : 1,
          transition: 'opacity 0.3s ease-out',
          pointerEvents: connectionState === 'connected' ? 'none' : 'auto'
        }}
      >
        <div
          style={{
            width: '50px',
            height: '50px',
            border: '4px solid #333',
            borderTopColor: '#e94560',
            borderRadius: '50%',
            animation: 'guac-spin 1s linear infinite'
          }}
        />
        <p style={{ color: '#888', fontSize: '1.1rem' }}>
          {connectionState === 'error' ? 'Connection failed' : 'Connecting...'}
        </p>
      </div>
      <style>{`
        @keyframes guac-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

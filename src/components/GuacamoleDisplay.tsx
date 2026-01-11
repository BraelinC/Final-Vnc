import { useEffect, useRef, useCallback } from 'react';
import Guacamole from 'guacamole-common-js';

interface Props {
  token: string;
  className?: string;
}

export function GuacamoleDisplay({ token, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<Guacamole.Client | null>(null);

  const connect = useCallback(() => {
    if (!containerRef.current || !displayRef.current) return;

    // Clean up existing client
    if (clientRef.current) {
      clientRef.current.disconnect();
    }

    // Create WebSocket tunnel to guacamole-lite
    const tunnel = new Guacamole.WebSocketTunnel(
      `wss://guac.braelin.uk/?token=${encodeURIComponent(token)}`
    );

    const client = new Guacamole.Client(tunnel);
    clientRef.current = client;

    const displayWrapper = displayRef.current;

    // Clear and add display element to wrapper
    displayWrapper.innerHTML = '';
    displayWrapper.appendChild(client.getDisplay().getElement());

    // No scaling - keep 1:1 pixel ratio for accurate mouse
    const display = client.getDisplay();
    display.onresize = () => {
      // Match wrapper size to display size
      const w = display.getWidth();
      const h = display.getHeight();
      if (w && h) {
        displayWrapper.style.width = w + 'px';
        displayWrapper.style.height = h + 'px';
      }
    };

    // Handle errors
    client.onerror = (error) => {
      console.error('Guacamole error:', error);
    };

    // Handle state changes
    client.onstatechange = (state) => {
      console.log('Guacamole state:', state);
    };

    // Mouse on displayWrapper - NO scaling, raw coordinates
    const mouse = new Guacamole.Mouse(displayWrapper);

    mouse.onEach(['mousedown', 'mouseup', 'mousemove'], (e) => {
      const state = (e as Guacamole.Mouse.Event).state;
      // Send raw coordinates - no transformation
      client.sendMouseState(state);
    });

    // Keyboard handling
    const keyboard = new Guacamole.Keyboard(document);
    keyboard.onkeydown = (keysym: number) => {
      client.sendKeyEvent(1, keysym);
      return true;
    };
    keyboard.onkeyup = (keysym: number) => {
      client.sendKeyEvent(0, keysym);
    };

    // Connect
    client.connect();

    return () => {
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
    >
      <div
        ref={displayRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0
        }}
      />
    </div>
  );
}

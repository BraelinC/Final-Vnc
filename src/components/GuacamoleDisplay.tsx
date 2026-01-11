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
  const scaleRef = useRef<number>(1);

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

    // Get container dimensions
    const container = containerRef.current;
    const displayWrapper = displayRef.current;

    // Clear and add display element to wrapper
    displayWrapper.innerHTML = '';
    displayWrapper.appendChild(client.getDisplay().getElement());

    // Rescale display to fit container (guacozy style)
    const rescaleDisplay = () => {
      const display = client.getDisplay();
      const displayWidth = display.getWidth();
      const displayHeight = display.getHeight();
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;

      if (displayWidth && displayHeight && containerWidth && containerHeight) {
        // Scale to fit, max 1 (never enlarge)
        const newScale = Math.min(
          containerWidth / displayWidth,
          containerHeight / displayHeight,
          1
        );
        display.scale(newScale);
        scaleRef.current = newScale;
      }
    };

    // Update scale when display size changes
    client.getDisplay().onresize = rescaleDisplay;

    // Handle errors
    client.onerror = (error) => {
      console.error('Guacamole error:', error);
    };

    // Handle state changes
    client.onstatechange = (state) => {
      console.log('Guacamole state:', state);
      if (state === 3) { // CONNECTED
        setTimeout(rescaleDisplay, 100);
      }
    };

    // Mouse on displayWrapper (guacozy style)
    const mouse = new Guacamole.Mouse(displayWrapper);

    mouse.onEach(['mousedown', 'mouseup', 'mousemove'], (e) => {
      const state = (e as Guacamole.Mouse.Event).state;
      state.x = state.x / scaleRef.current;
      state.y = state.y / scaleRef.current;
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

    // Handle container resize
    const resizeObserver = new ResizeObserver(() => {
      rescaleDisplay();
    });
    resizeObserver.observe(container);

    // Connect
    client.connect();

    return () => {
      resizeObserver.disconnect();
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

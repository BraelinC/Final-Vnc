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

    const container = containerRef.current;
    const display = client.getDisplay();
    const displayElement = display.getElement();

    // Clear container and add display
    container.innerHTML = '';
    container.appendChild(displayElement);

    // Scale display to fit container
    const rescaleDisplay = () => {
      const displayWidth = display.getWidth();
      const displayHeight = display.getHeight();
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;

      if (displayWidth && displayHeight && containerWidth && containerHeight) {
        const scale = Math.min(
          containerWidth / displayWidth,
          containerHeight / displayHeight,
          1
        );
        display.scale(scale);
        scaleRef.current = scale;
      }
    };

    display.onresize = rescaleDisplay;

    client.onerror = (error) => {
      console.error('Guacamole error:', error);
    };

    client.onstatechange = (state) => {
      console.log('Guacamole state:', state);
      if (state === 3) {
        setTimeout(rescaleDisplay, 100);
      }
    };

    // Mouse directly on the display element
    const mouse = new Guacamole.Mouse(displayElement);

    mouse.onEach(['mousedown', 'mouseup', 'mousemove'], (e) => {
      const state = (e as Guacamole.Mouse.Event).state;
      // Divide by scale to get VNC coordinates
      state.x = state.x / scaleRef.current;
      state.y = state.y / scaleRef.current;
      client.sendMouseState(state);
    });

    // Keyboard
    const keyboard = new Guacamole.Keyboard(document);
    keyboard.onkeydown = (keysym: number) => {
      client.sendKeyEvent(1, keysym);
      return true;
    };
    keyboard.onkeyup = (keysym: number) => {
      client.sendKeyEvent(0, keysym);
    };

    // Resize observer
    const resizeObserver = new ResizeObserver(rescaleDisplay);
    resizeObserver.observe(container);

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
    />
  );
}

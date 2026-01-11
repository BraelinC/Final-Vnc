import { useEffect, useRef, useCallback } from 'react';
import Guacamole from 'guacamole-common-js';

interface Props {
  token: string;
  className?: string;
}

export function GuacamoleDisplay({ token, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<Guacamole.Client | null>(null);

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
    const display = client.getDisplay();
    const displayElement = display.getElement();

    container.innerHTML = '';
    container.appendChild(displayElement);

    // NO SCALING - just use overflow scroll
    // This keeps mouse coords accurate

    client.onerror = (error) => {
      console.error('Guacamole error:', error);
    };

    client.onstatechange = (state) => {
      console.log('Guacamole state:', state);
    };

    // Mouse on display element - no coordinate transformation
    const mouse = new Guacamole.Mouse(displayElement);

    mouse.onEach(['mousedown', 'mouseup', 'mousemove'], (e) => {
      const state = (e as Guacamole.Mouse.Event).state;
      if (e.type === 'mousedown') {
        console.log(`CLICK: (${state.x}, ${state.y})`);
      }
      client.sendMouseState(state);
    });

    const keyboard = new Guacamole.Keyboard(document);
    keyboard.onkeydown = (keysym: number) => {
      client.sendKeyEvent(1, keysym);
      return true;
    };
    keyboard.onkeyup = (keysym: number) => {
      client.sendKeyEvent(0, keysym);
    };

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
        overflow: 'auto',
        position: 'relative',
        background: '#000'
      }}
    />
  );
}

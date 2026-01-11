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

    // Clear container and add display
    containerRef.current.innerHTML = '';
    const displayElement = client.getDisplay().getElement();
    displayElement.style.width = '100%';
    displayElement.style.height = '100%';
    containerRef.current.appendChild(displayElement);

    // Handle errors
    client.onerror = (error) => {
      console.error('Guacamole error:', error);
    };

    // Handle state changes
    client.onstatechange = (state) => {
      console.log('Guacamole state:', state);
    };

    // Set up mouse handling using the event-based API
    const mouse = new Guacamole.Mouse(displayElement);
    mouse.onEach(['mousedown', 'mouseup', 'mousemove'], (e) => {
      const mouseEvent = e as Guacamole.Mouse.Event;
      client.sendMouseState(mouseEvent.state);
    });

    // Set up keyboard handling
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
      style={{ width: '100%', height: '100%', overflow: 'hidden' }}
    />
  );
}

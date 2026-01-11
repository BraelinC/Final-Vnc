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

    // Get container dimensions
    const container = containerRef.current;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    // Clear container and add display
    container.innerHTML = '';
    const display = client.getDisplay();
    const displayElement = display.getElement();

    // Style the display element
    displayElement.style.position = 'absolute';
    displayElement.style.left = '0';
    displayElement.style.top = '0';
    container.appendChild(displayElement);

    // Handle display resize - scale to fit container and center
    const updateScale = () => {
      const currentContainerWidth = container.offsetWidth;
      const currentContainerHeight = container.offsetHeight;
      const displayWidth = display.getWidth();
      const displayHeight = display.getHeight();

      if (displayWidth && displayHeight && currentContainerWidth && currentContainerHeight) {
        const scaleX = currentContainerWidth / displayWidth;
        const scaleY = currentContainerHeight / displayHeight;
        const scale = Math.min(scaleX, scaleY);
        display.scale(scale);

        // Center the display
        const scaledWidth = displayWidth * scale;
        const scaledHeight = displayHeight * scale;
        const offsetX = (currentContainerWidth - scaledWidth) / 2;
        const offsetY = (currentContainerHeight - scaledHeight) / 2;
        displayElement.style.left = `${offsetX}px`;
        displayElement.style.top = `${offsetY}px`;
      }
    };

    // Update scale when display size changes
    display.onresize = updateScale;

    // Handle errors
    client.onerror = (error) => {
      console.error('Guacamole error:', error);
    };

    // Handle state changes
    client.onstatechange = (state) => {
      console.log('Guacamole state:', state);
      // Update scale when connected
      if (state === 3) { // CONNECTED
        setTimeout(updateScale, 100);
      }
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

    // Handle container resize
    const resizeObserver = new ResizeObserver(() => {
      updateScale();
    });
    resizeObserver.observe(container);

    // Connect with container dimensions so server matches our size
    client.connect(`width=${containerWidth}&height=${containerHeight}`);

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

import { useState, useEffect, useRef } from 'react';
import './SplitDesktop.css';

interface Props {
  vncDisplay: React.ReactNode;
  terminalDisplay: React.ReactNode;
  sshCmd?: string;
}

// Pinch-to-zoom hook for terminal
function usePinchZoom() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const initialDistance = useRef<number | null>(null);
  const initialScale = useRef(1);
  const lastTouch = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getDistance = (touches: TouchList) => {
      if (touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getCenter = (touches: TouchList) => {
      if (touches.length < 2) return { x: touches[0].clientX, y: touches[0].clientY };
      return {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2
      };
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        initialDistance.current = getDistance(e.touches);
        initialScale.current = scale;
        const center = getCenter(e.touches);
        lastTouch.current = center;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDistance.current) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches);
        const newScale = Math.min(3, Math.max(0.5, initialScale.current * (currentDistance / initialDistance.current)));
        setScale(newScale);

        // Pan while zooming
        const center = getCenter(e.touches);
        if (newScale > 1) {
          setTranslate(prev => ({
            x: prev.x + (center.x - lastTouch.current.x) * 0.5,
            y: prev.y + (center.y - lastTouch.current.y) * 0.5
          }));
        }
        lastTouch.current = center;
      }
    };

    const handleTouchEnd = () => {
      initialDistance.current = null;
      // Reset if zoomed out
      if (scale <= 1) {
        setTranslate({ x: 0, y: 0 });
      }
    };

    // Double-tap to reset
    let lastTap = 0;
    const handleDoubleTap = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const now = Date.now();
        if (now - lastTap < 300) {
          setScale(1);
          setTranslate({ x: 0, y: 0 });
        }
        lastTap = now;
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchstart', handleDoubleTap);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchstart', handleDoubleTap);
    };
  }, [scale]);

  return { containerRef, scale, translate };
}

// Check mobile on initial load (SSR safe)
// If device has touch capability, always use mobile view (even in landscape)
const getIsMobile = () => {
  if (typeof window === 'undefined') return false;
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  // Touch device = always mobile view (phone/tablet)
  // Non-touch = only mobile if very narrow (small browser window)
  return hasTouch || window.innerWidth <= 500;
};

export function SplitDesktop({ vncDisplay, terminalDisplay, sshCmd }: Props) {
  const [viewMode, setViewMode] = useState<'stacked' | 'split'>('split');
  const [isMobile, setIsMobile] = useState(getIsMobile);
  const [copied, setCopied] = useState(false);
  const { containerRef: terminalRef, scale, translate } = usePinchZoom();

  // Detect mobile on resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(getIsMobile());
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleView = () => {
    setViewMode(viewMode === 'stacked' ? 'split' : 'stacked');
  };

  const copySSH = () => {
    if (sshCmd) {
      navigator.clipboard.writeText(sshCmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Mobile view - VNC on top, terminal on bottom (portrait)
  // In landscape, terminal hides and VNC fills screen
  if (isMobile) {
    return (
      <div className="mobile-container">
        <div className="mobile-vnc">
          {vncDisplay}
        </div>
        <div className="mobile-terminal" ref={terminalRef}>
          <div
            className="mobile-terminal-content"
            style={{
              transform: `scale(${scale}) translate(${translate.x}px, ${translate.y}px)`,
              transformOrigin: 'center center'
            }}
          >
            {terminalDisplay}
          </div>
          {scale !== 1 && (
            <div className="zoom-indicator">{Math.round(scale * 100)}%</div>
          )}
        </div>
        {sshCmd && (
          <div className="mobile-ssh-bar" onClick={copySSH}>
            <span className="mobile-ssh-label">SSH:</span>
            <code className="mobile-ssh-cmd">
              {copied ? '✓ Copied!' : sshCmd}
            </code>
          </div>
        )}
      </div>
    );
  }

  // Desktop split view
  if (viewMode === 'split') {
    return (
      <div className="split-container">
        <div className="split-left">
          {vncDisplay}
        </div>
        <div className="split-divider" onClick={toggleView} title="Stack vertically">
          <span className="chevron">«</span>
        </div>
        <div className="split-right">
          {terminalDisplay}
        </div>
      </div>
    );
  }

  // Desktop stacked view
  return (
    <div className="stacked-container">
      <div className="stacked-top">
        {vncDisplay}
      </div>
      <div className="stacked-divider" onClick={toggleView} title="Split side-by-side">
        <span className="chevron">»</span>
      </div>
      <div className="stacked-bottom">
        {terminalDisplay}
      </div>
    </div>
  );
}

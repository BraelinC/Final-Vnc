import { useState, useEffect } from 'react';

interface Props {
  url: string;
  className?: string;
}

export function BroadwayDisplay({ url, className }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);

  // Detect orientation changes
  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      {/* Loading overlay */}
      {!loaded && !error && (
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
            zIndex: 10
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              border: '4px solid #333',
              borderTopColor: '#4ade80',
              borderRadius: '50%',
              animation: 'broadway-spin 1s linear infinite'
            }}
          />
          <p style={{ color: '#888', fontSize: '1.1rem' }}>
            Connecting to Broadway...
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
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
            zIndex: 10
          }}
        >
          <p style={{ color: '#e94560', fontSize: '1.1rem' }}>
            Failed to connect to Broadway
          </p>
          <button
            onClick={() => {
              setError(false);
              setLoaded(false);
            }}
            style={{
              padding: '8px 16px',
              background: '#4ade80',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              color: '#000'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Broadway iframe - responsive for mobile */}
      <iframe
        src={url}
        style={{
          width: isPortrait ? '100%' : '100%',
          height: isPortrait ? '100%' : '100%',
          border: 'none',
          display: loaded ? 'block' : 'none',
          // Scale down on mobile portrait for better fit
          transform: isPortrait ? 'scale(1)' : 'none',
          transformOrigin: 'top left',
          maxWidth: '100vw',
          maxHeight: '100vh',
          objectFit: 'contain'
        }}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        title="Broadway Display"
        allow="clipboard-read; clipboard-write"
      />

      <style>{`
        @keyframes broadway-spin {
          to { transform: rotate(360deg); }
        }

        /* Mobile-specific styles */
        @media (max-width: 768px) and (orientation: portrait) {
          iframe {
            width: 100% !important;
            height: 100% !important;
          }
        }

        /* Ensure touch scrolling works */
        .broadway-display {
          -webkit-overflow-scrolling: touch;
          touch-action: manipulation;
        }
      `}</style>
    </div>
  );
}

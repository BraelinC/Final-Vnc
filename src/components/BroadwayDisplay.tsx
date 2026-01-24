import { useState } from 'react';

interface Props {
  url: string;
  className?: string;
}

export function BroadwayDisplay({ url, className }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: '#000'
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

      {/* Broadway iframe */}
      <iframe
        src={url}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: loaded ? 'block' : 'none'
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
      `}</style>
    </div>
  );
}

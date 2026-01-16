import { useState, useEffect, useCallback, useRef } from 'react';

const CONVEX_HTTP = 'https://joyous-armadillo-272.convex.site';

interface PastedImage {
  _id: string;
  fileName: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedAt: number;
  syncedAt?: number;
}

interface Props {
  vncSession: string; // e.g., "claude1", "claude2"
  isVisible?: boolean;
}

export function ImagePaste({ vncSession, isVisible = true }: Props) {
  const [images, setImages] = useState<PastedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [expanded, setExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch images for this session
  const fetchImages = useCallback(async () => {
    try {
      const response = await fetch(`${CONVEX_HTTP}/api/images?session=${vncSession}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setImages(data);
      }
    } catch (error) {
      console.error('Failed to fetch images:', error);
    }
  }, [vncSession]);

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchImages();
    const interval = setInterval(fetchImages, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchImages]);

  // Upload image to Convex
  const uploadImage = useCallback(async (file: File) => {
    setUploading(true);
    setUploadProgress('Getting upload URL...');

    try {
      // Step 1: Get upload URL
      const uploadResponse = await fetch(`${CONVEX_HTTP}/api/images/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vncSession,
          fileName: file.name || `pasted-${Date.now()}.${file.type.split('/')[1] || 'png'}`,
          mimeType: file.type,
          size: file.size,
        }),
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, fileName } = await uploadResponse.json();
      setUploadProgress('Uploading image...');

      // Step 2: Upload file to Convex storage
      const storageResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!storageResponse.ok) {
        throw new Error('Failed to upload to storage');
      }

      const { storageId } = await storageResponse.json();
      setUploadProgress('Saving metadata...');

      // Step 3: Save metadata
      const saveResponse = await fetch(`${CONVEX_HTTP}/api/images/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vncSession,
          fileName,
          storageId,
          mimeType: file.type,
          size: file.size,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save metadata');
      }

      setUploadProgress('Done!');
      setTimeout(() => setUploadProgress(''), 2000);

      // Refresh images list
      fetchImages();

    } catch (error) {
      console.error('Upload failed:', error);
      setUploadProgress(`Error: ${error instanceof Error ? error.message : 'Upload failed'}`);
      setTimeout(() => setUploadProgress(''), 3000);
    } finally {
      setUploading(false);
    }
  }, [vncSession, fetchImages]);

  // Handle paste event
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            await uploadImage(file);
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [uploadImage]);

  // Handle file input change
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      uploadImage(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [uploadImage]);

  // Delete image
  const deleteImage = useCallback(async (imageId: string) => {
    try {
      await fetch(`${CONVEX_HTTP}/api/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId }),
      });
      fetchImages();
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  }, [fetchImages]);

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Upload status */}
      {uploadProgress && (
        <div style={{
          background: uploading ? '#2563eb' : (uploadProgress.startsWith('Error') ? '#dc2626' : '#16a34a'),
          color: 'white',
          padding: '8px 16px',
          borderRadius: '8px',
          marginBottom: '8px',
          fontSize: '14px',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          {uploadProgress}
        </div>
      )}

      {/* Collapsed toggle button - large for mobile tap */}
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            padding: '16px 24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '16px',
            fontWeight: 600,
            boxShadow: '0 4px 16px rgba(59, 130, 246, 0.4)',
            minWidth: '140px',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: '22px' }}>+</span>
          Images {images.length > 0 && `(${images.length})`}
        </button>
      ) : (
        /* Expanded panel */
        <div style={{
          background: '#1f2937',
          borderRadius: '12px',
          padding: '16px',
          width: '320px',
          maxHeight: '400px',
          overflow: 'auto',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}>
            <span style={{ color: 'white', fontWeight: 600 }}>
              Images - {vncSession}
            </span>
            <button
              onClick={() => setExpanded(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                fontSize: '20px',
                padding: '0 4px',
              }}
            >
              -
            </button>
          </div>

          {/* Upload buttons - Gallery for mobile, Paste for desktop */}
          <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
            {/* Gallery picker - works on mobile */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                flex: 1,
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 10px',
                cursor: uploading ? 'not-allowed' : 'pointer',
                opacity: uploading ? 0.7 : 1,
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              {uploading ? 'Uploading...' : 'Gallery'}
            </button>
            {/* Camera capture - mobile only */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="camera-input"
            />
            <button
              onClick={() => document.getElementById('camera-input')?.click()}
              disabled={uploading}
              style={{
                flex: 1,
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 10px',
                cursor: uploading ? 'not-allowed' : 'pointer',
                opacity: uploading ? 0.7 : 1,
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Camera
            </button>
          </div>

          {/* Images grid */}
          {images.length === 0 ? (
            <div style={{ color: '#9ca3af', textAlign: 'center', padding: '20px', fontSize: '14px' }}>
              No images yet. Paste an image or click to upload.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
            }}>
              {images.map((img) => (
                <div
                  key={img._id}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#374151',
                  }}
                >
                  <img
                    src={img.url}
                    alt={img.fileName}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  {/* Overlay with actions */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                  >
                    <a
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#3b82f6',
                        color: 'white',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        fontSize: '12px',
                      }}
                    >
                      Open
                    </a>
                    <button
                      onClick={() => deleteImage(img._id)}
                      style={{
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                  {/* Sync indicator */}
                  {img.syncedAt && (
                    <div style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      background: '#16a34a',
                      borderRadius: '50%',
                      width: '12px',
                      height: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }} title="Synced to VNC">
                      <span style={{ fontSize: '8px', color: 'white' }}>S</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Path info */}
          <div style={{
            marginTop: '12px',
            padding: '8px',
            background: '#374151',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#9ca3af',
          }}>
            AI tools can reference: <code style={{ color: '#60a5fa' }}>~/ai-images/</code>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

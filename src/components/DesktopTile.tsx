import { useState, useCallback } from 'react'
import { GuacamoleDisplay } from './GuacamoleDisplay'
import './DesktopTile.css'

type ConnectionState = 'connecting' | 'connected' | 'error'

interface Desktop {
  id: number
  name: string
  user: string
  type?: 'novnc' | 'guacamole' | 'novnc-split'
  vncToken?: string
  sshToken?: string
}

interface Props {
  desktop: Desktop
  onClick: () => void
  isLoaded: boolean
}

export function DesktopTile({ desktop, onClick, isLoaded }: Props) {
  // Each tile manages its own connection state for the preview displays
  const [connectionStates, setConnectionStates] = useState<Record<string, ConnectionState>>({})

  const updateConnectionState = useCallback((id: string, state: ConnectionState) => {
    setConnectionStates(prev => ({ ...prev, [id]: state }))
  }, [])

  return (
    <div className="desktop-tile" onClick={onClick}>
      <div className="tile-header">
        <span className="tile-name">{desktop.name}</span>
        <span className="tile-user">{desktop.user}</span>
      </div>
      <div className="tile-content">
        {isLoaded ? (
          desktop.vncToken ? (
            <GuacamoleDisplay
              token={desktop.vncToken}
              className="tile-guac-display"
              connectionId={`tile-vnc-${desktop.id}`}
              connectionState={connectionStates[`tile-vnc-${desktop.id}`] || 'connecting'}
              onConnectionStateChange={updateConnectionState}
            />
          ) : (
            <div className="tile-loading">
              <div className="spinner"></div>
            </div>
          )
        ) : (
          <div className="tile-loading">
            <div className="spinner"></div>
          </div>
        )}
      </div>
      <div className="tile-overlay">
        <span>Click to view</span>
      </div>
    </div>
  )
}

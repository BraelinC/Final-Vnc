import { useState, useCallback, useEffect } from 'react'
import './App.css'
import { SplitDesktop } from './components/SplitDesktop'
import { GuacamoleDisplay } from './components/GuacamoleDisplay'
import { AllScreensView } from './components/AllScreensView'
import { ImagePaste } from './components/ImagePaste'
import { guacTokens, generateGuacToken } from './lib/guacTokens'

// Provisioning API URL
const PROVISION_API = 'https://provision.braelin.uk'

interface Desktop {
  id: number
  name: string
  user: string
  type: 'novnc' | 'guacamole' | 'novnc-split'
  url?: string
  termUrl?: string
  vncToken?: string
  sshToken?: string
  sshCmd: string
  ttydUrl: string  // ttyd terminal URL for mobile
  wsUrl?: string   // Optional custom WebSocket URL for local guacamole-lite
}

// Mac Mini (physical machine via Cloudflare Tunnel)
const macMiniDesktop: Desktop = {
  id: 100,
  name: 'Mac Mini',
  user: 'braelin',
  type: 'guacamole',
  vncToken: guacTokens.macMiniVnc,
  sshToken: guacTokens.macMiniSsh,
  sshCmd: 'ssh braelin@192.168.122.142',
  ttydUrl: ''
  // Uses default wss://guac.braelin.uk/
}

// No hardcoded desktops - fetch from API
const initialDesktops: Desktop[] = [macMiniDesktop]

type ConnectionState = 'connecting' | 'connected' | 'error'

// Create desktop object from user info
function createDesktopFromUser(username: string, displayNumber: number, vncPort: number): Desktop {
  const vncToken = generateGuacToken({
    connection: {
      type: 'vnc',
      settings: {
        hostname: '127.0.0.1',
        port: vncPort,
        password: '11142006'
      }
    }
  })

  const sshToken = generateGuacToken({
    connection: {
      type: 'ssh',
      settings: {
        hostname: '127.0.0.1',
        port: 22,
        username: username,
        password: '11142006',
        command: `tmux attach -t ${username} || tmux new -s ${username}`,
        scrollback: 5000,
        'terminal-type': 'xterm-256color'
      }
    }
  })

  return {
    id: displayNumber,
    name: `Desktop ${displayNumber}`,
    user: username,
    type: 'guacamole',
    vncToken,
    sshToken,
    sshCmd: `ssh root@38.242.207.4 -t "su - ${username} -c 'tmux a -t ${username} || tmux new -s ${username}'"`,
    ttydUrl: `https://term${displayNumber}.braelin.uk`
  }
}

function App() {
  const [desktops, setDesktops] = useState<Desktop[]>(initialDesktops)
  // Use desktop ID instead of index for stable navigation
  const [currentDesktopId, setCurrentDesktopId] = useState<number>(1)
  const [preloadAll, setPreloadAll] = useState(false)
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel')
  const [provisioning, setProvisioning] = useState(false)
  // Track connection state at app level so it persists across tab switches
  const [connectionStates, setConnectionStates] = useState<Record<string, ConnectionState>>({})

  // Find current desktop and index by ID
  const currentIndex = desktops.findIndex(d => d.id === currentDesktopId)
  const currentDesktop = desktops[currentIndex] || desktops[0]

  // If current ID not found (e.g., after reload), reset to first desktop
  useEffect(() => {
    if (currentIndex === -1 && desktops.length > 0) {
      setCurrentDesktopId(desktops[0].id)
    }
  }, [currentIndex, desktops])

  const updateConnectionState = useCallback((id: string, state: ConnectionState) => {
    setConnectionStates(prev => ({ ...prev, [id]: state }))
  }, [])

  // Fetch existing users from API on load
  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch(`${PROVISION_API}/api/users`)
        if (!response.ok) return

        const data = await response.json()
        const apiDesktops: Desktop[] = data.users
          .filter((u: any) => u.running)
          .map((u: any) => createDesktopFromUser(u.username, u.displayNumber, u.vncPort))
          .sort((a: Desktop, b: Desktop) => a.id - b.id)

        if (apiDesktops.length > 0) {
          // Combine API desktops with Mac Mini
          setDesktops([...apiDesktops, macMiniDesktop])
        }
      } catch (error) {
        console.error('Failed to fetch users:', error)
        // Keep using initialDesktops on error
      }
    }
    fetchUsers()
  }, [])

  // Pre-load all desktops after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => setPreloadAll(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  // Navigate by desktop ID (stable) not index
  const goToId = useCallback((id: number) => {
    setCurrentDesktopId(id)
  }, [])

  const next = useCallback(() => {
    const nextIndex = (currentIndex + 1) % desktops.length
    setCurrentDesktopId(desktops[nextIndex].id)
  }, [currentIndex, desktops])

  const prev = useCallback(() => {
    const prevIndex = (currentIndex - 1 + desktops.length) % desktops.length
    setCurrentDesktopId(desktops[prevIndex].id)
  }, [currentIndex, desktops])

  const copySSH = useCallback(() => {
    navigator.clipboard.writeText(currentDesktop.sshCmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [currentDesktop.sshCmd])

  const selectFromGrid = useCallback((desktopId: number) => {
    setCurrentDesktopId(desktopId)
    setViewMode('carousel')
  }, [])

  const toggleViewMode = useCallback(() => {
    setViewMode(v => v === 'carousel' ? 'grid' : 'carousel')
  }, [])

  // Add a new desktop via provisioning API
  const addDesktop = useCallback(async () => {
    if (provisioning) return

    setProvisioning(true)
    try {
      const response = await fetch(`${PROVISION_API}/api/provision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Provisioning failed')
      }

      const data = await response.json()
      const { username, displayNumber, vncPort } = data.user

      const newDesktop = createDesktopFromUser(username, displayNumber, vncPort)
      setDesktops(prev => [...prev, newDesktop])
      console.log(`Added new desktop: ${username}`)

    } catch (error) {
      console.error('Failed to provision desktop:', error)
      alert(`Failed to add desktop: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setProvisioning(false)
    }
  }, [provisioning])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') prev()
    if (e.key === 'ArrowRight') next()
  }, [next, prev])

  return (
    <div className="app" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Header */}
      <header className="header">
        <h1>Contabo VPS Dashboard</h1>
        <div className="header-center">
          {viewMode === 'carousel' && (
            <div className="dots">
              {desktops.map((desktop) => (
                <button
                  key={desktop.id}
                  className={`dot ${desktop.id === currentDesktopId ? 'active' : ''}`}
                  onClick={() => goToId(desktop.id)}
                  title={desktop.name}
                />
              ))}
            </div>
          )}
          <button className="view-toggle" onClick={toggleViewMode}>
            {viewMode === 'carousel' ? 'View All' : 'Carousel'}
          </button>
        </div>
        {viewMode === 'carousel' && (
          <div className="ssh-section">
            <span className="ssh-label">SSH:</span>
            <code className="ssh-cmd" onClick={copySSH}>
              {copied ? 'Copied!' : currentDesktop.sshCmd}
            </code>
          </div>
        )}
      </header>

      {/* Both views stay mounted - use CSS to show/hide to preserve connections */}
      <div className={`carousel-container ${viewMode === 'carousel' ? 'active' : 'hidden'}`}>
        {/* Navigation Arrows */}
        <button className="nav-arrow left" onClick={prev}>
          ‹
        </button>
        <button className="nav-arrow right" onClick={next}>
          ›
        </button>

        {/* Carousel */}
        <div className="carousel">
          <div
            className="carousel-track"
            style={{ transform: `translateX(-${Math.max(0, currentIndex) * 100}%)` }}
          >
            {desktops.map((desktop, index) => (
              <div key={desktop.id} className="slide">
                {(index === currentIndex || preloadAll) ? (
                  <SplitDesktop
                    vncDisplay={
                      <GuacamoleDisplay
                        token={desktop.vncToken!}
                        className="guac-display"
                        connectionId={`vnc-${desktop.id}`}
                        connectionState={connectionStates[`vnc-${desktop.id}`] || 'connecting'}
                        onConnectionStateChange={updateConnectionState}
                        wsUrl={desktop.wsUrl}
                      />
                    }
                    terminalDisplay={
                      desktop.sshToken ? (
                        <GuacamoleDisplay
                          token={desktop.sshToken}
                          className="guac-display"
                          connectionId={`ssh-${desktop.id}`}
                          connectionState={connectionStates[`ssh-${desktop.id}`] || 'connecting'}
                          onConnectionStateChange={updateConnectionState}
                          wsUrl={desktop.wsUrl}
                        />
                      ) : (
                        <div className="no-terminal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888', background: '#1a1a2e' }}>
                          <p>No terminal available for {desktop.name}</p>
                        </div>
                      )
                    }
                    sshCmd={desktop.sshCmd}
                    ttydUrl={desktop.ttydUrl}
                  />
                ) : (
                  <div className="loading-placeholder">
                    <div className="spinner"></div>
                    <p>Loading {desktop.name}...</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`grid-container ${viewMode === 'grid' ? 'active' : 'hidden'}`}>
        <AllScreensView
          desktops={desktops}
          onSelectDesktop={selectFromGrid}
          onAddDesktop={addDesktop}
          isLoaded={preloadAll}
          isProvisioning={provisioning}
        />
      </div>

      {/* Image paste panel - shows for current VNC session */}
      <ImagePaste
        vncSession={currentDesktop.user}
        isVisible={viewMode === 'carousel'}
      />

    </div>
  )
}

export default App

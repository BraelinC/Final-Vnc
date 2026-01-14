import { useState, useCallback, useEffect } from 'react'
import './App.css'
import { SplitDesktop } from './components/SplitDesktop'
import { GuacamoleDisplay } from './components/GuacamoleDisplay'
import { AllScreensView } from './components/AllScreensView'
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
}

// Initial desktops (claude1-6)
const initialDesktops: Desktop[] = [
  {
    id: 1,
    name: 'Desktop 1',
    user: 'claude',
    type: 'guacamole',
    vncToken: guacTokens.claude1Vnc,
    sshToken: guacTokens.claude1Ssh,
    sshCmd: 'ssh root@38.242.207.4 -t "su - claude -c tmux"'
  },
  {
    id: 2,
    name: 'Desktop 2',
    user: 'claude2',
    type: 'guacamole',
    vncToken: guacTokens.claude2Vnc,
    sshToken: guacTokens.claude2Ssh,
    sshCmd: 'ssh root@38.242.207.4 -t "su - claude2 -c tmux"'
  },
  {
    id: 3,
    name: 'Desktop 3',
    user: 'claude3',
    type: 'guacamole',
    vncToken: guacTokens.claude3Vnc,
    sshToken: guacTokens.claude3Ssh,
    sshCmd: 'ssh root@38.242.207.4 -t "su - claude3 -c tmux"'
  },
  {
    id: 4,
    name: 'Desktop 4',
    user: 'claude4',
    type: 'guacamole',
    vncToken: guacTokens.claude4Vnc,
    sshToken: guacTokens.claude4Ssh,
    sshCmd: 'ssh root@38.242.207.4 -t "su - claude4 -c tmux"'
  },
  {
    id: 5,
    name: 'Desktop 5',
    user: 'claude5',
    type: 'guacamole',
    vncToken: guacTokens.claude5Vnc,
    sshToken: guacTokens.claude5Ssh,
    sshCmd: 'ssh root@38.242.207.4 -t "su - claude5 -c tmux"'
  },
  {
    id: 6,
    name: 'Desktop 6',
    user: 'claude6',
    type: 'guacamole',
    vncToken: guacTokens.claude6Vnc,
    sshToken: guacTokens.claude6Ssh,
    sshCmd: 'ssh root@38.242.207.4 -t "su - claude6 -c tmux"'
  }
]

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
    sshCmd: `ssh root@38.242.207.4 -t "su - ${username} -c tmux"`
  }
}

function App() {
  const [desktops, setDesktops] = useState<Desktop[]>(initialDesktops)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [preloadAll, setPreloadAll] = useState(false)
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel')
  const [provisioning, setProvisioning] = useState(false)
  // Track connection state at app level so it persists across tab switches
  const [connectionStates, setConnectionStates] = useState<Record<string, ConnectionState>>({})

  const currentDesktop = desktops[currentIndex]

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
          .filter((u: any) => u.running && u.username !== 'claude') // Skip 'claude' (duplicate of claude1)
          .map((u: any) => createDesktopFromUser(u.username, u.displayNumber, u.vncPort))
          .sort((a: Desktop, b: Desktop) => a.id - b.id)

        if (apiDesktops.length > 0) {
          setDesktops(apiDesktops)
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

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  const next = useCallback(() => {
    const newIndex = (currentIndex + 1) % desktops.length
    goTo(newIndex)
  }, [currentIndex, desktops.length, goTo])

  const prev = useCallback(() => {
    const newIndex = (currentIndex - 1 + desktops.length) % desktops.length
    goTo(newIndex)
  }, [currentIndex, desktops.length, goTo])

  const copySSH = useCallback(() => {
    navigator.clipboard.writeText(currentDesktop.sshCmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [currentDesktop.sshCmd])

  const selectFromGrid = useCallback((index: number) => {
    setCurrentIndex(index)
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
              {desktops.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => goTo(index)}
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
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
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
                      />
                    }
                    terminalDisplay={
                      <GuacamoleDisplay
                        token={desktop.sshToken!}
                        className="guac-display"
                        connectionId={`ssh-${desktop.id}`}
                        connectionState={connectionStates[`ssh-${desktop.id}`] || 'connecting'}
                        onConnectionStateChange={updateConnectionState}
                      />
                    }
                    sshCmd={desktop.sshCmd}
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

    </div>
  )
}

export default App

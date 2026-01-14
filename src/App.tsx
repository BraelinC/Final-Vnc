import { useState, useCallback, useEffect } from 'react'
import './App.css'
import { SplitDesktop } from './components/SplitDesktop'
import { GuacamoleDisplay } from './components/GuacamoleDisplay'
import { AllScreensView } from './components/AllScreensView'
import { guacTokens } from './lib/guacTokens'

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

const desktops: Desktop[] = [
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

function App() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [preloadAll, setPreloadAll] = useState(false)
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel')
  // Track connection state at app level so it persists across tab switches
  const [connectionStates, setConnectionStates] = useState<Record<string, ConnectionState>>({})

  const currentDesktop = desktops[currentIndex]

  const updateConnectionState = useCallback((id: string, state: ConnectionState) => {
    setConnectionStates(prev => ({ ...prev, [id]: state }))
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
  }, [currentIndex, goTo])

  const prev = useCallback(() => {
    const newIndex = (currentIndex - 1 + desktops.length) % desktops.length
    goTo(newIndex)
  }, [currentIndex, goTo])

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

      {viewMode === 'carousel' ? (
        <>
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
        </>
      ) : (
        <AllScreensView
          desktops={desktops}
          onSelectDesktop={selectFromGrid}
          isLoaded={preloadAll}
        />
      )}

    </div>
  )
}

export default App

import { useState, useCallback } from 'react'
import './App.css'

interface Desktop {
  id: number
  name: string
  user: string
  url: string
  sshCmd: string
}

const desktops: Desktop[] = [
  {
    id: 1,
    name: 'Desktop 1',
    user: 'claude',
    url: 'https://vps2.braelin.uk/vnc.html?password=11142006&autoconnect=true&resize=scale',
    sshCmd: 'ssh root@38.242.207.4 -t "su - claude -c tmux"'
  },
  {
    id: 2,
    name: 'Desktop 2',
    user: 'claude2',
    url: 'https://vps2-2.braelin.uk/vnc.html?password=11142006&autoconnect=true&resize=scale',
    sshCmd: 'ssh root@38.242.207.4 -t "su - claude2 -c tmux"'
  },
  {
    id: 3,
    name: 'Desktop 3',
    user: 'claude3',
    url: 'https://vps2-3.braelin.uk/vnc.html?password=11142006&autoconnect=true&resize=scale',
    sshCmd: 'ssh root@38.242.207.4 -t "su - claude3 -c tmux"'
  },
  {
    id: 4,
    name: 'Desktop 4',
    user: 'claude4',
    url: 'https://vps2-4.braelin.uk/vnc.html?password=11142006&autoconnect=true&resize=scale',
    sshCmd: 'ssh root@38.242.207.4 -t "su - claude4 -c tmux"'
  }
]

function App() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loadedDesktops, setLoadedDesktops] = useState<Set<number>>(new Set([0]))
  const [copied, setCopied] = useState(false)

  const currentDesktop = desktops[currentIndex]

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index)
    setLoadedDesktops(prev => new Set([...prev, index]))
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
        <div className="dots">
          {desktops.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
        <div className="header-info">
          {currentDesktop.name} ({currentDesktop.user})
        </div>
      </header>

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
              {loadedDesktops.has(index) ? (
                <iframe
                  src={desktop.url}
                  title={desktop.name}
                  className="vnc-frame"
                />
              ) : (
                <div className="loading-placeholder">
                  <div className="spinner"></div>
                  <p>Click to load {desktop.name}</p>
                  <button className="load-btn" onClick={() => goTo(index)}>
                    Load Desktop
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="ssh-section">
          <span className="ssh-label">SSH:</span>
          <code className="ssh-cmd" onClick={copySSH}>
            {copied ? 'Copied!' : currentDesktop.sshCmd}
          </code>
        </div>
        <div className="nav-hint">
          Use ← → arrows or swipe to navigate
        </div>
      </footer>
    </div>
  )
}

export default App

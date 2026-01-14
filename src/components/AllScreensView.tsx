import { DesktopTile } from './DesktopTile'
import './AllScreensView.css'

interface Desktop {
  id: number
  name: string
  user: string
  vncToken?: string
  sshToken?: string
}

interface Props {
  desktops: Desktop[]
  onSelectDesktop: (index: number) => void
  onAddDesktop?: () => void
  isLoaded: boolean
}

export function AllScreensView({ desktops, onSelectDesktop, onAddDesktop, isLoaded }: Props) {
  return (
    <div className="all-screens-view">
      <div className="screens-grid">
        {desktops.map((desktop, index) => (
          <DesktopTile
            key={desktop.id}
            desktop={desktop}
            onClick={() => onSelectDesktop(index)}
            isLoaded={isLoaded}
          />
        ))}

        {/* Add Desktop Button */}
        {onAddDesktop && (
          <div className="desktop-tile add-tile" onClick={onAddDesktop}>
            <div className="add-tile-content">
              <span className="plus-icon">+</span>
              <span>Add Desktop</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

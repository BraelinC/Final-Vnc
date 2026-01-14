import { useState, useEffect } from 'react';
import './SplitDesktop.css';

interface Props {
  vncDisplay: React.ReactNode;
  terminalDisplay: React.ReactNode;
  sshCmd?: string;
}

export function SplitDesktop({ vncDisplay, terminalDisplay, sshCmd }: Props) {
  const [viewMode, setViewMode] = useState<'stacked' | 'split'>('split');
  const [isMobile, setIsMobile] = useState(false);
  const [copied, setCopied] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
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

  // Mobile view - just VNC + SSH command
  if (isMobile) {
    return (
      <div className="mobile-container">
        <div className="mobile-vnc">
          {vncDisplay}
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

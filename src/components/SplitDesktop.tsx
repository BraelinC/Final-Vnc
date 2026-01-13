import { useState } from 'react';
import './SplitDesktop.css';

interface Props {
  vncDisplay: React.ReactNode;
  terminalDisplay: React.ReactNode;
}

export function SplitDesktop({ vncDisplay, terminalDisplay }: Props) {
  const [viewMode, setViewMode] = useState<'stacked' | 'split'>('split');

  const toggleView = () => {
    setViewMode(viewMode === 'stacked' ? 'split' : 'stacked');
  };

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

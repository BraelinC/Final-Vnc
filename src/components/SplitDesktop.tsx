import './SplitDesktop.css';

interface Props {
  left: React.ReactNode;
  right: React.ReactNode;
  leftWidth?: string; // e.g., "70%"
  rightWidth?: string; // e.g., "30%"
}

export function SplitDesktop({
  left,
  right,
  leftWidth = '70%',
  rightWidth = '30%'
}: Props) {
  return (
    <div className="split-desktop">
      <div className="split-left" style={{ width: leftWidth }}>
        {left}
      </div>
      <div className="split-right" style={{ width: rightWidth }}>
        {right}
      </div>
    </div>
  );
}

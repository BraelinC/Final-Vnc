import './SplitDesktop.css';

interface Props {
  top: React.ReactNode;
  bottom: React.ReactNode;
  topHeight?: string; // e.g., "70vh", "500px"
  bottomHeight?: string; // e.g., "300px", "30vh"
}

export function SplitDesktop({
  top,
  bottom,
  topHeight = '65vh',
  bottomHeight = '300px'
}: Props) {
  return (
    <div className="split-desktop">
      <div className="split-top" style={{ height: topHeight, minHeight: topHeight }}>
        {top}
      </div>
      <div className="split-bottom" style={{ height: bottomHeight, minHeight: bottomHeight }}>
        {bottom}
      </div>
    </div>
  );
}

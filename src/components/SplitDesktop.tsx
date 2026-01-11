import './SplitDesktop.css';

interface Props {
  top: React.ReactNode;
  bottom: React.ReactNode;
  topHeight?: string; // e.g., "65%", "70%"
  bottomHeight?: string; // e.g., "35%", "30%"
}

export function SplitDesktop({
  top,
  bottom,
  topHeight = '65%',
  bottomHeight = '35%'
}: Props) {
  return (
    <div className="split-desktop">
      <div className="split-top" style={{ height: topHeight }}>
        {top}
      </div>
      <div className="split-bottom" style={{ height: bottomHeight }}>
        {bottom}
      </div>
    </div>
  );
}

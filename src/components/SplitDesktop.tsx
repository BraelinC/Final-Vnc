import './SplitDesktop.css';

interface Props {
  top: React.ReactNode;
  bottom: React.ReactNode;
  splitRatio?: number; // 0-1, default 0.7 (70% top, 30% bottom)
}

export function SplitDesktop({ top, bottom, splitRatio = 0.7 }: Props) {
  const topHeight = `${splitRatio * 100}%`;
  const bottomHeight = `${(1 - splitRatio) * 100}%`;

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

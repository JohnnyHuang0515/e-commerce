import React from 'react';

interface AuroraBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}

const AuroraBackground: React.FC<AuroraBackgroundProps> = ({ children, className }) => {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        background: 'radial-gradient(circle at top left, rgba(99, 102, 241, 0.4), transparent 60%), radial-gradient(circle at bottom right, rgba(167, 139, 250, 0.3), transparent 55%)',
      }}
    >
      {children}
    </div>
  );
};

export default AuroraBackground;

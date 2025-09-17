import React from 'react';

interface AnimatedContentProps {
  children: React.ReactNode;
  className?: string;
}

const AnimatedContent: React.FC<AnimatedContentProps> = ({ children, className }) => {
  return <div className={className}>{children}</div>;
};

export default AnimatedContent;

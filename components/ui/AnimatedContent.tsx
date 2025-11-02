// components/ui/AnimatedContent.tsx
import React from 'react';

interface AnimatedContentProps {
  children: React.ReactNode;
}

const AnimatedContent: React.FC<AnimatedContentProps> = ({ children }) => {
  return (
    <div className="animate-fade-in">
      {children}
    </div>
  );
};

export default AnimatedContent;

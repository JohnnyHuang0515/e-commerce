import React, { useRef, useEffect, ReactNode } from 'react';

interface SimpleAnimatedContentProps {
  children: ReactNode;
  distance?: number;
  direction?: 'vertical' | 'horizontal';
  reverse?: boolean;
  duration?: number;
  delay?: number;
  className?: string;
}

const SimpleAnimatedContent: React.FC<SimpleAnimatedContentProps> = ({
  children,
  distance = 30,
  direction = 'vertical',
  reverse = false,
  duration = 400,
  delay = 0,
  className = ''
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.unobserve(element);
          
          setTimeout(() => {
            const axis = direction === 'horizontal' ? 'translateX' : 'translateY';
            const offset = reverse ? distance : -distance;
            
            element.style.transform = `${axis}(${offset}px)`;
            element.style.opacity = '0';
            element.style.transition = `all ${duration}ms ease-out`;
            
            // 觸發動畫
            requestAnimationFrame(() => {
              element.style.transform = `${axis}(0px)`;
              element.style.opacity = '1';
            });
          }, delay);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [distance, direction, reverse, duration, delay]);

  return (
    <div 
      ref={ref} 
      className={className}
      style={{
        transform: direction === 'horizontal' 
          ? `translateX(${reverse ? distance : -distance}px)` 
          : `translateY(${reverse ? distance : -distance}px)`,
        opacity: 0
      }}
    >
      {children}
    </div>
  );
};

export default SimpleAnimatedContent;

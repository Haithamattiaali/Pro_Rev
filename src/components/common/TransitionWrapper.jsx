import React, { useState, useRef, useEffect } from 'react';

const TransitionWrapper = ({ 
  show, 
  children, 
  duration = 300,
  easing = 'ease-out',
  className = '' 
}) => {
  const [height, setHeight] = useState(0);
  const [shouldRender, setShouldRender] = useState(show);
  const contentRef = useRef(null);
  
  useEffect(() => {
    if (show) {
      setShouldRender(true);
    }
  }, [show]);
  
  useEffect(() => {
    if (!contentRef.current) return;
    
    if (show) {
      // Force a reflow to ensure the element is rendered before measuring
      const contentHeight = contentRef.current.scrollHeight;
      setHeight(contentHeight);
    } else {
      setHeight(0);
      // Delay unmounting until transition completes
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);
  
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const transitionDuration = prefersReducedMotion ? 0 : duration;
  
  if (!shouldRender) return null;
  
  return (
    <div 
      className={`overflow-hidden transition-all ${className}`}
      style={{ 
        height: show ? height : 0,
        opacity: show ? 1 : 0,
        transitionDuration: `${transitionDuration}ms`,
        transitionTimingFunction: easing
      }}
    >
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  );
};

export default TransitionWrapper;
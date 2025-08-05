import React, { useState, useRef, useEffect } from 'react';

const TransitionWrapper = ({ 
  show, 
  children, 
  duration = 300,
  easing = 'ease-out',
  className = '' 
}) => {
  const [height, setHeight] = useState(show ? 'auto' : 0);
  const [shouldRender, setShouldRender] = useState(show);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const contentRef = useRef(null);
  const frameRef = useRef(null);
  
  useEffect(() => {
    if (show) {
      setShouldRender(true);
    }
  }, [show]);
  
  useEffect(() => {
    if (!contentRef.current) return;
    
    // Cancel any pending animation frame
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
    
    if (show) {
      // Use requestAnimationFrame for smoother transitions
      frameRef.current = requestAnimationFrame(() => {
        if (contentRef.current) {
          const contentHeight = contentRef.current.scrollHeight;
          setHeight(contentHeight);
          setIsTransitioning(true);
        }
      });
    } else {
      setHeight(0);
      setIsTransitioning(true);
      // Delay unmounting until transition completes
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsTransitioning(false);
      }, duration);
      return () => clearTimeout(timer);
    }
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [show, duration]);
  
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const transitionDuration = prefersReducedMotion ? 0 : duration;
  
  if (!shouldRender) return null;
  
  return (
    <div 
      className={`overflow-hidden ${isTransitioning ? 'transition-all' : ''} ${className}`}
      style={{ 
        height: show ? height : 0,
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(-4px)',
        transitionDuration: `${transitionDuration}ms`,
        transitionTimingFunction: easing,
        willChange: isTransitioning ? 'height, opacity, transform' : 'auto'
      }}
    >
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  );
};

export default TransitionWrapper;
import React, { useState, useEffect, useRef } from 'react';
import ModularPeriodFilter from './ModularPeriodFilter';

const StickyPeriodFilter = ({ useModular = true, disableValidation = false }) => {
  const [isSticky, setIsSticky] = useState(false);
  const placeholderRef = useRef(null);

  useEffect(() => {
    const mainElement = document.querySelector('main');
    if (!mainElement) return;

    const handleScroll = () => {
      if (placeholderRef.current) {
        const rect = placeholderRef.current.getBoundingClientRect();
        const mainRect = mainElement.getBoundingClientRect();
        setIsSticky(rect.top <= mainRect.top);
      }
    };

    mainElement.addEventListener('scroll', handleScroll);
    return () => mainElement.removeEventListener('scroll', handleScroll);
  }, []);

  // For now, always use the new ModularPeriodFilter
  const FilterComponent = ModularPeriodFilter;

  return (
    <>
      {/* Placeholder to maintain space */}
      <div ref={placeholderRef}>
        {/* Sticky version */}
        <div className={`${isSticky ? 'fixed top-[64px] left-64 right-0 z-40 bg-neutral-light px-6 pt-6 shadow-md' : ''}`}>
          <FilterComponent disableValidation={disableValidation} />
        </div>
        
        {/* Spacer when sticky */}
        {isSticky && <div style={{ height: '80px' }} />}
      </div>
    </>
  );
};

export default StickyPeriodFilter;
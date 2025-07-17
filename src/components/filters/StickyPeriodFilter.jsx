import React, { useState, useEffect, useRef } from 'react';
import ModularPeriodFilter from './ModularPeriodFilter';
import FilterBar from './FilterBar';

const StickyPeriodFilter = ({ useModular = true, useNewFilterBar = true, disableValidation = false }) => {
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

  // Use new FilterBar by default
  const FilterComponent = useNewFilterBar ? FilterBar : ModularPeriodFilter;

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
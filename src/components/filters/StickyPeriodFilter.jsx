import React, { useState, useEffect, useRef } from 'react';
import ModularPeriodFilter from './ModularPeriodFilter';
import FilterBar from './FilterBar';
import FilterSystemWrapper from './FilterSystemWrapper';

const StickyPeriodFilter = ({ useModular = true, useNewFilterBar = true, useHierarchical = false, disableValidation = false }) => {
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

  // Choose filter component based on props
  const getFilterComponent = () => {
    if (useHierarchical) {
      return <FilterSystemWrapper useNewSystem={true} disableValidation={disableValidation} />;
    }
    return useNewFilterBar ? <FilterBar disableValidation={disableValidation} /> : <ModularPeriodFilter disableValidation={disableValidation} />;
  };

  return (
    <>
      {/* Placeholder to maintain space */}
      <div ref={placeholderRef}>
        {/* Sticky version */}
        <div className={`relative ${isSticky ? 'fixed top-[64px] left-0 lg:left-64 right-0 z-20 bg-neutral-light px-3 md:px-6 pt-3 md:pt-6 shadow-md' : ''}`}>
          {getFilterComponent()}
        </div>
        
        {/* Spacer when sticky */}
        {isSticky && <div style={{ height: '80px' }} />}
      </div>
    </>
  );
};

export default React.memo(StickyPeriodFilter);
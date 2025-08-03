import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown } from 'lucide-react';
import { useFilter } from '../../contexts/FilterContext';
import YearSelector from './YearSelector';
import MonthSelector from './MonthSelector';
import QuarterSelector from './QuarterSelector';
import ActiveFiltersDisplay from './ActiveFiltersDisplay';
import companyLogo from '../../assets/logo.png';
import { debounce } from 'lodash';

const FilterBar = () => {
  const { handlePeriodChange, periodFilter } = useFilter();
  const dropdownRef = useRef(null);
  
  // Initialize selections from FilterContext to maintain persistence
  const [selections, setSelections] = useState({
    years: periodFilter.selectedYears || [],
    months: periodFilter.selectedMonths || [],
    quarters: periodFilter.selectedQuarters || []
  });
  
  // Track active panel based on current selections
  const getDefaultPanel = () => {
    if (selections.months.length > 0) return 'months';
    if (selections.quarters.length > 0) return 'quarters';
    return selections.years.length > 0 ? 'months' : 'years';
  };
  
  const [activePanel, setActivePanel] = useState(getDefaultPanel());
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  
  // Sync with FilterContext changes
  useEffect(() => {
    setSelections({
      years: periodFilter.selectedYears || [],
      months: periodFilter.selectedMonths || [],
      quarters: periodFilter.selectedQuarters || []
    });
  }, [periodFilter.selectedYears, periodFilter.selectedMonths, periodFilter.selectedQuarters]);
  
  // Update dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      requestAnimationFrame(() => {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left
        });
      });
    }
  }, [isOpen]);
  
  // Close dropdown when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          !event.target.closest('[data-dropdown-portal]')) {
        setIsOpen(false);
      }
    };
    
    const handleScroll = () => {
      setIsOpen(false);
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('scroll', handleScroll, true);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isOpen]);
  
  // Compute the period type based on selections
  const getPeriodType = useCallback((sel) => {
    if (sel.years.length === 0) return 'NONE';
    if (sel.months.length > 0) return 'MTD';
    if (sel.quarters.length > 0) return 'QTD';
    return 'YTD';
  }, []);
  
  // Create debounced filter application
  const applyFilters = useMemo(
    () => debounce((newSelections) => {
      const periodType = getPeriodType(newSelections);
      
      console.log('🎯 FilterBar: Applying filters', {
        selections: newSelections,
        periodType,
        year: newSelections.years[0] || null,
        month: newSelections.months[0] || null,
        quarter: newSelections.quarters[0] || null
      });
      
      // Apply to filter context
      handlePeriodChange({
        selectedYears: newSelections.years,
        selectedMonths: newSelections.months,
        selectedQuarters: newSelections.quarters,
        period: periodType,
        year: newSelections.years[0] || null,
        month: newSelections.months[0] || null,
        quarter: newSelections.quarters[0] || null
      });
    }, 300),
    [getPeriodType, handlePeriodChange]
  );
  
  // Handle selection changes
  const handleSelectionChange = useCallback((type, newValues) => {
    console.log('✅ FilterBar: Selection changed', { type, newValues });
    
    setSelections(prev => {
      const updated = { ...prev, [type]: newValues };
      
      // Clear months/quarters when no year selected
      if (type === 'years' && newValues.length === 0) {
        updated.months = [];
        updated.quarters = [];
      }
      
      // Clear quarters when months selected
      if (type === 'months' && newValues.length > 0) {
        updated.quarters = [];
      }
      
      // Clear months when quarters selected
      if (type === 'quarters' && newValues.length > 0) {
        updated.months = [];
      }
      
      // Apply filters with debounce
      applyFilters(updated);
      
      return updated;
    });
  }, [applyFilters]);
  
  // Panel configuration
  const panels = {
    years: {
      label: 'Years',
      icon: Calendar,
      component: YearSelector
    },
    months: {
      label: 'Months',
      icon: Calendar,
      component: MonthSelector
    },
    quarters: {
      label: 'Quarters',
      icon: Calendar,
      component: QuarterSelector
    }
  };
  
  const ActivePanelComponent = panels[activePanel].component;
  
  return (
    <div ref={dropdownRef} className="relative bg-white/95 backdrop-blur-xl p-1.5 rounded-xl shadow-sm border border-neutral-light/50" style={{ contain: 'layout' }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {/* Panel Selector */}
          <div className="inline-flex bg-neutral-light/50 rounded-md p-0.5">
            {Object.entries(panels).map(([key, panel]) => (
              <motion.button
                key={key}
                onClick={() => setActivePanel(key)}
                className={`
                  relative px-2 py-0.5 rounded text-[10px] font-medium transition-all
                  ${activePanel === key
                    ? 'text-white'
                    : 'text-neutral-dark hover:text-primary'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {activePanel === key && (
                  <motion.div
                    layoutId="activePanel"
                    className="absolute inset-0 bg-primary rounded-md shadow-sm"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30
                    }}
                  />
                )}
                <span className="relative z-10">{panel.label}</span>
              </motion.button>
            ))}
          </div>
          
          {/* Selection Display */}
          <button
            ref={buttonRef}
            onClick={() => setIsOpen(!isOpen)}
            className={`
              flex items-center gap-1 px-1.5 py-0.5 rounded-md
              bg-white border transition-all min-w-[120px] max-w-[160px]
              ${isOpen 
                ? 'border-primary shadow-sm' 
                : 'border-neutral-light hover:border-neutral-mid hover:shadow-sm'
              }
            `}
          >
            <div className="flex-1 text-left truncate will-change-auto">
              <ActiveFiltersDisplay 
                selections={selections}
                compact={true}
              />
            </div>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.15 }}
            >
              <ChevronDown className="w-3 h-3 text-neutral-mid flex-shrink-0" />
            </motion.div>
          </button>
        </div>
        
        {/* Logo */}
        <img 
          src={companyLogo} 
          alt="Company Logo" 
          className="h-6 w-auto object-contain"
        />
      </div>
      
      {/* Expanded Panel - Rendered via Portal */}
      {isOpen && ReactDOM.createPortal(
        <AnimatePresence>
          <motion.div
            data-dropdown-portal
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="fixed p-1 bg-white backdrop-blur-xl rounded-lg shadow-xl border border-neutral-light overflow-hidden"
            style={{ 
              width: '280px', 
              zIndex: 99999,
              transform: `translate(${dropdownPosition.left}px, ${dropdownPosition.top}px)`,
              top: 0,
              left: 0,
              contain: 'layout style'
            }}
          >
            <div className="max-h-[180px] overflow-y-auto">
              <ActivePanelComponent
                selections={selections[activePanel]}
                onChange={(values) => handleSelectionChange(activePanel, values)}
                disabled={activePanel !== 'years' && selections.years.length === 0}
              />
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default React.memo(FilterBar);
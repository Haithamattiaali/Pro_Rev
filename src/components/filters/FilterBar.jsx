import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronDown } from 'lucide-react';
import { useFilter } from '../../contexts/FilterContext';
import YearSelector from './YearSelector';
import MonthSelector from './MonthSelector';
import QuarterSelector from './QuarterSelector';
import ActiveFiltersDisplay from './ActiveFiltersDisplay';
import companyLogo from '../../assets/logo.png';
import { debounce } from 'lodash';

const FilterBar = () => {
  const { handlePeriodChange } = useFilter();
  const currentYear = new Date().getFullYear();
  
  // Single source of truth for selections
  const [selections, setSelections] = useState({
    years: [currentYear],
    months: [],
    quarters: []
  });
  
  // Track active panel
  const [activePanel, setActivePanel] = useState('years');
  const [isOpen, setIsOpen] = useState(false);
  
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
    <div className="bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-lg border border-white/20">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Panel Selector */}
          <div className="inline-flex bg-neutral-light rounded-xl p-1 shadow-inner">
            {Object.entries(panels).map(([key, panel]) => (
              <motion.button
                key={key}
                onClick={() => setActivePanel(key)}
                className={`
                  relative px-6 py-2 rounded-lg text-sm font-medium transition-all
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
                    className="absolute inset-0 bg-primary rounded-lg shadow-md"
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
            onClick={() => setIsOpen(!isOpen)}
            className={`
              flex items-center gap-3 px-4 py-2.5 rounded-xl
              bg-white border transition-all min-w-[200px]
              ${isOpen 
                ? 'border-primary shadow-lg scale-[1.02]' 
                : 'border-neutral-light hover:border-neutral-mid hover:shadow-md'
              }
            `}
          >
            <div className="flex-1 text-left">
              <ActiveFiltersDisplay 
                selections={selections}
                compact={true}
              />
            </div>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-neutral-mid" />
            </motion.div>
          </button>
        </div>
        
        {/* Logo */}
        <img 
          src={companyLogo} 
          alt="Company Logo" 
          className="h-10 w-auto object-contain"
        />
      </div>
      
      {/* Expanded Panel */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 p-4 bg-neutral-light/50 rounded-xl"
        >
          <ActivePanelComponent
            selections={selections[activePanel]}
            onChange={(values) => handleSelectionChange(activePanel, values)}
            disabled={activePanel !== 'years' && selections.years.length === 0}
          />
        </motion.div>
      )}
      
      {/* Full Active Filters Display */}
      <div className="mt-4">
        <ActiveFiltersDisplay 
          selections={selections}
          compact={false}
        />
      </div>
    </div>
  );
};

export default FilterBar;
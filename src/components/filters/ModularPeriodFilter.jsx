import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Popover from '@radix-ui/react-popover';
import { Calendar, ChevronDown, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useFilter } from '../../contexts/FilterContext';
import MultiSelectPanel from './MultiSelectPanel';
import PeriodChips from './PeriodChips';
import companyLogo from '../../assets/logo.png';
import apiService from '../../services/api.service';

const ModularPeriodFilter = ({ disableValidation = false }) => {
  const { 
    periodFilter, 
    pendingFilter, 
    hasChanges,
    handlePendingChange, 
    applyFilters, 
    resetFilters 
  } = useFilter();
  
  const [activeMode, setActiveMode] = useState(pendingFilter.activeMode || 'M');
  const [isOpen, setIsOpen] = useState(false);
  const [viewDensity, setViewDensity] = useState('comfortable');
  const [showAppliedFeedback, setShowAppliedFeedback] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [validationData, setValidationData] = useState(null);
  const [loadingValidation, setLoadingValidation] = useState(false);

  // Get current selections from pending filter (what user is selecting)
  const {
    selectedMonths = [],
    selectedQuarters = [],
    selectedYears = [],
  } = pendingFilter;

  // Get applied selections for display when popover is closed
  const appliedSelections = {
    months: periodFilter.selectedMonths || [],
    quarters: periodFilter.selectedQuarters || [],
    years: periodFilter.selectedYears || []
  };

  // Mode configurations
  const modeConfig = {
    M: {
      label: 'Months',
      icon: Calendar,
      items: [
        { value: 1, label: 'January', shortLabel: 'Jan' },
        { value: 2, label: 'February', shortLabel: 'Feb' },
        { value: 3, label: 'March', shortLabel: 'Mar' },
        { value: 4, label: 'April', shortLabel: 'Apr' },
        { value: 5, label: 'May', shortLabel: 'May' },
        { value: 6, label: 'June', shortLabel: 'Jun' },
        { value: 7, label: 'July', shortLabel: 'Jul' },
        { value: 8, label: 'August', shortLabel: 'Aug' },
        { value: 9, label: 'September', shortLabel: 'Sep' },
        { value: 10, label: 'October', shortLabel: 'Oct' },
        { value: 11, label: 'November', shortLabel: 'Nov' },
        { value: 12, label: 'December', shortLabel: 'Dec' },
      ],
      selected: selectedMonths,
      key: 'selectedMonths'
    },
    Q: {
      label: 'Quarters',
      icon: Calendar,
      items: [
        { value: 1, label: 'Q1 (Jan-Mar)', shortLabel: 'Q1' },
        { value: 2, label: 'Q2 (Apr-Jun)', shortLabel: 'Q2' },
        { value: 3, label: 'Q3 (Jul-Sep)', shortLabel: 'Q3' },
        { value: 4, label: 'Q4 (Oct-Dec)', shortLabel: 'Q4' },
      ],
      selected: selectedQuarters,
      key: 'selectedQuarters'
    },
    Y: {
      label: 'Years',
      icon: Calendar,
      items: [
        { value: 2023, label: '2023', shortLabel: '2023' },
        { value: 2024, label: '2024', shortLabel: '2024' },
        { value: 2025, label: '2025', shortLabel: '2025' },
      ],
      selected: selectedYears,
      key: 'selectedYears'
    }
  };

  const currentConfig = modeConfig[activeMode];

  // Fetch validation data when year changes (only if validation is enabled)
  useEffect(() => {
    if (disableValidation) {
      setValidationData(null);
      return;
    }

    const fetchValidation = async () => {
      const selectedYear = selectedYears[0];
      if (!selectedYear) {
        setValidationData(null);
        return;
      }

      setLoadingValidation(true);
      try {
        const data = await apiService.getAnalysisValidation(selectedYear);
        setValidationData(data);
      } catch (error) {
        console.error('Failed to fetch validation data:', error);
        setValidationData(null);
      } finally {
        setLoadingValidation(false);
      }
    };

    fetchValidation();
  }, [selectedYears, disableValidation]);

  const handleSelectionChange = (newSelection) => {
    // Clear any existing error
    setValidationError('');
    
    // Check if trying to select months without a year
    if (activeMode === 'M' && newSelection.length > 0 && selectedYears.length === 0) {
      setValidationError('Please select a year before selecting months.');
      return;
    }
    
    // Check if trying to select quarters without a year
    if (activeMode === 'Q' && newSelection.length > 0 && selectedYears.length === 0) {
      setValidationError('Please select a year before selecting quarters.');
      return;
    }
    
    // Check if trying to select months when quarters are selected
    if (activeMode === 'M' && newSelection.length > 0 && selectedQuarters.length > 0) {
      setValidationError('Cannot select months when quarters are already selected. Please clear quarter selections first.');
      return;
    }
    
    // Check if trying to select non-compliant months (only if validation is enabled)
    if (!disableValidation && activeMode === 'M' && validationData && newSelection.length > 0) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const nonCompliantSelections = newSelection.filter(monthNum => {
        const monthName = monthNames[monthNum - 1];
        return validationData.nonCompliantMonths.includes(monthName);
      });
      
      if (nonCompliantSelections.length > 0) {
        const monthLabels = nonCompliantSelections.map(m => monthNames[m - 1]).join(', ');
        const missingData = nonCompliantSelections.map(m => {
          const monthName = monthNames[m - 1];
          return validationData.missingDataDetails[monthName]?.join(', ') || 'data';
        }).join('; ');
        setValidationError(`Cannot select ${monthLabels}. Missing: ${missingData}`);
        return;
      }
    }
    
    // Check if trying to select quarters when months are selected
    if (activeMode === 'Q' && newSelection.length > 0 && selectedMonths.length > 0) {
      setValidationError('Cannot select quarters when months are already selected. Please clear month selections first.');
      return;
    }
    
    // Check if trying to deselect all years when months/quarters are selected
    if (activeMode === 'Y' && newSelection.length === 0 && 
        (selectedMonths.length > 0 || selectedQuarters.length > 0)) {
      setValidationError('Cannot deselect all years when months or quarters are selected. Please clear month/quarter selections first.');
      return;
    }
    
    handlePendingChange({
      [currentConfig.key]: newSelection
    });
  };

  const handleModeChange = (mode) => {
    setActiveMode(mode);
    setValidationError(''); // Clear error when switching modes
    handlePendingChange({ activeMode: mode });
  };

  const handleChipRemove = (value, mode) => {
    const config = modeConfig[mode];
    const currentSelection = pendingFilter[config.key] || [];
    const newSelection = currentSelection.filter(v => v !== value);
    
    handlePendingChange({
      [config.key]: newSelection
    });
  };

  const handleApply = () => {
    applyFilters();
    setIsOpen(false);
    
    // Show success feedback
    setShowAppliedFeedback(true);
    setTimeout(() => {
      setShowAppliedFeedback(false);
    }, 2000);
  };

  const handleReset = () => {
    // Clear validation error
    setValidationError('');
    
    // Clear only the current mode's selections
    if (activeMode === 'M') {
      handlePendingChange({ selectedMonths: [] });
    } else if (activeMode === 'Q') {
      handlePendingChange({ selectedQuarters: [] });
    } else if (activeMode === 'Y') {
      handlePendingChange({ selectedYears: [] });
    }
  };

  const handleGlobalSelectAll = () => {
    // Clear validation error
    setValidationError('');
    
    // Select all items across all modes
    handlePendingChange({
      selectedMonths: modeConfig.M.items.map(item => item.value),
      selectedQuarters: modeConfig.Q.items.map(item => item.value),
      selectedYears: modeConfig.Y.items.map(item => item.value)
    });
  };

  const handleGlobalClear = () => {
    // Clear validation error
    setValidationError('');
    
    // Clear all selections across all modes
    handlePendingChange({
      selectedMonths: [],
      selectedQuarters: [],
      selectedYears: []
    });
  };

  // Get display text for current selections
  const getSelectionSummary = () => {
    const summaries = [];
    
    if (selectedMonths.length > 0) {
      const monthLabels = selectedMonths
        .map(m => modeConfig.M.items.find(item => item.value === m)?.shortLabel)
        .filter(Boolean);
      summaries.push(`${monthLabels.length} month${monthLabels.length > 1 ? 's' : ''}`);
    }
    
    if (selectedQuarters.length > 0) {
      summaries.push(`${selectedQuarters.length} quarter${selectedQuarters.length > 1 ? 's' : ''}`);
    }
    
    if (selectedYears.length > 0) {
      summaries.push(selectedYears.join(', '));
    }
    
    return summaries.length > 0 ? summaries.join(', ') : 'Select period';
  };

  return (
    <div className="bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-lg border border-white/20">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Mode Selector - Apple-style Segmented Control */}
          <div className="inline-flex bg-neutral-light rounded-xl p-1 shadow-inner">
            {Object.entries(modeConfig).map(([mode]) => (
              <motion.button
                key={mode}
                onClick={() => handleModeChange(mode)}
                className={`
                  relative px-6 py-2 rounded-lg text-sm font-medium transition-all
                  ${activeMode === mode
                    ? 'text-white'
                    : 'text-neutral-dark hover:text-primary'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {activeMode === mode && (
                  <motion.div
                    layoutId="activeMode"
                    className="absolute inset-0 bg-primary rounded-lg shadow-md"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30
                    }}
                  />
                )}
                <span className="relative z-10">{mode}</span>
              </motion.button>
            ))}
          </div>

          {/* Selection Display with Popover */}
          <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
            <Popover.Trigger asChild>
              <button
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
                  <PeriodChips
                    selections={appliedSelections}
                    modeConfig={modeConfig}
                    onRemove={null}
                    maxDisplay={3}
                    interactive={false}
                  />
                  {hasChanges && (
                    <span className="ml-2 text-xs text-orange-600 font-medium">
                      • Unsaved changes
                    </span>
                  )}
                </div>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-neutral-mid" />
                </motion.div>
              </button>
            </Popover.Trigger>

            <AnimatePresence>
              {isOpen && (
                <Popover.Portal forceMount>
                  <Popover.Content
                    className="z-50"
                    sideOffset={8}
                    align="start"
                    asChild
                  >
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="w-[400px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden"
                    >
                      {/* Error Message */}
                      {validationError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-red-50 border-b border-red-200 px-4 py-3"
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex-shrink-0 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center mt-0.5">
                              <span className="text-white text-xs font-bold">!</span>
                            </div>
                            <p className="text-sm text-red-700">{validationError}</p>
                          </div>
                        </motion.div>
                      )}
                      
                      <MultiSelectPanel
                        title={currentConfig.label}
                        items={currentConfig.items}
                        selected={currentConfig.selected}
                        onChange={handleSelectionChange}
                        viewDensity={viewDensity}
                        onViewDensityChange={setViewDensity}
                        onApply={handleApply}
                        onReset={handleReset}
                        hasChanges={hasChanges}
                        onSelectAll={handleGlobalSelectAll}
                        onClearAll={handleGlobalClear}
                        nonCompliantItems={!disableValidation && activeMode === 'M' && validationData ? validationData.nonCompliantMonths : []}
                        missingDataDetails={!disableValidation && activeMode === 'M' && validationData ? validationData.missingDataDetails : {}}
                      />
                    </motion.div>
                  </Popover.Content>
                </Popover.Portal>
              )}
            </AnimatePresence>
          </Popover.Root>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-4">
          {/* Success Feedback */}
          <AnimatePresence>
            {showAppliedFeedback && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 20 }}
                className="flex items-center gap-2 text-sm text-green-600"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Filters applied</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Company Logo */}
          <img 
            src={companyLogo} 
            alt="Company Logo" 
            className="h-10 w-auto object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default ModularPeriodFilter;
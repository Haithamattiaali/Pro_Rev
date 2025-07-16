import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as Checkbox from '@radix-ui/react-checkbox';
import { Check, Search, Grid3x3, List, Layers, AlertCircle } from 'lucide-react';

const MultiSelectPanel = ({
  title,
  items,
  selected = [],
  onChange,
  viewDensity = 'comfortable',
  onViewDensityChange,
  allowSearch = true,
  onApply,
  onReset,
  hasChanges = false,
  onSelectAll,
  onClearAll,
  nonCompliantItems = [],
  missingDataDetails = {},
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredItem, setHoveredItem] = useState(null);

  // Filter items based on search
  const filteredItems = items.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.shortLabel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAll = () => {
    if (onSelectAll) {
      onSelectAll(); // Use global handler if provided
    } else {
      onChange(items.map(item => item.value)); // Fallback to local behavior
    }
  };

  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll(); // Use global handler if provided
    } else {
      onChange([]); // Fallback to local behavior
    }
  };

  const handleItemToggle = (value, item) => {
    // Check if item is non-compliant
    if (nonCompliantItems.includes(item.shortLabel) || nonCompliantItems.includes(item.label)) {
      return; // Don't allow selection of non-compliant items
    }
    
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleRangeSelect = (startIndex, endIndex) => {
    const rangeValues = items
      .slice(Math.min(startIndex, endIndex), Math.max(startIndex, endIndex) + 1)
      .map(item => item.value);
    
    const newSelection = [...new Set([...selected, ...rangeValues])];
    onChange(newSelection);
  };

  // Density styles
  const densityStyles = {
    compact: 'py-1.5 px-3 text-xs',
    comfortable: 'py-2.5 px-4 text-sm',
    spacious: 'py-3.5 px-5 text-base'
  };

  const gridCols = {
    compact: 'grid-cols-4',
    comfortable: 'grid-cols-3',
    spacious: 'grid-cols-2'
  };

  return (
    <div className="p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-neutral-dark">{title}</h3>
        <div className="flex items-center gap-1">
          {/* View Density Toggle */}
          <div className="flex items-center bg-neutral-light rounded-lg p-0.5">
            <button
              onClick={() => onViewDensityChange('compact')}
              className={`p-1 rounded ${viewDensity === 'compact' ? 'bg-white shadow-sm' : ''}`}
              title="Compact view"
            >
              <Grid3x3 className="w-3 h-3" />
            </button>
            <button
              onClick={() => onViewDensityChange('comfortable')}
              className={`p-1 rounded ${viewDensity === 'comfortable' ? 'bg-white shadow-sm' : ''}`}
              title="Comfortable view"
            >
              <List className="w-3 h-3" />
            </button>
            <button
              onClick={() => onViewDensityChange('spacious')}
              className={`p-1 rounded ${viewDensity === 'spacious' ? 'bg-white shadow-sm' : ''}`}
              title="Spacious view"
            >
              <Layers className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      {allowSearch && items.length > 6 && (
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-neutral-mid" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}...`}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-neutral-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-neutral-mid">
          {selected.length} of {items.length} selected
        </div>
        <div className="flex gap-1">
          <button
            onClick={handleSelectAll}
            className="text-[10px] px-1.5 py-0.5 rounded font-semibold text-primary hover:bg-primary/10 transition-all duration-150 hover:scale-102 active:scale-98"
          >
            Select All
          </button>
          <button
            onClick={handleClearAll}
            className="text-[10px] px-1.5 py-0.5 rounded font-semibold text-neutral-mid hover:bg-neutral-light transition-all duration-150 hover:scale-102 active:scale-98"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Selection Grid */}
      <div className={`grid ${gridCols[viewDensity]} gap-1.5 max-h-[400px] overflow-y-auto`}>
        {filteredItems.map((item, index) => {
          const isSelected = selected.includes(item.value);
          const isHovered = hoveredItem === item.value;
          const isNonCompliant = nonCompliantItems.includes(item.shortLabel) || nonCompliantItems.includes(item.label);
          const missingData = missingDataDetails[item.shortLabel] || missingDataDetails[item.label];

          return (
            <motion.div
              key={item.value}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              onMouseEnter={() => setHoveredItem(item.value)}
              onMouseLeave={() => setHoveredItem(null)}
              whileHover={{ scale: isNonCompliant ? 1 : 1.02 }}
              whileTap={{ scale: isNonCompliant ? 1 : 0.98 }}
            >
              <label
                className={`
                  relative flex items-center gap-3 rounded-xl
                  transition-all duration-200 ${densityStyles[viewDensity]}
                  ${isNonCompliant
                    ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
                    : isSelected
                    ? 'bg-primary/10 border-primary text-primary shadow-sm cursor-pointer'
                    : 'bg-white border-neutral-light hover:border-neutral-mid hover:shadow-sm cursor-pointer'
                  }
                  border
                `}
                title={isNonCompliant ? `Missing: ${missingData?.join(', ') || 'data'}` : ''}
              >
                {/* Custom Checkbox */}
                <Checkbox.Root
                  checked={isSelected}
                  onCheckedChange={() => handleItemToggle(item.value, item)}
                  disabled={isNonCompliant}
                  className={`
                    relative w-4 h-4 rounded-md border-2 transition-all
                    ${isSelected
                      ? 'bg-primary border-primary'
                      : 'bg-white border-neutral-mid'
                    }
                  `}
                >
                  <Checkbox.Indicator>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="flex items-center justify-center w-full h-full"
                    >
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </motion.div>
                  </Checkbox.Indicator>
                </Checkbox.Root>

                {/* Label */}
                <span className={`flex-1 select-none flex items-center gap-2 ${isNonCompliant ? 'line-through text-gray-500' : ''}`}>
                  {viewDensity === 'compact' ? item.shortLabel : item.label}
                  {isNonCompliant && (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  )}
                </span>

                {/* Hover Effect */}
                {isHovered && !isSelected && (
                  <motion.div
                    className="absolute inset-0 bg-primary/5 rounded-xl pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </label>
            </motion.div>
          );
        })}
      </div>

      {/* Footer with Apply/Reset buttons */}
      <div className="mt-3 pt-3 border-t border-neutral-light">
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-neutral-mid">
            Hold Shift to select range
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onReset}
              disabled={!hasChanges}
              className={`
                px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all duration-150
                hover:scale-102 active:scale-98
                ${hasChanges
                  ? 'text-neutral-dark hover:bg-orange-50 hover:text-orange-600'
                  : 'text-neutral-mid cursor-not-allowed opacity-30'
                }
              `}
            >
              Reset
            </button>
            <button
              onClick={onApply}
              disabled={!hasChanges}
              className={`
                px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all duration-150
                hover:scale-102 active:scale-98
                ${hasChanges
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md animate-pulse'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                }
              `}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiSelectPanel;
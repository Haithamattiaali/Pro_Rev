import React from 'react';
import StickyPeriodFilter from '../components/filters/StickyPeriodFilter';
import { useHierarchicalFilter } from '../contexts/HierarchicalFilterContext';
import { useFilter } from '../contexts/FilterContext';

const HierarchicalFilterDemo = () => {
  const hierarchicalFilter = useHierarchicalFilter();
  const legacyFilter = useFilter();

  return (
    <div className="space-y-6">
      {/* Hierarchical Filter */}
      <StickyPeriodFilter useHierarchical={true} />
      
      {/* Debug Information */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-light p-6">
          <h2 className="text-lg font-semibold text-primary mb-4">Hierarchical Filter State</h2>
          <pre className="text-xs bg-neutral-light p-4 rounded-lg overflow-auto">
            {JSON.stringify({
              filterState: hierarchicalFilter.filterState,
              derivedValues: {
                displayLabel: hierarchicalFilter.displayLabel,
                dateRange: hierarchicalFilter.dateRange,
                isPartialPeriod: hierarchicalFilter.isPartialPeriod,
                periodType: hierarchicalFilter.periodType
              },
              apiParams: hierarchicalFilter.getApiParameters()
            }, null, 2)}
          </pre>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-neutral-light p-6">
          <h2 className="text-lg font-semibold text-primary mb-4">Legacy Filter State (Auto-Synced)</h2>
          <pre className="text-xs bg-neutral-light p-4 rounded-lg overflow-auto">
            {JSON.stringify({
              periodFilter: legacyFilter.periodFilter,
              pendingFilter: legacyFilter.pendingFilter
            }, null, 2)}
          </pre>
        </div>
      </div>
      
      {/* Feature Showcase */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-light p-6">
        <h2 className="text-lg font-semibold text-primary mb-4">New Filter Features</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <div>
              <strong>Hierarchical Navigation:</strong> Year → Quarter → Month logical flow
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <div>
              <strong>View Mode Toggle:</strong> Switch between Yearly, Quarterly, and Monthly views
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <div>
              <strong>Smart Defaults:</strong> Automatically selects current period when switching years
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <div>
              <strong>Quick Presets:</strong> YTD, QTD, Last 4 Quarters, Last 12 Months
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <div>
              <strong>Clear Labels:</strong> Shows "Q3 2024 (Jul-Sep)" instead of just "Q3"
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <div>
              <strong>Partial Period Indicator:</strong> Shows when viewing incomplete current periods
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <div>
              <strong>Future Period Constraints:</strong> Only shows available periods up to current date
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HierarchicalFilterDemo;
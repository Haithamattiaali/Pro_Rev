import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

const DataCompletenessIndicator = ({ 
  validation, 
  year, 
  period, 
  variant = 'inline', // 'inline', 'banner', 'tooltip'
  className = '' 
}) => {
  // Check if validation data exists for the year
  const yearValidation = validation?.[year];
  if (!yearValidation) return null;

  // Determine completeness status
  const hasCompleteData = yearValidation.hasCompleteData;
  const compliantMonths = yearValidation.compliantMonths || [];
  const nonCompliantMonths = yearValidation.nonCompliantMonths || [];
  const missingData = yearValidation.missingData || {};

  // Don't show indicator if data is complete
  if (hasCompleteData && variant !== 'banner') return null;

  // Calculate completeness percentage
  const totalMonths = compliantMonths.length + nonCompliantMonths.length;
  const completenessPercentage = totalMonths > 0 
    ? Math.round((compliantMonths.length / totalMonths) * 100)
    : 0;

  // Get missing data summary
  const getMissingDataSummary = () => {
    const summary = [];
    if (missingData.revenue?.length > 0) summary.push('revenue data');
    if (missingData.cost?.length > 0) summary.push('cost data');
    if (missingData.target?.length > 0) summary.push('target data');
    return summary.join(', ');
  };

  const variants = {
    inline: {
      container: `inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
        hasCompleteData 
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-amber-50 text-amber-700 border border-amber-200'
      } ${className}`,
      icon: hasCompleteData ? CheckCircle : AlertCircle,
      iconClass: hasCompleteData ? 'w-4 h-4 text-green-600' : 'w-4 h-4 text-amber-600',
      text: hasCompleteData 
        ? 'Complete data'
        : `${completenessPercentage}% complete`
    },
    banner: {
      container: `flex items-center gap-3 p-4 rounded-lg border ${
        hasCompleteData
          ? 'bg-green-50 border-green-200'
          : 'bg-amber-50 border-amber-200'
      } ${className}`,
      icon: hasCompleteData ? CheckCircle : Info,
      iconClass: hasCompleteData ? 'w-5 h-5 text-green-600' : 'w-5 h-5 text-amber-600',
      text: hasCompleteData
        ? `All data is complete for ${year}`
        : `Data is ${completenessPercentage}% complete for ${year}`
    },
    tooltip: {
      container: `relative inline-flex items-center ${className}`,
      icon: AlertCircle,
      iconClass: 'w-4 h-4 text-amber-500 cursor-help',
      text: ''
    }
  };

  const currentVariant = variants[variant];
  const Icon = currentVariant.icon;

  if (variant === 'tooltip') {
    return (
      <div className={currentVariant.container} title={`Data is ${completenessPercentage}% complete`}>
        <Icon className={currentVariant.iconClass} />
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 pointer-events-none hover:opacity-100 transition-opacity whitespace-nowrap">
          <div className="font-semibold mb-1">
            Data {completenessPercentage}% Complete
          </div>
          {nonCompliantMonths.length > 0 && (
            <div className="text-gray-300">
              Missing: {getMissingDataSummary()}
            </div>
          )}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={currentVariant.container}
    >
      <Icon className={currentVariant.iconClass} />
      <div>
        <span className="font-medium">{currentVariant.text}</span>
        {variant === 'banner' && !hasCompleteData && nonCompliantMonths.length > 0 && (
          <div className="text-xs mt-1 opacity-80">
            Missing {getMissingDataSummary()} for: {nonCompliantMonths.join(', ')}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DataCompletenessIndicator;
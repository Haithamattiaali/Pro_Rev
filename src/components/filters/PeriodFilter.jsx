import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useFilter } from '../../contexts/FilterContext';
import companyLogo from '../../assets/logo.png';

const PeriodFilter = () => {
  const { periodFilter, handlePeriodChange } = useFilter();
  const selectedPeriod = periodFilter.period;
  const selectedMonth = periodFilter.month;
  const selectedQuarter = periodFilter.quarter;
  const selectedYear = periodFilter.year;

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
    { value: 'all', label: 'All Months' }
  ];

  const quarters = [
    { value: 1, label: 'Q1 (Jan-Mar)' },
    { value: 2, label: 'Q2 (Apr-Jun)' },
    { value: 3, label: 'Q3 (Jul-Sep)' },
    { value: 4, label: 'Q4 (Oct-Dec)' },
    { value: 'all', label: 'All Quarters' }
  ];

  const updatePeriod = (period) => {
    const filterData = {
      period,
      year: selectedYear,
      month: period === 'MTD' ? selectedMonth : periodFilter.month,
      quarter: period === 'QTD' ? selectedQuarter : periodFilter.quarter
    };
    handlePeriodChange(filterData);
  };

  const handleMonthChange = (month) => {
    if (selectedPeriod === 'MTD') {
      handlePeriodChange({
        period: 'MTD',
        year: selectedYear,
        month: month === 'all' ? 'all' : parseInt(month),
        quarter: periodFilter.quarter
      });
    }
  };

  const handleQuarterChange = (quarter) => {
    if (selectedPeriod === 'QTD') {
      handlePeriodChange({
        period: 'QTD',
        year: selectedYear,
        month: periodFilter.month,
        quarter: quarter === 'all' ? 'all' : parseInt(quarter)
      });
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-pale">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Period Type Selection */}
          <div className="flex space-x-2">
            <button
              onClick={() => updatePeriod('MTD')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === 'MTD'
                  ? 'bg-primary text-white'
                  : 'bg-secondary-pale text-neutral-dark hover:bg-secondary-light'
              }`}
            >
              MTD
            </button>
            <button
              onClick={() => updatePeriod('QTD')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === 'QTD'
                  ? 'bg-primary text-white'
                  : 'bg-secondary-pale text-neutral-dark hover:bg-secondary-light'
              }`}
            >
              QTD
            </button>
            <button
              onClick={() => updatePeriod('YTD')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === 'YTD'
                  ? 'bg-primary text-white'
                  : 'bg-secondary-pale text-neutral-dark hover:bg-secondary-light'
              }`}
            >
              YTD
            </button>
          </div>

        {/* Month Selector - Visible when MTD is selected */}
        {selectedPeriod === 'MTD' && (
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="appearance-none bg-neutral-light border border-secondary-pale text-neutral-dark py-2 px-4 pr-8 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-mid pointer-events-none" />
          </div>
        )}

        {/* Quarter Selector - Visible when QTD is selected */}
        {selectedPeriod === 'QTD' && (
          <div className="relative">
            <select
              value={selectedQuarter}
              onChange={(e) => handleQuarterChange(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="appearance-none bg-neutral-light border border-secondary-pale text-neutral-dark py-2 px-4 pr-8 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {quarters.map((quarter) => (
                <option key={quarter.value} value={quarter.value}>
                  {quarter.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-mid pointer-events-none" />
          </div>
        )}

          {/* Year Display */}
          <div className="text-sm text-neutral-mid">
            <span className="font-medium">Year:</span> {selectedYear}
          </div>
        </div>
        
        {/* Company Logo */}
        <div className="flex items-center">
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

export default PeriodFilter;
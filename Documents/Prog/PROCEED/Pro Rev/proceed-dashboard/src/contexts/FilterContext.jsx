import React, { createContext, useContext, useState } from 'react';

const FilterContext = createContext();

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};

export const FilterProvider = ({ children }) => {
  const [periodFilter, setPeriodFilter] = useState({
    period: 'YTD',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    quarter: Math.ceil((new Date().getMonth() + 1) / 3)
  });

  const handlePeriodChange = (filterConfig) => {
    setPeriodFilter(filterConfig);
  };

  return (
    <FilterContext.Provider value={{ periodFilter, handlePeriodChange }}>
      {children}
    </FilterContext.Provider>
  );
};
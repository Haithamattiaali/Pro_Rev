import React, { createContext, useContext, useState } from 'react';

const SalesPlanContext = createContext();

export const useSalesPlanData = () => {
  const context = useContext(SalesPlanContext);
  return context || {};
};

export const SalesPlanProvider = ({ children }) => {
  const [actualDateRange, setActualDateRange] = useState(null);

  return (
    <SalesPlanContext.Provider value={{ actualDateRange, setActualDateRange }}>
      {children}
    </SalesPlanContext.Provider>
  );
};

export default SalesPlanContext;
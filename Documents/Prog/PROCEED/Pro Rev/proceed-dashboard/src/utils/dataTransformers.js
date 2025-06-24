// Transform the period breakdown data into a filterable format
export const transformPeriodData = (periodData) => {
  const transformedData = [];
  
  // Process each service type
  Object.entries(periodData).forEach(([serviceType, periods]) => {
    periods.forEach(periodInfo => {
      // Parse period string to extract month/quarter/year
      const periodMatch = periodInfo.Period.match(/(\w+)\s*\((.+?)\s*(\d{4})\)/);
      
      if (periodMatch) {
        const periodType = periodMatch[1]; // MTD, QTD, YTD
        const periodDetail = periodMatch[2]; // Jun, Q2, or empty for YTD
        const year = parseInt(periodMatch[3]);
        
        let month = null;
        let quarter = null;
        
        if (periodType === 'MTD') {
          // Convert month name to number
          const monthMap = {
            'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
            'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
          };
          month = monthMap[periodDetail];
        } else if (periodType === 'QTD') {
          // Extract quarter number
          quarter = parseInt(periodDetail.replace('Q', ''));
        }
        
        transformedData.push({
          Service_Type: serviceType,
          Period_Type: periodType,
          Year: year,
          Month: month,
          Quarter: quarter,
          Target: periodInfo.Target,
          Revenue: periodInfo.Revenue,
          Cost: periodInfo.Cost,
          'Achievement %': periodInfo['Achievement %'],
          'Gross Profit': periodInfo['Gross Profit'],
          'Gross Profit %': periodInfo['Gross Profit %']
        });
      }
    });
  });
  
  return transformedData;
};

// Filter transformed data based on period selection
export const filterByPeriod = (data, filter) => {
  const { period, year, month, quarter } = filter;
  
  return data.filter(item => {
    // Always filter by year
    if (item.Year !== year) return false;
    
    switch (period) {
      case 'MTD':
        return item.Period_Type === 'MTD' && 
               (month === 'all' || item.Month === month);
      
      case 'QTD':
        return item.Period_Type === 'QTD' && 
               (quarter === 'all' || item.Quarter === quarter);
      
      case 'YTD':
        return item.Period_Type === 'YTD';
      
      default:
        return true;
    }
  });
};

// Aggregate data by service type
export const aggregateByServiceType = (data) => {
  const aggregated = {};
  
  data.forEach(item => {
    if (!aggregated[item.Service_Type]) {
      aggregated[item.Service_Type] = {
        Service_Type: item.Service_Type,
        Target: 0,
        Revenue: 0,
        Cost: 0,
        'Gross Profit': 0
      };
    }
    
    aggregated[item.Service_Type].Target += item.Target || 0;
    aggregated[item.Service_Type].Revenue += item.Revenue || 0;
    aggregated[item.Service_Type].Cost += item.Cost || 0;
    aggregated[item.Service_Type]['Gross Profit'] += item['Gross Profit'] || 0;
  });
  
  // Calculate percentages
  return Object.values(aggregated).map(item => ({
    ...item,
    'Achievement %': item.Target > 0 ? (item.Revenue / item.Target) * 100 : 0,
    'Gross Profit %': item.Revenue > 0 ? (item['Gross Profit'] / item.Revenue) * 100 : 0
  }));
};

// Calculate totals from aggregated data
export const calculateTotals = (data) => {
  const totals = {
    'Total Target': 0,
    'Total Revenue': 0,
    'Total Cost': 0,
    'Total Gross Profit': 0
  };
  
  data.forEach(item => {
    totals['Total Target'] += item.Target || 0;
    totals['Total Revenue'] += item.Revenue || 0;
    totals['Total Cost'] += item.Cost || 0;
    totals['Total Gross Profit'] += item['Gross Profit'] || 0;
  });
  
  totals['Total Achievement %'] = totals['Total Target'] > 0 
    ? (totals['Total Revenue'] / totals['Total Target']) * 100 
    : 0;
  
  totals['Total Gross Profit %'] = totals['Total Revenue'] > 0 
    ? (totals['Total Gross Profit'] / totals['Total Revenue']) * 100 
    : 0;
  
  return totals;
};
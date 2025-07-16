import React, { useState, useEffect } from 'react';
import { LineChart, Line, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Calculator, Package, Building2, AlertCircle, Download, Plus, Trash2, ChevronRight, Target, DollarSign, Truck, Warehouse } from 'lucide-react';

// Your actual data
const actualData = [
  {
    "Customer": "ARAC Healthcare",
    "Service_Type": "Transportation",
    "Year": "2025",
    "Month": "Jan",
    "Cost": "77,143",
    "Target": "100,000",
    "Revenue": "69,537"
  },
  {
    "Customer": "ARAC Healthcare",
    "Service_Type": "Transportation",
    "Year": "2025",
    "Month": "Feb",
    "Cost": "77,143",
    "Target": "100,000",
    "Revenue": "60,253"
  },
  {
    "Customer": "ARAC Healthcare",
    "Service_Type": "Transportation",
    "Year": "2025",
    "Month": "Mar",
    "Cost": "77,143",
    "Target": "100,000",
    "Revenue": "59,673"
  },
  {
    "Customer": "ARAC Healthcare",
    "Service_Type": "Transportation",
    "Year": "2025",
    "Month": "Apr",
    "Cost": "77,143",
    "Target": "100,000",
    "Revenue": "51,473"
  },
  {
    "Customer": "ARAC Healthcare",
    "Service_Type": "Transportation",
    "Year": "2025",
    "Month": "May",
    "Cost": "96,429",
    "Target": "125,000",
    "Revenue": "75,302"
  },
  {
    "Customer": "ARAC Healthcare",
    "Service_Type": "Transportation",
    "Year": "2025",
    "Month": "Jun",
    "Cost": "96,429",
    "Target": "125,000",
    "Revenue": "71,047"
  },
  {
    "Customer": "AVALON ",
    "Service_Type": "Transportation",
    "Year": "2025",
    "Month": "Jan",
    "Cost": "62,053",
    "Target": "80,250",
    "Revenue": "282,044"
  },
  {
    "Customer": "AVALON ",
    "Service_Type": "Transportation",
    "Year": "2025",
    "Month": "Feb",
    "Cost": "62,053",
    "Target": "80,250",
    "Revenue": "85,835"
  },
  {
    "Customer": "AVALON ",
    "Service_Type": "Transportation",
    "Year": "2025",
    "Month": "Mar",
    "Cost": "62,053",
    "Target": "80,250",
    "Revenue": "137,944"
  },
  {
    "Customer": "AVALON ",
    "Service_Type": "Transportation",
    "Year": "2025",
    "Month": "Apr",
    "Cost": "62,053",
    "Target": "80,250",
    "Revenue": "213,253"
  },
  {
    "Customer": "AVALON ",
    "Service_Type": "Transportation",
    "Year": "2025",
    "Month": "May",
    "Cost": "82,737",
    "Target": "107,000",
    "Revenue": "246,026"
  },
  {
    "Customer": "AVALON ",
    "Service_Type": "Transportation",
    "Year": "2025",
    "Month": "Jun",
    "Cost": "82,737",
    "Target": "107,000",
    "Revenue": "124,006"
  },
  {
    "Customer": "NUPCO",
    "Service_Type": "Transportation",
    "Year": "2025",
    "Month": "Jan",
    "Cost": "122,833",
    "Target": "152,000",
    "Revenue": "152,000"
  },
  {
    "Customer": "NUPCO",
    "Service_Type": "Warehouses",
    "Year": "2025",
    "Month": "Jan",
    "Cost": "315,124",
    "Target": "485,000",
    "Revenue": "485,000"
  },
  {
    "Customer": "NUPCO",
    "Service_Type": "Transportation",
    "Year": "2025",
    "Month": "Feb",
    "Cost": "122,833",
    "Target": "152,000",
    "Revenue": "310,880"
  },
  {
    "Customer": "NUPCO",
    "Service_Type": "Warehouses",
    "Year": "2025",
    "Month": "Feb",
    "Cost": "315,124",
    "Target": "485,000",
    "Revenue": "485,000"
  },
  {
    "Customer": "NUPCO",
    "Service_Type": "Transportation",
    "Year": "2025",
    "Month": "Mar",
    "Cost": "122,833",
    "Target": "152,000",
    "Revenue": "60,000"
  },
  {
    "Customer": "NUPCO",
    "Service_Type": "Warehouses",
    "Year": "2025",
    "Month": "Mar",
    "Cost": "315,124",
    "Target": "485,000",
    "Revenue": "485,000"
  },
  {
    "Customer": "NUPCO",
    "Service_Type": "Transportation",
    "Year": "2025",
    "Month": "Apr",
    "Cost": "122,833",
    "Target": "152,000",
    "Revenue": "218,768"
  },
  {
    "Customer": "NUPCO",
    "Service_Type": "Warehouses",
    "Year": "2025",
    "Month": "Apr",
    "Cost": "315,124",
    "Target": "485,000",
    "Revenue": "485,000"
  },
  {
    "Customer": "NUPCO",
    "Service_Type": "Transportation",
    "Year": "2025",
    "Month": "May",
    "Cost": "122,833",
    "Target": "152,000",
    "Revenue": "152,000"
  },
  {
    "Customer": "NUPCO",
    "Service_Type": "Warehouses",
    "Year": "2025",
    "Month": "May",
    "Cost": "315,124",
    "Target": "485,000",
    "Revenue": "485,000"
  },
  {
    "Customer": "NUPCO",
    "Service_Type": "Transportation",
    "Year": "2025",
    "Month": "Jun",
    "Cost": "122,833",
    "Target": "152,000",
    "Revenue": "152,000"
  },
  {
    "Customer": "NUPCO",
    "Service_Type": "Warehouses",
    "Year": "2025",
    "Month": "Jun",
    "Cost": "315,124",
    "Target": "485,000",
    "Revenue": "581,200"
  },
  {
    "Customer": "SPIMACO",
    "Service_Type": "Transportation",
    "Year": "2025",
    "Month": "Jan",
    "Cost": "563,573",
    "Target": "800,000",
    "Revenue": "951,931"
  },
  {
    "Customer": "SPIMACO",
    "Service_Type": "Warehouses",
    "Year": "2025",
    "Month": "Jan",
    "Cost": "607,690",
    "Target": "810,000",
    "Revenue": "810,000"
  },
  {
    "Customer": "SPIMACO",
    "Service_Type": "Transportation",
    "Year": "2025",
    "Month": "Feb",
    "Cost": "563,573",
    "Target": "800,000",
    "Revenue": "428"
  },
  {
    "Customer": "SPIMACO",
    "Service_Type": "Warehouses",
    "Year": "2025",
    "Month": "Feb",
    "Cost": "607,690",
    "Target": "810,000",
    "Revenue": "810,000"
  },
  {
    "Customer": "SPIMACO",
    "Service_Type": "Transportation",
    "Year": "2025",
    "Month": "Mar",
    "Cost": "563,573",
    "Target": "800,000",
    "Revenue": "1,420,844"
  },
  {
    "Customer": "SPIMACO",
    "Service_Type": "Warehouses",
    "Year": "2025",
    "Month": "Mar",
    "Cost": "607,690",
    "Target": "810,000",
    "Revenue": "810,000"
  },
  {
    "Customer": "SPIMACO",
    "Service_Type": "Transportation",
    "Year": "2025",
    "Month": "Apr",
    "Cost": "563,573",
    "Target": "800,000",
    "Revenue": "746,960"
  },
  {
    "Customer": "SPIMACO",
    "Service_Type": "Warehouses",
    "Year": "2025",
    "Month": "Apr",
    "Cost": "607,690",
    "Target": "810,000",
    "Revenue": "810,000"
  },
  {
    "Customer": "SPIMACO",
    "Service_Type": "Transportation",
    "Year": "2025",
    "Month": "May",
    "Cost": "598,796",
    "Target": "850,000",
    "Revenue": "623,441"
  },
  {
    "Customer": "SPIMACO",
    "Service_Type": "Warehouses",
    "Year": "2025",
    "Month": "May",
    "Cost": "607,690",
    "Target": "810,000",
    "Revenue": "810,000"
  },
  {
    "Customer": "SPIMACO",
    "Service_Type": "Transportation",
    "Year": "2025",
    "Month": "Jun",
    "Cost": "598,796",
    "Target": "850,000",
    "Revenue": "771,848"
  },
  {
    "Customer": "SPIMACO",
    "Service_Type": "Warehouses",
    "Year": "2025",
    "Month": "Jun",
    "Cost": "607,690",
    "Target": "810,000",
    "Revenue": "827,078"
  }
];

// Parse string numbers to actual numbers
const parseNumber = (str) => {
  if (!str || str === "0") return 0;
  return parseFloat(str.replace(/,/g, ''));
};

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
};

const formatPercentage = (value) => {
  return `${(value || 0).toFixed(1)}%`;
};

const ProceedForecastRealData = () => {
  const [currentYear] = useState(2025);
  const [loading, setLoading] = useState(false);
  const [processedData, setProcessedData] = useState([]);
  const [monthlyTotals, setMonthlyTotals] = useState([]);
  const [customerPerformance, setCustomerPerformance] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [forecastConfig, setForecastConfig] = useState({
    periods: 6,
    includeOpportunities: true,
    probabilityThreshold: 0.5
  });
  const [forecastResults, setForecastResults] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCustomer, setSelectedCustomer] = useState('All Customers');

  // Process the actual data
  useEffect(() => {
    processActualData();
  }, []);

  const processActualData = () => {
    // Parse and clean the data
    const cleanData = actualData.map(item => ({
      ...item,
      Cost: parseNumber(item.Cost),
      Target: parseNumber(item.Target),
      Revenue: parseNumber(item.Revenue)
    }));

    setProcessedData(cleanData);

    // Calculate monthly totals
    const monthlyData = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    months.forEach(month => {
      monthlyData[month] = {
        revenue: 0,
        target: 0,
        cost: 0,
        transportation: 0,
        warehouses: 0
      };
    });

    cleanData.forEach(item => {
      if (months.includes(item.Month)) {
        monthlyData[item.Month].revenue += item.Revenue;
        monthlyData[item.Month].target += item.Target;
        monthlyData[item.Month].cost += item.Cost;
        
        if (item.Service_Type === 'Transportation') {
          monthlyData[item.Month].transportation += item.Revenue;
        } else {
          monthlyData[item.Month].warehouses += item.Revenue;
        }
      }
    });

    const totals = months.map(month => ({
      month,
      revenue: monthlyData[month].revenue,
      target: monthlyData[month].target,
      cost: monthlyData[month].cost,
      transportation: monthlyData[month].transportation,
      warehouses: monthlyData[month].warehouses,
      achievement: (monthlyData[month].revenue / monthlyData[month].target) * 100,
      grossProfit: monthlyData[month].revenue - monthlyData[month].cost,
      grossMargin: ((monthlyData[month].revenue - monthlyData[month].cost) / monthlyData[month].revenue) * 100
    }));

    setMonthlyTotals(totals);

    // Calculate customer performance
    const customerData = {};
    cleanData.forEach(item => {
      if (!customerData[item.Customer]) {
        customerData[item.Customer] = {
          customer: item.Customer,
          totalRevenue: 0,
          totalTarget: 0,
          totalCost: 0,
          transportation: 0,
          warehouses: 0
        };
      }
      
      if (months.includes(item.Month)) {
        customerData[item.Customer].totalRevenue += item.Revenue;
        customerData[item.Customer].totalTarget += item.Target;
        customerData[item.Customer].totalCost += item.Cost;
        
        if (item.Service_Type === 'Transportation') {
          customerData[item.Customer].transportation += item.Revenue;
        } else {
          customerData[item.Customer].warehouses += item.Revenue;
        }
      }
    });

    const customerPerf = Object.values(customerData)
      .map(c => ({
        ...c,
        achievement: (c.totalRevenue / c.totalTarget) * 100,
        grossProfit: c.totalRevenue - c.totalCost,
        grossMargin: ((c.totalRevenue - c.totalCost) / c.totalRevenue) * 100
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    setCustomerPerformance(customerPerf);

    // Initialize opportunities based on data patterns
    const initialOpportunities = [
      {
        id: 1,
        Customer: "SABIC",
        Service_Type: "Warehouses",
        Target: "1,200,000",
        probability: 0.8,
        startMonth: 3,
        duration: 12,
        enabled: true
      },
      {
        id: 2,
        Customer: "Aramco",
        Service_Type: "Transportation",
        Target: "800,000",
        probability: 0.7,
        startMonth: 2,
        duration: 24,
        enabled: true
      },
      {
        id: 3,
        Customer: "NUPCO",
        Service_Type: "Transportation",
        Target: "200,000",
        probability: 0.9,
        startMonth: 1,
        duration: 6,
        enabled: true
      },
      {
        id: 4,
        Customer: "Almarai",
        Service_Type: "Warehouses",
        Target: "600,000",
        probability: 0.6,
        startMonth: 4,
        duration: 18,
        enabled: true
      }
    ];

    setOpportunities(initialOpportunities);
  };

  // Calculate forecast
  useEffect(() => {
    if (monthlyTotals.length > 0) {
      calculateForecast();
    }
  }, [monthlyTotals, opportunities, forecastConfig]);

  const calculateForecast = () => {
    // Linear regression on monthly totals
    const n = monthlyTotals.length;
    const x = Array.from({ length: n }, (_, i) => i + 1);
    const y = monthlyTotals.map(m => m.revenue);
    
    const xMean = x.reduce((a, b) => a + b) / n;
    const yMean = y.reduce((a, b) => a + b) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (x[i] - xMean) * (y[i] - yMean);
      denominator += Math.pow(x[i] - xMean, 2);
    }
    
    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;
    
    // Generate forecast
    const activeOpportunities = opportunities.filter(opp => 
      opp.enabled && opp.probability >= forecastConfig.probabilityThreshold
    );
    
    const results = [];
    const futureMonths = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < forecastConfig.periods; i++) {
      const t = n + i + 1;
      let baseForecast = intercept + slope * t;
      
      let opportunityImpact = 0;
      if (forecastConfig.includeOpportunities) {
        activeOpportunities.forEach(opp => {
          const monthIndex = i + 1;
          if (monthIndex >= opp.startMonth && monthIndex < opp.startMonth + opp.duration) {
            const monthlyValue = parseNumber(opp.Target) / opp.duration;
            opportunityImpact += monthlyValue * opp.probability;
          }
        });
      }
      
      const totalForecast = baseForecast + opportunityImpact;
      
      results.push({
        month: futureMonths[i],
        base: Math.round(baseForecast),
        opportunities: Math.round(opportunityImpact),
        total: Math.round(totalForecast),
        lower: Math.round(totalForecast * 0.9),
        upper: Math.round(totalForecast * 1.1)
      });
    }
    
    setForecastResults(results);
  };

  const addOpportunity = () => {
    const newOpp = {
      id: Date.now(),
      Customer: "New Customer",
      Service_Type: "Transportation",
      Target: "500,000",
      probability: 0.5,
      startMonth: 1,
      duration: 12,
      enabled: true
    };
    setOpportunities([...opportunities, newOpp]);
  };

  const updateOpportunity = (id, field, value) => {
    setOpportunities(opportunities.map(opp => 
      opp.id === id ? { ...opp, [field]: value } : opp
    ));
  };

  const deleteOpportunity = (id) => {
    setOpportunities(opportunities.filter(opp => opp.id !== id));
  };

  const exportForecast = () => {
    const csvData = [];
    
    // Headers
    csvData.push(['Customer', 'Service_Type', 'Year', 'Month', 'Cost', 'Target', 'Revenue', 'Type']);
    
    // Historical data
    processedData.forEach(row => {
      if (['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].includes(row.Month)) {
        csvData.push([
          row.Customer,
          row.Service_Type,
          row.Year,
          row.Month,
          row.Cost,
          row.Target,
          row.Revenue,
          'Historical'
        ]);
      }
    });
    
    // Forecast data
    forecastResults.forEach((forecast, index) => {
      csvData.push([
        'Total Forecast',
        'All',
        currentYear,
        forecast.month,
        '',
        '',
        forecast.total,
        'Forecast'
      ]);
    });
    
    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proceed_forecast_${currentYear}.csv`;
    a.click();
  };

  // Calculate metrics
  const calculateMetrics = () => {
    const currentRevenue = monthlyTotals.length > 0 ? monthlyTotals[monthlyTotals.length - 1].revenue : 0;
    const avgMonthlyRevenue = monthlyTotals.reduce((sum, m) => sum + m.revenue, 0) / monthlyTotals.length;
    const totalPipeline = opportunities
      .filter(opp => opp.enabled)
      .reduce((sum, opp) => sum + parseNumber(opp.Target), 0);
    const weightedPipeline = opportunities
      .filter(opp => opp.enabled)
      .reduce((sum, opp) => sum + (parseNumber(opp.Target) * opp.probability), 0);
    
    return { currentRevenue, avgMonthlyRevenue, totalPipeline, weightedPipeline };
  };

  const metrics = calculateMetrics();

  // Service type distribution from actual data
  const serviceTypeData = [
    {
      name: 'Transportation',
      value: monthlyTotals.reduce((sum, m) => sum + m.transportation, 0)
    },
    {
      name: 'Warehouses',
      value: monthlyTotals.reduce((sum, m) => sum + m.warehouses, 0)
    }
  ];

  const COLORS = ['#9e1f63', '#005b8c'];

  // Combined chart data
  const chartData = [
    ...monthlyTotals.map(m => ({
      period: m.month,
      actual: m.revenue,
      target: m.target,
      type: 'historical'
    })),
    ...forecastResults.map(f => ({
      period: f.month,
      forecast: f.total,
      base: f.base,
      opportunities: f.opportunities,
      lower: f.lower,
      upper: f.upper,
      type: 'forecast'
    }))
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm text-gray-700">
              <span style={{ color: entry.color }}>{entry.name}:</span>{' '}
              {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-8 h-8 text-pink-600" />
                PROCEED Revenue Forecast {currentYear}
              </h1>
              <p className="text-gray-600 mt-2">3PL Revenue Analysis & Forecasting System</p>
            </div>
            <button
              onClick={exportForecast}
              className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Forecast
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Month Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(metrics.currentRevenue)}
                </p>
                <p className="text-xs text-green-600 mt-1">June 2025</p>
              </div>
              <DollarSign className="w-8 h-8 text-pink-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Monthly Revenue</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(metrics.avgMonthlyRevenue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Jan-Jun 2025</p>
              </div>
              <Calculator className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pipeline Value</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(metrics.totalPipeline)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{opportunities.filter(o => o.enabled).length} opportunities</p>
              </div>
              <Package className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Weighted Pipeline</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(metrics.weightedPipeline)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Probability adjusted</p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-pink-600 border-b-2 border-pink-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Forecast Overview
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'customers'
                  ? 'text-pink-600 border-b-2 border-pink-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Customer Analysis
            </button>
            <button
              onClick={() => setActiveTab('opportunities')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'opportunities'
                  ? 'text-pink-600 border-b-2 border-pink-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Opportunity Pipeline
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Main Forecast Chart */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend & Forecast</h2>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="period" 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      
                      <Bar dataKey="actual" fill="#721548" name="Actual Revenue" />
                      <Bar dataKey="target" fill="#e5e7eb" name="Target" />
                      
                      <Bar dataKey="base" fill="#fbbf24" stackId="forecast" name="Base Forecast" />
                      <Bar dataKey="opportunities" fill="#9e1f63" stackId="forecast" name="Opportunities" />
                      
                      <Area
                        dataKey="upper"
                        fill="#10b981"
                        fillOpacity={0.1}
                        stroke="none"
                      />
                      <Area
                        dataKey="lower"
                        fill="#10b981"
                        fillOpacity={0.1}
                        stroke="none"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Service Type Split */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Type Distribution (YTD)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={serviceTypeData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {serviceTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Forecast Summary</h3>
                    <div className="space-y-3">
                      <div className="bg-gray-50 p-4 rounded">
                        <p className="text-sm text-gray-600">Total H2 2025 Forecast</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(forecastResults.reduce((sum, f) => sum + f.total, 0))}
                        </p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded">
                        <p className="text-sm text-gray-600">Opportunity Impact</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(forecastResults.reduce((sum, f) => sum + f.opportunities, 0))}
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded">
                        <p className="text-sm text-gray-600">Forecast Settings</p>
                        <p className="text-sm text-gray-700">
                          {forecastConfig.periods} months • {(forecastConfig.probabilityThreshold * 100)}% threshold
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'customers' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Performance (Jan-Jun 2025)</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Revenue
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Target
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Achievement
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transportation
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Warehouses
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Gross Profit
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {customerPerformance.slice(0, 10).map((customer, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {customer.customer}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(customer.totalRevenue)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(customer.totalTarget)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              customer.achievement >= 100 ? 'bg-green-100 text-green-800' :
                              customer.achievement >= 80 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {formatPercentage(customer.achievement)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(customer.transportation)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(customer.warehouses)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                            {formatCurrency(customer.grossProfit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'opportunities' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Opportunity Pipeline</h2>
                  <button
                    onClick={addOpportunity}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Opportunity
                  </button>
                </div>

                <div className="space-y-4">
                  {opportunities.map((opp) => (
                    <div key={opp.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="grid grid-cols-6 gap-4 items-center">
                        <div className="col-span-2">
                          <label className="block text-xs text-gray-600 mb-1">Customer</label>
                          <input
                            type="text"
                            value={opp.Customer}
                            onChange={(e) => updateOpportunity(opp.id, 'Customer', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Service Type</label>
                          <select
                            value={opp.Service_Type}
                            onChange={(e) => updateOpportunity(opp.id, 'Service_Type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                          >
                            <option value="Transportation">Transportation</option>
                            <option value="Warehouses">Warehouses</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Target Value</label>
                          <input
                            type="text"
                            value={opp.Target}
                            onChange={(e) => updateOpportunity(opp.id, 'Target', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Probability</label>
                          <select
                            value={opp.probability}
                            onChange={(e) => updateOpportunity(opp.id, 'probability', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                          >
                            {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(p => (
                              <option key={p} value={p/100}>{p}%</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={opp.enabled}
                              onChange={(e) => updateOpportunity(opp.id, 'enabled', e.target.checked)}
                              className="mr-2 h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                            />
                            <span className="text-sm">Active</span>
                          </label>
                          <button
                            onClick={() => deleteOpportunity(opp.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Start Month</label>
                          <input
                            type="number"
                            value={opp.startMonth}
                            onChange={(e) => updateOpportunity(opp.id, 'startMonth', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                            min="1"
                            max="12"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Duration (months)</label>
                          <input
                            type="number"
                            value={opp.duration}
                            onChange={(e) => updateOpportunity(opp.id, 'duration', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                            min="1"
                            max="36"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Monthly Value</label>
                          <div className="px-3 py-1 bg-gray-100 rounded text-sm font-medium">
                            {formatCurrency(parseNumber(opp.Target) / opp.duration)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Forecast Configuration */}
                <div className="mt-8 bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Forecast Configuration</h3>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Forecast Period (months)
                      </label>
                      <input
                        type="number"
                        value={forecastConfig.periods}
                        onChange={(e) => setForecastConfig({ ...forecastConfig, periods: parseInt(e.target.value) || 6 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        min="1"
                        max="12"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Include Opportunities
                      </label>
                      <label className="flex items-center mt-2">
                        <input
                          type="checkbox"
                          checked={forecastConfig.includeOpportunities}
                          onChange={(e) => setForecastConfig({ ...forecastConfig, includeOpportunities: e.target.checked })}
                          className="mr-2 h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                        />
                        <span className="text-sm">Include in forecast</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Probability
                      </label>
                      <input
                        type="range"
                        value={forecastConfig.probabilityThreshold}
                        onChange={(e) => setForecastConfig({ ...forecastConfig, probabilityThreshold: parseFloat(e.target.value) })}
                        className="w-full"
                        min="0"
                        max="1"
                        step="0.1"
                      />
                      <div className="text-center text-sm text-gray-600 mt-1">
                        {(forecastConfig.probabilityThreshold * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProceedForecastRealData;
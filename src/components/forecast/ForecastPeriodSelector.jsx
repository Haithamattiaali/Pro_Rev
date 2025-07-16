import React, { useState, useEffect } from 'react'
import { ChevronDown, TrendingUp, Info } from 'lucide-react'
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, addMonths } from 'date-fns'

const ForecastPeriodSelector = ({ 
  historicalStart, 
  historicalEnd, 
  forecastStart, 
  forecastEnd, 
  onHistoricalChange, 
  onForecastChange 
}) => {
  const [activeTab, setActiveTab] = useState('historical')
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const currentQuarter = Math.ceil(currentMonth / 3)
  
  // Historical period state
  const [historicalFromYear, setHistoricalFromYear] = useState(currentYear - 1)
  const [historicalFromMonth, setHistoricalFromMonth] = useState(1)
  const [historicalToYear, setHistoricalToYear] = useState(currentYear)
  const [historicalToMonth, setHistoricalToMonth] = useState(currentMonth)
  
  // Forecast period state
  const [forecastPeriodType, setForecastPeriodType] = useState('QTD')
  const [forecastMonth, setForecastMonth] = useState(currentMonth)
  const [forecastQuarter, setForecastQuarter] = useState(currentQuarter)
  const [forecastYear, setForecastYear] = useState(currentYear)
  const [customForecastMonths, setCustomForecastMonths] = useState(6)
  
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
    { value: 12, label: 'December' }
  ]

  const quarters = [
    { value: 1, label: 'Q1 (Jan-Mar)' },
    { value: 2, label: 'Q2 (Apr-Jun)' },
    { value: 3, label: 'Q3 (Jul-Sep)' },
    { value: 4, label: 'Q4 (Oct-Dec)' }
  ]
  
  const years = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i)
  const futureYears = Array.from({ length: 5 }, (_, i) => currentYear + i)
  
  // Update historical period when dropdowns change
  useEffect(() => {
    const start = new Date(historicalFromYear, historicalFromMonth - 1, 1)
    const end = endOfMonth(new Date(historicalToYear, historicalToMonth - 1, 1))
    onHistoricalChange({ start, end })
  }, [historicalFromYear, historicalFromMonth, historicalToYear, historicalToMonth])
  
  // Quick select handlers for historical period
  const selectHistoricalPeriod = (months) => {
    const end = new Date()
    const start = addMonths(end, -months)
    
    setHistoricalFromYear(start.getFullYear())
    setHistoricalFromMonth(start.getMonth() + 1)
    setHistoricalToYear(end.getFullYear())
    setHistoricalToMonth(end.getMonth() + 1)
    
    onHistoricalChange({ start: startOfMonth(start), end: endOfMonth(end) })
  }
  
  // Update forecast period based on selections
  useEffect(() => {
    let start, end
    const today = new Date()
    
    switch(forecastPeriodType) {
      case 'MTD':
        // Forecast for a specific future month
        start = startOfMonth(new Date(forecastYear, forecastMonth - 1, 1))
        end = endOfMonth(new Date(forecastYear, forecastMonth - 1, 1))
        break
      case 'QTD':
        // Forecast for a specific future quarter
        const quarterStartMonth = (forecastQuarter - 1) * 3
        start = startOfQuarter(new Date(forecastYear, quarterStartMonth, 1))
        end = endOfQuarter(new Date(forecastYear, quarterStartMonth, 1))
        break
      case 'YTD':
        // Forecast for rest of year
        start = today
        end = endOfYear(new Date(forecastYear, 11, 31))
        break
      case 'CUSTOM':
        // Custom period - next N months
        start = startOfMonth(today)
        end = endOfMonth(addMonths(today, customForecastMonths - 1))
        break
      default:
        start = today
        end = addMonths(today, 6)
    }
    
    onForecastChange({ start, end })
  }, [forecastPeriodType, forecastMonth, forecastQuarter, forecastYear, customForecastMonths])
  
  // Format period display
  const formatPeriodDisplay = (start, end) => {
    const startMonth = months[start.getMonth()].label
    const endMonth = months[end.getMonth()].label
    const startYear = start.getFullYear()
    const endYear = end.getFullYear()
    
    if (startYear === endYear) {
      return `${startMonth} - ${endMonth} ${startYear}`
    } else {
      return `${startMonth} ${startYear} - ${endMonth} ${endYear}`
    }
  }
  
  return (
    <div className="bg-white rounded-xl p-6 mb-6">
      {/* Segmented Control */}
      <div className="bg-neutral-light rounded-lg p-1 inline-flex mb-6">
        <button
          onClick={() => setActiveTab('historical')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === 'historical' 
              ? 'bg-white text-neutral-dark shadow-sm' 
              : 'text-neutral-mid hover:text-neutral-dark'
          }`}
        >
          Historical
        </button>
        <button
          onClick={() => setActiveTab('forecast')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === 'forecast' 
              ? 'bg-white text-neutral-dark shadow-sm' 
              : 'text-neutral-mid hover:text-neutral-dark'
          }`}
        >
          Forecast
        </button>
      </div>
      
      {activeTab === 'historical' ? (
        <div className="space-y-4">
          {/* Period Range */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-neutral-mid w-12">From</span>
              <div className="flex space-x-2">
                <div className="relative">
                  <select
                    value={historicalFromMonth}
                    onChange={(e) => setHistoricalFromMonth(parseInt(e.target.value))}
                    className="appearance-none bg-neutral-light border-0 text-neutral-dark py-2 px-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  >
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-neutral-mid pointer-events-none" />
                </div>
                
                <div className="relative">
                  <select
                    value={historicalFromYear}
                    onChange={(e) => setHistoricalFromYear(parseInt(e.target.value))}
                    className="appearance-none bg-neutral-light border-0 text-neutral-dark py-2 px-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-neutral-mid pointer-events-none" />
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-sm text-neutral-mid w-12">To</span>
              <div className="flex space-x-2">
                <div className="relative">
                  <select
                    value={historicalToMonth}
                    onChange={(e) => setHistoricalToMonth(parseInt(e.target.value))}
                    className="appearance-none bg-neutral-light border-0 text-neutral-dark py-2 px-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  >
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-neutral-mid pointer-events-none" />
                </div>
                
                <div className="relative">
                  <select
                    value={historicalToYear}
                    onChange={(e) => setHistoricalToYear(parseInt(e.target.value))}
                    className="appearance-none bg-neutral-light border-0 text-neutral-dark py-2 px-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-neutral-mid pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Select */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-neutral-mid">Quick select:</span>
            <div className="flex space-x-1">
              <button
                onClick={() => selectHistoricalPeriod(12)}
                className="px-3 py-1 text-xs text-neutral-mid hover:text-primary transition-colors"
              >
                1 year
              </button>
              <span className="text-neutral-light">•</span>
              <button
                onClick={() => selectHistoricalPeriod(24)}
                className="px-3 py-1 text-xs text-neutral-mid hover:text-primary transition-colors"
              >
                2 years
              </button>
              <span className="text-neutral-light">•</span>
              <button
                onClick={() => selectHistoricalPeriod(36)}
                className="px-3 py-1 text-xs text-neutral-mid hover:text-primary transition-colors"
              >
                3 years
              </button>
            </div>
          </div>
          
          {historicalStart && historicalEnd && (
            <div className="mt-2">
              <p className="text-sm text-neutral-mid">
                {formatPeriodDisplay(historicalStart, historicalEnd)}
                <span className="ml-2 text-neutral-mid/70">
                  • {Math.round((historicalEnd - historicalStart) / (1000 * 60 * 60 * 24 * 30))} months
                </span>
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Period Type Pills */}
          <div className="flex space-x-1">
            <button
              onClick={() => setForecastPeriodType('MTD')}
              className={`px-4 py-1.5 rounded-full text-sm transition-all duration-200 ${
                forecastPeriodType === 'MTD'
                  ? 'bg-primary text-white'
                  : 'text-neutral-mid hover:bg-neutral-light'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setForecastPeriodType('QTD')}
              className={`px-4 py-1.5 rounded-full text-sm transition-all duration-200 ${
                forecastPeriodType === 'QTD'
                  ? 'bg-primary text-white'
                  : 'text-neutral-mid hover:bg-neutral-light'
              }`}
            >
              Quarterly
            </button>
            <button
              onClick={() => setForecastPeriodType('YTD')}
              className={`px-4 py-1.5 rounded-full text-sm transition-all duration-200 ${
                forecastPeriodType === 'YTD'
                  ? 'bg-primary text-white'
                  : 'text-neutral-mid hover:bg-neutral-light'
              }`}
            >
              Yearly
            </button>
            <button
              onClick={() => setForecastPeriodType('CUSTOM')}
              className={`px-4 py-1.5 rounded-full text-sm transition-all duration-200 ${
                forecastPeriodType === 'CUSTOM'
                  ? 'bg-primary text-white'
                  : 'text-neutral-mid hover:bg-neutral-light'
              }`}
            >
              Custom
            </button>
          </div>
          
          {/* Period-specific selectors */}
          {forecastPeriodType === 'MTD' && (
            <div className="flex items-center space-x-3">
              <div className="relative">
                <select
                  value={forecastMonth}
                  onChange={(e) => setForecastMonth(parseInt(e.target.value))}
                  className="appearance-none bg-neutral-light border-0 text-neutral-dark py-2 px-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                >
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-neutral-mid pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={forecastYear}
                  onChange={(e) => setForecastYear(parseInt(e.target.value))}
                  className="appearance-none bg-neutral-light border-0 text-neutral-dark py-2 px-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                >
                  {futureYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-neutral-mid pointer-events-none" />
              </div>
            </div>
          )}
          
          {forecastPeriodType === 'QTD' && (
            <div className="flex items-center space-x-3">
              <div className="relative">
                <select
                  value={forecastQuarter}
                  onChange={(e) => setForecastQuarter(parseInt(e.target.value))}
                  className="appearance-none bg-neutral-light border-0 text-neutral-dark py-2 px-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                >
                  {quarters.map((quarter) => (
                    <option key={quarter.value} value={quarter.value}>
                      {quarter.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-neutral-mid pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={forecastYear}
                  onChange={(e) => setForecastYear(parseInt(e.target.value))}
                  className="appearance-none bg-neutral-light border-0 text-neutral-dark py-2 px-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                >
                  {futureYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-neutral-mid pointer-events-none" />
              </div>
            </div>
          )}
          
          {forecastPeriodType === 'YTD' && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-neutral-mid">Through end of</span>
              <div className="relative">
                <select
                  value={forecastYear}
                  onChange={(e) => setForecastYear(parseInt(e.target.value))}
                  className="appearance-none bg-neutral-light border-0 text-neutral-dark py-2 px-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                >
                  {futureYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-neutral-mid pointer-events-none" />
              </div>
            </div>
          )}
          
          {forecastPeriodType === 'CUSTOM' && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-neutral-mid">Next</span>
              <div className="relative">
                <select
                  value={customForecastMonths}
                  onChange={(e) => setCustomForecastMonths(parseInt(e.target.value))}
                  className="appearance-none bg-neutral-light border-0 text-neutral-dark py-2 px-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                >
                  <option value={3}>3 months</option>
                  <option value={6}>6 months</option>
                  <option value={9}>9 months</option>
                  <option value={12}>12 months</option>
                  <option value={18}>18 months</option>
                  <option value={24}>24 months</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-neutral-mid pointer-events-none" />
              </div>
            </div>
          )}
          
          {forecastStart && forecastEnd && (
            <div className="mt-2">
              <p className="text-sm text-neutral-mid">
                {formatPeriodDisplay(forecastStart, forecastEnd)}
                <span className="ml-2 text-neutral-mid/70">
                  • {Math.round((forecastEnd - forecastStart) / (1000 * 60 * 60 * 24 * 30))} months
                </span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ForecastPeriodSelector
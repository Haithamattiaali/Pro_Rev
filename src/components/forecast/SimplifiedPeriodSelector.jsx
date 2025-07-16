import React, { useState, useEffect } from 'react'
import { ChevronDown, ArrowRight } from 'lucide-react'
import { startOfMonth, endOfMonth, addMonths } from 'date-fns'

const SimplifiedPeriodSelector = ({ 
  historicalStart, 
  historicalEnd, 
  forecastStart, 
  forecastEnd, 
  onHistoricalChange, 
  onForecastChange 
}) => {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  
  // Historical period state
  const [historicalFromYear, setHistoricalFromYear] = useState(currentYear - 1)
  const [historicalFromMonth, setHistoricalFromMonth] = useState(1)
  const [historicalToYear, setHistoricalToYear] = useState(currentYear)
  const [historicalToMonth, setHistoricalToMonth] = useState(currentMonth)
  
  // Forecast period state
  const [forecastFromYear, setForecastFromYear] = useState(currentYear)
  const [forecastFromMonth, setForecastFromMonth] = useState(currentMonth)
  const [forecastToYear, setForecastToYear] = useState(currentYear)
  const [forecastToMonth, setForecastToMonth] = useState(currentMonth + 6 > 12 ? 12 : currentMonth + 6)
  
  const months = [
    { value: 1, label: 'Jan' },
    { value: 2, label: 'Feb' },
    { value: 3, label: 'Mar' },
    { value: 4, label: 'Apr' },
    { value: 5, label: 'May' },
    { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' },
    { value: 8, label: 'Aug' },
    { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' },
    { value: 11, label: 'Nov' },
    { value: 12, label: 'Dec' }
  ]
  
  const years = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i)
  const futureYears = Array.from({ length: 5 }, (_, i) => currentYear + i)
  
  // Update historical period when dropdowns change
  useEffect(() => {
    const start = new Date(historicalFromYear, historicalFromMonth - 1, 1)
    const end = endOfMonth(new Date(historicalToYear, historicalToMonth - 1, 1))
    onHistoricalChange({ start, end })
  }, [historicalFromYear, historicalFromMonth, historicalToYear, historicalToMonth])
  
  // Update forecast period when dropdowns change
  useEffect(() => {
    const start = new Date(forecastFromYear, forecastFromMonth - 1, 1)
    const end = endOfMonth(new Date(forecastToYear, forecastToMonth - 1, 1))
    onForecastChange({ start, end })
  }, [forecastFromYear, forecastFromMonth, forecastToYear, forecastToMonth])
  
  const PeriodDropdown = ({ month, year, onMonthChange, onYearChange, yearOptions }) => (
    <div className="inline-flex items-center">
      <div className="relative">
        <select
          value={month}
          onChange={(e) => onMonthChange(parseInt(e.target.value))}
          className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-0.5 px-1.5 pr-5 text-xs rounded hover:border-gray-300 focus:outline-none focus:border-primary transition-colors"
        >
          {months.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-1 top-1/2 transform -translate-y-1/2 h-2.5 w-2.5 text-gray-400 pointer-events-none" />
      </div>
      <div className="relative ml-1">
        <select
          value={year}
          onChange={(e) => onYearChange(parseInt(e.target.value))}
          className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-0.5 px-1.5 pr-5 text-xs rounded hover:border-gray-300 focus:outline-none focus:border-primary transition-colors"
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-1 top-1/2 transform -translate-y-1/2 h-2.5 w-2.5 text-gray-400 pointer-events-none" />
      </div>
    </div>
  )
  
  return (
    <div className="flex items-center py-2 text-xs">
      {/* Historical Period */}
      <div className="flex items-center">
        <span className="text-gray-500 font-normal">Historical:</span>
        <div className="flex items-center ml-2">
          <PeriodDropdown 
            month={historicalFromMonth}
            year={historicalFromYear}
            onMonthChange={setHistoricalFromMonth}
            onYearChange={setHistoricalFromYear}
            yearOptions={years}
          />
          <ArrowRight className="h-3 w-3 text-gray-400 mx-1.5" />
          <PeriodDropdown 
            month={historicalToMonth}
            year={historicalToYear}
            onMonthChange={setHistoricalToMonth}
            onYearChange={setHistoricalToYear}
            yearOptions={years}
          />
        </div>
      </div>
      
      {/* Divider */}
      <div className="mx-4 h-4 w-px bg-gray-200" />
      
      {/* Forecast Period */}
      <div className="flex items-center">
        <span className="text-gray-500 font-normal">Forecast:</span>
        <div className="flex items-center ml-2">
          <PeriodDropdown 
            month={forecastFromMonth}
            year={forecastFromYear}
            onMonthChange={setForecastFromMonth}
            onYearChange={setForecastFromYear}
            yearOptions={futureYears}
          />
          <ArrowRight className="h-3 w-3 text-gray-400 mx-1.5" />
          <PeriodDropdown 
            month={forecastToMonth}
            year={forecastToYear}
            onMonthChange={setForecastToMonth}
            onYearChange={setForecastToYear}
            yearOptions={futureYears}
          />
        </div>
      </div>
    </div>
  )
}

export default SimplifiedPeriodSelector
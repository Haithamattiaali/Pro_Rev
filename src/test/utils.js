import React from 'react'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { FilterProvider } from '../contexts/FilterContext'
import { DataRefreshProvider } from '../contexts/DataRefreshContext'

// Custom render function that includes all providers
export function renderWithProviders(
  ui,
  {
    route = '/',
    initialFilter = { periodFilter: 'YTD', year: 2025 },
    ...renderOptions
  } = {}
) {
  window.history.pushState({}, 'Test page', route)

  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        <DataRefreshProvider>
          <FilterProvider initialFilter={initialFilter}>
            {children}
          </FilterProvider>
        </DataRefreshProvider>
      </BrowserRouter>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}

// Mock API responses
export const mockApiResponses = {
  overview: {
    revenue: 50000000,
    target: 60000000,
    achievement: 83.33,
    grossProfit: 15000000,
    grossMargin: 30,
    transportation: { revenue: 30000000, percentage: 60 },
    warehouses: { revenue: 20000000, percentage: 40 }
  },
  businessUnits: [
    {
      name: 'Transportation',
      revenue: 30000000,
      target: 35000000,
      achievement: 85.71,
      grossProfit: 9000000,
      customers: 10
    },
    {
      name: 'Warehouses',
      revenue: 20000000,
      target: 25000000,
      achievement: 80,
      grossProfit: 6000000,
      customers: 7
    }
  ],
  customers: [
    {
      customer: 'Customer A',
      revenue: 10000000,
      target: 12000000,
      achievement: 83.33,
      transportation: 6000000,
      warehouses: 4000000
    },
    {
      customer: 'Customer B',
      revenue: 8000000,
      target: 9000000,
      achievement: 88.89,
      transportation: 5000000,
      warehouses: 3000000
    }
  ],
  monthlyTrends: [
    { month: 'Jan', revenue: 4000000, target: 5000000, cost: 2800000 },
    { month: 'Feb', revenue: 4200000, target: 5000000, cost: 2900000 },
    { month: 'Mar', revenue: 4500000, target: 5000000, cost: 3100000 },
    { month: 'Apr', revenue: 4300000, target: 5000000, cost: 3000000 },
    { month: 'May', revenue: 4100000, target: 5000000, cost: 2870000 },
    { month: 'Jun', revenue: 4400000, target: 5000000, cost: 3080000 }
  ]
}

// Wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Create mock file for upload testing
export const createMockFile = (name = 'test.xlsx', size = 1024) => {
  const file = new File([''], name, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  Object.defineProperty(file, 'size', { value: size })
  return file
}
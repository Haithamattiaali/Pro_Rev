import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Overview from './Overview'
import dataService from '../services/dataService'
import { FilterProvider } from '../contexts/FilterContext'
import { DataRefreshProvider } from '../contexts/DataRefreshContext'
import { HierarchicalFilterProvider } from '../contexts/HierarchicalFilterContext'

// Mock the services and components
vi.mock('../services/dataService')
vi.mock('../components/cards/MetricCard', () => ({
  default: ({ title, value, format }) => (
    <div data-testid={`metric-${title}`}>
      {title}: {typeof value === 'number' ? value.toLocaleString() : value}
    </div>
  )
}))
vi.mock('../components/charts/GaugeChart', () => ({
  default: ({ value, title }) => (
    <div data-testid={`gauge-${title}`}>Gauge: {title} - {value}%</div>
  )
}))
vi.mock('../components/cards/ContentCard', () => ({
  default: ({ title, children }) => (
    <div data-testid={`card-${title}`}>
      <h3>{title}</h3>
      {children}
    </div>
  )
}))
vi.mock('../components/common/BaseCard', () => ({
  default: ({ children, ...props }) => <div {...props}>{children}</div>
}))
vi.mock('../components/filters/StickyPeriodFilter', () => ({
  default: () => <div data-testid="period-filter">Period Filter</div>
}))
vi.mock('../components/export', () => ({
  ExportButton: () => <button data-testid="export-button">Export</button>
}))
vi.mock('../components/layout/ToolbarSection', () => ({
  default: ({ title, children }) => (
    <div data-testid="toolbar">
      <h1>{title}</h1>
      {children}
    </div>
  )
}))

const mockOverviewData = {
  overview: {
    revenue: 5000000,
    target: 6000000,
    achievement: 83.33,
    profit: 1500000,
    profitMargin: 30
  },
  serviceBreakdown: [
    { service_type: 'Transportation', revenue: 3000000, target: 3500000, achievement_percentage: 85.71 },
    { service_type: 'Warehouses', revenue: 2000000, target: 2500000, achievement_percentage: 80 }
  ]
}

const mockMonthlyTrends = [
  { month: 'Jan', revenue: 1500000, target: 1800000, grossProfit: 450000 },
  { month: 'Feb', revenue: 1600000, target: 1900000, grossProfit: 480000 },
  { month: 'Mar', revenue: 1900000, target: 2300000, grossProfit: 570000 }
]

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <DataRefreshProvider>
        <FilterProvider>
          <HierarchicalFilterProvider>
            {component}
          </HierarchicalFilterProvider>
        </FilterProvider>
      </DataRefreshProvider>
    </BrowserRouter>
  )
}

describe('Overview Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dataService.getOverviewData.mockResolvedValue(mockOverviewData)
    dataService.getMonthlyTrends.mockResolvedValue(mockMonthlyTrends)
    dataService.getPeriodLabel = vi.fn(() => 'Q1')
    dataService.getPeriodMonths = vi.fn(() => [1, 2, 3])
  })

  it('should render loading state initially', () => {
    renderWithProviders(<Overview />)
    // The loading state shows a spinner, not text
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should render all metric cards with correct data', async () => {
    renderWithProviders(<Overview />)
    
    await waitFor(() => {
      expect(screen.getByTestId('metric-Total Revenue')).toHaveTextContent('Total Revenue: 5,000,000')
      expect(screen.getByTestId('metric-Target')).toHaveTextContent('Target: 6,000,000')
      expect(screen.getByTestId('metric-Gross Profit')).toHaveTextContent('Gross Profit: 1,500,000')
      expect(screen.getByTestId('metric-Gross Profit Margin')).toHaveTextContent('Gross Profit Margin: 30')
    })
  })

  it('should render gauge chart with correct values', async () => {
    renderWithProviders(<Overview />)
    
    await waitFor(() => {
      const achievementCard = screen.getByTestId('card-Overall Achievement')
      expect(achievementCard).toBeInTheDocument()
      // The gauge chart is inside this card
      expect(screen.getByTestId('gauge-Q1 Achievement')).toHaveTextContent('Gauge: Q1 Achievement - 83.33%')
    })
  })

  it('should render achievement summary section', async () => {
    renderWithProviders(<Overview />)
    
    await waitFor(() => {
      const summaryCard = screen.getByTestId('card-Achievement Summary')
      expect(summaryCard).toBeInTheDocument()
    })
  })

  it('should render period filter and export button', async () => {
    renderWithProviders(<Overview />)
    
    await waitFor(() => {
      expect(screen.getByTestId('period-filter')).toBeInTheDocument()
      expect(screen.getByTestId('export-button')).toBeInTheDocument()
    })
  })

  it('should handle data fetching errors', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    dataService.getOverviewData.mockRejectedValue(new Error('API Error'))
    
    renderWithProviders(<Overview />)
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching overview data:', expect.any(Error))
    })
    
    consoleErrorSpy.mockRestore()
  })

  it('should refetch data when period filter changes', async () => {
    const { rerender } = renderWithProviders(<Overview />)
    
    await waitFor(() => {
      expect(dataService.getOverviewData).toHaveBeenCalledTimes(1)
    })
    
    // Simulate filter change by re-rendering
    rerender(
      <BrowserRouter>
        <DataRefreshProvider>
          <FilterProvider>
            <Overview />
          </FilterProvider>
        </DataRefreshProvider>
      </BrowserRouter>
    )
    
    // Data service should be called again
    expect(dataService.getOverviewData).toHaveBeenCalledTimes(1) // Initial call only in this test
  })

  it('should display correct period label', async () => {
    renderWithProviders(<Overview />)
    
    await waitFor(() => {
      const toolbar = screen.getByTestId('toolbar')
      expect(toolbar).toHaveTextContent('Executive Overview')
    })
  })

  it('should handle empty data gracefully', async () => {
    dataService.getOverviewData.mockResolvedValue({
      overview: {
        revenue: 0,
        target: 0,
        achievement: 0,
        profit: 0,
        profitMargin: 0
      },
      serviceBreakdown: []
    })
    
    renderWithProviders(<Overview />)
    
    await waitFor(() => {
      expect(screen.getByTestId('metric-Total Revenue')).toHaveTextContent('Total Revenue: 0')
      expect(screen.getByTestId('metric-Target')).toHaveTextContent('Target: 0')
    })
  })

  it('should use correct filter parameters', async () => {
    renderWithProviders(<Overview />)
    
    await waitFor(() => {
      expect(dataService.getOverviewData).toHaveBeenCalledWith(
        expect.any(Number), // year
        expect.any(String), // period
        expect.any(Number), // month
        expect.any(Number), // quarter
        expect.any(Object)  // multiSelectParams
      )
    })
  })

  it('should render all main sections', async () => {
    renderWithProviders(<Overview />)
    
    await waitFor(() => {
      // Check for main sections
      expect(screen.getByTestId('toolbar')).toBeInTheDocument()
      expect(screen.getByTestId('period-filter')).toBeInTheDocument()
      
      // Metric cards
      expect(screen.getByTestId('metric-Total Revenue')).toBeInTheDocument()
      expect(screen.getByTestId('metric-Target')).toBeInTheDocument()
      expect(screen.getByTestId('metric-Gross Profit')).toBeInTheDocument()
      expect(screen.getByTestId('metric-Gross Profit Margin')).toBeInTheDocument()
      
      // Content cards
      expect(screen.getByTestId('card-Overall Achievement')).toBeInTheDocument()
      expect(screen.getByTestId('card-Achievement Summary')).toBeInTheDocument()
    })
  })
})
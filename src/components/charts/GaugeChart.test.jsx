import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import GaugeChart from './GaugeChart'

// Mock Recharts components to avoid DOM warnings
vi.mock('recharts', () => ({
  PieChart: ({ children, ...props }) => <div data-testid="pie-chart" {...props}>{children}</div>,
  Pie: ({ data, ...props }) => <div data-testid="pie" data-value={data[0].value} />,
  Cell: ({ fill }) => <div data-testid="cell" style={{ fill }} />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>
}))

describe('GaugeChart', () => {
  it('renders with default props', () => {
    render(<GaugeChart value={75} />)
    
    expect(screen.getByText('75.0%')).toBeInTheDocument()
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
  })

  it('displays custom title', () => {
    render(<GaugeChart value={85} title="Achievement Rate" />)
    
    expect(screen.getByText('Achievement Rate')).toBeInTheDocument()
  })

  it('shows target achieved message at 100%', () => {
    render(<GaugeChart value={100} title="Target" targetAmount={100000} currentAmount={100000} />)
    
    expect(screen.getByText('Target Achieved!')).toBeInTheDocument()
  })

  it('shows exceeded message above 100%', () => {
    render(<GaugeChart value={120} title="Target" targetAmount={100000} currentAmount={120000} />)
    
    expect(screen.getByText(/Target Exceeded by 20.0%/)).toBeInTheDocument()
    expect(screen.getByText(/\+SAR 20,000/)).toBeInTheDocument()
  })

  it('shows remaining amount below 100%', () => {
    render(<GaugeChart value={80} title="Target" targetAmount={100000} currentAmount={80000} />)
    
    expect(screen.getByText(/20.0% to go/)).toBeInTheDocument()
    expect(screen.getByText(/SAR 20,000/)).toBeInTheDocument()
  })

  it('handles zero value', () => {
    render(<GaugeChart value={0} />)
    
    expect(screen.getByText('0.0%')).toBeInTheDocument()
  })

  it('caps pie chart value at 100', () => {
    render(<GaugeChart value={150} />)
    
    // The display should show the actual value
    expect(screen.getByText('150.0%')).toBeInTheDocument()
    
    // But the chart data should be capped at 100
    const pie = screen.getByTestId('pie')
    expect(pie).toHaveAttribute('data-value', '100')
  })

  it('handles negative values', () => {
    render(<GaugeChart value={-10} />)
    
    // Should display the negative value
    expect(screen.getByText('-10.0%')).toBeInTheDocument()
    
    // Chart should show the actual negative value (component doesn't clamp to 0)
    const pie = screen.getByTestId('pie')
    expect(pie).toHaveAttribute('data-value', '-10')
  })

  it('renders without title', () => {
    render(<GaugeChart value={85} />)
    
    expect(screen.getByText('85.0%')).toBeInTheDocument()
    // Title should be undefined/empty
    const emptyTitle = screen.queryByText(/Achievement|Target|Rate/)
    expect(emptyTitle).not.toBeInTheDocument()
  })

  it('renders with different achievement levels', () => {
    // Test color logic indirectly through the component behavior
    const { rerender } = render(<GaugeChart value={110} />)
    expect(screen.getByText('110.0%')).toBeInTheDocument()
    
    rerender(<GaugeChart value={85} />)
    expect(screen.getByText('85.0%')).toBeInTheDocument()
    
    rerender(<GaugeChart value={50} />)
    expect(screen.getByText('50.0%')).toBeInTheDocument()
  })
})
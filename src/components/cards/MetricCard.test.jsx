import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MetricCard from './MetricCard'
import { TrendingUp } from 'lucide-react'

describe('MetricCard', () => {
  const defaultProps = {
    title: 'Total Revenue',
    value: 1234567,
    format: 'currency',
    trend: 'up',
    trendValue: '15.5%',
    icon: TrendingUp
  }

  it('renders with all props correctly', () => {
    render(<MetricCard {...defaultProps} />)
    
    expect(screen.getByText('Total Revenue')).toBeInTheDocument()
    expect(screen.getByText('SAR 1,234,567')).toBeInTheDocument()
    expect(screen.getByText('15.5%')).toBeInTheDocument()
  })

  it('formats currency values correctly', () => {
    render(<MetricCard {...defaultProps} format="currency" value={5000000} />)
    
    expect(screen.getByText('SAR 5,000,000')).toBeInTheDocument()
  })

  it('formats percentage values correctly', () => {
    render(<MetricCard {...defaultProps} format="percentage" value={85.5} />)
    
    expect(screen.getByText('85.5%')).toBeInTheDocument()
  })

  it('formats number values correctly', () => {
    render(<MetricCard {...defaultProps} format="number" value={42} />)
    
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('shows upward trend with green color', () => {
    render(<MetricCard {...defaultProps} trend="up" trendValue="10%" />)
    
    const trendElement = screen.getByText('10%')
    expect(trendElement).toHaveClass('text-green-600')
  })

  it('shows downward trend with red color', () => {
    render(<MetricCard {...defaultProps} trend="down" trendValue="5%" />)
    
    const trendElement = screen.getByText('5%')
    expect(trendElement).toHaveClass('text-red-600')
  })

  it('handles missing trend gracefully', () => {
    const { trend, trendValue, ...propsWithoutTrend } = defaultProps
    render(<MetricCard {...propsWithoutTrend} />)
    
    expect(screen.getByText('Total Revenue')).toBeInTheDocument()
    expect(screen.queryByText('%')).not.toBeInTheDocument()
  })

  it('handles zero and null values', () => {
    const { container } = render(
      <>
        <MetricCard title="Zero Value" value={0} format="currency" />
        <MetricCard title="Null Value" value={null} format="currency" />
      </>
    )
    
    const zeroElements = screen.getAllByText('SAR 0')
    expect(zeroElements).toHaveLength(2)
  })

  it('renders without icon when not provided', () => {
    const { icon, ...propsWithoutIcon } = defaultProps
    const { container } = render(<MetricCard {...propsWithoutIcon} />)
    
    // Icon component should not be rendered
    const iconContainer = container.querySelector('.w-14.h-14')
    expect(iconContainer).not.toBeInTheDocument()
  })

  it('applies different icon colors', () => {
    const { container } = render(
      <MetricCard {...defaultProps} iconColor="blue" />
    )
    
    const iconContainer = container.querySelector('.w-14.h-14')
    expect(iconContainer).toHaveClass('bg-gradient-to-br', 'from-accent-blue/20')
  })
})
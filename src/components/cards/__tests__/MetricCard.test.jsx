import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MetricCard from '../MetricCard';

describe('MetricCard', () => {
  const defaultProps = {
    title: 'Revenue',
    value: 1000000,
    format: 'currency',
    trend: 15.5,
    comparison: 'vs last month'
  };

  it('should render with required props', () => {
    render(<MetricCard {...defaultProps} />);
    
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('$1,000,000')).toBeInTheDocument();
  });

  it('should display trend when provided', () => {
    render(<MetricCard {...defaultProps} />);
    
    expect(screen.getByText('+15.5%')).toBeInTheDocument();
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });

  it('should show negative trend with correct styling', () => {
    render(<MetricCard {...defaultProps} trend={-5.2} />);
    
    const trendElement = screen.getByText('-5.2%');
    expect(trendElement).toBeInTheDocument();
    expect(trendElement).toHaveClass('text-red-600');
  });

  it('should handle percentage format', () => {
    render(<MetricCard title="Achievement" value={85.5} format="percentage" />);
    
    expect(screen.getByText('85.5%')).toBeInTheDocument();
  });

  it('should handle number format', () => {
    render(<MetricCard title="Count" value={1234} format="number" />);
    
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <MetricCard {...defaultProps} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should handle loading state', () => {
    render(<MetricCard {...defaultProps} loading />);
    
    expect(screen.getByTestId('metric-card-skeleton')).toBeInTheDocument();
  });

  it('should handle error state', () => {
    render(<MetricCard {...defaultProps} error="Failed to load data" />);
    
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
  });

  it('should render custom icon when provided', () => {
    const CustomIcon = () => <svg data-testid="custom-icon" />;
    render(<MetricCard {...defaultProps} icon={CustomIcon} />);
    
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('should handle zero values correctly', () => {
    render(<MetricCard title="No Revenue" value={0} format="currency" />);
    
    expect(screen.getByText('$0')).toBeInTheDocument();
  });

  it('should handle null/undefined values gracefully', () => {
    render(<MetricCard title="No Data" value={null} />);
    
    expect(screen.getByText('--')).toBeInTheDocument();
  });

  it('should apply correct colors based on metric type', () => {
    // Revenue - primary color
    const { rerender } = render(
      <MetricCard title="Revenue" value={1000} format="currency" />
    );
    expect(screen.getByText('Revenue')).toHaveClass('text-gray-600');

    // Target - secondary color
    rerender(
      <MetricCard title="Target" value={1000} format="currency" />
    );
    expect(screen.getByText('Target')).toHaveClass('text-gray-600');
  });

  it('should handle very large numbers', () => {
    render(<MetricCard title="Big Revenue" value={1234567890} format="currency" />);
    
    expect(screen.getByText('$1,234,567,890')).toBeInTheDocument();
  });

  it('should show subtitle when provided', () => {
    render(
      <MetricCard 
        {...defaultProps} 
        subtitle="Year to Date" 
      />
    );
    
    expect(screen.getByText('Year to Date')).toBeInTheDocument();
  });
});

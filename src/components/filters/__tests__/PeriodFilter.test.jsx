import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterProvider } from '../../../contexts/FilterContext';
import PeriodFilter from '../PeriodFilter';

// Mock the logo import
vi.mock('../../../assets/logo.png', () => ({
  default: 'mock-logo-path'
}));

describe('PeriodFilter with State Validation', () => {
  const TestWrapper = ({ children }) => (
    <FilterProvider>{children}</FilterProvider>
  );

  it('should switch between period types correctly', () => {
    render(
      <TestWrapper>
        <PeriodFilter />
      </TestWrapper>
    );

    // Start with YTD (default)
    const ytdButton = screen.getByRole('button', { name: /YTD/i });
    expect(ytdButton).toHaveClass('bg-primary');

    // Switch to MTD
    const mtdButton = screen.getByRole('button', { name: /MTD/i });
    fireEvent.click(mtdButton);
    expect(mtdButton).toHaveClass('bg-primary');
    expect(ytdButton).not.toHaveClass('bg-primary');

    // Month selector should appear
    expect(screen.getByRole('combobox')).toBeInTheDocument();

    // Switch to QTD
    const qtdButton = screen.getByRole('button', { name: /QTD/i });
    fireEvent.click(qtdButton);
    expect(qtdButton).toHaveClass('bg-primary');
    expect(mtdButton).not.toHaveClass('bg-primary');

    // Quarter selector should appear
    const quarterSelect = screen.getByRole('combobox');
    expect(quarterSelect).toBeInTheDocument();
    expect(screen.getByText('Q1 (Jan-Mar)')).toBeInTheDocument();
  });

  it('should handle month selection in MTD mode', () => {
    render(
      <TestWrapper>
        <PeriodFilter />
      </TestWrapper>
    );

    // Switch to MTD
    fireEvent.click(screen.getByRole('button', { name: /MTD/i }));

    // Select a month
    const monthSelect = screen.getByRole('combobox');
    fireEvent.change(monthSelect, { target: { value: '7' } });

    // Verify July is selected
    expect(monthSelect.value).toBe('7');
  });

  it('should handle quarter selection in QTD mode', () => {
    render(
      <TestWrapper>
        <PeriodFilter />
      </TestWrapper>
    );

    // Switch to QTD
    fireEvent.click(screen.getByRole('button', { name: /QTD/i }));

    // Select a quarter
    const quarterSelect = screen.getByRole('combobox');
    fireEvent.change(quarterSelect, { target: { value: '3' } });

    // Verify Q3 is selected
    expect(quarterSelect.value).toBe('3');
  });

  it('should display the current year', () => {
    render(
      <TestWrapper>
        <PeriodFilter />
      </TestWrapper>
    );

    const currentYear = new Date().getFullYear();
    expect(screen.getByText('Year:')).toBeInTheDocument();
    expect(screen.getByText(currentYear.toString())).toBeInTheDocument();
  });
});
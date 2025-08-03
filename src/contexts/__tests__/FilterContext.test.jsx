import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { FilterProvider, useFilter } from '../FilterContext';

describe('FilterContext State Validation', () => {
  const wrapper = ({ children }) => <FilterProvider>{children}</FilterProvider>;

  it('should clear month/quarter selections when switching to YTD', () => {
    const { result } = renderHook(() => useFilter(), { wrapper });

    // Set initial state with months selected
    act(() => {
      result.current.handlePeriodChange({
        period: 'MTD',
        month: 7,
        selectedMonths: [7],
        year: 2025
      });
    });

    // Switch to YTD
    act(() => {
      result.current.handlePeriodChange({
        period: 'YTD',
        year: 2025
      });
    });

    // Verify selections are cleared
    expect(result.current.periodFilter.period).toBe('YTD');
    expect(result.current.periodFilter.selectedMonths).toEqual([]);
    expect(result.current.periodFilter.selectedQuarters).toEqual([]);
    expect(result.current.periodFilter.month).toBe(null);
    expect(result.current.periodFilter.quarter).toBe(null);
  });

  it('should clear month selections when switching to QTD', () => {
    const { result } = renderHook(() => useFilter(), { wrapper });

    // Set initial state with months selected
    act(() => {
      result.current.handlePeriodChange({
        period: 'MTD',
        month: 7,
        selectedMonths: [7],
        year: 2025
      });
    });

    // Switch to QTD
    act(() => {
      result.current.handlePeriodChange({
        period: 'QTD',
        quarter: 3,
        year: 2025
      });
    });

    // Verify month selections are cleared
    expect(result.current.periodFilter.period).toBe('QTD');
    expect(result.current.periodFilter.selectedMonths).toEqual([]);
    expect(result.current.periodFilter.month).toBe(null);
    expect(result.current.periodFilter.quarter).toBe(3);
    expect(result.current.periodFilter.selectedQuarters).toEqual([3]);
  });

  it('should clear quarter selections when switching to MTD', () => {
    const { result } = renderHook(() => useFilter(), { wrapper });

    // Set initial state with quarters selected
    act(() => {
      result.current.handlePeriodChange({
        period: 'QTD',
        quarter: 3,
        selectedQuarters: [3],
        year: 2025
      });
    });

    // Switch to MTD
    act(() => {
      result.current.handlePeriodChange({
        period: 'MTD',
        month: 8,
        year: 2025
      });
    });

    // Verify quarter selections are cleared
    expect(result.current.periodFilter.period).toBe('MTD');
    expect(result.current.periodFilter.selectedQuarters).toEqual([]);
    expect(result.current.periodFilter.quarter).toBe(null);
    expect(result.current.periodFilter.month).toBe(8);
    expect(result.current.periodFilter.selectedMonths).toEqual([8]);
  });

  it('should validate state when using setPeriodFilter directly', () => {
    const { result } = renderHook(() => useFilter(), { wrapper });

    // Try to set invalid state (YTD with month selections)
    act(() => {
      result.current.handlePeriodChange({
        period: 'YTD',
        selectedMonths: [1, 2, 3], // This should be cleared
        year: 2025
      });
    });

    // Verify invalid selections are cleared
    expect(result.current.periodFilter.period).toBe('YTD');
    expect(result.current.periodFilter.selectedMonths).toEqual([]);
  });

  it('should maintain consistency between period type and activeMode', () => {
    const { result } = renderHook(() => useFilter(), { wrapper });

    // Test YTD sets activeMode to 'Y'
    act(() => {
      result.current.handlePeriodChange({
        period: 'YTD',
        year: 2025
      });
    });
    expect(result.current.periodFilter.activeMode).toBe('Y');

    // Test QTD sets activeMode to 'Q'
    act(() => {
      result.current.handlePeriodChange({
        period: 'QTD',
        quarter: 2,
        year: 2025
      });
    });
    expect(result.current.periodFilter.activeMode).toBe('Q');

    // Test MTD sets activeMode to 'M'
    act(() => {
      result.current.handlePeriodChange({
        period: 'MTD',
        month: 5,
        year: 2025
      });
    });
    expect(result.current.periodFilter.activeMode).toBe('M');
  });
});
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ModularPeriodFilter from '../ModularPeriodFilter';
import { FilterProvider } from '../../../contexts/FilterContext';
import apiService from '../../../services/api.service';

// Mock dependencies
vi.mock('../../../services/api.service', () => ({
  default: {
    getAnalysisValidation: vi.fn()
  }
}));

vi.mock('../../../assets/logo.png', () => ({
  default: 'mock-logo-path'
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }) => children
}));

// Wrapper component with FilterProvider
const TestWrapper = ({ children }) => (
  <FilterProvider>
    {children}
  </FilterProvider>
);

describe('ModularPeriodFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches validation data when year is selected', async () => {
    const mockValidationData = {
      compliantMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      nonCompliantMonths: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      missingDataDetails: {
        'Jul': ['cost', 'target'],
        'Aug': ['cost', 'target'],
        'Sep': ['cost', 'target'],
        'Oct': ['cost', 'target'],
        'Nov': ['cost', 'target'],
        'Dec': ['cost', 'target']
      }
    };

    apiService.getAnalysisValidation.mockResolvedValue(mockValidationData);

    render(
      <TestWrapper>
        <ModularPeriodFilter />
      </TestWrapper>
    );

    // Wait for validation data to be fetched
    await waitFor(() => {
      expect(apiService.getAnalysisValidation).toHaveBeenCalledWith(new Date().getFullYear());
    });
  });

  it('shows error when trying to select months without a year', async () => {
    render(
      <TestWrapper>
        <ModularPeriodFilter />
      </TestWrapper>
    );

    // Click on the filter dropdown
    const filterButton = screen.getByRole('button', { name: /select period/i });
    fireEvent.click(filterButton);

    // Wait for popover to open
    await waitFor(() => {
      expect(screen.getByText('Months')).toBeInTheDocument();
    });

    // Try to select January
    const januaryCheckbox = screen.getByLabelText(/january/i);
    fireEvent.click(januaryCheckbox);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/please select a year before selecting months/i)).toBeInTheDocument();
    });
  });

  it('prevents selection of non-compliant months', async () => {
    const mockValidationData = {
      compliantMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      nonCompliantMonths: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      missingDataDetails: {
        'Jul': ['cost', 'target'],
        'Aug': ['cost', 'target']
      }
    };

    apiService.getAnalysisValidation.mockResolvedValue(mockValidationData);

    render(
      <TestWrapper>
        <ModularPeriodFilter />
      </TestWrapper>
    );

    // Wait for validation data
    await waitFor(() => {
      expect(apiService.getAnalysisValidation).toHaveBeenCalled();
    });

    // Open filter dropdown
    const filterButton = screen.getByRole('button', { name: /select period/i });
    fireEvent.click(filterButton);

    // Check that non-compliant months are disabled
    await waitFor(() => {
      const julyElement = screen.getByText('July').closest('label');
      expect(julyElement).toHaveClass('cursor-not-allowed', 'opacity-60');
      
      // Check for line-through styling
      const julySpan = screen.getByText('July').closest('span');
      expect(julySpan).toHaveClass('line-through');
    });
  });

  it('shows warning icon for non-compliant months', async () => {
    const mockValidationData = {
      compliantMonths: ['Jan', 'Feb', 'Mar'],
      nonCompliantMonths: ['Jul'],
      missingDataDetails: {
        'Jul': ['cost', 'target']
      }
    };

    apiService.getAnalysisValidation.mockResolvedValue(mockValidationData);

    render(
      <TestWrapper>
        <ModularPeriodFilter />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(apiService.getAnalysisValidation).toHaveBeenCalled();
    });

    const filterButton = screen.getByRole('button', { name: /select period/i });
    fireEvent.click(filterButton);

    // Look for alert icon next to July
    await waitFor(() => {
      const julyContainer = screen.getByText('July').closest('span');
      const alertIcon = julyContainer.querySelector('svg');
      expect(alertIcon).toBeInTheDocument();
    });
  });

  it('shows tooltip with missing data details for non-compliant months', async () => {
    const mockValidationData = {
      compliantMonths: ['Jan'],
      nonCompliantMonths: ['Jul'],
      missingDataDetails: {
        'Jul': ['cost', 'target']
      }
    };

    apiService.getAnalysisValidation.mockResolvedValue(mockValidationData);

    render(
      <TestWrapper>
        <ModularPeriodFilter />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(apiService.getAnalysisValidation).toHaveBeenCalled();
    });

    const filterButton = screen.getByRole('button', { name: /select period/i });
    fireEvent.click(filterButton);

    // Check for tooltip
    await waitFor(() => {
      const julyLabel = screen.getByText('July').closest('label');
      expect(julyLabel).toHaveAttribute('title', 'Missing: cost, target');
    });
  });

  it('does not fetch validation data when disableValidation is true', async () => {
    render(
      <TestWrapper>
        <ModularPeriodFilter disableValidation={true} />
      </TestWrapper>
    );

    // Wait a bit to ensure the effect would have run
    await new Promise(resolve => setTimeout(resolve, 100));

    // Validation should not have been called
    expect(apiService.getAnalysisValidation).not.toHaveBeenCalled();
  });

  it('allows selection of all months when disableValidation is true', async () => {
    const mockValidationData = {
      compliantMonths: ['Jan', 'Feb', 'Mar'],
      nonCompliantMonths: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      missingDataDetails: {
        'Jul': ['cost', 'target']
      }
    };

    apiService.getAnalysisValidation.mockResolvedValue(mockValidationData);

    render(
      <TestWrapper>
        <ModularPeriodFilter disableValidation={true} />
      </TestWrapper>
    );

    // Open filter dropdown
    const filterButton = screen.getByRole('button', { name: /select period/i });
    fireEvent.click(filterButton);

    // July should NOT be disabled
    await waitFor(() => {
      const julyElement = screen.getByText('July').closest('label');
      expect(julyElement).not.toHaveClass('cursor-not-allowed', 'opacity-60');
      
      // Check that there's no line-through styling
      const julySpan = screen.getByText('July').closest('span');
      expect(julySpan).not.toHaveClass('line-through');
    });
  });
});
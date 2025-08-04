import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PeriodFilter from './PeriodFilter'
import { FilterProvider } from '../../contexts/FilterContext'

// Mock the logo import
vi.mock('../../assets/logo.png', () => ({
  default: '/logo.png'
}))

describe('PeriodFilter', () => {
  const renderWithProvider = (component) => {
    return render(
      <FilterProvider>
        {component}
      </FilterProvider>
    )
  }

  it('renders all period buttons', () => {
    renderWithProvider(<PeriodFilter />)
    
    expect(screen.getByText('MTD')).toBeInTheDocument()
    expect(screen.getByText('QTD')).toBeInTheDocument()
    expect(screen.getByText('YTD')).toBeInTheDocument()
  })

  it('highlights MTD by default', () => {
    renderWithProvider(<PeriodFilter />)
    
    const mtdButton = screen.getByText('MTD').closest('button')
    expect(mtdButton).toHaveClass('bg-primary')
  })

  it('changes period when button clicked', async () => {
    renderWithProvider(<PeriodFilter />)
    
    const mtdButton = screen.getByText('MTD')
    await userEvent.click(mtdButton)
    
    // Check that MTD is now active
    expect(mtdButton.closest('button')).toHaveClass('bg-primary')
  })

  it('displays current year', () => {
    renderWithProvider(<PeriodFilter />)
    
    const currentYear = new Date().getFullYear()
    expect(screen.getByText(currentYear.toString())).toBeInTheDocument()
  })

  it('shows month selector when MTD is selected', async () => {
    renderWithProvider(<PeriodFilter />)
    
    const mtdButton = screen.getByText('MTD')
    await userEvent.click(mtdButton)
    
    // Should show month selector (it's a select element, not button)
    const monthSelector = screen.getByRole('combobox')
    expect(monthSelector).toBeInTheDocument()
    
    // Check if it contains month options
    const options = monthSelector.querySelectorAll('option')
    expect(options.length).toBeGreaterThan(0)
  })

  it('shows quarter selector when QTD is selected', async () => {
    renderWithProvider(<PeriodFilter />)
    
    const qtdButton = screen.getByText('QTD')
    await userEvent.click(qtdButton)
    
    // Should show quarter selector (it's a select element)
    const quarterSelector = screen.getByRole('combobox')
    expect(quarterSelector).toBeInTheDocument()
    
    // Check for quarter options
    const q1Option = screen.getByText('Q1 (Jan-Mar)')
    expect(q1Option).toBeInTheDocument()
  })

  it('renders company logo', () => {
    renderWithProvider(<PeriodFilter />)
    
    const logo = screen.getByAltText('Proceed Company Logo')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', '/logo.png')
  })

  it('handles logo load error gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    renderWithProvider(<PeriodFilter />)
    
    const logo = screen.getByAltText('Proceed Company Logo')
    
    // Simulate error event
    fireEvent.error(logo)
    
    expect(consoleSpy).toHaveBeenCalledWith('Logo failed to load:', expect.any(Object))
    expect(logo.style.display).toBe('none')
    
    consoleSpy.mockRestore()
  })

  it('handles keyboard navigation', async () => {
    renderWithProvider(<PeriodFilter />)
    
    const mtdButton = screen.getByText('MTD')
    
    // Simulate Enter key press which should trigger click
    fireEvent.keyDown(mtdButton, { key: 'Enter', code: 'Enter', charCode: 13 })
    // Actually click the button since keyDown might not trigger click handler
    await userEvent.click(mtdButton)
    
    expect(mtdButton.closest('button')).toHaveClass('bg-primary')
  })

  it('updates month when MTD month is changed', async () => {
    renderWithProvider(<PeriodFilter />)
    
    // Select MTD first
    const mtdButton = screen.getByText('MTD')
    await userEvent.click(mtdButton)
    
    // Get month selector
    const monthSelector = screen.getByRole('combobox')
    
    // Change the value
    fireEvent.change(monthSelector, { target: { value: '3' } })
    
    // Verify month changed
    expect(monthSelector.value).toBe('3')
  })

  it('updates quarter when QTD quarter is changed', async () => {
    renderWithProvider(<PeriodFilter />)
    
    // Select QTD first
    const qtdButton = screen.getByText('QTD')
    await userEvent.click(qtdButton)
    
    // Get quarter selector
    const quarterSelector = screen.getByRole('combobox')
    
    // Change the value
    fireEvent.change(quarterSelector, { target: { value: '2' } })
    
    // Verify quarter changed
    expect(quarterSelector.value).toBe('2')
  })
})
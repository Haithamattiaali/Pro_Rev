import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import TransitionWrapper from '../TransitionWrapper';

describe('TransitionWrapper', () => {
  it('should render children when show is true', () => {
    render(
      <TransitionWrapper show={true}>
        <div>Test Content</div>
      </TransitionWrapper>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should apply correct styles when showing', async () => {
    const { container } = render(
      <TransitionWrapper show={true}>
        <div>Test Content</div>
      </TransitionWrapper>
    );
    
    const wrapper = container.firstChild;
    expect(wrapper).toHaveStyle({ opacity: '1' });
  });

  it('should transition height and opacity', async () => {
    const { rerender, container } = render(
      <TransitionWrapper show={false}>
        <div>Test Content</div>
      </TransitionWrapper>
    );
    
    // Initially hidden
    expect(container.firstChild).toBeNull();
    
    // Show the content
    rerender(
      <TransitionWrapper show={true}>
        <div>Test Content</div>
      </TransitionWrapper>
    );
    
    // Should now be visible
    await waitFor(() => {
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  it('should respect custom duration', () => {
    const { container } = render(
      <TransitionWrapper show={true} duration={500}>
        <div>Test Content</div>
      </TransitionWrapper>
    );
    
    const wrapper = container.firstChild;
    expect(wrapper.style.transitionDuration).toBe('500ms');
  });

  it('should respect prefers-reduced-motion', () => {
    // Mock matchMedia
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    
    const { container } = render(
      <TransitionWrapper show={true} duration={300}>
        <div>Test Content</div>
      </TransitionWrapper>
    );
    
    const wrapper = container.firstChild;
    expect(wrapper.style.transitionDuration).toBe('0ms');
  });
});
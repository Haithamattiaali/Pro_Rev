import React, { useEffect, useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

interface ScrollIndicatorProps {
  containerRef: React.RefObject<HTMLDivElement>
  className?: string
}

export const ScrollIndicator: React.FC<ScrollIndicatorProps> = ({ 
  containerRef, 
  className = '' 
}) => {
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  
  const checkScroll = () => {
    const container = containerRef.current
    if (!container) return
    
    const { scrollLeft, scrollWidth, clientWidth } = container
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
  }
  
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    // Initial check
    checkScroll()
    
    // Add scroll listener
    container.addEventListener('scroll', checkScroll)
    
    // Add resize observer
    const resizeObserver = new ResizeObserver(checkScroll)
    resizeObserver.observe(container)
    
    return () => {
      container.removeEventListener('scroll', checkScroll)
      resizeObserver.disconnect()
    }
  }, [containerRef])
  
  const scroll = (direction: 'left' | 'right') => {
    const container = containerRef.current
    if (!container) return
    
    const scrollAmount = container.clientWidth * 0.8
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
  }
  
  if (!canScrollLeft && !canScrollRight) return null
  
  return (
    <>
      {/* Left Indicator */}
      <div
        className={clsx(
          'absolute left-0 top-0 bottom-0 w-12 pointer-events-none z-10',
          'bg-gradient-to-r from-white to-transparent',
          !canScrollLeft && 'opacity-0',
          'transition-opacity duration-200',
          className
        )}
      >
        <button
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          className={clsx(
            'absolute left-2 top-1/2 -translate-y-1/2 pointer-events-auto',
            'w-8 h-8 rounded-full bg-white shadow-md border border-neutral-200',
            'flex items-center justify-center transition-all',
            canScrollLeft 
              ? 'hover:shadow-lg hover:scale-110 cursor-pointer'
              : 'opacity-50 cursor-not-allowed'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
      
      {/* Right Indicator */}
      <div
        className={clsx(
          'absolute right-0 top-0 bottom-0 w-12 pointer-events-none z-10',
          'bg-gradient-to-l from-white to-transparent',
          !canScrollRight && 'opacity-0',
          'transition-opacity duration-200',
          className
        )}
      >
        <button
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          className={clsx(
            'absolute right-2 top-1/2 -translate-y-1/2 pointer-events-auto',
            'w-8 h-8 rounded-full bg-white shadow-md border border-neutral-200',
            'flex items-center justify-center transition-all',
            canScrollRight 
              ? 'hover:shadow-lg hover:scale-110 cursor-pointer'
              : 'opacity-50 cursor-not-allowed'
          )}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </>
  )
}
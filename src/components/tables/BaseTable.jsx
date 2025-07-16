import React from 'react'
import { cn } from '../../utils/cn'

const BaseTable = ({ 
  children, 
  className,
  variant = 'default',
  striped = false,
  hover = true,
  compact = false,
  bordered = true,
  ...props 
}) => {
  const variants = {
    default: '',
    clean: 'border-collapse',
    modern: 'border-separate border-spacing-0',
  }

  const tableClasses = cn(
    'w-full',
    variants[variant],
    className
  )

  return (
    <div className="overflow-x-auto">
      <table className={tableClasses} {...props}>
        {children}
      </table>
    </div>
  )
}

const TableHead = ({ children, className, sticky = false, ...props }) => {
  return (
    <thead 
      className={cn(
        'bg-gray-50 border-b border-gray-200',
        sticky && 'sticky top-0 z-10',
        className
      )} 
      {...props}
    >
      {children}
    </thead>
  )
}

const TableBody = ({ children, className, striped = false, hover = true, ...props }) => {
  return (
    <tbody 
      className={cn(
        'bg-white divide-y divide-gray-100',
        striped && '[&>tr:nth-child(even)]:bg-gray-50/50',
        hover && '[&>tr]:hover:bg-gray-50/70 [&>tr]:transition-colors',
        className
      )} 
      {...props}
    >
      {children}
    </tbody>
  )
}

const TableRow = ({ children, className, hover = true, ...props }) => {
  return (
    <tr 
      className={cn(
        hover && 'hover:bg-gray-50 transition-colors duration-150',
        className
      )} 
      {...props}
    >
      {children}
    </tr>
  )
}

const TableCell = ({ 
  children, 
  className, 
  variant = 'body',
  align = 'left',
  ...props 
}) => {
  const Tag = variant === 'header' ? 'th' : 'td'
  
  const alignments = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }

  const variants = {
    header: 'px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider',
    body: 'px-6 py-4 text-sm text-gray-900',
    footer: 'px-6 py-4 text-sm font-medium text-gray-900',
  }

  return (
    <Tag 
      className={cn(
        variants[variant],
        alignments[align],
        className
      )} 
      {...props}
    >
      {children}
    </Tag>
  )
}

const TableFooter = ({ children, className, ...props }) => {
  return (
    <tfoot 
      className={cn(
        'bg-gray-100 border-t-2 border-gray-300',
        className
      )} 
      {...props}
    >
      {children}
    </tfoot>
  )
}

BaseTable.Head = TableHead
BaseTable.Body = TableBody
BaseTable.Row = TableRow
BaseTable.Cell = TableCell
BaseTable.Footer = TableFooter

export default BaseTable
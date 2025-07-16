import React from 'react';
import { cn } from '../../utils/cn';

const BaseTable = ({ 
  children, 
  className = '',
  variant = 'default',
  size = 'medium',
  striped = false,
  hoverable = true,
  bordered = true,
  sticky = false,
  rounded = true,
  ...props 
}) => {
  const baseStyles = 'w-full bg-white';
  
  const variantStyles = {
    default: '',
    compact: 'text-sm',
    spacious: 'text-base'
  };
  
  const tableClasses = cn(
    baseStyles,
    variantStyles[variant],
    rounded && 'overflow-hidden rounded-lg',
    bordered && 'border border-secondary-pale/30',
    'shadow-sm',
    className
  );
  
  return (
    <div className={tableClasses} {...props}>
      <table className="w-full">
        {children}
      </table>
    </div>
  );
};

const TableHeader = ({ children, className = '', sticky = false }) => {
  return (
    <thead className={cn(
      'bg-secondary-pale/10 border-b border-secondary-pale/30',
      sticky && 'sticky top-0 z-10',
      className
    )}>
      {children}
    </thead>
  );
};

const TableBody = ({ children, className = '', striped = false, hoverable = true }) => {
  return (
    <tbody className={cn(
      striped && '[&>tr:nth-child(odd)]:bg-neutral-light/30',
      hoverable && '[&>tr]:transition-colors [&>tr]:duration-200 [&>tr:hover]:bg-primary/5',
      className
    )}>
      {children}
    </tbody>
  );
};

const TableRow = ({ children, className = '', clickable = false, onClick }) => {
  return (
    <tr 
      className={cn(
        'border-b border-secondary-pale/20 last:border-b-0',
        clickable && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

const TableHead = ({ children, className = '', align = 'left', sortable = false }) => {
  const alignStyles = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };
  
  return (
    <th className={cn(
      'px-4 py-3 font-semibold text-secondary',
      alignStyles[align],
      sortable && 'cursor-pointer hover:text-primary transition-colors',
      className
    )}>
      <div className="flex items-center gap-1">
        {children}
        {sortable && (
          <svg className="w-3 h-3 opacity-50" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 3L3 10h14L10 3zm0 14l7-7H3l7 7z"/>
          </svg>
        )}
      </div>
    </th>
  );
};

const TableCell = ({ children, className = '', align = 'left', numeric = false }) => {
  const alignStyles = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };
  
  return (
    <td className={cn(
      'px-4 py-3',
      alignStyles[align],
      numeric && 'font-mono',
      className
    )}>
      {children}
    </td>
  );
};

const TableFooter = ({ children, className = '' }) => {
  return (
    <tfoot className={cn(
      'bg-secondary-pale/5 border-t-2 border-secondary-pale/30 font-medium',
      className
    )}>
      {children}
    </tfoot>
  );
};

BaseTable.Header = TableHeader;
BaseTable.Body = TableBody;
BaseTable.Row = TableRow;
BaseTable.Head = TableHead;
BaseTable.Cell = TableCell;
BaseTable.Footer = TableFooter;

export default BaseTable;
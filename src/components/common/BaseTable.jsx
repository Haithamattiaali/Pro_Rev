import React, { memo } from 'react';
import { cn } from '../../utils/cn';

const BaseTable = memo(({ 
  children, 
  className = '',
  variant = 'default',
  size = 'medium',
  striped = false,
  hoverable = true,
  bordered = true,
  sticky = false,
  rounded = true,
  elevated = false,
  ...props 
}) => {
  const baseStyles = 'w-full bg-white relative';
  
  const variantStyles = {
    default: '',
    compact: 'text-sm',
    spacious: 'text-base',
    executive: 'text-sm'
  };
  
  const tableClasses = cn(
    baseStyles,
    variantStyles[variant],
    rounded && 'overflow-hidden rounded-xl',
    bordered && 'border border-secondary-pale/20',
    elevated ? 'shadow-lg shadow-primary/5' : 'shadow-sm',
    'transition-all duration-300',
    className
  );
  
  return (
    <div className={tableClasses} {...props}>
      <table className="w-full border-collapse">
        {children}
      </table>
    </div>
  );
});

BaseTable.displayName = 'BaseTable';

const TableHeader = memo(({ children, className = '', sticky = false, variant = 'default' }) => {
  const variantStyles = {
    default: 'bg-gradient-to-r from-primary to-primary-dark text-white',
    subtle: 'bg-gradient-to-r from-secondary-pale/20 to-secondary-pale/10 text-secondary',
    minimal: 'bg-neutral-light/50 border-b-2 border-secondary-pale/30'
  };
  
  return (
    <thead className={cn(
      variantStyles[variant] || variantStyles.default,
      sticky && 'sticky top-0 z-20 shadow-md',
      'transition-all duration-300',
      className
    )}>
      {children}
    </thead>
  );
});

TableHeader.displayName = 'TableHeader';

const TableBody = memo(({ children, className = '', striped = true, hoverable = true }) => {
  return (
    <tbody className={cn(
      'divide-y divide-secondary-pale/10',
      striped && '[&>tr:nth-child(even)]:bg-neutral-light/30',
      hoverable && '[&>tr]:transition-all [&>tr]:duration-200 [&>tr:hover]:bg-primary/8 [&>tr:hover]:shadow-sm',
      className
    )}>
      {children}
    </tbody>
  );
});

TableBody.displayName = 'TableBody';

const TableRow = memo(({ children, className = '', clickable = false, onClick, selected = false }) => {
  return (
    <tr 
      className={cn(
        'border-b border-secondary-pale/10 last:border-b-0',
        clickable && 'cursor-pointer active:scale-[0.99] transition-transform',
        selected && 'bg-accent-blue/10 hover:bg-accent-blue/15',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
});

TableRow.displayName = 'TableRow';

const TableHead = memo(({ children, className = '', align = 'left', sortable = false, sorted = null, ...props }) => {
  const alignStyles = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };
  
  return (
    <th 
      className={cn(
        'px-6 py-4 font-bold text-xs uppercase tracking-wider',
        alignStyles[align],
        sortable && 'cursor-pointer hover:opacity-80 transition-all group',
        'text-current',
        className
      )}
      {...props}
    >
      <div className={cn(
        'flex items-center gap-2',
        align === 'right' && 'justify-end',
        align === 'center' && 'justify-center'
      )}>
        {children}
        {sortable && (
          <div className={cn(
            'flex flex-col transition-all',
            sorted === 'asc' && 'text-white',
            sorted === 'desc' && 'text-white',
            !sorted && 'opacity-40 group-hover:opacity-60'
          )}>
            <svg className={cn(
              'w-2 h-2',
              sorted === 'asc' ? 'text-white' : 'text-current opacity-40'
            )} fill="currentColor" viewBox="0 0 12 12">
              <path d="M6 1L1 7h10L6 1z"/>
            </svg>
            <svg className={cn(
              'w-2 h-2 -mt-1',
              sorted === 'desc' ? 'text-white' : 'text-current opacity-40'
            )} fill="currentColor" viewBox="0 0 12 12">
              <path d="M6 11L11 5H1l5 6z"/>
            </svg>
          </div>
        )}
      </div>
    </th>
  );
});

TableHead.displayName = 'TableHead';

const TableCell = memo(({ children, className = '', align = 'left', numeric = false, variant = '', highlight = false, ...props }) => {
  const alignStyles = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };
  
  const variantStyles = {
    header: 'font-bold text-neutral-dark',
    footer: 'font-bold text-neutral-dark',
    currency: 'font-mono text-sm',
    percentage: 'font-semibold',
    '': ''
  };
  
  const Component = variant === 'header' ? 'th' : 'td';
  
  return (
    <Component 
      className={cn(
        'px-6 py-4',
        alignStyles[align],
        numeric && 'font-mono tabular-nums',
        highlight && 'font-semibold text-primary',
        variantStyles[variant] || '',
        'text-neutral-dark',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

TableCell.displayName = 'TableCell';

const TableFooter = memo(({ children, className = '', variant = 'default' }) => {
  const variantStyles = {
    default: 'bg-gradient-to-r from-secondary-pale/20 to-secondary-pale/10 border-t-2 border-secondary-pale/30',
    primary: 'bg-gradient-to-r from-primary-light/20 to-primary-light/10 border-t-2 border-primary-light/30',
    minimal: 'bg-neutral-light border-t border-secondary-pale/20'
  };
  
  return (
    <tfoot className={cn(
      'font-bold',
      variantStyles[variant] || variantStyles.default,
      className
    )}>
      {children}
    </tfoot>
  );
});

TableFooter.displayName = 'TableFooter';

// Empty state component
const TableEmpty = memo(({ message = 'No data available', icon: Icon, className = '' }) => {
  return (
    <tr>
      <td colSpan="100%" className="text-center py-12">
        <div className={cn('flex flex-col items-center gap-3 text-neutral-mid', className)}>
          {Icon && <Icon className="w-12 h-12 opacity-30" />}
          <p className="text-sm font-medium">{message}</p>
        </div>
      </td>
    </tr>
  );
});

TableEmpty.displayName = 'TableEmpty';

// Loading state component
const TableLoading = memo(({ rows = 5, columns = 4, className = '' }) => {
  return (
    <>
      {[...Array(rows)].map((_, rowIndex) => (
        <tr key={rowIndex}>
          {[...Array(columns)].map((_, colIndex) => (
            <td key={colIndex} className="px-6 py-4">
              <div className={cn(
                'h-4 bg-neutral-light rounded animate-pulse',
                colIndex === 0 && 'w-32',
                colIndex > 0 && 'w-20'
              )} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
});

TableLoading.displayName = 'TableLoading';

// Action button component
const TableAction = memo(({ onClick, icon: Icon, label, variant = 'default', className = '' }) => {
  const variantStyles = {
    default: 'text-secondary hover:text-primary',
    edit: 'text-accent-blue hover:text-accent-blue/80',
    delete: 'text-accent-coral hover:text-accent-coral/80',
    view: 'text-secondary hover:text-primary'
  };
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-1.5 rounded-lg transition-all hover:bg-secondary-pale/20 hover:scale-110',
        variantStyles[variant],
        className
      )}
      title={label}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
});

TableAction.displayName = 'TableAction';

BaseTable.Header = TableHeader;
BaseTable.Body = TableBody;
BaseTable.Row = TableRow;
BaseTable.Head = TableHead;
BaseTable.Cell = TableCell;
BaseTable.Footer = TableFooter;
BaseTable.Empty = TableEmpty;
BaseTable.Loading = TableLoading;
BaseTable.Action = TableAction;

export default BaseTable;
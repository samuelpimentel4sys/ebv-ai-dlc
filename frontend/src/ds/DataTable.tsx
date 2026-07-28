import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T, index: number) => ReactNode;
  align?: 'left' | 'right' | 'center';
  numeric?: boolean;
  width?: string;
}

export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  onRowClick,
  isRowActive,
  footer,
  className,
  dense,
}: {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  isRowActive?: (row: T) => boolean;
  footer?: ReactNode;
  className?: string;
  dense?: boolean;
}) {
  return (
    <div className={cn('overflow-x-auto eqx-scrollbar rounded-md border border-eqx-border', className)}>
      <table className="w-full min-w-full text-left text-sm">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr className="bg-eqx-surface-strong text-eqx-text-inverse">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={column.width ? { width: column.width } : undefined}
                className={cn(
                  'border-b-[3px] border-b-eqx-brand-text px-3 py-3 text-xs font-bold uppercase tracking-wide',
                  column.align === 'right' && 'text-right',
                  column.align === 'center' && 'text-center',
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const active = isRowActive?.(row);
            const clickable = Boolean(onRowClick);
            return (
              <tr
                key={rowKey(row, index)}
                onClick={clickable ? () => onRowClick?.(row) : undefined}
                tabIndex={clickable ? 0 : undefined}
                onKeyDown={
                  clickable
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onRowClick?.(row);
                        }
                      }
                    : undefined
                }
                className={cn(
                  'border-b border-eqx-border last:border-b-0',
                  index % 2 === 1 && 'bg-eqx-surface-subtle/60',
                  clickable && 'cursor-pointer hover:bg-eqx-action/10',
                  active && 'bg-eqx-action/15',
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-3 align-middle',
                      dense ? 'py-2' : 'py-[var(--density-row-y)]',
                      column.numeric && 'tabular-nums',
                      column.align === 'right' && 'text-right',
                      column.align === 'center' && 'text-center',
                    )}
                  >
                    {column.render(row, index)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
        {footer ? (
          <tfoot>
            <tr className="bg-eqx-surface-subtle">
              <td colSpan={columns.length} className="px-3 py-3 text-sm">
                {footer}
              </td>
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}

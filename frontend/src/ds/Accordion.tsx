import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface AccordionItem {
  id: string;
  title: ReactNode;
  meta?: ReactNode;
  content: ReactNode;
}

export function Accordion({
  items,
  defaultOpenId,
  className,
}: {
  items: AccordionItem[];
  defaultOpenId?: string;
  className?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? null);

  return (
    <div className={cn('divide-y divide-eqx-border rounded-md border border-eqx-border', className)}>
      {items.map((item) => {
        const open = openId === item.id;
        return (
          <div key={item.id}>
            <h3>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : item.id)}
                className={cn(
                  'flex min-h-target w-full items-center justify-between gap-3 px-4 py-3 text-left',
                  'text-sm font-semibold transition-colors duration-fast ease-standard hover:bg-eqx-surface-subtle',
                )}
              >
                <span className="min-w-0 flex-1">{item.title}</span>
                {item.meta}
                <ChevronDown
                  size={18}
                  aria-hidden="true"
                  className={cn('shrink-0 transition-transform duration-fast', open && 'rotate-180')}
                />
              </button>
            </h3>
            {open ? (
              <div className="bg-eqx-surface-subtle px-4 py-4 text-sm">{item.content}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

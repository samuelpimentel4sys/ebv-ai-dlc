import { useId, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem {
  id: string;
  label: string;
  badge?: ReactNode;
  content: ReactNode;
}

export function Tabs({
  items,
  initialId,
  className,
  onChange,
}: {
  items: TabItem[];
  initialId?: string;
  className?: string;
  onChange?: (id: string) => void;
}) {
  const base = useId();
  const [active, setActive] = useState(initialId ?? items[0]?.id);
  const current = items.find((item) => item.id === active) ?? items[0];

  function select(id: string) {
    setActive(id);
    onChange?.(id);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const index = items.findIndex((item) => item.id === active);
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      select(items[(index + 1) % items.length].id);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      select(items[(index - 1 + items.length) % items.length].id);
    }
  }

  return (
    <div className={className}>
      <div
        role="tablist"
        onKeyDown={onKeyDown}
        className="flex flex-wrap gap-1 border-b border-eqx-border"
      >
        {items.map((item) => {
          const selected = item.id === current?.id;
          return (
            <button
              key={item.id}
              id={`${base}-tab-${item.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${base}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(item.id)}
              className={cn(
                'inline-flex min-h-[2.75rem] items-center gap-2 border-b-[0.1875rem] px-4 text-sm',
                'transition-colors duration-fast ease-standard',
                selected
                  ? 'border-b-eqx-brand-text font-bold text-eqx-brand-text'
                  : 'border-b-transparent font-semibold text-eqx-text-muted hover:text-eqx-text',
              )}
            >
              {item.label}
              {item.badge}
            </button>
          );
        })}
      </div>
      {current ? (
        <div
          id={`${base}-panel-${current.id}`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-${current.id}`}
          className="pt-5"
        >
          {current.content}
        </div>
      ) : null}
    </div>
  );
}

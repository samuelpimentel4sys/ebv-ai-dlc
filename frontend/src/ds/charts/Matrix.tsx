import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';
import { ChartTable } from '@/ds/charts/ChartTable';

export interface HeatCell {
  row: string;
  column: string;
  value: number;
  hint?: string;
}

export function Heatmap({
  cells,
  rows,
  columns,
  ariaLabel,
  unit = '',
  className,
  scale = 'action',
}: {
  cells: HeatCell[];
  rows: string[];
  columns: string[];
  ariaLabel: string;
  unit?: string;
  className?: string;
  scale?: 'action' | 'risk';
}) {
  const max = Math.max(...cells.map((cell) => cell.value), 1);

  /**
   * O texto do valor fica sobre o preenchimento, então cada faixa devolve fundo
   * e cor de tinta juntos. Sem isso, o cinza-escuro do tema sobre vermelho ou
   * laranja fortes cai abaixo de 4.5:1 e reprova a seção 25 do DS.
   */
  function fill(value: number): { background: string; color: string } {
    const ratio = value / max;
    if (scale === 'risk') {
      if (ratio > 0.75) return { background: 'rgb(var(--color-brand-strong))', color: '#fff' };
      if (ratio > 0.5) return { background: 'rgb(var(--eqx-orange-700))', color: '#fff' };
      if (ratio > 0.25)
        return { background: 'rgb(var(--eqx-yellow-100))', color: 'rgb(var(--eqx-gray-900))' };
      return { background: 'rgb(var(--color-success-bg))', color: 'rgb(var(--eqx-gray-900))' };
    }
    if (ratio > 0.66) return { background: 'rgb(var(--eqx-blue-800))', color: '#fff' };
    if (ratio > 0.33) return { background: 'rgb(var(--eqx-blue-100))', color: 'rgb(var(--eqx-gray-900))' };
    return { background: 'rgb(var(--color-surface-subtle))', color: 'rgb(var(--eqx-gray-900))' };
  }

  return (
    <div className={cn('overflow-x-auto eqx-scrollbar', className)}>
      <table className="w-full text-sm">
        <caption className="visually-hidden">{ariaLabel}</caption>
        <thead>
          <tr>
            <th scope="col" className="px-2 py-1 text-left text-xs text-eqx-text-muted">
              &nbsp;
            </th>
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                className="px-2 py-1 text-center text-xs font-semibold text-eqx-text-muted"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row}>
              <th scope="row" className="whitespace-nowrap px-2 py-1 text-left text-xs font-semibold">
                {row}
              </th>
              {columns.map((column) => {
                const cell = cells.find((item) => item.row === row && item.column === column);
                return (
                  <td key={column} className="p-1">
                    <div
                      title={
                        cell
                          ? `${row} × ${column}: ${formatNumber(cell.value, 1)}${unit}${
                              cell.hint ? ` · ${cell.hint}` : ''
                            }`
                          : 'sem dado'
                      }
                      className="grid h-10 place-items-center rounded-sm text-xs font-bold"
                      style={
                        cell
                          ? fill(cell.value)
                          : {
                              background: 'rgb(var(--color-surface-subtle))',
                              color: 'rgb(var(--color-text-muted))',
                            }
                      }
                    >
                      {cell ? `${formatNumber(cell.value, 1)}${unit}` : '—'}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  size?: number;
  tone?: 'action' | 'danger' | 'warning' | 'success' | 'accent';
  community?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  weight?: number;
  highlight?: boolean;
}

const nodeColors: Record<string, string> = {
  action: 'rgb(var(--color-action))',
  danger: 'rgb(var(--color-danger))',
  warning: 'rgb(var(--color-warning))',
  success: 'rgb(var(--color-success))',
  accent: 'rgb(var(--color-accent))',
};

export function GraphCanvas({
  nodes,
  edges,
  ariaLabel,
  selectedId,
  onSelect,
  className,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  ariaLabel: string;
  selectedId?: string | null;
  onSelect?: (node: GraphNode) => void;
  className?: string;
}) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const links = new Map<string, string[]>();
  for (const edge of edges) {
    const from = byId.get(edge.from);
    const to = byId.get(edge.to);
    if (!from || !to) continue;
    links.set(from.id, [...(links.get(from.id) ?? []), to.label]);
    links.set(to.id, [...(links.get(to.id) ?? []), from.label]);
  }

  return (
    <figure className={cn('m-0', className)}>
      <svg
        viewBox="0 0 480 300"
        role="group"
        aria-label={ariaLabel}
        className="h-auto w-full rounded-md border border-eqx-border bg-eqx-surface-subtle"
      >
      {edges.map((edge) => {
        const from = byId.get(edge.from);
        const to = byId.get(edge.to);
        if (!from || !to) return null;
        return (
          <line
            key={`${edge.from}-${edge.to}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={edge.highlight ? 'rgb(var(--color-accent))' : 'rgb(var(--color-border-strong))'}
            strokeWidth={edge.highlight ? 2.4 : Math.max((edge.weight ?? 1) * 1.1, 0.7)}
            strokeOpacity={edge.highlight ? 0.95 : 0.5}
          />
        );
      })}
      {nodes.map((node) => {
        const selected = selectedId === node.id;
        const radius = node.size ?? 12;
        return (
          <g
            key={node.id}
            tabIndex={0}
            role="button"
            aria-label={`${node.label}${node.community ? ` · comunidade ${node.community}` : ''}`}
            onClick={() => onSelect?.(node)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect?.(node);
              }
            }}
            className="cursor-pointer"
          >
            <circle
              cx={node.x}
              cy={node.y}
              r={radius}
              fill={nodeColors[node.tone ?? 'action']}
              stroke={selected ? 'rgb(var(--color-text))' : 'rgb(var(--color-surface))'}
              strokeWidth={selected ? 3 : 1.5}
              opacity="0.92"
            />
            <text
              x={node.x}
              y={node.y + radius + 12}
              textAnchor="middle"
              fontSize="10"
              fill="rgb(var(--color-text))"
            >
              {node.label}
            </text>
          </g>
        );
      })}
      </svg>
      <ChartTable
        caption={`${ariaLabel} — nós e conexões`}
        columns={['Nó', 'Comunidade', 'Conectado a']}
        rows={nodes.map((node) => [
          node.label,
          node.community ?? '—',
          links.get(node.id)?.join(', ') ?? 'sem conexões',
        ])}
      />
    </figure>
  );
}

export function ProgressBar({
  value,
  max = 100,
  label,
  tone = 'action',
  className,
}: {
  value: number;
  max?: number;
  label: string;
  tone?: 'action' | 'success' | 'warning' | 'danger';
  className?: string;
}) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  const fills: Record<string, string> = {
    action: 'bg-eqx-action',
    success: 'bg-eqx-success',
    warning: 'bg-eqx-warning',
    danger: 'bg-eqx-danger',
  };
  return (
    <div className={cn('grid gap-1', className)}>
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-semibold">{label}</span>
        <span className="tabular-nums text-eqx-text-muted">{formatNumber(pct, 0)}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-2 w-full overflow-hidden rounded-pill bg-eqx-surface-subtle"
      >
        <div className={cn('h-full rounded-pill', fills[tone])} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

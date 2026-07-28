import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';
import { ChartTable } from '@/ds/charts/ChartTable';

export interface LinePoint {
  label: string;
  value: number;
  highlight?: boolean;
  meta?: string;
}

const WIDTH = 720;
const HEIGHT = 240;
const PAD = { top: 16, right: 16, bottom: 28, left: 44 };

export function LineChart({
  points,
  ariaLabel,
  unit = '',
  onSelect,
  className,
  band,
}: {
  points: LinePoint[];
  ariaLabel: string;
  unit?: string;
  onSelect?: (point: LinePoint, index: number) => void;
  className?: string;
  band?: { min: number; max: number; label: string };
}) {
  const [hover, setHover] = useState<number | null>(null);

  const geometry = useMemo(() => {
    const values = points.map((p) => p.value);
    const rawMin = Math.min(...values, band?.min ?? Number.POSITIVE_INFINITY);
    const rawMax = Math.max(...values, band?.max ?? Number.NEGATIVE_INFINITY);
    const pad = Math.max((rawMax - rawMin) * 0.12, 1);
    const min = rawMin - pad;
    const max = rawMax + pad;
    const innerW = WIDTH - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const x = (index: number) =>
      PAD.left + (points.length <= 1 ? innerW / 2 : (index / (points.length - 1)) * innerW);
    const y = (value: number) => PAD.top + innerH - ((value - min) / (max - min)) * innerH;
    return { min, max, x, y, innerH };
  }, [points, band]);

  if (points.length === 0) return null;

  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${geometry.x(index)},${geometry.y(point.value)}`)
    .join(' ');

  const areaPath =
    `${path} L${geometry.x(points.length - 1)},${HEIGHT - PAD.bottom} L${geometry.x(0)},${
      HEIGHT - PAD.bottom
    } Z`;

  const ticks = [geometry.max, (geometry.max + geometry.min) / 2, geometry.min];
  const active = hover !== null ? points[hover] : null;

  return (
    <figure className={cn('m-0', className)}>
      {/* `group` e não `img`: os pontos abaixo são focáveis e `img` tornaria
          toda a subárvore invisível para leitores de tela. */}
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="group"
        aria-label={ariaLabel}
        className="h-auto w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="line-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--color-action))" stopOpacity="0.28" />
            <stop offset="100%" stopColor="rgb(var(--color-action))" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {ticks.map((tick, index) => (
          <g key={index}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={geometry.y(tick)}
              y2={geometry.y(tick)}
              stroke="rgb(var(--color-border))"
              strokeDasharray="3 4"
            />
            <text
              x={PAD.left - 8}
              y={geometry.y(tick) + 4}
              textAnchor="end"
              fontSize="11"
              fill="rgb(var(--color-text-muted))"
            >
              {formatNumber(tick, 0)}
            </text>
          </g>
        ))}

        {band ? (
          <rect
            x={PAD.left}
            y={geometry.y(band.max)}
            width={WIDTH - PAD.left - PAD.right}
            height={Math.max(geometry.y(band.min) - geometry.y(band.max), 1)}
            fill="rgb(var(--color-success))"
            opacity="0.1"
          />
        ) : null}

        <path d={areaPath} fill="url(#line-area)" />
        <path
          d={path}
          fill="none"
          stroke="rgb(var(--color-action))"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle
              cx={geometry.x(index)}
              cy={geometry.y(point.value)}
              r={point.highlight ? 6 : hover === index ? 5 : 3.5}
              fill={point.highlight ? 'rgb(var(--color-accent))' : 'rgb(var(--color-surface))'}
              stroke={
                point.highlight ? 'rgb(var(--color-brand))' : 'rgb(var(--color-action))'
              }
              strokeWidth="2"
            />
            <rect
              x={geometry.x(index) - 12}
              y={PAD.top}
              width="24"
              height={HEIGHT - PAD.top - PAD.bottom}
              fill="transparent"
              tabIndex={0}
              role="button"
              aria-label={`${point.label}: ${formatNumber(point.value)}${unit}${
                point.meta ? ` · ${point.meta}` : ''
              }`}
              onMouseEnter={() => setHover(index)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(index)}
              onBlur={() => setHover(null)}
              onClick={() => onSelect?.(point, index)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect?.(point, index);
                }
              }}
              className="cursor-pointer"
            />
          </g>
        ))}

        {points.map((point, index) =>
          index % Math.ceil(points.length / 8) === 0 || index === points.length - 1 ? (
            <text
              key={`label-${index}`}
              x={geometry.x(index)}
              y={HEIGHT - 8}
              textAnchor="middle"
              fontSize="11"
              fill="rgb(var(--color-text-muted))"
            >
              {point.label}
            </text>
          ) : null,
        )}
      </svg>
      <ChartTable
        caption={`${ariaLabel} — série completa`}
        columns={['Período', `Valor${unit ? ` (${unit})` : ''}`, 'Observação']}
        rows={points.map((point) => [
          point.label,
          `${formatNumber(point.value)}${unit}`,
          point.meta ?? '—',
        ])}
      />
      <figcaption className="mt-2 min-h-[1.25rem] text-sm text-eqx-text-muted">
        {active
          ? `${active.label}: ${formatNumber(active.value)}${unit}${active.meta ? ` · ${active.meta}` : ''}`
          : ariaLabel}
      </figcaption>
    </figure>
  );
}

export function Sparkline({
  values,
  ariaLabel,
  className,
  tone = 'action',
}: {
  values: number[];
  ariaLabel: string;
  className?: string;
  tone?: 'action' | 'success' | 'danger' | 'accent';
}) {
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const summary = `${ariaLabel}. Início ${formatNumber(values[0])}, fim ${formatNumber(
    values[values.length - 1],
  )}, mínimo ${formatNumber(min)}, máximo ${formatNumber(max)}.`;
  const span = max - min || 1;
  const path = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 30 - ((value - min) / span) * 26 - 2;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
  const stroke = {
    action: 'rgb(var(--color-action))',
    success: 'rgb(var(--color-success))',
    danger: 'rgb(var(--color-danger))',
    accent: 'rgb(var(--color-accent))',
  }[tone];

  return (
    <svg
      viewBox="0 0 100 30"
      role="img"
      aria-label={summary}
      preserveAspectRatio="none"
      className={cn('h-8 w-full', className)}
    >
      <path d={path} fill="none" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

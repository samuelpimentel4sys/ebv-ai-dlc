import { cn } from '@/lib/cn';
import { formatNumber, formatPercent } from '@/lib/format';

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function Donut({
  slices,
  ariaLabel,
  centerLabel,
  centerValue,
  className,
}: {
  slices: DonutSlice[];
  ariaLabel: string;
  centerLabel?: string;
  centerValue?: string;
  className?: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <figure className={cn('m-0 flex flex-wrap items-center gap-5', className)} aria-label={ariaLabel}>
      {/* A legenda ao lado já traz rótulo, valor e percentual em texto, então o
          desenho é decorativo e não deve duplicar a leitura. */}
      <svg viewBox="0 0 140 140" aria-hidden="true" className="h-40 w-40 shrink-0">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="rgb(var(--color-surface-subtle))"
          strokeWidth="18"
        />
        {slices.map((slice) => {
          const length = (slice.value / total) * circumference;
          const dash = `${length} ${circumference - length}`;
          const element = (
            <circle
              key={slice.label}
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth="18"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              transform="rotate(-90 70 70)"
              strokeLinecap="butt"
            />
          );
          offset += length;
          return element;
        })}
        {centerValue ? (
          <text
            x="70"
            y="68"
            textAnchor="middle"
            fontSize="22"
            fontWeight="700"
            fill="rgb(var(--color-text))"
          >
            {centerValue}
          </text>
        ) : null}
        {centerLabel ? (
          <text
            x="70"
            y="88"
            textAnchor="middle"
            fontSize="10"
            fill="rgb(var(--color-text-muted))"
          >
            {centerLabel}
          </text>
        ) : null}
      </svg>
      <ul className="grid min-w-[12rem] flex-1 gap-2">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden="true"
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ background: slice.color }}
            />
            <span className="min-w-0 flex-1 truncate">{slice.label}</span>
            <span className="tabular-nums font-semibold">{formatNumber(slice.value)}</span>
            <span className="w-14 text-right tabular-nums text-eqx-text-muted">
              {formatPercent((slice.value / total) * 100, 1)}
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

export function Gauge({
  value,
  min = 0,
  max = 1000,
  label,
  bands,
  className,
}: {
  value: number;
  min?: number;
  max?: number;
  label: string;
  bands?: { upTo: number; color: string; label: string }[];
  className?: string;
}) {
  const ratio = Math.min(Math.max((value - min) / (max - min), 0), 1);
  const angle = -90 + ratio * 180;
  const activeBand = bands?.find((band) => value <= band.upTo) ?? bands?.[bands.length - 1];

  return (
    <div className={cn('grid justify-items-center gap-1', className)}>
      <svg
        viewBox="0 0 200 116"
        role="img"
        aria-label={`${label}: ${formatNumber(value)} numa escala de ${min} a ${max}${
          activeBand ? `, faixa ${activeBand.label}` : ''
        }.`}
        className="h-auto w-full max-w-[16rem]"
      >
        {(bands ?? [{ upTo: max, color: 'rgb(var(--color-action))', label }]).map((band, index, all) => {
          const start = index === 0 ? min : all[index - 1].upTo;
          const from = (start - min) / (max - min);
          const to = (band.upTo - min) / (max - min);
          const arc = describeArc(100, 100, 84, -90 + from * 180, -90 + to * 180);
          return <path key={band.label} d={arc} stroke={band.color} strokeWidth="16" fill="none" />;
        })}
        <g transform={`rotate(${angle} 100 100)`}>
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="30"
            stroke="rgb(var(--color-text))"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
        <circle cx="100" cy="100" r="6" fill="rgb(var(--color-text))" />
        <text
          x="100"
          y="76"
          textAnchor="middle"
          fontSize="26"
          fontWeight="700"
          fill="rgb(var(--color-text))"
        >
          {formatNumber(value)}
        </text>
      </svg>
      <p className="text-sm font-semibold">{label}</p>
      {activeBand ? (
        <p className="text-xs text-eqx-text-muted">Faixa: {activeBand.label}</p>
      ) : null}
    </div>
  );
}

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, radius, endAngle + 90);
  const end = polarToCartesian(cx, cy, radius, startAngle + 90);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

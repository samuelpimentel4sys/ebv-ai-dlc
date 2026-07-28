export function PrismaLogo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        role="img"
        aria-label="EBV Prisma"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="prisma-spectrum" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="rgb(var(--color-brand))" />
            <stop offset="35%" stopColor="rgb(var(--color-accent))" />
            <stop offset="65%" stopColor="rgb(var(--eqx-green-600))" />
            <stop offset="100%" stopColor="rgb(var(--eqx-blue-300))" />
          </linearGradient>
        </defs>
        <path d="M16 3 L29 27 H3 Z" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M16 3 L29 27 H3 Z" fill="url(#prisma-spectrum)" opacity="0.28" />
        <path d="M3 20 L14 14" stroke="currentColor" strokeWidth="1.6" />
        <path d="M17 15 L30 9" stroke="rgb(var(--color-accent))" strokeWidth="1.6" />
        <path d="M17 17 L30 14" stroke="rgb(var(--eqx-green-600))" strokeWidth="1.6" />
        <path d="M17 19 L30 19" stroke="rgb(var(--eqx-blue-300))" strokeWidth="1.6" />
      </svg>
      <span className="text-base font-bold tracking-tight">
        EBV <span className="text-eqx-accent-text">Prisma</span>
      </span>
    </span>
  );
}

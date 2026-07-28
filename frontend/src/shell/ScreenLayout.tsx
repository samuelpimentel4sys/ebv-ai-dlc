import { useMemo, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SectionWrapper } from '@/shell/SectionWrapper';
import { JourneyNav } from '@/shell/JourneyNav';
import { journeyPosition } from '@/app/journeys';
import { productModuleForPathname } from '@/app/modules';
import { demoStateFromUrl } from '@/lib/useMockQuery';
import { isDemoMode, isDevMode } from '@/lib/productMode';
import { Badge, buttonClass, Notice, PageHeader } from '@/ds';

const demoLabel = {
  error: 'falha de serviço',
  empty: 'resposta vazia',
  partial: 'resposta parcial',
} as const;

export function ScreenLayout({
  usId,
  title,
  description,
  actions,
  meta,
  children,
  wide,
}: {
  usId: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode[];
  children: ReactNode;
  wide?: boolean;
}) {
  const { pathname, search } = useLocation();
  const position = useMemo(() => journeyPosition(pathname), [pathname]);
  const demo = useMemo(() => demoStateFromUrl(search), [search]);
  const demoUi = isDemoMode(search);
  const devUi = isDevMode(search);
  const module = useMemo(() => productModuleForPathname(pathname), [pathname]);

  const headerMeta =
    demoUi || devUi
      ? meta
      : [
          module ? (
            <Badge key="module" tone="accent">
              {module.label}
            </Badge>
          ) : null,
        ].filter(Boolean);

  return (
    <SectionWrapper wide={wide}>
      <PageHeader
        usId={devUi ? usId : undefined}
        title={title}
        description={description}
        meta={headerMeta}
        actions={actions}
      />

      {demo ? (
        <Notice
          tone="warning"
          className="mb-5"
          title={`Demonstração de estado: ${demoLabel[demo]}`}
          actions={
            <Link to={pathname} className={buttonClass('secondary', 'sm')}>
              Voltar ao estado normal
            </Link>
          }
        >
          Esta tela está simulando o cenário de exceção. O seletor de estado (modo demo/dev) alterna
          entre resposta normal, vazia, parcial e falha de serviço.
        </Notice>
      ) : null}

      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
      >
        {children}
      </motion.div>

      {demoUi && position ? <JourneyNav position={position} /> : null}
    </SectionWrapper>
  );
}

import { useMemo, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SectionWrapper } from '@/shell/SectionWrapper';
import { JourneyNav } from '@/shell/JourneyNav';
import { journeyPosition } from '@/app/journeys';
import { demoStateFromUrl } from '@/lib/useMockQuery';
import { buttonClass, Notice, PageHeader } from '@/ds';

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

  return (
    <SectionWrapper wide={wide}>
      <PageHeader
        usId={usId}
        title={title}
        description={description}
        meta={meta}
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
          Esta tela está simulando o cenário de exceção previsto na US-FE. O seletor de estado no
          cabeçalho alterna entre resposta normal, vazia, parcial e falha de serviço em qualquer
          rota.
        </Notice>
      ) : null}

      {/* Entrada curta e única por tela: dá vida ao conteúdo sem competir com a
          leitura, e o token `slow` do DS já é neutralizado por reduced-motion. */}
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
      >
        {children}
      </motion.div>

      {position ? <JourneyNav position={position} /> : null}
    </SectionWrapper>
  );
}

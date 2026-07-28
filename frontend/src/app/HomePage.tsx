import { Link } from 'react-router-dom';
import { ArrowRight, Command, Radio } from 'lucide-react';
import { resolvedProductModules, navItemsForModule } from '@/app/modules';
import { dataMode } from '@/lib/config';
import { Badge, buttonClass, Card, CardHeader, Notice, PageHeader } from '@/ds';
import { SectionWrapper } from '@/shell/SectionWrapper';

const ACCENTS = ['action', 'accent', 'brand', 'success', 'warning', 'action'] as const;

export function HomePage() {
  const modules = resolvedProductModules();
  const live = dataMode() === 'live';

  return (
    <SectionWrapper>
      <PageHeader
        title="Prisma"
        description="Plataforma de decisão de crédito Equifax — score vivo, explicabilidade, compliance e jornadas B2B/B2C em um único console."
        meta={[
          <Badge key="brand" tone="brand">
            Equifax
          </Badge>,
          <Badge key="mode" tone={live ? 'success' : 'warning'} className="font-mono">
            {live ? 'API live' : 'dados mock'}
          </Badge>,
          <Badge key="mods" tone="neutral">
            {modules.length} módulos
          </Badge>,
        ]}
        actions={
          <Link to="/risco/features/catalogo" className={buttonClass('primary')}>
            <Radio size={16} aria-hidden="true" />
            Abrir catálogo de atributos
          </Link>
        }
      />

      <Notice tone="info" className="mb-6" title="Operação conectada ao backend">
        As telas de Score & Plataforma consomem as APIs do lab Prisma (`/api/v1`). Use a busca
        <kbd className="mx-1 rounded-sm border border-eqx-border px-1 font-mono text-xs">Ctrl K</kbd>
        para ir direto a qualquer tela. Modo demonstração: acrescente <code>?demo=1</code> na URL.
      </Notice>

      <p className="mb-6 flex flex-wrap items-center gap-2 text-sm text-eqx-text-muted">
        <Command size={15} aria-hidden="true" />
        Navegue pelos módulos abaixo — a organização reflete o produto, não o backlog de épicos.
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((mod, index) => {
          const items = navItemsForModule(mod);
          const first = items[0];
          return (
            <Card key={mod.id} accent={ACCENTS[index % ACCENTS.length]} interactive>
              <CardHeader eyebrow={mod.shortName} title={mod.label} description={mod.description} />
              <ul className="mb-4 grid gap-1">
                {items.slice(0, 4).map((item) => (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className="block truncate text-sm text-eqx-action hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eqx-focus"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                {items.length > 4 ? (
                  <li className="text-xs text-eqx-text-muted">+{items.length - 4} telas</li>
                ) : null}
              </ul>
              {first ? (
                <Link
                  to={first.href}
                  className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-eqx-action hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eqx-focus"
                >
                  Entrar em {mod.shortName}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              ) : null}
            </Card>
          );
        })}
      </div>

      <p className="mt-8 text-xs text-eqx-text-muted">
        Rastreio BMAD (US-ID, trilhas de demo): use <code>?dev=1</code> ou <code>?demo=1</code>.
      </p>
    </SectionWrapper>
  );
}

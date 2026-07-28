import { useMemo, useState } from 'react';
import { Clock, Database, Search } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DataTable,
  Drawer,
  EmptyState,
  KeyValueList,
  Metric,
  QueryBoundary,
  SelectField,
  TextField,
  useToast,
} from '@/ds';
import type { Column } from '@/ds';
import { useDataQuery, errorMessage } from '@/lib/useDataQuery';
import { isLiveMode } from '@/lib/config';
import { formatNumber, formatPercent } from '@/lib/format';
import { featureCatalog, pitLookup, type FeatureCatalogItem } from '@/epics/score-vivo/data';
import { fetchFeatureCatalogLive, fetchPitLookupLive } from '@/api/ep01';

export function FeatureCatalogPage() {
  const toast = useToast();
  const [term, setTerm] = useState('');
  const [entity, setEntity] = useState('todas');
  const [domain, setDomain] = useState('todos');
  const [selected, setSelected] = useState<FeatureCatalogItem | null>(null);
  const [documento, setDocumento] = useState('12345678901');
  const [asOf, setAsOf] = useState('2026-07-27T12:00');
  const [pitResult, setPitResult] = useState<ReturnType<typeof pitLookup> | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const query = useDataQuery(() => featureCatalog, fetchFeatureCatalogLive, { latency: 320 });

  const domains = useMemo(
    () => ['todos', ...new Set((query.data ?? featureCatalog).map((item) => item.domain))],
    [query.data],
  );

  const filtersActive = term.trim() !== '' || entity !== 'todas' || domain !== 'todos';

  function clearFilters() {
    setTerm('');
    setEntity('todas');
    setDomain('todos');
  }

  function runPitLookup() {
    const digits = documento.trim();
    if (digits.length !== 11 && digits.length !== 14) {
      setErrors({
        documento: 'Informe um CPF com 11 dígitos ou um CNPJ com 14 dígitos, sem pontuação.',
      });
      document.querySelector<HTMLElement>('[name="pit-documento"]')?.focus();
      return;
    }
    if (!/^\d+$/.test(digits)) {
      setErrors({ documento: 'Use apenas dígitos: remova pontos, barras e hífens do documento.' });
      document.querySelector<HTMLElement>('[name="pit-documento"]')?.focus();
      return;
    }
    if (!asOf) {
      setErrors({ asOf: 'Informe a data de corte para reproduzir os valores daquele instante.' });
      document.querySelector<HTMLElement>('[name="pit-as-of"]')?.focus();
      return;
    }
    setErrors({});
    void (async () => {
      try {
        const result = isLiveMode()
          ? await fetchPitLookupLive(digits, asOf)
          : pitLookup(digits, `${asOf}:00Z`);
        setPitResult(result);
        toast.success('Consulta PIT executada', `as-of ${asOf}`);
      } catch (error) {
        toast.error('Falha na consulta PIT', errorMessage(error));
      }
    })();
  }

  const rows = useMemo(() => {
    const needle = term.trim().toLowerCase();
    return (query.data ?? []).filter((item) => {
      const matchTerm =
        !needle ||
        item.name.includes(needle) ||
        item.description.toLowerCase().includes(needle) ||
        item.owner.includes(needle);
      const matchEntity = entity === 'todas' || item.entity === entity;
      const matchDomain = domain === 'todos' || item.domain === domain;
      return matchTerm && matchEntity && matchDomain;
    });
  }, [query.data, term, entity, domain]);

  const columns: Column<FeatureCatalogItem>[] = [
    {
      key: 'name',
      header: 'Atributo',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold">{row.name}</p>
          <p className="truncate text-xs text-eqx-text-muted">{row.description}</p>
        </div>
      ),
    },
    {
      key: 'entity',
      header: 'Entidade',
      align: 'center',
      render: (row) => <Badge tone={row.entity === 'CPF' ? 'info' : 'accent'}>{row.entity}</Badge>,
    },
    { key: 'domain', header: 'Domínio', render: (row) => row.domain },
    {
      key: 'dataType',
      header: 'Tipo',
      render: (row) => <code className="text-xs">{row.dataType}</code>,
    },
    {
      key: 'freshnessMinutes',
      header: 'Frescor',
      align: 'right',
      numeric: true,
      render: (row) =>
        row.freshnessMinutes >= 60
          ? `${formatNumber(row.freshnessMinutes / 60, 1)} h`
          : `${row.freshnessMinutes} min`,
    },
    {
      key: 'nullRate',
      header: 'Nulos',
      align: 'right',
      numeric: true,
      render: (row) => (
        <span className={row.nullRate > 20 ? 'text-eqx-warning' : undefined}>
          {formatPercent(row.nullRate)}
        </span>
      ),
    },
    {
      key: 'pit',
      header: 'PIT',
      align: 'center',
      render: (row) =>
        row.pitSupported ? (
          <Badge tone="success">sim</Badge>
        ) : (
          <Badge tone="warning">não</Badge>
        ),
    },
  ];

  return (
    <ScreenLayout
      usId="PRISMA-EP-01-F02-US-FE-01"
      title="Catálogo de atributos da feature store"
      description="Busque atributos por domínio e entidade, verifique frescor e suporte point-in-time, inspecione linhagem e faça consultas PIT por documento e data de corte."
      meta={[
        <Badge key="epic" tone="accent">
          EP-01 · Score Vivo
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /risco/features/catalogo
        </Badge>,
      ]}
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={6}
        empty={{
          title: 'Nenhum atributo publicado na feature store.',
          description:
            'Publique um atributo pelo pipeline de features para que ele apareça aqui com frescor, linhagem e suporte point-in-time.',
        }}
        noResults={{ active: filtersActive, onClear: clearFilters }}
      >
        {(data) => (
          <div className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                value={data.length}
                label="Atributos publicados"
                icon={<Database size={18} aria-hidden="true" />}
              />
              <Metric
                value={data.filter((item) => item.pitSupported).length}
                label="Com suporte point-in-time"
                tone="success"
              />
              <Metric
                value={`${formatNumber(
                  Math.min(...data.map((item) => item.freshnessMinutes)),
                )} min`}
                label="Melhor frescor"
                tone="action"
                icon={<Clock size={18} aria-hidden="true" />}
              />
              <Metric
                value={new Set(data.map((item) => item.owner)).size}
                label="Squads responsáveis"
              />
            </div>

            <Card>
              <CardHeader eyebrow="filtros" title="Buscar no catálogo" />
              <div className="grid gap-4 md:grid-cols-3">
                <TextField
                  label="Termo"
                  placeholder="nome, descrição ou squad"
                  value={term}
                  onChange={(event) => setTerm(event.target.value)}
                />
                <SelectField
                  label="Entidade"
                  value={entity}
                  onChange={(event) => setEntity(event.target.value)}
                  options={[
                    { value: 'todas', label: 'Todas' },
                    { value: 'CPF', label: 'CPF' },
                    { value: 'CNPJ', label: 'CNPJ' },
                  ]}
                />
                <SelectField
                  label="Domínio"
                  value={domain}
                  onChange={(event) => setDomain(event.target.value)}
                  options={domains.map((item) => ({
                    value: item,
                    label: item === 'todos' ? 'Todos' : item,
                  }))}
                />
              </div>
            </Card>

            {rows.length === 0 ? (
              <EmptyState
                title="Nenhum atributo atende aos filtros aplicados."
                description={`O catálogo tem ${data.length} atributos publicados. Limpe os filtros ou busque por outro termo, entidade ou domínio.`}
                icon={<Search size={28} aria-hidden="true" />}
                action={
                  <Button variant="secondary" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                }
              />
            ) : (
              <DataTable
                caption="Atributos disponíveis na feature store"
                columns={columns}
                rows={rows}
                rowKey={(row) => row.name}
                onRowClick={setSelected}
                footer={`${rows.length} de ${data.length} atributos · clique para ver linhagem`}
              />
            )}

            <Card accent="action">
              <CardHeader
                eyebrow="consulta point-in-time"
                title="Valores no corte temporal"
                description="GET /api/v1/features/{documento} — reproduz exatamente o que a decisão viu na data informada."
              />
              <div className="grid items-end gap-4 md:grid-cols-[1fr_1fr_auto]">
                <TextField
                  label="Documento"
                  name="pit-documento"
                  value={documento}
                  error={errors.documento}
                  onChange={(event) => {
                    setDocumento(event.target.value);
                    setErrors({});
                  }}
                  hint="CPF ou CNPJ apenas com dígitos"
                />
                <TextField
                  label="Data de corte (as-of)"
                  name="pit-as-of"
                  type="datetime-local"
                  value={asOf}
                  error={errors.asOf}
                  onChange={(event) => {
                    setAsOf(event.target.value);
                    setErrors({});
                  }}
                />
                <Button onClick={runPitLookup}>Consultar</Button>
              </div>
              {pitResult ? (
                <div className="mt-5 grid gap-3">
                  {pitResult.values.map((value) => (
                    <div
                      key={value.name}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-eqx-border bg-eqx-surface-subtle px-4 py-2"
                    >
                      <code className="text-xs">{value.name}</code>
                      <span className="font-semibold tabular-nums">{value.value}</span>
                      <Badge tone={value.source === 'online' ? 'success' : 'info'}>
                        {value.source}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-eqx-text-muted">
                  Informe documento e data de corte para materializar os valores.
                </p>
              )}
            </Card>
          </div>
        )}
      </QueryBoundary>

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ''}
        description="Linhagem e metadados do atributo"
      >
        {selected ? (
          <div className="grid gap-5">
            <p className="text-sm">{selected.description}</p>
            <KeyValueList
              items={[
                { label: 'Entidade', value: selected.entity },
                { label: 'Tipo', value: <code>{selected.dataType}</code> },
                { label: 'Domínio', value: selected.domain },
                { label: 'Responsável', value: selected.owner },
                { label: 'Frescor', value: `${selected.freshnessMinutes} min` },
                { label: 'Taxa de nulos', value: formatPercent(selected.nullRate) },
              ]}
            />
            <section>
              <h3 className="mb-3 text-base">Linhagem</h3>
              <ol className="grid gap-2">
                {selected.lineage.map((step, index) => (
                  <li
                    key={step}
                    className="flex items-center gap-3 rounded-md border border-eqx-border px-3 py-2"
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-pill bg-eqx-action text-xs font-bold text-eqx-text-inverse">
                      {index + 1}
                    </span>
                    <code className="text-xs">{step}</code>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        ) : null}
      </Drawer>
    </ScreenLayout>
  );
}

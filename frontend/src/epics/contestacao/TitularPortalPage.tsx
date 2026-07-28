import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, FileText, ShieldAlert, UserCheck } from 'lucide-react';
import { ScreenLayout } from '@/shell/ScreenLayout';
import {
  Badge,
  Button,
  Card,
  KeyValueList,
  Metric,
  Modal,
  Notice,
  QueryBoundary,
  SelectField,
  Tabs,
  TextAreaField,
  useToast,
} from '@/ds';
import { openSelfServiceDisputeLive, fetchTitularRecordsLive } from '@/api/dispute';
import { isLiveMode } from '@/lib/config';
import { useDataQuery, errorMessage } from '@/lib/useDataQuery';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { sumBy } from '@/lib/number';
import { disputeReasons, titularRecords, type TitularRecord } from '@/epics/contestacao/data';
import { focusFirstInvalid } from '@/lib/focusFirstInvalid';

const typeLabel: Record<TitularRecord['type'], string> = {
  apontamento: 'Apontamentos',
  consulta: 'Quem consultou',
  cadastro: 'Meus dados',
  score: 'Meu score',
};

const typeIcon: Record<TitularRecord['type'], typeof Eye> = {
  apontamento: ShieldAlert,
  consulta: Eye,
  cadastro: UserCheck,
  score: FileText,
};

const typeOrder: TitularRecord['type'][] = ['apontamento', 'consulta', 'cadastro', 'score'];

export function TitularPortalPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const query = useDataQuery(() => titularRecords, fetchTitularRecordsLive, { latency: 300 });
  const [disputing, setDisputing] = useState<TitularRecord | null>(null);
  const [reason, setReason] = useState('quitado');
  const [detail, setDetail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusNonce, setFocusNonce] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusNonce === 0) return;
    focusFirstInvalid(modalRef.current);
  }, [focusNonce]);

  function openDispute() {
    if (!disputing) return;
    if (detail.trim().length < 15) {
      setErrors({
        detail:
          'Conte o que aconteceu em pelo menos 15 caracteres — é esse relato que a análise usa para checar o registro.',
      });
      setFocusNonce((value) => value + 1);
      return;
    }
    void (async () => {
      try {
        if (isLiveMode()) {
          const result = await openSelfServiceDisputeLive({
            reasonCode: reason,
            description: detail.trim(),
            recordRef: disputing.recordId,
          });
          sessionStorage.setItem('prisma.lastDisputeId', result.id);
          toast.success(
            'Contestação registrada',
            `Protocolo ${result.protocol} · prazo de 5 dias úteis`,
          );
          setDisputing(null);
          setDetail('');
          setErrors({});
          navigate(`/titular/contestacoes/${result.protocol}`);
          return;
        }
        // Evita colidir com o protocolo canónico CT-2026-448120 da demo.
        let protocolo: string;
        do {
          protocolo = `CT-2026-448${Math.floor(Math.random() * 900 + 100)}`;
        } while (protocolo === 'CT-2026-448120');
        toast.success('Contestação registrada', `Protocolo ${protocolo} · prazo de 5 dias úteis`);
        setDisputing(null);
        setDetail('');
        setErrors({});
        navigate(`/titular/contestacoes/${protocolo}`);
      } catch (error) {
        toast.error('Falha ao registrar contestação', errorMessage(error));
      }
    })();
  }

  return (
    <ScreenLayout
      usId="PRISMA-EP-05-F05-US-FE-01"
      title="Portal do titular — meus registros"
      description="Visão de transparência para o titular: apontamentos ativos, histórico de consultas ao CPF, dados cadastrais e score, com abertura de contestação em linguagem simples a partir de qualquer registro."
      meta={[
        <Badge key="epic" tone="accent">
          EP-05 · Contestação
        </Badge>,
        <Badge key="route" tone="neutral" className="font-mono">
          /titular/registros
        </Badge>,
      ]}
      wide
    >
      <QueryBoundary
        query={query}
        loadingRows={5}
        empty={{
          title: 'Não há nenhum registro no seu nome.',
          description:
            'Nenhum apontamento, consulta ou dado cadastral aparece ligado ao seu CPF neste momento — nada aqui indica problema. Se você recebeu um aviso de restrição, guarde o comunicado e consulte de novo em algumas horas: a base pode estar em atualização.',
        }}
      >
        {(records) => {
          const grouped = typeOrder.map((type) => ({
            type,
            records: records.filter((record) => record.type === type),
          }));
          const totalDebt = sumBy(
            records.filter((record) => record.type === 'apontamento'),
            (record) => record.amount,
          );

          return (
            <div className="grid gap-5">
              <Notice tone="info" title="Consulta gratuita garantida por lei">
                Você pode consultar seus dados e abrir contestações sem custo, quantas vezes quiser.
                Todo acesso a esta página é registrado para sua segurança.
              </Notice>

              <div className="grid gap-4 sm:grid-cols-3">
                <Metric
                  value={grouped[0].records.length}
                  label="Apontamentos ativos"
                  tone={grouped[0].records.length > 0 ? 'danger' : 'success'}
                />
                <Metric value={formatCurrency(totalDebt)} label="Valor total apontado" />
                <Metric value={grouped[1].records.length} label="Consultas nos últimos 90 dias" />
              </div>

              <Tabs
                items={grouped.map(({ type, records: group }) => {
                  const Icon = typeIcon[type];
                  return {
                    id: type,
                    label: typeLabel[type],
                    badge: <Badge tone="neutral">{group.length}</Badge>,
                    content: (
                      <div className="grid gap-4">
                        {group.map((record) => (
                          <Card
                            key={record.recordId}
                            accent={record.type === 'apontamento' ? 'danger' : 'action'}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div className="min-w-0">
                                <p className="flex items-center gap-2 text-base font-semibold">
                                  <Icon size={16} aria-hidden="true" />
                                  {record.title}
                                </p>
                                <p className="mt-1 text-sm text-eqx-text-muted">{record.detail}</p>
                                <p className="mt-2 text-xs text-eqx-text-muted">
                                  Fonte: {record.source} · {formatDateTime(record.occurredAt)}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                {record.amount ? (
                                  <span className="text-lg font-bold tabular-nums text-eqx-danger">
                                    {formatCurrency(record.amount)}
                                  </span>
                                ) : null}
                                {record.disputable ? (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                      setDisputing(record);
                                      setErrors({});
                                    }}
                                  >
                                    Contestar
                                  </Button>
                                ) : (
                                  <Badge tone="neutral">informativo</Badge>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ),
                  };
                })}
              />
            </div>
          );
        }}
      </QueryBoundary>

      <Modal
        open={Boolean(disputing)}
        onClose={() => setDisputing(null)}
        title="Contestar registro"
        description="Vamos analisar em até 5 dias úteis e avisar por e-mail a cada etapa."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDisputing(null)}>
              Cancelar
            </Button>
            <Button onClick={openDispute}>Enviar contestação</Button>
          </>
        }
      >
        {disputing ? (
          <div className="grid gap-4" ref={modalRef}>
            <KeyValueList
              columns={1}
              items={[
                { label: 'Registro', value: disputing.title },
                { label: 'Detalhe', value: disputing.detail },
                { label: 'Fonte', value: disputing.source },
              ]}
            />
            <SelectField
              label="Qual é o problema?"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              options={disputeReasons}
            />
            <TextAreaField
              label="Conte com suas palavras o que aconteceu"
              required
              rows={4}
              value={detail}
              error={errors.detail}
              onChange={(event) => {
                setDetail(event.target.value);
                setErrors({});
              }}
              hint="Se tiver comprovante, você poderá anexar na próxima etapa."
            />
          </div>
        ) : null}
      </Modal>
    </ScreenLayout>
  );
}

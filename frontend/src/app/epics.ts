import type { EpicId, EpicMeta } from '@/app/types';

export const EPICS: EpicMeta[] = [
  {
    id: 'EP-01',
    code: 'PRISMA-EP-01',
    name: 'Score Vivo Event-Driven & Point-in-Time',
    shortName: 'Score Vivo',
    color: 'rgb(var(--color-action))',
    summary:
      'Barramento de eventos, feature store point-in-time, snapshots imutáveis de decisão e governança de versões de modelo.',
    businessOutcome:
      'Decisão de crédito em tempo real com o atributo do momento, e não com a foto do lote da noite anterior.',
    connectsTo:
      'É aqui que a decisão de Maria nasce: o score 486 e o snapshot que os outros épicos vão explicar, contestar e reconstruir.',
  },
  {
    id: 'EP-02',
    code: 'PRISMA-EP-02',
    name: 'Motor de Decisão Explicável & API Contrafactual',
    shortName: 'Explicabilidade',
    color: 'rgb(var(--eqx-plum-600))',
    summary:
      'Fatores da decisão, contrafactuais viáveis, dossiê regulatório, trilha imutável, equidade e direitos do titular.',
    businessOutcome:
      'Recusa explicada em minutos, com dossiê pronto para o regulador e caminho de melhoria para o titular.',
    connectsTo:
      'Pega a decisão que o EP-01 registrou e responde à pergunta que o titular faz: por que não.',
  },
  {
    id: 'EP-03',
    code: 'PRISMA-EP-03',
    name: 'Copiloto de Crédito PJ com GenAI Ancorada',
    shortName: 'Copiloto PJ',
    color: 'rgb(var(--color-accent))',
    summary:
      'Extração de demonstrativos, grounding auditável, parecer seccionado, alçadas, índices padronizados e custo de inferência.',
    businessOutcome:
      'Parecer de crédito PJ em horas em vez de dias, com cada afirmação ligada à página do documento de origem.',
    connectsTo:
      'Muda o sujeito de pessoa física para a Aurora Alimentos, o cliente PJ que o EP-04 vai encontrar dentro da carteira.',
  },
  {
    id: 'EP-04',
    code: 'PRISMA-EP-04',
    name: 'Sala de Risco Imersiva & Contágio de Carteira',
    shortName: 'Sala de Risco',
    color: 'rgb(var(--color-brand))',
    summary:
      'Grafo de carteira, propagação de contágio, estresse agregado, comunidades, time machine e dossiê de comitê.',
    businessOutcome:
      'Concentração e contágio visíveis antes da perda, com limite revisado e decisão levada ao comitê.',
    connectsTo:
      'A Aurora deixa de ser um caso isolado e aparece como o nó que propaga risco para o resto da carteira.',
  },
  {
    id: 'EP-05',
    code: 'PRISMA-EP-05',
    name: 'Contestação Transparente & Console B2B',
    shortName: 'Contestação B2B',
    color: 'rgb(var(--color-success))',
    summary:
      'Rastreamento de contestação, fluxo com SLA, onboarding PME self-service, consumo e fatura, credenciais e evidências.',
    businessOutcome:
      'Contestação resolvida no prazo legal com menos atendimento humano, e cliente B2B integrando sozinho.',
    connectsTo:
      'Volta para Maria: um dos dois apontamentos que derrubaram o score dela está errado e ela contesta sem ligar para o SAC.',
  },
  {
    id: 'EP-06',
    code: 'PRISMA-EP-06',
    name: 'Thin-File Alternativo & Coach de Crédito B2C',
    shortName: 'Thin-File & Coach',
    color: 'rgb(var(--eqx-blue-300))',
    summary:
      'Ingestão consentida de dados alternativos, score thin-file, jornada de coaching gamificada, ofertas e deriva de modelo.',
    businessOutcome:
      'População sem histórico entra no mercado de crédito com dado alternativo consentido, virando base endereçável.',
    connectsTo:
      'Fecha a história: corrigido o apontamento, Maria usa conta de luz e aluguel para sair de thin-file e virar elegível.',
  },
];

export function epicByCode(code: string): EpicMeta | undefined {
  return EPICS.find((epic) => epic.code === code || epic.id === code);
}

export function epicById(id: EpicId): EpicMeta {
  return EPICS.find((epic) => epic.id === id) ?? EPICS[0];
}

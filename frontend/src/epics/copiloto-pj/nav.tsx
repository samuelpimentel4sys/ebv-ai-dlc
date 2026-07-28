import type { NavItem } from '@/app/types';
import { lazyScreen } from '@/app/lazyScreen';
const ExtractionReviewPage = lazyScreen(() => import('@/epics/copiloto-pj/ExtractionReviewPage'), 'ExtractionReviewPage');
const GroundingPage = lazyScreen(() => import('@/epics/copiloto-pj/GroundingPage'), 'GroundingPage');
const OpinionEditorPage = lazyScreen(() => import('@/epics/copiloto-pj/OpinionEditorPage'), 'OpinionEditorPage');
const ApprovalPage = lazyScreen(() => import('@/epics/copiloto-pj/ApprovalPage'), 'ApprovalPage');
const RatiosPage = lazyScreen(() => import('@/epics/copiloto-pj/RatiosPage'), 'RatiosPage');
const GuardrailsPage = lazyScreen(() => import('@/epics/copiloto-pj/GuardrailsPage'), 'GuardrailsPage');
const LibraryPage = lazyScreen(() => import('@/epics/copiloto-pj/LibraryPage'), 'LibraryPage');
const EconomicGroupPage = lazyScreen(() => import('@/epics/copiloto-pj/EconomicGroupPage'), 'EconomicGroupPage');
const CostTelemetryPage = lazyScreen(() => import('@/epics/copiloto-pj/CostTelemetryPage'), 'CostTelemetryPage');

const GROUP = 'EP-03 · Copiloto PJ';

export const copilotoPjNav: NavItem[] = [
  {
    path: '/pj/documentos/:docId/conferencia',
    href: '/pj/documentos/doc-9f21/conferencia',
    label: 'Conferência de extração',
    epic: 'EP-03',
    usId: 'PRISMA-EP-03-F01-US-FE-01',
    group: GROUP,
    description: 'Split view PDF × campos extraídos, confiança do OCR e correção manual.',
    keywords: ['ocr', 'extracao', 'balanco', 'dre', 'conferencia'],
    element: <ExtractionReviewPage />,
  },
  {
    path: '/pj/:cnpj/grounding',
    href: '/pj/12345678000190/grounding',
    label: 'Origem da afirmação',
    epic: 'EP-03',
    usId: 'PRISMA-EP-03-F02-US-FE-01',
    group: GROUP,
    description: 'Resposta do RAG com trechos recuperados, similaridade e página citada.',
    keywords: ['rag', 'grounding', 'citacao', 'acervo', 'similaridade'],
    element: <GroundingPage />,
  },
  {
    path: '/pj/pareceres/:opinionId/editor',
    href: '/pj/pareceres/op-5512/editor',
    label: 'Editor de parecer',
    epic: 'EP-03',
    usId: 'PRISMA-EP-03-F03-US-FE-01',
    group: GROUP,
    description: 'Minuta gerada por seção, citações inline, SLA de 3 min e envio à alçada.',
    keywords: ['parecer', 'minuta', 'editor', 'sla', 'copiloto'],
    element: <OpinionEditorPage />,
  },
  {
    path: '/pj/pareceres/aprovacao',
    href: '/pj/pareceres/aprovacao',
    label: 'Aprovação com alçada',
    epic: 'EP-03',
    usId: 'PRISMA-EP-03-F04-US-FE-01',
    group: GROUP,
    description: 'Fila de alçada, matriz de competência, trilha e decisão fundamentada.',
    keywords: ['alcada', 'aprovacao', 'comite', 'trilha', 'parecer'],
    element: <ApprovalPage />,
  },
  {
    path: '/pj/:cnpj/indices',
    href: '/pj/12345678000190/indices',
    label: 'Índices financeiros',
    epic: 'EP-03',
    usId: 'PRISMA-EP-03-F05-US-FE-01',
    group: GROUP,
    description: 'Índices com fórmula auditável, benchmark CNAE e marcação de não calculáveis.',
    keywords: ['indices', 'liquidez', 'ebitda', 'covenant', 'benchmark'],
    element: <RatiosPage />,
  },
  {
    path: '/pj/pareceres/:opinionId/verificacao',
    href: '/pj/pareceres/op-5512/verificacao',
    label: 'Verificação de guardrails',
    epic: 'EP-03',
    usId: 'PRISMA-EP-03-F06-US-FE-01',
    group: GROUP,
    description: 'Achados por severidade, lastro das afirmações e conferência numérica.',
    keywords: ['guardrails', 'alucinacao', 'verificacao', 'lastro'],
    element: <GuardrailsPage />,
  },
  {
    path: '/pj/:cnpj/biblioteca',
    href: '/pj/12345678000190/biblioteca',
    label: 'Biblioteca do cliente',
    epic: 'EP-03',
    usId: 'PRISMA-EP-03-F07-US-FE-01',
    group: GROUP,
    description: 'Acervo por CNPJ com indexação, retenção e legal hold.',
    keywords: ['biblioteca', 'documentos', 'indexacao', 'legal hold'],
    element: <LibraryPage />,
  },
  {
    path: '/pj/:cnpj/grupo-economico',
    href: '/pj/12345678000190/grupo-economico',
    label: 'Grupo econômico',
    epic: 'EP-03',
    usId: 'PRISMA-EP-03-F08-US-FE-01',
    group: GROUP,
    description: 'Grafo societário, exposição consolidada e alerta de sobreposição.',
    keywords: ['grupo', 'societario', 'grafo', 'exposicao', 'partes relacionadas'],
    element: <EconomicGroupPage />,
  },
  {
    path: '/pj/telemetria/custo',
    href: '/pj/telemetria/custo',
    label: 'Custo por parecer',
    epic: 'EP-03',
    usId: 'PRISMA-EP-03-F09-US-FE-01',
    group: GROUP,
    description: 'Orçamento de inferência, custo por modelo e analista, política de roteamento.',
    keywords: ['custo', 'token', 'orcamento', 'roteamento', 'telemetria'],
    element: <CostTelemetryPage />,
  },
];

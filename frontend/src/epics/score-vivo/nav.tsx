import type { NavItem } from '@/app/types';
import { lazyScreen } from '@/app/lazyScreen';
const StreamHealthPage = lazyScreen(() => import('@/epics/score-vivo/StreamHealthPage'), 'StreamHealthPage');
const FeatureCatalogPage = lazyScreen(() => import('@/epics/score-vivo/FeatureCatalogPage'), 'FeatureCatalogPage');
const ScoreTimelinePage = lazyScreen(() => import('@/epics/score-vivo/ScoreTimelinePage'), 'ScoreTimelinePage');
const SnapshotComparePage = lazyScreen(() => import('@/epics/score-vivo/SnapshotComparePage'), 'SnapshotComparePage');
const PlaygroundPage = lazyScreen(() => import('@/epics/score-vivo/PlaygroundPage'), 'PlaygroundPage');
const ConnectorsPage = lazyScreen(() => import('@/epics/score-vivo/ConnectorsPage'), 'ConnectorsPage');
const IdentityMergePage = lazyScreen(() => import('@/epics/score-vivo/IdentityMergePage'), 'IdentityMergePage');
const SloPage = lazyScreen(() => import('@/epics/score-vivo/SloPage'), 'SloPage');
const ModelRegistryPage = lazyScreen(() => import('@/epics/score-vivo/ModelRegistryPage'), 'ModelRegistryPage');
const ReplayJobsPage = lazyScreen(() => import('@/epics/score-vivo/ReplayJobsPage'), 'ReplayJobsPage');

const GROUP = 'EP-01 · Score Vivo';

export const scoreVivoNav: NavItem[] = [
  {
    path: '/plataforma/eventos/saude',
    href: '/plataforma/eventos/saude',
    label: 'Saúde do barramento',
    epic: 'EP-01',
    usId: 'PRISMA-EP-01-F01-US-FE-01',
    group: GROUP,
    description: 'Tópicos, lag por consumer group, throughput e fila de quarentena.',
    keywords: ['kafka', 'lag', 'quarentena', 'eventos', 'topicos'],
    element: <StreamHealthPage />,
  },
  {
    path: '/risco/features/catalogo',
    href: '/risco/features/catalogo',
    label: 'Catálogo de atributos',
    epic: 'EP-01',
    usId: 'PRISMA-EP-01-F02-US-FE-01',
    group: GROUP,
    description: 'Feature store com frescor, linhagem e consulta point-in-time.',
    keywords: ['feature store', 'pit', 'linhagem', 'atributos'],
    element: <FeatureCatalogPage />,
  },
  {
    path: '/risco/score/:documento/historico',
    href: '/risco/score/12345678901/historico',
    label: 'Histórico de score',
    epic: 'EP-01',
    usId: 'PRISMA-EP-01-F03-US-FE-01',
    group: GROUP,
    description: 'Série temporal do score com eventos disparadores e recálculo.',
    keywords: ['score', 'timeline', 'recalculo', 'titular'],
    element: <ScoreTimelinePage />,
  },
  {
    path: '/compliance/decisoes/comparar',
    href: '/compliance/decisoes/comparar',
    label: 'Comparar decisões',
    epic: 'EP-01',
    usId: 'PRISMA-EP-01-F04-US-FE-01',
    group: GROUP,
    description: 'Diff de snapshots WORM e verificação de integridade.',
    keywords: ['snapshot', 'worm', 'diff', 'integridade', 'hash'],
    element: <SnapshotComparePage />,
  },
  {
    path: '/integracao/playground/decisoes',
    href: '/integracao/playground/decisoes',
    label: 'Playground de decisões',
    epic: 'EP-01',
    usId: 'PRISMA-EP-01-F05-US-FE-01',
    group: GROUP,
    description: 'Execução de payload no sandbox com orçamento de latência e snippets.',
    keywords: ['api', 'sandbox', 'latencia', 'snippet', 'integracao'],
    element: <PlaygroundPage />,
  },
  {
    path: '/dados/ingestao/conectores',
    href: '/dados/ingestao/conectores',
    label: 'Conectores de origem',
    epic: 'EP-01',
    usId: 'PRISMA-EP-01-F06-US-FE-01',
    group: GROUP,
    description: 'Status, volume, erro e SLA das fontes de dados, com replay por janela.',
    keywords: ['ingestao', 'conectores', 'open finance', 'replay', 'sla'],
    element: <ConnectorsPage />,
  },
  {
    path: '/dados/identidade/mesclagem',
    href: '/dados/identidade/mesclagem',
    label: 'Mesclagem de identidade',
    epic: 'EP-01',
    usId: 'PRISMA-EP-01-F07-US-FE-01',
    group: GROUP,
    description: 'Fila de casos ambíguos, comparação de registros e golden record.',
    keywords: ['identidade', 'merge', 'golden record', 'duplicidade'],
    element: <IdentityMergePage />,
  },
  {
    path: '/plataforma/observabilidade/slo',
    href: '/plataforma/observabilidade/slo',
    label: 'Painel de SLO',
    epic: 'EP-01',
    usId: 'PRISMA-EP-01-F08-US-FE-01',
    group: GROUP,
    description: 'Percentis de latência, error budget e traces distribuídos.',
    keywords: ['slo', 'latencia', 'error budget', 'trace', 'p95'],
    element: <SloPage />,
  },
  {
    path: '/ml/models/registry',
    href: '/ml/models/registry',
    label: 'Registry de modelos',
    epic: 'EP-01',
    usId: 'PRISMA-EP-01-F09-US-FE-01',
    group: GROUP,
    description: 'Versões, KS/AUC/PSI, shadow, promoção e rollback.',
    keywords: ['modelo', 'ks', 'auc', 'psi', 'promocao', 'rollback'],
    element: <ModelRegistryPage />,
  },
  {
    path: '/dados/replay/jobs',
    href: '/dados/replay/jobs',
    label: 'Console de replay',
    epic: 'EP-01',
    usId: 'PRISMA-EP-01-F10-US-FE-01',
    group: GROUP,
    description: 'Jobs de reprocessamento, progresso e divergências.',
    keywords: ['replay', 'reprocessamento', 'divergencia', 'job'],
    element: <ReplayJobsPage />,
  },
];

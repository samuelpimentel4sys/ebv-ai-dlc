import type { NavItem } from '@/app/types';
import { lazyScreen } from '@/app/lazyScreen';
const CockpitPage = lazyScreen(() => import('@/epics/sala-risco/CockpitPage'), 'CockpitPage');
const ContagionPage = lazyScreen(() => import('@/epics/sala-risco/ContagionPage'), 'ContagionPage');
const StressPage = lazyScreen(() => import('@/epics/sala-risco/StressPage'), 'StressPage');
const ConcentrationPage = lazyScreen(() => import('@/epics/sala-risco/ConcentrationPage'), 'ConcentrationPage');
const FreshnessPage = lazyScreen(() => import('@/epics/sala-risco/FreshnessPage'), 'FreshnessPage');
const CommunitiesPage = lazyScreen(() => import('@/epics/sala-risco/CommunitiesPage'), 'CommunitiesPage');
const RetrospectivePage = lazyScreen(() => import('@/epics/sala-risco/RetrospectivePage'), 'RetrospectivePage');
const CommitteeReportPage = lazyScreen(() => import('@/epics/sala-risco/CommitteeReportPage'), 'CommitteeReportPage');
const Graph2DPage = lazyScreen(() => import('@/epics/sala-risco/Graph2DPage'), 'Graph2DPage');

const GROUP = 'EP-04 · Sala de Risco';

export const salaRiscoNav: NavItem[] = [
  {
    path: '/risco/carteira/cockpit',
    href: '/risco/carteira/cockpit',
    label: 'Cockpit da carteira',
    epic: 'EP-04',
    usId: 'PRISMA-EP-04-F01-US-FE-01',
    group: GROUP,
    description: 'Grafo com nível de detalhe por setor, grupo e cliente, com detalhe de nó.',
    keywords: ['cockpit', 'grafo', 'carteira', 'lod', 'exposicao'],
    element: <CockpitPage />,
  },
  {
    path: '/risco/carteira/contagio',
    href: '/risco/carteira/contagio',
    label: 'Efeito dominó',
    epic: 'EP-04',
    usId: 'PRISMA-EP-04-F02-US-FE-01',
    group: GROUP,
    description: 'Propagação por ondas, perda acumulada, nós críticos e premissas.',
    keywords: ['contagio', 'dominó', 'propagacao', 'sistemico'],
    element: <ContagionPage />,
  },
  {
    path: '/risco/carteira/estresse',
    href: '/risco/carteira/estresse',
    label: 'Cenários de estresse',
    epic: 'EP-04',
    usId: 'PRISMA-EP-04-F03-US-FE-01',
    group: GROUP,
    description: 'Cenários oficiais e ao vivo, perda esperada, capital e migração de rating.',
    keywords: ['estresse', 'macro', 'selic', 'pib', 'cenario'],
    element: <StressPage />,
  },
  {
    path: '/risco/carteira/concentracao',
    href: '/risco/carteira/concentracao',
    label: 'Radar de concentração',
    epic: 'EP-04',
    usId: 'PRISMA-EP-04-F04-US-FE-01',
    group: GROUP,
    description: 'Limites por setor, região, grupo e produto com folga, alertas e tratativas.',
    keywords: ['concentracao', 'limite', 'setor', 'regiao', 'alerta'],
    element: <ConcentrationPage />,
  },
  {
    path: '/risco/carteira/frescor',
    href: '/risco/carteira/frescor',
    label: 'Frescor dos dados',
    epic: 'EP-04',
    usId: 'PRISMA-EP-04-F05-US-FE-01',
    group: GROUP,
    description: 'Idade de cada cubo agregado contra SLA, com recarga sob demanda.',
    keywords: ['frescor', 'cubo', 'sla', 'agregado', 'dados'],
    element: <FreshnessPage />,
  },
  {
    path: '/risco/carteira/comunidades',
    href: '/risco/carteira/comunidades',
    label: 'Bolsões de risco',
    epic: 'EP-04',
    usId: 'PRISMA-EP-04-F06-US-FE-01',
    group: GROUP,
    description: 'Comunidades detectadas, coesão, exposição agregada e drivers comuns.',
    keywords: ['comunidade', 'bolsao', 'cluster', 'coesao', 'correlacao'],
    element: <CommunitiesPage />,
  },
  {
    path: '/risco/carteira/retrospectiva',
    href: '/risco/carteira/retrospectiva',
    label: 'Retrospectiva da carteira',
    epic: 'EP-04',
    usId: 'PRISMA-EP-04-F07-US-FE-01',
    group: GROUP,
    description: 'Snapshots por data-base, comparação de métricas e linha do tempo de eventos.',
    keywords: ['retrospectiva', 'snapshot', 'as of', 'comparacao', 'historico'],
    element: <RetrospectivePage />,
  },
  {
    path: '/risco/carteira/dossie-comite',
    href: '/risco/carteira/dossie-comite',
    label: 'Dossiê de comitê',
    epic: 'EP-04',
    usId: 'PRISMA-EP-04-F08-US-FE-01',
    group: GROUP,
    description: 'Seleção e ordenação de seções, marca d\u2019água nominal e geração do PDF.',
    keywords: ['dossie', 'comite', 'relatorio', 'marca dagua', 'pdf'],
    element: <CommitteeReportPage />,
  },
  {
    path: '/risco/carteira/visao-2d',
    href: '/risco/carteira/visao-2d',
    label: 'Visão 2D e tabular',
    epic: 'EP-04',
    usId: 'PRISMA-EP-04-F09-US-FE-01',
    group: GROUP,
    description: 'Modo compatível sem WebGL com grafo SVG e tabela equivalente.',
    keywords: ['2d', 'webgl', 'acessibilidade', 'tabela', 'compatibilidade'],
    element: <Graph2DPage />,
  },
];

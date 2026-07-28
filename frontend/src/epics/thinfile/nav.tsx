import type { NavItem } from '@/app/types';
import { lazyScreen } from '@/app/lazyScreen';
const CoveragePage = lazyScreen(() => import('@/epics/thinfile/CoveragePage'), 'CoveragePage');
const ModelCardPage = lazyScreen(() => import('@/epics/thinfile/ModelCardPage'), 'ModelCardPage');
const CoachJourneyPage = lazyScreen(() => import('@/epics/thinfile/CoachJourneyPage'), 'CoachJourneyPage');
const ConsentPage = lazyScreen(() => import('@/epics/thinfile/ConsentPage'), 'ConsentPage');
const MissionsPage = lazyScreen(() => import('@/epics/thinfile/MissionsPage'), 'MissionsPage');
const SimulatorPage = lazyScreen(() => import('@/epics/thinfile/SimulatorPage'), 'SimulatorPage');
const OffersPage = lazyScreen(() => import('@/epics/thinfile/OffersPage'), 'OffersPage');
const UtilityLinkPage = lazyScreen(() => import('@/epics/thinfile/UtilityLinkPage'), 'UtilityLinkPage');
const DriftPage = lazyScreen(() => import('@/epics/thinfile/DriftPage'), 'DriftPage');

const GROUP = 'EP-06 · Thin-file & Coach';

export const thinfileNav: NavItem[] = [
  {
    path: '/thinfile/cobertura',
    href: '/thinfile/cobertura',
    label: 'Cobertura por parceiro',
    epic: 'EP-06',
    usId: 'PRISMA-EP-06-F01-US-FE-01',
    group: GROUP,
    description: 'Cobertura regional, qualidade por dimensão e lotes de ingestão por parceiro.',
    keywords: ['cobertura', 'parceiro', 'utilities', 'qualidade', 'ingestao'],
    element: <CoveragePage />,
  },
  {
    path: '/thinfile/ficha-modelo',
    href: '/thinfile/ficha-modelo',
    label: 'Ficha do modelo',
    epic: 'EP-06',
    usId: 'PRISMA-EP-06-F02-US-FE-01',
    group: GROUP,
    description: 'Finalidade, features, métricas, comparação com score tradicional e usos vedados.',
    keywords: ['model card', 'ficha', 'ks', 'auc', 'limitacoes'],
    element: <ModelCardPage />,
  },
  {
    path: '/coach/jornada',
    href: '/coach/jornada',
    label: 'Jornada do coach',
    epic: 'EP-06',
    usId: 'PRISMA-EP-06-F03-US-FE-01',
    group: GROUP,
    description: 'Trilha gamificada, metas semanais, sequência ativa e conquistas.',
    keywords: ['coach', 'jornada', 'gamificacao', 'metas', 'conquistas'],
    element: <CoachJourneyPage />,
  },
  {
    path: '/titular/privacidade',
    href: '/titular/privacidade',
    label: 'Central de privacidade',
    epic: 'EP-06',
    usId: 'PRISMA-EP-06-F04-US-FE-01',
    group: GROUP,
    description: 'Consentimento por finalidade, revogação imediata e histórico completo.',
    keywords: ['consentimento', 'privacidade', 'lgpd', 'revogar', 'finalidade'],
    element: <ConsentPage />,
  },
  {
    path: '/coach/missoes',
    href: '/coach/missoes',
    label: 'Catálogo de missões',
    epic: 'EP-06',
    usId: 'PRISMA-EP-06-F05-US-FE-01',
    group: GROUP,
    description: 'Missões por categoria e dificuldade, progresso, bloqueios e pontuação.',
    keywords: ['missao', 'catalogo', 'pontos', 'dificuldade', 'progresso'],
    element: <MissionsPage />,
  },
  {
    path: '/coach/simulador',
    href: '/coach/simulador',
    label: 'Simulador de impacto',
    epic: 'EP-06',
    usId: 'PRISMA-EP-06-F06-US-FE-01',
    group: GROUP,
    description: 'Faixa estimada de score por combinação de ações, com aviso de incerteza.',
    keywords: ['simulador', 'impacto', 'estimativa', 'score', 'projecao'],
    element: <SimulatorPage />,
  },
  {
    path: '/marketplace/ofertas',
    href: '/marketplace/ofertas',
    label: 'Vitrine de ofertas',
    epic: 'EP-06',
    usId: 'PRISMA-EP-06-F07-US-FE-01',
    group: GROUP,
    description: 'Ofertas elegíveis com explicação de elegibilidade e confirmação de envio.',
    keywords: ['marketplace', 'oferta', 'elegibilidade', 'parceiro', 'apply'],
    element: <OffersPage />,
  },
  {
    path: '/titular/vinculos',
    href: '/titular/vinculos',
    label: 'Vincular contas de consumo',
    epic: 'EP-06',
    usId: 'PRISMA-EP-06-F08-US-FE-01',
    group: GROUP,
    description: 'Assistente de vinculação, validação de titularidade e remoção de vínculo.',
    keywords: ['vinculo', 'utilities', 'energia', 'agua', 'telecom'],
    element: <UtilityLinkPage />,
  },
  {
    path: '/thinfile/monitoramento',
    href: '/thinfile/monitoramento',
    label: 'Deriva do modelo',
    epic: 'EP-06',
    usId: 'PRISMA-EP-06-F09-US-FE-01',
    group: GROUP,
    description: 'PSI por feature, performance por safra, alertas e gatilho de retreino.',
    keywords: ['deriva', 'psi', 'safra', 'monitoramento', 'retreino'],
    element: <DriftPage />,
  },
];

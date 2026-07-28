import type { NavItem } from '@/app/types';
import { lazyScreen } from '@/app/lazyScreen';
const FactorsPage = lazyScreen(() => import('@/epics/explicabilidade/FactorsPage'), 'FactorsPage');
const CounterfactualPage = lazyScreen(() => import('@/epics/explicabilidade/CounterfactualPage'), 'CounterfactualPage');
const DossierPage = lazyScreen(() => import('@/epics/explicabilidade/DossierPage'), 'DossierPage');
const AuditTrailPage = lazyScreen(() => import('@/epics/explicabilidade/AuditTrailPage'), 'AuditTrailPage');
const ReasonsCatalogPage = lazyScreen(() => import('@/epics/explicabilidade/ReasonsCatalogPage'), 'ReasonsCatalogPage');
const HumanReviewPage = lazyScreen(() => import('@/epics/explicabilidade/HumanReviewPage'), 'HumanReviewPage');
const FairnessPage = lazyScreen(() => import('@/epics/explicabilidade/FairnessPage'), 'FairnessPage');
const SubjectRightsPage = lazyScreen(() => import('@/epics/explicabilidade/SubjectRightsPage'), 'SubjectRightsPage');
const PolicySandboxPage = lazyScreen(() => import('@/epics/explicabilidade/PolicySandboxPage'), 'PolicySandboxPage');
const PolicyVersionsPage = lazyScreen(() => import('@/epics/explicabilidade/PolicyVersionsPage'), 'PolicyVersionsPage');

const GROUP = 'EP-02 · Explicabilidade';

export const explicabilidadeNav: NavItem[] = [
  {
    path: '/explicabilidade/decisoes/:decisionId/fatores',
    href: '/explicabilidade/decisoes/dec-2026-07-27-1104/fatores',
    label: 'Fatores da decisão',
    epic: 'EP-02',
    usId: 'PRISMA-EP-02-F01-US-FE-01',
    group: GROUP,
    description: 'Contribuição de cada atributo sobre o valor base do modelo, com detalhe por fator.',
    keywords: ['shap', 'fatores', 'explicacao', 'decisao', 'contribuicao'],
    element: <FactorsPage />,
  },
  {
    path: '/explicabilidade/decisoes/:decisionId/acoes',
    href: '/explicabilidade/decisoes/dec-2026-07-27-1104/acoes',
    label: 'Ações recomendadas',
    epic: 'EP-02',
    usId: 'PRISMA-EP-02-F02-US-FE-01',
    group: GROUP,
    description: 'Contrafactuais viáveis com faixa de ganho de score e simulação what-if.',
    keywords: ['contrafactual', 'recomendacao', 'what-if', 'score'],
    element: <CounterfactualPage />,
  },
  {
    path: '/compliance/dossies/emissao',
    href: '/compliance/dossies/emissao',
    label: 'Dossiê LGPD art. 20',
    epic: 'EP-02',
    usId: 'PRISMA-EP-02-F03-US-FE-01',
    group: GROUP,
    description: 'Emissão, pré-visualização e histórico do dossiê de decisão automatizada.',
    keywords: ['lgpd', 'dossie', 'art 20', 'pdf', 'titular'],
    element: <DossierPage />,
  },
  {
    path: '/compliance/auditoria/trilha',
    href: '/compliance/auditoria/trilha',
    label: 'Trilha de auditoria',
    epic: 'EP-02',
    usId: 'PRISMA-EP-02-F04-US-FE-01',
    group: GROUP,
    description: 'Eventos imutáveis encadeados por hash, com filtro por ator e exportação assinada.',
    keywords: ['auditoria', 'hash', 'imutavel', 'regulador', 'trilha'],
    element: <AuditTrailPage />,
  },
  {
    path: '/compliance/motivos/catalogo',
    href: '/compliance/motivos/catalogo',
    label: 'Motivos de recusa',
    epic: 'EP-02',
    usId: 'PRISMA-EP-02-F05-US-FE-01',
    group: GROUP,
    description: 'Curadoria da linguagem ao titular com legibilidade e fila de aprovação.',
    keywords: ['motivos', 'reason code', 'legibilidade', 'ux writing'],
    element: <ReasonsCatalogPage />,
  },
  {
    path: '/compliance/revisao-humana/fila',
    href: '/compliance/revisao-humana/fila',
    label: 'Revisão humana',
    epic: 'EP-02',
    usId: 'PRISMA-EP-02-F06-US-FE-01',
    group: GROUP,
    description: 'Fila priorizada, contexto da decisão e registro de decisão com justificativa.',
    keywords: ['revisao humana', 'sla', 'contestacao', 'analise'],
    element: <HumanReviewPage />,
  },
  {
    path: '/compliance/equidade/painel',
    href: '/compliance/equidade/painel',
    label: 'Equidade do modelo',
    epic: 'EP-02',
    usId: 'PRISMA-EP-02-F07-US-FE-01',
    group: GROUP,
    description: 'Disparate impact, equal opportunity gap e alertas por grupo comparado.',
    keywords: ['fairness', 'equidade', 'vies', 'disparate impact'],
    element: <FairnessPage />,
  },
  {
    path: '/compliance/direitos/solicitacoes',
    href: '/compliance/direitos/solicitacoes',
    label: 'Direitos do titular',
    epic: 'EP-02',
    usId: 'PRISMA-EP-02-F08-US-FE-01',
    group: GROUP,
    description: 'Fila do encarregado com prazo legal, identidade e histórico de tratativas.',
    keywords: ['lgpd', 'art 18', 'dpo', 'encarregado', 'direitos'],
    element: <SubjectRightsPage />,
  },
  {
    path: '/compliance/politicas/ensaio',
    href: '/compliance/politicas/ensaio',
    label: 'Ensaio de política',
    epic: 'EP-02',
    usId: 'PRISMA-EP-02-F09-US-FE-01',
    group: GROUP,
    description: 'Sandbox what-if com efeito em aprovação, perda esperada e segmentos sensíveis.',
    keywords: ['politica', 'simulacao', 'what-if', 'perda esperada'],
    element: <PolicySandboxPage />,
  },
  {
    path: '/compliance/politicas/versoes',
    href: '/compliance/politicas/versoes',
    label: 'Versões de política',
    epic: 'EP-02',
    usId: 'PRISMA-EP-02-F10-US-FE-01',
    group: GROUP,
    description: 'Linha do tempo, diff linha a linha traduzido em negócio e promoção rastreada.',
    keywords: ['versoes', 'diff', 'promocao', 'politica', 'rollback'],
    element: <PolicyVersionsPage />,
  },
];

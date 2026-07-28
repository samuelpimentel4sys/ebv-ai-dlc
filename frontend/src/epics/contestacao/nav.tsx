import type { NavItem } from '@/app/types';
import { lazyScreen } from '@/app/lazyScreen';
const DisputeTrackingPage = lazyScreen(() => import('@/epics/contestacao/DisputeTrackingPage'), 'DisputeTrackingPage');
const DisputeQueuePage = lazyScreen(() => import('@/epics/contestacao/DisputeQueuePage'), 'DisputeQueuePage');
const OnboardingPage = lazyScreen(() => import('@/epics/contestacao/OnboardingPage'), 'OnboardingPage');
const ConsolePage = lazyScreen(() => import('@/epics/contestacao/ConsolePage'), 'ConsolePage');
const TitularPortalPage = lazyScreen(() => import('@/epics/contestacao/TitularPortalPage'), 'TitularPortalPage');
const SlaRiskPage = lazyScreen(() => import('@/epics/contestacao/SlaRiskPage'), 'SlaRiskPage');
const CredentialsPage = lazyScreen(() => import('@/epics/contestacao/CredentialsPage'), 'CredentialsPage');
const AttachmentsPage = lazyScreen(() => import('@/epics/contestacao/AttachmentsPage'), 'AttachmentsPage');
const DeflectionPage = lazyScreen(() => import('@/epics/contestacao/DeflectionPage'), 'DeflectionPage');
const LivenessCapturePage = lazyScreen(() => import('@/epics/contestacao/LivenessCapturePage'), 'LivenessCapturePage');
const LivenessMfaPage = lazyScreen(() => import('@/epics/contestacao/LivenessMfaPage'), 'LivenessMfaPage');
const LivenessResultPage = lazyScreen(() => import('@/epics/contestacao/LivenessResultPage'), 'LivenessResultPage');

const GROUP = 'EP-05 · Contestação & Console B2B';

export const contestacaoNav: NavItem[] = [
  {
    path: '/titular/biometria',
    href: '/titular/biometria',
    label: 'Captura biométrica',
    epic: 'EP-05',
    usId: 'PRISMA-EP-05-F10-US-FE-01',
    group: GROUP,
    description: 'Consentimento LGPD, sessão Liveness e guia facial (lab stub/WireMock, sem Amplify).',
    keywords: ['biometria', 'liveness', 'rekognition', 'consentimento', 'camera'],
    element: <LivenessCapturePage />,
  },
  {
    path: '/titular/biometria/mfa',
    href: '/titular/biometria/mfa',
    label: 'MFA step-up',
    epic: 'EP-05',
    usId: 'PRISMA-EP-05-F11-US-FE-01',
    group: GROUP,
    description: 'Segundo fator após a sessão Liveness antes de liberar canal sensível.',
    keywords: ['mfa', 'otp', 'step-up', 'biometria', 'ial'],
    element: <LivenessMfaPage />,
  },
  {
    path: '/titular/biometria/resultado',
    href: '/titular/biometria/resultado',
    label: 'Resultado da biometria',
    epic: 'EP-05',
    usId: 'PRISMA-EP-05-F12-US-FE-01',
    group: GROUP,
    description: 'Feedback de vivacidade, lockout e próximo passo do titular.',
    keywords: ['biometria', 'vivacidade', 'score', 'lockout', 'resultado'],
    element: <LivenessResultPage />,
  },
  {
    path: '/titular/contestacoes/:protocolo',
    href: '/titular/contestacoes/CT-2026-448120',
    label: 'Acompanhar contestação',
    epic: 'EP-05',
    usId: 'PRISMA-EP-05-F01-US-FE-01',
    group: GROUP,
    description: 'Rastreio do protocolo com etapas, prazo e próxima ação do titular.',
    keywords: ['contestacao', 'protocolo', 'acompanhamento', 'titular', 'prazo'],
    element: <DisputeTrackingPage />,
  },
  {
    path: '/disputas/fila',
    href: '/disputas/fila',
    label: 'Fila de tratativas',
    epic: 'EP-05',
    usId: 'PRISMA-EP-05-F02-US-FE-01',
    group: GROUP,
    description: 'Fila por risco de SLA e canal, com painel de decisão e fundamentação.',
    keywords: ['fila', 'tratativa', 'analista', 'desfecho', 'sac'],
    element: <DisputeQueuePage />,
  },
  {
    path: '/b2b/onboarding',
    href: '/b2b/onboarding',
    label: 'Contratação self-service',
    epic: 'EP-05',
    usId: 'PRISMA-EP-05-F03-US-FE-01',
    group: GROUP,
    description: 'CNPJ, representante legal, aceite de contrato e credencial de sandbox.',
    keywords: ['onboarding', 'contratacao', 'cnpj', 'contrato', 'sandbox'],
    element: <OnboardingPage />,
  },
  {
    path: '/b2b/console',
    href: '/b2b/console',
    label: 'Console de consumo',
    epic: 'EP-05',
    usId: 'PRISMA-EP-05-F04-US-FE-01',
    group: GROUP,
    description: 'Consumo mensal, fatura projetada, contratos vigentes e usuários da conta.',
    keywords: ['console', 'consumo', 'fatura', 'contrato', 'usuarios'],
    element: <ConsolePage />,
  },
  {
    path: '/titular/registros',
    href: '/titular/registros',
    label: 'Portal do titular',
    epic: 'EP-05',
    usId: 'PRISMA-EP-05-F05-US-FE-01',
    group: GROUP,
    description: 'Apontamentos, consultas ao CPF, dados cadastrais e abertura de contestação.',
    keywords: ['portal', 'titular', 'lgpd', 'transparencia', 'registros'],
    element: <TitularPortalPage />,
  },
  {
    path: '/disputas/sla',
    href: '/disputas/sla',
    label: 'Risco de SLA',
    epic: 'EP-05',
    usId: 'PRISMA-EP-05-F06-US-FE-01',
    group: GROUP,
    description: 'Consumo do prazo por caso, faixas de risco e escalonamento por canal.',
    keywords: ['sla', 'prazo', 'escalonamento', 'procon', 'risco'],
    element: <SlaRiskPage />,
  },
  {
    path: '/b2b/credenciais',
    href: '/b2b/credenciais',
    label: 'Credenciais de API',
    epic: 'EP-05',
    usId: 'PRISMA-EP-05-F07-US-FE-01',
    group: GROUP,
    description: 'Criação com escopo mínimo, rotação sem downtime e revogação imediata.',
    keywords: ['credencial', 'oauth', 'escopo', 'rotacao', 'api'],
    element: <CredentialsPage />,
  },
  {
    path: '/disputas/:protocolo/evidencias',
    href: '/disputas/CT-2026-448120/evidencias',
    label: 'Evidências do caso',
    epic: 'EP-05',
    usId: 'PRISMA-EP-05-F08-US-FE-01',
    group: GROUP,
    description: 'Upload validado, varredura antivírus, pré-visualização e autoria dos anexos.',
    keywords: ['evidencia', 'anexo', 'upload', 'antivirus', 'documento'],
    element: <AttachmentsPage />,
  },
  {
    path: '/disputas/indicadores',
    href: '/disputas/indicadores',
    label: 'Desvio de atendimento',
    epic: 'EP-05',
    usId: 'PRISMA-EP-05-F09-US-FE-01',
    group: GROUP,
    description: 'Desvio digital, funil de conclusão no portal e economia frente ao SAC humano.',
    keywords: ['desvio', 'sac', 'economia', 'indicador', 'funil'],
    element: <DeflectionPage />,
  },
];

import { matchPath } from 'react-router-dom';
import type { EpicId, NavItem } from '@/app/types';
import { NAV_ITEMS } from '@/app/navigation';
import { persona, type Persona, type PersonaId } from '@/app/personas';

export interface Journey {
  id: string;
  epic: EpicId;
  personaId: PersonaId;
  title: string;
  /** Resultado que a persona alcança ao final da trilha. */
  goal: string;
  /** O que a operação passa a poder fazer — usado no fecho da trilha. */
  payoff: string;
  /** Hrefs em ordem de execução; cada tela pertence a exatamente uma trilha. */
  steps: string[];
}

export const JOURNEYS: Journey[] = [
  {
    id: 'ep01-operacao',
    epic: 'EP-01',
    personaId: 'plataforma',
    title: 'Operar o barramento de eventos',
    goal: 'Garantir ingestão íntegra e atributos frescos antes de qualquer decisão sair.',
    payoff: 'O atributo que alimenta o score tem origem, frescor e replay auditáveis.',
    steps: [
      '/dados/ingestao/conectores',
      '/plataforma/eventos/saude',
      '/dados/identidade/mesclagem',
      '/risco/features/catalogo',
      '/plataforma/observabilidade/slo',
      '/dados/replay/jobs',
    ],
  },
  {
    id: 'ep01-decisao',
    epic: 'EP-01',
    personaId: 'ciencia-dados',
    title: 'Promover modelo e provar a decisão de Maria',
    goal: 'Publicar a versão v4.2.0, decidir em tempo real e reconstruir o snapshot point-in-time.',
    payoff: 'A recusa de Maria fica reproduzível: mesmos atributos, mesma versão, mesmo resultado.',
    steps: [
      '/ml/models/registry',
      '/integracao/playground/decisoes',
      '/risco/score/12345678901/historico',
      '/compliance/decisoes/comparar',
    ],
  },
  {
    id: 'ep02-recusa',
    epic: 'EP-02',
    personaId: 'dpo',
    title: 'Explicar a recusa de Maria',
    goal: 'Transformar a decisão do modelo em explicação compreensível e dossiê LGPD.',
    payoff: 'Maria recebe motivo, caminho de melhoria e dossiê — sem depender do time de dados.',
    steps: [
      '/explicabilidade/decisoes/dec-2026-07-27-1104/fatores',
      '/explicabilidade/decisoes/dec-2026-07-27-1104/acoes',
      '/compliance/motivos/catalogo',
      '/compliance/dossies/emissao',
    ],
  },
  {
    id: 'ep02-regulador',
    epic: 'EP-02',
    personaId: 'compliance',
    title: 'Prestar contas ao regulador',
    goal: 'Comprovar rastreabilidade, equidade e atendimento aos direitos do titular.',
    payoff: 'A auditoria é respondida com evidência assinada em vez de planilha reconstruída.',
    steps: [
      '/compliance/auditoria/trilha',
      '/compliance/equidade/painel',
      '/compliance/direitos/solicitacoes',
      '/compliance/revisao-humana/fila',
    ],
  },
  {
    id: 'ep02-politica',
    epic: 'EP-02',
    personaId: 'politica-credito',
    title: 'Evoluir a política com segurança',
    goal: 'Ensaiar a mudança de regra e promover a versão com diff rastreado.',
    payoff: 'A política muda com impacto medido antes da publicação, não depois.',
    steps: ['/compliance/politicas/ensaio', '/compliance/politicas/versoes'],
  },
  {
    id: 'ep03-parecer',
    epic: 'EP-03',
    personaId: 'analista-pj',
    title: 'Do balanço da Aurora ao parecer aprovado',
    goal: 'Emitir parecer ancorado em evidência e aprovado na alçada correta.',
    payoff: 'O parecer da Aurora sai no mesmo dia, com cada afirmação ligada à página de origem.',
    steps: [
      '/pj/12345678000190/biblioteca',
      '/pj/documentos/doc-9f21/conferencia',
      '/pj/12345678000190/indices',
      '/pj/12345678000190/grupo-economico',
      '/pj/12345678000190/grounding',
      '/pj/pareceres/op-5512/editor',
      '/pj/pareceres/op-5512/verificacao',
      '/pj/pareceres/aprovacao',
    ],
  },
  {
    id: 'ep03-custo',
    epic: 'EP-03',
    personaId: 'plataforma',
    title: 'Controlar o custo da GenAI',
    goal: 'Saber quanto custou cada parecer e onde o consumo de tokens escapa do orçamento.',
    payoff: 'O copiloto entra em produção com custo por parecer previsível e com teto.',
    steps: ['/pj/telemetria/custo'],
  },
  {
    id: 'ep04-sistemico',
    epic: 'EP-04',
    personaId: 'risco-carteira',
    title: 'Rastrear o contágio a partir da Aurora',
    goal: 'Sair do grafo da carteira para bolsões e limites com tratativa definida.',
    payoff: 'A exposição encadeada da Aurora vira limite revisado antes do vencimento.',
    steps: [
      '/risco/carteira/frescor',
      '/risco/carteira/cockpit',
      '/risco/carteira/visao-2d',
      '/risco/carteira/contagio',
      '/risco/carteira/comunidades',
      '/risco/carteira/concentracao',
    ],
  },
  {
    id: 'ep04-comite',
    epic: 'EP-04',
    personaId: 'diretoria-risco',
    title: 'Do estresse macro ao comitê',
    goal: 'Levar cenário, histórico e dossiê assinado para a decisão do comitê.',
    payoff: 'O comitê decide sobre provisão com o cenário e a retrospectiva na mesma pasta.',
    steps: [
      '/risco/carteira/estresse',
      '/risco/carteira/retrospectiva',
      '/risco/carteira/dossie-comite',
    ],
  },
  {
    id: 'ep05-titular',
    epic: 'EP-05',
    personaId: 'titular',
    title: 'Contestar o apontamento indevido',
    goal: 'Abrir a contestação, acompanhar o prazo e anexar evidência sem ligar para o SAC.',
    payoff: 'Maria acompanha o próprio caso e o atendimento humano deixa de ser o único caminho.',
    steps: [
      '/titular/biometria',
      '/titular/biometria/mfa',
      '/titular/biometria/resultado',
      '/titular/registros',
      '/titular/contestacoes/CT-2026-448120',
      '/disputas/CT-2026-448120/evidencias',
    ],
  },
  {
    id: 'ep05-operacao',
    epic: 'EP-05',
    personaId: 'operador-disputa',
    title: 'Resolver a fila dentro do SLA',
    goal: 'Tratar casos por risco de prazo e comprovar o desvio de atendimento humano.',
    payoff: 'A fila passa a ser ordenada por risco legal, e o desvio de SAC fica medido.',
    steps: ['/disputas/fila', '/disputas/sla', '/disputas/indicadores'],
  },
  {
    id: 'ep05-b2b',
    epic: 'EP-05',
    personaId: 'integrador-b2b',
    title: 'Contratar e integrar por self-service',
    goal: 'Sair do cadastro para a primeira consulta paga sem intervenção comercial.',
    payoff: 'A Vega integra em horas e o time comercial só aparece na renovação.',
    steps: ['/b2b/onboarding', '/b2b/credenciais', '/b2b/console'],
  },
  {
    id: 'ep06-titular',
    epic: 'EP-06',
    personaId: 'titular',
    title: 'Construir histórico e voltar a ser elegível',
    goal: 'Consentir, vincular contas, evoluir com o coach e alcançar uma oferta elegível.',
    payoff: 'Maria sai de thin-file para elegível usando dado alternativo que ela autorizou.',
    steps: [
      '/titular/privacidade',
      '/titular/vinculos',
      '/coach/jornada',
      '/coach/missoes',
      '/coach/simulador',
      '/marketplace/ofertas',
    ],
  },
  {
    id: 'ep06-governanca',
    epic: 'EP-06',
    personaId: 'ciencia-dados',
    title: 'Sustentar o score thin-file',
    goal: 'Monitorar cobertura de parceiros, transparência do modelo e deriva em produção.',
    payoff: 'O score alternativo entra em produção com ficha pública e alarme de deriva.',
    steps: ['/thinfile/cobertura', '/thinfile/ficha-modelo', '/thinfile/monitoramento'],
  },
];

export function journeyPersona(journey: Journey): Persona {
  return persona(journey.personaId);
}

export function journeysByEpic(epic: EpicId): Journey[] {
  return JOURNEYS.filter((journey) => journey.epic === epic);
}

export function navItemByHref(href: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => item.href === href);
}

export function journeyItems(journey: Journey): NavItem[] {
  return journey.steps
    .map((href) => navItemByHref(href))
    .filter((item): item is NavItem => Boolean(item));
}

export interface JourneyPosition {
  journey: Journey;
  persona: Persona;
  index: number;
  total: number;
  previous?: NavItem;
  next?: NavItem;
}

/**
 * Localiza a trilha que contém a tela atual. A comparação usa o padrão de rota
 * da US-FE, e não o href de exemplo: assim que o operador navega para outro
 * protocolo ou outro CNPJ, a trilha continua reconhecendo onde ele está.
 */
export function journeyPosition(pathname: string): JourneyPosition | null {
  for (const journey of JOURNEYS) {
    const index = journey.steps.findIndex((href) => {
      if (href === pathname) return true;
      const item = navItemByHref(href);
      return item ? Boolean(matchPath(item.path, pathname)) : false;
    });
    if (index < 0) continue;
    return {
      journey,
      persona: persona(journey.personaId),
      index,
      total: journey.steps.length,
      previous: index > 0 ? navItemByHref(journey.steps[index - 1]) : undefined,
      next: index < journey.steps.length - 1 ? navItemByHref(journey.steps[index + 1]) : undefined,
    };
  }
  return null;
}

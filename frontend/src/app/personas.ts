/**
 * Elenco fixo da demonstração. Cada trilha aponta para uma persona daqui, o que
 * impede que a mesma função apareça com nomes diferentes em épicos diferentes.
 */
export type PersonaId =
  | 'plataforma'
  | 'ciencia-dados'
  | 'dpo'
  | 'compliance'
  | 'politica-credito'
  | 'analista-pj'
  | 'risco-carteira'
  | 'diretoria-risco'
  | 'operador-disputa'
  | 'titular'
  | 'integrador-b2b';

export interface Persona {
  id: PersonaId;
  /** Nome próprio: a demo é conduzida como história, não como lista de telas. */
  name: string;
  role: string;
  /** O que essa pessoa precisa resolver no seu dia. */
  need: string;
}

export const PERSONAS: Record<PersonaId, Persona> = {
  plataforma: {
    id: 'plataforma',
    name: 'Rafael Dias',
    role: 'Engenharia de plataforma de dados',
    need: 'Provar que o dado chegou íntegro e fresco antes de qualquer decisão sair.',
  },
  'ciencia-dados': {
    id: 'ciencia-dados',
    name: 'Camila Prado',
    role: 'Ciência de dados e governança de modelo',
    need: 'Promover uma versão de modelo e reconstruir depois a decisão que ela tomou.',
  },
  dpo: {
    id: 'dpo',
    name: 'Helena Braga',
    role: 'Encarregada de dados (DPO)',
    need: 'Explicar uma recusa em linguagem que o titular entenda e o regulador aceite.',
  },
  compliance: {
    id: 'compliance',
    name: 'Sérgio Matias',
    role: 'Compliance e auditoria interna',
    need: 'Comprovar trilha imutável, equidade e atendimento de direitos sem depender de TI.',
  },
  'politica-credito': {
    id: 'politica-credito',
    name: 'Otávio Lemos',
    role: 'Gestor de política de crédito',
    need: 'Ensaiar mudança de política e medir o impacto antes de publicar.',
  },
  'analista-pj': {
    id: 'analista-pj',
    name: 'Bruno Tavares',
    role: 'Analista de crédito pessoa jurídica',
    need: 'Emitir parecer ancorado em evidência no lugar de reler 200 páginas de balanço.',
  },
  'risco-carteira': {
    id: 'risco-carteira',
    name: 'Letícia Alencar',
    role: 'Analista de risco de carteira',
    need: 'Achar o bolsão de risco antes que ele vire perda e definir a tratativa.',
  },
  'diretoria-risco': {
    id: 'diretoria-risco',
    name: 'Cláudia Bastos',
    role: 'Diretoria de risco (CRO)',
    need: 'Levar cenário, histórico e dossiê assinado para a decisão do comitê.',
  },
  'operador-disputa': {
    id: 'operador-disputa',
    name: 'Diego Ramos',
    role: 'Operação de contestações',
    need: 'Tratar a fila pelo risco de estourar o prazo legal, não pela ordem de chegada.',
  },
  titular: {
    id: 'titular',
    name: 'Maria Souza',
    role: 'Titular pessoa física, histórico curto de crédito',
    need: 'Entender por que foi recusada, corrigir o que está errado e voltar a ser elegível.',
  },
  'integrador-b2b': {
    id: 'integrador-b2b',
    name: 'Paula Nunes',
    role: 'Tecnologia da Fintech Vega (cliente B2B)',
    need: 'Contratar e integrar a API sozinha, sem esperar time comercial.',
  },
};

export function persona(id: PersonaId): Persona {
  return PERSONAS[id];
}

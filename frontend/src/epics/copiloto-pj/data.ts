/**
 * DTOs e mocks do EP-03 — Copiloto de Crédito PJ.
 * Tipos derivados da seção 8.1 das US-FE PRISMA-EP-03-F01..F09.
 */

import { AURORA } from '@/app/story';

/**
 * Exposição consolidada do grupo: a Aurora responde por 48,2 mi dos 54,84 mi.
 * O parecer gerado pelo copiloto declara um número desatualizado de propósito —
 * é justamente esse desvio que o guardrail gf-02 aponta.
 */
const GROUP_TOTAL_EXPOSURE = 54_840_000;

/* ------------------------------------- F01 · extração de demonstrativos */

export interface ExtractedField {
  id: string;
  label: string;
  page: number;
  value: string;
  normalized: number | null;
  confidence: number;
  corrected?: boolean;
  group: 'Balanço patrimonial' | 'DRE' | 'Fluxo de caixa' | 'Cabeçalho';
}

export interface ExtractionResult {
  docId: string;
  cnpj: string;
  razaoSocial: string;
  fileName: string;
  pages: number;
  uploadedAt: string;
  status: 'processando' | 'conferencia' | 'aprovado';
  ocrEngine: string;
  fields: ExtractedField[];
}

export const extraction: ExtractionResult = {
  docId: AURORA.documentId,
  cnpj: AURORA.documentMasked,
  razaoSocial: AURORA.name,
  fileName: 'balanco-aurora-2025.pdf',
  pages: 18,
  uploadedAt: '2026-07-27T09:12:00Z',
  status: 'conferencia',
  ocrEngine: 'docai-tabular-v4',
  fields: [
    {
      id: 'cnpj',
      label: 'CNPJ',
      page: 1,
      value: AURORA.documentMasked,
      normalized: null,
      confidence: 0.99,
      group: 'Cabeçalho',
    },
    {
      id: 'exercicio',
      label: 'Exercício social',
      page: 1,
      value: '2025',
      normalized: 2025,
      confidence: 0.98,
      group: 'Cabeçalho',
    },
    {
      id: 'ativo_circulante',
      label: 'Ativo circulante',
      page: 4,
      value: 'R$ 18.420.500,00',
      normalized: 18_420_500,
      confidence: 0.96,
      group: 'Balanço patrimonial',
    },
    {
      id: 'ativo_total',
      label: 'Ativo total',
      page: 4,
      value: 'R$ 42.117.300,00',
      normalized: 42_117_300,
      confidence: 0.97,
      group: 'Balanço patrimonial',
    },
    {
      id: 'passivo_circulante',
      label: 'Passivo circulante',
      page: 5,
      value: 'R$ 12.905.700,00',
      normalized: 12_905_700,
      confidence: 0.94,
      group: 'Balanço patrimonial',
    },
    {
      id: 'divida_bruta',
      label: 'Dívida bruta',
      page: 5,
      value: 'R$ 19.860.000,00',
      normalized: 19_860_000,
      confidence: 0.71,
      group: 'Balanço patrimonial',
    },
    {
      id: 'patrimonio_liquido',
      label: 'Patrimônio líquido',
      page: 6,
      value: 'R$ 15.240.100,00',
      normalized: 15_240_100,
      confidence: 0.95,
      group: 'Balanço patrimonial',
    },
    {
      id: 'receita_liquida',
      label: 'Receita líquida',
      page: 9,
      value: 'R$ 61.480.000,00',
      normalized: 61_480_000,
      confidence: 0.98,
      group: 'DRE',
    },
    {
      id: 'ebitda',
      label: 'EBITDA',
      page: 9,
      value: 'R$ 7.928.000,00',
      normalized: 7_928_000,
      confidence: 0.62,
      group: 'DRE',
    },
    {
      id: 'lucro_liquido',
      label: 'Lucro líquido',
      page: 10,
      value: 'R$ 3.104.500,00',
      normalized: 3_104_500,
      confidence: 0.93,
      group: 'DRE',
    },
    {
      id: 'despesa_financeira',
      label: 'Despesa financeira',
      page: 10,
      value: 'R$ 2.412.000,00',
      normalized: 2_412_000,
      confidence: 0.88,
      group: 'DRE',
    },
    {
      id: 'caixa_operacional',
      label: 'Caixa gerado nas operações',
      page: 13,
      value: 'R$ 6.055.000,00',
      normalized: 6_055_000,
      confidence: 0.57,
      group: 'Fluxo de caixa',
    },
  ],
};

/* --------------------------------------------- F02 · grounding do RAG */

export interface Citation {
  citationId: string;
  docId: string;
  docName: string;
  page: number;
  chunkId: string;
  similarity: number;
  excerpt: string;
}

export interface RagAnswer {
  answerId: string;
  cnpj: string;
  question: string;
  answer: string;
  citations: Citation[];
  latencyMs: number;
  model: string;
}

export function ragQuery(question: string): RagAnswer {
  return {
    answerId: 'ans-77c4',
    cnpj: AURORA.documentMasked,
    question,
    answer:
      'A alavancagem medida por dívida líquida sobre EBITDA fechou 2025 em 2,2×, acima do covenant contratual de 2,0×. O aumento decorre da captação de R$ 6,4 milhões em capital de giro no terceiro trimestre, com amortização concentrada em 2027.',
    latencyMs: 1_840,
    model: 'gpt-analista-pj-mini',
    citations: [
      {
        citationId: 'cit-01',
        docId: AURORA.documentId,
        docName: 'balanco-aurora-2025.pdf',
        page: 5,
        chunkId: 'chunk-0412',
        similarity: 0.91,
        excerpt:
          'Empréstimos e financiamentos de curto prazo somaram R$ 8.412.000, com captação adicional de R$ 6.400.000 no terceiro trimestre destinada a capital de giro.',
      },
      {
        citationId: 'cit-02',
        docId: AURORA.documentId,
        docName: 'balanco-aurora-2025.pdf',
        page: 9,
        chunkId: 'chunk-0788',
        similarity: 0.87,
        excerpt:
          'O EBITDA do exercício alcançou R$ 7.928.000, equivalente a margem de 12,9% sobre a receita líquida.',
      },
      {
        citationId: 'cit-03',
        docId: 'doc-8a03',
        docName: 'contrato-financiamento-2024.pdf',
        page: 12,
        chunkId: 'chunk-0155',
        similarity: 0.83,
        excerpt:
          'A tomadora obriga-se a manter índice de dívida líquida sobre EBITDA igual ou inferior a 2,0 vezes, apurado anualmente.',
      },
    ],
  };
}

export const ragSuggestions = [
  'Qual a alavancagem atual e há quebra de covenant?',
  'Como evoluiu a margem EBITDA nos últimos três exercícios?',
  'Existem garantias reais já comprometidas?',
  'Qual a concentração de receita no maior cliente?',
];

/* ----------------------------------------------- F03 · minuta/parecer */

export interface OpinionSection {
  id: string;
  title: string;
  body: string;
  citations: string[];
  unverified?: boolean;
}

export interface Opinion {
  opinionId: string;
  cnpj: string;
  razaoSocial: string;
  status: 'rascunho' | 'em_aprovacao' | 'aprovado' | 'reprovado';
  generatedAt: string;
  generationMs: number;
  model: string;
  analyst: string;
  requestedLimit: number;
  suggestedLimit: number;
  sections: OpinionSection[];
}

export const opinion: Opinion = {
  opinionId: AURORA.opinionId,
  cnpj: AURORA.documentMasked,
  razaoSocial: AURORA.name,
  status: 'rascunho',
  generatedAt: '2026-07-27T10:02:00Z',
  generationMs: 148_000,
  model: 'gpt-analista-pj',
  analyst: 'carla.ribeiro',
  requestedLimit: 8_000_000,
  suggestedLimit: 5_500_000,
  sections: [
    {
      id: 'sumario',
      title: 'Sumário executivo',
      body: 'Indústria de alimentos com 22 anos de operação, receita líquida de R$ 61,5 milhões em 2025 e margem EBITDA de 12,9%. Solicita limite rotativo de R$ 8,0 milhões. Recomenda-se aprovação parcial de R$ 5,5 milhões, condicionada a garantia de recebíveis performados.',
      citations: ['cit-02'],
    },
    {
      id: 'financeiro',
      title: 'Análise financeira',
      body: 'A alavancagem por dívida líquida sobre EBITDA está em 2,2×, acima do covenant de 2,0× firmado no contrato de 2024. A liquidez corrente de 1,43 permanece adequada, com capital de giro positivo de R$ 5,5 milhões. A cobertura de juros de 3,29× indica capacidade de serviço da dívida, ainda que sensível a elevação de 200 pontos-base.',
      citations: ['cit-01', 'cit-03'],
    },
    {
      id: 'setor',
      title: 'Contexto setorial',
      body: 'O CNAE 10.13-9 apresenta retração de 3,1% em volume no último ano, com pressão de custo de energia. A empresa opera acima da mediana setorial de margem EBITDA (10,4%).',
      citations: [],
      unverified: true,
    },
    {
      id: 'grupo',
      title: 'Grupo econômico',
      body: `O ${AURORA.economicGroup} reúne 4 CNPJs com exposição consolidada de R$ 52,4 milhões, sendo R$ 3,4 milhões em atraso técnico inferior a 15 dias na controlada Aurora Logística.`,
      citations: [],
    },
    {
      id: 'recomendacao',
      title: 'Recomendação e condicionantes',
      body: 'Aprovar R$ 5,5 milhões em capital de giro, prazo de 24 meses, garantia de cessão fiduciária de recebíveis de 130% do saldo e covenant revisado de dívida líquida sobre EBITDA ≤ 2,3× com apuração semestral.',
      citations: ['cit-03'],
    },
  ],
};

/* --------------------------------------------- F04 · alçada/aprovação */

export interface ApprovalItem {
  opinionId: string;
  cnpj: string;
  razaoSocial: string;
  analyst: string;
  submittedAt: string;
  requestedLimit: number;
  suggestedLimit: number;
  authorityLevel: 'gerente' | 'superintendente' | 'comite';
  status: 'aguardando' | 'aprovado' | 'reprovado';
  riskGrade: string;
}

export const approvalQueue: ApprovalItem[] = [
  {
    opinionId: AURORA.opinionId,
    cnpj: AURORA.documentMasked,
    razaoSocial: AURORA.name,
    analyst: 'carla.ribeiro',
    submittedAt: '2026-07-27T10:40:00Z',
    requestedLimit: 8_000_000,
    suggestedLimit: 5_500_000,
    authorityLevel: 'superintendente',
    status: 'aguardando',
    riskGrade: AURORA.rating,
  },
  {
    opinionId: 'op-5508',
    cnpj: '98.765.432/0001-10',
    razaoSocial: 'Distribuidora Vale Verde S.A.',
    analyst: 'joao.prado',
    submittedAt: '2026-07-27T09:05:00Z',
    requestedLimit: 2_400_000,
    suggestedLimit: 2_400_000,
    authorityLevel: 'gerente',
    status: 'aguardando',
    riskGrade: 'A-',
  },
  {
    opinionId: 'op-5501',
    cnpj: '45.111.222/0001-33',
    razaoSocial: 'Transportes Ipê Ltda.',
    analyst: 'carla.ribeiro',
    submittedAt: '2026-07-26T17:22:00Z',
    requestedLimit: 15_000_000,
    suggestedLimit: 9_000_000,
    authorityLevel: 'comite',
    status: 'aguardando',
    riskGrade: 'B',
  },
  {
    opinionId: 'op-5488',
    cnpj: '77.888.999/0001-44',
    razaoSocial: 'Agro Serra Grande S.A.',
    analyst: 'marcos.leal',
    submittedAt: '2026-07-25T14:10:00Z',
    requestedLimit: 4_200_000,
    suggestedLimit: 4_200_000,
    authorityLevel: 'gerente',
    status: 'aprovado',
    riskGrade: 'A',
  },
];

export interface TrailEntry {
  at: string;
  actor: string;
  action: string;
  note?: string;
}

export const approvalTrail: TrailEntry[] = [
  { at: '2026-07-27T10:02:00Z', actor: 'copiloto-pj', action: 'MINUTA_GERADA', note: 'geração em 148 s, modelo gpt-analista-pj' },
  { at: '2026-07-27T10:21:00Z', actor: 'carla.ribeiro', action: 'MINUTA_EDITADA', note: '3 seções ajustadas, 1 afirmação removida' },
  { at: '2026-07-27T10:33:00Z', actor: 'guardrails', action: 'VERIFICACAO_EXECUTADA', note: '2 achados médios, 0 crítico' },
  { at: '2026-07-27T10:40:00Z', actor: 'carla.ribeiro', action: 'SUBMETIDO_APROVACAO', note: 'alçada superintendente por valor > R$ 5 mi' },
];

export const authorityMatrix = [
  { level: 'Analista', limit: 1_000_000, requires: 'auto-aprovação com parecer verificado' },
  { level: 'Gerente', limit: 5_000_000, requires: 'parecer verificado sem achado crítico' },
  { level: 'Superintendente', limit: 10_000_000, requires: 'parecer verificado + garantia formalizada' },
  { level: 'Comitê de crédito', limit: 50_000_000, requires: 'ata de comitê e dois votos favoráveis' },
];

/* ------------------------------------------ F05 · índices financeiros */

export interface FinancialRatio {
  id: string;
  name: string;
  value: number | null;
  unit: '×' | '%' | 'dias';
  formula: string;
  inputs: string;
  sectorMedian: number;
  interpretation: string;
  status: 'bom' | 'atencao' | 'critico' | 'nao_calculavel';
}

export const ratios: FinancialRatio[] = [
  {
    id: 'liquidez_corrente',
    name: 'Liquidez corrente',
    value: 1.43,
    unit: '×',
    formula: 'ativo circulante ÷ passivo circulante',
    inputs: '18.420.500 ÷ 12.905.700',
    sectorMedian: 1.32,
    interpretation: 'Capacidade de honrar obrigações de curto prazo acima da mediana do CNAE.',
    status: 'bom',
  },
  {
    id: 'divida_liquida_ebitda',
    name: 'Dívida líquida / EBITDA',
    value: 2.2,
    unit: '×',
    formula: '(dívida bruta − caixa) ÷ EBITDA',
    inputs: '(19.860.000 − 2.420.000) ÷ 7.928.000',
    sectorMedian: 1.8,
    interpretation: 'Acima do covenant contratual de 2,0×; exige condicionante.',
    status: 'critico',
  },
  {
    id: 'cobertura_juros',
    name: 'Cobertura de juros',
    value: 3.29,
    unit: '×',
    formula: 'EBITDA ÷ despesa financeira',
    inputs: '7.928.000 ÷ 2.412.000',
    sectorMedian: 3.1,
    interpretation: 'Serviço da dívida coberto, com folga moderada.',
    status: 'bom',
  },
  {
    id: 'margem_ebitda',
    name: 'Margem EBITDA',
    value: 12.9,
    unit: '%',
    formula: 'EBITDA ÷ receita líquida',
    inputs: '7.928.000 ÷ 61.480.000',
    sectorMedian: 10.4,
    interpretation: 'Rentabilidade operacional superior à mediana setorial.',
    status: 'bom',
  },
  {
    id: 'endividamento_pl',
    name: 'Dívida bruta / patrimônio líquido',
    value: 1.3,
    unit: '×',
    formula: 'dívida bruta ÷ patrimônio líquido',
    inputs: '19.860.000 ÷ 15.240.100',
    sectorMedian: 0.95,
    interpretation: 'Estrutura de capital mais alavancada que a do setor.',
    status: 'atencao',
  },
  {
    id: 'ciclo_caixa',
    name: 'Ciclo de conversão de caixa',
    value: null,
    unit: 'dias',
    formula: 'PMR + PME − PMP',
    inputs: 'PMP não extraído do documento',
    sectorMedian: 62,
    interpretation: 'Não calculável: prazo médio de pagamento ausente na extração.',
    status: 'nao_calculavel',
  },
  {
    id: 'roe',
    name: 'Retorno sobre patrimônio (ROE)',
    value: 20.4,
    unit: '%',
    formula: 'lucro líquido ÷ patrimônio líquido',
    inputs: '3.104.500 ÷ 15.240.100',
    sectorMedian: 14.2,
    interpretation: 'Retorno consistente com a margem operacional apurada.',
    status: 'bom',
  },
];

/* ---------------------------------------------- F06 · guardrails */

export interface GuardrailFinding {
  findingId: string;
  severity: 'critico' | 'medio' | 'baixo';
  type: 'afirmacao_sem_lastro' | 'numero_divergente' | 'linguagem_vedada' | 'citacao_invalida';
  section: string;
  claim: string;
  detail: string;
  suggestion: string;
  status: 'aberto' | 'aceito' | 'corrigido';
}

export interface GuardrailReport {
  opinionId: string;
  verifiedAt: string;
  claimsTotal: number;
  claimsGrounded: number;
  numbersChecked: number;
  numbersMatched: number;
  findings: GuardrailFinding[];
}

export const guardrailReport: GuardrailReport = {
  opinionId: AURORA.opinionId,
  verifiedAt: '2026-07-27T10:33:00Z',
  claimsTotal: 24,
  claimsGrounded: 21,
  numbersChecked: 18,
  numbersMatched: 17,
  findings: [
    {
      findingId: 'gf-01',
      severity: 'medio',
      type: 'afirmacao_sem_lastro',
      section: 'Contexto setorial',
      claim: 'O CNAE 10.13-9 apresenta retração de 3,1% em volume no último ano.',
      detail: 'Nenhum trecho recuperado sustenta o número de retração setorial.',
      suggestion: 'Citar o boletim setorial indexado ou remover o dado quantitativo.',
      status: 'aberto',
    },
    {
      findingId: 'gf-02',
      severity: 'medio',
      type: 'numero_divergente',
      section: 'Grupo econômico',
      claim: 'exposição consolidada de R$ 52,4 milhões',
      detail: 'A consulta de grupo retorna R$ 54,84 milhões na data de referência.',
      suggestion: 'Atualizar o valor para R$ 54,84 milhões conforme GET /pj/{cnpj}/group.',
      status: 'aberto',
    },
    {
      findingId: 'gf-03',
      severity: 'baixo',
      type: 'linguagem_vedada',
      section: 'Sumário executivo',
      claim: 'aprovação garantida caso apresente recebíveis',
      detail: 'Termo com promessa de resultado é vedado pela política de comunicação.',
      suggestion: 'Trocar por “aprovação condicionada à apresentação de recebíveis”.',
      status: 'corrigido',
    },
  ],
};

/* --------------------------------------- F07 · biblioteca do cliente */

export interface LibraryDocument {
  docId: string;
  name: string;
  type: 'balanco' | 'dre' | 'contrato' | 'certidao' | 'ata' | 'outros';
  sizeKb: number;
  uploadedAt: string;
  uploadedBy: string;
  indexStatus: 'indexado' | 'indexando' | 'falha' | 'nao_indexado';
  chunks: number;
  legalHold: boolean;
  retentionUntil: string;
}

export const library: LibraryDocument[] = [
  {
    docId: AURORA.documentId,
    name: 'balanco-aurora-2025.pdf',
    type: 'balanco',
    sizeKb: 4_318,
    uploadedAt: '2026-07-27T09:12:00Z',
    uploadedBy: 'carla.ribeiro',
    indexStatus: 'indexado',
    chunks: 412,
    legalHold: false,
    retentionUntil: '2031-07-27T00:00:00Z',
  },
  {
    docId: 'doc-8a03',
    name: 'contrato-financiamento-2024.pdf',
    type: 'contrato',
    sizeKb: 1_902,
    uploadedAt: '2026-05-14T11:30:00Z',
    uploadedBy: 'juridico.formalizacao',
    indexStatus: 'indexado',
    chunks: 188,
    legalHold: true,
    retentionUntil: '2034-05-14T00:00:00Z',
  },
  {
    docId: 'doc-7c55',
    name: 'dre-aurora-2024.pdf',
    type: 'dre',
    sizeKb: 2_204,
    uploadedAt: '2025-04-02T08:45:00Z',
    uploadedBy: 'carla.ribeiro',
    indexStatus: 'indexado',
    chunks: 231,
    legalHold: false,
    retentionUntil: '2030-04-02T00:00:00Z',
  },
  {
    docId: 'doc-6b12',
    name: 'certidao-negativa-federal.pdf',
    type: 'certidao',
    sizeKb: 340,
    uploadedAt: '2026-07-20T16:02:00Z',
    uploadedBy: 'joao.prado',
    indexStatus: 'indexando',
    chunks: 0,
    legalHold: false,
    retentionUntil: '2027-07-20T00:00:00Z',
  },
  {
    docId: 'doc-5d90',
    name: 'ata-assembleia-2026.pdf',
    type: 'ata',
    sizeKb: 878,
    uploadedAt: '2026-07-18T13:20:00Z',
    uploadedBy: 'juridico.formalizacao',
    indexStatus: 'falha',
    chunks: 0,
    legalHold: false,
    retentionUntil: '2032-07-18T00:00:00Z',
  },
];

/* ---------------------------------------- F08 · grupo econômico */

export interface GroupMember {
  cnpj: string;
  name: string;
  role: 'controladora' | 'controlada' | 'coligada' | 'parte_relacionada';
  participationPct: number;
  exposure: number;
  overdue: number;
  riskGrade: string;
}

export interface GroupResponse {
  rootCnpj: string;
  refreshedAt: string;
  truncated: boolean;
  depth: number;
  totalExposure: number;
  members: GroupMember[];
  edges: { from: string; to: string; label: string }[];
}

export const groupResponse: GroupResponse = {
  rootCnpj: AURORA.documentMasked,
  refreshedAt: '2026-07-27T08:00:00Z',
  truncated: true,
  depth: 3,
  totalExposure: GROUP_TOTAL_EXPOSURE,
  members: [
    {
      cnpj: AURORA.documentMasked,
      name: AURORA.shortName,
      role: 'controlada',
      participationPct: 100,
      exposure: AURORA.exposure,
      overdue: 0,
      riskGrade: AURORA.rating,
    },
    {
      cnpj: '11.222.333/0001-44',
      name: 'Aurora Participações',
      role: 'controladora',
      participationPct: 100,
      exposure: 1_240_000,
      overdue: 0,
      riskGrade: 'BBB',
    },
    {
      cnpj: '22.333.444/0001-55',
      name: 'Aurora Logística',
      role: 'controlada',
      participationPct: 70,
      exposure: 3_400_000,
      overdue: 3_400_000,
      riskGrade: 'B-',
    },
    {
      cnpj: '33.444.555/0001-66',
      name: 'Aurora Energia',
      role: 'coligada',
      participationPct: 35,
      exposure: 2_000_000,
      overdue: 0,
      riskGrade: 'BB',
    },
  ],
  edges: [
    { from: '11.222.333/0001-44', to: AURORA.documentMasked, label: '100%' },
    { from: '11.222.333/0001-44', to: '22.333.444/0001-55', label: '70%' },
    { from: AURORA.documentMasked, to: '33.444.555/0001-66', label: '35%' },
  ],
};

/* -------------------------------------------- F09 · custo por parecer */

export interface CostByModel {
  model: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  avgLatencyMs: number;
}

export interface CostByAnalyst {
  analyst: string;
  opinions: number;
  cost: number;
  avgCost: number;
  reworkPct: number;
}

export const costByModel: CostByModel[] = [
  {
    model: 'gpt-analista-pj',
    calls: 412,
    inputTokens: 8_240_000,
    outputTokens: 1_120_000,
    cost: 4_180.4,
    avgLatencyMs: 3_120,
  },
  {
    model: 'gpt-analista-pj-mini',
    calls: 3_180,
    inputTokens: 12_900_000,
    outputTokens: 2_040_000,
    cost: 1_246.8,
    avgLatencyMs: 940,
  },
  {
    model: 'embed-pj-v3',
    calls: 18_400,
    inputTokens: 41_200_000,
    outputTokens: 0,
    cost: 412.0,
    avgLatencyMs: 120,
  },
  {
    model: 'guardrails-verify',
    calls: 588,
    inputTokens: 3_100_000,
    outputTokens: 240_000,
    cost: 388.2,
    avgLatencyMs: 2_240,
  },
];

export const costByAnalyst: CostByAnalyst[] = [
  { analyst: 'carla.ribeiro', opinions: 84, cost: 1_412.6, avgCost: 16.82, reworkPct: 8.3 },
  { analyst: 'joao.prado', opinions: 71, cost: 1_298.4, avgCost: 18.29, reworkPct: 12.7 },
  { analyst: 'marcos.leal', opinions: 63, cost: 986.2, avgCost: 15.65, reworkPct: 6.3 },
  { analyst: 'ana.souza', opinions: 48, cost: 1_104.8, avgCost: 23.02, reworkPct: 18.8 },
];

export const costBudget = {
  monthlyBudget: 8_000,
  consumed: 6_227.4,
  targetCostPerOpinion: 18,
  actualCostPerOpinion: 17.68,
  opinionsMonth: 352,
};

export const routingPolicy = {
  rule: 'usar modelo completo quando limite solicitado > R$ 5 mi ou documentos > 40 páginas; caso contrário, usar mini',
  fullModelSharePct: 24,
  savingsPct: 38,
};

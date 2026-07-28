/**
 * Fixture canónica da demonstração.
 *
 * Antes disso cada épico inventava seus próprios números para o mesmo CPF e o
 * mesmo CNPJ, e a plateia via o score de Maria mudar entre duas telas da mesma
 * história. Todo mock que fale de Maria, da Aurora ou da Vega importa daqui.
 */

export const DEMO_DATE = '27/07/2026';
export const DEMO_TIMESTAMP = '2026-07-27T11:04:00-03:00';

/** Titular que atravessa EP-01 (decisão), EP-02 (explicação), EP-05 (contestação) e EP-06 (coach). */
export const MARIA = {
  name: 'Maria Souza',
  firstName: 'Maria',
  document: '12345678901',
  documentMasked: '123.456.789-01',
  score: 486,
  scoreBand: 'Baixo',
  previousScore: 512,
  decisionId: 'dec-2026-07-27-1104',
  decision: 'recusada' as const,
  decisionLabel: 'Crédito recusado',
  modelVersion: 'v4.2.0',
  /** Dois apontamentos ativos; o primeiro é o que ela contesta. */
  records: [
    {
      id: 'REG-88120',
      creditor: 'Loja Bonfim Varejo',
      amount: 1284.9,
      openedAt: '12/03/2026',
      disputed: true,
      protocol: 'CT-2026-448120',
    },
    {
      id: 'REG-91574',
      creditor: 'Telecom Sul',
      amount: 219.4,
      openedAt: '02/06/2026',
      disputed: false,
      protocol: null,
    },
  ],
  disputeProtocol: 'CT-2026-448120',
  /** Ganho projetado no simulador do coach quando a contestação procede. */
  scoreAfterDispute: 548,
} as const;

/** Cliente PJ de EP-03 que reaparece como nó de maior contágio em EP-04. */
export const AURORA = {
  name: 'Aurora Alimentos S.A.',
  shortName: 'Aurora Alimentos',
  document: '12345678000190',
  documentMasked: '12.345.678/0001-90',
  sector: 'Alimentos e bebidas',
  rating: 'BB−',
  exposure: 48_200_000,
  opinionId: 'op-5512',
  documentId: 'doc-9f21',
  /** Nó correspondente no grafo de carteira de EP-04. */
  graphNodeId: 'aurora',
  economicGroup: 'Grupo Aurora',
} as const;

/** PME que contrata o console B2B por self-service em EP-05. */
export const VEGA = {
  name: 'Fintech Vega',
  document: '45998211000133',
  documentMasked: '45.998.211/0001-33',
  clientId: 'vega-prod-4471',
  plan: 'Escala',
} as const;

export function maskDocument(digits: string): string {
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return digits;
}

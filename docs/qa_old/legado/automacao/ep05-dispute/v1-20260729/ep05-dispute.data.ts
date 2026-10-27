/** Smoke data — EP-05 live/mock (sem dependência externa de massa). */
export const ROUTES = {
  F01_DEMO: '/titular/contestacoes/CT-2026-448120?demo=1',
  F01_ROOT: '/titular/contestacoes?demo=1',
  F02: '/disputas/fila?demo=1',
  F03: '/b2b/onboarding?demo=1',
  F04: '/b2b/console?demo=1',
} as const;

export const MARIA = {
  protocol: 'CT-2026-448120',
  cpf: '123.456.789-01',
  cpfDigits: '12345678901',
};

export const VEGA = {
  cnpj: '45.998.211/0001-33',
  cnpjDigits: '45998211000133',
  clientId: 'vega-prod-4471',
};

export const TEST_USERS = {
  maria: { name: 'Maria Souza', document: MARIA.cpfDigits, disputeProtocol: MARIA.protocol },
  diego: { name: 'Diego Ramos', role: 'ROLE_ANALISTA_CONTESTACAO' },
  paula: { name: 'Paula Nunes', document: '32198765400', cnpj: VEGA.cnpjDigits },
};

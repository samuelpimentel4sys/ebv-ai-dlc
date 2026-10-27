/**
 * [DataForge] Dados de teste — EP-05 Contestação & Console B2B
 * Gerado a partir dos cenários BDD (CONTESTACAO-BDD-v1.md)
 * Constantes para preenchimento de UI / asserts Playwright (mock FE).
 */

// T-01 · [Positivo] Titular acessa o acompanhamento pelo protocolo
export const dadosT01 = {
  protocolo: 'CT-2026-448120',
  rota: '/titular/contestacoes/CT-2026-448120',
  cpf: '84729156382',
  tituloTela: 'Acompanhamento da contestação',
  situacao: 'Aguardando titular',
  proximaAcao: 'Enviar comprovante de pagamento',
  documentoMascarado: '847.***.**82',
};

// T-02 · [Negativo] Protocolo ou documento inválidos bloqueiam a consulta
export const dadosT02 = {
  protocolo: 'CT',
  documento: '123',
  erroProtocolo: 'Informe o protocolo completo, no formato CT-2026-000000.',
  erroDocumento: 'Informe os 11 números do CPF, sem pontos ou traço.',
};

// Q-01 · [Positivo] Analista abre a tratativa a partir da fila
export const dadosQ01 = {
  rota: '/disputas/fila',
  tituloTela: 'Tratativa de contestações',
  protocolo: 'CT-2026-448120',
  canal: 'portal',
  prioridade: 'alta',
};

// Q-02 · [Negativo] Fundamentação curta impede concluir o caso
export const dadosQ02 = {
  protocolo: 'CT-2026-448120',
  fundamentacao: 'ok',
  erroNote:
    'Descreva a análise em pelo menos 20 caracteres: o texto vai para o titular e para a auditoria.',
};

// Q-03 · [Regressivo] Filtro de canal sem casos informa fila vazia daquele canal
export const dadosQ03 = {
  canal: 'procon',
  labelCanal: 'Procon',
};

// O-01 · [Positivo] Empresa conclui a contratação até a credencial sandbox
export const dadosO01 = {
  rota: '/b2b/onboarding',
  tituloTela: 'Contratação self-service B2B',
  cnpj: '45998211000133',
  razaoSocial: 'Fintech Vega',
  segmento: 'fintech',
  representante: 'Paula Nunes',
  cpfRepresentante: '39018462713',
  email: 'paula.nunes@fintechvega.com.br',
  plano: 'escala',
  sucesso: 'Contratação concluída',
};

// O-02 · [Negativo] CNPJ incompleto bloqueia a primeira etapa
export const dadosO02 = {
  cnpj: '45998',
  razaoSocial: '',
  erroCnpj: 'Informe um CNPJ com 14 dígitos, sem pontos, barra ou traço.',
  tituloErro: 'Dados incompletos',
};

// C-01 · [Positivo] Admin B2B consulta consumo e fatura projetada
export const dadosC01 = {
  rota: '/b2b/console',
  tituloTela: 'Console de consumo e faturamento',
  metricaMes: 'Consultas no mês atual',
  faturaProjetada: 'Fatura projetada',
  faturaVencida: 'INV-2026-04',
};

// C-02 · [Negativo] Fatura vencida alerta risco de suspensão da API
export const dadosC02 = {
  alerta: 'Fatura vencida identificada',
  fatura: 'INV-2026-04',
  risco: '15 dias',
};

// C-04 · [Positivo] Atalho de credenciais leva à gestão de API
export const dadosC04 = {
  rotaOrigem: '/b2b/console',
  rotaEsperada: '/b2b/credenciais',
  link: 'Gerenciar credenciais',
  tituloDestino: 'Credenciais e escopos de API',
};

/**
 * [DataForge] Dados de teste — EP-05 Contestação & Console B2B
 * Gerado a partir dos cenários BDD (CONTESTACAO-BDD-v4.md)
 * Constantes JS alinhadas ao banco live (sem SQL). Fila vazia · tracking 404.
 */

export const dadosT01 = {
  protocolo: 'CT-2026-448120',
  rota: '/titular/contestacoes/CT-2026-448120',
  cpf: '84729156382',
  tituloTela: 'Acompanhamento da contestação',
  erroLive: 'Não foi possível carregar os dados.',
};

export const dadosT02 = {
  protocolo: 'CT',
  documento: '123',
  erroProtocolo: 'Informe o protocolo completo, no formato CT-2026-000000.',
  erroDocumento: 'Informe os 11 números do CPF, sem pontos ou traço.',
};

export const dadosQ01 = {
  rota: '/disputas/fila',
  tituloTela: 'Tratativa de contestações',
  filaVazia: 'Nenhuma contestação aguarda tratativa.',
};

export const dadosQ02 = {
  protocolo: 'CT-2026-448120',
  fundamentacao: 'ok',
  erroNote:
    'Descreva a análise em pelo menos 20 caracteres: o texto vai para o titular e para a auditoria.',
};

export const dadosQ03 = {
  canal: 'procon',
  labelCanal: 'Procon',
};

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

export const dadosO02 = {
  cnpj: '45998',
  razaoSocial: '',
  erroCnpj: 'Informe um CNPJ com 14 dígitos, sem pontos, barra ou traço.',
  tituloErro: 'Dados incompletos',
};

export const dadosC01 = {
  rota: '/b2b/console',
  tituloTela: 'Console de consumo e faturamento',
  metricaMes: 'Consultas no mês atual',
  faturaProjetada: 'Fatura projetada',
  produto: 'credit.score',
  fatura: 'INV-2026-07-001',
};

export const dadosC02 = {
  alerta: 'Fatura vencida identificada',
  fatura: 'INV-2026-04',
  risco: '15 dias',
};

export const dadosC04 = {
  rotaOrigem: '/b2b/console',
  rotaEsperada: '/b2b/credenciais',
  link: 'Gerenciar credenciais',
  tituloDestino: 'Credenciais e escopos de API',
};

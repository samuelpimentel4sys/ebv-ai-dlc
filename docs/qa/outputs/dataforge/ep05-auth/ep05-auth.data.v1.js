/**
 * [DataForge] Dados de teste — EP-05-AUTH
 * Gerado a partir de EP05-AUTH-BDD-v1.md (HTML AUTH + GherkinFlow DEMO)
 * Dados realistas BR para preenchimento via Playwright. Sem sequência de CPF.
 */

export const dadosAUTH01 = {
  titular: 'Carla Mendes',
  celular: '(11) 98764-2310',
  cpf: '84729156382',
  rota: '/titular/biometria',
  termo: 'Autorizo o tratamento biométrico facial',
};

export const dadosAUTH02 = {
  otpValido: '482917',
  resultadoEsperado: 'Identidade verificada',
  scoreEsperado: '92',
};

export const dadosAUTH03 = {
  guia: 'Centralize o rosto no oval',
  camera: 'Pré-visualização da câmera',
  botaoCaptura: 'Concluir captura (lab) → MFA',
};

export const dadosAUTH04 = {
  badgeTtl: 'TTL',
};

export const dadosAUTH05 = {
  guia: 'Centralize o rosto no oval',
};

export const dadosAUTH06 = {
  otpValido: '482917',
  ctaPortal: 'Seguir ao portal do titular',
  portal: '/titular/registros',
};

export const dadosAUTH07 = {
  otpInvalidoFormato: '123',
  mensagemFormato: 'Informe o código de 6 dígitos enviado ao canal cadastrado.',
};

export const dadosAUTH08 = {
  otpFalhaVivacidade: '000000',
  resultado: 'Vivacidade insuficiente',
};

export const dadosAUTH09 = {
  otpScoreBaixo: '000000',
  scoreEsperado: '42',
};

export const dadosAUTH10 = {
  avisoLab: 'Sem FaceLivenessDetector Amplify',
};

export const dadosAUTH11 = {
  mensagemCamera: 'Câmera indisponível neste ambiente',
};

export const dadosAUTH12 = {
  sessionKey: 'prisma.liveness.session',
  resultadoExpirado: 'Sessão expirada',
};

export const dadosAUTH13 = {
  termo: 'v1.0',
  rn: 'RN006',
};

export const dadosAUTH14 = {
  noticeLab: 'Lab Noah EP-05 F01 BIO',
};

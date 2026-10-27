import { test, expect } from '@playwright/test';
import { AuthPortalPage } from '../support/AuthPortalPage';
import {
  dadosAUTH01,
  dadosAUTH02,
  dadosAUTH03,
  dadosAUTH04,
  dadosAUTH05,
  dadosAUTH06,
  dadosAUTH07,
  dadosAUTH08,
  dadosAUTH09,
  dadosAUTH10,
  dadosAUTH11,
  dadosAUTH12,
  dadosAUTH13,
  dadosAUTH14,
} from '../../../dataforge/ep05-auth/ep05-auth.data.v2.js';

/**
 * DEMO QA Playwright — EP-05-AUTH v1
 * BDD: EP05-AUTH-BDD-v1.md (HTML 14 cenários)
 * Massa: ep05-auth.data.v2.js
 * UI: ep05-auth-ui.json via AuthPortalPage
 *
 * DEMO Reembolso usava 3–4 ativos (R-01, R-04, I-08, I-13).
 * Pacote proposto neste HTML = AUTH-01…AUTH-14 — todos ativos.
 */

const FAKE_CAMERA = `
(() => {
  const fakeStream = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx) { ctx.fillStyle = '#334155'; ctx.fillRect(0, 0, 640, 480); }
    return canvas.captureStream(8);
  };
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: fakeStream, enumerateDevices: async () => [] },
  });
})();
`;

const DENY_CAMERA = `
(() => {
  const deny = () => Promise.reject(new DOMException('Permission denied', 'NotAllowedError'));
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: deny, enumerateDevices: async () => [] },
  });
})();
`;

test.describe.configure({ retries: 0 });

test.beforeAll(async () => {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  🎬 DEMO QA — PRISMA EP-05-AUTH (v2)                 ║');
  console.log('╚══════════════════════════════════════════════════════╝');
});

test.beforeEach(async ({ page }, testInfo) => {
  console.log(`\n🧪 TESTANDO: ${testInfo.title}`);
  const deny = /AUTH-11/.test(testInfo.title);
  await page.addInitScript(deny ? DENY_CAMERA : FAKE_CAMERA);
});

test.afterEach(async ({}, testInfo) => {
  console.log(`🏁 ${testInfo.title} CONCLUÍDO`);
});

test('AUTH-01 [Positivo] Autenticação inicial e emissão de OTP', async ({ page }) => {
  const p = new AuthPortalPage(page);
  console.log('   → Abrindo captura biométrica (lab AUTH)...');
  await p.visitarCaptura();
  await expect(page.getByText(new RegExp(dadosAUTH01.termo, 'i'))).toBeVisible();
  await p.registrarConsentimento();
  await expect(p.btnSessao).toBeEnabled();
  console.log('   ✅ Consentimento ACTIVE — sessão disponível');
  void dadosAUTH01.cpf;
});

test('AUTH-02 [Positivo] Validação bem-sucedida do OTP', async ({ page }) => {
  const p = new AuthPortalPage(page);
  console.log('   → Indo ao MFA e submetendo OTP válido...');
  await p.irParaMfa();
  await p.submeterOtp(dadosAUTH02.otpValido);
  await expect(page.getByRole('heading', { name: dadosAUTH02.resultadoEsperado })).toBeVisible({
    timeout: 15_000,
  });
  console.log(`   ✅ ${dadosAUTH02.resultadoEsperado} (score lab ${dadosAUTH02.scoreEsperado})`);
});

test('AUTH-03 [Positivo] Validação biométrica facial e prova de vida', async ({ page }) => {
  const p = new AuthPortalPage(page);
  console.log('   → Sessão + guia oval...');
  await p.iniciarAteSessao();
  await expect(page.getByRole('heading', { name: /Guia facial/i })).toBeVisible();
  await expect(page.getByLabel(new RegExp(dadosAUTH03.camera, 'i'))).toBeVisible();
  await expect(p.btnConcluir).toBeEnabled();
  console.log('   ✅ Moldura pronta para captura lab');
});

test('AUTH-04 [Positivo] Reenvio / temporizador (lab TTL)', async ({ page }) => {
  const p = new AuthPortalPage(page);
  console.log('   → Conferindo temporizador de sessão...');
  await p.iniciarAteSessao();
  await expect(page.getByText(new RegExp(dadosAUTH04.badgeTtl, 'i')).first()).toBeVisible({
    timeout: 10_000,
  });
  console.log('   ✅ TTL visível');
});

test('AUTH-05 [Positivo] Ajuste de iluminação / guia oval', async ({ page }) => {
  const p = new AuthPortalPage(page);
  console.log('   → Conferindo instrução de enquadramento...');
  await p.iniciarAteSessao();
  await expect(page.getByText(new RegExp(dadosAUTH05.guia, 'i'))).toBeVisible();
  console.log('   ✅ Guia de captura visível');
});

test('AUTH-06 [Positivo] Conclusão MFA e acesso ao portal', async ({ page }) => {
  const p = new AuthPortalPage(page);
  console.log('   → MFA ok e avanço ao portal do titular...');
  await p.irParaMfa();
  await p.submeterOtp(dadosAUTH06.otpValido);
  await expect(page.getByRole('heading', { name: /Identidade verificada/i })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole('button', { name: dadosAUTH06.ctaPortal }).click();
  await expect(page).toHaveURL(new RegExp(dadosAUTH06.portal.replace(/\//g, '\\/')));
  console.log('   ✅ Portal do titular');
});

test('AUTH-07 [Negativo] Código de verificação em formato inválido', async ({ page }) => {
  const p = new AuthPortalPage(page);
  console.log('   → OTP incompleto deve bloquear...');
  await p.irParaMfa();
  await p.submeterOtp(dadosAUTH07.otpInvalidoFormato);
  await expect(page.getByText(dadosAUTH07.mensagemFormato)).toBeVisible();
  console.log('   ✅ Alerta de código inválido');
});

test('AUTH-08 [Negativo] Falha de vivacidade / bloqueio lab', async ({ page }) => {
  const p = new AuthPortalPage(page);
  console.log('   → OTP de falha de vivacidade...');
  await p.irParaMfa();
  await p.submeterOtp(dadosAUTH08.otpFalhaVivacidade);
  await expect(page.getByRole('heading', { name: dadosAUTH08.resultado })).toBeVisible({
    timeout: 15_000,
  });
  console.log(`   ✅ ${dadosAUTH08.resultado}`);
});

test('AUTH-09 [Negativo] Similaridade abaixo do patamar', async ({ page }) => {
  const p = new AuthPortalPage(page);
  console.log('   → Score lab abaixo do patamar...');
  await p.irParaMfa();
  await p.submeterOtp(dadosAUTH09.otpScoreBaixo);
  await expect(page.getByRole('heading', { name: /Vivacidade insuficiente/i })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(dadosAUTH09.scoreEsperado).first()).toBeVisible();
  console.log(`   ✅ Score ${dadosAUTH09.scoreEsperado}`);
});

test('AUTH-10 [Negativo] Prova de vida lab sem Amplify', async ({ page }) => {
  const p = new AuthPortalPage(page);
  console.log('   → Aviso de prova de vida fora do slice...');
  await p.visitarCaptura();
  await expect(page.getByText(new RegExp(dadosAUTH10.avisoLab, 'i'))).toBeVisible();
  console.log('   ✅ Contingência lab visível');
});

test('AUTH-11 [Negativo] Recusa de permissão da câmera', async ({ page }) => {
  const p = new AuthPortalPage(page);
  console.log('   → Câmera recusada...');
  await p.iniciarAteSessao();
  await expect(page.getByText(new RegExp(dadosAUTH11.mensagemCamera, 'i'))).toBeVisible({
    timeout: 15_000,
  });
  console.log('   ✅ Orientação de câmera');
});

test('AUTH-12 [Regressivo] Sessão expirada (TTL)', async ({ page }) => {
  const p = new AuthPortalPage(page);
  console.log('   → Injetando sessão vencida...');
  await p.visitarCaptura();
  await page.evaluate((key) => {
    const now = Date.now();
    sessionStorage.setItem(
      key,
      JSON.stringify({
        sessionId: 'sess-expirada-lab',
        customerId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        status: 'CREATED',
        createdAt: new Date(now - 200_000).toISOString(),
        expiresAt: new Date(now - 1_000).toISOString(),
        fromCache: false,
      }),
    );
  }, dadosAUTH12.sessionKey);
  await page.reload();
  await expect(page.getByText(/TTL 0s/i)).toBeVisible({ timeout: 10_000 });
  await p.btnConcluir.click();
  await expect(page.getByRole('heading', { name: dadosAUTH12.resultadoExpirado })).toBeVisible({
    timeout: 15_000,
  });
  console.log('   ✅ Sessão expirada');
});

test('AUTH-13 [Regressivo] Termo e purga LGPD (consentimento)', async ({ page }) => {
  const p = new AuthPortalPage(page);
  console.log('   → Termo biométrico...');
  await p.visitarCaptura();
  await expect(page.getByText(new RegExp(dadosAUTH13.termo.replace('.', '\\.')))).toBeVisible();
  await expect(page.getByText(new RegExp(dadosAUTH13.rn))).toBeVisible();
  console.log('   ✅ Termo v1.0 / RN006');
});

test('AUTH-14 [Regressivo] Contingência do serviço biométrico', async ({ page }) => {
  const p = new AuthPortalPage(page);
  console.log('   → Notice de contingência lab...');
  await p.visitarCaptura();
  await expect(page.getByText(new RegExp(dadosAUTH14.noticeLab, 'i'))).toBeVisible();
  console.log('   ✅ Indisponibilidade lab sem detalhe interno');
});

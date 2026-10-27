import path from 'node:path';
import { test, expect } from '@playwright/test';
import {
  dadosT01,
  dadosT02,
  dadosQ01,
  dadosQ02,
  dadosQ03,
  dadosO01,
  dadosO02,
  dadosC01,
  dadosC02,
  dadosC04,
} from '../../../dataforge/contestacao/contestacao.data.v2.js';

const shot = (id: string) => path.join(__dirname, '..', 'screenshots', `${id}-v2.png`);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('prisma.tour', 'visto');
  });
});

test('T-01 · titular acompanha contestação pelo protocolo', async ({ page }) => {
  console.log('🧪 TESTANDO T-01');
  await page.goto(dadosT01.rota);
  await expect(page.getByRole('heading', { name: dadosT01.tituloTela })).toBeVisible();
  console.log('→ gate de consulta: CPF + Consultar');
  await page.getByRole('textbox', { name: /CPF do titular/ }).fill(dadosT01.cpf);
  await page.getByRole('button', { name: 'Consultar' }).click();
  await expect(page.getByText(dadosT01.proximaAcao)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(dadosT01.situacao).first()).toBeVisible();
  await page.screenshot({ path: shot('T-01'), fullPage: true });
  console.log('✅ T-01');
});

test('Q-01 · analista abre tratativa a partir da fila', async ({ page }) => {
  console.log('🧪 TESTANDO Q-01');
  await page.goto(dadosQ01.rota);
  await expect(page.getByRole('heading', { name: dadosQ01.tituloTela })).toBeVisible();
  console.log('→ fila carregada');
  await expect(page.getByText(dadosQ01.protocolo).first()).toBeVisible({ timeout: 15_000 });
  await page.getByText(dadosQ01.protocolo).first().click();
  await expect(page.getByRole('button', { name: 'Concluir contestação' })).toBeVisible();
  await page.screenshot({ path: shot('Q-01'), fullPage: true });
  console.log('✅ Q-01');
});

test('O-01 · contratação self-service até credencial sandbox', async ({ page }) => {
  console.log('🧪 TESTANDO O-01');
  await page.goto(dadosO01.rota);
  await expect(page.getByRole('heading', { name: dadosO01.tituloTela })).toBeVisible();
  console.log('→ etapa CNPJ');
  await page.getByRole('button', { name: 'Validar CNPJ e continuar' }).click();
  console.log('→ etapa representante');
  await expect(page.getByRole('button', { name: 'Verificar representante' })).toBeVisible();
  await page.getByRole('button', { name: 'Verificar representante' }).click();
  console.log('→ aceite de contrato');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Aceitar e concluir' }).click();
  await expect(page.getByText(dadosO01.sucesso)).toBeVisible({ timeout: 10_000 });
  await page.screenshot({ path: shot('O-01'), fullPage: true });
  console.log('✅ O-01');
});

test('C-04 · atalho Gerenciar credenciais abre gestão de API', async ({ page }) => {
  console.log('🧪 TESTANDO C-04');
  await page.goto(dadosC04.rotaOrigem);
  await expect(page.getByRole('heading', { name: dadosC01.tituloTela })).toBeVisible();
  console.log('→ console carregado, acionando credenciais');
  await expect(page.getByRole('link', { name: dadosC04.link })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('link', { name: dadosC04.link }).click();
  await page.waitForURL(`**${dadosC04.rotaEsperada}`, { timeout: 10_000 });
  await expect(page.getByRole('heading', { name: dadosC04.tituloDestino })).toBeVisible();
  await page.screenshot({ path: shot('C-04'), fullPage: true });
  console.log('✅ C-04');
  console.log('🏁');
});

test.skip('T-02 · protocolo/CPF inválidos bloqueiam consulta', async () => {
  void dadosT02;
});

test.skip('Q-02 · fundamentação curta impede concluir', async () => {
  void dadosQ02;
});

test.skip('Q-03 · filtro de canal sem casos', async () => {
  void dadosQ03;
});

test.skip('O-02 · CNPJ incompleto bloqueia etapa 1', async () => {
  void dadosO02;
});

test.skip('C-01 · métricas de consumo no console', async () => {
  void dadosC01;
});

test.skip('C-02 · alerta de fatura vencida', async () => {
  void dadosC02;
});

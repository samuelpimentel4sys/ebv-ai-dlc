import { type Page, type Locator, expect } from '@playwright/test';

/** Locators alinhados a docs/qa/inputs/ui-elements/ep05-auth-ui.json */
export class AuthPortalPage {
  readonly page: Page;
  readonly chkTermo: Locator;
  readonly btnConsentimento: Locator;
  readonly btnSessao: Locator;
  readonly btnConcluir: Locator;
  readonly campoOtp: Locator;
  readonly btnConfirmarMfa: Locator;

  constructor(page: Page) {
    this.page = page;
    this.chkTermo = page.getByRole('checkbox');
    this.btnConsentimento = page.getByRole('button', { name: /Registrar consentimento/i });
    this.btnSessao = page.getByRole('button', { name: /^Criar sessão$/i });
    this.btnConcluir = page.getByRole('button', { name: 'Concluir captura (lab) → MFA' });
    this.campoOtp = page.getByLabel(/^OTP$/i);
    this.btnConfirmarMfa = page.getByRole('button', { name: /Confirmar MFA/i });
  }

  async visitarCaptura() {
    await this.page.goto('/titular/biometria');
    await expect(this.page.getByRole('heading', { name: /Captura biométrica/i })).toBeVisible();
  }

  async registrarConsentimento() {
    await this.chkTermo.check();
    await this.btnConsentimento.click();
    await expect(this.page.getByText(/Consentimento ACTIVE/i).first()).toBeVisible({ timeout: 20_000 });
  }

  async criarSessao() {
    await this.btnSessao.click();
    await expect(this.page.getByText(/session_id/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(this.btnConcluir).toBeEnabled({ timeout: 20_000 });
  }

  async iniciarAteSessao() {
    await this.visitarCaptura();
    await this.registrarConsentimento();
    await this.criarSessao();
  }

  async irParaMfa() {
    await this.iniciarAteSessao();
    await this.btnConcluir.click();
    await expect(this.page.getByRole('heading', { name: /MFA step-up/i })).toBeVisible({ timeout: 15_000 });
  }

  async submeterOtp(codigo: string) {
    await this.campoOtp.fill(codigo);
    await this.btnConfirmarMfa.click();
  }
}

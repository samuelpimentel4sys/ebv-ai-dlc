import { test, expect } from '@playwright/test';
import { SCENARIO_DATA, TEST_USERS } from './modulo.data';

test('[MOD-01] Colaborador visualiza apenas área permitida', async ({ page }) => {
  console.log('\n🧪 TESTANDO: [MOD-01]');
  const { user } = SCENARIO_DATA['MOD-01'];

  // TODO: login com user.cpf — usar seletores de inputs/ui-elements/{modulo}-ui.json
  await page.goto('/');

  await expect(page.getByRole('tab', { name: 'Meus Reembolsos' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Gestão ADM' })).not.toBeVisible();

  console.log('🏁 [MOD-01] CONCLUÍDO');
});

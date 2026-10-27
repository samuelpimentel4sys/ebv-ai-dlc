/**
 * Dados de teste — derivados de outputs/massa-dados/{modulo}-massa-v1.sql
 * Mapeamento cenário → credenciais / IDs
 */
export const TEST_USERS = {
  colaborador: {
    cpf: '52998224725',
    perfil: 'Colaborador',
  },
  gestor: {
    cpf: '34879381543',
    perfil: 'Gestor',
  },
} as const;

export const SCENARIO_DATA = {
  'MOD-01': { user: TEST_USERS.colaborador },
  'MOD-02': { user: TEST_USERS.gestor },
} as const;

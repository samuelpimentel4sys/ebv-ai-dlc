/**
 * Move o foco para o primeiro controle inválido dentro do escopo.
 * Preferência: `[aria-invalid="true"]`, depois borda de erro do DS.
 * Usado pelos formulários que validam inline (seção 20 do Equifax DS).
 */
export function focusFirstInvalid(scope: HTMLElement | null | undefined): void {
  if (!scope) return;
  const target =
    scope.querySelector<HTMLElement>('[aria-invalid="true"]') ??
    scope.querySelector<HTMLElement>('.border-eqx-danger');
  target?.focus();
}

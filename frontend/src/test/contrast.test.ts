import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * A seção 25 do Equifax DS exige 4.5:1 para texto normal e 3:1 para texto
 * grande e componentes de interface. axe-core não mede contraste em jsdom
 * porque não há layout, então o teste lê o próprio arquivo de tokens e calcula
 * a razão. Qualquer alteração de paleta que reprove a norma quebra aqui.
 */

const CSS = readFileSync(resolve(__dirname, '../styles/eqx-tokens.css'), 'utf8');

function parseBlock(selector: string): Record<string, string> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = CSS.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\n\\}`));
  if (!match) throw new Error(`Bloco não encontrado no arquivo de tokens: ${selector}`);
  const entries: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const declaration = line.split('/*')[0].trim();
    const [name, ...rest] = declaration.split(':');
    if (!name?.startsWith('--') || rest.length === 0) continue;
    entries[name.trim()] = rest.join(':').replace(';', '').trim();
  }
  return entries;
}

const light = parseBlock(':root');
const dark = { ...light, ...parseBlock("[data-theme='dark']") };

function resolveToken(scope: Record<string, string>, name: string, depth = 0): [number, number, number] {
  if (depth > 10) throw new Error(`Referência circular no token ${name}`);
  const raw = scope[name];
  if (!raw) throw new Error(`Token inexistente: ${name}`);
  const reference = raw.match(/^var\((--[\w-]+)\)$/);
  if (reference) return resolveToken(scope, reference[1], depth + 1);
  const channels = raw.split(/\s+/).map(Number);
  if (channels.length !== 3 || channels.some(Number.isNaN)) {
    throw new Error(`Token ${name} não é um trio RGB: "${raw}"`);
  }
  return [channels[0], channels[1], channels[2]];
}

function luminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function ratio(scope: Record<string, string>, foreground: string, background: string): number {
  const a = luminance(resolveToken(scope, foreground));
  const b = luminance(resolveToken(scope, background));
  const [lighter, darker] = a > b ? [a, b] : [b, a];
  return (lighter + 0.05) / (darker + 0.05);
}

/** Pares realmente usados na aplicação. Primeiro elemento é a tinta. */
const TEXT_PAIRS: [string, string, string][] = [
  ['--color-text', '--color-surface', 'corpo sobre superfície'],
  ['--color-text', '--color-bg', 'corpo sobre fundo'],
  ['--color-text', '--color-surface-subtle', 'corpo sobre superfície suave'],
  ['--color-text-muted', '--color-surface', 'texto secundário sobre superfície'],
  ['--color-text-muted', '--color-surface-subtle', 'texto secundário na sidebar'],
  ['--color-action', '--color-surface', 'link sobre superfície'],
  ['--color-action', '--color-surface-subtle', 'link na sidebar'],
  ['--color-brand-text', '--color-surface', 'item ativo da sidebar'],
  ['--color-brand-text', '--color-surface-subtle', 'item ativo sobre superfície suave'],
  ['--color-text-inverse', '--color-brand', 'rótulo sobre preenchimento da marca'],
  ['--color-accent-text', '--color-surface', 'eyebrow e rótulo de destaque'],
  ['--color-accent-text', '--color-surface-subtle', 'eyebrow sobre superfície suave'],
  ['--color-success', '--color-success-bg', 'badge de sucesso'],
  ['--color-warning', '--color-warning-bg', 'badge de alerta'],
  ['--color-danger', '--color-danger-bg', 'badge de erro'],
  ['--color-info', '--color-info-bg', 'badge informativo'],
  ['--color-danger', '--color-surface', 'mensagem de erro em formulário'],
  ['--color-text-inverse', '--color-surface-strong', 'cabeçalho de tabela'],
  ['--button-text', '--button-bg', 'rótulo do botão primário'],
];

/** Bordas, foco e preenchimentos: exigência de 3:1 para componentes. */
const UI_PAIRS: [string, string, string][] = [
  ['--color-border-strong', '--color-surface', 'borda de campo'],
  ['--color-brand-text', '--color-surface-subtle', 'barra lateral do item ativo'],
  ['--color-focus', '--color-surface', 'anel de foco'],
  ['--color-focus', '--color-surface-subtle', 'anel de foco na sidebar'],
  ['--color-action', '--color-surface', 'preenchimento de barra'],
];

describe.each([
  ['claro', light],
  ['escuro', dark],
])('contraste do tema %s', (_theme, scope) => {
  it.each(TEXT_PAIRS)('%s sobre %s (%s) atinge 4.5:1', (foreground, background, description) => {
    const value = ratio(scope, foreground, background);
    expect(value, `${description}: ${value.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
  });

  it.each(UI_PAIRS)('%s sobre %s (%s) atinge 3:1', (foreground, background, description) => {
    const value = ratio(scope, foreground, background);
    expect(value, `${description}: ${value.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);
  });
});

describe('escala de camadas', () => {
  it('declara a escala fechada da seção 12 do DS', () => {
    for (const [token, expected] of [
      ['--z-base', '0'],
      ['--z-dropdown', '50'],
      ['--z-sticky', '100'],
      ['--z-overlay', '200'],
      ['--z-modal', '300'],
      ['--z-toast', '400'],
      ['--z-tooltip', '500'],
    ] as const) {
      expect(light[token], `token ${token} ausente ou divergente`).toBe(expected);
    }
  });
});

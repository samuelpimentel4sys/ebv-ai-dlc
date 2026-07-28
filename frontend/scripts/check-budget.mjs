/**
 * Verifica os budgets de performance definidos no Equifax Design System v1.0
 * contra o resultado do build em dist/.
 */
import { gzipSync } from 'node:zlib';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ASSETS = 'dist/assets';
const BUDGETS = {
  cssKb: 50,
  initialJsGzipKb: 150,
  chunkKb: 500,
};

if (!existsSync(ASSETS)) {
  console.error('dist/assets não encontrado. Rode `npm run build` antes.');
  process.exit(1);
}

const files = readdirSync(ASSETS).map((name) => {
  const path = join(ASSETS, name);
  const raw = readFileSync(path);
  return {
    name,
    kb: statSync(path).size / 1024,
    gzipKb: gzipSync(raw).length / 1024,
  };
});

const css = files.filter((file) => file.name.endsWith('.css'));
const cssKb = css.reduce((sum, file) => sum + file.kb, 0);
const entry = files
  .filter((file) => file.name.startsWith('index-') && file.name.endsWith('.js'))
  .reduce((sum, file) => sum + file.gzipKb, 0);
const oversized = files.filter((file) => file.name.endsWith('.js') && file.kb > BUDGETS.chunkKb);

const results = [
  {
    label: `CSS total (< ${BUDGETS.cssKb} KB)`,
    value: `${cssKb.toFixed(1)} KB`,
    ok: cssKb < BUDGETS.cssKb,
  },
  {
    label: `JS inicial gzip (< ${BUDGETS.initialJsGzipKb} KB)`,
    value: `${entry.toFixed(1)} KB`,
    ok: entry < BUDGETS.initialJsGzipKb,
  },
  {
    label: `Nenhum chunk acima de ${BUDGETS.chunkKb} KB`,
    value: oversized.length === 0 ? 'ok' : oversized.map((file) => file.name).join(', '),
    ok: oversized.length === 0,
  },
  {
    label: 'Telas em chunks sob demanda (> 40 arquivos)',
    value: `${files.filter((file) => file.name.endsWith('.js')).length} chunks`,
    ok: files.filter((file) => file.name.endsWith('.js')).length > 40,
  },
];

let failed = false;
for (const result of results) {
  console.log(`${result.ok ? 'PASS' : 'FAIL'}  ${result.label}: ${result.value}`);
  if (!result.ok) failed = true;
}

process.exit(failed ? 1 : 0);

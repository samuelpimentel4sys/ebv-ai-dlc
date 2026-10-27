/**
 * Status do bug manual de self-healing (Console B2B / C-04).
 * CLI: node docs/qa/scripts/qa-bug.cjs status | marker
 */
const fs = require('node:fs');
const path = require('node:path');
const { repoRoot } = require('./qa-modulo.cjs');

const target = path.join(repoRoot, 'frontend', 'src', 'epics', 'contestacao', 'ConsolePage.tsx');
const MARKER = 'credenciais-invalido';
const HEALTHY = 'to="/b2b/credenciais"';

const command = process.argv[2] || 'status';
const src = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
const ativo = src.includes(MARKER);

if (command === 'marker') {
  console.log(MARKER);
  process.exit(0);
}

console.log(JSON.stringify({
  arquivo: 'frontend/src/epics/contestacao/ConsolePage.tsx',
  ativo,
  rota: ativo ? '/b2b/credenciais-invalido' : '/b2b/credenciais',
  cenario: 'C-04',
  saudavel: src.includes(HEALTHY),
}, null, 2));

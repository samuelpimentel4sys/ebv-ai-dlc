/**
 * Checks de ambiente da esteira QA Prisma.
 * CLI: node docs/qa/scripts/qa-env-check.cjs
 */
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const { qaRoot, repoRoot } = require('./qa-modulo.cjs');

const frontendRoot = path.join(repoRoot, 'frontend');
const VITE_PORT = 5173;
const JAVA_PORT = 8080;
const PYTHON_PORT = 8090;

function isTcpPortOpen(port, host = 'localhost', timeoutMs = 1500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const onDone = (open) => {
      socket.destroy();
      resolve(open);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => onDone(true));
    socket.once('timeout', () => onDone(false));
    socket.once('error', () => onDone(false));
    socket.connect(port, host);
  });
}

function exists(rel) {
  const abs = path.join(repoRoot, rel);
  return { rel, ok: fs.existsSync(abs) };
}

async function main() {
  const checks = [];
  checks.push({ nome: 'Node', ok: true, detalhe: process.version });
  checks.push({ nome: 'frontend/package.json', ...exists('frontend/package.json'), detalhe: exists('frontend/package.json').ok ? 'ok' : 'ausente' });
  checks.push({ nome: 'docs/qa/agentes', ok: fs.existsSync(path.join(qaRoot, 'agentes')), detalhe: 'elenco' });
  checks.push({ nome: 'docs/qa/modulos', ok: fs.existsSync(path.join(qaRoot, 'modulos')), detalhe: 'manifestos' });

  const viteUp = await isTcpPortOpen(VITE_PORT);
  const javaUp = await isTcpPortOpen(JAVA_PORT);
  const pyUp = await isTcpPortOpen(PYTHON_PORT);

  checks.push({ nome: `Front Vite :${VITE_PORT}`, ok: viteUp, detalhe: viteUp ? 'UP' : 'DOWN — npm run dev em frontend/' });
  checks.push({ nome: `Backend Java :${JAVA_PORT}`, ok: javaUp, detalhe: javaUp ? 'UP' : 'DOWN (opcional no mock FE)' });
  checks.push({ nome: `Python :${PYTHON_PORT}`, ok: pyUp, detalhe: pyUp ? 'UP' : 'DOWN (FE nunca chama direto)' });

  const estruturais = checks.filter((c) =>
    ['frontend/package.json', 'docs/qa/agentes', 'docs/qa/modulos'].includes(c.nome) && c.ok === false,
  );
  console.log('\n🔎 QA PRISMA — env-check\n');
  for (const c of checks) {
    const portLike = c.nome.startsWith('Front') || c.nome.startsWith('Backend') || c.nome.startsWith('Python');
    const icon = c.ok ? '✅' : portLike ? '⚠️ ' : '❌';
    console.log(`  ${icon} ${c.nome}  ${c.detalhe || c.rel || ''}`);
  }
  console.log(`\n  Front: http://localhost:${VITE_PORT}`);
  console.log('  BFF:   http://localhost:8080  (proxy /api)');
  console.log('');
  process.exit(estruturais.length ? 1 : 0);
}

main().catch((err) => {
  console.error(`[qa-env-check] ${err.message}`);
  process.exit(1);
});

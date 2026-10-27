/**
 * Pré-setup da esteira QA Prisma (antes de rodar no chat).
 * CLI: node docs/qa/scripts/qa-preparar.cjs [modulo]
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { qaRoot, repoRoot, getDefaultModuleId, loadManifest } = require('./qa-modulo.cjs');

const setupFile = path.join(qaRoot, 'setup', '.qa-preparada.json');
const viteLog = path.join(qaRoot, 'setup', 'vite-dev.log');
const frontendRoot = path.join(repoRoot, 'frontend');

async function runEnvCheck() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, 'qa-env-check.cjs')], {
      stdio: 'inherit',
    });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`env-check exit ${code}`))));
  });
}

function writeState(modulo, extra) {
  fs.mkdirSync(path.dirname(setupFile), { recursive: true });
  const payload = {
    modulo,
    preparadaEm: new Date().toISOString(),
    front: 'http://localhost:5173',
    backend: 'http://localhost:8080',
    ...extra,
  };
  fs.writeFileSync(setupFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function main() {
  const modulo = process.argv[2] || getDefaultModuleId();
  const { manifest } = loadManifest(modulo);
  console.log(`\n🛠️  QA preparar — módulo ${manifest.nome} (${modulo})\n`);

  if (!fs.existsSync(path.join(frontendRoot, 'package.json'))) {
    throw new Error('frontend/ ausente');
  }

  try {
    await runEnvCheck();
  } catch {
    console.log('⚠️  env-check com falha não-bloqueante (Java/Python podem estar DOWN no lab mock).');
  }

  writeState(modulo, { status: 'ok', viteLog: path.relative(repoRoot, viteLog).replace(/\\/g, '/') });
  console.log(`✅ Marcado: docs/qa/setup/.qa-preparada.json`);
  console.log('   Chat: qa ' + modulo);
  console.log('   Se front DOWN: cd frontend && npm run dev\n');
}

main().catch((err) => {
  console.error(`[qa-preparar] ${err.message}`);
  process.exit(1);
});

/**
 * Check da esteira QA Prisma — Cursor / orquestrador.
 * CLI: node docs/qa/scripts/qa-esteira-check.cjs [modulo]
 */
const fs = require('node:fs');
const path = require('node:path');
const { qaRoot, repoRoot, loadManifest, getDefaultModuleId, getNextVersion } = require('./qa-modulo.cjs');

const SEQUENTIAL_CPF = /(?:cpf|documento)\s*[:=]\s*['"]?(?:123456|321987|012345|987654|111111|000000|123123)/i;
const SEQUENTIAL_RAW = /['"](123456789\d{2}|321987654\d{2}|(\d)\2{10})['"]/;

function read(rel) {
  const abs = path.join(repoRoot, rel.replace(/\//g, path.sep));
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
}

function latestVersion(manifest) {
  return getNextVersion(manifest).previousMax;
}

function extractBddIds(bddText) {
  const ids = [];
  const re = /\|\s*([A-Z]+-\d+)\s*\|/g;
  let m;
  while ((m = re.exec(bddText))) ids.push(m[1]);
  return [...new Set(ids)];
}

function main() {
  const modulo = process.argv[2] || getDefaultModuleId();
  const { manifest } = loadManifest(modulo);
  const n = latestVersion(manifest);
  const fails = [];
  const warns = [];

  const bddRel = manifest.outputs.bdd.dir + '/' + manifest.outputs.bdd.arquivo.replace('{N}', String(n));
  const dataRel = manifest.outputs.data.dir + '/' + manifest.outputs.data.arquivo.replace('{N}', String(n));
  const specRel = manifest.outputs.spec.dir + '/' + manifest.outputs.spec.arquivo.replace('{N}', String(n));

  const bdd = n ? read(bddRel) : null;
  const data = n ? read(dataRel) : null;
  const spec = n ? read(specRel) : null;

  if (!n) warns.push('Nenhum trio vN ainda — rode a esteira.');

  if (bdd && data) {
    const ids = extractBddIds(bdd);
    for (const id of ids) {
      const token = 'dados' + id.replace('-', '');
      if (!data.includes(`export const ${token}`)) {
        fails.push(`DataForge v${n} sem ${token} (BDD ${id})`);
      }
      if (spec && !spec.includes(id)) {
        fails.push(`Spec v${n} não cita cenário ${id} do BDD`);
      }
    }
  }

  if (spec && data) {
    if (!spec.includes(`data.v${n}.js`) && !spec.includes(`.data.v${n}.js`)) {
      fails.push(`Spec v${n} não importa massa DataForge v${n}`);
    }
    if (SEQUENTIAL_RAW.test(spec)) {
      fails.push('Spec hardcodou CPF sequencial — deve vir só da massa');
    }
  }

  const dataDir = path.join(repoRoot, 'docs', 'qa', 'outputs', 'dataforge', modulo);
  if (fs.existsSync(dataDir)) {
    for (const name of fs.readdirSync(dataDir)) {
      if (!name.endsWith('.js')) continue;
      const txt = fs.readFileSync(path.join(dataDir, name), 'utf8');
      if (SEQUENTIAL_CPF.test(txt) || SEQUENTIAL_RAW.test(txt)) {
        fails.push(`CPF sequencial/proibido em ${name}`);
      }
    }
  }

  if (manifest.playwright && manifest.playwright.executarTodos === false) {
    warns.push('playwright.executarTodos=false — esteira DEMO ainda limitada');
  }

  const orch = read('docs/qa/agentes/orquestrador/orquestrador.md') || '';
  if (!/AskQuestion/i.test(orch) || !/módulo/i.test(orch)) {
    fails.push('Orquestrador não pede módulo quando o usuário não especifica');
  }

  console.log(`\n🔎 QA esteira-check — ${modulo} (latest v${n || '—'})\n`);
  for (const w of warns) console.log('  ⚠️  ' + w);
  for (const f of fails) console.log('  ❌ ' + f);
  if (!fails.length) console.log('  ✅ Playwright amarra BDD + massa; CPF não sequencial; orquestrador pergunta módulo.');
  console.log('');
  process.exit(fails.length ? 1 : 0);
}

main();

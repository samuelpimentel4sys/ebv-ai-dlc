/**
 * Status dos artefatos versionados da esteira QA Prisma.
 * CLI: node docs/qa/scripts/qa-status.cjs [modulo]
 */
const { listManifests, getDefaultModuleId, loadManifest, getNextVersion, outputPath } = require('./qa-modulo.cjs');

function latest(manifest, kind) {
  const { previousMax } = getNextVersion(manifest);
  if (!previousMax) return null;
  return { version: previousMax, ...outputPath(manifest, kind, previousMax) };
}

function line(label, info) {
  if (!info) return `  ${label}: (nenhum)`;
  return `  ${label}: v${info.version} → ${info.relative}`;
}

const moduleId = process.argv[2] || getDefaultModuleId();
const { manifest } = loadManifest(moduleId);
const bdd = latest(manifest, 'bdd');
const data = latest(manifest, 'data');
const spec = latest(manifest, 'spec');
const aligned = bdd && data && spec && bdd.version === data.version && spec.version === bdd.version;

console.log(`\n📦 ESTEIRA QA PRISMA — ${manifest.nome} (${moduleId})\n`);
console.log(line('BDD (GherkinFlow)', bdd));
console.log(line('Data (DataForge)', data));
console.log(line('Spec (Playwright)', spec));
console.log(`\nMódulos: ${listManifests().join(', ')}  |  padrão: ${getDefaultModuleId()}`);
console.log('\nComandos no Cursor Chat:');
console.log(`  qa ${moduleId}          → esteira completa (GherkinFlow → DataForge → Playwright)`);
console.log('  qa gherkinflow       → só Etapa 1');
console.log('  qa dataforge         → só Etapa 2');
console.log('  qa playwright        → só Etapa 3');
console.log('  qa preparar          → pré-setup (front :5173)');
console.log('  GO / NOGO            → gate self-healing após falha');

if (aligned) {
  console.log(`\n✅ Trio alinhado em v${bdd.version}.`);
} else if (!bdd) {
  console.log('\n⚠️  Sem BDD — comece com: qa gherkinflow  (ou qa contestacao)');
} else if (bdd && !data) {
  console.log(`\n⚠️  BDD v${bdd.version} sem massa — rode qa dataforge ou a esteira completa.`);
} else if (bdd && data && bdd.version !== data.version) {
  console.log(`\n⚠️  BDD v${bdd.version} e data v${data.version} desalinhados.`);
}
console.log('');

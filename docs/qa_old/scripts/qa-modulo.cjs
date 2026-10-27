/**
 * Manifesto de módulo da esteira QA Prisma.
 * CLI:
 *   node docs/qa/scripts/qa-modulo.cjs list
 *   node docs/qa/scripts/qa-modulo.cjs summary [modulo]
 *   node docs/qa/scripts/qa-modulo.cjs sources [modulo]
 *   node docs/qa/scripts/qa-modulo.cjs next-version [modulo]
 *   node docs/qa/scripts/qa-modulo.cjs scaffold <id> [Nome do módulo]
 */
const fs = require('node:fs');
const path = require('node:path');

const qaRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(qaRoot, '..', '..');
const modulosDir = path.join(qaRoot, 'modulos');

function loadManifest(moduleId) {
  const manifestPath = path.join(modulosDir, `${moduleId}.manifest.json`);
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifesto nao encontrado: docs/qa/modulos/${moduleId}.manifest.json`);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  return { manifest, manifestPath };
}

function listManifests() {
  if (!fs.existsSync(modulosDir)) return [];
  return fs
    .readdirSync(modulosDir)
    .filter((name) => name.endsWith('.manifest.json') && !name.startsWith('_'))
    .map((name) => name.replace('.manifest.json', ''));
}

function getDefaultModuleId() {
  for (const id of listManifests()) {
    const { manifest } = loadManifest(id);
    if (manifest.padrao) return id;
  }
  return listManifests()[0] || 'contestacao';
}

function resolveRepoPath(relativePath) {
  return path.join(repoRoot, relativePath.replace(/\//g, path.sep));
}

function collectSourceFiles(manifest, { prioridadeMinima = 'baixa' } = {}) {
  const ordem = { alta: 3, media: 2, baixa: 1 };
  const min = ordem[prioridadeMinima] ?? 1;
  const files = [];

  for (const tela of manifest.telas || []) {
    if ((ordem[tela.prioridade] ?? 1) < min) continue;
    for (const rel of tela.arquivos || []) {
      files.push({ grupo: `tela:${tela.id}`, rel, abs: resolveRepoPath(rel), tela: tela.nome });
    }
  }
  for (const rel of manifest.apis || []) {
    files.push({ grupo: 'api', rel, abs: resolveRepoPath(rel) });
  }
  for (const rel of manifest.dominio || []) {
    files.push({ grupo: 'dominio', rel, abs: resolveRepoPath(rel) });
  }

  const seen = new Set();
  return files.filter((entry) => {
    if (seen.has(entry.rel)) return false;
    seen.add(entry.rel);
    return true;
  });
}

function validateSources(manifest, options) {
  const files = collectSourceFiles(manifest, options);
  const missing = files.filter((f) => !fs.existsSync(f.abs));
  return { files, missing, ok: missing.length === 0 };
}

function outputPath(manifest, kind, version) {
  const cfg = manifest.outputs?.[kind];
  if (!cfg) throw new Error(`Output desconhecido: ${kind}`);
  const rel = path.join(cfg.dir, cfg.arquivo.replace('{N}', String(version))).replace(/\\/g, '/');
  return { relative: rel, absolute: resolveRepoPath(rel) };
}

function getNextVersion(manifest) {
  function maxInDir(dirRel, patternStr) {
    const dir = resolveRepoPath(dirRel);
    if (!fs.existsSync(dir)) return 0;
    const pattern = new RegExp(patternStr);
    let maxV = 0;
    for (const entry of fs.readdirSync(dir)) {
      const m = entry.match(pattern);
      if (m) maxV = Math.max(maxV, Number(m[1], 10));
    }
    return maxV;
  }

  const vBdd = maxInDir(manifest.outputs.bdd.dir, manifest.versionamento.bddPattern);
  const vData = maxInDir(manifest.outputs.data.dir, manifest.versionamento.dataPattern);
  const vSpec = maxInDir(manifest.outputs.spec.dir, manifest.versionamento.specPattern);
  const currentMax = Math.max(vBdd, vData, vSpec);
  return { version: currentMax + 1, pruned: false, previousMax: currentMax };
}

function printSummary(manifest) {
  const { files, missing } = validateSources(manifest);
  const lines = [
    `\n📦 Modulo: ${manifest.nome} (${manifest.id})${manifest.padrao ? ' [PADRAO]' : ''}`,
    `   Telas: ${(manifest.telas || []).map((t) => t.nome).join(' · ')}`,
    `   Arquivos-fonte: ${files.length} (${missing.length} ausente(s))`,
    `   Comandos: ${(manifest.comandosAtivacao || []).join(' | ')}`,
  ];

  if (missing.length) {
    lines.push('   ⚠️  Ausentes:');
    for (const m of missing) lines.push(`      - ${m.rel}`);
  }

  lines.push('\n   Fontes por tela (GherkinFlow):');
  for (const tela of manifest.telas || []) {
    lines.push(`   · ${tela.nome} [${tela.prefixoCenario}-xx] (${tela.prioridade}):`);
    for (const rel of tela.arquivos || []) {
      const mark = fs.existsSync(resolveRepoPath(rel)) ? '✅' : '❌';
      lines.push(`     ${mark} ${rel}`);
    }
  }

  lines.push('\n   APIs (DataForge):');
  for (const rel of manifest.apis || []) {
    const mark = fs.existsSync(resolveRepoPath(rel)) ? '✅' : '❌';
    lines.push(`     ${mark} ${rel}`);
  }

  return lines.join('\n');
}

function scaffold(moduleId, nome) {
  if (!/^[a-z0-9-]+$/.test(moduleId)) {
    throw new Error('id do modulo deve ser kebab-case: [a-z0-9-]');
  }
  const dest = path.join(modulosDir, `${moduleId}.manifest.json`);
  if (fs.existsSync(dest)) {
    throw new Error(`Ja existe: docs/qa/modulos/${moduleId}.manifest.json`);
  }
  const templatePath = path.join(modulosDir, '_template.manifest.json');
  if (!fs.existsSync(templatePath)) {
    throw new Error('Template ausente: docs/qa/modulos/_template.manifest.json');
  }
  const raw = fs.readFileSync(templatePath, 'utf8');
  const filled = raw
    .replaceAll('{modulo}', moduleId)
    .replaceAll('{MODULO}', moduleId.toUpperCase())
    .replaceAll('{Nome do módulo}', nome || `Módulo ${moduleId}`);
  const json = JSON.parse(filled);
  json.id = moduleId;
  json.nome = nome || `Módulo ${moduleId}`;
  json.padrao = false;
  json.comandosAtivacao = [`qa ${moduleId}`, `esteira qa ${moduleId}`, `qa prisma ${moduleId}`];
  fs.writeFileSync(dest, `${JSON.stringify(json, null, 2)}\n`, 'utf8');

  for (const kind of ['bdd', 'data', 'spec', 'relatorio']) {
    const dirRel = json.outputs?.[kind]?.dir;
    if (!dirRel) continue;
    fs.mkdirSync(resolveRepoPath(dirRel), { recursive: true });
  }
  return dest;
}

if (require.main === module) {
  const command = process.argv[2] || 'summary';
  const moduleId = process.argv[3] || getDefaultModuleId();
  const extraName = process.argv.slice(4).join(' ').trim();

  try {
    switch (command) {
      case 'list': {
        console.log(JSON.stringify({ modulos: listManifests(), padrao: getDefaultModuleId() }, null, 2));
        break;
      }
      case 'sources': {
        const { manifest } = loadManifest(moduleId);
        const { files, missing } = validateSources(manifest);
        console.log(JSON.stringify({ moduleId, files, missing: missing.map((m) => m.rel) }, null, 2));
        break;
      }
      case 'next-version': {
        const { manifest } = loadManifest(moduleId);
        console.log(JSON.stringify(getNextVersion(manifest), null, 2));
        break;
      }
      case 'scaffold': {
        const dest = scaffold(moduleId, extraName);
        console.log(`✅ Manifesto criado: ${path.relative(repoRoot, dest).replace(/\\/g, '/')}`);
        console.log(`   1. Preencha telas[].arquivos, apis e inputs.uiJson`);
        console.log(`   2. Valide: node docs/qa/scripts/qa-modulo.cjs summary ${moduleId}`);
        console.log(`   3. Chat: qa ${moduleId}`);
        break;
      }
      case 'summary':
      default: {
        const id = command === 'summary' ? moduleId : listManifests().includes(command) ? command : moduleId;
        const { manifest } = loadManifest(id);
        console.log(printSummary(manifest));
        break;
      }
    }
  } catch (error) {
    console.error(`[qa-modulo] ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  qaRoot,
  repoRoot,
  loadManifest,
  listManifests,
  getDefaultModuleId,
  collectSourceFiles,
  validateSources,
  outputPath,
  getNextVersion,
  printSummary,
  resolveRepoPath,
  scaffold,
};

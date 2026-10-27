/**
 * Versionamento compartilhado da esteira QA Prisma (por módulo).
 */
const path = require('node:path');
const {
  loadManifest,
  getDefaultModuleId,
  getNextVersion,
  outputPath,
} = require('./qa-modulo.cjs');

function resolveModule(moduleId) {
  const id = moduleId || getDefaultModuleId();
  const { manifest } = loadManifest(id);
  return { id, manifest, next: getNextVersion(manifest) };
}

function latestOf(manifest, kind) {
  const next = getNextVersion(manifest);
  const current = next.previousMax;
  if (!current) return null;
  const out = outputPath(manifest, kind, current);
  return { version: current, ...out };
}

module.exports = {
  resolveModule,
  latestOf,
  getNextVersion,
  outputPath,
};

if (require.main === module) {
  const moduleId = process.argv[2];
  const { id, manifest, next } = resolveModule(moduleId);
  console.log(JSON.stringify({
    modulo: id,
    nextVersion: next.version,
    previousMax: next.previousMax,
    bdd: latestOf(manifest, 'bdd'),
    data: latestOf(manifest, 'data'),
    spec: latestOf(manifest, 'spec'),
  }, null, 2));
}

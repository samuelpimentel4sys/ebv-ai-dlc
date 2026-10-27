/**
 * Self-healing da esteira QA Prisma — falha + auditoria + GO/NOGO.
 * Bug é colocado pelo usuário (bug-self-healing/); correção é no chat pelo Dev Kernel.
 *
 * CLI:
 *   node docs/qa/scripts/qa-self-healing.cjs pending
 *   node docs/qa/scripts/qa-self-healing.cjs register '{"cenarioId":"C-04",...}'
 *   node docs/qa/scripts/qa-self-healing.cjs resolve '{"resumoCorrecao":"...","arquivosAlterados":["..."]}'
 *   node docs/qa/scripts/qa-self-healing.cjs audit
 *   node docs/qa/scripts/qa-self-healing.cjs clear
 */
const fs = require('node:fs');
const path = require('node:path');

const qaRoot = path.resolve(__dirname, '..');
const setupDir = path.join(qaRoot, 'setup');
const pendingFile = path.join(setupDir, '.qa-falha-pendente.json');
const auditFile = path.join(setupDir, 'self-healing-audit.jsonl');

function ensureSetupDir() {
  fs.mkdirSync(setupDir, { recursive: true });
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function appendAudit(event) {
  ensureSetupDir();
  const line = JSON.stringify({ ...event, timestamp: event.timestamp || new Date().toISOString() });
  fs.appendFileSync(auditFile, `${line}\n`, 'utf8');
}

function registerFailure(payload) {
  ensureSetupDir();
  const record = {
    status: 'pendente',
    tentativa: payload.tentativa ?? 1,
    maxTentativas: payload.maxTentativas ?? 2,
    cenarioId: payload.cenarioId,
    titulo: payload.titulo ?? '',
    tipo: payload.tipo ?? 'app_bug',
    erro: payload.erro ?? 'Falha não especificada',
    stack: payload.stack ?? null,
    urlAtual: payload.urlAtual ?? null,
    urlEsperada: payload.urlEsperada ?? null,
    spec: payload.spec ?? null,
    arquivosSugeridos: payload.arquivosSugeridos ?? [],
    modulo: payload.modulo ?? 'contestacao',
    versao: payload.versao ?? null,
    camada: payload.camada ?? 'L2',
    registradoEm: new Date().toISOString(),
  };

  fs.writeFileSync(pendingFile, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
  appendAudit({ evento: 'falha_detectada', ...record });
  return record;
}

function resolveFailure(payload = {}) {
  const pending = readJson(pendingFile);
  if (!pending) {
    console.log('[self-healing] Nenhuma falha pendente.');
    return null;
  }

  const resolved = {
    ...pending,
    status: 'corrigida',
    corrigidaEm: new Date().toISOString(),
    arquivosAlterados: payload.arquivosAlterados ?? [],
    resumoCorrecao: payload.resumoCorrecao ?? '',
    agenteDev: payload.agenteDev ?? 'dev-kernel',
    agenteQa: payload.agenteQa ?? 'playwright',
  };

  appendAudit({
    evento: 'correcao_aplicada',
    cenarioId: resolved.cenarioId,
    arquivosAlterados: resolved.arquivosAlterados,
    resumoCorrecao: resolved.resumoCorrecao,
    agenteDev: resolved.agenteDev,
    agenteQa: resolved.agenteQa,
  });

  fs.unlinkSync(pendingFile);
  return resolved;
}

function listAudit(limit = 20) {
  if (!fs.existsSync(auditFile)) return [];
  const lines = fs.readFileSync(auditFile, 'utf8').trim().split('\n').filter(Boolean);
  return lines.slice(-limit).map((line) => JSON.parse(line));
}

function printPending() {
  const pending = readJson(pendingFile);
  if (!pending) {
    console.log('[self-healing] Nenhuma falha pendente.');
    return;
  }
  console.log(JSON.stringify(pending, null, 2));
}

function clearPending() {
  if (fs.existsSync(pendingFile)) fs.unlinkSync(pendingFile);
  console.log('[self-healing] Falha pendente removida.');
}

const command = process.argv[2] || 'pending';

try {
  switch (command) {
    case 'register': {
      let payload = {};
      if (process.argv[3]) {
        payload = JSON.parse(process.argv[3]);
      } else if (!process.stdin.isTTY) {
        const stdin = fs.readFileSync(0, 'utf8');
        if (stdin.trim()) payload = JSON.parse(stdin);
      }
      const record = registerFailure(payload);
      console.log(JSON.stringify(record, null, 2));
      break;
    }
    case 'resolve': {
      let payload = {};
      if (process.argv[3]) payload = JSON.parse(process.argv[3]);
      const resolved = resolveFailure(payload);
      if (resolved) console.log(JSON.stringify(resolved, null, 2));
      break;
    }
    case 'audit': {
      console.log(JSON.stringify(listAudit(Number(process.argv[3]) || 20), null, 2));
      break;
    }
    case 'clear':
      clearPending();
      break;
    case 'pending':
    default:
      printPending();
      break;
  }
} catch (error) {
  console.error(`[self-healing] ${error.message}`);
  process.exit(1);
}

module.exports = {
  pendingFile,
  auditFile,
  registerFailure,
  resolveFailure,
  listAudit,
  readJson,
};

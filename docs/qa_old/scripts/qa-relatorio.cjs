/**
 * Relatório consolidado Foursys (HTML) + Excel da esteira QA Prisma.
 * CLI: node docs/qa/scripts/qa-relatorio.cjs [modulo] [version]
 */
const fs = require('node:fs');
const path = require('node:path');
const { qaRoot, repoRoot, loadManifest, getDefaultModuleId, outputPath } = require('./qa-modulo.cjs');

function xmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function htmlEscape(value) {
  return xmlEscape(value).replace(/'/g, '&#39;');
}

function walkFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(abs, acc);
    else acc.push(abs);
  }
  return acc;
}

function relFrom(fromDir, abs) {
  return path.relative(fromDir, abs).split(path.sep).join('/');
}

function flattenSpecs(suites, acc = []) {
  for (const suite of suites || []) {
    for (const spec of suite.specs || []) acc.push(spec);
    flattenSpecs(suite.suites, acc);
  }
  return acc;
}

function specStatus(spec) {
  const tests = spec.tests || [];
  const results = tests.flatMap((t) => t.results || []);
  if (results.some((r) => r.status === 'failed' || r.status === 'timedOut' || r.status === 'unexpected')) {
    return 'failed';
  }
  if (results.length && results.every((r) => r.status === 'skipped' || spec.ok === true && tests.every((t) => t.status === 'skipped' || t.expectedStatus === 'skipped'))) {
    if (tests.every((t) => t.expectedStatus === 'skipped' || (t.results || []).every((r) => r.status === 'skipped'))) {
      return 'skipped';
    }
  }
  if (spec.ok) return 'passed';
  return results[0]?.status || 'unknown';
}

function specDuration(spec) {
  const results = (spec.tests || []).flatMap((t) => t.results || []);
  return results.reduce((sum, r) => sum + (r.duration || 0), 0);
}

function specLogs(spec) {
  const results = (spec.tests || []).flatMap((t) => t.results || []);
  const lines = [];
  for (const r of results) {
    for (const row of r.stdout || []) {
      if (typeof row === 'string') lines.push(row);
      else if (row?.text) lines.push(row.text);
    }
    for (const err of r.errors || []) {
      lines.push(err.message || err.value || String(err));
    }
  }
  return lines.join('\n').trim();
}

function writeExcel(filePath, sheets) {
  const worksheetXml = sheets
    .map((sheet) => {
      const rows = sheet.rows
        .map(
          (row, rIdx) =>
            `    <Row>${row
              .map(
                (cell, cIdx) =>
                  `      <Cell ss:Index="${cIdx + 1}"><Data ss:Type="${rIdx === 0 ? 'String' : typeof cell === 'number' ? 'Number' : 'String'}">${xmlEscape(cell)}</Data></Cell>`,
              )
              .join('')}</Row>`,
        )
        .join('\n');
      return `  <Worksheet ss:Name="${xmlEscape(sheet.name)}">
   <Table>${rows}
   </Table>
  </Worksheet>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${worksheetXml}
</Workbook>
`;
  fs.writeFileSync(filePath, xml, 'utf8');
}

function writeHtml(filePath, model) {
  const evidenciasHtml = model.evidencias
    .map((ev) => {
      const href = htmlEscape(ev.rel);
      if (ev.kind === 'png') {
        return `<figure><img src="${href}" alt="${htmlEscape(ev.name)}" /><figcaption><strong>${htmlEscape(ev.name)}</strong>${htmlEscape(ev.rel)}</figcaption></figure>`;
      }
      if (ev.kind === 'webm') {
        return `<figure><video controls src="${href}"></video><figcaption><strong>${htmlEscape(ev.name)}</strong> vídeo Playwright</figcaption></figure>`;
      }
      return `<p><a href="${href}">${htmlEscape(ev.kind.toUpperCase())} · ${htmlEscape(ev.name)}</a></p>`;
    })
    .join('\n');

  const rows = model.cenarios
    .map((c) => {
      const cls = c.status === 'passed' ? 'pass' : c.status === 'skipped' ? 'skip' : 'fail';
      return `<tr><td class="id">${htmlEscape(c.id)}</td><td>${htmlEscape(c.title)}</td><td class="${cls}">${htmlEscape(c.status)}</td><td>${c.durationMs}</td><td><pre>${htmlEscape(c.log.slice(0, 800))}</pre></td></tr>`;
    })
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Relatório Esteira QA — ${htmlEscape(model.modulo)} v${htmlEscape(model.version)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
  <style>
    :root { --navy:#222239; --navy-2:#2e2e4a; --orange:#FF5315; --mint:#89BAB1; --vanilla:#FFE2A9; --off-white:#F7F6F2; --muted:#5c5c72; }
    body { margin:0; font-family:Nunito,sans-serif; background:var(--off-white); color:#181828; font-size:11pt; }
    .brand-bar { height:6px; background:linear-gradient(90deg,var(--navy),var(--orange)); }
    .cover { background:linear-gradient(145deg,var(--navy) 0%,var(--navy-2) 55%,#3a2a35 100%); color:#fff; padding:2.2rem 2.5rem; }
    .logo { font-weight:900; font-size:1.3rem; }
    .logo .chev { color:var(--orange); }
    .cover h1 { margin:0.4rem 0 0; font-size:1.8rem; }
    .badge { display:inline-block; padding:0.2rem 0.7rem; border-radius:999px; font-weight:700; font-size:0.72rem; margin:0.2rem 0.2rem 0 0; }
    .badge-orange { background:var(--orange); color:#fff; }
    .badge-mint { background:var(--mint); color:var(--navy); }
    .badge-ghost { background:rgba(255,255,255,0.12); color:#fff; }
    main { max-width:1100px; margin:0 auto; padding:1.5rem 2rem 3rem; }
    h2 { color:var(--navy); border-bottom:3px solid var(--navy); padding-bottom:0.35rem; }
    table { width:100%; border-collapse:collapse; background:#fff; font-size:0.8rem; box-shadow:0 2px 12px rgba(34,34,57,0.08); }
    th { background:var(--navy); color:#fff; text-align:left; padding:0.55rem; border-bottom:3px solid var(--orange); }
    td { padding:0.45rem; border-bottom:1px solid #e8e6e0; vertical-align:top; }
    .pass { color:#1a6b5a; font-weight:800; }
    .fail { color:#b42318; font-weight:800; }
    .skip { color:var(--muted); font-weight:700; }
    .id { color:var(--orange); font-weight:800; font-family:ui-monospace,Consolas,monospace; }
    .gallery { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
    figure { margin:0; background:#fff; border-left:4px solid var(--orange); overflow:hidden; }
    figure img, figure video { width:100%; display:block; }
    figcaption { padding:0.6rem; font-size:0.78rem; color:var(--muted); }
    pre { white-space:pre-wrap; max-height:8rem; overflow:auto; margin:0; font-size:0.7rem; }
    a { color:var(--orange); }
    footer { text-align:center; padding:1.2rem; border-top:3px solid var(--orange); color:var(--muted); font-size:0.78rem; }
    @media (max-width:720px) { .gallery { grid-template-columns:1fr; } }
  </style>
</head>
<body>
  <div class="brand-bar"></div>
  <header class="cover">
    <div class="logo">foursys <span class="chev">&gt;&gt;</span></div>
    <p style="color:var(--orange);font-weight:800;letter-spacing:0.08em;text-transform:uppercase;font-size:0.75rem;">Solution Center · Esteira QA · consolidado completo</p>
    <h1>Relatório Final — ${htmlEscape(model.nome)}</h1>
    <p>Módulo <strong>${htmlEscape(model.modulo)}</strong> · versão <strong>v${htmlEscape(model.version)}</strong> · ${htmlEscape(model.quando)}</p>
    <div>
      <span class="badge badge-orange">${htmlEscape(model.passed)} passed</span>
      <span class="badge badge-ghost">${htmlEscape(model.failed)} failed</span>
      <span class="badge badge-mint">${htmlEscape(model.skipped)} skipped</span>
    </div>
  </header>
  <main>
    <section>
      <h2>01 · Veredito</h2>
      <p>${htmlEscape(model.veredito)}</p>
      <p>
        Excel: <a href="${htmlEscape(model.excelRel)}">${htmlEscape(model.excelRel)}</a><br />
        Playwright HTML: <a href="${htmlEscape(model.pwHtmlRel)}">${htmlEscape(model.pwHtmlRel)}</a><br />
        JSON: <a href="${htmlEscape(model.pwJsonRel)}">${htmlEscape(model.pwJsonRel)}</a>
        ${model.pwJunitRel ? `<br />JUnit: <a href="${htmlEscape(model.pwJunitRel)}">${htmlEscape(model.pwJunitRel)}</a>` : ''}
      </p>
    </section>
    <section>
      <h2>02 · Cenários e logs</h2>
      <table>
        <thead><tr><th>ID</th><th>Cenário</th><th>Status</th><th>ms</th><th>Log / erro</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
    <section>
      <h2>03 · Evidências Playwright (imagens, vídeos, traces, anexos)</h2>
      <div class="gallery">${evidenciasHtml}</div>
    </section>
  </main>
  <footer>Foursys Solution Center · QA Master · ${htmlEscape(model.modulo)} v${htmlEscape(model.version)}</footer>
</body>
</html>
`;
  fs.writeFileSync(filePath, html, 'utf8');
}

function main() {
  const modulo = process.argv[2] || getDefaultModuleId();
  const { manifest } = loadManifest(modulo);
  const version = String(process.argv[3] || '');
  if (!version) {
    console.error('Uso: node docs/qa/scripts/qa-relatorio.cjs <modulo> <N>');
    process.exit(1);
  }

  const outDir = path.join(repoRoot, 'docs', 'qa', 'outputs');
  const pwDir = path.join(outDir, 'playwright', modulo);
  const relatoriosDir = path.join(pwDir, 'relatorios');
  const shotsDir = path.join(pwDir, 'screenshots');
  const jsonPath = path.join(relatoriosDir, `qa-${modulo}-v${version}.json`);
  const pwHtml = path.join(relatoriosDir, `qa-${modulo}-v${version}.html`);
  const pwIndex = path.join(relatoriosDir, 'index.html');
  const junitPath = path.join(relatoriosDir, `qa-${modulo}-v${version}.junit.xml`);
  const htmlOut = path.join(outDir, `qa-${modulo}-esteira-v${version}.html`);
  const xlsOut = path.join(outDir, `qa-${modulo}-esteira-v${version}.xls`);

  let report = { suites: [], stats: {} };
  if (fs.existsSync(jsonPath)) {
    report = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  }

  const specs = flattenSpecs(report.suites);
  const cenarios = specs.map((spec) => {
    const idMatch = spec.title.match(/^([A-Z]+-\d+)/);
    return {
      id: idMatch ? idMatch[1] : spec.title.slice(0, 24),
      title: spec.title,
      status: specStatus(spec),
      durationMs: specDuration(spec),
      log: specLogs(spec),
    };
  });

  const passed = cenarios.filter((c) => c.status === 'passed').length;
  const failed = cenarios.filter((c) => c.status === 'failed').length;
  const skipped = cenarios.filter((c) => c.status === 'skipped').length;

  const evidenceAbs = [
    ...walkFiles(shotsDir),
    ...walkFiles(relatoriosDir),
  ].filter((abs) => {
    const ext = path.extname(abs).toLowerCase();
    const name = path.basename(abs).toLowerCase();
    if (name === 'index.html' && abs.includes(`${path.sep}relatorios${path.sep}`)) return true;
    return ['.png', '.webm', '.zip', '.md', '.json', '.xml', '.html', '.txt'].includes(ext);
  });

  const evidencias = evidenceAbs.map((abs) => {
    const ext = path.extname(abs).toLowerCase().slice(1);
    const kind = ext === 'png' ? 'png' : ext === 'webm' ? 'webm' : ext;
    return { abs, name: path.basename(abs), kind, rel: relFrom(outDir, abs) };
  });

  const pwHtmlRel = fs.existsSync(pwHtml)
    ? relFrom(outDir, pwHtml)
    : fs.existsSync(pwIndex)
      ? relFrom(outDir, pwIndex)
      : '';
  const pwJsonRel = fs.existsSync(jsonPath) ? relFrom(outDir, jsonPath) : '';
  const pwJunitRel = fs.existsSync(junitPath) ? relFrom(outDir, junitPath) : '';

  const veredito =
    failed > 0
      ? `NO-GO parcial: ${failed} falha(s) na suíte live/mock. Ver evidências e Excel.`
      : `GO lab: ${passed} passed · ${skipped} skipped. Artefatos Playwright anexados.`;

  writeHtml(htmlOut, {
    modulo,
    nome: manifest.nome,
    version,
    quando: new Date().toISOString(),
    passed,
    failed,
    skipped,
    veredito,
    cenarios,
    evidencias,
    excelRel: path.basename(xlsOut),
    pwHtmlRel,
    pwJsonRel,
    pwJunitRel,
  });

  writeExcel(xlsOut, [
    {
      name: 'Resumo',
      rows: [
        ['Campo', 'Valor'],
        ['Modulo', modulo],
        ['Nome', manifest.nome],
        ['Versao', version],
        ['Passed', passed],
        ['Failed', failed],
        ['Skipped', skipped],
        ['HTML', htmlOut],
        ['PlaywrightHTML', pwHtmlRel],
        ['JSON', pwJsonRel],
      ],
    },
    {
      name: 'Cenarios',
      rows: [
        ['ID', 'Titulo', 'Status', 'DuracaoMs', 'Log'],
        ...cenarios.map((c) => [c.id, c.title, c.status, c.durationMs, c.log.replace(/\r?\n/g, ' | ')]),
      ],
    },
    {
      name: 'Evidencias',
      rows: [['Nome', 'Tipo', 'Caminho'], ...evidencias.map((e) => [e.name, e.kind, e.rel])],
    },
  ]);

  console.log(`✅ HTML  ${path.relative(repoRoot, htmlOut).replace(/\\/g, '/')}`);
  console.log(`✅ Excel ${path.relative(repoRoot, xlsOut).replace(/\\/g, '/')}`);
  console.log(`   ${passed} passed · ${failed} failed · ${skipped} skipped · ${evidencias.length} evidências`);
}

main();

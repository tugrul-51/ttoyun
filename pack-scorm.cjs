const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const ROOT_DIR = __dirname;
const OUTPUT_ZIP = path.join(ROOT_DIR, 'BilgiArena_SCORM.zip');
const SCORM_INPUT_JSON = path.join(ROOT_DIR, 'scorm-data', 'input.json');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

function injectScormScriptsIntoHtml(html) {
  const scripts = `
    <script src="./SCORM_API_wrapper.js"></script>
    <script src="./scorm-data.js"></script>`;
  if (html.includes('./SCORM_API_wrapper.js')) return html;
  if (html.includes('</head>')) return html.replace('</head>', `${scripts}
  </head>`);
  return `${scripts}
${html}`;
}

function extractDistAssetPaths(html) {
  const out = new Set();
  const regex = /(?:src|href)="\.\/([^"?#]+(?:\?[^"]*)?)"/g;
  let match;
  while ((match = regex.exec(html))) {
    const raw = match[1].split('?')[0];
    if (!raw || raw === 'SCORM_API_wrapper.js' || raw === 'scorm-data.js') continue;
    out.add(raw);
  }
  return Array.from(out);
}

async function main() {
  try {
    if (!fs.existsSync(SCORM_INPUT_JSON)) throw new Error('scorm-data/input.json bulunamadı.');
    if (!fs.existsSync(path.join(DIST_DIR, 'index.html'))) throw new Error('dist/index.html bulunamadı. Önce npm run build çalıştır.');
    const raw = fs.readFileSync(SCORM_INPUT_JSON, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.questions) || !parsed.questions.length) throw new Error('input.json içinde questions dolu bir dizi olmalı.');

    const mod = await import(path.join(ROOT_DIR, 'src/utils/scorm.js'));
    const questions = mod.validateScormQuestions(parsed.questions);
    const topic = parsed.topic || 'Bilgi Arena';
    const settings = { ...(parsed.settings || {}), difficulty: parsed.difficulty || parsed.settings?.difficulty || 'medium', scormVersion: parsed.scormVersion || parsed.settings?.scormVersion || '1.2' };
    const wrapper = mod.buildScormWrapper();
    const selectedGames = Array.isArray(parsed.selectedGames) && parsed.selectedGames.length ? parsed.selectedGames : (Array.isArray(parsed.settings?.selectedGames) ? parsed.settings.selectedGames : undefined);
    const dataScript = `window.__SCORM_DATA__ = ${JSON.stringify({ topic, questions, settings, screen: 'games', ...(selectedGames ? { selectedGames } : {}) }, null, 2)};`;

    const distHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf8');
    const patchedHtml = injectScormScriptsIntoHtml(distHtml);
    const assetPaths = extractDistAssetPaths(distHtml);
    const manifest = mod.buildManifest(topic, settings, assetPaths);

    if (fs.existsSync(OUTPUT_ZIP)) fs.unlinkSync(OUTPUT_ZIP);
    const zip = new AdmZip();
    zip.addFile('index.html', Buffer.from(patchedHtml, 'utf8'));
    zip.addFile('launch.html', Buffer.from(patchedHtml, 'utf8'));
    zip.addFile('imsmanifest.xml', Buffer.from(manifest, 'utf8'));
    zip.addFile('SCORM_API_wrapper.js', Buffer.from(wrapper, 'utf8'));
    zip.addFile('scorm-data.js', Buffer.from(dataScript, 'utf8'));
    for (const assetPath of assetPaths) {
      const full = path.join(DIST_DIR, assetPath);
      if (!fs.existsSync(full)) throw new Error(`dist asset eksik: ${assetPath}`);
      zip.addFile(assetPath, fs.readFileSync(full));
    }
    zip.writeZip(OUTPUT_ZIP);
    console.log(`✅ SCORM paketi oluşturuldu: ${OUTPUT_ZIP}`);
  } catch (error) {
    console.error('❌ SCORM üretim hatası:');
    console.error(error.message || error);
    process.exit(1);
  }
}

main();

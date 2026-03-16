const fs = require('fs');
const path = require('path');
const os = require('os');
const AdmZip = require('./node_modules/adm-zip');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const input = JSON.parse(fs.readFileSync(path.join(ROOT, 'scorm-data', 'input.json'), 'utf8'));
const selectedGames = ['quiz','balloon','wheel','memory','truefalse','millionaire','whack','race','dice','openbox','bomb','treasure','monster','chef','hero','dino'];
const payload = {
  topic: input.topic || 'T-T Eğitsel Oyunlar',
  questions: input.questions || [],
  settings: { scormVersion: '1.2', selectedGames },
  competition: {},
  selectedGames,
};
function escapeXml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
function getAllFiles(dir, baseDir = dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) results = results.concat(getAllFiles(fullPath, baseDir));
    else results.push({ abs: fullPath, rel: path.relative(baseDir, fullPath).replace(/\\/g, '/') });
  }
  return results;
}
function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirRecursive(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}
function buildManifest(title, files = []) {
  const fileTags = files.map((file) => `      <file href="${escapeXml(file.rel)}"/>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="TTEgitselOyunlar_Package" version="1.2"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="
    http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
    http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd
  ">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>

  <organizations default="ORG1">
    <organization identifier="ORG1">
      <title>${escapeXml(title)}</title>
      <item identifier="ITEM1" identifierref="RES1" isvisible="true">
        <title>${escapeXml(title)}</title>
      </item>
    </organization>
  </organizations>

  <resources>
    <resource identifier="RES1" type="webcontent" adlcp:scormtype="sco" href="index.html">
${fileTags}
    </resource>
  </resources>
</manifest>`;
}
function injectScormData(tempDistDir, data) {
  fs.writeFileSync(path.join(tempDistDir, 'scorm-data.js'), `window.__SCORM_DATA__ = ${JSON.stringify(data, null, 2)};`, 'utf8');
  const indexPath = path.join(tempDistDir, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');
  if (!html.includes('src="./scorm-data.js"') && !html.includes('src="scorm-data.js"')) {
    html = html.replace('</head>', '  <script src="./scorm-data.js"></script>\n</head>');
    fs.writeFileSync(indexPath, html, 'utf8');
  }
}
function writeManifest(tempDistDir, title) {
  const files = getAllFiles(tempDistDir, tempDistDir);
  fs.writeFileSync(path.join(tempDistDir, 'imsmanifest.xml'), buildManifest(title, files), 'utf8');
}
function buildScormZip(targetZipPath) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tt-scorm-'));
  const tempDistDir = path.join(tempRoot, 'dist');
  copyDirRecursive(DIST, tempDistDir);
  injectScormData(tempDistDir, payload);
  writeManifest(tempDistDir, payload.topic || 'T-T Eğitsel Oyunlar');
  const zip = new AdmZip();
  for (const file of getAllFiles(tempDistDir, tempDistDir)) {
    const folder = path.dirname(file.rel) === '.' ? '' : path.dirname(file.rel);
    zip.addLocalFile(file.abs, folder);
  }
  zip.writeZip(targetZipPath);
}

buildScormZip(path.join(ROOT, 'T-T_Egitsel_Oyunlar_SCORM.zip'));
buildScormZip(path.join(ROOT, 'BilgiArena_SCORM.zip'));
console.log('SCORM zips generated');

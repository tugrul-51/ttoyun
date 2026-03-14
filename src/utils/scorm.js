export function makeZip(F) {
  const e = new TextEncoder();
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let j = 0; j < 8; j += 1) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  const crc = (bytes) => {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i += 1) c = table[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  };
  const w16 = (arr, off, value) => { arr[off] = value & 255; arr[off + 1] = (value >> 8) & 255; };
  const w32 = (arr, off, value) => { arr[off] = value & 255; arr[off + 1] = (value >> 8) & 255; arr[off + 2] = (value >> 16) & 255; arr[off + 3] = (value >> 24) & 255; };

  const entries = [];
  let offset = 0;
  F.forEach((file) => {
    const name = e.encode(file.name);
    const data = typeof file.content === 'string' ? e.encode(file.content) : file.content;
    const c = crc(data);

    const local = new Uint8Array(30 + name.length);
    w32(local, 0, 0x04034B50); w16(local, 4, 20); w32(local, 14, c); w32(local, 18, data.length); w32(local, 22, data.length); w16(local, 26, name.length); local.set(name, 30);
    const central = new Uint8Array(46 + name.length);
    w32(central, 0, 0x02014B50); w16(central, 4, 20); w16(central, 6, 20); w32(central, 16, c); w32(central, 20, data.length); w32(central, 24, data.length); w16(central, 28, name.length); w32(central, 42, offset); central.set(name, 46);
    entries.push({ local, data, central });
    offset += local.length + data.length;
  });

  const centralSize = entries.reduce((sum, item) => sum + item.central.length, 0);
  const end = new Uint8Array(22);
  w32(end, 0, 0x06054B50); w16(end, 8, F.length); w16(end, 10, F.length); w32(end, 12, centralSize); w32(end, 16, offset);
  const out = new Uint8Array(offset + centralSize + end.length);
  let ptr = 0;
  entries.forEach((item) => { out.set(item.local, ptr); ptr += item.local.length; out.set(item.data, ptr); ptr += item.data.length; });
  entries.forEach((item) => { out.set(item.central, ptr); ptr += item.central.length; });
  out.set(end, ptr);
  return new Blob([out], { type: 'application/zip' });
}

export function validateScormQuestions(questions = []) {
  if (!Array.isArray(questions) || !questions.length) throw new Error('SCORM paketi için en az 1 soru gerekli.');
  return questions.map((question, index) => {
    const choices = Array.isArray(question.o) ? question.o.slice(0, 4) : [];
    if (!question?.q?.trim()) throw new Error(`Soru metni eksik. satır=${index + 1}`);
    if (choices.length !== 4 || choices.some((choice) => !String(choice || '').trim())) throw new Error(`Her soruda 4 dolu şık bulunmalı. satır=${index + 1}`);
    if (new Set(choices.map((choice) => String(choice).trim().toLowerCase())).size < 4) throw new Error(`Şıklar birbirinden farklı olmalı. satır=${index + 1}`);
    if (!Number.isInteger(question.a) || question.a < 0 || question.a > 3) throw new Error(`Doğru cevap 0-3 aralığında olmalı. satır=${index + 1}`);
    return { ...question, o: choices };
  });
}

export function buildScormWrapper() {
  return `function TT_FindApi(win){
  var cur = win; var depth = 0;
  while(cur && depth < 20){
    try {
      if(cur.API_1484_11) return { api: cur.API_1484_11, version: '2004' };
      if(cur.API) return { api: cur.API, version: '1.2' };
      if(cur.parent && cur.parent !== cur) cur = cur.parent; else break;
    } catch(e) { break; }
    depth += 1;
  }
  return null;
}
window.TT_SCORM = TT_FindApi(window);
window.TT_SCORM_READY = !!window.TT_SCORM;`;
}

export function buildSCORM(topic, qs, options = {}) {
  const payload = JSON.stringify({ topic, questions: qs, settings: options });
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${topic}</title>
  <script src="./SCORM_API_wrapper.js"></script>
  <script src="./scorm-data.js"></script>
  <style>
    html,body{margin:0;height:100%;overflow:hidden;font-family:Segoe UI,system-ui,sans-serif;background:linear-gradient(135deg,#0f172a,#172554,#0f766e);color:#fff}
    *{box-sizing:border-box}
    .app{height:100%;display:grid;grid-template-rows:auto 1fr auto;gap:14px;padding:18px}
    .card{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:28px;backdrop-filter:blur(18px);box-shadow:0 20px 60px rgba(0,0,0,.25)}
    .top{padding:18px 22px;display:flex;justify-content:space-between;gap:14px;align-items:center;flex-wrap:wrap}
    .title{font-size:clamp(26px,4vw,40px);font-weight:900;margin:6px 0 0}
    .sub{opacity:.85}
    .stat{padding:10px 14px;border-radius:18px;background:rgba(255,255,255,.07);font-weight:800}
    .main{display:grid;grid-template-columns:minmax(260px,.9fr) minmax(0,1.1fr);gap:14px;min-height:0}
    .panel{padding:20px;display:grid;gap:14px;min-height:0}
    .question{font-size:clamp(24px,3vw,42px);font-weight:900;line-height:1.15}
    .choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
    .choice{padding:18px;border-radius:22px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;text-align:left;font-size:18px;font-weight:800;cursor:pointer;min-height:86px}
    .choice:hover{filter:brightness(1.05)}
    .choice.ok{background:rgba(46,204,113,.18);border-color:rgba(46,204,113,.4)}
    .choice.bad{background:rgba(255,107,107,.18);border-color:rgba(255,107,107,.35)}
    .cta{padding:16px 20px;border:none;border-radius:18px;background:linear-gradient(135deg,#6C5CE7,#4ECDC4);color:#fff;font-weight:800;cursor:pointer}
    .secondary{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12)}
    .progress{height:14px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden}
    .progress>span{display:block;height:100%;background:linear-gradient(90deg,#4ECDC4,#6C5CE7)}
    .footer{padding:10px 14px;font-size:12px;opacity:.65;text-align:right}
    .hidden{display:none !important}
    @media (max-width: 980px){.app{padding:12px}.main{grid-template-columns:1fr}.choices{grid-template-columns:1fr}.choice{min-height:70px;font-size:16px}}
  </style>
</head>
<body>
  <div class="app">
    <div class="card top">
      <div>
        <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.75;font-weight:800">SCORM içerik</div>
        <div class="title">${topic}</div>
        <div class="sub">İçerik doğrudan oyunlaştırılmış quiz olarak çalışır.</div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <div class="stat"><span id="questionCount">${qs.length}</span> soru</div>
        <div class="stat">${options.scormVersion || '1.2'} profil</div>
        <div class="stat"><span id="scoreTop">0</span> puan</div>
      </div>
    </div>
    <div class="main">
      <div class="card panel" id="introPanel">
        <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.75;font-weight:800">Hazır</div>
        <div class="question">İçeriği başlat ve soruları sırayla çöz.</div>
        <div class="sub">SCORM puanı, ilerleme ve tamamlanma durumu oyun sonunda LMS'e kaydedilir.</div>
        <div class="progress"><span style="width:0%" id="progressBar"></span></div>
        <button class="cta" id="startBtn">İçeriği Başlat</button>
      </div>
      <div class="card panel hidden" id="gamePanel">
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center">
          <div style="font-weight:900">Soru <span id="questionIndex">1</span> / <span>${qs.length}</span></div>
          <div class="stat"><span id="scoreNow">0</span> puan</div>
        </div>
        <div class="progress"><span id="progressBar2" style="width:0%"></span></div>
        <div class="question" id="questionText"></div>
        <div class="choices" id="choices"></div>
        <div id="feedback" class="sub"></div>
      </div>
      <div class="card panel hidden" id="resultPanel">
        <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.75;font-weight:800">Tamamlandı</div>
        <div class="question">Harika! İçerik bitti.</div>
        <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px">
          <div class="stat"><div id="finalScore">0</div><div style="font-size:12px;opacity:.75">skor</div></div>
          <div class="stat"><div id="finalCorrect">0</div><div style="font-size:12px;opacity:.75">doğru</div></div>
          <div class="stat"><div id="finalWrong">0</div><div style="font-size:12px;opacity:.75">yanlış</div></div>
        </div>
        <button class="cta secondary" id="restartBtn">Baştan Oyna</button>
      </div>
    </div>
    <div class="footer">TT Bilgi Arena SCORM quiz paketi</div>
  </div>
  <script>
    window.__SCORM_DATA__ = window.__SCORM_DATA__ || ${payload};
    const data = window.__SCORM_DATA__;
    const questions = Array.isArray(data.questions) ? data.questions : [];
    let index = 0, score = 0, correct = 0, wrong = 0, startedAt = 0;
    function scormSet(k, v){
      try {
        const env = window.TT_SCORM;
        if(!env) return;
        if(env.version === '2004') env.api.SetValue(k, String(v));
        else env.api.LMSSetValue(k, String(v));
      } catch(e) {}
    }
    function scormCommit(){ try { const env = window.TT_SCORM; if(!env) return; if(env.version === '2004') env.api.Commit(''); else env.api.LMSCommit(''); } catch(e) {} }
    function scormInit(){ try { const env = window.TT_SCORM; if(!env) return; if(env.version === '2004') env.api.Initialize(''); else env.api.LMSInitialize(''); } catch(e) {} }
    function scormFinish(){ try { const env = window.TT_SCORM; if(!env) return; if(env.version === '2004') env.api.Terminate(''); else env.api.LMSFinish(''); } catch(e) {} }
    function saveProgress(done){
      const total = Math.max(questions.length, 1);
      const pct = Math.round((index / total) * 100);
      scormSet(window.TT_SCORM?.version === '2004' ? 'cmi.score.raw' : 'cmi.core.score.raw', Math.max(0, Math.min(100, Math.round((score / total) ))));
      scormSet(window.TT_SCORM?.version === '2004' ? 'cmi.location' : 'cmi.core.lesson_location', done ? 'results' : 'question-' + index);
      scormSet('cmi.suspend_data', JSON.stringify({ index, score, correct, wrong }).slice(0,3500));
      if(window.TT_SCORM?.version === '2004'){
        scormSet('cmi.completion_status', done ? 'completed' : 'incomplete');
        scormSet('cmi.success_status', (correct / total) >= .6 ? 'passed' : 'failed');
        scormSet('cmi.progress_measure', pct / 100);
      } else {
        scormSet('cmi.core.lesson_status', done ? 'completed' : 'incomplete');
      }
      scormCommit();
    }
    function show(id){['introPanel','gamePanel','resultPanel'].forEach((x)=>document.getElementById(x).classList.add('hidden')); document.getElementById(id).classList.remove('hidden');}
    function syncBars(){
      const total = Math.max(questions.length, 1); const width = Math.round((index / total) * 100) + '%';
      document.getElementById('progressBar').style.width = width;
      document.getElementById('progressBar2').style.width = width;
      document.getElementById('scoreTop').textContent = score;
      document.getElementById('scoreNow').textContent = score;
      document.getElementById('questionIndex').textContent = Math.min(index + 1, total);
    }
    function renderQuestion(){
      syncBars();
      const q = questions[index];
      if(!q){
        show('resultPanel');
        document.getElementById('finalScore').textContent = score;
        document.getElementById('finalCorrect').textContent = correct;
        document.getElementById('finalWrong').textContent = wrong;
        saveProgress(true);
        scormFinish();
        return;
      }
      show('gamePanel');
      document.getElementById('questionText').textContent = q.q;
      document.getElementById('feedback').textContent = q.hint || q.explanation || 'Doğru cevabı seç.';
      const box = document.getElementById('choices'); box.innerHTML = '';
      q.o.forEach((choice, i) => {
        const btn = document.createElement('button');
        btn.className = 'choice';
        btn.textContent = choice;
        btn.onclick = () => {
          Array.from(box.children).forEach((node, idx) => node.classList.add(idx === q.a ? 'ok' : idx === i ? 'bad' : ''));
          if(i === q.a){ score += 100; correct += 1; document.getElementById('feedback').textContent = q.explanation || 'Doğru cevap!'; }
          else { wrong += 1; document.getElementById('feedback').textContent = 'Yanlış cevap. Doğrusu: ' + q.o[q.a] + (q.explanation ? ' • ' + q.explanation : ''); }
          index += 1;
          saveProgress(false);
          setTimeout(renderQuestion, 900);
        };
        box.appendChild(btn);
      });
    }
    document.getElementById('startBtn').onclick = () => { scormInit(); startedAt = Date.now(); saveProgress(false); renderQuestion(); };
    document.getElementById('restartBtn').onclick = () => { index = 0; score = 0; correct = 0; wrong = 0; show('introPanel'); syncBars(); };
    syncBars();
  </script>
</body>
</html>`;
}

export function buildManifest(title, options = {}, filePaths = []) {
  const safe = String(title || 'Bilgi Arena').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  const identifier = `tt-oyun-${Date.now()}`;
  const files = Array.from(new Set([
    'index.html',
    'launch.html',
    'scorm-data.js',
    'SCORM_API_wrapper.js',
    ...filePaths,
  ])).map((file) => String(file).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;'));
  const fileTags = files.map((file) => `      <file href="${file}"/>`).join('\n');
  if (options.scormVersion === '2004') {
    return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${identifier}" version="1" xmlns="http://www.imsglobal.org/xsd/imscp_v1p1" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3" xmlns:adlseq="http://www.adlnet.org/xsd/adlseq_v1p3" xmlns:adlnav="http://www.adlnet.org/xsd/adlnav_v1p3" xmlns:imsss="http://www.imsglobal.org/xsd/imsss" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd http://www.adlnet.org/xsd/adlcp_v1p3 adlcp_v1p3.xsd http://www.imsglobal.org/xsd/imsss imsss_v1p0.xsd">
  <metadata><schema>ADL SCORM</schema><schemaversion>2004 4th Edition</schemaversion></metadata>
  <organizations default="ORG-1"><organization identifier="ORG-1"><title>${safe}</title><item identifier="ITEM-1" identifierref="RES-1" isvisible="true"><title>${safe}</title></item></organization></organizations>
  <resources><resource identifier="RES-1" type="webcontent" adlcp:scormType="sco" href="index.html">
${fileTags}
  </resource></resources>
</manifest>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${identifier}" version="1" xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata><schema>ADL SCORM</schema><schemaversion>1.2</schemaversion></metadata>
  <organizations default="ORG-1"><organization identifier="ORG-1"><title>${safe}</title><item identifier="ITEM-1" identifierref="RES-1"><title>${safe}</title></item></organization></organizations>
  <resources><resource identifier="RES-1" type="webcontent" adlcp:scormtype="sco" href="index.html">
${fileTags}
  </resource></resources>
</manifest>`;
}

export function sanitizeScormFileBase(value = 'BilgiArena') {
  return String(value || 'BilgiArena')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'BilgiArena';
}


function injectScormScriptsIntoHtml(html) {
  const scripts = `
    <script src="./SCORM_API_wrapper.js"></script>
    <script src="./scorm-data.js"></script>`;
  if (html.includes('./SCORM_API_wrapper.js')) return html;
  if (html.includes('</head>')) {
    return html.replace('</head>', `${scripts}
  </head>`);
  }
  if (html.includes('<body>')) {
    return html.replace('<body>', `${scripts}
  <body>`);
  }
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
    if (raw.startsWith('http')) continue;
    out.add(raw);
  }
  return Array.from(out);
}

export async function buildRuntimeScormFiles(topic, questions, options = {}, extraData = {}) {
  const safeTopic = topic || 'Bilgi Arena';
  const wrapper = buildScormWrapper();
  const dataScript = `window.__SCORM_DATA__ = ${JSON.stringify({ topic: safeTopic, questions, settings: options, screen: 'games', ...extraData }, null, 2)};`;
  const base = new URL('./dist/', window.location.href);
  const indexUrl = new URL('index.html', base);
  const htmlResponse = await fetch(indexUrl.toString(), { cache: 'no-store' });
  if (!htmlResponse.ok) throw new Error('SCORM için dist/index.html alınamadı. Önce build üret ve tekrar dene.');
  const distHtml = await htmlResponse.text();
  const patchedHtml = injectScormScriptsIntoHtml(distHtml);
  const assetPaths = extractDistAssetPaths(distHtml);
  const manifest = buildManifest(safeTopic, options, assetPaths);
  const files = [
    { name: 'index.html', content: patchedHtml },
    { name: 'launch.html', content: patchedHtml },
    { name: 'imsmanifest.xml', content: manifest },
    { name: 'SCORM_API_wrapper.js', content: wrapper },
    { name: 'scorm-data.js', content: dataScript },
  ];
  for (const assetPath of assetPaths) {
    const assetUrl = new URL(assetPath, base);
    const res = await fetch(assetUrl.toString(), { cache: 'no-store' });
    if (!res.ok) throw new Error(`SCORM asset alınamadı: ${assetPath}`);
    const buf = new Uint8Array(await res.arrayBuffer());
    files.push({ name: assetPath, content: buf });
  }
  return files;
}
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");
const AdmZip = require("adm-zip");

const ROOT_DIR = __dirname;
const DIST_DIR = path.join(ROOT_DIR, "dist");
const PORT = 3210;

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getAllFiles(dir, baseDir = dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, baseDir));
    } else {
      results.push({
        abs: fullPath,
        rel: path.relative(baseDir, fullPath).replace(/\\/g, "/"),
      });
    }
  }

  return results;
}

function buildManifest(title = "Bilgi Arena", files = []) {
  const fileTags = files
    .map((file) => `      <file href="${escapeXml(file.rel)}"/>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="BilgiArena_Package" version="1.2"
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
    <resource
      identifier="RES1"
      type="webcontent"
      adlcp:scormtype="sco"
      href="index.html">
${fileTags}
    </resource>
  </resources>
</manifest>`;
}

function validatePayload(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Geçersiz veri gövdesi.");
  }

  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error("questions dolu bir dizi olmalı.");
  }

  for (let i = 0; i < data.questions.length; i += 1) {
    const q = data.questions[i];

    if (!q || typeof q.q !== "string" || !Array.isArray(q.o)) {
      throw new Error(`Soru formatı hatalı. index=${i}`);
    }

    if (q.o.length !== 4) {
      throw new Error(`Her soruda 4 şık olmalı. index=${i}`);
    }

    if (!Number.isInteger(q.a) || q.a < 0 || q.a > 3) {
      throw new Error(`Doğru cevap index'i 0-3 arasında olmalı. index=${i}`);
    }
  }
}

function ensureBuild() {
  console.log("🚀 Vite build alınıyor...");
  execSync("npm run build", {
    cwd: ROOT_DIR,
    stdio: "inherit",
  });

  const indexPath = path.join(DIST_DIR, "index.html");
  if (!fs.existsSync(indexPath)) {
    throw new Error("dist/index.html bulunamadı.");
  }
}

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function injectScormData(tempDistDir, data) {
  const scormDataPath = path.join(tempDistDir, "scorm-data.js");
  const scormDataContent = `window.__SCORM_DATA__ = ${JSON.stringify(
    {
      topic: data.topic || "SCORM İçeriği",
      questions: data.questions,
      settings: data.settings || {},
      competition: data.competition || {},
      selectedGames: Array.isArray(data.selectedGames) ? data.selectedGames : undefined,
    },
    null,
    2
  )};`;

  fs.writeFileSync(scormDataPath, scormDataContent, "utf8");

  const indexPath = path.join(tempDistDir, "index.html");
  let html = fs.readFileSync(indexPath, "utf8");

  if (
    !html.includes('src="./scorm-data.js"') &&
    !html.includes('src="scorm-data.js"')
  ) {
    html = html.replace(
      "</head>",
      `  <script src="./scorm-data.js"></script>\n</head>`
    );
    fs.writeFileSync(indexPath, html, "utf8");
  }
}

function writeManifest(tempDistDir, title) {
  const files = getAllFiles(tempDistDir, tempDistDir);
  const manifestPath = path.join(tempDistDir, "imsmanifest.xml");
  const manifestContent = buildManifest(title || "Bilgi Arena", files);
  fs.writeFileSync(manifestPath, manifestContent, "utf8");
}

function buildScormZipBuffer(data) {
  validatePayload(data);
  ensureBuild();

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bilgiarena-scorm-"));
  const tempDistDir = path.join(tempRoot, "dist");

  copyDirRecursive(DIST_DIR, tempDistDir);
  injectScormData(tempDistDir, data);
  writeManifest(tempDistDir, data.topic || "Bilgi Arena");

  const zip = new AdmZip();
  const files = getAllFiles(tempDistDir, tempDistDir);

  for (const file of files) {
    const zipFolder = path.dirname(file.rel) === "." ? "" : path.dirname(file.rel);
    zip.addLocalFile(file.abs, zipFolder);
  }

  return zip.toBuffer();
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(body);
}

function toAsciiFilename(value) {
  return String(value || "BilgiArena_SCORM.zip")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "") || "BilgiArena_SCORM.zip";
}

function sendZip(res, filename, buffer) {
  const asciiName = toAsciiFilename(filename);
  res.writeHead(200, {
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="${asciiName}"`,
    "Content-Length": buffer.length,
    "Access-Control-Allow-Origin": "*",
  });
  res.end(buffer);
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "POST" && req.url === "/export-scorm") {
    let rawBody = "";

    req.on("data", (chunk) => {
      rawBody += chunk.toString();
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(rawBody || "{}");
        const zipBuffer = buildScormZipBuffer(data);
        const safeName = (data.topic || "BilgiArena")
          .replace(/[^\p{L}\p{N}\-_ ]/gu, "")
          .trim()
          .replace(/\s+/g, "_");

        sendZip(res, `${safeName || "BilgiArena"}_SCORM.zip`, zipBuffer);
      } catch (error) {
        console.error("❌ Export hatası:", error);
        sendJson(res, 400, {
          ok: false,
          error: error.message || "SCORM export başarısız.",
        });
      }
    });

    return;
  }

  sendJson(res, 404, { ok: false, error: "Bulunamadı." });
});

server.listen(PORT, () => {
  console.log(`✅ SCORM exporter çalışıyor: http://localhost:${PORT}`);
});
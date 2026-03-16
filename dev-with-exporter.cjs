const { spawn } = require('child_process');
const path = require('path');

const ROOT = __dirname;
const nodeBin = process.execPath;
const viteBin = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
const viteArgs = [viteBin, ...process.argv.slice(2)];

const exporter = spawn(nodeBin, ['exporter-server.cjs'], {
  cwd: ROOT,
  stdio: 'inherit',
  env: process.env,
});

const vite = spawn(nodeBin, viteArgs, {
  cwd: ROOT,
  stdio: 'inherit',
  env: process.env,
});

let closing = false;
const shutdown = (code = 0) => {
  if (closing) return;
  closing = true;
  if (!exporter.killed) exporter.kill('SIGTERM');
  if (!vite.killed) vite.kill('SIGTERM');
  setTimeout(() => {
    if (!exporter.killed) exporter.kill('SIGKILL');
    if (!vite.killed) vite.kill('SIGKILL');
    process.exit(code);
  }, 800);
};

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

exporter.on('exit', (code) => {
  if (closing) return;
  if (code && code !== 0) {
    console.error('❌ SCORM exporter kapandı.');
    shutdown(code);
  }
});

vite.on('exit', (code) => {
  shutdown(code || 0);
});

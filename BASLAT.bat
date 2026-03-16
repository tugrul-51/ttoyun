@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Paketler yukleniyor...
  npm install
)
echo Uygulama baslatiliyor...
npm run dev
pause

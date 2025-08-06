@echo off
echo Starting DigiArchive Frontend...

cd %~dp0frontend

if not exist "node_modules\" (
    echo Installing Node.js dependencies...
    npm install
) else (
    echo Using existing node_modules...
)

echo Starting Vite development server...
npm run dev

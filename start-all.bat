@echo off
echo Starting DigiArchive (Backend and Frontend)...

start cmd /k "%~dp0start-backend.bat"
timeout /t 5
start cmd /k "%~dp0start-frontend.bat"

echo DigiArchive is starting in separate windows...

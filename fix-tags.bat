@echo off
echo Running Document Tag Fix Script...
echo ===============================

cd backend
call venv\Scripts\activate.bat
python fix_document_tags.py

echo.
echo Script finished
echo.
pause

@echo off
echo Starting DigiArchive Backend...

cd %~dp0backend

if not exist "venv\" (
    echo Creating new Python virtual environment...
    python -m venv venv
    call venv\Scripts\activate
    echo Installing dependencies...
    pip install -r requirements.txt
    echo Running migrations...
    python manage.py migrate
) else (
    echo Using existing virtual environment...
    call venv\Scripts\activate
)

echo Starting Django server...
python manage.py runserver

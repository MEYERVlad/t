@echo off
chcp 65001 >nul
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo Python не найден. Установите Python 3.11 с python.org, поставив галочку "Add python.exe to PATH", и запустите снова.
  pause
  exit /b 1
)
echo Ставлю библиотеки (первый раз несколько минут)...
python -m pip install --upgrade pip
python -m pip install torch --index-url https://download.pytorch.org/whl/cpu
python -m pip install numpy
echo.
echo Озвучиваю реплики...
python tts_silero.py %*
pause

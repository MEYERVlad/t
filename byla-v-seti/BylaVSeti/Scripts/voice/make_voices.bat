@echo off
chcp 65001 >nul
cd /d "%~dp0"

rem Новый установщик Python (Python Install Manager) даёт команду py: ставим через него Python 3.11.
where py >nul 2>nul
if errorlevel 1 goto nopy
echo Проверяю Python 3.11 (если его нет, он установится; на вопросы отвечайте Y и Enter)...
py install 3.11
set "PY=py -3.11"
goto run

:nopy
where python >nul 2>nul
if errorlevel 1 goto nothing
set "PY=python"
goto run

:nothing
echo Python не найден. Установите Python с python.org и запустите этот файл снова.
pause
exit /b 1

:run
echo.
echo Ставлю библиотеки (первый раз несколько минут)...
%PY% -m pip install --upgrade pip
%PY% -m pip install torch --index-url https://download.pytorch.org/whl/cpu
%PY% -m pip install numpy
echo.
echo Озвучиваю реплики...
%PY% tts_silero.py %*
pause

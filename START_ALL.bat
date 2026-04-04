@echo off
cd /d "D:\Content OS"
echo Запускаю n8n...
start "n8n" cmd /k "n8n start"
timeout /t 8 /nobreak >/dev/null
echo Запускаю Engine...
start "AMAImedia Engine" python_embedded\python.exe engine.py
timeout /t 2 /nobreak >/dev/null
echo Запускаю Producer Center...
start "Producer Center" python_embedded\python.exe producer_center_app.py
echo.
echo Готово! Все системы запущены.
echo Engine работает в фоне 24/7.
pause

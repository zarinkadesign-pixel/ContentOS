@echo off
cd /d "D:\Content OS"
echo ================================
echo   AMAImedia Producer Center
echo   Autonomous Engine v4.0
echo ================================
echo.
echo [1/3] Запускаю n8n...
start "n8n" cmd /k "n8n start"
timeout /t 8 /nobreak >nul
echo [2/3] Запускаю Engine (работает 24/7)...
start "AMAImedia Engine v4.0" python_embedded\python.exe engine.py
timeout /t 3 /nobreak >nul
echo [3/3] Запускаю Producer Center UI...
start "Producer Center" python_embedded\python.exe producer_center_app.py
echo.
echo ================================
echo   Система запущена!
echo   n8n: http://localhost:5678
echo   Engine: работает в фоне
echo ================================
pause

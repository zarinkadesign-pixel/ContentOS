@echo off
cd /d "D:\Content OS"
echo ================================
echo   AMAImedia Producer Center
echo ================================
echo.
echo [1/3] Запускаю n8n...
start "n8n" cmd /k "n8n start"
timeout /t 8 /nobreak >nul
echo [2/3] Запускаю Engine (24/7)...
start "AMAImedia Engine" python_embedded\python.exe engine.py
timeout /t 2 /nobreak >nul
echo [3/3] Запускаю Producer Center...
start "Producer Center" python_embedded\python.exe producer_center_app.py
echo.
echo ================================
echo   Готово! Нажми Enter для выхода
echo ================================
pause >nul

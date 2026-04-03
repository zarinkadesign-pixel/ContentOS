@echo off
title AMAImedia Producer Center v4.0
echo ════════════════════════════════════════
echo   AMAImedia — Autonomous Engine v4.0
echo   Запуск всей системы одной кнопкой
echo ════════════════════════════════════════
echo.

echo [1/3] Запускаю n8n...
start "n8n" cmd /k "n8n start"
timeout /t 8 /nobreak >nul

echo [2/3] Запускаю автономный движок Engine...
start "AMAImedia Engine v4.0" "D:\Content OS\python_embedded\python.exe" "D:\Content OS\engine.py"
timeout /t 3 /nobreak >nul

echo [3/3] Запускаю Producer Center UI...
start "Producer Center" "D:\Content OS\python_embedded\python.exe" "D:\Content OS\producer_center_app.py"

echo.
echo ════════════════════════════════════════
echo   Всё запущено! Система работает 24/7.
echo.
echo   n8n:            http://localhost:5678
echo   Producer Center: открылось в окне
echo   Engine:          работает в фоне
echo.
echo   Зарина делает одно действие — этот .bat
echo   Остальное — AI агенты 24/7
echo ════════════════════════════════════════
pause

@echo off
echo === AMAImedia Producer Center ===
echo Starting all systems...
echo.
start "n8n" cmd /k "n8n start"
timeout /t 5 /nobreak >nul
start "Producer Center" cmd /k "cd /d "D:\Content OS" && python producer_center_app.py"
echo.
echo All started!
echo n8n: http://localhost:5678
echo.
pause

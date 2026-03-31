@echo off
:: Self-elevate to Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo Running as Administrator - OK
echo.

echo Step 1: Fix site-packages...
"D:\Content OS\python_embedded\python.exe" -c "import glob; [open(f,'w').write(open(f).read().replace('#import site','import site')) for f in glob.glob('D:/Content OS/python_embedded/*._pth')]"

echo Step 2: Download get-pip.py...
"D:\Content OS\python_embedded\python.exe" -c "import urllib.request; urllib.request.urlretrieve('https://bootstrap.pypa.io/get-pip.py','D:/Content OS/get-pip.py')"

echo Step 3: Install pip...
"D:\Content OS\python_embedded\python.exe" "D:\Content OS\get-pip.py" --no-warn-script-location

echo Step 4: Install packages...
"D:\Content OS\python_embedded\python.exe" -m pip install customtkinter requests Pillow --no-warn-script-location

echo.
echo ALL DONE - run run2.bat to start the app
pause

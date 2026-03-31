@echo off
echo Step 1: Fix site-packages...
"D:\Content OS\python_embedded\python.exe" -c "import glob; [open(f,'w').write(open(f).read().replace('#import site','import site')) for f in glob.glob('D:/Content OS/python_embedded/*._pth')]"
echo Done.

echo Step 2: Download get-pip.py...
"D:\Content OS\python_embedded\python.exe" -c "import urllib.request; urllib.request.urlretrieve('https://bootstrap.pypa.io/get-pip.py','D:/Content OS/get-pip.py')"
echo Done.

echo Step 3: Install pip...
"D:\Content OS\python_embedded\python.exe" "D:\Content OS\get-pip.py"
echo Done.

echo Step 4: Install packages...
"D:\Content OS\python_embedded\python.exe" -m pip install customtkinter requests Pillow
echo Done. Now run run.bat
pause

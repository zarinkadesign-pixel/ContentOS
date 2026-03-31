import urllib.request, subprocess, sys, os

PY = sys.executable
BASE = "D:/Content OS"

print("=== Producer Center Installer ===")
print(f"Python: {PY}")
print()

# Step 1: fix ._pth
import glob
for f in glob.glob(BASE + "/python_embedded/*._pth"):
    try:
        txt = open(f).read()
        if "#import site" in txt:
            open(f,"w").write(txt.replace("#import site","import site"))
            print(f"Fixed: {f}")
    except Exception as e:
        print(f"Skip pth: {e}")

# Step 2: download get-pip
pip_script = BASE + "/get-pip.py"
print("Downloading get-pip.py...")
try:
    urllib.request.urlretrieve(
        "https://bootstrap.pypa.io/get-pip.py",
        pip_script
    )
    print("Downloaded OK")
except Exception as e:
    print(f"Download error: {e}")
    input("Press Enter to exit")
    sys.exit(1)

# Step 3: install pip
print("Installing pip...")
subprocess.run([PY, pip_script, "--no-warn-script-location"], check=False)

# Step 4: install packages
print("Installing customtkinter, requests, Pillow...")
subprocess.run([PY, "-m", "pip", "install",
                "customtkinter", "requests", "Pillow",
                "--no-warn-script-location"], check=False)

print()
print("=== DONE! Starting Producer Center... ===")
print()

# Launch app
os.chdir(BASE + "/producer_center")
sys.path.insert(0, BASE + "/producer_center")

import importlib.util
spec = importlib.util.spec_from_file_location("main", BASE + "/producer_center/main.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

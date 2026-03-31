import urllib.request, json, time
from datetime import datetime, timedelta

VIZARD = "732bfd910eb24627a4bad11e5761575a"
BOT    = "8494012171:AAFTbhHTS0WxlG6PE6DRn96nVVF4kKfBKtY"
CHAT   = "905075336"
BASE   = "https://elb-api.vizard.ai/hvizard-server-front/open-api/v1"

CLIPS = [
    (42592214, "10", "Kak poluchat klientov 24/7"),
    (42592212, "10", "Kak prodavat bez storis 24/7"),
    (42592208, "10", "Kak perestat vygorat ot Reels"),
    (42592203, "10", "30% konversiya cherez voronki"),
    (42592195, "9.5","Kak monetizirovat blog"),
    (42592190, "9.2","Perestat vygorat ot storis"),
    (42592187, "9.2","Klientov 24/7 bez haosa"),
    (42592184, "9",  "Test - gotov li blog prodavat"),
    (42592179, "9",  "Firmenniy stil 3 cveta"),
    (42592175, "9",  "Pochemu voronka ne daet prodazh"),
]

CAPTIONS = [
    "Moya sistema rabotaet 24/7. Raz nastrail i ona prinosit klientov. Napiši HOCHU v kommentarii #prodazhi #voronki #ekspert #instagram #avtomatizaciya",
    "Prodavat bez ezhednevnyh storis - eto realnost. Napiši HOCHU i ya pokažu kak #storis #prodazhi #ekspert #kontentplan #instagram",
    "Vygoranie ot kontenta mešaet zarabatyvat. Est rešenie. Napiši HOCHU #reels #vygoranie #ekspert #instagram #prodazhi",
    "10 strategicheskih sessiy = 3-4 prodazhi. Konversiya 30%. Napiši HOCHU #konversiya #voronki #prodazhi #biznes #rezultaty",
    "Monetizaciya bloga - eto sistema a ne sluchaynost. Napiši HOCHU #monetizaciya #blog #instagram #prodazhi #ekspert",
    "Ne nado snimat kontent každyy den. Nužna sistema. Napiši HOCHU #storis #vygoranie #kontentplan #instagram #ekspert",
    "Sistema prinosit klientov každyy den bez haotičnogo postinga. Napiši HOCHU #klienty #instagram #voronki #sistema #prodazhi",
    "4 voprosa kotorye pokažut gotov li tvoy blog prodavat. Napiši HOCHU #blog #prodazhi #test #monetizaciya #ekspert",
    "3 cveta - eto vsyo chto nužno dlya celostnogo dizayna. Napiši HOCHU #dizayn #brendstil #instagram #vizual #ekspert",
    "Pochemu 80% ne pokupayut i kak eto ispravit. Napiši HOCHU #prodazhi #konversiya #voronki #eksprt #biznes",
]

def pub(vid, caption, ms):
    headers = {"VIZARDAI_API_KEY": VIZARD, "Content-Type": "application/json"}
    body = json.dumps({"finalVideoId": vid, "post": caption, "publishTime": ms}).encode()
    req = urllib.request.Request(BASE + "/project/publish-video", body, headers)
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

def tg(text):
    try:
        body = json.dumps({"chat_id": CHAT, "text": text}).encode()
        req = urllib.request.Request("https://api.telegram.org/bot" + BOT + "/sendMessage", body, {"Content-Type": "application/json"})
        urllib.request.urlopen(req, timeout=10)
    except Exception as e:
        print("TG: " + str(e))

print("=" * 50)
print("Publishing " + str(len(CLIPS)) + " clips to Vizard")
print("=" * 50)

ok = 0
report = "SCHEDULE\n" + "-" * 40 + "\n"

for i, (vid, score, title) in enumerate(CLIPS):
    days = i * 2
    ms = int(time.time() * 1000) + days * 86400 * 1000
    date = (datetime.now() + timedelta(days=days)).strftime("%d.%m.%Y")
    print(str(i+1) + "/" + str(len(CLIPS)) + " " + date + " score:" + score + " " + title)
    try:
        pub(vid, CAPTIONS[i], ms)
        print("   OK")
        ok += 1
        report += date + " score:" + score + " " + title + "\n"
    except Exception as e:
        print("   ERR: " + str(e)[:50])
    time.sleep(1)

with open("D:/Content OS/schedule_report.txt", "w") as f:
    f.write(report)

tg("Done! " + str(ok) + "/" + str(len(CLIPS)) + " clips scheduled!\n\n" + report)
print()
print("DONE! " + str(ok) + "/" + str(len(CLIPS)) + " scheduled")
print("First clip: TODAY")
print("Last clip: +" + str((len(CLIPS)-1)*2) + " days")
input("Press Enter...")

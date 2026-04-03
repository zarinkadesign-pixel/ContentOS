"""Producer Center — Vizard API"""
import requests
from config import VIZARD_BASE, VIZARD_KEY

def _h():
    return {"Content-Type":"application/json","VIZARDAI_API_KEY": VIZARD_KEY}

def create_project(url: str, lang="ru", max_clips=10) -> dict:
    try:
        r = requests.post(f"{VIZARD_BASE}/project/create", headers=_h(), timeout=30,
            json={"videoUrl":url,"videoType":2 if "youtu" in url else 1,
                  "lang":lang,"preferLength":[2],"maxClipNumber":max_clips,
                  "ratioOfClip":4,"subtitleSwitch":1,"emojiSwitch":1,
                  "highlightSwitch":1,"headlineSwitch":1,"removeSilenceSwitch":1})
        return r.json()
    except Exception as e:
        return {"error": str(e)}

def poll_project(project_id) -> dict:
    try:
        r = requests.get(f"{VIZARD_BASE}/project/query/{project_id}",
                          headers=_h(), timeout=15)
        return r.json()
    except Exception as e:
        return {"error": str(e)}

def get_ai_social(video_id) -> dict:
    try:
        r = requests.post(f"{VIZARD_BASE}/project/ai-social", headers=_h(), timeout=20,
            json={"finalVideoId":video_id,"aiSocialPlatform":3,"tone":1,"voice":0})
        return r.json()
    except Exception as e:
        return {"error": str(e)}

def publish_video(video_id, caption: str, publish_time: int) -> dict:
    try:
        r = requests.post(f"{VIZARD_BASE}/project/publish-video", headers=_h(), timeout=15,
            json={"finalVideoId":video_id,"post":caption,"publishTime":publish_time})
        return r.json()
    except Exception as e:
        return {"error": str(e)}

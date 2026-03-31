"""
ContentOS — AI-powered content production system
Copyright (c) 2026 AMAImedia.com
backend/routes/vizard.py
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from api.vizard import create_project, poll_project, get_ai_social, publish_video

router = APIRouter()


class ClipCreate(BaseModel):
    video_url: str
    language: str = "ru"


class SocialRequest(BaseModel):
    project_id: str


class PublishRequest(BaseModel):
    project_id: str
    caption: str
    publish_at: str = ""


@router.post("/clip")
def clip_video(body: ClipCreate):
    result = create_project(body.video_url, body.language)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/project/{project_id}")
def get_project(project_id: str):
    result = poll_project(project_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/social")
def social_captions(body: SocialRequest):
    result = get_ai_social(body.project_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/publish")
def publish(body: PublishRequest):
    result = publish_video(body.project_id, body.caption, body.publish_at)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

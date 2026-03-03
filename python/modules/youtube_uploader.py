#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
modules/youtube_uploader.py
نشر الفيديوهات على YouTube باستخدام YouTube Data API v3
مع دعم OAuth2 ورفع استئنافي
"""

import os
import json
import time
from pathlib import Path
from typing import Optional, List, Dict

try:
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    from googleapiclient.errors import HttpError
    YOUTUBE_API_AVAILABLE = True
except ImportError:
    YOUTUBE_API_AVAILABLE = False

from .config_manager import ConfigManager


SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube"
]


class YouTubeUploader:
    """Uploads videos to YouTube via YouTube Data API v3."""

    CHUNK_SIZE = 1024 * 1024 * 10  # 10MB
    MAX_RETRIES = 3

    def __init__(self, config: ConfigManager):
        self.config = config
        self.credentials_path = config.get('youtube_credentials_path', 'credentials.json')
        self.token_path = config.get('youtube_token_path', 'youtube_token.json')
        self._service = None

    def is_configured(self) -> bool:
        """Check if YouTube API credentials exist."""
        if not YOUTUBE_API_AVAILABLE:
            return False
        return os.path.exists(self.credentials_path)

    def authenticate(self) -> bool:
        """OAuth2 authentication. Opens browser on first run."""
        if not YOUTUBE_API_AVAILABLE:
            print("❌ قم بتثبيت: pip install google-auth-oauthlib google-api-python-client")
            return False

        if not os.path.exists(self.credentials_path):
            print(f"❌ ملف credentials.json غير موجود!")
            print("احصل عليه من: console.cloud.google.com → APIs → YouTube Data API v3")
            return False

        creds = None

        if os.path.exists(self.token_path):
            try:
                creds = Credentials.from_authorized_user_file(self.token_path, SCOPES)
            except Exception:
                creds = None

        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                try:
                    creds.refresh(Request())
                except Exception:
                    creds = None

            if not creds:
                try:
                    flow = InstalledAppFlow.from_client_secrets_file(
                        self.credentials_path, SCOPES
                    )
                    creds = flow.run_local_server(port=0)
                    print("✅ تم تسجيل الدخول إلى YouTube!")
                except Exception as e:
                    print(f"❌ فشل المصادقة: {e}")
                    return False

            try:
                with open(self.token_path, 'w') as f:
                    f.write(creds.to_json())
            except Exception:
                pass

        try:
            self._service = build('youtube', 'v3', credentials=creds)
            return True
        except Exception as e:
            print(f"❌ فشل بناء خدمة YouTube: {e}")
            return False

    def upload(
        self,
        video_path: str,
        title: str,
        description: str = "",
        tags: List[str] = None,
        hashtags: List[str] = None,
        category_id: str = "22",
        privacy: str = "public",
        made_for_kids: bool = False
    ) -> Optional[str]:
        """
        Upload video to YouTube.

        Args:
            video_path: Path to MP4 video
            title: Video title (max 100 chars)
            description: Video description
            tags: List of tags
            hashtags: List of hashtags to add to description
            category_id: YouTube category (22=People&Blogs, 28=Tech, 27=Education)
            privacy: 'public' | 'unlisted' | 'private'
            made_for_kids: Kids content flag

        Returns:
            YouTube video ID or None
        """
        if not os.path.exists(video_path):
            print(f"❌ الفيديو غير موجود: {video_path}")
            return None

        if not self._service:
            if not self.authenticate():
                return None

        # Prepare metadata
        title = title[:100]

        full_desc = description
        if hashtags:
            ht_str = " ".join(h if h.startswith('#') else f"#{h}" for h in hashtags)
            full_desc += f"\n\n{ht_str}"
        full_desc += "\n\n---\n🎬 أُنتج بـ DrCode Shorts Studio"
        full_desc = full_desc[:5000]

        all_tags = list(tags or [])
        for h in (hashtags or []):
            t = h.lstrip('#')
            if t not in all_tags:
                all_tags.append(t)
        all_tags = all_tags[:500]

        body = {
            "snippet": {
                "title": title,
                "description": full_desc,
                "tags": all_tags,
                "categoryId": category_id,
                "defaultLanguage": "ar"
            },
            "status": {
                "privacyStatus": privacy,
                "selfDeclaredMadeForKids": made_for_kids,
                "madeForKids": made_for_kids
            }
        }

        for attempt in range(self.MAX_RETRIES):
            try:
                print(f"📤 رفع الفيديو على YouTube (محاولة {attempt+1}/{self.MAX_RETRIES})...")

                media = MediaFileUpload(
                    video_path,
                    mimetype='video/mp4',
                    resumable=True,
                    chunksize=self.CHUNK_SIZE
                )

                request = self._service.videos().insert(
                    part=",".join(body.keys()),
                    body=body,
                    media_body=media
                )

                video_id = self._upload_with_progress(request)

                if video_id:
                    print(f"✅ تم النشر على YouTube!")
                    print(f"   🔗 https://youtu.be/{video_id}")
                    print(f"   📊 https://studio.youtube.com/video/{video_id}/edit")
                    return video_id

            except HttpError as e:
                try:
                    err = json.loads(e.content).get('error', {})
                    msg = err.get('message', str(e))
                except:
                    msg = str(e)
                print(f"⚠️  YouTube API: {msg}")

                if e.resp.status in [401, 403]:
                    print("🔄 إعادة المصادقة...")
                    if os.path.exists(self.token_path):
                        os.remove(self.token_path)
                    self._service = None
                    if not self.authenticate():
                        return None

            except Exception as e:
                print(f"⚠️  خطأ: {e}")

            if attempt < self.MAX_RETRIES - 1:
                wait = (attempt + 1) * 5
                print(f"⏳ انتظار {wait}ث...")
                time.sleep(wait)

        return None

    def _upload_with_progress(self, request) -> Optional[str]:
        """Upload with progress bar."""
        response = None
        error = None

        while response is None:
            try:
                status, response = request.next_chunk()
                if status:
                    pct = int(status.progress() * 100)
                    filled = pct // 5
                    bar = "█" * filled + "░" * (20 - filled)
                    print(f"\r  [{bar}] {pct}%", end="", flush=True)
            except HttpError as e:
                if e.resp.status in [500, 502, 503, 504]:
                    if error: raise
                    error = e
                    time.sleep(5)
                else:
                    raise

        print()
        return response.get('id') if response else None

    def get_channel_info(self) -> Optional[Dict]:
        """Get current channel info."""
        if not self._service and not self.authenticate():
            return None
        try:
            res = self._service.channels().list(
                part="snippet,statistics", mine=True
            ).execute()
            ch = res.get('items', [{}])[0]
            return {
                'id': ch.get('id'),
                'name': ch.get('snippet', {}).get('title'),
                'subscribers': ch.get('statistics', {}).get('subscriberCount', 0),
                'videos': ch.get('statistics', {}).get('videoCount', 0)
            }
        except Exception as e:
            print(f"⚠️  فشل جلب معلومات القناة: {e}")
            return None

    def set_thumbnail(self, video_id: str, thumbnail_path: str) -> bool:
        """Set custom video thumbnail."""
        if not self._service or not os.path.exists(thumbnail_path):
            return False
        try:
            media = MediaFileUpload(thumbnail_path, mimetype='image/jpeg')
            self._service.thumbnails().set(
                videoId=video_id, media_body=media
            ).execute()
            print("✅ تم تعيين الصورة المصغرة")
            return True
        except Exception as e:
            print(f"⚠️  فشل الصورة المصغرة: {e}")
            return False

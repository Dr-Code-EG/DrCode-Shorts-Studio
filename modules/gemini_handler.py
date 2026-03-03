#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
modules/gemini_handler.py
التواصل مع Google Gemini API لتوليد الأفكار والسكربتات
مع دعم التبديل التلقائي بين المفاتيح ونظام انتظار ذكي (Exponential Backoff)
"""

import json
import time
import re
import random
from typing import Optional, List, Dict, Any

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("⚠️  قم بتثبيت: pip install google-generativeai")

from .config_manager import ConfigManager


class GeminiHandler:
    """Handles all interactions with Google Gemini AI API."""

    MAX_RETRIES = 10  # زيادة عدد المحاولات
    BASE_RETRY_DELAY = 5  # زيادة وقت الانتظار الأساسي

    def __init__(self, config: ConfigManager):
        self.config = config
        self._init_client()

    def _init_client(self):
        """Initialize Gemini client with current API key."""
        if not GEMINI_AVAILABLE:
            self.model = None
            return

        key = self.config.get_current_gemini_key()
        if key:
            genai.configure(api_key=key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            print("❌ لا توجد مفاتيح Gemini مُعدّة!")
            self.model = None

    def _call_gemini(self, prompt: str, retry_count: int = 0) -> Optional[str]:
        """Call Gemini with automatic key rotation and exponential backoff on quota exceeded."""
        if not self.model:
            # محاولة إعادة التهيئة إذا لم يكن هناك موديل
            self._init_client()
            if not self.model:
                return None

        try:
            response = self.model.generate_content(prompt)
            return response.text

        except Exception as e:
            error_str = str(e).lower()
            
            # حساب وقت الانتظار الذكي (Exponential Backoff)
            # 5, 10, 20, 40, 80 ثانية مع إضافة عشوائية بسيطة (jitter)
            wait_time = (self.BASE_RETRY_DELAY * (2 ** retry_count)) + random.uniform(0, 2)

            # Rate limit / quota exceeded
            if any(x in error_str for x in ['quota', 'rate', 'limit', '429', 'resource_exhausted']):
                print(f"⚠️  مفتاح Gemini وصل للحد... جاري التبديل والانتظار {wait_time:.1f} ثانية")
                new_key = self.config.rotate_gemini_key()

                if new_key and retry_count < self.MAX_RETRIES:
                    genai.configure(api_key=new_key)
                    self.model = genai.GenerativeModel('gemini-1.5-flash')
                    time.sleep(wait_time)
                    return self._call_gemini(prompt, retry_count + 1)
                else:
                    print("❌ جميع مفاتيح Gemini وصلت للحد أو تجاوزت عدد المحاولات!")
                    return None

            elif retry_count < self.MAX_RETRIES:
                print(f"⚠️  خطأ Gemini: {e}. إعادة المحاولة {retry_count+2}/{self.MAX_RETRIES} بعد {wait_time:.1f} ثانية...")
                time.sleep(wait_time)
                return self._call_gemini(prompt, retry_count + 1)

            else:
                print(f"❌ فشل Gemini بعد {self.MAX_RETRIES} محاولات: {e}")
                return None

    def generate_ideas(self, count: int = 5, category: str = None) -> List[Dict]:
        """Generate trending YouTube Shorts ideas."""
        lang = self.config.get('script_language', 'ar')
        lang_name = "العربية" if lang == 'ar' else "English"
        cat_str = f"في مجال {category}" if category else "في مجالات متنوعة (تقنية، صحة، نجاح، معلومات)"

        prompt = f"""أنت خبير في محتوى YouTube Shorts.
توليد {count} أفكار ترند ل YouTube Shorts {cat_str}.
اللغة: {lang_name}

كل فكرة يجب أن:
- تحتوي على Hook قوي
- مناسبة لـ 30-60 ثانية
- تثير الفضول أو تقدم قيمة سريعة

أجب بـ JSON فقط:
{{
    "ideas": [
        {{
            "title": "عنوان الفكرة",
            "type": "نوع المحتوى",
            "hook": "الجملة الافتتاحية",
            "keywords": ["كلمة1", "كلمة2"]
        }}
    ]
}}"""

        response = self._call_gemini(prompt)
        if not response:
            return []

        try:
            json_str = self._extract_json(response)
            data = json.loads(json_str)
            return data.get('ideas', [])
        except Exception:
            # Fallback
            lines = [l.strip() for l in response.split('\n') if l.strip() and len(l) > 10]
            return [{"title": l, "type": "Trending", "hook": "", "keywords": []}
                    for l in lines[:count]]

    def generate_full_script(self, idea: str) -> Optional[Dict[str, Any]]:
        """Generate complete Shorts script with all YouTube metadata."""
        lang = self.config.get('script_language', 'ar')
        lang_name = "العربية" if lang == 'ar' else "English"

        prompt = f"""أنت كاتب محتوى محترف متخصص في YouTube Shorts.

الفكرة: {idea}
اللغة: {lang_name}

اكتب سكربت YouTube Short كامل (30-60 ثانية):
- يبدأ بـ Hook قوي في أول 3 ثواني
- معلومات مفيدة وجذابة
- ينتهي بـ Call to Action
- مناسب للتحويل الصوتي (بدون رموز)

أجب بـ JSON فقط:
{{
    "title": "عنوان قصير للفيديو",
    "yt_title": "عنوان YouTube مع إيموجي (max 100 حرف)",
    "script": "النص الكامل للتحويل الصوتي",
    "subtitle_lines": ["سطر 1", "سطر 2", "سطر 3"],
    "description": "وصف YouTube (200-300 حرف)",
    "hashtags": ["#هاشتاج1", "#هاشتاج2", "#هاشتاج3", "#shorts"],
    "tags": ["tag1", "tag2", "tag3"],
    "image_queries": ["english query 1", "english query 2", "english query 3"],
    "duration_estimate": "45s",
    "category": "نوع المحتوى"
}}"""

        response = self._call_gemini(prompt)
        if not response:
            return None

        try:
            json_str = self._extract_json(response)
            data = json.loads(json_str)

            # Ensure required fields
            if 'script' not in data: data['script'] = idea
            if 'title' not in data: data['title'] = idea[:50]
            if 'hashtags' not in data: data['hashtags'] = ["#shorts", "#youtube"]
            if 'image_queries' not in data: data['image_queries'] = [idea]

            return data

        except Exception as e:
            print(f"⚠️  خطأ في تحليل السكربت: {e}")
            return {
                "title": idea,
                "yt_title": f"🎯 {idea}",
                "script": response[:500] if response else idea,
                "subtitle_lines": [idea[:50]],
                "description": f"{idea} - محتوى مفيد",
                "hashtags": ["#shorts", "#youtube", "#DrCode"],
                "tags": ["shorts", "youtube", "drcode"],
                "image_queries": [idea, f"{idea} concept"],
                "duration_estimate": "45s",
                "category": "General"
            }

    def improve_script(self, script: str) -> Optional[str]:
        """Improve existing script."""
        prompt = f"""حسّن هذا السكربت لـ YouTube Shorts:

{script}

أعطني السكربت المحسّن فقط."""
        return self._call_gemini(prompt)

    def generate_title_variations(self, base_title: str, count: int = 5) -> List[str]:
        """Generate title variations."""
        prompt = f"""اقترح {count} عناوين بديلة لـ YouTube Short عن: {base_title}
كل عنوان في سطر منفصل فقط."""
        response = self._call_gemini(prompt)
        if not response:
            return [base_title]
        return [l.strip() for l in response.split('\n') if l.strip() and len(l.strip()) > 5][:count]

    def _extract_json(self, text: str) -> str:
        """Extract JSON from text."""
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json_match.group()
        text = re.sub(r'```json\s*', '', text)
        text = re.sub(r'```\s*', '', text)
        return text.strip()

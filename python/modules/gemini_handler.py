#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
modules/gemini_handler.py
التواصل مع n8n Webhook أو Google Gemini API لتوليد الأفكار والسكربتات
"""

import json
import time
import re
import requests
from typing import Optional, List, Dict, Any

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

from .config_manager import ConfigManager


class GeminiHandler:
    """Handles interactions with n8n Webhook or Google Gemini AI API."""

    def __init__(self, config: ConfigManager):
        self.config = config
        self._init_client()

    def _init_client(self):
        """Initialize Gemini client if not using n8n."""
        if self.config.get('use_n8n'):
            self.model = "n8n"
            return

        if not GEMINI_AVAILABLE:
            self.model = None
            return

        key = self.config.get_current_gemini_key()
        if key:
            genai.configure(api_key=key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None

    def _call_webhook(self, payload: Dict[str, Any]) -> Optional[str]:
        """Call n8n Webhook and return response text."""
        url = self.config.get('n8n_webhook_url')
        if not url:
            print("❌ رابط n8n Webhook غير مُعد!")
            return None
        
        try:
            response = requests.post(url, json=payload, timeout=60)
            response.raise_for_status()
            # n8n might return JSON directly or a string
            try:
                data = response.json()
                if isinstance(data, (dict, list)):
                    return json.dumps(data)
            except:
                pass
            return response.text
        except Exception as e:
            print(f"❌ خطأ في الاتصال بـ n8n: {e}")
            return None

    def _call_gemini(self, prompt: str, retry_count: int = 0) -> Optional[str]:
        """Call Gemini or n8n Webhook."""
        if self.config.get('use_n8n'):
            return self._call_webhook({"prompt": prompt, "type": "gemini_request"})

        if not self.model or self.model == "n8n":
            return None

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            error_str = str(e).lower()
            if any(x in error_str for x in ['quota', 'rate', 'limit', '429']) and retry_count < 3:
                print(f"⚠️  مفتاح Gemini وصل للحد... جاري التبديل")
                new_key = self.config.rotate_gemini_key()
                if new_key:
                    genai.configure(api_key=new_key)
                    self.model = genai.GenerativeModel('gemini-1.5-flash')
                    time.sleep(2)
                    return self._call_gemini(prompt, retry_count + 1)
            return None

    def generate_ideas(self, count: int = 5, category: str = None) -> List[Dict]:
        """Generate trending YouTube Shorts ideas."""
        lang = self.config.get('script_language', 'ar')
        lang_name = "العربية" if lang == 'ar' else "English"
        cat_str = f"في مجال {category}" if category else "في مجالات متنوعة"

        prompt = f"توليد {count} أفكار ترند ل YouTube Shorts {cat_str} باللغة {lang_name}. أجب بـ JSON فقط يحتوي على قائمة ideas."

        response = self._call_gemini(prompt)
        if not response:
            return []

        try:
            json_str = self._extract_json(response)
            data = json.loads(json_str)
            if isinstance(data, list): return data[:count]
            return data.get('ideas', [])[:count]
        except Exception:
            return []

    def generate_full_script(self, idea: str) -> Optional[Dict[str, Any]]:
        """Generate complete Shorts script."""
        lang = self.config.get('script_language', 'ar')
        lang_name = "العربية" if lang == 'ar' else "English"

        prompt = f"اكتب سكربت YouTube Short كامل للفكرة: {idea} باللغة {lang_name}. أجب بـ JSON فقط يحتوي على title, script, subtitle_lines, description, hashtags, image_queries."

        response = self._call_gemini(prompt)
        if not response:
            return None

        try:
            json_str = self._extract_json(response)
            data = json.loads(json_str)
            return data
        except Exception:
            return None

    def _extract_json(self, text: str) -> str:
        """Extract JSON from text."""
        json_match = re.search(r'\{.*\}|\[.*\]', text, re.DOTALL)
        if json_match:
            return json_match.group()
        return text.strip()

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
modules/tts_handler.py
تحويل النص إلى صوت عربي باستخدام Masry Vox API
"""

import os
import re
import time
import hashlib
import requests
from pathlib import Path
from typing import Optional

from .config_manager import ConfigManager


TTS_API_URL = "https://masry-vox-drcode.vercel.app/api/tts"

AVAILABLE_VOICES = {
    "Puck":   "صوت ذكوري طبيعي (افتراضي)",
    "Charon": "صوت ذكوري عميق",
    "Kore":   "صوت أنثوي ناعم",
    "Fenrir": "صوت ذكوري قوي",
    "Aoede":  "صوت أنثوي جذاب"
}

AVAILABLE_STYLES = {
    "balanced":   "متوازن (افتراضي)",
    "expressive": "تعبيري وحيوي",
    "calm":       "هادئ ورزين",
    "energetic":  "نشط وسريع"
}


class TTSHandler:
    """Handles Text-to-Speech via Masry Vox API."""

    MAX_RETRIES = 3
    RETRY_DELAY = 3
    TIMEOUT = 60
    MAX_TEXT_LENGTH = 3000

    def __init__(self, config: ConfigManager):
        self.config = config
        self.api_key = config.get('tts_api_key', '')
        self.voice = config.get('tts_voice', 'Puck')
        self.style = config.get('tts_style', 'balanced')
        self.temp_dir = config.get_temp_dir()

    def convert_to_speech(
        self,
        text: str,
        voice: Optional[str] = None,
        style: Optional[str] = None,
        output_path: Optional[str] = None
    ) -> Optional[str]:
        """
        Convert text to speech MP3.

        Args:
            text: Arabic text to convert
            voice: Voice name (Puck, Charon, Kore, Fenrir, Aoede)
            style: Style (balanced, expressive, calm, energetic)
            output_path: Save path for audio file

        Returns:
            Path to MP3 file or None
        """
        if not self.api_key:
            print("❌ مفتاح TTS API غير محدد!")
            return None

        if not text or not text.strip():
            print("❌ النص فارغ!")
            return None

        clean_text = self._clean_text(text)

        if len(clean_text) > self.MAX_TEXT_LENGTH:
            print(f"⚠️  النص طويل ({len(clean_text)} حرف) → اقتطاع")
            clean_text = clean_text[:self.MAX_TEXT_LENGTH]

        use_voice = voice or self.voice
        use_style = style or self.style

        if not output_path:
            hash_str = hashlib.md5(clean_text[:50].encode()).hexdigest()[:8]
            timestamp = int(time.time())
            output_path = str(self.temp_dir / f"audio_{timestamp}_{hash_str}.mp3")

        for attempt in range(self.MAX_RETRIES):
            audio_data = self._make_request(clean_text, use_voice, use_style)

            if audio_data:
                try:
                    with open(output_path, 'wb') as f:
                        f.write(audio_data)

                    if os.path.getsize(output_path) > 100:
                        size_kb = os.path.getsize(output_path) / 1024
                        print(f"✅ الصوت جاهز ({size_kb:.0f} KB): {output_path}")
                        return output_path
                    else:
                        os.remove(output_path)

                except IOError as e:
                    print(f"❌ فشل حفظ الصوت: {e}")
                    return None

            if attempt < self.MAX_RETRIES - 1:
                wait = self.RETRY_DELAY * (attempt + 1)
                print(f"⚠️  إعادة المحاولة {attempt+2}/{self.MAX_RETRIES} بعد {wait}ث...")
                time.sleep(wait)

        print("❌ فشل تحويل النص إلى صوت!")
        return None

    def _make_request(self, text: str, voice: str, style: str) -> Optional[bytes]:
        """Make TTS API request."""
        headers = {
            'Content-Type': 'application/json',
            'X-API-Key': self.api_key
        }

        payload = {
            "text": text,
            "voice": voice,
            "style": style,
            "apiKey": self.api_key
        }

        try:
            response = requests.post(
                TTS_API_URL,
                json=payload,
                headers=headers,
                timeout=self.TIMEOUT
            )

            if response.status_code == 200:
                content_type = response.headers.get('Content-Type', '')
                if 'audio' in content_type or 'octet-stream' in content_type or len(response.content) > 100:
                    return response.content
                else:
                    print(f"⚠️  استجابة غير متوقعة: {response.text[:200]}")
                    return None

            elif response.status_code == 401:
                print("❌ مفتاح TTS غير صحيح!")
                return None
            elif response.status_code == 429:
                print("⚠️  تم تجاوز حد TTS API")
                return None
            else:
                print(f"⚠️  TTS API خطأ {response.status_code}")
                return None

        except requests.Timeout:
            print(f"⚠️  انتهت مهلة TTS ({self.TIMEOUT}s)")
            return None
        except requests.ConnectionError:
            print("⚠️  لا يمكن الاتصال بـ TTS API")
            return None
        except Exception as e:
            print(f"⚠️  خطأ TTS: {e}")
            return None

    def _clean_text(self, text: str) -> str:
        """Clean text for TTS."""
        text = re.sub(r'[*#\[\]{}\|<>]', '', text)
        text = re.sub(r'http\S+', '', text)
        # Remove emojis
        emoji_pattern = re.compile(
            "[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF"
            "\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF]+",
            flags=re.UNICODE
        )
        text = emoji_pattern.sub('', text)
        text = ' '.join(text.split())
        return text.strip()

    def get_audio_duration(self, audio_path: str) -> float:
        """Get audio duration in seconds."""
        try:
            from mutagen.mp3 import MP3
            return MP3(audio_path).info.length
        except ImportError:
            try:
                size_kb = os.path.getsize(audio_path) / 1024
                return size_kb / 16  # Rough estimate
            except:
                return 45.0

    @staticmethod
    def list_voices() -> dict:
        return AVAILABLE_VOICES

    @staticmethod
    def list_styles() -> dict:
        return AVAILABLE_STYLES

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
modules/config_manager.py
إدارة إعدادات الأداة ومفاتيح API مع دعم التدوير التلقائي
"""

import json
from pathlib import Path
from typing import Any, List, Optional


CONFIG_FILE = "config.json"

DEFAULT_CONFIG = {
    "first_run": True,
    "gemini_api_keys": [],
    "gemini_key_index": 0,
    "gemini_key_failures": {},
    "pexels_api_key": "",
    "tts_api_key": "",
    "tts_voice": "Puck",
    "tts_style": "balanced",
    "youtube_credentials_path": "credentials.json",
    "youtube_token_path": "youtube_token.json",
    "youtube_enabled": False,
    "video_quality": "720p",
    "script_language": "ar",
    "output_dir": "output/",
    "temp_dir": "temp/",
    "assets_dir": "assets/",
    "max_images": 8,
    "image_duration": 3.5,
    "fps": 30,
    "version": "1.0.0"
}


class ConfigManager:
    """Manages configuration and API key rotation."""

    def __init__(self, config_file: str = CONFIG_FILE):
        self.config_file = Path(config_file)
        self._config = {}
        self.load()

    def load(self):
        """Load config from file, creating defaults if not exists."""
        if self.config_file.exists():
            try:
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    self._config = json.load(f)
                for key, val in DEFAULT_CONFIG.items():
                    if key not in self._config:
                        self._config[key] = val
            except (json.JSONDecodeError, IOError):
                self._config = DEFAULT_CONFIG.copy()
        else:
            self._config = DEFAULT_CONFIG.copy()

    def save(self):
        """Save config to file."""
        try:
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(self._config, f, ensure_ascii=False, indent=2)
        except IOError as e:
            print(f"⚠️  فشل حفظ الإعدادات: {e}")

    def get(self, key: str, default: Any = None) -> Any:
        return self._config.get(key, default)

    def set(self, key: str, value: Any):
        self._config[key] = value

    # ── Gemini Key Management ────────────────────────────────

    def get_gemini_keys(self) -> List[str]:
        return self._config.get('gemini_api_keys', [])

    def get_current_gemini_key(self) -> Optional[str]:
        keys = self.get_gemini_keys()
        if not keys:
            return None
        idx = self._config.get('gemini_key_index', 0) % len(keys)
        return keys[idx]

    def rotate_gemini_key(self) -> Optional[str]:
        """
        Rotate to next Gemini key when current one hits rate limit.
        Returns new key or None if all exhausted.
        """
        keys = self.get_gemini_keys()
        if len(keys) <= 1:
            return None

        current_idx = self._config.get('gemini_key_index', 0)
        failures = self._config.get('gemini_key_failures', {})
        failures[str(current_idx)] = failures.get(str(current_idx), 0) + 1
        self._config['gemini_key_failures'] = failures

        for i in range(1, len(keys)):
            next_idx = (current_idx + i) % len(keys)
            if failures.get(str(next_idx), 0) < 3:
                self._config['gemini_key_index'] = next_idx
                self.save()
                print(f"🔄 تبديل إلى مفتاح Gemini #{next_idx + 1}")
                return keys[next_idx]

        # Reset and try again
        self._config['gemini_key_failures'] = {}
        self._config['gemini_key_index'] = (current_idx + 1) % len(keys)
        self.save()
        return keys[self._config['gemini_key_index']]

    def reset_gemini_failures(self):
        self._config['gemini_key_failures'] = {}
        self.save()

    def add_gemini_key(self, key: str):
        keys = self.get_gemini_keys()
        if key not in keys:
            keys.append(key)
            self._config['gemini_api_keys'] = keys

    def remove_gemini_key(self, index: int):
        keys = self.get_gemini_keys()
        if 0 <= index < len(keys):
            keys.pop(index)
            self._config['gemini_api_keys'] = keys
            if self._config.get('gemini_key_index', 0) >= len(keys):
                self._config['gemini_key_index'] = max(0, len(keys) - 1)

    def get_gemini_key_status(self) -> dict:
        keys = self.get_gemini_keys()
        failures = self._config.get('gemini_key_failures', {})
        current_idx = self._config.get('gemini_key_index', 0)
        status = []
        for i, key in enumerate(keys):
            status.append({
                'index': i,
                'key_preview': key[:8] + '...' + key[-4:] if len(key) > 12 else '***',
                'is_current': i == current_idx,
                'failures': failures.get(str(i), 0)
            })
        return {'keys': status, 'total': len(keys), 'current': current_idx}

    # ── Paths ─────────────────────────────────────────────────

    def get_output_dir(self) -> Path:
        path = Path(self.get('output_dir', 'output/'))
        path.mkdir(parents=True, exist_ok=True)
        return path

    def get_temp_dir(self) -> Path:
        path = Path(self.get('temp_dir', 'temp/'))
        path.mkdir(parents=True, exist_ok=True)
        return path

    def get_assets_dir(self) -> Path:
        return Path(self.get('assets_dir', 'assets/'))

    def __repr__(self):
        return f"ConfigManager(gemini_keys={len(self.get_gemini_keys())}, quality={self.get('video_quality')})"

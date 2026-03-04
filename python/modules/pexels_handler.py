#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
modules/pexels_handler.py
البحث عن صور HD من Pexels وتحميلها للفيديو
"""

import os
import time
import requests
from pathlib import Path
from typing import List, Optional, Dict, Any

from .config_manager import ConfigManager


PEXELS_API_URL = "https://api.pexels.com/v1"


class PexelsHandler:
    """Search and download images from Pexels API."""

    TIMEOUT = 30
    DOWNLOAD_TIMEOUT = 60

    def __init__(self, config: ConfigManager):
        self.config = config
        self.api_key = config.get('pexels_api_key', '')
        self.temp_dir = config.get_temp_dir()

        if not self.api_key:
            print("⚠️  مفتاح Pexels API غير محدد!")

    def search_photos(
        self,
        query: str,
        per_page: int = 15,
        orientation: str = "portrait"
    ) -> List[Dict[str, Any]]:
        """
        Search photos on Pexels.

        Args:
            query: Search query (English preferred)
            per_page: Number of results
            orientation: portrait | landscape | square

        Returns:
            List of photo dicts
        """
        if not self.api_key:
            return []

        headers = {'Authorization': self.api_key}
        params = {
            'query': query,
            'per_page': per_page,
            'orientation': orientation,
            'size': 'large'
        }

        try:
            response = requests.get(
                f"{PEXELS_API_URL}/search",
                headers=headers,
                params=params,
                timeout=self.TIMEOUT
            )

            if response.status_code == 200:
                photos = response.json().get('photos', [])
                print(f"  🔍 '{query}': {len(photos)} صورة")
                return photos
            elif response.status_code == 401:
                print("❌ مفتاح Pexels غير صحيح!")
            elif response.status_code == 429:
                print("⚠️  حد Pexels تم تجاوزه")
            else:
                print(f"⚠️  Pexels خطأ {response.status_code}")

        except requests.Timeout:
            print("⚠️  انتهت مهلة Pexels")
        except Exception as e:
            print(f"⚠️  خطأ Pexels: {e}")

        return []

    def download_photo(self, photo: Dict, index: int) -> Optional[str]:
        """Download single photo."""
        src = photo.get('src', {})

        # Best URL for 9:16 portrait format
        url = (src.get('portrait') or
               src.get('large2x') or
               src.get('large') or
               src.get('medium') or
               src.get('original'))

        if not url:
            return None

        photo_id = photo.get('id', index)
        output_path = self.temp_dir / f"img_{photo_id}_{index:02d}.jpg"

        if output_path.exists() and output_path.stat().st_size > 1000:
            return str(output_path)

        try:
            response = requests.get(url, timeout=self.DOWNLOAD_TIMEOUT, stream=True)
            if response.status_code == 200:
                with open(output_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)

                if output_path.stat().st_size > 1000:
                    return str(output_path)
                else:
                    output_path.unlink(missing_ok=True)

        except Exception as e:
            print(f"  ⚠️  فشل تحميل الصورة {index}: {e}")

        return None

    def search_and_download(
        self,
        queries: List[str],
        count: int = 8
    ) -> List[str]:
        """
        Search multiple queries and download best photos.

        Args:
            queries: List of English search queries
            count: Total images needed

        Returns:
            List of downloaded image paths
        """
        all_photos = []
        seen_ids = set()

        photos_per_query = max(3, (count + 2) // max(1, len(queries)))

        for query in queries:
            photos = self.search_photos(query, per_page=photos_per_query + 5)
            for photo in photos:
                if photo.get('id') not in seen_ids:
                    seen_ids.add(photo.get('id'))
                    all_photos.append(photo)
            if len(all_photos) >= count * 2:
                break

        # Fallback if not enough photos
        if len(all_photos) < count:
            for fallback in ["technology abstract", "modern design", "digital concept"]:
                photos = self.search_photos(fallback, per_page=count)
                for photo in photos:
                    if photo.get('id') not in seen_ids:
                        seen_ids.add(photo.get('id'))
                        all_photos.append(photo)
                if len(all_photos) >= count:
                    break

        # Download
        downloaded = []
        target = min(count, len(all_photos))
        print(f"  ⬇️  تحميل {target} صورة...")

        for i, photo in enumerate(all_photos[:target]):
            path = self.download_photo(photo, i)
            if path:
                downloaded.append(path)
                print(f"  ✓ {len(downloaded)}/{target}")
            if len(downloaded) >= count:
                break
            time.sleep(0.2)

        print(f"  ✅ تم تحميل {len(downloaded)} صورة")
        return downloaded

    def is_configured(self) -> bool:
        return bool(self.api_key)

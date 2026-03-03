#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
modules/video_maker.py
تركيب فيديو YouTube Shorts بتنسيق 9:16 باستخدام MoviePy
مع Ken Burns Effect وNصوص متحركة وWatermark
"""

import os
import time
from pathlib import Path
from typing import List, Optional

try:
    from moviepy.editor import (
        ImageClip, AudioFileClip, CompositeVideoClip,
        concatenate_videoclips, TextClip, ColorClip
    )
    from moviepy.video.fx.all import fadein, fadeout
    MOVIEPY_AVAILABLE = True
except ImportError:
    MOVIEPY_AVAILABLE = False
    print("⚠️  قم بتثبيت: pip install moviepy")

try:
    from PIL import Image, ImageEnhance
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

from .config_manager import ConfigManager


QUALITY_PRESETS = {
    "480p":  {"width": 480,  "height": 854,  "bitrate": "1000k"},
    "720p":  {"width": 720,  "height": 1280, "bitrate": "2500k"},
    "1080p": {"width": 1080, "height": 1920, "bitrate": "5000k"},
}


class VideoMaker:
    """Creates YouTube Shorts videos (9:16 vertical) using MoviePy."""

    def __init__(self, config: ConfigManager):
        self.config = config
        self.temp_dir = config.get_temp_dir()
        self.output_dir = config.get_output_dir()

        quality_key = config.get('video_quality', '720p')
        self.quality = QUALITY_PRESETS.get(quality_key, QUALITY_PRESETS['720p'])
        self.width = self.quality['width']
        self.height = self.quality['height']
        self.fps = config.get('fps', 30)
        self.font_path = self._find_font()

    def create_shorts_video(
        self,
        images: List[str],
        audio_path: str,
        title: str = "",
        subtitle_lines: List[str] = None,
        output_filename: Optional[str] = None
    ) -> Optional[str]:
        """
        Create complete YouTube Shorts video.

        Args:
            images: List of image paths
            audio_path: MP3 audio file path
            title: Title for overlay text
            subtitle_lines: Text lines for lower third
            output_filename: Custom output filename

        Returns:
            Path to output MP4 or None
        """
        if not MOVIEPY_AVAILABLE:
            print("❌ MoviePy غير متاح!")
            return None

        if not images:
            print("❌ لا توجد صور!")
            return None

        if not os.path.exists(audio_path):
            print(f"❌ الصوت غير موجود: {audio_path}")
            return None

        try:
            print("  🎬 بدء التركيب...")

            # Load audio
            audio_clip = AudioFileClip(audio_path)
            total_duration = audio_clip.duration
            print(f"  ⏱  مدة الصوت: {total_duration:.1f}ث")

            # Image duration
            img_duration = total_duration / len(images)
            img_duration = max(2.0, min(6.0, img_duration))
            print(f"  🖼  {len(images)} صورة × {img_duration:.1f}ث")

            # Create clips
            clips = []
            for i, img_path in enumerate(images):
                clip = self._make_image_clip(img_path, img_duration, i)
                if clip:
                    clips.append(clip)
                    print(f"  ✓ معالجة صورة {i+1}/{len(images)}")

            if not clips:
                print("❌ فشل إنشاء المقاطع!")
                return None

            # Concatenate
            print("  🔗 دمج المقاطع...")
            video = concatenate_videoclips(clips, method="compose")

            # Trim to audio length
            if video.duration > total_duration:
                video = video.subclip(0, total_duration)

            # Add text overlay
            if subtitle_lines or title:
                print("  📝 إضافة النصوص...")
                video = self._add_text_overlay(video, title, subtitle_lines or [], total_duration)

            # Add watermark
            video = self._add_watermark(video)

            # Set audio
            video = video.set_audio(audio_clip)

            # Generate filename
            if not output_filename:
                timestamp = int(time.time())
                safe = "".join(c for c in title[:25] if c.isalnum() or c in ' _-')
                safe = safe.strip().replace(' ', '_') or 'shorts'
                output_filename = f"shorts_{timestamp}_{safe}.mp4"

            output_path = str(self.output_dir / output_filename)

            # Export
            print(f"  💾 تصدير ({self.quality['bitrate']})...")
            video.write_videofile(
                output_path,
                fps=self.fps,
                codec='libx264',
                audio_codec='aac',
                bitrate=self.quality['bitrate'],
                audio_bitrate='192k',
                preset='medium',
                logger=None,
                verbose=False
            )

            # Cleanup
            audio_clip.close()
            video.close()
            for c in clips:
                try: c.close()
                except: pass

            if os.path.exists(output_path):
                size_mb = os.path.getsize(output_path) / (1024*1024)
                print(f"✅ الفيديو جاهز: {output_path} ({size_mb:.1f} MB)")
                return output_path

        except Exception as e:
            print(f"❌ خطأ في تركيب الفيديو: {e}")
            import traceback
            traceback.print_exc()

        return None

    def _make_image_clip(self, img_path: str, duration: float, index: int):
        """Create image clip with Ken Burns effect and color grading."""
        try:
            if PIL_AVAILABLE:
                img = Image.open(img_path).convert('RGB')
                img = self._fit_portrait(img)
                img = self._color_grade(img)
                processed = str(self.temp_dir / f"proc_{index:02d}.jpg")
                img.save(processed, 'JPEG', quality=95)
                img_path = processed

            clip = ImageClip(img_path, duration=duration)
            clip = clip.resize((self.width, self.height))

            # Ken Burns zoom effect
            def zoom(t):
                return 1 + 0.04 * (t / duration)

            clip = clip.fl_time(lambda t: t).resize(zoom)
            clip = fadein(clip, 0.4)
            clip = fadeout(clip, 0.4)

            return clip

        except Exception as e:
            print(f"  ⚠️  فشل صورة {index}: {e}")
            try:
                clip = ImageClip(img_path, duration=duration)
                return clip.resize((self.width, self.height))
            except:
                return None

    def _fit_portrait(self, img):
        """Crop image to 9:16 portrait ratio."""
        target_ratio = self.width / self.height
        img_ratio = img.width / img.height

        if img_ratio > target_ratio:
            new_w = int(img.height * target_ratio)
            left = (img.width - new_w) // 2
            img = img.crop((left, 0, left + new_w, img.height))
        else:
            new_h = int(img.width / target_ratio)
            top = (img.height - new_h) // 3
            img = img.crop((0, top, img.width, top + new_h))

        return img.resize((self.width, self.height), Image.LANCZOS)

    def _color_grade(self, img):
        """Apply subtle color grading."""
        try:
            img = ImageEnhance.Brightness(img).enhance(1.05)
            img = ImageEnhance.Contrast(img).enhance(1.1)
            img = ImageEnhance.Color(img).enhance(1.15)
        except Exception:
            pass
        return img

    def _add_text_overlay(self, video, title: str, lines: List[str], duration: float):
        """Add title and subtitle text overlays."""
        text_clips = [video]

        # Title at top
        if title:
            try:
                title_bg = (ColorClip(size=(self.width, 110), color=(0, 0, 0), duration=3)
                            .set_opacity(0.65)
                            .set_position(('center', 40)))
                text_clips.append(title_bg)

                t_clip = (TextClip(
                    title[:50],
                    fontsize=42, color='white',
                    font=self.font_path or 'Arial',
                    method='caption',
                    size=(self.width - 40, None),
                    align='center'
                ).set_duration(3).set_position(('center', 55))
                 .fadein(0.3).fadeout(0.5))
                text_clips.append(t_clip)
            except Exception:
                pass

        # Subtitle lines (lower third)
        if lines:
            n = len(lines)
            for i, line in enumerate(lines[:4]):
                if not line.strip(): continue
                line_dur = duration / n
                line_start = i * line_dur
                y_pos = self.height - 320 + i * 65

                try:
                    bg = (ColorClip(size=(self.width, 58), color=(15, 15, 15), duration=line_dur)
                          .set_opacity(0.72)
                          .set_position(('center', y_pos))
                          .set_start(line_start))
                    text_clips.append(bg)

                    lc = (TextClip(
                        line[:55],
                        fontsize=40, color='white',
                        font=self.font_path or 'Arial',
                        method='caption',
                        size=(self.width - 60, None),
                        align='center'
                    ).set_duration(line_dur)
                     .set_start(line_start)
                     .set_position(('center', y_pos + 5))
                     .fadein(0.2).fadeout(0.3))
                    text_clips.append(lc)
                except Exception:
                    pass

        if len(text_clips) > 1:
            return CompositeVideoClip(text_clips)
        return video

    def _add_watermark(self, video):
        """Add subtle DrCode watermark."""
        try:
            wm = (TextClip("DrCode", fontsize=26, color='white',
                           font=self.font_path or 'Arial')
                  .set_opacity(0.35)
                  .set_duration(video.duration)
                  .set_position((25, 45)))
            return CompositeVideoClip([video, wm])
        except Exception:
            return video

    def _find_font(self) -> Optional[str]:
        """Find Arabic-compatible font."""
        candidates = [
            "assets/fonts/Cairo-Regular.ttf",
            "assets/fonts/Amiri-Regular.ttf",
            "C:/Windows/Fonts/arial.ttf",
            "/System/Library/Fonts/Arial.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        ]
        for path in candidates:
            if os.path.exists(path):
                return path
        return None

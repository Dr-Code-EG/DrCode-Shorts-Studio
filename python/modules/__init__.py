#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DrCode Shorts Studio - Modules Package
YouTube Shorts Automation Tool by Dr Code
"""

__version__ = "1.0.0"
__author__ = "Dr Code"
__description__ = "YouTube Shorts Automation Tool powered by Gemini AI"

from .config_manager import ConfigManager
from .gemini_handler import GeminiHandler
from .tts_handler import TTSHandler
from .pexels_handler import PexelsHandler
from .video_maker import VideoMaker
from .youtube_uploader import YouTubeUploader
from .progress_tracker import ProgressTracker

__all__ = [
    "ConfigManager",
    "GeminiHandler",
    "TTSHandler",
    "PexelsHandler",
    "VideoMaker",
    "YouTubeUploader",
    "ProgressTracker",
]

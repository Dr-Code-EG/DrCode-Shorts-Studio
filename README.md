# DrCode Shorts Studio — Documentation Website

## 📋 About
This is the **official documentation and showcase website** for **DrCode Shorts Studio** — a complete Python tool for automatically producing YouTube Shorts using AI.

## 🌐 Live URL
Available via the Publish tab.

## ✅ Implemented Features

### Website Pages
- **Hero Section** — animated terminal demo, stats, CTAs
- **Features Section** — 9 feature cards with animations
- **How It Works** — 6-step pipeline visualization
- **Project Structure** — file tree + tech stack
- **Installation Guide** — step-by-step setup
- **Download Section** — 8 module cards linking to code
- **Code Viewer** — tabbed code display for all 10 files
- **GitHub Section** — project links
- **Responsive Design** — mobile-friendly

### Python Tool Files (in /python/)
- `main.py` — Main entry point, full CLI interface
- `modules/config_manager.py` — Config + multi-key Gemini rotation
- `modules/gemini_handler.py` — Gemini AI ideas & script generation
- `modules/tts_handler.py` — Text-to-Speech via Masry Vox API
- `modules/pexels_handler.py` — Image search & download from Pexels
- `modules/video_maker.py` — Video composition with MoviePy
- `modules/youtube_uploader.py` — YouTube Data API v3 upload
- `modules/progress_tracker.py` — Rich terminal progress display
- `requirements.txt` — All dependencies
- `README.md` — Full documentation
- `.gitignore` — Git ignore rules

## 📁 File Structure
```
index.html          — Main website
css/style.css       — Full styling (dark theme)
js/main.js          — Animations, terminal, tabs
js/codes.js         — All Python source codes
python/             — Ready-to-use Python files
  main.py
  modules/
  requirements.txt
  README.md
  .gitignore
```

## 🛠️ Tech Stack (Website)
- HTML5 + CSS3 (Custom dark theme)
- Vanilla JavaScript
- Google Fonts (Cairo)
- Font Awesome 6

## 🛠️ Tech Stack (Python Tool)
- Google Gemini AI (idea + script generation)
- Masry Vox API (Arabic TTS)
- Pexels API (image search)
- MoviePy (video composition)
- YouTube Data API v3 (publishing)
- Rich (terminal UI)

## 🚀 Next Steps
- Add download buttons that generate zip files
- Add video preview examples
- Add FAQ section
- Arabic/English language toggle

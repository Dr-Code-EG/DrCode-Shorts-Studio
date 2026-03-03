# 🎬 DrCode Shorts Studio

<div align="center">

![DrCode Shorts Studio](https://img.shields.io/badge/DrCode-Shorts%20Studio-667eea?style=for-the-badge&logo=youtube&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.8+-3776ab?style=for-the-badge&logo=python&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini-AI%20Powered-4285F4?style=for-the-badge&logo=google&logoColor=white)
![License MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge)

**نظام متكامل لإنتاج YouTube Shorts تلقائياً بالذكاء الاصطناعي**

*من الفكرة إلى الفيديو الجاهز للنشر في دقائق*

[⬇️ التثبيت](#-التثبيت) • [🚀 الاستخدام](#-الاستخدام) • [🔑 الإعداد](#-الإعداد) • [📖 التوثيق](#-التوثيق)

</div>

---

## ✨ المميزات

| المميزة | التقنية | الوصف |
|---------|---------|--------|
| 🤖 **توليد الأفكار** | Gemini AI | أفكار ترند تلقائية أو يدوية |
| 📝 **سكربت احترافي** | Gemini AI | نص 30-60 ثانية مع Hook قوي |
| 🎤 **تحويل نص لصوت** | Masry Vox TTS | صوت عربي طبيعي متعدد الأنماط |
| 🖼️ **بحث عن الصور** | Pexels API | صور HD مناسبة للموضوع |
| 🎬 **تركيب الفيديو** | MoviePy | فيديو 9:16 مع Ken Burns + نصوص |
| 🚀 **نشر على YouTube** | YouTube API v3 | رفع مباشر مع عنوان ووصف |
| 🔑 **تبديل المفاتيح** | Auto Rotation | تبديل تلقائي عند انتهاء حد Gemini |
| 📊 **شريط التقدم** | Rich | عرض تفصيلي لكل خطوة |

---

## 🏗️ هيكل المشروع

```
DrCode-Shorts-Studio/
├── 📄 main.py                     # نقطة الدخول الرئيسية
├── 📁 modules/
│   ├── 🔧 __init__.py
│   ├── ⚙️  config_manager.py      # إدارة الإعدادات + API Keys
│   ├── 🧠 gemini_handler.py       # Gemini AI - الأفكار والسكربتات
│   ├── 🎤 tts_handler.py          # تحويل النص إلى صوت
│   ├── 🖼️  pexels_handler.py      # البحث عن الصور وتحميلها
│   ├── 🎬 video_maker.py          # تركيب الفيديو بـ MoviePy
│   ├── 📤 youtube_uploader.py     # النشر على YouTube
│   └── 📊 progress_tracker.py    # عرض التقدم
├── 📁 output/                     # الفيديوهات المنتجة (تُنشأ تلقائياً)
├── 📁 temp/                       # ملفات مؤقتة (تُنشأ تلقائياً)
├── 📁 assets/
│   └── 📁 fonts/                  # ملفات الخطوط (اختياري)
├── 📋 requirements.txt
├── 📖 README.md
├── 🙈 .gitignore
└── 🔒 config.json                 # يُنشأ تلقائياً في أول تشغيل
```

---

## 🚀 التثبيت

### المتطلبات المسبقة

- **Python 3.8+** — [تحميل](https://python.org)
- **FFmpeg** — [تحميل](https://ffmpeg.org/download.html)
  ```bash
  # Windows
  winget install FFmpeg
  # macOS
  brew install ffmpeg
  # Ubuntu/Debian
  sudo apt install ffmpeg
  ```

### خطوات التثبيت

```bash
# 1. استنساخ المستودع
git clone https://github.com/drcode-ai/drcode-shorts-studio.git
cd drcode-shorts-studio

# 2. تثبيت المكتبات (يُنصح ببيئة افتراضية)
pip install -r requirements.txt

# 3. تشغيل الأداة
python main.py
```

> **💡 نصيحة:** استخدم بيئة افتراضية لتجنب تعارض المكتبات:
> ```bash
> python -m venv venv
> source venv/bin/activate  # Linux/Mac
> venv\Scripts\activate     # Windows
> pip install -r requirements.txt
> ```

---

## ⚙️ الإعداد

### الحصول على API Keys

| المفتاح | الرابط | مجاني؟ | ملاحظات |
|---------|--------|---------|---------|
| **Gemini API** | [Google AI Studio](https://makersuite.google.com/app/apikey) | ✅ مجاني | أضف عدة مفاتيح |
| **Pexels API** | [Pexels Developers](https://www.pexels.com/api/) | ✅ مجاني | حد 200 طلب/ساعة |
| **TTS API** | Masry Vox DrCode | 💰 مدفوع | تواصل مع Dr Code |
| **YouTube API** | [Google Cloud](https://console.cloud.google.com) | ✅ مجاني | للنشر التلقائي |

### إعداد YouTube API (اختياري)

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com)
2. أنشئ مشروعاً جديداً
3. فعّل **YouTube Data API v3**
4. أنشئ **OAuth 2.0 Client ID** (نوع: Desktop Application)
5. حمّل ملف `credentials.json`
6. ضعه في مجلد المشروع

---

## 📖 الاستخدام

### التشغيل الأول

```bash
python main.py
```

ستظهر رسالة ترحيب وطلب إدخال المفاتيح:

```
╔══════════════════════════════════════════╗
║    🎉 مرحباً في DrCode Shorts Studio!   ║
╚══════════════════════════════════════════╝

1. مفاتيح Gemini API
   مفتاح Gemini #1: ****
   مفتاح Gemini #2: ****  ← أضف أكثر من مفتاح!
   مفتاح Gemini #3: (Enter للإنهاء)

2. مفتاح Pexels API: ****

3. مفتاح TTS API: ****
```

### القائمة الرئيسية

```
╔═══════════════════════════════════════╗
║         القائمة الرئيسية              ║
╠═══════════════════════════════════════╣
║ [1]  🤖  توليد فكرة تلقائياً         ║
║ [2]  ✍️   إدخال فكرة يدوياً           ║
║ [3]  ⚙️   الإعدادات                   ║
║ [4]  🔑  إدارة API Keys               ║
║ [5]  📂  عرض الفيديوهات المنتجة       ║
║ [6]  🚪  خروج                         ║
╚═══════════════════════════════════════╝
```

### مراحل الإنتاج

```
[1/5] 📝 توليد السكربت      [████████░░░░░░░░░░░░] 15%
  ✓ السكربت جاهز: 523 حرف

[2/5] 🎤 تحويل النص لصوت   [████████████░░░░░░░░] 35%
  ✓ الصوت جاهز (48.3 KB)

[3/5] 🖼  البحث عن الصور   [████████████████░░░░] 55%
  ✓ تم تحميل 8 صور

[4/5] 🎬 تركيب الفيديو     [████████████████████] 90%
  ✓ الفيديو جاهز (12.4 MB)

[5/5] 📋 إعداد النشر       [████████████████████] 95%
  ✓ معلومات النشر جاهزة

╔═══════════════════════════════════╗
║  🎉 تم الإنتاج في 2د 34ث         ║
║  🎬 output/shorts_1234567.mp4    ║
╚═══════════════════════════════════╝
```

---

## 🔑 إدارة مفاتيح Gemini المتعددة

الأداة تدعم **تبديل تلقائي** بين المفاتيح عند وصول أي منها للحد اليومي:

```
مفتاح #1: وصل للحد (429 Rate Limit)
    ↓ تبديل تلقائي
مفتاح #2: نشط الآن ✓
    ↓ وصل للحد
مفتاح #3: نشط الآن ✓
```

**إضافة مفاتيح:** القائمة الرئيسية ← [4] إدارة API Keys ← [1] إضافة مفتاح Gemini

---

## 🎬 مواصفات الفيديو المنتج

| الخاصية | القيمة |
|---------|--------|
| التنسيق | MP4 (H.264 + AAC) |
| النسبة | 9:16 (عمودي) |
| الجودة | 480p / **720p** / 1080p |
| FPS | 30 |
| المدة | 30 - 60 ثانية |
| التأثيرات | Ken Burns Zoom + Fade |
| النصوص | عنوان + سطور سفلية متحركة |
| Watermark | DrCode (شفاف) |

---

## 📝 ملف config.json

يُنشأ تلقائياً ويحفظ جميع الإعدادات:

```json
{
  "gemini_api_keys": ["KEY1", "KEY2", "KEY3"],
  "gemini_key_index": 0,
  "pexels_api_key": "YOUR_PEXELS_KEY",
  "tts_api_key": "YOUR_TTS_KEY",
  "tts_voice": "Puck",
  "tts_style": "balanced",
  "video_quality": "720p",
  "script_language": "ar",
  "output_dir": "output/",
  "fps": 30
}
```

---

## 🎤 الأصوات المتاحة

| الصوت | النوع | الوصف |
|-------|-------|--------|
| **Puck** | ذكوري | طبيعي ومتوازن (افتراضي) |
| **Charon** | ذكوري | عميق وجدي |
| **Fenrir** | ذكوري | قوي ومؤثر |
| **Kore** | أنثوي | ناعم وهادئ |
| **Aoede** | أنثوي | جذاب وحيوي |

**أنماط الكلام:**
- `balanced` — متوازن (افتراضي)
- `expressive` — تعبيري وحيوي
- `calm` — هادئ ورزين
- `energetic` — نشط وسريع

---

## 🐛 حل المشاكل الشائعة

### FFmpeg غير موجود
```bash
# رسالة الخطأ: FileNotFoundError: [WinError 2] ffmpeg not found

# Windows
winget install FFmpeg
# أو من: https://ffmpeg.org/download.html

# macOS
brew install ffmpeg

# Linux
sudo apt update && sudo apt install ffmpeg
```

### مشكلة في مفتاح Gemini
```
❌ فشل توليد السكربت!
```
- تحقق من صحة المفتاح في [Google AI Studio](https://makersuite.google.com)
- أضف مفاتيح إضافية: القائمة ← [4] إدارة API Keys

### مشكلة في تثبيت moviepy
```bash
pip install moviepy --upgrade
pip install imageio[ffmpeg]
```

### لا تظهر نصوص عربية في الفيديو
- حمّل [خط Cairo](https://fonts.google.com/specimen/Cairo)
- ضع ملف `Cairo-Regular.ttf` في: `assets/fonts/`

---

## 📊 حدود الاستخدام المجانية

| API | الحد المجاني | ملاحظات |
|-----|-------------|---------|
| Gemini Flash | 15 طلب/دقيقة | أضف مفاتيح متعددة |
| Pexels | 200 طلب/ساعة | كافٍ جداً |
| YouTube | 10,000 وحدة/يوم | رفع ~5 فيديوهات |

---

## 🤝 المساهمة

المساهمات مرحب بها! اتبع الخطوات:

```bash
# 1. Fork المستودع
# 2. أنشئ branch جديد
git checkout -b feature/amazing-feature

# 3. Commit التغييرات
git commit -m "Add amazing feature"

# 4. Push
git push origin feature/amazing-feature

# 5. افتح Pull Request
```

---

## 📄 الرخصة

```
MIT License

Copyright (c) 2024 Dr Code

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## 👨‍💻 المطور

<div align="center">

**Dr Code**

🎬 YouTube Automation Expert | AI Content Creator

[![GitHub](https://img.shields.io/badge/GitHub-DrCode-181717?style=flat&logo=github)](https://github.com/drcode-ai)

</div>

---

<div align="center">

صُنع بـ ❤️ لمجتمع صانعي المحتوى العربي

⭐ **إذا أعجبك المشروع، لا تنسَ Star المستودع!** ⭐

</div>

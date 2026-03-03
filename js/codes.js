// ===========================
// DrCode Shorts Studio - All Python Codes
// ===========================

const CODES = {

// =================== main.py ===================
main: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
╔══════════════════════════════════════════════════╗
║         DrCode Shorts Studio v1.0               ║
║     YouTube Shorts Automation Tool              ║
║            by Dr Code                          ║
╚══════════════════════════════════════════════════╝
"""

import os
import sys
import json
import time
from pathlib import Path

# Add modules directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from modules.config_manager import ConfigManager
from modules.gemini_handler import GeminiHandler
from modules.tts_handler import TTSHandler
from modules.pexels_handler import PexelsHandler
from modules.video_maker import VideoMaker
from modules.youtube_uploader import YouTubeUploader
from modules.progress_tracker import ProgressTracker

try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.text import Text
    from rich.prompt import Prompt, Confirm
    from rich.table import Table
    from rich import print as rprint
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False

console = Console() if RICH_AVAILABLE else None


def print_banner():
    """Print the DrCode Shorts Studio banner."""
    if RICH_AVAILABLE:
        banner = """
[bold blue]╔══════════════════════════════════════════════════════════╗[/]
[bold blue]║[/]  [bold magenta]██████╗ ██████╗      [bold cyan]██████╗ ██████╗ ██████╗ ███████╗[/]  [bold blue]║[/]
[bold blue]║[/]  [bold magenta]██╔══██╗██╔══██╗    [bold cyan]██╔════╝██╔═══██╗██╔══██╗██╔════╝[/]  [bold blue]║[/]
[bold blue]║[/]  [bold magenta]██║  ██║██████╔╝    [bold cyan]██║     ██║   ██║██║  ██║█████╗  [/]  [bold blue]║[/]
[bold blue]║[/]  [bold magenta]██║  ██║██╔══██╗    [bold cyan]██║     ██║   ██║██║  ██║██╔══╝  [/]  [bold blue]║[/]
[bold blue]║[/]  [bold magenta]██████╔╝██║  ██║    [bold cyan]╚██████╗╚██████╔╝██████╔╝███████╗[/]  [bold blue]║[/]
[bold blue]║[/]  [bold magenta]╚═════╝ ╚═╝  ╚═╝    [bold cyan] ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝[/]  [bold blue]║[/]
[bold blue]║[/]                                                          [bold blue]║[/]
[bold blue]║[/]    [bold yellow]🎬 Shorts Studio[/] [bold white]- YouTube Shorts Automation[/]        [bold blue]║[/]
[bold blue]║[/]    [bold white]Powered by Google Gemini AI    v1.0[/]                 [bold blue]║[/]
[bold blue]╚══════════════════════════════════════════════════════════╝[/]
"""
        console.print(banner)
    else:
        print("=" * 60)
        print("  DrCode Shorts Studio v1.0")
        print("  YouTube Shorts Automation Tool")
        print("  by Dr Code | Powered by Gemini AI")
        print("=" * 60)


def main_menu():
    """Display main menu and get user choice."""
    if RICH_AVAILABLE:
        table = Table(show_header=False, border_style="blue", padding=(0, 2))
        table.add_column("Option", style="cyan bold", width=5)
        table.add_column("Description", style="white")
        
        table.add_row("[1]", "🤖  توليد فكرة تلقائياً (Trending Ideas)")
        table.add_row("[2]", "✍️   إدخال فكرة يدوياً (Custom Idea)")
        table.add_row("[3]", "⚙️   الإعدادات (Settings)")
        table.add_row("[4]", "🔑  إدارة API Keys")
        table.add_row("[5]", "📂  عرض الفيديوهات المنتجة")
        table.add_row("[6]", "🚪  خروج (Exit)")
        
        console.print(Panel(table, title="[bold magenta]القائمة الرئيسية[/]", 
                           border_style="blue"))
        return Prompt.ask("[bold cyan]اختر رقم العملية[/]", choices=["1","2","3","4","5","6"])
    else:
        print("\\n" + "=" * 50)
        print("  [1] توليد فكرة تلقائياً")
        print("  [2] إدخال فكرة يدوياً")
        print("  [3] الإعدادات")
        print("  [4] إدارة API Keys")
        print("  [5] عرض الفيديوهات المنتجة")
        print("  [6] خروج")
        print("=" * 50)
        return input("اختر: ").strip()


def run_full_pipeline(idea: str, config: ConfigManager, tracker: ProgressTracker):
    """Run the complete video production pipeline."""
    
    tracker.start_pipeline(idea)
    result = {}
    
    # ── Step 1: Generate Script ──────────────────────────────
    tracker.step(1, "توليد السكربت بـ Gemini AI...")
    gemini = GeminiHandler(config)
    script_data = gemini.generate_full_script(idea)
    
    if not script_data:
        tracker.error("فشل توليد السكربت!")
        return None
    
    result['script'] = script_data
    tracker.success(f"السكربت جاهز: {len(script_data['script'])} حرف")
    tracker.display_script_preview(script_data)
    
    # ── Step 2: Text to Speech ───────────────────────────────
    tracker.step(2, "تحويل النص إلى صوت...")
    tts = TTSHandler(config)
    audio_path = tts.convert_to_speech(script_data['script'])
    
    if not audio_path:
        tracker.error("فشل تحويل النص إلى صوت!")
        return None
    
    result['audio'] = audio_path
    tracker.success(f"الصوت جاهز: {audio_path}")
    
    # ── Step 3: Search Images ────────────────────────────────
    tracker.step(3, "البحث عن صور مناسبة من Pexels...")
    pexels = PexelsHandler(config)
    
    search_queries = script_data.get('image_queries', [idea])
    images = pexels.search_and_download(search_queries, count=8)
    
    if not images:
        tracker.error("لم يتم العثور على صور!")
        return None
    
    result['images'] = images
    tracker.success(f"تم تحميل {len(images)} صورة")
    
    # ── Step 4: Compose Video ────────────────────────────────
    tracker.step(4, "تركيب الفيديو بـ MoviePy...")
    maker = VideoMaker(config)
    video_path = maker.create_shorts_video(
        images=images,
        audio_path=audio_path,
        title=script_data.get('title', idea),
        subtitle_lines=script_data.get('subtitle_lines', [])
    )
    
    if not video_path:
        tracker.error("فشل تركيب الفيديو!")
        return None
    
    result['video'] = video_path
    tracker.success(f"الفيديو جاهز: {video_path}")
    
    # ── Step 5: Output Info ──────────────────────────────────
    tracker.step(5, "إعداد معلومات النشر...")
    result['title'] = script_data.get('yt_title', script_data.get('title', idea))
    result['description'] = script_data.get('description', '')
    result['hashtags'] = script_data.get('hashtags', [])
    result['tags'] = script_data.get('tags', [])
    tracker.success("معلومات النشر جاهزة")
    
    tracker.pipeline_complete(result)
    return result


def handle_upload_choice(result: dict, config: ConfigManager, tracker: ProgressTracker):
    """Ask user what to do with the produced video."""
    if RICH_AVAILABLE:
        console.print("\\n")
        console.print(Panel(
            "[bold white]الفيديو جاهز! ماذا تريد أن تفعل؟[/]",
            border_style="green"
        ))
        
        table = Table(show_header=False, border_style="dim")
        table.add_column("Option", style="cyan", width=5)
        table.add_column("Action")
        
        table.add_row("[1]", "🚀 رفع مباشر على YouTube")
        table.add_row("[2]", "💾 حفظ محلي فقط (للرفع اليدوي)")
        table.add_row("[3]", "📋 عرض معلومات النشر")
        table.add_row("[4]", "🔁 إنتاج فيديو جديد")
        
        console.print(table)
        choice = Prompt.ask("[cyan]اختر[/]", choices=["1","2","3","4"], default="2")
    else:
        print("\\n[1] رفع على YouTube  [2] حفظ محلي  [3] معلومات النشر  [4] فيديو جديد")
        choice = input("اختر (2): ").strip() or "2"
    
    if choice == "1":
        tracker.step(6, "رفع الفيديو على YouTube...")
        uploader = YouTubeUploader(config)
        
        if not uploader.is_configured():
            if RICH_AVAILABLE:
                console.print("[yellow]⚠️  YouTube غير مُعدّ. تحقق من الإعدادات.[/]")
            else:
                print("⚠️  YouTube غير مُعدّ")
        else:
            video_id = uploader.upload(
                video_path=result['video'],
                title=result['title'],
                description=result['description'],
                tags=result['tags'],
                hashtags=result['hashtags']
            )
            if video_id:
                tracker.success(f"✅ تم النشر! https://youtu.be/{video_id}")
            else:
                tracker.error("فشل رفع الفيديو!")
    
    elif choice == "2":
        if RICH_AVAILABLE:
            console.print(f"[green]✅ الفيديو محفوظ في:[/] [white]{result['video']}[/]")
        else:
            print(f"✅ الفيديو: {result['video']}")
    
    elif choice == "3":
        display_publish_info(result)
    
    elif choice == "4":
        return True  # Signal to produce new video
    
    return False


def display_publish_info(result: dict):
    """Display YouTube publishing information."""
    if RICH_AVAILABLE:
        table = Table(title="📋 معلومات النشر على YouTube", border_style="blue")
        table.add_column("الحقل", style="cyan", width=15)
        table.add_column("القيمة", style="white")
        
        table.add_row("📌 العنوان", result.get('title', '-'))
        table.add_row("📝 الوصف", result.get('description', '-')[:100] + "...")
        table.add_row("🏷️  الهاشتاجات", " ".join(result.get('hashtags', [])))
        table.add_row("📂 مسار الفيديو", result.get('video', '-'))
        
        console.print(table)
    else:
        print(f"العنوان: {result.get('title')}")
        print(f"الوصف: {result.get('description', '')[:100]}")
        print(f"الهاشتاجات: {' '.join(result.get('hashtags', []))}")


def settings_menu(config: ConfigManager):
    """Display settings menu."""
    if RICH_AVAILABLE:
        console.print(Panel("[bold]إعدادات الأداة[/]", border_style="yellow"))
    
    while True:
        if RICH_AVAILABLE:
            table = Table(show_header=False, border_style="dim")
            table.add_column("Option", style="cyan", width=5)
            table.add_column("Setting")
            
            table.add_row("[1]", f"🎤 الصوت الافتراضي: {config.get('tts_voice', 'Puck')}")
            table.add_row("[2]", f"🎨 نمط الصوت: {config.get('tts_style', 'balanced')}")
            table.add_row("[3]", f"📺 جودة الفيديو: {config.get('video_quality', '720p')}")
            table.add_row("[4]", f"🌍 لغة السكربت: {config.get('script_language', 'ar')}")
            table.add_row("[5]", f"📁 مجلد الإخراج: {config.get('output_dir', 'output/')}")
            table.add_row("[6]", "🔙 رجوع")
            
            console.print(table)
            choice = Prompt.ask("[cyan]اختر إعداداً لتغييره[/]", 
                              choices=["1","2","3","4","5","6"])
        else:
            print("\\n[1] الصوت  [2] نمط الصوت  [3] جودة الفيديو  [4] اللغة  [5] مجلد الإخراج  [6] رجوع")
            choice = input("اختر: ").strip()
        
        if choice == "1":
            voices = ["Puck", "Charon", "Kore", "Fenrir", "Aoede"]
            if RICH_AVAILABLE:
                voice = Prompt.ask("الصوت", choices=voices, default="Puck")
            else:
                voice = input(f"الصوت ({'/'.join(voices)}): ").strip() or "Puck"
            config.set('tts_voice', voice)
        
        elif choice == "2":
            styles = ["balanced", "expressive", "calm", "energetic"]
            if RICH_AVAILABLE:
                style = Prompt.ask("النمط", choices=styles, default="balanced")
            else:
                style = input(f"النمط: ").strip() or "balanced"
            config.set('tts_style', style)
        
        elif choice == "3":
            qualities = ["480p", "720p", "1080p"]
            if RICH_AVAILABLE:
                quality = Prompt.ask("الجودة", choices=qualities, default="720p")
            else:
                quality = input("الجودة (480p/720p/1080p): ").strip() or "720p"
            config.set('video_quality', quality)
        
        elif choice == "4":
            if RICH_AVAILABLE:
                lang = Prompt.ask("اللغة (ar/en)", default="ar")
            else:
                lang = input("اللغة (ar/en): ").strip() or "ar"
            config.set('script_language', lang)
        
        elif choice == "5":
            if RICH_AVAILABLE:
                out_dir = Prompt.ask("مجلد الإخراج", default="output/")
            else:
                out_dir = input("مجلد الإخراج: ").strip() or "output/"
            config.set('output_dir', out_dir)
        
        elif choice == "6":
            break
    
    config.save()
    if RICH_AVAILABLE:
        console.print("[green]✅ تم حفظ الإعدادات[/]")


def manage_api_keys(config: ConfigManager):
    """Manage API keys."""
    if RICH_AVAILABLE:
        console.print(Panel("[bold]إدارة مفاتيح API[/]", border_style="yellow"))
    
    while True:
        if RICH_AVAILABLE:
            # Show current keys status
            gemini_keys = config.get_gemini_keys()
            
            table = Table(title="API Keys Status", border_style="dim")
            table.add_column("API", style="cyan", width=20)
            table.add_column("الحالة", width=15)
            table.add_column("التفاصيل")
            
            # Gemini keys
            for i, key in enumerate(gemini_keys):
                masked = key[:8] + "..." + key[-4:] if len(key) > 12 else "***"
                table.add_row(
                    f"Gemini Key #{i+1}",
                    "[green]✓ نشط[/]" if key else "[red]✗ فارغ[/]",
                    masked
                )
            
            pexels_key = config.get('pexels_api_key', '')
            tts_key = config.get('tts_api_key', '')
            
            table.add_row("Pexels", 
                         "[green]✓ نشط[/]" if pexels_key else "[red]✗ غير محدد[/]",
                         (pexels_key[:8] + "...") if pexels_key else "غير محدد")
            table.add_row("TTS (Masry Vox)", 
                         "[green]✓ نشط[/]" if tts_key else "[red]✗ غير محدد[/]",
                         (tts_key[:8] + "...") if tts_key else "غير محدد")
            
            console.print(table)
            
            print()
            options_table = Table(show_header=False, border_style="dim")
            options_table.add_column("Option", style="cyan", width=5)
            options_table.add_column("Action")
            options_table.add_row("[1]", "➕ إضافة مفتاح Gemini جديد")
            options_table.add_row("[2]", "🗑️  حذف مفتاح Gemini")
            options_table.add_row("[3]", "🔄 تغيير مفتاح Pexels")
            options_table.add_row("[4]", "🔄 تغيير مفتاح TTS")
            options_table.add_row("[5]", "🔙 رجوع")
            console.print(options_table)
            
            choice = Prompt.ask("[cyan]اختر[/]", choices=["1","2","3","4","5"])
        else:
            print("\\n[1] إضافة Gemini  [2] حذف Gemini  [3] Pexels  [4] TTS  [5] رجوع")
            choice = input("اختر: ").strip()
        
        if choice == "1":
            if RICH_AVAILABLE:
                new_key = Prompt.ask("[yellow]أدخل مفتاح Gemini الجديد[/]", password=True)
            else:
                import getpass
                new_key = getpass.getpass("مفتاح Gemini: ")
            if new_key.strip():
                config.add_gemini_key(new_key.strip())
                config.save()
                if RICH_AVAILABLE:
                    console.print("[green]✅ تم إضافة المفتاح[/]")
        
        elif choice == "2":
            gemini_keys = config.get_gemini_keys()
            if not gemini_keys:
                if RICH_AVAILABLE:
                    console.print("[red]لا توجد مفاتيح[/]")
            else:
                if RICH_AVAILABLE:
                    idx = Prompt.ask(f"رقم المفتاح للحذف (1-{len(gemini_keys)})")
                else:
                    idx = input(f"رقم المفتاح (1-{len(gemini_keys)}): ")
                try:
                    config.remove_gemini_key(int(idx) - 1)
                    config.save()
                    if RICH_AVAILABLE:
                        console.print("[green]✅ تم حذف المفتاح[/]")
                except:
                    if RICH_AVAILABLE:
                        console.print("[red]رقم غير صحيح[/]")
        
        elif choice == "3":
            if RICH_AVAILABLE:
                key = Prompt.ask("[yellow]مفتاح Pexels API[/]", password=True)
            else:
                import getpass
                key = getpass.getpass("مفتاح Pexels: ")
            config.set('pexels_api_key', key.strip())
            config.save()
            if RICH_AVAILABLE:
                console.print("[green]✅ تم تحديث مفتاح Pexels[/]")
        
        elif choice == "4":
            if RICH_AVAILABLE:
                key = Prompt.ask("[yellow]مفتاح TTS API[/]", password=True)
            else:
                import getpass
                key = getpass.getpass("مفتاح TTS: ")
            config.set('tts_api_key', key.strip())
            config.save()
            if RICH_AVAILABLE:
                console.print("[green]✅ تم تحديث مفتاح TTS[/]")
        
        elif choice == "5":
            break


def show_produced_videos(config: ConfigManager):
    """Show list of produced videos."""
    output_dir = Path(config.get('output_dir', 'output/'))
    
    if not output_dir.exists():
        if RICH_AVAILABLE:
            console.print("[yellow]مجلد الإخراج فارغ أو غير موجود[/]")
        else:
            print("مجلد الإخراج فارغ")
        return
    
    videos = sorted(output_dir.glob("*.mp4"), key=lambda x: x.stat().st_mtime, reverse=True)
    
    if not videos:
        if RICH_AVAILABLE:
            console.print("[yellow]لا توجد فيديوهات منتجة بعد[/]")
        else:
            print("لا توجد فيديوهات")
        return
    
    if RICH_AVAILABLE:
        table = Table(title=f"📂 الفيديوهات المنتجة ({len(videos)})", border_style="blue")
        table.add_column("#", style="dim", width=4)
        table.add_column("اسم الملف", style="cyan")
        table.add_column("الحجم", style="green")
        table.add_column("التاريخ")
        
        for i, v in enumerate(videos, 1):
            size_mb = v.stat().st_size / (1024 * 1024)
            mtime = time.strftime("%Y-%m-%d %H:%M", time.localtime(v.stat().st_mtime))
            table.add_row(str(i), v.name, f"{size_mb:.1f} MB", mtime)
        
        console.print(table)
    else:
        for i, v in enumerate(videos, 1):
            size_mb = v.stat().st_size / (1024 * 1024)
            print(f"{i}. {v.name} ({size_mb:.1f} MB)")


def first_run_setup(config: ConfigManager):
    """First-time setup wizard."""
    if RICH_AVAILABLE:
        console.print(Panel(
            "[bold yellow]🎉 مرحباً بك في DrCode Shorts Studio!\\n"
            "يبدو أن هذا أول تشغيل. سنقوم بإعداد الأداة معاً.[/]",
            border_style="yellow"
        ))
    else:
        print("\\n" + "="*50)
        print("مرحباً! أول تشغيل - إعداد الأداة")
        print("="*50)
    
    import getpass
    
    # Gemini Keys
    if RICH_AVAILABLE:
        console.print("\\n[bold cyan]1. مفاتيح Gemini API[/]")
        console.print("[dim]يمكنك إضافة أكثر من مفتاح لتجنب انتهاء الحد اليومي[/]")
    
    gemini_keys = []
    while True:
        if RICH_AVAILABLE:
            key = Prompt.ask(
                f"[yellow]مفتاح Gemini #{len(gemini_keys)+1}[/] (اضغط Enter للتخطي إذا انتهيت)", 
                default="",
                password=True
            )
        else:
            key = getpass.getpass(f"مفتاح Gemini #{len(gemini_keys)+1} (Enter للتخطي): ")
        
        if not key.strip():
            if gemini_keys:
                break
            else:
                if RICH_AVAILABLE:
                    console.print("[red]يجب إدخال مفتاح Gemini واحد على الأقل![/]")
                else:
                    print("يجب إدخال مفتاح Gemini واحد!")
        else:
            gemini_keys.append(key.strip())
            if RICH_AVAILABLE:
                console.print(f"[green]✓ تم إضافة المفتاح #{len(gemini_keys)}[/]")
    
    config.set('gemini_api_keys', gemini_keys)
    config.set('gemini_key_index', 0)
    
    # Pexels API
    if RICH_AVAILABLE:
        console.print("\\n[bold cyan]2. Pexels API Key[/]")
        pexels_key = Prompt.ask("[yellow]مفتاح Pexels[/]", password=True)
    else:
        pexels_key = getpass.getpass("مفتاح Pexels: ")
    config.set('pexels_api_key', pexels_key.strip())
    
    # TTS API
    if RICH_AVAILABLE:
        console.print("\\n[bold cyan]3. TTS API Key (Masry Vox)[/]")
        tts_key = Prompt.ask("[yellow]مفتاح TTS[/]", password=True)
    else:
        tts_key = getpass.getpass("مفتاح TTS: ")
    config.set('tts_api_key', tts_key.strip())
    
    # YouTube (Optional)
    if RICH_AVAILABLE:
        console.print("\\n[bold cyan]4. YouTube API (اختياري)[/]")
        setup_yt = Confirm.ask("هل تريد إعداد نشر YouTube تلقائي الآن؟", default=False)
    else:
        setup_yt = input("إعداد YouTube تلقائي؟ (y/n): ").strip().lower() == 'y'
    
    if setup_yt:
        if RICH_AVAILABLE:
            console.print("[dim]ستحتاج إلى ملف credentials.json من Google Cloud Console[/]")
            creds_path = Prompt.ask("مسار ملف credentials.json", default="credentials.json")
        else:
            creds_path = input("مسار credentials.json: ").strip() or "credentials.json"
        config.set('youtube_credentials_path', creds_path)
    
    # Default settings
    config.set('tts_voice', 'Puck')
    config.set('tts_style', 'balanced')
    config.set('video_quality', '720p')
    config.set('script_language', 'ar')
    config.set('output_dir', 'output/')
    config.set('first_run', False)
    
    config.save()
    
    # Create directories
    Path('output').mkdir(exist_ok=True)
    Path('temp').mkdir(exist_ok=True)
    Path('assets').mkdir(exist_ok=True)
    
    if RICH_AVAILABLE:
        console.print("\\n[bold green]✅ تم الإعداد بنجاح! الأداة جاهزة للاستخدام.[/]\\n")
    else:
        print("\\n✅ تم الإعداد! الأداة جاهزة.\\n")


def main():
    """Main entry point."""
    print_banner()
    
    # Load configuration
    config = ConfigManager()
    tracker = ProgressTracker(console)
    
    # First run setup
    if config.get('first_run', True):
        first_run_setup(config)
    
    # Main loop
    while True:
        choice = main_menu()
        
        if choice == "1":
            # Auto generate idea
            if RICH_AVAILABLE:
                console.print("\\n[cyan]🤖 جاري توليد أفكار ترند...[/]")
            
            gemini = GeminiHandler(config)
            ideas = gemini.generate_ideas(count=5)
            
            if ideas:
                if RICH_AVAILABLE:
                    table = Table(title="💡 أفكار ترند", border_style="cyan")
                    table.add_column("#", style="dim", width=4)
                    table.add_column("الفكرة", style="white")
                    table.add_column("النوع", style="yellow")
                    
                    for i, idea in enumerate(ideas, 1):
                        table.add_row(str(i), idea['title'], idea.get('type', 'Trending'))
                    
                    console.print(table)
                    idx = Prompt.ask("[cyan]اختر رقم الفكرة[/]", 
                                   choices=[str(i) for i in range(1, len(ideas)+1)])
                    selected_idea = ideas[int(idx)-1]['title']
                else:
                    for i, idea in enumerate(ideas, 1):
                        print(f"{i}. {idea['title']}")
                    idx = input("اختر رقم الفكرة: ").strip()
                    selected_idea = ideas[int(idx)-1]['title']
                
                result = run_full_pipeline(selected_idea, config, tracker)
                if result:
                    handle_upload_choice(result, config, tracker)
            else:
                if RICH_AVAILABLE:
                    console.print("[red]❌ فشل توليد الأفكار. تحقق من مفتاح Gemini.[/]")
        
        elif choice == "2":
            # Manual idea
            if RICH_AVAILABLE:
                idea = Prompt.ask("[bold cyan]✍️  أدخل فكرة الفيديو[/]")
            else:
                idea = input("أدخل فكرة الفيديو: ").strip()
            
            if idea.strip():
                result = run_full_pipeline(idea.strip(), config, tracker)
                if result:
                    handle_upload_choice(result, config, tracker)
        
        elif choice == "3":
            settings_menu(config)
        
        elif choice == "4":
            manage_api_keys(config)
        
        elif choice == "5":
            show_produced_videos(config)
        
        elif choice == "6":
            if RICH_AVAILABLE:
                console.print("[bold magenta]\\n👋 إلى اللقاء! شكراً لاستخدام DrCode Shorts Studio[/]\\n")
            else:
                print("\\n👋 إلى اللقاء!")
            break
        
        if RICH_AVAILABLE:
            input("\\n[dim]اضغط Enter للمتابعة...[/]")
        else:
            input("\\nاضغط Enter للمتابعة...")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\\n\\n⚠️  تم إيقاف التشغيل بواسطة المستخدم")
        sys.exit(0)
    except Exception as e:
        print(f"\\n❌ خطأ غير متوقع: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
`,

// =================== config_manager.py ===================
config: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
modules/config_manager.py
إدارة إعدادات الأداة ومفاتيح API
"""

import json
import os
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
        """Load config from file, creating if not exists."""
        if self.config_file.exists():
            try:
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    self._config = json.load(f)
                # Merge with defaults for any missing keys
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
        """Get a configuration value."""
        return self._config.get(key, default)
    
    def set(self, key: str, value: Any):
        """Set a configuration value."""
        self._config[key] = value
    
    # ── Gemini Key Management ────────────────────────────────
    
    def get_gemini_keys(self) -> List[str]:
        """Get all configured Gemini API keys."""
        return self._config.get('gemini_api_keys', [])
    
    def get_current_gemini_key(self) -> Optional[str]:
        """Get the currently active Gemini API key."""
        keys = self.get_gemini_keys()
        if not keys:
            return None
        idx = self._config.get('gemini_key_index', 0) % len(keys)
        return keys[idx]
    
    def rotate_gemini_key(self) -> Optional[str]:
        """
        Rotate to the next Gemini API key.
        Called when a key hits its rate limit.
        Returns the new key or None if all keys exhausted.
        """
        keys = self.get_gemini_keys()
        if len(keys) <= 1:
            return None
        
        current_idx = self._config.get('gemini_key_index', 0)
        failures = self._config.get('gemini_key_failures', {})
        
        # Mark current key as failed
        failures[str(current_idx)] = failures.get(str(current_idx), 0) + 1
        self._config['gemini_key_failures'] = failures
        
        # Find next working key
        for i in range(1, len(keys)):
            next_idx = (current_idx + i) % len(keys)
            if failures.get(str(next_idx), 0) < 3:  # Max 3 failures before skip
                self._config['gemini_key_index'] = next_idx
                self.save()
                print(f"🔄 تم التبديل إلى مفتاح Gemini #{next_idx + 1}")
                return keys[next_idx]
        
        # All keys seem exhausted, reset failures and try again
        self._config['gemini_key_failures'] = {}
        self._config['gemini_key_index'] = (current_idx + 1) % len(keys)
        self.save()
        return keys[self._config['gemini_key_index']]
    
    def reset_gemini_failures(self):
        """Reset all key failure counts."""
        self._config['gemini_key_failures'] = {}
        self.save()
    
    def add_gemini_key(self, key: str):
        """Add a new Gemini API key."""
        keys = self.get_gemini_keys()
        if key not in keys:
            keys.append(key)
            self._config['gemini_api_keys'] = keys
    
    def remove_gemini_key(self, index: int):
        """Remove a Gemini API key by index."""
        keys = self.get_gemini_keys()
        if 0 <= index < len(keys):
            keys.pop(index)
            self._config['gemini_api_keys'] = keys
            # Adjust current index if needed
            if self._config.get('gemini_key_index', 0) >= len(keys):
                self._config['gemini_key_index'] = max(0, len(keys) - 1)
    
    def get_gemini_key_status(self) -> dict:
        """Get status of all Gemini keys."""
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
        """Get and create output directory."""
        path = Path(self.get('output_dir', 'output/'))
        path.mkdir(parents=True, exist_ok=True)
        return path
    
    def get_temp_dir(self) -> Path:
        """Get and create temp directory."""
        path = Path(self.get('temp_dir', 'temp/'))
        path.mkdir(parents=True, exist_ok=True)
        return path
    
    def get_assets_dir(self) -> Path:
        """Get assets directory."""
        return Path(self.get('assets_dir', 'assets/'))
    
    def __repr__(self):
        keys_count = len(self.get_gemini_keys())
        return f"ConfigManager(keys={keys_count}, quality={self.get('video_quality')})"
`,

// =================== gemini_handler.py ===================
gemini: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
modules/gemini_handler.py
التواصل مع Google Gemini API لتوليد الأفكار والسكربتات
"""

import json
import time
import re
from typing import Optional, List, Dict, Any

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("⚠️  google-generativeai غير مثبت. شغّل: pip install google-generativeai")

from .config_manager import ConfigManager


class GeminiHandler:
    """Handles all interactions with Google Gemini AI API."""
    
    MAX_RETRIES = 3
    RETRY_DELAY = 2
    
    def __init__(self, config: ConfigManager):
        self.config = config
        self._init_client()
    
    def _init_client(self):
        """Initialize Gemini client with current API key."""
        if not GEMINI_AVAILABLE:
            self.client = None
            return
        
        key = self.config.get_current_gemini_key()
        if key:
            genai.configure(api_key=key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            print("❌ لا توجد مفاتيح Gemini مُعدّة!")
            self.model = None
    
    def _call_gemini(self, prompt: str, retry_count: int = 0) -> Optional[str]:
        """
        Call Gemini API with automatic key rotation on failure.
        """
        if not self.model:
            return None
        
        try:
            response = self.model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            error_str = str(e).lower()
            
            # Rate limit or quota exceeded
            if any(x in error_str for x in ['quota', 'rate', 'limit', '429', 'resource_exhausted']):
                print(f"⚠️  تم تجاوز الحد لمفتاح Gemini الحالي...")
                new_key = self.config.rotate_gemini_key()
                
                if new_key and retry_count < self.MAX_RETRIES:
                    genai.configure(api_key=new_key)
                    self.model = genai.GenerativeModel('gemini-1.5-flash')
                    time.sleep(self.RETRY_DELAY)
                    return self._call_gemini(prompt, retry_count + 1)
                else:
                    print("❌ جميع مفاتيح Gemini وصلت للحد المسموح!")
                    return None
            
            # API error - retry
            elif retry_count < self.MAX_RETRIES:
                print(f"⚠️  خطأ في Gemini: {e}. إعادة المحاولة...")
                time.sleep(self.RETRY_DELAY * (retry_count + 1))
                return self._call_gemini(prompt, retry_count + 1)
            
            else:
                print(f"❌ فشل Gemini بعد {self.MAX_RETRIES} محاولات: {e}")
                return None
    
    def generate_ideas(self, count: int = 5, category: str = None) -> List[Dict]:
        """Generate trending YouTube Shorts ideas."""
        
        lang = self.config.get('script_language', 'ar')
        category_prompt = f"في مجال {category}" if category else "في مجالات متنوعة (تقنية، صحة، نجاح، معلومات)"
        lang_name = "العربية" if lang == 'ar' else "English"
        
        prompt = f"""أنت خبير في محتوى YouTube Shorts وتعرف ما يحقق ملايين المشاهدات.

قم بتوليد {count} أفكار ترند ل YouTube Shorts {category_prompt}.
اللغة: {lang_name}

متطلبات كل فكرة:
- عنوان جذاب يحتوي على Hook قوي
- مناسب لفيديو 30-60 ثانية
- يثير الفضول أو يقدم قيمة سريعة
- مناسب للعرض العمودي (Shorts)

أعطني الإجابة بهذا الـ JSON فقط (لا تضف أي نص آخر):
{{
    "ideas": [
        {{
            "title": "عنوان الفكرة",
            "type": "نوع المحتوى (تقنية/صحة/نجاح/معلومات/etc)",
            "hook": "الجملة الافتتاحية الجذابة",
            "keywords": ["كلمة1", "كلمة2"]
        }}
    ]
}}"""
        
        response = self._call_gemini(prompt)
        if not response:
            return []
        
        try:
            # Clean JSON response
            json_str = self._extract_json(response)
            data = json.loads(json_str)
            return data.get('ideas', [])
        except (json.JSONDecodeError, KeyError) as e:
            print(f"⚠️  خطأ في تحليل أفكار Gemini: {e}")
            # Fallback: return raw ideas
            return [{"title": line.strip(), "type": "Trending", "hook": "", "keywords": []}
                   for line in response.split('\\n') if line.strip() and len(line) > 10][:count]
    
    def generate_full_script(self, idea: str) -> Optional[Dict[str, Any]]:
        """
        Generate a complete Shorts script with all metadata.
        Returns dict with: script, title, description, hashtags, tags, image_queries, subtitle_lines
        """
        lang = self.config.get('script_language', 'ar')
        lang_name = "العربية" if lang == 'ar' else "English"
        
        prompt = f"""أنت كاتب محتوى محترف متخصص في YouTube Shorts العربي.

الفكرة: {idea}
اللغة: {lang_name}

اكتب سكربت كامل ل YouTube Short (30-60 ثانية). يجب أن يكون:
- يبدأ بـ Hook قوي في أول 3 ثواني
- معلومات مفيدة وجذابة
- ينتهي بـ Call to Action قوي
- مناسب للنطق الصوتي (بدون رموز أو أكواد)

أعطني JSON فقط بهذا الشكل الدقيق:
{{
    "title": "عنوان قصير للفيديو (بدون هاشتاجات)",
    "yt_title": "عنوان YouTube مع إيموجي (max 100 حرف)",
    "script": "النص الكامل للتحويل الصوتي (بالعربية الواضحة، بدون رموز خاصة)",
    "subtitle_lines": [
        "سطر 1 للعرض على الفيديو",
        "سطر 2 للعرض على الفيديو",
        "سطر 3 للعرض على الفيديو"
    ],
    "description": "وصف YouTube (200-300 حرف مع كلمات مفتاحية)",
    "hashtags": ["#هاشتاج1", "#هاشتاج2", "#هاشتاج3", "#هاشتاج4", "#هاشتاج5"],
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
    "image_queries": [
        "كلمات بحث بالإنجليزية للصورة 1",
        "كلمات بحث بالإنجليزية للصورة 2",
        "كلمات بحث بالإنجليزية للصورة 3"
    ],
    "duration_estimate": "45s",
    "category": "نوع المحتوى"
}}"""
        
        response = self._call_gemini(prompt)
        if not response:
            return None
        
        try:
            json_str = self._extract_json(response)
            data = json.loads(json_str)
            
            # Validate required fields
            required = ['script', 'title', 'description', 'hashtags']
            for field in required:
                if field not in data:
                    data[field] = self._generate_fallback(field, idea)
            
            return data
            
        except (json.JSONDecodeError, KeyError) as e:
            print(f"⚠️  خطأ في تحليل السكربت: {e}")
            # Fallback script
            return {
                "title": idea,
                "yt_title": f"🎯 {idea}",
                "script": response[:500] if response else idea,
                "subtitle_lines": [idea[:50]],
                "description": f"{idea} - محتوى مفيد وملهم",
                "hashtags": ["#shorts", "#youtube", "#DrCode"],
                "tags": ["shorts", "youtube", "drcode"],
                "image_queries": [idea, f"{idea} concept", f"{idea} illustration"],
                "duration_estimate": "45s",
                "category": "General"
            }
    
    def improve_script(self, script: str) -> Optional[str]:
        """Improve an existing script."""
        prompt = f"""حسّن هذا السكربت لـ YouTube Shorts ليكون أكثر جاذبية وتأثيراً:

{script}

أعطني السكربت المحسّن فقط بدون أي تعليقات."""
        
        return self._call_gemini(prompt)
    
    def generate_title_variations(self, base_title: str, count: int = 5) -> List[str]:
        """Generate multiple title variations."""
        prompt = f"""اقترح {count} عناوين بديلة جذابة لـ YouTube Short عن: {base_title}
        
أعطني فقط العناوين، كل عنوان في سطر منفصل."""
        
        response = self._call_gemini(prompt)
        if not response:
            return [base_title]
        
        return [line.strip() for line in response.split('\\n') 
                if line.strip() and len(line.strip()) > 5][:count]
    
    def _extract_json(self, text: str) -> str:
        """Extract JSON from text that might have extra content."""
        # Try to find JSON block
        json_match = re.search(r'\\{.*\\}', text, re.DOTALL)
        if json_match:
            return json_match.group()
        
        # Remove markdown code blocks
        text = re.sub(r'\`\`\`json\\s*', '', text)
        text = re.sub(r'\`\`\`\\s*', '', text)
        text = text.strip()
        
        return text
    
    def _generate_fallback(self, field: str, idea: str) -> Any:
        """Generate fallback values for missing fields."""
        fallbacks = {
            'script': idea,
            'title': idea[:50],
            'description': f"{idea} - محتوى مفيد",
            'hashtags': ["#shorts", "#youtube"],
            'tags': ["shorts", "youtube"],
            'image_queries': [idea],
            'subtitle_lines': [idea[:30]]
        }
        return fallbacks.get(field, '')
`,

// =================== tts_handler.py ===================
tts: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
modules/tts_handler.py
تحويل النص إلى صوت باستخدام Masry Vox API
"""

import os
import time
import hashlib
import requests
from pathlib import Path
from typing import Optional

from .config_manager import ConfigManager


TTS_API_URL = "https://masry-vox-drcode.vercel.app/api/tts"

AVAILABLE_VOICES = {
    "Puck": "صوت ذكوري طبيعي (افتراضي)",
    "Charon": "صوت ذكوري عميق",
    "Kore": "صوت أنثوي ناعم",
    "Fenrir": "صوت ذكوري قوي",
    "Aoede": "صوت أنثوي جذاب"
}

AVAILABLE_STYLES = {
    "balanced": "متوازن (افتراضي)",
    "expressive": "تعبيري وحيوي",
    "calm": "هادئ ورزين",
    "energetic": "نشط وسريع"
}


class TTSHandler:
    """Handles Text-to-Speech conversion via Masry Vox API."""
    
    MAX_RETRIES = 3
    RETRY_DELAY = 3
    TIMEOUT = 60  # seconds
    MAX_TEXT_LENGTH = 3000  # characters
    
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
        Convert text to speech and save as MP3.
        
        Args:
            text: Text to convert
            voice: Voice name (Puck, Charon, Kore, Fenrir, Aoede)
            style: Speaking style (balanced, expressive, calm, energetic)
            output_path: Where to save the audio file
            
        Returns:
            Path to the generated audio file or None on failure
        """
        if not self.api_key:
            print("❌ مفتاح TTS API غير محدد!")
            return None
        
        if not text or not text.strip():
            print("❌ النص فارغ!")
            return None
        
        # Clean and prepare text
        clean_text = self._clean_text(text)
        
        # Truncate if too long
        if len(clean_text) > self.MAX_TEXT_LENGTH:
            print(f"⚠️  النص طويل جداً ({len(clean_text)} حرف), سيتم اقتطاعه")
            clean_text = clean_text[:self.MAX_TEXT_LENGTH]
        
        # Use provided or config values
        use_voice = voice or self.voice
        use_style = style or self.style
        
        # Generate output path if not provided
        if not output_path:
            hash_str = hashlib.md5(clean_text[:50].encode()).hexdigest()[:8]
            timestamp = int(time.time())
            output_path = str(self.temp_dir / f"audio_{timestamp}_{hash_str}.mp3")
        
        # Make API request with retry
        for attempt in range(self.MAX_RETRIES):
            audio_data = self._make_tts_request(clean_text, use_voice, use_style)
            
            if audio_data:
                try:
                    with open(output_path, 'wb') as f:
                        f.write(audio_data)
                    
                    file_size = os.path.getsize(output_path)
                    if file_size > 100:  # At least 100 bytes
                        print(f"✅ الصوت جاهز: {output_path} ({file_size/1024:.1f} KB)")
                        return output_path
                    else:
                        print(f"⚠️  ملف الصوت صغير جداً (محاولة {attempt+1})")
                        os.remove(output_path)
                        
                except IOError as e:
                    print(f"❌ فشل حفظ الملف الصوتي: {e}")
                    return None
            
            if attempt < self.MAX_RETRIES - 1:
                print(f"⚠️  إعادة المحاولة {attempt+2}/{self.MAX_RETRIES}...")
                time.sleep(self.RETRY_DELAY * (attempt + 1))
        
        print("❌ فشل تحويل النص إلى صوت بعد جميع المحاولات")
        return None
    
    def _make_tts_request(self, text: str, voice: str, style: str) -> Optional[bytes]:
        """Make the actual TTS API request."""
        headers = {
            'Content-Type': 'application/json',
            'X-API-Key': self.api_key  # Header auth
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
                timeout=self.TIMEOUT,
                stream=False
            )
            
            if response.status_code == 200:
                # Check if response is audio
                content_type = response.headers.get('Content-Type', '')
                if 'audio' in content_type or 'octet-stream' in content_type or len(response.content) > 100:
                    return response.content
                else:
                    print(f"⚠️  استجابة غير متوقعة: {response.text[:200]}")
                    return None
                    
            elif response.status_code == 401:
                print("❌ مفتاح TTS API غير صحيح!")
                return None
                
            elif response.status_code == 429:
                print("⚠️  تم تجاوز حد TTS API")
                return None
                
            else:
                print(f"⚠️  TTS API خطأ {response.status_code}: {response.text[:200]}")
                return None
                
        except requests.Timeout:
            print(f"⚠️  انتهت مهلة TTS API ({self.TIMEOUT}s)")
            return None
            
        except requests.ConnectionError:
            print("⚠️  لا يمكن الاتصال بـ TTS API")
            return None
            
        except Exception as e:
            print(f"⚠️  خطأ في TTS: {e}")
            return None
    
    def _clean_text(self, text: str) -> str:
        """Clean text for TTS processing."""
        import re
        
        # Remove special characters that cause TTS issues
        text = re.sub(r'[\\*#\\[\\]\\{\\}\\|<>]', '', text)
        
        # Remove URLs
        text = re.sub(r'http\\S+', '', text)
        
        # Remove emojis
        emoji_pattern = re.compile("[\\U0001F600-\\U0001F64F\\U0001F300-\\U0001F5FF\\U0001F680-\\U0001F6FF\\U0001F1E0-\\U0001F1FF]+", flags=re.UNICODE)
        text = emoji_pattern.sub('', text)
        
        # Clean extra whitespace
        text = ' '.join(text.split())
        
        return text.strip()
    
    def get_audio_duration(self, audio_path: str) -> Optional[float]:
        """Get audio file duration in seconds."""
        try:
            from mutagen.mp3 import MP3
            audio = MP3(audio_path)
            return audio.info.length
        except ImportError:
            # Fallback: estimate from file size
            try:
                size_kb = os.path.getsize(audio_path) / 1024
                # Rough estimate: ~1 KB per second for 128kbps MP3
                return size_kb / 16
            except:
                return 45.0  # Default 45 seconds
        except Exception:
            return 45.0
    
    def split_text_for_tts(self, text: str, max_chunk: int = 2000) -> list:
        """Split long text into chunks for TTS."""
        if len(text) <= max_chunk:
            return [text]
        
        sentences = text.replace('\\n', ' ').split('. ')
        chunks = []
        current = ""
        
        for sentence in sentences:
            if len(current) + len(sentence) < max_chunk:
                current += sentence + ". "
            else:
                if current:
                    chunks.append(current.strip())
                current = sentence + ". "
        
        if current:
            chunks.append(current.strip())
        
        return chunks
    
    @staticmethod
    def list_voices() -> dict:
        """Return available voices."""
        return AVAILABLE_VOICES
    
    @staticmethod
    def list_styles() -> dict:
        """Return available styles."""
        return AVAILABLE_STYLES
`,

// =================== pexels_handler.py ===================
pexels: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
modules/pexels_handler.py
البحث عن صور من Pexels API وتحميلها
"""

import os
import time
import requests
from pathlib import Path
from typing import List, Optional, Dict, Any

from .config_manager import ConfigManager


PEXELS_API_URL = "https://api.pexels.com/v1"
PEXELS_VIDEO_API_URL = "https://api.pexels.com/videos"


class PexelsHandler:
    """Handles image search and download via Pexels API."""
    
    SHORTS_WIDTH = 1080
    SHORTS_HEIGHT = 1920
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
        orientation: str = "portrait"  # portrait for Shorts
    ) -> List[Dict[str, Any]]:
        """
        Search for photos on Pexels.
        
        Args:
            query: Search query
            per_page: Number of results
            orientation: 'portrait', 'landscape', 'square'
            
        Returns:
            List of photo data dicts
        """
        if not self.api_key:
            return []
        
        headers = {
            'Authorization': self.api_key
        }
        
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
                data = response.json()
                photos = data.get('photos', [])
                print(f"🔍 '{query}': وجدت {len(photos)} صورة")
                return photos
                
            elif response.status_code == 401:
                print("❌ مفتاح Pexels غير صحيح!")
                return []
                
            elif response.status_code == 429:
                print("⚠️  تم تجاوز حد Pexels API")
                return []
                
            else:
                print(f"⚠️  Pexels خطأ {response.status_code}")
                return []
                
        except requests.Timeout:
            print("⚠️  انتهت مهلة Pexels")
            return []
        except Exception as e:
            print(f"⚠️  خطأ Pexels: {e}")
            return []
    
    def download_photo(self, photo: Dict, index: int) -> Optional[str]:
        """
        Download a single photo.
        
        Args:
            photo: Pexels photo data dict
            index: Photo index for filename
            
        Returns:
            Path to downloaded image or None
        """
        # Get best URL for portrait (9:16 ratio)
        src = photo.get('src', {})
        
        # Prefer portrait/large versions
        url = (src.get('portrait') or 
               src.get('large2x') or 
               src.get('large') or 
               src.get('medium') or
               src.get('original'))
        
        if not url:
            return None
        
        photo_id = photo.get('id', index)
        output_path = self.temp_dir / f"img_{photo_id}_{index:02d}.jpg"
        
        if output_path.exists():
            return str(output_path)
        
        try:
            response = requests.get(url, timeout=self.DOWNLOAD_TIMEOUT, stream=True)
            
            if response.status_code == 200:
                with open(output_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
                
                file_size = output_path.stat().st_size
                if file_size > 1000:  # At least 1KB
                    return str(output_path)
                else:
                    output_path.unlink(missing_ok=True)
                    return None
            else:
                return None
                
        except Exception as e:
            print(f"⚠️  فشل تحميل الصورة {index}: {e}")
            return None
    
    def search_and_download(
        self, 
        queries: List[str], 
        count: int = 8
    ) -> List[str]:
        """
        Search multiple queries and download best photos.
        
        Args:
            queries: List of search queries
            count: Total number of images needed
            
        Returns:
            List of paths to downloaded images
        """
        all_photos = []
        seen_ids = set()
        
        photos_per_query = max(3, count // len(queries)) if queries else count
        
        for query in queries:
            # Try English query first
            photos = self.search_photos(query, per_page=photos_per_query + 5)
            
            # Filter duplicates
            for photo in photos:
                if photo.get('id') not in seen_ids:
                    seen_ids.add(photo.get('id'))
                    all_photos.append(photo)
            
            if len(all_photos) >= count * 2:
                break
        
        if not all_photos:
            # Fallback: search generic terms
            fallback_queries = ["technology", "abstract background", "modern design"]
            for q in fallback_queries:
                photos = self.search_photos(q, per_page=5)
                all_photos.extend(photos)
                if all_photos:
                    break
        
        # Download photos
        downloaded = []
        print(f"⬇️  جاري تحميل {min(count, len(all_photos))} صورة...")
        
        for i, photo in enumerate(all_photos[:count]):
            path = self.download_photo(photo, i)
            if path:
                downloaded.append(path)
                print(f"  ✓ صورة {len(downloaded)}/{count}")
            
            if len(downloaded) >= count:
                break
            
            time.sleep(0.2)  # Rate limiting
        
        print(f"✅ تم تحميل {len(downloaded)} صورة بنجاح")
        return downloaded
    
    def get_photo_metadata(self, photo: Dict) -> Dict:
        """Extract useful metadata from photo dict."""
        return {
            'id': photo.get('id'),
            'width': photo.get('width'),
            'height': photo.get('height'),
            'photographer': photo.get('photographer'),
            'url': photo.get('url'),
            'avg_color': photo.get('avg_color', '#000000'),
            'alt': photo.get('alt', ''),
        }
    
    def is_configured(self) -> bool:
        """Check if Pexels API is configured."""
        return bool(self.api_key)
`,

// =================== video_maker.py ===================
video: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
modules/video_maker.py
تركيب فيديو YouTube Shorts باستخدام MoviePy
"""

import os
import time
import numpy as np
from pathlib import Path
from typing import List, Optional, Tuple, Dict

try:
    from moviepy.editor import (
        ImageClip, AudioFileClip, CompositeVideoClip,
        concatenate_videoclips, VideoFileClip, TextClip,
        ColorClip, CompositeAudioClip
    )
    from moviepy.video.fx.all import resize, fadein, fadeout
    MOVIEPY_AVAILABLE = True
except ImportError:
    MOVIEPY_AVAILABLE = False
    print("⚠️  moviepy غير مثبت. شغّل: pip install moviepy")

try:
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

from .config_manager import ConfigManager


# Shorts format: 9:16 vertical
SHORTS_WIDTH = 1080
SHORTS_HEIGHT = 1920

# Quality presets
QUALITY_PRESETS = {
    "480p": {"width": 480, "height": 854, "bitrate": "1000k"},
    "720p": {"width": 720, "height": 1280, "bitrate": "2500k"},
    "1080p": {"width": 1080, "height": 1920, "bitrate": "5000k"},
}


class VideoMaker:
    """Creates YouTube Shorts videos using MoviePy."""
    
    def __init__(self, config: ConfigManager):
        self.config = config
        self.temp_dir = config.get_temp_dir()
        self.output_dir = config.get_output_dir()
        
        quality_key = config.get('video_quality', '720p')
        self.quality = QUALITY_PRESETS.get(quality_key, QUALITY_PRESETS['720p'])
        self.width = self.quality['width']
        self.height = self.quality['height']
        self.fps = config.get('fps', 30)
        
        # Colors for text overlay
        self.overlay_color = (0, 0, 0, 160)  # Semi-transparent black
        self.text_color = "white"
        self.accent_color = "#667eea"
        
        # Load font
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
        Create a complete YouTube Shorts video.
        
        Args:
            images: List of image file paths
            audio_path: Path to audio file
            title: Video title for overlay
            subtitle_lines: Text lines to display on video
            output_filename: Custom output filename
            
        Returns:
            Path to created video or None on failure
        """
        if not MOVIEPY_AVAILABLE:
            print("❌ MoviePy غير متاح!")
            return None
        
        if not images:
            print("❌ لا توجد صور!")
            return None
        
        if not os.path.exists(audio_path):
            print(f"❌ ملف الصوت غير موجود: {audio_path}")
            return None
        
        try:
            print("🎬 بدء تركيب الفيديو...")
            
            # Load audio to get duration
            audio_clip = AudioFileClip(audio_path)
            total_duration = audio_clip.duration
            print(f"  ⏱  مدة الصوت: {total_duration:.1f} ثانية")
            
            # Calculate duration per image
            img_duration = total_duration / len(images)
            img_duration = max(2.0, min(6.0, img_duration))  # 2-6 seconds per image
            
            print(f"  🖼  {len(images)} صورة × {img_duration:.1f}ث")
            
            # Create image clips
            clips = []
            for i, img_path in enumerate(images):
                clip = self._create_image_clip(img_path, img_duration, i)
                if clip:
                    clips.append(clip)
            
            if not clips:
                print("❌ فشل إنشاء مقاطع الصور!")
                return None
            
            # Concatenate clips
            print("  🔗 دمج المقاطع...")
            video = concatenate_videoclips(clips, method="compose")
            
            # Trim/pad to match audio duration
            if video.duration > total_duration:
                video = video.subclip(0, total_duration)
            
            # Add text overlay
            if subtitle_lines or title:
                print("  📝 إضافة النصوص...")
                video = self._add_text_overlay(video, title, subtitle_lines or [], total_duration)
            
            # Add watermark/branding
            video = self._add_branding(video)
            
            # Set audio
            video = video.set_audio(audio_clip)
            
            # Generate output path
            if not output_filename:
                timestamp = int(time.time())
                safe_title = "".join(c for c in title[:30] if c.isalnum() or c in ' _-')
                safe_title = safe_title.strip().replace(' ', '_') or 'shorts'
                output_filename = f"shorts_{timestamp}_{safe_title}.mp4"
            
            output_path = str(self.output_dir / output_filename)
            
            # Export video
            print(f"  💾 تصدير الفيديو ({self.quality['bitrate']})...")
            video.write_videofile(
                output_path,
                fps=self.fps,
                codec='libx264',
                audio_codec='aac',
                bitrate=self.quality['bitrate'],
                audio_bitrate='192k',
                preset='medium',
                logger=None,  # Suppress moviepy logs
                verbose=False
            )
            
            # Cleanup
            audio_clip.close()
            video.close()
            for clip in clips:
                clip.close()
            
            if os.path.exists(output_path):
                size_mb = os.path.getsize(output_path) / (1024*1024)
                print(f"✅ الفيديو جاهز: {output_path} ({size_mb:.1f} MB)")
                return output_path
            else:
                print("❌ فشل تصدير الفيديو!")
                return None
                
        except Exception as e:
            print(f"❌ خطأ في تركيب الفيديو: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def _create_image_clip(
        self, 
        img_path: str, 
        duration: float, 
        index: int
    ) -> Optional['ImageClip']:
        """Create a processed image clip with Ken Burns effect."""
        try:
            # Load and resize image using PIL
            if PIL_AVAILABLE:
                img = Image.open(img_path).convert('RGB')
                img = self._fit_to_shorts(img)
                
                # Add subtle color grading
                img = self._color_grade(img)
                
                # Save processed image
                processed_path = str(self.temp_dir / f"processed_{index:02d}.jpg")
                img.save(processed_path, 'JPEG', quality=95)
                img_path = processed_path
            
            # Create MoviePy clip
            clip = ImageClip(img_path, duration=duration)
            clip = clip.resize((self.width, self.height))
            
            # Ken Burns effect (slow zoom/pan)
            zoom_factor = 1.05
            
            def ken_burns(t):
                progress = t / duration
                scale = 1 + (zoom_factor - 1) * progress
                return scale
            
            clip = clip.fl_time(lambda t: t).resize(ken_burns)
            
            # Fade transitions
            clip = fadein(clip, 0.5)
            clip = fadeout(clip, 0.5)
            
            return clip
            
        except Exception as e:
            print(f"  ⚠️  فشل معالجة الصورة {index}: {e}")
            try:
                # Simple fallback
                clip = ImageClip(img_path, duration=duration)
                clip = clip.resize((self.width, self.height))
                return clip
            except:
                return None
    
    def _fit_to_shorts(self, img: 'Image') -> 'Image':
        """Fit image to 9:16 shorts format."""
        target_ratio = self.width / self.height
        img_ratio = img.width / img.height
        
        if img_ratio > target_ratio:
            # Image is wider - crop sides
            new_width = int(img.height * target_ratio)
            left = (img.width - new_width) // 2
            img = img.crop((left, 0, left + new_width, img.height))
        else:
            # Image is taller - crop top/bottom
            new_height = int(img.width / target_ratio)
            top = (img.height - new_height) // 3  # Slight top bias
            img = img.crop((0, top, img.width, top + new_height))
        
        return img.resize((self.width, self.height), Image.LANCZOS)
    
    def _color_grade(self, img: 'Image') -> 'Image':
        """Apply subtle color grading to image."""
        try:
            from PIL import ImageEnhance
            
            # Slight brightness boost
            enhancer = ImageEnhance.Brightness(img)
            img = enhancer.enhance(1.05)
            
            # Slight contrast boost
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(1.1)
            
            # Slight saturation boost
            enhancer = ImageEnhance.Color(img)
            img = enhancer.enhance(1.15)
            
        except Exception:
            pass
        
        return img
    
    def _add_text_overlay(
        self, 
        video: 'CompositeVideoClip',
        title: str,
        subtitle_lines: List[str],
        duration: float
    ) -> 'CompositeVideoClip':
        """Add animated text overlay to video."""
        try:
            text_clips = []
            
            # Title at top (appears at start)
            if title:
                # Create title background
                title_bg = ColorClip(
                    size=(self.width, 120),
                    color=(0, 0, 0),
                    duration=min(3, duration)
                ).set_opacity(0.7).set_position(('center', 50))
                text_clips.append(title_bg)
                
                # Title text
                try:
                    title_clip = (TextClip(
                        title[:50],
                        fontsize=45,
                        color='white',
                        font=self.font_path or 'Arial',
                        method='caption',
                        size=(self.width - 40, None),
                        align='center'
                    )
                    .set_duration(min(3, duration))
                    .set_position(('center', 65))
                    .fadein(0.3)
                    .fadeout(0.5))
                    text_clips.append(title_clip)
                except Exception as e:
                    print(f"  ⚠️  فشل إضافة العنوان: {e}")
            
            # Subtitle lines (in lower third)
            if subtitle_lines:
                line_height = 60
                start_y = self.height - 300
                
                for i, line in enumerate(subtitle_lines[:4]):
                    if not line.strip():
                        continue
                    
                    line_duration = min(duration / len(subtitle_lines), 8)
                    line_start = i * (duration / len(subtitle_lines))
                    
                    # Line background
                    line_bg = (ColorClip(
                        size=(self.width, line_height + 10),
                        color=(20, 20, 20),
                        duration=line_duration
                    )
                    .set_opacity(0.75)
                    .set_position(('center', start_y + i * (line_height + 5)))
                    .set_start(line_start))
                    text_clips.append(line_bg)
                    
                    # Line text
                    try:
                        line_clip = (TextClip(
                            line[:60],
                            fontsize=42,
                            color='white',
                            font=self.font_path or 'Arial',
                            method='caption',
                            size=(self.width - 60, None),
                            align='center'
                        )
                        .set_duration(line_duration)
                        .set_start(line_start)
                        .set_position(('center', start_y + 8 + i * (line_height + 5)))
                        .fadein(0.2)
                        .fadeout(0.3))
                        text_clips.append(line_clip)
                    except Exception:
                        pass
            
            if text_clips:
                return CompositeVideoClip([video] + text_clips)
            
        except Exception as e:
            print(f"  ⚠️  خطأ في إضافة النصوص: {e}")
        
        return video
    
    def _add_branding(self, video: 'CompositeVideoClip') -> 'CompositeVideoClip':
        """Add subtle DrCode watermark."""
        try:
            watermark = (TextClip(
                "DrCode",
                fontsize=28,
                color='white',
                font=self.font_path or 'Arial'
            )
            .set_opacity(0.4)
            .set_duration(video.duration)
            .set_position((30, 50)))
            
            return CompositeVideoClip([video, watermark])
        except Exception:
            return video
    
    def _find_font(self) -> Optional[str]:
        """Find a suitable Arabic font."""
        font_paths = [
            "assets/fonts/Cairo-Regular.ttf",
            "assets/fonts/Amiri-Regular.ttf",
            "/usr/share/fonts/truetype/arabic/",
            "C:/Windows/Fonts/arial.ttf",
            "/System/Library/Fonts/Arial.ttf",
        ]
        
        for path in font_paths:
            if os.path.exists(path):
                return path
        
        return None  # Use system default
`,

// =================== youtube_uploader.py ===================
youtube: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
modules/youtube_uploader.py
نشر الفيديوهات على YouTube باستخدام YouTube Data API v3
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


SCOPES = ["https://www.googleapis.com/auth/youtube.upload",
          "https://www.googleapis.com/auth/youtube"]

YOUTUBE_CATEGORIES = {
    "22": "People & Blogs",
    "28": "Science & Technology",
    "27": "Education",
    "24": "Entertainment",
    "10": "Music",
    "17": "Sports",
    "19": "Travel & Events",
    "26": "Howto & Style"
}


class YouTubeUploader:
    """Handles YouTube video uploading via YouTube Data API v3."""
    
    CHUNK_SIZE = 1024 * 1024 * 10  # 10MB chunks
    MAX_RETRIES = 3
    
    def __init__(self, config: ConfigManager):
        self.config = config
        self.credentials_path = config.get('youtube_credentials_path', 'credentials.json')
        self.token_path = config.get('youtube_token_path', 'youtube_token.json')
        self._service = None
    
    def is_configured(self) -> bool:
        """Check if YouTube API is configured."""
        if not YOUTUBE_API_AVAILABLE:
            return False
        return os.path.exists(self.credentials_path)
    
    def authenticate(self) -> bool:
        """
        Authenticate with YouTube API using OAuth2.
        Opens browser for first-time auth.
        """
        if not YOUTUBE_API_AVAILABLE:
            print("❌ مكتبات YouTube API غير مثبتة!")
            print("شغّل: pip install google-auth-oauthlib google-api-python-client")
            return False
        
        if not os.path.exists(self.credentials_path):
            print(f"❌ ملف credentials.json غير موجود: {self.credentials_path}")
            print("احصل عليه من Google Cloud Console > APIs > YouTube Data API v3")
            return False
        
        creds = None
        
        # Load existing token
        if os.path.exists(self.token_path):
            try:
                creds = Credentials.from_authorized_user_file(self.token_path, SCOPES)
            except Exception:
                creds = None
        
        # Refresh or get new token
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                try:
                    creds.refresh(Request())
                except Exception as e:
                    print(f"⚠️  فشل تجديد التوكن: {e}")
                    creds = None
            
            if not creds:
                try:
                    flow = InstalledAppFlow.from_client_secrets_file(
                        self.credentials_path, SCOPES
                    )
                    creds = flow.run_local_server(port=0)
                    print("✅ تم تسجيل الدخول إلى YouTube بنجاح!")
                except Exception as e:
                    print(f"❌ فشل المصادقة: {e}")
                    return False
            
            # Save token
            try:
                with open(self.token_path, 'w') as f:
                    f.write(creds.to_json())
            except Exception:
                pass
        
        # Build service
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
        Upload a video to YouTube.
        
        Args:
            video_path: Path to video file
            title: Video title (max 100 chars)
            description: Video description
            tags: List of tags
            hashtags: List of hashtags to append to description
            category_id: YouTube category ID
            privacy: 'public', 'unlisted', or 'private'
            made_for_kids: Whether content is for kids
            
        Returns:
            YouTube video ID or None on failure
        """
        if not os.path.exists(video_path):
            print(f"❌ ملف الفيديو غير موجود: {video_path}")
            return None
        
        # Authenticate
        if not self._service:
            if not self.authenticate():
                return None
        
        # Prepare metadata
        title = title[:100]  # YouTube limit
        
        # Add hashtags to description
        full_description = description
        if hashtags:
            hashtag_str = " ".join(h if h.startswith('#') else f"#{h}" for h in hashtags)
            full_description += f"\\n\\n{hashtag_str}"
        
        # Add DrCode signature
        full_description += "\\n\\n---\\n🎬 أُنتج بـ DrCode Shorts Studio"
        full_description = full_description[:5000]  # YouTube limit
        
        # Combine tags
        all_tags = list(tags or [])
        for h in (hashtags or []):
            tag = h.lstrip('#')
            if tag not in all_tags:
                all_tags.append(tag)
        all_tags = all_tags[:500]  # YouTube limit
        
        body = {
            "snippet": {
                "title": title,
                "description": full_description,
                "tags": all_tags,
                "categoryId": category_id,
                "defaultLanguage": "ar",
            },
            "status": {
                "privacyStatus": privacy,
                "selfDeclaredMadeForKids": made_for_kids,
                "madeForKids": made_for_kids
            }
        }
        
        # Upload with retry
        for attempt in range(self.MAX_RETRIES):
            try:
                print(f"📤 رفع الفيديو على YouTube (محاولة {attempt+1})...")
                
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
                
                # Upload with progress
                video_id = self._upload_with_progress(request)
                
                if video_id:
                    print(f"✅ تم رفع الفيديو!")
                    print(f"   🔗 https://youtu.be/{video_id}")
                    print(f"   📊 https://studio.youtube.com/video/{video_id}/edit")
                    return video_id
                    
            except HttpError as e:
                error_detail = json.loads(e.content).get('error', {})
                print(f"⚠️  YouTube API خطأ: {error_detail.get('message', str(e))}")
                
                if e.resp.status in [403, 401]:
                    print("🔄 محاولة إعادة المصادقة...")
                    if os.path.exists(self.token_path):
                        os.remove(self.token_path)
                    if not self.authenticate():
                        return None
                        
            except Exception as e:
                print(f"⚠️  خطأ في الرفع: {e}")
                
            if attempt < self.MAX_RETRIES - 1:
                wait_time = (attempt + 1) * 5
                print(f"⏳ انتظار {wait_time} ثانية...")
                time.sleep(wait_time)
        
        return None
    
    def _upload_with_progress(self, request) -> Optional[str]:
        """Upload with progress reporting."""
        response = None
        error = None
        
        while response is None:
            try:
                status, response = request.next_chunk()
                
                if status:
                    progress = int(status.progress() * 100)
                    bar_filled = int(progress / 5)
                    bar = "█" * bar_filled + "░" * (20 - bar_filled)
                    print(f"\\r  [{bar}] {progress}%", end="", flush=True)
                    
            except HttpError as e:
                if e.resp.status in [500, 502, 503, 504]:
                    if error is not None:
                        raise
                    error = e
                    time.sleep(5)
                else:
                    raise
        
        print()  # New line after progress bar
        
        if response:
            return response.get('id')
        return None
    
    def get_channel_info(self) -> Optional[Dict]:
        """Get authenticated channel information."""
        if not self._service:
            if not self.authenticate():
                return None
        
        try:
            response = self._service.channels().list(
                part="snippet,statistics",
                mine=True
            ).execute()
            
            channels = response.get('items', [])
            if channels:
                ch = channels[0]
                return {
                    'id': ch['id'],
                    'name': ch['snippet']['title'],
                    'subscribers': ch['statistics'].get('subscriberCount', 0),
                    'videos': ch['statistics'].get('videoCount', 0)
                }
        except Exception as e:
            print(f"⚠️  فشل جلب معلومات القناة: {e}")
        
        return None
    
    def set_video_thumbnail(self, video_id: str, thumbnail_path: str) -> bool:
        """Set custom thumbnail for a video."""
        if not self._service or not os.path.exists(thumbnail_path):
            return False
        
        try:
            media = MediaFileUpload(thumbnail_path, mimetype='image/jpeg')
            self._service.thumbnails().set(
                videoId=video_id,
                media_body=media
            ).execute()
            print(f"✅ تم تعيين الصورة المصغرة")
            return True
        except Exception as e:
            print(f"⚠️  فشل تعيين الصورة: {e}")
            return False
`,

// =================== progress_tracker.py ===================
progress: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
modules/progress_tracker.py
عرض تقدم العمل بشكل جذاب
"""

import time
from typing import Optional, Dict, Any

try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.progress import Progress, SpinnerColumn, BarColumn, TextColumn, TimeElapsedColumn
    from rich.table import Table
    from rich.text import Text
    from rich.layout import Layout
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False


STEPS = {
    1: {"name": "توليد السكربت",     "icon": "📝", "weight": 15},
    2: {"name": "تحويل النص لصوت",  "icon": "🎤", "weight": 20},
    3: {"name": "البحث عن الصور",    "icon": "🖼 ", "weight": 20},
    4: {"name": "تركيب الفيديو",     "icon": "🎬", "weight": 35},
    5: {"name": "إعداد النشر",       "icon": "📋", "weight": 5},
    6: {"name": "النشر على YouTube", "icon": "🚀", "weight": 5},
}


class ProgressTracker:
    """Tracks and displays pipeline progress."""
    
    def __init__(self, console=None):
        self.console = console
        self.current_step = 0
        self.total_steps = len(STEPS)
        self.start_time = None
        self.step_times = {}
        self.errors = []
        self.warnings = []
    
    def start_pipeline(self, idea: str):
        """Initialize pipeline tracking."""
        self.start_time = time.time()
        self.current_step = 0
        self.step_times = {}
        self.errors = []
        self.warnings = []
        
        if RICH_AVAILABLE and self.console:
            self.console.print()
            self.console.print(Panel(
                f"[bold white]🚀 بدء إنتاج الفيديو[/]\\n"
                f"[cyan]الفكرة:[/] [white]{idea}[/]\\n"
                f"[dim]الوقت: {time.strftime('%H:%M:%S')}[/]",
                border_style="blue",
                title="[bold magenta]DrCode Shorts Studio[/]"
            ))
        else:
            print("\\n" + "=" * 60)
            print(f"🚀 بدء الإنتاج: {idea}")
            print("=" * 60)
    
    def step(self, step_num: int, message: str = ""):
        """Mark current step and display progress."""
        self.current_step = step_num
        step_info = STEPS.get(step_num, {"name": "خطوة", "icon": "▶", "weight": 10})
        
        step_name = step_info["name"]
        step_icon = step_info["icon"]
        
        # Calculate overall progress
        completed_weight = sum(STEPS[i]["weight"] for i in range(1, step_num))
        overall_pct = min(95, int(completed_weight / sum(s["weight"] for s in STEPS.values()) * 100))
        
        if RICH_AVAILABLE and self.console:
            # Progress bar
            bar_width = 30
            filled = int(bar_width * overall_pct / 100)
            bar = "█" * filled + "░" * (bar_width - filled)
            
            self.console.print(
                f"\\n[bold blue][{step_num}/{self.total_steps}][/] "
                f"[bold]{step_icon} {step_name}[/]"
                f"[dim]  ({message})[/]"
            )
            self.console.print(
                f"[blue]  [{bar}][/] [cyan]{overall_pct}%[/]"
            )
        else:
            print(f"\\n[{step_num}/{self.total_steps}] {step_icon} {step_name}")
            if message:
                print(f"  → {message}")
            
            bar_width = 40
            filled = int(bar_width * overall_pct / 100)
            bar = "█" * filled + "░" * (bar_width - filled)
            print(f"  [{bar}] {overall_pct}%")
        
        self.step_times[step_num] = time.time()
    
    def success(self, message: str):
        """Display success message."""
        if RICH_AVAILABLE and self.console:
            self.console.print(f"  [green]✓[/] {message}")
        else:
            print(f"  ✓ {message}")
    
    def warning(self, message: str):
        """Display warning message."""
        self.warnings.append(message)
        if RICH_AVAILABLE and self.console:
            self.console.print(f"  [yellow]⚠ {message}[/]")
        else:
            print(f"  ⚠ {message}")
    
    def error(self, message: str):
        """Display error message."""
        self.errors.append(message)
        if RICH_AVAILABLE and self.console:
            self.console.print(f"  [red]✗ {message}[/]")
        else:
            print(f"  ✗ {message}")
    
    def info(self, message: str):
        """Display info message."""
        if RICH_AVAILABLE and self.console:
            self.console.print(f"  [dim]ℹ {message}[/]")
        else:
            print(f"  ℹ {message}")
    
    def display_script_preview(self, script_data: Dict[str, Any]):
        """Display a preview of the generated script."""
        if not script_data:
            return
        
        if RICH_AVAILABLE and self.console:
            table = Table(show_header=False, border_style="dim", padding=(0,1))
            table.add_column("Field", style="cyan", width=15)
            table.add_column("Value", style="white")
            
            table.add_row("📌 العنوان", script_data.get('title', '-')[:60])
            
            script_preview = script_data.get('script', '')[:100] + "..."
            table.add_row("📜 السكربت", script_preview)
            
            hashtags = " ".join(script_data.get('hashtags', [])[:5])
            table.add_row("🏷  الهاشتاجات", hashtags or '-')
            
            self.console.print(table)
        else:
            print(f"  العنوان: {script_data.get('title', '-')[:60]}")
            script_preview = script_data.get('script', '')[:80]
            print(f"  السكربت: {script_preview}...")
    
    def pipeline_complete(self, result: Dict[str, Any]):
        """Display pipeline completion summary."""
        total_time = time.time() - self.start_time if self.start_time else 0
        minutes = int(total_time // 60)
        seconds = int(total_time % 60)
        
        if RICH_AVAILABLE and self.console:
            # Final progress bar - 100%
            bar = "█" * 30
            self.console.print(f"\\n[blue]  [{bar}][/] [bold green]100%[/]")
            
            success_panel = (
                f"[bold green]✅ اكتمل الإنتاج بنجاح![/]\\n\\n"
                f"[white]⏱  الوقت المستغرق:[/] [cyan]{minutes}د {seconds}ث[/]\\n"
                f"[white]🎬 الفيديو:[/] [cyan]{result.get('video', '-')}[/]\\n"
                f"[white]📌 العنوان:[/] [white]{result.get('title', '-')[:50]}[/]"
            )
            
            if self.warnings:
                success_panel += f"\\n[yellow]⚠  تحذيرات: {len(self.warnings)}[/]"
            
            self.console.print(Panel(success_panel, border_style="green", 
                                    title="[bold]🎉 تم الإنتاج[/]"))
        else:
            print("\\n" + "=" * 60)
            print(f"✅ اكتمل الإنتاج في {minutes}د {seconds}ث")
            print(f"🎬 الفيديو: {result.get('video', '-')}")
            print("=" * 60)
    
    def show_spinner(self, message: str, duration: float = 2.0):
        """Show a spinner for a given duration."""
        if RICH_AVAILABLE and self.console:
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                console=self.console,
                transient=True
            ) as progress:
                task = progress.add_task(message, total=None)
                time.sleep(duration)
        else:
            print(f"⏳ {message}")
            time.sleep(duration)
    
    def get_summary(self) -> Dict:
        """Get pipeline execution summary."""
        total_time = time.time() - self.start_time if self.start_time else 0
        return {
            "total_time": total_time,
            "steps_completed": self.current_step,
            "errors": self.errors,
            "warnings": self.warnings,
            "step_times": self.step_times
        }
`,

// =================== requirements.txt ===================
requirements: `# DrCode Shorts Studio - Requirements
# تثبيت: pip install -r requirements.txt

# ── Core ─────────────────────────────────────────
google-generativeai>=0.7.0        # Gemini AI API
requests>=2.31.0                  # HTTP requests

# ── Video Processing ──────────────────────────────
moviepy>=1.0.3                    # Video composition
Pillow>=10.0.0                    # Image processing
imageio>=2.31.0                   # Image I/O for moviepy
imageio-ffmpeg>=0.4.9             # FFmpeg backend
numpy>=1.24.0                     # Numerical operations

# ── Audio ─────────────────────────────────────────
mutagen>=1.47.0                   # Audio metadata (optional)

# ── YouTube API ───────────────────────────────────
google-auth>=2.23.0              # Google authentication
google-auth-oauthlib>=1.1.0     # OAuth2 flow
google-auth-httplib2>=0.1.1     # HTTP transport
google-api-python-client>=2.100.0  # YouTube API

# ── Terminal UI ───────────────────────────────────
rich>=13.7.0                      # Beautiful terminal output

# ── Utilities ─────────────────────────────────────
python-dotenv>=1.0.0              # Environment variables (optional)
tqdm>=4.66.0                      # Progress bars (optional fallback)

# ── Notes ─────────────────────────────────────────
# FFmpeg must be installed separately:
#   Windows: winget install FFmpeg
#   macOS:   brew install ffmpeg
#   Linux:   sudo apt install ffmpeg
#
# Arabic fonts (optional, for better text rendering):
#   Download Cairo font from Google Fonts
#   Place in: assets/fonts/Cairo-Regular.ttf
`,

// =================== README.md ===================
readme: `# 🎬 DrCode Shorts Studio

<div align="center">

![DrCode Shorts Studio](https://img.shields.io/badge/DrCode-Shorts%20Studio-667eea?style=for-the-badge&logo=youtube)
![Python](https://img.shields.io/badge/Python-3.8+-3776ab?style=for-the-badge&logo=python)
![Gemini AI](https://img.shields.io/badge/Gemini-AI%20Powered-4285F4?style=for-the-badge&logo=google)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**نظام متكامل لإنتاج YouTube Shorts تلقائياً بالذكاء الاصطناعي**

[التثبيت](#التثبيت) • [الاستخدام](#الاستخدام) • [المميزات](#المميزات) • [الإعداد](#الإعداد)

</div>

---

## ✨ المميزات

| المميزة | الوصف |
|---------|--------|
| 🤖 **توليد الأفكار** | Gemini يولد أفكار ترند تلقائياً |
| 📝 **سكربت احترافي** | نص قصير جذاب مع Hook قوي |
| 🎤 **تحويل نص لصوت** | صوت عربي طبيعي بأصوات متعددة |
| 🖼️ **بحث عن الصور** | صور HD من Pexels تلقائياً |
| 🎬 **تركيب الفيديو** | MoviePy + Ken Burns Effect |
| 🚀 **نشر تلقائي** | رفع مباشر على YouTube |
| 🔑 **إدارة المفاتيح** | دعم مفاتيح Gemini متعددة مع تبديل تلقائي |
| 📊 **عرض التقدم** | شريط تقدم تفصيلي لكل خطوة |

---

## 🏗️ هيكل المشروع

\`\`\`
DrCode-Shorts-Studio/
├── main.py                    # الملف الرئيسي
├── modules/
│   ├── config_manager.py     # إدارة الإعدادات
│   ├── gemini_handler.py     # Gemini AI
│   ├── tts_handler.py        # تحويل النص لصوت
│   ├── pexels_handler.py     # البحث عن الصور
│   ├── video_maker.py        # تركيب الفيديو
│   ├── youtube_uploader.py   # النشر على YouTube
│   └── progress_tracker.py  # عرض التقدم
├── output/                    # الفيديوهات المنتجة
├── temp/                      # ملفات مؤقتة
├── assets/
│   └── fonts/                # ملفات الخطوط
├── requirements.txt
├── README.md
├── .gitignore
└── config.json               # يُنشأ تلقائياً
\`\`\`

---

## 🚀 التثبيت

### المتطلبات المسبقة

- Python 3.8+
- FFmpeg ([تحميل](https://ffmpeg.org/download.html))

### خطوات التثبيت

\`\`\`bash
# 1. استنساخ المستودع
git clone https://github.com/drcode-ai/drcode-shorts-studio.git
cd drcode-shorts-studio

# 2. تثبيت المكتبات
pip install -r requirements.txt

# 3. تشغيل الأداة
python main.py
\`\`\`

في أول تشغيل، ستُطلب منك إدخال:
- 🔑 مفتاح (أو عدة مفاتيح) Gemini API
- 🖼️ مفتاح Pexels API
- 🎤 مفتاح TTS API

---

## ⚙️ الإعداد

### الحصول على المفاتيح

| المفتاح | الرابط | مجاني؟ |
|---------|--------|---------|
| **Gemini API** | [Google AI Studio](https://makersuite.google.com/app/apikey) | ✅ |
| **Pexels API** | [Pexels Developers](https://www.pexels.com/api/) | ✅ |
| **TTS API** | Masry Vox DrCode | - |
| **YouTube API** | [Google Cloud Console](https://console.cloud.google.com) | ✅ |

### إعداد YouTube (اختياري)

1. إنشاء مشروع في [Google Cloud Console](https://console.cloud.google.com)
2. تفعيل **YouTube Data API v3**
3. إنشاء **OAuth 2.0 Client ID** (Desktop App)
4. تحميل ملف \`credentials.json\`
5. وضعه في مجلد المشروع

---

## 📖 الاستخدام

\`\`\`bash
python main.py
\`\`\`

### القائمة الرئيسية

\`\`\`
[1] 🤖  توليد فكرة تلقائياً (Trending Ideas)
[2] ✍️   إدخال فكرة يدوياً (Custom Idea)
[3] ⚙️   الإعدادات
[4] 🔑  إدارة API Keys
[5] 📂  عرض الفيديوهات المنتجة
[6] 🚪  خروج
\`\`\`

### مراحل الإنتاج

\`\`\`
[1/5] 📝 توليد السكربت     → Gemini AI
[2/5] 🎤 تحويل النص لصوت  → Masry Vox TTS
[3/5] 🖼  البحث عن الصور   → Pexels API
[4/5] 🎬 تركيب الفيديو     → MoviePy
[5/5] 📋 إعداد النشر       → Metadata
\`\`\`

---

## 🔑 إدارة مفاتيح Gemini

تدعم الأداة مفاتيح Gemini متعددة مع **تبديل تلقائي** عند وصول أي مفتاح للحد المسموح:

\`\`\`
مفتاح Gemini #1 → وصل للحد
       ↓
مفتاح Gemini #2 → نشط الآن
       ↓
مفتاح Gemini #3 → احتياطي
\`\`\`

إضافة مفاتيح: القائمة الرئيسية → [4] إدارة API Keys

---

## 📝 config.json

يُنشأ تلقائياً ويحفظ كل الإعدادات:

\`\`\`json
{
  "gemini_api_keys": ["KEY1", "KEY2", "KEY3"],
  "pexels_api_key": "YOUR_PEXELS_KEY",
  "tts_api_key": "YOUR_TTS_KEY",
  "tts_voice": "Puck",
  "tts_style": "balanced",
  "video_quality": "720p",
  "script_language": "ar",
  "output_dir": "output/"
}
\`\`\`

---

## 🎬 تنسيق الفيديو

| الإعداد | القيمة |
|---------|--------|
| التنسيق | MP4 (H.264) |
| النسبة | 9:16 (عمودي) |
| الجودة | 720p / 1080p |
| FPS | 30 |
| المدة | 30-60 ثانية |

---

## 🐛 المشاكل الشائعة

**FFmpeg غير موجود:**
\`\`\`bash
# Windows
winget install FFmpeg

# macOS
brew install ffmpeg

# Linux
sudo apt install ffmpeg
\`\`\`

**خطأ في مفتاح Gemini:**
- تحقق من صحة المفتاح
- أضف مفاتيح إضافية من القائمة الرئيسية

---

## 📄 الرخصة

MIT License - مشروع مفتوح المصدر

---

## 👨‍💻 المطور

**Dr Code** | [GitHub](https://github.com/drcode-ai)

> صُنع بـ ❤️ لمجتمع صانعي المحتوى العربي
`

}; // end CODES

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
╔══════════════════════════════════════════════════╗
║         DrCode Shorts Studio v1.0               ║
║     YouTube Shorts Automation Tool              ║
║            by Dr Code                          ║
╚══════════════════════════════════════════════════╝

GitHub: https://github.com/drcode-ai/drcode-shorts-studio
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
[bold blue]║[/]  [bold magenta]██████╗ ██████╗ [/]  [bold cyan]   ██████╗ ██████╗ ██████╗ ███████╗[/]  [bold blue]║[/]
[bold blue]║[/]  [bold magenta]██╔══██╗██╔══██╗[/]  [bold cyan]  ██╔════╝██╔═══██╗██╔══██╗██╔════╝[/]  [bold blue]║[/]
[bold blue]║[/]  [bold magenta]██║  ██║██████╔╝[/]  [bold cyan]  ██║     ██║   ██║██║  ██║█████╗  [/]  [bold blue]║[/]
[bold blue]║[/]  [bold magenta]██║  ██║██╔══██╗[/]  [bold cyan]  ██║     ██║   ██║██║  ██║██╔══╝  [/]  [bold blue]║[/]
[bold blue]║[/]  [bold magenta]██████╔╝██║  ██║[/]  [bold cyan]  ╚██████╗╚██████╔╝██████╔╝███████╗[/]  [bold blue]║[/]
[bold blue]║[/]  [bold magenta]╚═════╝ ╚═╝  ╚═╝[/]  [bold cyan]   ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝[/]  [bold blue]║[/]
[bold blue]║[/]                                                          [bold blue]║[/]
[bold blue]║[/]    [bold yellow]🎬 Shorts Studio[/] [bold white]- YouTube Shorts Automation[/]        [bold blue]║[/]
[bold blue]║[/]    [bold white]Powered by n8n & Gemini AI    v1.1[/]                 [bold blue]║[/]
[bold blue]╚══════════════════════════════════════════════════════════╝[/]
"""
        console.print(banner)
    else:
        print("=" * 62)
        print("  DrCode Shorts Studio v1.0")
        print("  YouTube Shorts Automation Tool")
        print("  by Dr Code | Powered by n8n & Gemini AI")
        print("=" * 62)


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
        return Prompt.ask("[bold cyan]اختر رقم العملية[/]", choices=["1", "2", "3", "4", "5", "6"])
    else:
        print("\n" + "=" * 50)
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
    tracker.step(1, "توليد السكربت بـ n8n Webhook...")
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
        console.print("\n")
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
        choice = Prompt.ask("[cyan]اختر[/]", choices=["1", "2", "3", "4"], default="2")
    else:
        print("\n[1] رفع على YouTube  [2] حفظ محلي  [3] معلومات النشر  [4] فيديو جديد")
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
        if RICH_AVAILABLE:
            table = Table(title="📋 معلومات النشر على YouTube", border_style="blue")
            table.add_column("الحقل", style="cyan", width=15)
            table.add_column("القيمة", style="white")
            table.add_row("📌 العنوان", result.get('title', '-'))
            desc = result.get('description', '-')
            table.add_row("📝 الوصف", desc[:100] + "..." if len(desc) > 100 else desc)
            table.add_row("🏷️  الهاشتاجات", " ".join(result.get('hashtags', [])))
            table.add_row("📂 مسار الفيديو", result.get('video', '-'))
            console.print(table)
        else:
            print(f"العنوان: {result.get('title')}")
            print(f"الوصف: {result.get('description', '')[:100]}")
            print(f"الهاشتاجات: {' '.join(result.get('hashtags', []))}")

    elif choice == "4":
        return True

    return False


def first_run_setup(config: ConfigManager):
    """First-time setup wizard."""
    if RICH_AVAILABLE:
        console.print(Panel(
            "[bold yellow]🎉 مرحباً بك في DrCode Shorts Studio!\n"
            "يبدو أن هذا أول تشغيل. سنقوم بإعداد الأداة معاً.[/]",
            border_style="yellow"
        ))
    else:
        print("\n" + "=" * 50)
        print("مرحباً! أول تشغيل - إعداد الأداة")
        print("=" * 50)

    import getpass

    # Gemini Keys
    if RICH_AVAILABLE:
        console.print("\n[bold cyan]1. مفاتيح Gemini API[/]")
        console.print("[dim]يمكنك إضافة أكثر من مفتاح لتجنب انتهاء الحد اليومي[/]")

    gemini_keys = []
    while True:
        if RICH_AVAILABLE:
            key = Prompt.ask(
                f"[yellow]مفتاح Gemini #{len(gemini_keys) + 1}[/] (اضغط Enter للإنهاء)",
                default="",
                password=True
            )
        else:
            key = getpass.getpass(f"مفتاح Gemini #{len(gemini_keys) + 1} (Enter للإنهاء): ")

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
        console.print("\n[bold cyan]2. Pexels API Key[/]")
        pexels_key = Prompt.ask("[yellow]مفتاح Pexels[/]", password=True)
    else:
        pexels_key = getpass.getpass("مفتاح Pexels: ")
    config.set('pexels_api_key', pexels_key.strip())

    # TTS API
    if RICH_AVAILABLE:
        console.print("\n[bold cyan]3. TTS API Key (Masry Vox)[/]")
        tts_key = Prompt.ask("[yellow]مفتاح TTS[/]", password=True)
    else:
        tts_key = getpass.getpass("مفتاح TTS: ")
    config.set('tts_api_key', tts_key.strip())

    # YouTube (Optional)
    if RICH_AVAILABLE:
        console.print("\n[bold cyan]4. YouTube API (اختياري)[/]")
        setup_yt = Confirm.ask("هل تريد إعداد نشر YouTube تلقائي الآن؟", default=False)
    else:
        setup_yt = input("إعداد YouTube تلقائي؟ (y/n): ").strip().lower() == 'y'

    if setup_yt:
        if RICH_AVAILABLE:
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
    for d in ['output', 'temp', 'assets', 'assets/fonts']:
        Path(d).mkdir(parents=True, exist_ok=True)

    if RICH_AVAILABLE:
        console.print("\n[bold green]✅ تم الإعداد بنجاح! الأداة جاهزة للاستخدام.[/]\n")
    else:
        print("\n✅ تم الإعداد! الأداة جاهزة.\n")


def settings_menu(config: ConfigManager):
    """Settings menu."""
    while True:
        if RICH_AVAILABLE:
            table = Table(show_header=False, border_style="dim")
            table.add_column("Option", style="cyan", width=5)
            table.add_column("Setting")
            table.add_row("[1]", f"🎤 الصوت: {config.get('tts_voice', 'Puck')}")
            table.add_row("[2]", f"🎨 النمط: {config.get('tts_style', 'balanced')}")
            table.add_row("[3]", f"📺 الجودة: {config.get('video_quality', '720p')}")
            table.add_row("[4]", f"🌍 اللغة: {config.get('script_language', 'ar')}")
            table.add_row("[5]", f"📁 الإخراج: {config.get('output_dir', 'output/')}")
            table.add_row("[6]", "🔙 رجوع")
            console.print(Panel(table, title="[bold]⚙️ الإعدادات[/]", border_style="yellow"))
            choice = Prompt.ask("[cyan]اختر[/]", choices=["1","2","3","4","5","6"])
        else:
            print("\n[1] الصوت  [2] النمط  [3] الجودة  [4] اللغة  [5] الإخراج  [6] رجوع")
            choice = input("اختر: ").strip()

        if choice == "1":
            voices = ["Puck", "Charon", "Kore", "Fenrir", "Aoede"]
            v = Prompt.ask("الصوت", choices=voices, default="Puck") if RICH_AVAILABLE else input(f"الصوت ({'/'.join(voices)}): ")
            config.set('tts_voice', v or 'Puck')
        elif choice == "2":
            styles = ["balanced", "expressive", "calm", "energetic"]
            s = Prompt.ask("النمط", choices=styles, default="balanced") if RICH_AVAILABLE else input("النمط: ")
            config.set('tts_style', s or 'balanced')
        elif choice == "3":
            q = Prompt.ask("الجودة", choices=["480p","720p","1080p"], default="720p") if RICH_AVAILABLE else input("الجودة: ")
            config.set('video_quality', q or '720p')
        elif choice == "4":
            l = Prompt.ask("اللغة (ar/en)", default="ar") if RICH_AVAILABLE else input("اللغة: ")
            config.set('script_language', l or 'ar')
        elif choice == "5":
            d = Prompt.ask("مجلد الإخراج", default="output/") if RICH_AVAILABLE else input("المجلد: ")
            config.set('output_dir', d or 'output/')
        elif choice == "6":
            break

    config.save()
    if RICH_AVAILABLE:
        console.print("[green]✅ تم حفظ الإعدادات[/]")


def manage_api_keys(config: ConfigManager):
    """Manage API keys menu."""
    import getpass

    while True:
        if RICH_AVAILABLE:
            gemini_keys = config.get_gemini_keys()
            table = Table(title="🔑 API Keys", border_style="dim")
            table.add_column("API", style="cyan", width=20)
            table.add_column("الحالة", width=12)
            table.add_column("Preview")

            for i, key in enumerate(gemini_keys):
                masked = key[:8] + "..." + key[-4:] if len(key) > 12 else "***"
                current = " (الحالي)" if i == config.get('gemini_key_index', 0) else ""
                table.add_row(f"Gemini #{i+1}{current}",
                             "[green]✓[/]" if key else "[red]✗[/]", masked)

            pk = config.get('pexels_api_key', '')
            tk = config.get('tts_api_key', '')
            table.add_row("Pexels", "[green]✓[/]" if pk else "[red]✗[/]",
                         (pk[:8]+"...") if pk else "غير محدد")
            table.add_row("TTS", "[green]✓[/]" if tk else "[red]✗[/]",
                         (tk[:8]+"...") if tk else "غير محدد")

            console.print(table)
            console.print("[cyan][1][/] إضافة Gemini  [cyan][2][/] حذف Gemini  "
                         "[cyan][3][/] Pexels  [cyan][4][/] TTS  [cyan][5][/] رجوع")
            choice = Prompt.ask("[cyan]اختر[/]", choices=["1","2","3","4","5"])
        else:
            print("\n[1] إضافة Gemini  [2] حذف Gemini  [3] Pexels  [4] TTS  [5] رجوع")
            choice = input("اختر: ").strip()

        if choice == "1":
            key = Prompt.ask("[yellow]مفتاح Gemini الجديد[/]", password=True) if RICH_AVAILABLE else getpass.getpass("مفتاح: ")
            if key.strip():
                config.add_gemini_key(key.strip())
                config.save()
                if RICH_AVAILABLE: console.print("[green]✅ تمت الإضافة[/]")
        elif choice == "2":
            keys = config.get_gemini_keys()
            if keys:
                idx = Prompt.ask(f"رقم المفتاح (1-{len(keys)})") if RICH_AVAILABLE else input(f"رقم (1-{len(keys)}): ")
                try:
                    config.remove_gemini_key(int(idx)-1)
                    config.save()
                    if RICH_AVAILABLE: console.print("[green]✅ تم الحذف[/]")
                except: pass
        elif choice == "3":
            key = Prompt.ask("[yellow]مفتاح Pexels[/]", password=True) if RICH_AVAILABLE else getpass.getpass("مفتاح Pexels: ")
            config.set('pexels_api_key', key.strip())
            config.save()
            if RICH_AVAILABLE: console.print("[green]✅ تم التحديث[/]")
        elif choice == "4":
            key = Prompt.ask("[yellow]مفتاح TTS[/]", password=True) if RICH_AVAILABLE else getpass.getpass("مفتاح TTS: ")
            config.set('tts_api_key', key.strip())
            config.save()
            if RICH_AVAILABLE: console.print("[green]✅ تم التحديث[/]")
        elif choice == "5":
            break


def show_produced_videos(config: ConfigManager):
    """Show list of produced videos."""
    output_dir = Path(config.get('output_dir', 'output/'))
    if not output_dir.exists():
        if RICH_AVAILABLE: console.print("[yellow]مجلد الإخراج فارغ[/]")
        else: print("مجلد الإخراج فارغ")
        return

    videos = sorted(output_dir.glob("*.mp4"), key=lambda x: x.stat().st_mtime, reverse=True)
    if not videos:
        if RICH_AVAILABLE: console.print("[yellow]لا توجد فيديوهات منتجة بعد[/]")
        else: print("لا توجد فيديوهات")
        return

    if RICH_AVAILABLE:
        table = Table(title=f"📂 الفيديوهات المنتجة ({len(videos)})", border_style="blue")
        table.add_column("#", style="dim", width=4)
        table.add_column("اسم الملف", style="cyan")
        table.add_column("الحجم", style="green")
        table.add_column("التاريخ")
        for i, v in enumerate(videos, 1):
            size_mb = v.stat().st_size / (1024*1024)
            mtime = time.strftime("%Y-%m-%d %H:%M", time.localtime(v.stat().st_mtime))
            table.add_row(str(i), v.name, f"{size_mb:.1f} MB", mtime)
        console.print(table)
    else:
        for i, v in enumerate(videos, 1):
            size_mb = v.stat().st_size / (1024*1024)
            print(f"{i}. {v.name} ({size_mb:.1f} MB)")


def main():
    """Main entry point."""
    print_banner()
    config = ConfigManager()
    tracker = ProgressTracker(console)

    if config.get('first_run', True):
        first_run_setup(config)

    while True:
        choice = main_menu()

        if choice == "1":
            if RICH_AVAILABLE:
                console.print("\n[cyan]🤖 جاري توليد أفكار ترند...[/]")
            else:
                print("\n🤖 جاري توليد الأفكار...")

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
                else:
                    for i, idea in enumerate(ideas, 1):
                        print(f"{i}. {idea['title']}")
                    idx = input("اختر: ").strip()

                selected_idea = ideas[int(idx)-1]['title']
                result = run_full_pipeline(selected_idea, config, tracker)
                if result:
                    handle_upload_choice(result, config, tracker)
            else:
                if RICH_AVAILABLE:
                    console.print("[red]❌ فشل توليد الأفكار. تحقق من مفتاح Gemini.[/]")
                else:
                    print("❌ فشل توليد الأفكار")

        elif choice == "2":
            if RICH_AVAILABLE:
                idea = Prompt.ask("[bold cyan]✍️  أدخل فكرة الفيديو[/]")
            else:
                idea = input("أدخل الفكرة: ").strip()
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
                console.print("[bold magenta]\n👋 إلى اللقاء! شكراً لاستخدام DrCode Shorts Studio\n[/]")
            else:
                print("\n👋 إلى اللقاء!")
            break

        if RICH_AVAILABLE:
            input("\n[dim]اضغط Enter للمتابعة...[/]")
        else:
            input("\nاضغط Enter للمتابعة...")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  تم إيقاف التشغيل")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ خطأ: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

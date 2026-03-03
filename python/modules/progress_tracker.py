#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
modules/progress_tracker.py
عرض تقدم العمل بشكل جذاب باستخدام Rich
"""

import time
from typing import Optional, Dict, Any

try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    from rich.progress import Progress, SpinnerColumn, TextColumn
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False

from .config_manager import ConfigManager


STEPS = {
    1: {"name": "توليد السكربت",     "icon": "📝", "weight": 15},
    2: {"name": "تحويل النص لصوت",  "icon": "🎤", "weight": 20},
    3: {"name": "البحث عن الصور",    "icon": "🖼 ", "weight": 20},
    4: {"name": "تركيب الفيديو",     "icon": "🎬", "weight": 35},
    5: {"name": "إعداد النشر",       "icon": "📋", "weight": 5},
    6: {"name": "النشر على YouTube", "icon": "🚀", "weight": 5},
}

TOTAL_WEIGHT = sum(s["weight"] for s in STEPS.values())


class ProgressTracker:
    """Tracks and displays pipeline progress."""

    def __init__(self, console=None):
        self.console = console
        self.current_step = 0
        self.start_time = None
        self.step_times = {}
        self.errors = []
        self.warnings = []

    def start_pipeline(self, idea: str):
        """Initialize pipeline display."""
        self.start_time = time.time()
        self.current_step = 0
        self.step_times = {}
        self.errors = []
        self.warnings = []

        if RICH_AVAILABLE and self.console:
            self.console.print()
            self.console.print(Panel(
                f"[bold white]🚀 بدء إنتاج الفيديو[/]\n"
                f"[cyan]الفكرة:[/] [white]{idea}[/]\n"
                f"[dim]{time.strftime('%H:%M:%S')}[/]",
                border_style="blue",
                title="[bold magenta]DrCode Shorts Studio[/]"
            ))
        else:
            print("\n" + "=" * 60)
            print(f"🚀 بدء الإنتاج: {idea}")
            print("=" * 60)

    def step(self, step_num: int, message: str = ""):
        """Display current step with progress bar."""
        self.current_step = step_num
        self.step_times[step_num] = time.time()

        info = STEPS.get(step_num, {"name": "خطوة", "icon": "▶", "weight": 10})

        # Calculate progress percentage
        done_weight = sum(STEPS[i]["weight"] for i in range(1, step_num))
        pct = min(95, int(done_weight / TOTAL_WEIGHT * 100))

        if RICH_AVAILABLE and self.console:
            filled = int(30 * pct / 100)
            bar = "█" * filled + "░" * (30 - filled)
            self.console.print(
                f"\n[bold blue][{step_num}/{len(STEPS)}][/] "
                f"[bold]{info['icon']} {info['name']}[/]"
                + (f"[dim]  {message}[/]" if message else "")
            )
            self.console.print(f"  [blue][{bar}][/] [cyan]{pct}%[/]")
        else:
            print(f"\n[{step_num}/{len(STEPS)}] {info['icon']} {info['name']}")
            if message:
                print(f"  → {message}")
            filled = int(40 * pct / 100)
            bar = "█" * filled + "░" * (40 - filled)
            print(f"  [{bar}] {pct}%")

    def success(self, message: str):
        if RICH_AVAILABLE and self.console:
            self.console.print(f"  [green]✓[/] {message}")
        else:
            print(f"  ✓ {message}")

    def warning(self, message: str):
        self.warnings.append(message)
        if RICH_AVAILABLE and self.console:
            self.console.print(f"  [yellow]⚠ {message}[/]")
        else:
            print(f"  ⚠ {message}")

    def error(self, message: str):
        self.errors.append(message)
        if RICH_AVAILABLE and self.console:
            self.console.print(f"  [red]✗ {message}[/]")
        else:
            print(f"  ✗ {message}")

    def info(self, message: str):
        if RICH_AVAILABLE and self.console:
            self.console.print(f"  [dim]ℹ {message}[/]")
        else:
            print(f"  ℹ {message}")

    def display_script_preview(self, script_data: Dict[str, Any]):
        """Show script summary table."""
        if not script_data:
            return

        if RICH_AVAILABLE and self.console:
            table = Table(show_header=False, border_style="dim", padding=(0, 1))
            table.add_column("Field", style="cyan", width=15)
            table.add_column("Value")

            table.add_row("📌 العنوان", str(script_data.get('title', '-'))[:60])

            script = str(script_data.get('script', ''))
            preview = script[:100] + "..." if len(script) > 100 else script
            table.add_row("📜 السكربت", preview)

            hashtags = " ".join(str(h) for h in script_data.get('hashtags', [])[:5])
            table.add_row("🏷  الهاشتاجات", hashtags or '-')

            self.console.print(table)
        else:
            print(f"  العنوان: {script_data.get('title', '-')[:60]}")
            script = str(script_data.get('script', ''))
            print(f"  السكربت: {script[:80]}...")

    def pipeline_complete(self, result: Dict[str, Any]):
        """Show completion summary."""
        elapsed = time.time() - self.start_time if self.start_time else 0
        mins = int(elapsed // 60)
        secs = int(elapsed % 60)

        if RICH_AVAILABLE and self.console:
            bar = "█" * 30
            self.console.print(f"\n  [blue][{bar}][/] [bold green]100% ✓[/]")

            content = (
                f"[bold green]✅ اكتمل الإنتاج بنجاح![/]\n\n"
                f"[white]⏱  المدة:[/] [cyan]{mins}د {secs}ث[/]\n"
                f"[white]🎬 الفيديو:[/] [cyan]{result.get('video', '-')}[/]\n"
                f"[white]📌 العنوان:[/] {str(result.get('title', '-'))[:50]}"
            )
            if self.warnings:
                content += f"\n[yellow]⚠  تحذيرات: {len(self.warnings)}[/]"

            self.console.print(Panel(content, border_style="green",
                                     title="[bold]🎉 تم الإنتاج[/]"))
        else:
            print("\n" + "=" * 60)
            print(f"✅ اكتمل في {mins}د {secs}ث")
            print(f"🎬 {result.get('video', '-')}")
            print("=" * 60)

    def get_summary(self) -> Dict:
        elapsed = time.time() - self.start_time if self.start_time else 0
        return {
            "total_time": elapsed,
            "steps_completed": self.current_step,
            "errors": self.errors,
            "warnings": self.warnings
        }

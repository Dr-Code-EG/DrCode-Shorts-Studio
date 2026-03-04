// ===========================
// DrCode Shorts Studio - Main JS
// ===========================

// ===== PARTICLES =====
function createParticles() {
    const container = document.getElementById('particles');
    const count = 30;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.cssText = `
            left: ${Math.random() * 100}%;
            animation-duration: ${8 + Math.random() * 12}s;
            animation-delay: ${Math.random() * 10}s;
            width: ${1 + Math.random() * 3}px;
            height: ${1 + Math.random() * 3}px;
            background: ${['#667eea','#f093fb','#4facfe','#43e97b'][Math.floor(Math.random()*4)]};
        `;
        container.appendChild(p);
    }
}

// ===== MOBILE MENU =====
function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('open');
}

// ===== TERMINAL ANIMATION =====
const terminalLines = [
    { text: '══════════════════════════════════════', type: 'muted', delay: 200 },
    { text: '  DrCode Shorts Studio v1.0', type: 'highlight', delay: 300 },
    { text: '  YouTube Shorts Automation Tool', type: 'info', delay: 200 },
    { text: '══════════════════════════════════════', type: 'muted', delay: 200 },
    { text: '', delay: 300 },
    { text: '✓ Loading configuration...', type: 'success', delay: 500 },
    { text: '✓ n8n Webhook: Connected', type: 'success', delay: 400 },
    { text: '✓ Pexels API: Connected', type: 'success', delay: 300 },
    { text: '✓ TTS API: Ready', type: 'success', delay: 300 },
    { text: '', delay: 200 },
    { text: '[1] Generate Idea (Auto)', type: 'info', delay: 150 },
    { text: '[2] Enter Idea (Manual)', type: 'info', delay: 100 },
    { text: '[3] Settings', type: 'info', delay: 100 },
    { text: '', delay: 200 },
    { text: '» Choose option: 1', type: 'cmd', delay: 600 },
    { text: '', delay: 200 },
    { text: '📡 Sending request to n8n...', type: 'warn', delay: 800 },
    { text: '✓ Idea: 5 AI Tools That Will...', type: 'success', delay: 600 },
    { text: '  Change Your Life Forever', type: 'success', delay: 200 },
    { text: '', delay: 200 },
    { text: '📝 Writing script...', type: 'warn', delay: 700 },
    { text: '✓ Script generated (45 sec)', type: 'success', delay: 500 },
    { text: '', delay: 200 },
    { text: '🎤 Converting text to speech...', type: 'warn', delay: 800 },
    { text: '✓ Audio: output/audio.mp3', type: 'success', delay: 600 },
    { text: '', delay: 200 },
    { text: '🖼  Searching images (Pexels)...', type: 'warn', delay: 700 },
    { text: '✓ Found 8 HD images', type: 'success', delay: 500 },
    { text: '', delay: 200 },
    { text: '🎬 Composing video...', type: 'warn', delay: 1000 },
    { text: '  ████████████████ 100%', type: 'highlight', delay: 1200 },
    { text: '✓ Video: output/shorts_001.mp4', type: 'success', delay: 500 },
    { text: '', delay: 200 },
    { text: '🚀 Uploading to YouTube...', type: 'warn', delay: 800 },
    { text: '✓ Published! youtu.be/xxxxxx', type: 'success', delay: 600 },
    { text: '', delay: 200 },
    { text: '✨ Done! Video is LIVE 🎉', type: 'highlight', delay: 300 },
];

let termIndex = 0;
let termRunning = false;

function runTerminal() {
    if (termRunning) return;
    termRunning = true;
    const body = document.getElementById('terminalBody');
    body.innerHTML = '<div class="t-line"><span class="t-prompt">$</span> <span class="t-cmd">python main.py</span></div>';
    termIndex = 0;
    addNextLine(body);
}

function addNextLine(body) {
    if (termIndex >= terminalLines.length) {
        setTimeout(() => {
            termRunning = false;
            setTimeout(() => runTerminal(), 3000);
        }, 1000);
        return;
    }
    const line = terminalLines[termIndex++];
    const div = document.createElement('div');
    div.className = 't-line';
    
    if (line.text === '') {
        div.innerHTML = '&nbsp;';
    } else {
        const typeMap = {
            success: 't-success', info: 't-info', warn: 't-warn',
            error: 't-error', highlight: 't-highlight', muted: 't-muted',
            cmd: 't-cmd'
        };
        const cls = typeMap[line.type] || 't-muted';
        div.innerHTML = `<span class="${cls}">${escapeHtml(line.text)}</span>`;
    }
    
    body.appendChild(div);
    
    // Auto-scroll
    const screen = body.closest('.phone-screen');
    if (screen) screen.scrollTop = screen.scrollHeight;
    body.scrollTop = body.scrollHeight;

    setTimeout(() => addNextLine(body), line.delay || 200);
}

function escapeHtml(text) {
    return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ===== TABS =====
function showTab(name) {
    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach(b => b.classList.remove('active'));
    
    // Find button for this tab
    btns.forEach(b => {
        const tabName = b.getAttribute('onclick').match(/'([^']+)'/)?.[1];
        if (tabName === name) b.classList.add('active');
    });
    
    const fileNames = {
        main: 'main.py',
        config: 'modules/config_manager.py',
        gemini: 'modules/gemini_handler.py',
        tts: 'modules/tts_handler.py',
        pexels: 'modules/pexels_handler.py',
        video: 'modules/video_maker.py',
        youtube: 'modules/youtube_uploader.py',
        progress: 'modules/progress_tracker.py',
        requirements: 'requirements.txt',
        readme: 'README.md'
    };
    
    document.getElementById('currentFileName').textContent = fileNames[name] || name;
    
    const codeContent = document.getElementById('codeContent');
    if (typeof CODES !== 'undefined') {
        codeContent.textContent = CODES[name] || '# Code coming soon...';
    }
}

// ===== COPY CODE =====
function copyCode(btn) {
    const pre = btn.closest('.code-block').querySelector('pre');
    const text = pre.textContent;
    copyToClipboard(text);
    btn.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => btn.innerHTML = '<i class="fas fa-copy"></i>', 2000);
}

function copyCurrentCode() {
    const code = document.getElementById('codeContent').textContent;
    copyToClipboard(code);
    showToast();
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).catch(() => legacyCopy(text));
    } else {
        legacyCopy(text);
    }
}

function legacyCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
}

function showToast() {
    const t = document.getElementById('toast');
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// ===== SCROLL ANIMATIONS =====
function initScrollAnimations() {
    const cards = document.querySelectorAll('.feature-card, .pipeline-step, .req-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    cards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.5s ease ${i * 0.08}s, transform 0.5s ease ${i * 0.08}s`;
        observer.observe(card);
    });
}

// ===== HEADER SCROLL =====
function initHeaderScroll() {
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.background = 'rgba(10, 10, 15, 0.98)';
        } else {
            header.style.background = 'rgba(10, 10, 15, 0.85)';
        }
    });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    initScrollAnimations();
    initHeaderScroll();
    
    // Start terminal after short delay
    setTimeout(runTerminal, 1000);
    
    // Load first tab
    const codeContent = document.getElementById('codeContent');
    if (codeContent && typeof CODES !== 'undefined') {
        codeContent.textContent = CODES['main'] || '';
    }
    
    // Close menu on outside click
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('mobileMenu');
        const hamburger = document.querySelector('.hamburger');
        if (!menu.contains(e.target) && !hamburger.contains(e.target)) {
            menu.classList.remove('open');
        }
    });
});

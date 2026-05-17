// Global Audio Manager
class AudioManager {
    constructor() {
        this.currentAudio = null;
        this.isPlaying = false;
        this.volume = localStorage.getItem('audioVolume') ? parseInt(localStorage.getItem('audioVolume')) : 70;
        this.autoPlay = localStorage.getItem('autoPlay') === 'true';
        this.soundEnabled = localStorage.getItem('soundAlarm') !== 'false';
    }

    play(audioUrl) {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }

        // Cek apakah suara diaktifkan
        if (!this.soundEnabled) {
            console.log('Suara dimatikan oleh pengaturan');
            this.showNotification('Suara sedang OFF');
            return;
        }

        // Simulasi audio - di sini nanti Anda bisa mengganti dengan file audio asli
        const audio = new Audio();
        audio.volume = this.volume / 100;
        
        // Untuk demo, kita hanya simulasi
        console.log(`Memutar audio: ${audioUrl}`);
        
        // Tampilkan notifikasi
        this.showNotification('Memutar audio...');
        
        return audio;
    }

    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
            this.isPlaying = false;
        }
    }

    setVolume(value) {
        this.volume = value;
        localStorage.setItem('audioVolume', value);
        if (this.currentAudio) {
            this.currentAudio.volume = value / 100;
        }
    }

    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
        localStorage.setItem('soundAlarm', enabled);
    }

    showNotification(message) {
        // Create notification element
        const notif = document.createElement('div');
        notif.className = 'audio-notification';
        notif.textContent = message;
        notif.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: #2e7d64;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            z-index: 1000;
            animation: fadeOut 2s ease forwards;
        `;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 2000);
    }
}

// Theme Manager
class ThemeManager {
    constructor() {
        this.darkMode = localStorage.getItem('darkMode') === 'true';
        this.init();
    }

    init() {
        if (this.darkMode) {
            document.body.classList.add('dark-mode');
        }
        this.setupFontSize();
    }

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        localStorage.setItem('darkMode', this.darkMode);
        document.body.classList.toggle('dark-mode');
    }

    setupFontSize() {
        const fontSize = localStorage.getItem('fontSize') || 'medium';
        const sizes = { small: '13px', medium: '16px', large: '18px', xlarge: '20px' };
        document.body.style.fontSize = sizes[fontSize] || '16px';
        
        // Apply to Arabic and Latin texts
        const arabSizes = { small: '1.1rem', medium: '1.3rem', large: '1.6rem', xlarge: '2rem' };
        const latinSizes = { small: '0.85rem', medium: '1rem', large: '1.2rem', xlarge: '1.4rem' };
        
        document.querySelectorAll('.arab-text, .arabic-dzikir, .step-arabic, .arab-preview').forEach(el => {
            el.style.fontSize = arabSizes[fontSize] || '1.3rem';
        });
        
        document.querySelectorAll('.latin-text, .latin-dzikir, .latin-preview').forEach(el => {
            el.style.fontSize = latinSizes[fontSize] || '1rem';
        });
    }
}

// Initialize
const audioManager = new AudioManager();
const themeManager = new ThemeManager();

// Update next prayer info di beranda
function updateHomeNextPrayer() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Simulasi jadwal - nanti akan sync dengan jadwal.js
    const prayerTimes = {
        subuh: "04:40",
        dzuhur: "12:00",
        ashar: "15:15",
        maghrib: "18:00",
        isya: "19:15"
    };
    
    const prayers = [
        { name: 'Subuh', time: prayerTimes.subuh },
        { name: 'Dzuhur', time: prayerTimes.dzuhur },
        { name: 'Ashar', time: prayerTimes.ashar },
        { name: 'Maghrib', time: prayerTimes.maghrib },
        { name: 'Isya', time: prayerTimes.isya }
    ];
    
    let nextPrayer = null;
    for (let prayer of prayers) {
        const [hours, minutes] = prayer.time.split(':');
        const prayerTime = parseInt(hours) * 60 + parseInt(minutes);
        const currentTime = currentHour * 60 + currentMinute;
        
        if (prayerTime > currentTime) {
            nextPrayer = prayer;
            break;
        }
    }
    
    if (!nextPrayer) {
        nextPrayer = prayers[0];
    }
    
    const nextPrayerNameEl = document.getElementById('nextPrayerHome');
    const nextPrayerTimeEl = document.getElementById('nextPrayerTimeHome');
    
    if (nextPrayerNameEl) nextPrayerNameEl.textContent = nextPrayer.name;
    if (nextPrayerTimeEl) nextPrayerTimeEl.textContent = nextPrayer.time;
}

// Setup all event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Setup all audio buttons
    document.querySelectorAll('.audio-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const audioFile = btn.getAttribute('data-audio') || 'default';
            audioManager.play(`/assets/audio/${audioFile}.mp3`);
        });
    });

    // Setup back buttons
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.history.back();
        });
    });

    // Setup tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Setup favorite buttons
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('active');
            const icon = this.querySelector('i');
            if (this.classList.contains('active')) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                icon.style.color = '#ff6b6b';
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                icon.style.color = '';
            }
        });
    });

    // Search functionality
    const searchInput = document.getElementById('searchDoa');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            document.querySelectorAll('.doa-card').forEach(card => {
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(searchTerm) ? 'block' : 'none';
            });
        });
    }

    // ========== SOUND TOGGLE HANDLERS UNTUK PENGATURAN ==========
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
        soundToggle.checked = localStorage.getItem('soundAlarm') !== 'false';
        soundToggle.addEventListener('change', (e) => {
            localStorage.setItem('soundAlarm', e.target.checked);
            if (audioManager) {
                audioManager.setSoundEnabled(e.target.checked);
            }
        });
    }

    const dzikirSoundToggle = document.getElementById('dzikirSoundToggle');
    if (dzikirSoundToggle) {
        dzikirSoundToggle.checked = localStorage.getItem('soundDzikir') !== 'false';
        dzikirSoundToggle.addEventListener('change', (e) => {
            localStorage.setItem('soundDzikir', e.target.checked);
        });
    }

    const doaSoundToggle = document.getElementById('doaSoundToggle');
    if (doaSoundToggle) {
        doaSoundToggle.checked = localStorage.getItem('soundDoa') !== 'false';
        doaSoundToggle.addEventListener('change', (e) => {
            localStorage.setItem('soundDoa', e.target.checked);
        });
    }
    // ========== SAMPAI SINI ==========

    // Settings handlers
    const darkModeToggle = document.getElementById('darkMode');
    if (darkModeToggle) {
        darkModeToggle.checked = localStorage.getItem('darkMode') === 'true';
        darkModeToggle.addEventListener('change', () => themeManager.toggleDarkMode());
    }

    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        volumeSlider.value = localStorage.getItem('audioVolume') || 70;
        const volumeValue = document.getElementById('volumeValue');
        if (volumeValue) {
            volumeValue.textContent = volumeSlider.value + '%';
        }
        volumeSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            if (volumeValue) volumeValue.textContent = value + '%';
            audioManager.setVolume(value);
        });
    }

    const fontSizeSelect = document.getElementById('fontSize');
    if (fontSizeSelect) {
        fontSizeSelect.value = localStorage.getItem('fontSize') || 'medium';
        fontSizeSelect.addEventListener('change', (e) => {
            localStorage.setItem('fontSize', e.target.value);
            themeManager.setupFontSize();
            if (window.fontManager && window.fontManager.applyFontSize) {
                window.fontManager.currentSize = e.target.value;
                window.fontManager.applyFontSize();
            }
        });
    }

    const resetSettings = document.getElementById('resetSettings');
    if (resetSettings) {
        resetSettings.addEventListener('click', () => {
            localStorage.clear();
            // Set defaults
            localStorage.setItem('fontSize', 'medium');
            localStorage.setItem('appLanguage', 'id');
            localStorage.setItem('darkMode', 'false');
            localStorage.setItem('audioVolume', '70');
            localStorage.setItem('autoPlay', 'false');
            localStorage.setItem('adzanNotif', 'false');
            localStorage.setItem('dzikirNotif', 'false');
            localStorage.setItem('soundAlarm', 'true');
            localStorage.setItem('soundDzikir', 'true');
            localStorage.setItem('soundDoa', 'true');
            location.reload();
        });
    }
    
    // Panggil fungsi updateHomeNextPrayer setelah DOM siap
    updateHomeNextPrayer();
    setInterval(updateHomeNextPrayer, 60000);
});

// Add CSS for dark mode
const style = document.createElement('style');
style.textContent = `
    .dark-mode {
        background: #1a1a2e;
        color: #e0e0e0;
    }
    .dark-mode .app-container {
        background: #16213e;
    }
    .dark-mode .header {
        background: linear-gradient(135deg, #1a5d4a 0%, #0d3d2f 100%);
    }
    .dark-mode .menu-card,
    .dark-mode .prayer-card,
    .dark-mode .doa-card,
    .dark-mode .sholawat-card,
    .dark-mode .settings-section {
        background: #1f2a4e;
        color: #e0e0e0;
        border-color: #2a3a6e;
    }
    .dark-mode .greeting {
        background: linear-gradient(135deg, #1f2a4e 0%, #16213e 100%);
    }
    .dark-mode .dzikir-item {
        background: #1f2a4e;
    }
    .dark-mode .prayer-time-card {
        background: #1f2a4e;
        border-color: #2a3a6e;
    }
    .dark-mode .step {
        background: #1f2a4e;
    }
    .dark-mode .select-wrapper select {
        background: #1f2a4e;
        color: #e0e0e0;
        border-color: #2a3a6e;
    }
    .dark-mode .search-box input {
        background: #1f2a4e;
        color: #e0e0e0;
        border-color: #2a3a6e;
    }
    .dark-mode .bottom-nav {
        background: #16213e;
        border-top-color: #2a3a6e;
    }
    .dark-mode .counter-btn.reset {
        background: #2a3a6e;
        color: #e0e0e0;
    }
    .dark-mode .setting-item {
        border-bottom-color: #2a3a6e;
    }
    .dark-mode .hero-section {
        background: linear-gradient(135deg, #1a5d4a 0%, #0d3d2f 100%);
    }
    .dark-mode .next-prayer-card {
        background: #1f2a4e;
        border-color: #2a3a6e;
    }
    .dark-mode .next-prayer-info strong {
        color: #e0e0e0;
    }
    .dark-mode .quote-card {
        background: linear-gradient(135deg, #1f2a4e 0%, #16213e 100%);
    }
    .dark-mode .quote-card p {
        color: #4caf50;
    }
    @keyframes fadeOut {
        0% { opacity: 1; }
        70% { opacity: 1; }
        100% { opacity: 0; visibility: hidden; }
    }
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    .toast-message {
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: #2e7d64;
        color: white;
        padding: 12px 24px;
        border-radius: 50px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 2000;
        animation: slideUp 0.3s ease, fadeOut 0.3s ease 1.2s forwards;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    :root {
        --font-size-base: 16px;
        --font-size-arabic: 1.3rem;
        --font-size-latin: 1rem;
    }
`;
document.head.appendChild(style);
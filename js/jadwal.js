// Prayer Times Manager with Location & Notifications - PERMANENT GPS VERSION WITH TOGGLE
class PrayerTimesManager {
    constructor() {
        this.latitude = -6.2088;
        this.longitude = 106.8456;
        this.city = 'Jakarta';
        this.prayerTimes = {};
        this.activeAlarms = JSON.parse(localStorage.getItem('prayerAlarms')) || [];
        this.userTimeZone = 'Asia/Jakarta';
        this.alarmInterval = null;
        this.init();
    }

    init() {
        this.loadSavedAlarms();
        this.loadSavedLocation();
        
        // Listen to location updates from LocationManager
        window.addEventListener('locationUpdated', (e) => {
            if (e.detail) {
                this.latitude = e.detail.latitude;
                this.longitude = e.detail.longitude;
                this.city = e.detail.city;
                this.userTimeZone = e.detail.timeZone;
                this.updatePrayerTimes();
                this.updateRealTimeClock();
            }
        });
        
        this.updatePrayerTimes();
        this.startRealTimeClock();
        setInterval(() => this.updateCountdown(), 1000);
        setInterval(() => this.checkAlarms(), 10000);
        this.setupEventListeners();
    }

    startRealTimeClock() {
        this.updateRealTimeClock();
        setInterval(() => this.updateRealTimeClock(), 1000);
    }

    updateRealTimeClock() {
        const now = new Date();
        
        const timeOptions = {
            timeZone: this.userTimeZone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        
        const dateOptions = {
            timeZone: this.userTimeZone,
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        const timeString = now.toLocaleTimeString('id-ID', timeOptions);
        const dateString = now.toLocaleDateString('id-ID', dateOptions);
        
        let tzName = 'WIB';
        if (this.userTimeZone === 'Asia/Makassar') tzName = 'WITA';
        else if (this.userTimeZone === 'Asia/Jayapura') tzName = 'WIT';
        
        const clockTimeEl = document.getElementById('clockTime');
        const clockDateEl = document.getElementById('clockDate');
        const clockTimezoneEl = document.getElementById('clockTimezone');
        
        if (clockTimeEl) clockTimeEl.textContent = timeString;
        if (clockDateEl) clockDateEl.textContent = dateString;
        if (clockTimezoneEl) clockTimezoneEl.textContent = tzName;
    }

    loadSavedLocation() {
        const savedLat = localStorage.getItem('userLatitude');
        const savedLon = localStorage.getItem('userLongitude');
        const savedCity = localStorage.getItem('userCity');
        const savedTimeZone = localStorage.getItem('userTimeZone');
        
        if (savedLat && savedLon) {
            this.latitude = parseFloat(savedLat);
            this.longitude = parseFloat(savedLon);
            this.city = savedCity || 'Lokasi Anda';
            if (savedTimeZone) this.userTimeZone = savedTimeZone;
            
            const cityNameEl = document.getElementById('cityName');
            const provinceNameEl = document.getElementById('provinceName');
            if (cityNameEl) cityNameEl.textContent = this.city;
            if (provinceNameEl && savedCity) provinceNameEl.textContent = localStorage.getItem('userProvince') || '';
        }
    }

    setupEventListeners() {
        const locationBtn = document.getElementById('getLocationBtn');
        if (locationBtn) {
            locationBtn.addEventListener('click', () => this.getUserLocation());
        }

        const applyCityBtn = document.getElementById('applyCityBtn');
        if (applyCityBtn) {
            applyCityBtn.addEventListener('click', () => this.getCityCoordinates());
        }

        document.querySelectorAll('.prayer-alarm').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => this.toggleAlarm(e));
            const prayerName = checkbox.getAttribute('data-prayer');
            if (this.activeAlarms.includes(prayerName)) {
                checkbox.checked = true;
            }
        });

        // ========== GPS TOGGLE EVENT LISTENER ==========
        const gpsToggle = document.getElementById('gpsToggle');
        if (gpsToggle) {
            // Set initial state dari LocationManager
            if (window.locationManager) {
                gpsToggle.checked = window.locationManager.isGpsActive;
                const gpsStatusText = document.getElementById('gpsStatusText');
                if (gpsStatusText) {
                    gpsStatusText.textContent = window.locationManager.isGpsActive ? 'GPS: ON' : 'GPS: OFF';
                    gpsStatusText.style.color = window.locationManager.isGpsActive ? '#4caf50' : '#f44336';
                }
            }
            
            // Event change untuk toggle
            gpsToggle.addEventListener('change', (e) => {
                if (window.locationManager) {
                    window.locationManager.toggleGps();
                    
                    // Update status text
                    const gpsStatusText = document.getElementById('gpsStatusText');
                    if (gpsStatusText) {
                        gpsStatusText.textContent = e.target.checked ? 'GPS: ON' : 'GPS: OFF';
                        gpsStatusText.style.color = e.target.checked ? '#4caf50' : '#f44336';
                    }
                    
                    // Update lokasi setelah toggle
                    setTimeout(() => {
                        if (e.target.checked && window.locationManager.latitude) {
                            this.latitude = window.locationManager.latitude;
                            this.longitude = window.locationManager.longitude;
                            this.city = window.locationManager.city;
                            this.userTimeZone = window.locationManager.timeZone;
                        } else if (!e.target.checked && window.locationManager.latitude) {
                            this.latitude = window.locationManager.latitude;
                            this.longitude = window.locationManager.longitude;
                            this.city = window.locationManager.city;
                            this.userTimeZone = window.locationManager.timeZone;
                        }
                        this.updatePrayerTimes();
                        this.updateRealTimeClock();
                    }, 100);
                }
            });
        }
        // ========== END GPS TOGGLE ==========
    }

    getUserLocation() {
        // Cek apakah GPS aktif dari LocationManager
        if (window.locationManager && !window.locationManager.isGpsActive) {
            this.showToast('GPS sedang OFF. Aktifkan GPS terlebih dahulu.', 'warning');
            return;
        }
        
        if (!navigator.geolocation) {
            this.showToast('Browser Anda tidak mendukung GPS', 'error');
            return;
        }

        const locationBtn = document.getElementById('getLocationBtn');
        if (locationBtn) {
            locationBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Mendapatkan lokasi...';
            locationBtn.disabled = true;
        }
        
        this.showToast('Mengaktifkan GPS, mohon izinkan akses lokasi...', 'info');
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.latitude = position.coords.latitude;
                this.longitude = position.coords.longitude;
                
                localStorage.setItem('userLatitude', this.latitude);
                localStorage.setItem('userLongitude', this.longitude);
                
                this.getTimeZoneFromCoordinates();
                this.getCityFromCoordinates();
                this.updatePrayerTimes();
                this.updateRealTimeClock();
                this.showToast('Lokasi berhasil didapatkan! Jadwal sholat diperbarui', 'success');
                
                if (locationBtn) {
                    locationBtn.innerHTML = '<i class="fas fa-location-dot"></i> Aktifkan Lokasi Saya';
                    locationBtn.disabled = false;
                }
            },
            (error) => {
                console.log('Gagal mendapatkan lokasi:', error);
                
                if (locationBtn) {
                    locationBtn.innerHTML = '<i class="fas fa-location-dot"></i> Aktifkan Lokasi Saya';
                    locationBtn.disabled = false;
                }
                
                let errorMessage = 'Gagal mendapatkan lokasi. ';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += 'Izin lokasi ditolak. Silakan aktifkan GPS di pengaturan browser.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += 'Informasi lokasi tidak tersedia.';
                        break;
                    case error.TIMEOUT:
                        errorMessage += 'Waktu permintaan lokasi habis.';
                        break;
                    default:
                        errorMessage += 'Terjadi kesalahan.';
                }
                this.showToast(errorMessage, 'error');
                this.updatePrayerTimes();
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }

    getTimeZoneFromCoordinates() {
        if (this.longitude >= 120) {
            this.userTimeZone = 'Asia/Jayapura';
        } else if (this.longitude >= 108) {
            this.userTimeZone = 'Asia/Makassar';
        } else {
            this.userTimeZone = 'Asia/Jakarta';
        }
        
        localStorage.setItem('userTimeZone', this.userTimeZone);
        this.updateRealTimeClock();
        
        return this.userTimeZone;
    }

    getCityFromCoordinates() {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${this.latitude}&lon=${this.longitude}&zoom=10`;
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.address) {
                    this.city = data.address.city || data.address.town || data.address.village || 'Lokasi Anda';
                    const province = data.address.state || data.address.province || '';
                    const cityNameEl = document.getElementById('cityName');
                    const provinceNameEl = document.getElementById('provinceName');
                    
                    if (cityNameEl) cityNameEl.textContent = this.city;
                    if (provinceNameEl) provinceNameEl.textContent = province;
                    
                    localStorage.setItem('userCity', this.city);
                    localStorage.setItem('userProvince', province);
                }
            })
            .catch(error => {
                console.log('Gagal mendapatkan nama kota:', error);
                const cityNameEl = document.getElementById('cityName');
                if (cityNameEl) cityNameEl.textContent = 'Lokasi GPS';
            });
    }

    getCityCoordinates() {
        const citySelect = document.getElementById('citySelect');
        if (!citySelect) return;
        
        const selectedCity = citySelect.value;
        
        const cityCoordinates = {
            jakarta: { lat: -6.2088, lon: 106.8456, name: 'Jakarta', tz: 'Asia/Jakarta', province: 'DKI Jakarta' },
            surabaya: { lat: -7.2575, lon: 112.7521, name: 'Surabaya', tz: 'Asia/Jakarta', province: 'Jawa Timur' },
            bandung: { lat: -6.9175, lon: 107.6191, name: 'Bandung', tz: 'Asia/Jakarta', province: 'Jawa Barat' },
            medan: { lat: 3.5952, lon: 98.6722, name: 'Medan', tz: 'Asia/Jakarta', province: 'Sumatera Utara' },
            makassar: { lat: -5.1477, lon: 119.4327, name: 'Makassar', tz: 'Asia/Makassar', province: 'Sulawesi Selatan' },
            semarang: { lat: -6.9667, lon: 110.4167, name: 'Semarang', tz: 'Asia/Jakarta', province: 'Jawa Tengah' },
            yogyakarta: { lat: -7.7956, lon: 110.3695, name: 'Yogyakarta', tz: 'Asia/Jakarta', province: 'DIY Yogyakarta' },
            palembang: { lat: -2.9761, lon: 104.7754, name: 'Palembang', tz: 'Asia/Jakarta', province: 'Sumatera Selatan' },
            bali: { lat: -8.4095, lon: 115.1889, name: 'Denpasar', tz: 'Asia/Makassar', province: 'Bali' },
            aceh: { lat: 5.5483, lon: 95.3238, name: 'Banda Aceh', tz: 'Asia/Jakarta', province: 'Aceh' }
        };
        
        const coords = cityCoordinates[selectedCity];
        if (coords) {
            this.latitude = coords.lat;
            this.longitude = coords.lon;
            this.city = coords.name;
            this.userTimeZone = coords.tz;
            
            const cityNameEl = document.getElementById('cityName');
            const provinceNameEl = document.getElementById('provinceName');
            
            if (cityNameEl) cityNameEl.textContent = this.city;
            if (provinceNameEl) provinceNameEl.textContent = coords.province;
            
            localStorage.setItem('userLatitude', this.latitude);
            localStorage.setItem('userLongitude', this.longitude);
            localStorage.setItem('userCity', this.city);
            localStorage.setItem('userProvince', coords.province);
            localStorage.setItem('userTimeZone', this.userTimeZone);
            
            this.updateRealTimeClock();
            this.updatePrayerTimes();
            this.showToast(`Kota ${this.city} diterapkan`, 'success');
        }
    }

    getPrayerTimes() {
        const date = new Date();
        const times = this.calculatePrayerTimes(date);
        
        const imsakEl = document.getElementById('imsak');
        const subuhEl = document.getElementById('subuh');
        const dhuhaEl = document.getElementById('dhuha');
        const dzuhurEl = document.getElementById('dzuhur');
        const asharEl = document.getElementById('ashar');
        const maghribEl = document.getElementById('maghrib');
        const isyaEl = document.getElementById('isya');
        const tahajudEl = document.getElementById('tahajud');
        
        if (imsakEl) imsakEl.textContent = times.imsak;
        if (subuhEl) subuhEl.textContent = times.subuh;
        if (dhuhaEl) dhuhaEl.textContent = times.dhuha;
        if (dzuhurEl) dzuhurEl.textContent = times.dzuhur;
        if (asharEl) asharEl.textContent = times.ashar;
        if (maghribEl) maghribEl.textContent = times.maghrib;
        if (isyaEl) isyaEl.textContent = times.isya;
        if (tahajudEl) tahajudEl.textContent = times.tahajud;
        
        return times;
    }

    calculatePrayerTimes(date) {
        const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
        
        let tzOffset = 0;
        if (this.userTimeZone === 'Asia/Jayapura') tzOffset = 2;
        else if (this.userTimeZone === 'Asia/Makassar') tzOffset = 1;
        else tzOffset = 0;
        
        const subuhOffset = Math.sin(dayOfYear * Math.PI / 365) * 30;
        const maghribOffset = Math.cos(dayOfYear * Math.PI / 365) * 20;
        
        const times = {
            imsak: this.formatTime(4, 30 + Math.floor(subuhOffset / 60) + tzOffset, (subuhOffset % 60)),
            subuh: this.formatTime(4, 40 + Math.floor(subuhOffset / 60) + tzOffset, (subuhOffset % 60)),
            dhuha: this.formatTime(6, 30 + tzOffset, 0),
            dzuhur: this.formatTime(12, 0 + tzOffset, 0),
            ashar: this.formatTime(15, 15 + tzOffset, 0),
            maghrib: this.formatTime(18, 0 + Math.floor(maghribOffset / 60) + tzOffset, (maghribOffset % 60)),
            isya: this.formatTime(19, 15 + Math.floor(maghribOffset / 60) + tzOffset, (maghribOffset % 60)),
            tahajud: this.formatTime(2, 0 + tzOffset, 0)
        };
        
        return times;
    }

    formatTime(hour, minute, second = 0) {
        const h = (hour + Math.floor(minute / 60)) % 24;
        const m = Math.abs(minute % 60);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    updatePrayerTimes() {
        this.prayerTimes = this.getPrayerTimes();
        this.updateNextPrayer();
        this.updateHijriDate();
        this.updateAlarmsList();
    }

    updateHijriDate() {
        const now = new Date();
        const currentHijriEl = document.getElementById('currentHijri');
        
        if (!currentHijriEl) return;
        
        const hijriMonths = ['Muharram', 'Safar', 'Rabiul Awal', 'Rabiul Akhir', 'Jumadil Awal', 'Jumadil Akhir', 'Rajab', 'Sya\'ban', 'Ramadan', 'Syawal', 'Dzulqa\'dah', 'Dzulhijjah'];
        const hijriDay = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000) % 354;
        const hijriMonth = Math.floor(hijriDay / 29.5);
        
        currentHijriEl.textContent = `${hijriDay % 30 + 1} ${hijriMonths[hijriMonth]} ${now.getFullYear() - 579} H`;
    }

    updateNextPrayer() {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const prayers = [
            { name: 'Subuh', time: this.parseTime(this.prayerTimes.subuh), key: 'subuh' },
            { name: 'Dzuhur', time: this.parseTime(this.prayerTimes.dzuhur), key: 'dzuhur' },
            { name: 'Ashar', time: this.parseTime(this.prayerTimes.ashar), key: 'ashar' },
            { name: 'Maghrib', time: this.parseTime(this.prayerTimes.maghrib), key: 'maghrib' },
            { name: 'Isya', time: this.parseTime(this.prayerTimes.isya), key: 'isya' }
        ];
        
        let nextPrayer = null;
        for (let prayer of prayers) {
            if (prayer.time > currentTime) {
                nextPrayer = prayer;
                break;
            }
        }
        
        if (!nextPrayer) {
            nextPrayer = prayers[0];
            nextPrayer.time += 24 * 60;
        }
        
        const nextPrayerNameEl = document.getElementById('nextPrayerName');
        const nextPrayerTimeEl = document.getElementById('nextPrayerTime');
        
        if (nextPrayerNameEl) nextPrayerNameEl.textContent = nextPrayer.name;
        if (nextPrayerTimeEl) nextPrayerTimeEl.textContent = this.formatTimeFromMinutes(nextPrayer.time);
        
        this.nextPrayerTime = nextPrayer.time;
    }

    updateCountdown() {
        if (!this.nextPrayerTime) return;
        
        const now = new Date();
        const currentTotal = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        
        let targetTotal = this.nextPrayerTime * 60;
        let diff = targetTotal - currentTotal;
        
        if (diff < 0) {
            diff += 24 * 3600;
            this.updateNextPrayer();
            targetTotal = this.nextPrayerTime * 60;
            diff = targetTotal - currentTotal;
            if (diff < 0) diff += 24 * 3600;
        }
        
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        
        const countdownEl = document.getElementById('countdown');
        if (countdownEl) {
            countdownEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            
            if (diff < 3600) {
                countdownEl.style.color = '#ff9800';
            } else if (diff < 600) {
                countdownEl.style.color = '#ff5722';
            } else {
                countdownEl.style.color = '#2e7d64';
            }
        }
    }

    parseTime(timeStr) {
        if (!timeStr) return 0;
        const [hours, minutes] = timeStr.split(':');
        return parseInt(hours) * 60 + parseInt(minutes);
    }

    formatTimeFromMinutes(minutes) {
        const hours = Math.floor(minutes / 60) % 24;
        const mins = minutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }

    toggleAlarm(event) {
        const checkbox = event.target;
        const prayerName = checkbox.getAttribute('data-prayer');
        
        if (checkbox.checked) {
            if (!this.activeAlarms.includes(prayerName)) {
                this.activeAlarms.push(prayerName);
                this.showToast(`Alarm ${prayerName} diaktifkan`, 'success');
                this.requestNotificationPermission();
            }
        } else {
            this.activeAlarms = this.activeAlarms.filter(p => p !== prayerName);
            this.showToast(`Alarm ${prayerName} dinonaktifkan`, 'info');
        }
        
        localStorage.setItem('prayerAlarms', JSON.stringify(this.activeAlarms));
        this.updateAlarmsList();
    }

    loadSavedAlarms() {
        document.querySelectorAll('.prayer-alarm').forEach(checkbox => {
            const prayerName = checkbox.getAttribute('data-prayer');
            checkbox.checked = this.activeAlarms.includes(prayerName);
        });
    }

    updateAlarmsList() {
        const alarmsList = document.getElementById('activeAlarmsList');
        if (!alarmsList) return;
        
        if (this.activeAlarms.length === 0) {
            alarmsList.innerHTML = '<p class="no-alarms"><i class="fas fa-bell-slash"></i> Belum ada alarm yang diaktifkan</p>';
            return;
        }
        
        const prayerNames = {
            imsak: 'Imsak',
            subuh: 'Subuh',
            dhuha: 'Dhuha',
            dzuhur: 'Dzuhur',
            ashar: 'Ashar',
            maghrib: 'Maghrib',
            isya: 'Isya',
            tahajud: 'Tahajud'
        };
        
        alarmsList.innerHTML = this.activeAlarms.map(prayer => `
            <div class="alarm-item">
                <i class="fas fa-bell"></i>
                <span>${prayerNames[prayer] || prayer}</span>
                <span class="alarm-time">${this.prayerTimes[prayer] || '--:--'}</span>
                <button class="remove-alarm" data-prayer="${prayer}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        
        document.querySelectorAll('.remove-alarm').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const prayer = btn.getAttribute('data-prayer');
                this.activeAlarms = this.activeAlarms.filter(p => p !== prayer);
                localStorage.setItem('prayerAlarms', JSON.stringify(this.activeAlarms));
                
                const checkbox = document.querySelector(`.prayer-alarm[data-prayer="${prayer}"]`);
                if (checkbox) checkbox.checked = false;
                
                this.updateAlarmsList();
                this.showToast(`Alarm ${prayer} dihapus`, 'info');
            });
        });
    }

    checkAlarms() {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        this.activeAlarms.forEach(prayer => {
            const prayerTime = this.prayerTimes[prayer];
            if (prayerTime === currentTime) {
                this.triggerAlarm(prayer);
            }
        });
    }

    triggerAlarm(prayer) {
        if (Notification.permission === 'granted') {
            new Notification(`Waktu Sholat ${prayer.toUpperCase()}`, {
                body: `Sudah masuk waktu sholat ${prayer}. Segera tunaikan sholat!`,
                tag: `prayer-${prayer}`,
                requireInteraction: true
            });
        }
        
        this.playAlarmSound();
        this.showToast(`Waktu Sholat ${prayer.toUpperCase()} telah tiba!`, 'alarm');
        
        if (navigator.vibrate) {
            navigator.vibrate([500, 200, 500]);
        }
    }

    playAlarmSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 880;
            gainNode.gain.value = 0.3;
            
            oscillator.start();
            setTimeout(() => {
                oscillator.stop();
                audioContext.close();
            }, 2000);
        } catch(e) {
            console.log('Audio tidak tersedia');
        }
    }

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }

    showToast(message, type = 'info') {
        const existingToast = document.querySelector('.toast-message');
        if (existingToast) existingToast.remove();
        
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        
        let icon = 'fa-info-circle';
        let bgColor = '#2e7d64';
        
        if (type === 'success') {
            icon = 'fa-check-circle';
            bgColor = '#4caf50';
        } else if (type === 'error') {
            icon = 'fa-exclamation-circle';
            bgColor = '#f44336';
        } else if (type === 'warning') {
            icon = 'fa-exclamation-triangle';
            bgColor = '#ff9800';
        } else if (type === 'alarm') {
            icon = 'fa-bell';
            bgColor = '#ff9800';
        }
        
        toast.style.background = bgColor;
        toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Initialize
const prayerTimes = new PrayerTimesManager();


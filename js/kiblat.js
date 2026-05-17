// Kiblat Manager - Simple & Functional
class KiblatManager {
    constructor() {
        this.currentHeading = 0;
        this.qiblaAngle = 0;
        this.userLat = null;
        this.userLon = null;
        this.compassActive = false;
        this.kaabaLat = 21.4225;
        this.kaabaLon = 39.8262;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadLocation();
    }

    loadLocation() {
        // Ambil lokasi dari LocationManager yang sudah permanen
        if (window.locationManager) {
            const loc = window.locationManager.getLocation();
            if (loc && loc.latitude) {
                this.userLat = loc.latitude;
                this.userLon = loc.longitude;
                this.calculateQibla();
                this.updateDistance();
                this.updateLocationDisplay();
            }
        }

        // Listen untuk update lokasi
        window.addEventListener('locationUpdated', (e) => {
            if (e.detail) {
                this.userLat = e.detail.latitude;
                this.userLon = e.detail.longitude;
                this.calculateQibla();
                this.updateDistance();
                this.updateLocationDisplay();
                this.updateGpsStatus(true);
            }
        });
    }

    calculateQibla() {
        if (!this.userLat || !this.userLon) return;

        // Rumus Qibla (Spherical Law of Cosines)
        const lat1 = this.userLat * Math.PI / 180;
        const lon1 = this.userLon * Math.PI / 180;
        const lat2 = this.kaabaLat * Math.PI / 180;
        const lon2 = this.kaabaLon * Math.PI / 180;
        
        const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
        let bearing = Math.atan2(y, x) * 180 / Math.PI;
        bearing = (bearing + 360) % 360;
        
        this.qiblaAngle = Math.round(bearing);
        
        // Update tampilan
        const qiblaEl = document.getElementById('qiblaAngle');
        if (qiblaEl) qiblaEl.textContent = this.qiblaAngle;
        
        // Update pointer kiblat
        this.updateKiblatPointer();
    }

    updateDistance() {
        if (!this.userLat || !this.userLon) return;
        
        // Haversine formula untuk jarak
        const R = 6371;
        const lat1 = this.userLat * Math.PI / 180;
        const lat2 = this.kaabaLat * Math.PI / 180;
        const dlat = (this.kaabaLat - this.userLat) * Math.PI / 180;
        const dlon = (this.kaabaLon - this.userLon) * Math.PI / 180;
        
        const a = Math.sin(dlat/2) * Math.sin(dlat/2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(dlon/2) * Math.sin(dlon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = Math.round(R * c);
        
        const distanceEl = document.getElementById('distanceToKaaba');
        if (distanceEl) distanceEl.textContent = distance.toLocaleString();
    }

    updateLocationDisplay() {
        const cityEl = document.getElementById('userCityName');
        if (cityEl && window.locationManager) {
            cityEl.textContent = window.locationManager.city || 'Lokasi Anda';
        }
    }

    updateGpsStatus(isActive) {
        const banner = document.getElementById('gpsStatusBanner');
        const statusText = document.getElementById('gpsStatusText');
        
        if (banner && statusText) {
            if (isActive && this.userLat) {
                banner.style.background = '#4caf50';
                statusText.innerHTML = '<i class="fas fa-check-circle"></i> GPS Aktif - Lokasi ditemukan';
            } else if (isActive && !this.userLat) {
                banner.style.background = '#ff9800';
                statusText.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Mendapatkan lokasi...';
            } else {
                banner.style.background = '#f44336';
                statusText.innerHTML = '<i class="fas fa-exclamation-triangle"></i> GPS tidak aktif - Gunakan pilih kota';
            }
        }
    }

    updateKiblatPointer() {
        const pointer = document.getElementById('kiblatPointer');
        if (pointer && this.compassActive) {
            const angle = this.qiblaAngle - this.currentHeading;
            pointer.style.transform = `rotate(${angle}deg)`;
        }
    }

    startCompass() {
        if (!window.DeviceOrientationEvent) {
            this.showToast('Perangkat tidak mendukung kompas', 'error');
            return;
        }

        // Minta izin untuk iOS 13+
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        window.addEventListener('deviceorientation', (e) => this.handleOrientation(e));
                        this.compassActive = true;
                        this.showToast('Kompas aktif, arahkan HP ke kiblat', 'success');
                    } else {
                        this.showToast('Izin kompas ditolak', 'error');
                    }
                })
                .catch(err => {
                    this.showToast('Gagal mendapatkan izin kompas', 'error');
                });
        } else {
            // Android & lainnya
            window.addEventListener('deviceorientation', (e) => this.handleOrientation(e));
            this.compassActive = true;
            this.showToast('Kompas aktif, arahkan HP ke kiblat', 'success');
        }
        
        // Sembunyikan tombol start
        const startBtn = document.getElementById('startCompassBtn');
        if (startBtn) startBtn.style.display = 'none';
    }

    handleOrientation(event) {
        // Dapatkan heading (kompas)
        let heading = event.webkitCompassHeading || event.alpha;
        
        if (heading !== undefined) {
            // Normalisasi heading (0-360)
            heading = (360 - heading + 360) % 360;
            this.currentHeading = Math.round(heading);
            
            // Update jarum kompas
            const needle = document.getElementById('compassNeedle');
            if (needle) {
                needle.style.transform = `rotate(${this.currentHeading}deg)`;
            }
            
            // Update tampilan angka
            const angleEl = document.getElementById('currentAngle');
            if (angleEl) angleEl.textContent = this.currentHeading;
            
            // Hitung selisih dengan kiblat
            const diff = Math.abs(this.qiblaAngle - this.currentHeading);
            const diffDisplay = diff > 180 ? 360 - diff : diff;
            const diffEl = document.getElementById('difference');
            if (diffEl) {
                diffEl.textContent = diffDisplay;
                if (diffDisplay < 10) {
                    diffEl.style.color = '#4caf50';
                    diffEl.parentElement.parentElement.style.border = '2px solid #4caf50';
                } else if (diffDisplay < 30) {
                    diffEl.style.color = '#ff9800';
                    diffEl.parentElement.parentElement.style.border = '2px solid #ff9800';
                } else {
                    diffEl.style.color = '#f44336';
                    diffEl.parentElement.parentElement.style.border = '2px solid #f44336';
                }
            }
            
            // Update pointer kiblat
            this.updateKiblatPointer();
        }
    }

    setupEventListeners() {
        const startBtn = document.getElementById('startCompassBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startCompass());
        }
        
        // Update status GPS awal
        this.updateGpsStatus(window.locationManager?.isGpsActive || false);
    }

    showToast(message, type = 'info') {
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
        }
        
        toast.style.background = bgColor;
        toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// Initialize
const kiblatManager = new KiblatManager();
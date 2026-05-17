// LOCATION MANAGER PERMANEN - FINAL VERSION
class LocationManager {
    constructor() {
        // Load semua data dari localStorage
        this.loadAllData();
        this.isLoading = false;
        this.hasCheckedGps = false;
        this.init();
    }

    loadAllData() {
        // Status GPS web
        this.isGpsActive = localStorage.getItem('gps_status') === 'true';
        
        // Status GPS perangkat (disimpan, tidak dicek ulang setiap saat)
        const savedDeviceGps = localStorage.getItem('device_gps_status');
        if (savedDeviceGps !== null) {
            this.isDeviceGpsOn = savedDeviceGps === 'true';
            this.hasCheckedGps = true;
        } else {
            this.isDeviceGpsOn = false;
            this.hasCheckedGps = false;
        }
        
        // Lokasi tersimpan
        const savedLat = localStorage.getItem('permanent_latitude');
        const savedLon = localStorage.getItem('permanent_longitude');
        const savedCity = localStorage.getItem('permanent_city');
        const savedProvince = localStorage.getItem('permanent_province');
        const savedTimeZone = localStorage.getItem('permanent_timezone');
        
        if (savedLat && savedLon) {
            this.latitude = parseFloat(savedLat);
            this.longitude = parseFloat(savedLon);
            this.city = savedCity || 'Jakarta';
            this.province = savedProvince || '';
            this.timeZone = savedTimeZone || this.getTimeZoneFromLongitude(this.longitude);
        } else {
            this.latitude = -6.2088;
            this.longitude = 106.8456;
            this.city = 'Jakarta';
            this.province = 'DKI Jakarta';
            this.timeZone = 'Asia/Jakarta';
        }
    }

    init() {
        // Update display
        this.updateDisplay();
        this.updateGpsStatusDisplay();
        
        // Cek GPS perangkat hanya SEKALI jika belum pernah
        if (!this.hasCheckedGps && this.isGpsActive) {
            this.checkDeviceGpsOnce();
        } else if (this.isGpsActive && this.isDeviceGpsOn && !this.latitude) {
            // Jika GPS aktif dan perangkat support tapi belum ada lokasi
            this.getUserLocation();
        }
        
        // Kirim event ke halaman
        this.dispatchLocationEvent();
    }

    checkDeviceGpsOnce() {
        if (!navigator.geolocation) {
            this.isDeviceGpsOn = false;
            localStorage.setItem('device_gps_status', 'false');
            this.hasCheckedGps = true;
            this.updateGpsStatusDisplay();
            return;
        }
        
        // Cek sekali saja dengan timeout singkat
        navigator.geolocation.getCurrentPosition(
            () => {
                this.isDeviceGpsOn = true;
                localStorage.setItem('device_gps_status', 'true');
                this.hasCheckedGps = true;
                this.updateGpsStatusDisplay();
                
                // Ambil lokasi jika GPS aktif
                if (this.isGpsActive) {
                    this.getUserLocation();
                }
            },
            (error) => {
                this.isDeviceGpsOn = false;
                localStorage.setItem('device_gps_status', 'false');
                this.hasCheckedGps = true;
                this.updateGpsStatusDisplay();
                
                // Tampilkan pesan sekali saja
                if (this.isGpsActive) {
                    this.showToastOnce('⚠️ GPS perangkat tidak aktif. Nyalakan GPS di pengaturan perangkat.', 'warning');
                }
            },
            { timeout: 3000, enableHighAccuracy: false }
        );
    }

    getUserLocation() {
        if (!this.isGpsActive) {
            return;
        }
        
        if (!this.isDeviceGpsOn) {
            this.showToastOnce('⚠️ GPS perangkat tidak aktif. Nyalakan GPS terlebih dahulu.', 'warning');
            return;
        }
        
        if (this.isLoading) return;
        
        this.isLoading = true;
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                
                this.isDeviceGpsOn = true;
                localStorage.setItem('device_gps_status', 'true');
                this.getCityFromCoordinates(lat, lon);
                this.isLoading = false;
                this.showToastOnce(' Lokasi berhasil didapatkan!', 'success');
            },
            (error) => {
                this.isLoading = false;
                
                if (error.code === error.PERMISSION_DENIED) {
                    this.isGpsActive = false;
                    localStorage.setItem('gps_status', 'false');
                    this.showToastOnce(' Izin lokasi ditolak. Izinkan akses lokasi.', 'error');
                }
                
                this.updateGpsStatusDisplay();
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }

    getCityFromCoordinates(lat, lon) {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`;
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.address) {
                    const city = data.address.city || data.address.town || data.address.village || 'Lokasi Anda';
                    const province = data.address.state || data.address.province || '';
                    this.saveLocation(lat, lon, city, province);
                } else {
                    this.saveLocation(lat, lon, 'Lokasi GPS', '');
                }
            })
            .catch(error => {
                console.log('Gagal dapat nama kota:', error);
                this.saveLocation(lat, lon, 'Lokasi GPS', '');
            });
    }

    saveLocation(lat, lon, city, province) {
        this.latitude = lat;
        this.longitude = lon;
        this.city = city;
        this.province = province;
        this.timeZone = this.getTimeZoneFromLongitude(lon);
        
        localStorage.setItem('permanent_latitude', lat);
        localStorage.setItem('permanent_longitude', lon);
        localStorage.setItem('permanent_city', city || 'Lokasi Anda');
        localStorage.setItem('permanent_province', province || '');
        localStorage.setItem('permanent_timezone', this.timeZone);
        
        this.dispatchLocationEvent();
        this.updateDisplay();
    }

    getTimeZoneFromLongitude(lon) {
        if (lon >= 120) return 'Asia/Jayapura';
        if (lon >= 108) return 'Asia/Makassar';
        return 'Asia/Jakarta';
    }

    toggleGps() {
        this.isGpsActive = !this.isGpsActive;
        localStorage.setItem('gps_status', this.isGpsActive);
        
        if (this.isGpsActive) {
            if (this.isDeviceGpsOn) {
                this.getUserLocation();
            } else {
                this.checkDeviceGpsOnce();
            }
        } else {
            this.showToastOnce('GPS dimatikan, menggunakan lokasi tersimpan', 'info');
        }
        
        this.updateGpsStatusDisplay();
        this.dispatchLocationEvent();
    }

    updateDisplay() {
        const cityElements = document.querySelectorAll('#cityName, .location-city');
        const provinceElements = document.querySelectorAll('#provinceName, .location-province');
        
        cityElements.forEach(el => {
            if (el) el.textContent = this.city || 'Jakarta';
        });
        
        provinceElements.forEach(el => {
            if (el) el.textContent = this.province || '';
        });
        
        const tzElement = document.getElementById('clockTimezone');
        if (tzElement) {
            let tzName = 'WIB';
            if (this.timeZone === 'Asia/Makassar') tzName = 'WITA';
            if (this.timeZone === 'Asia/Jayapura') tzName = 'WIT';
            tzElement.textContent = tzName;
        }
    }

    updateGpsStatusDisplay() {
        const gpsToggle = document.getElementById('gpsToggle');
        if (gpsToggle) {
            gpsToggle.checked = this.isGpsActive;
        }
        
        const gpsStatusText = document.getElementById('gpsStatusText');
        if (gpsStatusText) {
            if (this.isGpsActive && this.isDeviceGpsOn) {
                gpsStatusText.textContent = 'GPS: ON ';
                gpsStatusText.style.color = '#4caf50';
            } else if (this.isGpsActive && !this.isDeviceGpsOn && this.hasCheckedGps) {
                gpsStatusText.textContent = 'GPS: OFF ';
                gpsStatusText.style.color = '#f44336';
            } else if (this.isGpsActive && !this.hasCheckedGps) {
                gpsStatusText.textContent = 'GPS: MENUNGGU...';
                gpsStatusText.style.color = '#ff9800';
            } else {
                gpsStatusText.textContent = 'GPS: OFF ';
                gpsStatusText.style.color = '#f44336';
            }
        }
    }

    dispatchLocationEvent() {
        const event = new CustomEvent('locationUpdated', {
            detail: {
                latitude: this.latitude,
                longitude: this.longitude,
                city: this.city,
                province: this.province,
                timeZone: this.timeZone,
                isGpsActive: this.isGpsActive,
                isDeviceGpsOn: this.isDeviceGpsOn
            }
        });
        window.dispatchEvent(event);
    }

    getLocation() {
        return {
            latitude: this.latitude,
            longitude: this.longitude,
            city: this.city,
            province: this.province,
            timeZone: this.timeZone,
            isGpsActive: this.isGpsActive,
            isDeviceGpsOn: this.isDeviceGpsOn
        };
    }

    // Toast yang hanya muncul SEKALI, tidak berulang
    showToastOnce(message, type = 'info') {
        // Cek apakah toast sudah pernah muncul
        const toastKey = message.replace(/\s/g, '_');
        const lastToast = localStorage.getItem('last_toast');
        const now = Date.now();
        
        // Jika toast sama muncul dalam 10 detik, skip
        if (lastToast === toastKey && (now - parseInt(localStorage.getItem('last_toast_time') || '0')) < 10000) {
            return;
        }
        
        localStorage.setItem('last_toast', toastKey);
        localStorage.setItem('last_toast_time', now);
        
        const existingToast = document.querySelector('.toast-message-location');
        if (existingToast) existingToast.remove();
        
        const toast = document.createElement('div');
        toast.className = 'toast-message-location';
        
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
        }
        
        toast.style.background = bgColor;
        toast.style.position = 'fixed';
        toast.style.bottom = '80px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.color = 'white';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '25px';
        toast.style.zIndex = '2000';
        toast.style.fontSize = '0.85rem';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.gap = '8px';
        toast.style.maxWidth = '90%';
        toast.style.textAlign = 'center';
        toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 4000);
    }
}

// Initialize global location manager
window.locationManager = new LocationManager();
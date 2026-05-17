// Tasbih Manager
class TasbihManager {
    constructor() {
        this.dzikirSteps = [
            {
                name: 'Subhanallah',
                arabic: 'سُبْحَانَ اللَّهِ',
                latin: 'Subhanallah',
                meaning: 'Maha Suci Allah',
                target: 33
            },
            {
                name: 'Alhamdulillah',
                arabic: 'الْحَمْدُ لِلَّهِ',
                latin: 'Alhamdulillah',
                meaning: 'Segala puji bagi Allah',
                target: 33
            },
            {
                name: 'Allahu Akbar',
                arabic: 'اللَّهُ أَكْبَرُ',
                latin: 'Allahu Akbar',
                meaning: 'Allah Maha Besar',
                target: 33
            }
        ];
        
        this.currentStep = 0;
        this.currentCount = 0;
        this.init();
    }

    init() {
        this.updateDisplay();
        this.setupEventListeners();
        this.loadSavedState();
    }

    setupEventListeners() {
        const addBtn = document.getElementById('addBtn');
        const resetBtn = document.getElementById('resetBtn');
        
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addCount());
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetCurrent());
        }
    }

    addCount() {
        this.currentCount++;
        
        if (this.currentCount > this.dzikirSteps[this.currentStep].target) {
            this.currentCount = this.dzikirSteps[this.currentStep].target;
            this.vibrate();
            this.showMessage('Sudah mencapai target!', 'warning');
            return;
        }
        
        this.updateDisplay();
        this.vibrate();
        this.saveState();
        
        // Check if step completed
        if (this.currentCount === this.dzikirSteps[this.currentStep].target) {
            this.onStepComplete();
        }
    }

    onStepComplete() {
        this.showMessage(`${this.dzikirSteps[this.currentStep].name} 33x selesai!`, 'success');
        
        // Move to next step
        if (this.currentStep < this.dzikirSteps.length - 1) {
            this.currentStep++;
            this.currentCount = 0;
            this.updateDisplay();
            this.showMessage(`Lanjut ke: ${this.dzikirSteps[this.currentStep].name}`, 'info');
        } else {
            // All steps completed
            this.showMessage('✨ Selamat! Anda telah menyelesaikan semua dzikir! ✨', 'complete');
            this.resetAll();
        }
        
        this.saveState();
    }

    resetCurrent() {
        this.currentCount = 0;
        this.updateDisplay();
        this.saveState();
        this.showMessage('Reset untuk dzikir saat ini', 'info');
    }

    resetAll() {
        this.currentStep = 0;
        this.currentCount = 0;
        this.updateDisplay();
        this.saveState();
    }

    updateDisplay() {
        const step = this.dzikirSteps[this.currentStep];
        
        document.getElementById('currentDzikirName').textContent = step.name;
        document.getElementById('arabicDzikir').textContent = step.arabic;
        document.getElementById('latinDzikir').textContent = step.latin;
        document.getElementById('meaningDzikir').textContent = step.meaning;
        document.getElementById('counter').textContent = this.currentCount;
        document.getElementById('targetCount').textContent = `Target: ${step.target}`;
        
        // Update steps highlight
        document.querySelectorAll('.step').forEach((el, index) => {
            if (index === this.currentStep) {
                el.style.background = '#e8f5e9';
                el.style.borderLeft = '4px solid #2e7d64';
            } else if (index < this.currentStep) {
                el.style.background = '#c8e6d9';
                el.style.opacity = '0.7';
            } else {
                el.style.background = '#f8fafc';
                el.style.borderLeft = 'none';
            }
        });
    }

    showMessage(message, type) {
        const msgDiv = document.getElementById('completionMsg');
        if (msgDiv) {
            msgDiv.textContent = message;
            msgDiv.className = 'completion-message show';
            
            if (type === 'success') {
                msgDiv.style.background = '#4caf50';
                this.playCompletionSound();
            } else if (type === 'complete') {
                msgDiv.style.background = '#ff9800';
                this.playCompletionSound();
            } else if (type === 'warning') {
                msgDiv.style.background = '#ff9800';
            } else {
                msgDiv.style.background = '#2196f3';
            }
            
            setTimeout(() => {
                msgDiv.classList.remove('show');
            }, 3000);
        }
    }

    playCompletionSound() {
        // Simulasi suara completion - bisa diganti dengan file audio
        try {
            const audio = new Audio();
            // Di sini nanti bisa ditambahkan file audio
            console.log('Step completed!');
        } catch(e) {
            console.log('Audio tidak tersedia');
        }
    }

    vibrate() {
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(50);
        }
    }

    saveState() {
        localStorage.setItem('tasbihStep', this.currentStep);
        localStorage.setItem('tasbihCount', this.currentCount);
    }

    loadSavedState() {
        const savedStep = localStorage.getItem('tasbihStep');
        const savedCount = localStorage.getItem('tasbihCount');
        
        if (savedStep !== null) {
            this.currentStep = parseInt(savedStep);
            this.currentCount = parseInt(savedCount);
            this.updateDisplay();
        }
    }
}

// Initialize tasbih
document.addEventListener('DOMContentLoaded', () => {
    const tasbih = new TasbihManager();
    
    // Touch/click animation for add button
    const addBtn = document.getElementById('addBtn');
    if (addBtn) {
        addBtn.addEventListener('touchstart', () => {
            addBtn.style.transform = 'scale(0.95)';
        });
        addBtn.addEventListener('touchend', () => {
            addBtn.style.transform = 'scale(1)';
        });
        addBtn.addEventListener('mousedown', () => {
            addBtn.style.transform = 'scale(0.95)';
        });
        addBtn.addEventListener('mouseup', () => {
            addBtn.style.transform = 'scale(1)';
        });
    }
});
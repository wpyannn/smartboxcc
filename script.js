// =========================================================
// SMARTBOX v6.0 · GLASS PREMIUM
// Full JavaScript — Real-time, PIN, Grafik, Simulasi Paket
// =========================================================

document.addEventListener('DOMContentLoaded', function() {

    // =========================================================
    // 1. KONFIGURASI & STATE
    // =========================================================
    var CONFIG = {
        securityPIN: '1234',
        maxKapasitas: 20,
        maxPinSalah: 3,
        chartLabels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
    };

    var state = {
        esp32Connected: true,
        proximityDetected: false,
        limitSwitchClosed: true,
        doorOpen: false,
        solenoidUnlocked: false,
        totalPaket: 0,
        pinSalahCount: 0,
        activity: [],
        notifCount: 0,
        chartData: [0, 0, 0, 0, 0, 0, 0],
        todayIndex: 0
    };

    function getDayIndex(day) {
        var map = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };
        return map[day] !== undefined ? map[day] : 6;
    }
    state.todayIndex = getDayIndex(new Date().getDay());

    try {
        var saved = localStorage.getItem('smartbox_data');
        if (saved) {
            var parsed = JSON.parse(saved);
            state.totalPaket = parsed.totalPaket || 0;
            state.chartData = parsed.chartData || [0, 0, 0, 0, 0, 0, 0];
            state.activity = parsed.activity || [];
            state.pinSalahCount = parsed.pinSalahCount || 0;
            while (state.chartData.length < 7) state.chartData.push(0);
            state.chartData = state.chartData.slice(0, 7);
        }
    } catch (e) { /* ignore */ }

    // =========================================================
    // 2. DOM REFS
    // =========================================================
    var $ = function(id) {
        return document.getElementById(id);
    };

    var el = {
        clockTime: $('clockTime'),
        clockDate: $('clockDate'),
        espLed: $('espLed'),
        espText: $('espText'),
        espStatus: $('espStatus'),
        notifCount: $('notifCount'),
        heroTotalPaket: $('heroTotalPaket'),
        heroKapasitas: $('heroKapasitas'),
        progressFill: $('progressFill'),
        progressPercent: $('progressPercent'),
        totalPaket: $('totalPaket'),
        totalPaketSub: $('totalPaketSub'),
        deteksiStatus: $('deteksiStatus'),
        deteksiSub: $('deteksiSub'),
        pintuStatus: $('pintuStatus'),
        pintuSub: $('pintuSub'),
        keamananStatus: $('keamananStatus'),
        keamananSub: $('keamananSub'),
        hardProx: $('hardProx'),
        doorDisplay: $('doorDisplay'),
        accDoor: $('accDoor'),
        accLimit: $('accLimit'),
        accSolenoid: $('accSolenoid'),
        accDoor2: $('accDoor2'),
        accLimit2: $('accLimit2'),
        accSolenoid2: $('accSolenoid2'),
        activityList: $('activityList'),
        fullActivityList: $('fullActivityList'),
        devicesGrid: $('devicesGrid'),
        gatewayStatus: $('gatewayStatus'),
        weekTotal: $('weekTotal'),
        weekPeak: $('weekPeak'),
        toastContainer: $('toastContainer'),
        pinModal: $('pinModal'),
        pinInput: $('pinInput'),
        pinMsg: $('pinMsg'),
        changePasswordModal: $('changePasswordModal'),
        resetModal: $('resetModal'),
        aboutModal: $('aboutModal'),
        oldPin: $('oldPin'),
        newPin: $('newPin'),
        confirmNewPin: $('confirmNewPin'),
        changePinMsg: $('changePinMsg'),
        openBtn: $('openBtn'),
        openBtn2: $('openBtn2'),
        confirmPin: $('confirmPin'),
        cancelPin: $('cancelPin'),
        closeModal: $('closeModal'),
        clearLog: $('clearLog'),
        changePasswordBtn: $('changePasswordBtn'),
        exportDataBtn: $('exportDataBtn'),
        resetSystemBtn: $('resetSystemBtn'),
        aboutBtn: $('aboutBtn'),
        refreshDataBtn: $('refreshDataBtn'),
        themeToggleSidebar: $('themeToggleSidebar'),
        notifBtn: $('notifBtn'),
        sidebar: $('sidebar'),
        sidebarOverlay: $('sidebarOverlay'),
        hamburger: $('hamburgerBtn'),
        loadingScreen: $('loadingScreen')
    };

    // =========================================================
    // 3. DAFTAR PERANGKAT IOT
    // =========================================================
    var devices = [
        { name: 'ESP32', icon: 'fa-microchip' },
        { name: 'PROXIMITY', icon: 'fa-tower-broadcast' },
        { name: 'RFID', icon: 'fa-id-card' },
        { name: 'KEYPAD', icon: 'fa-keyboard' },
        { name: 'LIMIT SWITCH', icon: 'fa-toggle-on' },
        { name: 'LCD 16X2', icon: 'fa-display' },
        { name: 'SELENOID', icon: 'fa-lock' }
    ];

    // =========================================================
    // 4. FUNGSI BANTU
    // =========================================================
    function formatTime(d) {
        d = d || new Date();
        return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    function formatDate(d) {
        d = d || new Date();
        return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    function getTodayIndex() {
        return getDayIndex(new Date().getDay());
    }

    function saveData() {
        try {
            localStorage.setItem('smartbox_data', JSON.stringify({
                totalPaket: state.totalPaket,
                chartData: state.chartData,
                activity: state.activity,
                pinSalahCount: state.pinSalahCount
            }));
        } catch (e) { /* ignore */ }
    }

    // =========================================================
    // 5. JAM DIGITAL
    // =========================================================
    function updateClock() {
        var now = new Date();
        if (el.clockTime) {
            el.clockTime.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
        if (el.clockDate) {
            el.clockDate.textContent = formatDate(now);
        }
    }
    updateClock();
    setInterval(updateClock, 1000);

    // =========================================================
    // 6. NOTIFIKASI TOAST (Bounce Animation)
    // =========================================================
    function showToast(title, desc, type) {
        type = type || 'info';
        var container = el.toastContainer;
        if (!container) return;

        var toast = document.createElement('div');
        toast.className = 'toast';

        var icons = {
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            danger: 'fa-times-circle',
            info: 'fa-info-circle'
        };

        toast.innerHTML = `
            <div class="toast-icon ${type}"><i class="fas ${icons[type] || icons.info}"></i></div>
            <div class="toast-content">
                <span class="toast-title">${title}</span>
                <span class="toast-desc">${desc}</span>
            </div>
            <span class="toast-time">${formatTime()}</span>
        `;

        container.prepend(toast);

        setTimeout(function() {
            toast.classList.add('out');
            setTimeout(function() { toast.remove(); }, 300);
        }, 5000);

        while (container.children.length > 5) {
            container.lastChild.remove();
        }

        state.notifCount++;
        if (el.notifCount) {
            el.notifCount.textContent = state.notifCount;
            el.notifCount.classList.add('show');
        }
    }

    // =========================================================
    // 7. ACTIVITY LOG
    // =========================================================
    function addActivity(title, desc, icon) {
        icon = icon || 'fa-info-circle';
        var time = formatTime();
        state.activity.unshift({ title: title, desc: desc, icon: icon, time: time });
        if (state.activity.length > 100) state.activity.pop();
        renderActivity();
        saveData();
    }

    function renderActivity() {
        var render = function(container, limit) {
            limit = limit || 0;
            if (!container) return;
            var items = limit > 0 ? state.activity.slice(0, limit) : state.activity;
            if (items.length === 0) {
                container.innerHTML =
                    '<div class="activity"><div class="activity-icon"><i class="fas fa-info-circle"></i></div><div class="activity-text"><strong>Belum ada aktivitas</strong><p>Log akan muncul di sini</p></div><time>--:--</time></div>';
                return;
            }
            var html = '';
            for (var i = 0; i < items.length; i++) {
                var a = items[i];
                html += '<div class="activity"><div class="activity-icon"><i class="fas ' + a.icon + '"></i></div><div class="activity-text"><strong>' + a.title + '</strong><p>' + a.desc + '</p></div><time>' + a.time + '</time></div>';
            }
            container.innerHTML = html;
        };

        render(el.activityList, 5);
        render(el.fullActivityList, 0);
    }

    // =========================================================
    // 8. UPDATE UI
    // =========================================================
    function updateUI() {
        if (el.totalPaket) el.totalPaket.textContent = state.totalPaket;
        if (el.heroTotalPaket) el.heroTotalPaket.textContent = state.totalPaket;
        if (el.heroKapasitas) el.heroKapasitas.textContent = state.totalPaket + ' / ' + CONFIG.maxKapasitas;

        var progress = Math.min(100, Math.floor((state.totalPaket / CONFIG.maxKapasitas) * 100));
        if (el.progressFill) el.progressFill.style.width = progress + '%';
        if (el.progressPercent) el.progressPercent.textContent = progress + '%';

        if (state.proximityDetected) {
            if (el.deteksiStatus) {
                el.deteksiStatus.textContent = 'PAKET TERDETEKSI';
                el.deteksiStatus.style.color = '#4ade80';
            }
            if (el.deteksiSub) el.deteksiSub.textContent = 'Sensor aktif';
            if (el.hardProx) {
                el.hardProx.textContent = 'PAKET TERDETEKSI';
                el.hardProx.style.color = '#4ade80';
            }
        } else {
            if (el.deteksiStatus) {
                el.deteksiStatus.textContent = 'TIDAK ADA PAKET';
                el.deteksiStatus.style.color = '#9aa0b8';
            }
            if (el.deteksiSub) el.deteksiSub.textContent = 'Sensor standby';
            if (el.hardProx) {
                el.hardProx.textContent = 'Menunggu Paket';
                el.hardProx.style.color = '#9aa0b8';
            }
        }

        if (state.doorOpen) {
            if (el.pintuStatus) {
                el.pintuStatus.textContent = 'terbuka';
                el.pintuStatus.style.color = '#facc15';
            }
            if (el.pintuSub) el.pintuSub.innerHTML = '🔓 Tidak terkunci';
            if (el.doorDisplay) {
                el.doorDisplay.innerHTML = '<i class="fas fa-lock-open"></i><strong>TERBUKA</strong>';
                el.doorDisplay.style.color = '#4ade80';
                el.doorDisplay.style.borderColor = 'rgba(74,222,128,0.15)';
            }
            if (el.accDoor) {
                el.accDoor.textContent = 'terbuka';
                el.accDoor.style.color = '#facc15';
            }
            if (el.accDoor2) {
                el.accDoor2.textContent = 'terbuka';
                el.accDoor2.style.color = '#facc15';
            }
            if (el.accLimit) {
                el.accLimit.textContent = 'OPEN';
                el.accLimit.style.color = '#facc15';
            }
            if (el.accLimit2) {
                el.accLimit2.textContent = 'OPEN';
                el.accLimit2.style.color = '#facc15';
            }
            if (el.accSolenoid) {
                el.accSolenoid.textContent = 'UNLOCK';
                el.accSolenoid.style.color = '#4ade80';
            }
            if (el.accSolenoid2) {
                el.accSolenoid2.textContent = 'UNLOCK';
                el.accSolenoid2.style.color = '#4ade80';
            }
            if (el.openBtn) el.openBtn.disabled = true;
            if (el.openBtn2) el.openBtn2.disabled = true;
        } else {
            if (el.pintuStatus) {
                el.pintuStatus.textContent = 'TERTUTUP';
                el.pintuStatus.style.color = '#4ade80';
            }
            if (el.pintuSub) el.pintuSub.innerHTML = '🔒 Terkunci';
            if (el.doorDisplay) {
                el.doorDisplay.innerHTML = '<i class="fas fa-lock"></i><strong>TERKUNCI</strong>';
                el.doorDisplay.style.color = '#facc15';
                el.doorDisplay.style.borderColor = 'rgba(250,204,21,0.08)';
            }
            if (el.accDoor) {
                el.accDoor.textContent = 'TERTUTUP';
                el.accDoor.style.color = '#4ade80';
            }
            if (el.accDoor2) {
                el.accDoor2.textContent = 'TERTUTUP';
                el.accDoor2.style.color = '#4ade80';
            }
            if (el.accLimit) {
                el.accLimit.textContent = 'CLOSED';
                el.accLimit.style.color = '#4ade80';
            }
            if (el.accLimit2) {
                el.accLimit2.textContent = 'CLOSED';
                el.accLimit2.style.color = '#4ade80';
            }
            if (el.accSolenoid) {
                el.accSolenoid.textContent = 'LOCK';
                el.accSolenoid.style.color = '#facc15';
            }
            if (el.accSolenoid2) {
                el.accSolenoid2.textContent = 'LOCK';
                el.accSolenoid2.style.color = '#facc15';
            }
            if (el.openBtn) el.openBtn.disabled = false;
            if (el.openBtn2) el.openBtn2.disabled = false;
        }

        if (state.pinSalahCount >= CONFIG.maxPinSalah) {
            if (el.keamananStatus) {
                el.keamananStatus.textContent = 'PERINGATAN';
                el.keamananStatus.style.color = '#f87171';
            }
            if (el.keamananSub) el.keamananSub.textContent = '⚠️ Akses ditolak berulang!';
        } else if (state.pinSalahCount > 0) {
            if (el.keamananStatus) {
                el.keamananStatus.textContent = 'PERINGATAN';
                el.keamananStatus.style.color = '#facc15';
            }
            if (el.keamananSub) el.keamananSub.textContent = 'Percobaan PIN salah ' + state.pinSalahCount + '/' + CONFIG.maxPinSalah;
        } else {
            if (el.keamananStatus) {
                el.keamananStatus.textContent = 'AMAN';
                el.keamananStatus.style.color = '#4ade80';
            }
            if (el.keamananSub) el.keamananSub.textContent = 'Sistem normal';
        }

        updateESP32Status();
        renderDevices();
        updateChartDisplay();
        saveData();
    }

    // =========================================================
    // 9. ESP32 STATUS - LANGSUNG ONLINE TANPA NOTIFIKASI
    // =========================================================
    function updateESP32Status() {
        if (el.espLed) {
            el.espLed.className = 'cyber-led online';
        }
        if (el.espText) {
            el.espText.textContent = 'ONLINE';
            el.espText.className = 'online';
        }
        if (el.espStatus) {
            el.espStatus.textContent = 'ONLINE';
            el.espStatus.style.color = '#4ade80';
        }
        if (el.gatewayStatus) {
            el.gatewayStatus.textContent = 'ONLINE';
            el.gatewayStatus.className = 'status-badge green';
        }
        renderDevices();
    }

    // =========================================================
    // 10. PERANGKAT IOT - SEMUA ONLINE
    // =========================================================
    function renderDevices() {
        if (!el.devicesGrid) return;
        el.devicesGrid.innerHTML = '';
        for (var i = 0; i < devices.length; i++) {
            var d = devices[i];
            var item = document.createElement('div');
            item.className = 'device-item';
            item.innerHTML = `
                <div class="dev-icon"><i class="fas ${d.icon}"></i></div>
                <div class="dev-info">
                    <span class="dev-name">${d.name}</span>
                    <span class="dev-status" style="color:#4ade80;">ONLINE</span>
                </div>
                <span class="dev-led online"></span>
            `;
            el.devicesGrid.appendChild(item);
        }
    }

    // =========================================================
    // 11. GRAFIK REAL-TIME
    // =========================================================
    var activityChart = null;
    var distributionChart = null;

    function initCharts() {
        var ctx1 = document.getElementById('activityChart');
        if (!ctx1) return;
        var ctx1Context = ctx1.getContext('2d');
        var grad = ctx1Context.createLinearGradient(0, 0, 0, 180);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.20)');
        grad.addColorStop(1, 'rgba(56, 189, 248, 0.01)');

        activityChart = new Chart(ctx1Context, {
            type: 'line',
            data: {
                labels: CONFIG.chartLabels,
                datasets: [{
                    label: 'Paket',
                    data: state.chartData,
                    borderColor: '#38bdf8',
                    backgroundColor: grad,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#38bdf8',
                    pointBorderColor: '#0d0d16',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 7,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(13,13,22,0.9)',
                        titleColor: '#f0f0ff',
                        bodyColor: '#9aa0b8',
                        borderColor: 'rgba(56,189,248,0.1)',
                        borderWidth: 1,
                        cornerRadius: 8
                    }
                },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#5a607a' } },
                    y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#5a607a', stepSize: 5,
                            max: 25 } }
                },
                animation: { duration: 600, easing: 'easeOutQuart' }
            }
        });

        var ctx2 = document.getElementById('distributionChart');
        if (!ctx2) return;
        var ctx2Context = ctx2.getContext('2d');
        distributionChart = new Chart(ctx2Context, {
            type: 'doughnut',
            data: {
                labels: ['Paket Diterima', 'Menunggu Diambil', 'Akses Ditolak'],
                datasets: [{
                    data: [65, 25, 10],
                    backgroundColor: ['#38bdf8', '#facc15', '#f87171'],
                    borderColor: '#0d0d16',
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#9aa0b8', font: { size: 10, weight: '700' }, boxWidth: 12,
                            padding: 12 }
                    }
                },
                animation: { animateRotate: true, duration: 800 }
            }
        });
    }

    function updateChartDisplay() {
        if (!activityChart) return;
        var total = 0;
        for (var i = 0; i < state.chartData.length; i++) {
            total += state.chartData[i];
        }
        var peak = Math.max.apply(null, state.chartData);
        if (el.weekTotal) el.weekTotal.textContent = total;
        if (el.weekPeak) el.weekPeak.textContent = peak;

        activityChart.data.datasets[0].data = state.chartData;
        activityChart.update();

        var diterima = Math.floor(Math.random() * 30) + 50;
        var menunggu = Math.floor(Math.random() * 20) + 10;
        var ditolak = 100 - diterima - menunggu;
        distributionChart.data.datasets[0].data = [diterima, menunggu, ditolak];
        distributionChart.update();
    }

    // =========================================================
    // 12. TAMBAH PAKET
    // =========================================================
    function addPacket() {
        if (state.totalPaket >= CONFIG.maxKapasitas) {
            showToast('⚠️ Dropbox Penuh!', 'Kapasitas maksimal 20 paket', 'warning');
            return;
        }

        state.totalPaket++;
        state.proximityDetected = true;

        var todayIdx = getTodayIndex();
        state.chartData[todayIdx] = (state.chartData[todayIdx] || 0) + 1;

        updateUI();

        showToast('📦 Paket Masuk!', 'Total paket: ' + state.totalPaket, 'success');
        addActivity('Paket Terdeteksi', 'Total paket menjadi ' + state.totalPaket, 'fa-box');

        setTimeout(function() {
            state.proximityDetected = false;
            updateUI();
        }, 3000);

        saveData();
    }

    // =========================================================
    // 13. SIMULASI PAKET OTOMATIS (Minimal 3x Sehari)
    // =========================================================
    var simulationInterval = null;

    function startSimulation() {
        setTimeout(function() { addPacket(); }, 5000);

        var minInterval = 10000;
        var maxInterval = 20000;

        function scheduleNext() {
            if (simulationInterval) clearTimeout(simulationInterval);
            var delay = Math.floor(Math.random() * (maxInterval - minInterval + 1)) + minInterval;
            simulationInterval = setTimeout(function() {
                addPacket();
                scheduleNext();
            }, delay);
        }
        scheduleNext();
    }

    // =========================================================
    // 14. KONTROL PINTU & PIN
    // =========================================================
    function openPinModal() {
        if (state.doorOpen) {
            showToast('⚠️ Pintu masih terbuka!', 'Tutup pintu terlebih dahulu', 'warning');
            return;
        }
        if (el.pinModal) el.pinModal.classList.remove('hidden');
        if (el.pinInput) el.pinInput.value = '';
        if (el.pinMsg) el.pinMsg.textContent = '';
        setTimeout(function() {
            if (el.pinInput) el.pinInput.focus();
        }, 100);
    }

    function closePinModal() {
        if (el.pinModal) el.pinModal.classList.add('hidden');
        if (el.pinInput) el.pinInput.value = '';
        if (el.pinMsg) el.pinMsg.textContent = '';
    }

    function verifyPIN() {
        if (!el.pinInput) return;
        var pin = el.pinInput.value.trim();
        if (!pin) {
            if (el.pinMsg) el.pinMsg.textContent = 'Masukkan PIN!';
            return;
        }

        if (pin !== CONFIG.securityPIN) {
            state.pinSalahCount++;
            if (el.pinMsg) {
                el.pinMsg.textContent = '❌ PIN salah! (' + state.pinSalahCount + '/' + CONFIG.maxPinSalah + ')';
                el.pinMsg.style.color = '#f87171';
            }
            if (el.pinInput) el.pinInput.value = '';
            setTimeout(function() {
                if (el.pinInput) el.pinInput.focus();
            }, 100);

            showToast('❌ PIN Salah!', 'Percobaan ' + state.pinSalahCount + '/' + CONFIG.maxPinSalah, 'danger');
            addActivity('PIN Salah', 'Percobaan ke-' + state.pinSalahCount, 'fa-exclamation-triangle');

            if (state.pinSalahCount >= CONFIG.maxPinSalah) {
                showToast('⚠️ PERINGATAN KEAMANAN!', '3x percobaan PIN salah', 'danger');
                addActivity('Peringatan Keamanan', '3x percobaan PIN salah berturut-turut', 'fa-shield-halved');
                closePinModal();
                setTimeout(function() {
                    state.pinSalahCount = 0;
                    updateUI();
                    showToast('🔒 Keamanan Normal', 'Sistem kembali aman', 'info');
                }, 10000);
            }
            updateUI();
            return;
        }

        state.pinSalahCount = 0;
        if (el.pinMsg) el.pinMsg.textContent = '';
        closePinModal();

        state.doorOpen = true;
        state.solenoidUnlocked = true;
        state.limitSwitchClosed = false;

        showToast('✅ Akses Diterima!', 'Pintu terbuka', 'success');
        addActivity('Akses Diterima', 'PIN benar. Pintu terbuka', 'fa-check-circle');
        updateUI();

        setTimeout(function() {
            state.limitSwitchClosed = true;
            state.doorOpen = false;
            state.solenoidUnlocked = false;
            state.proximityDetected = false;
            showToast('🔒 Pintu Tertutup', 'Limit switch aktif. Solenoid LOCK', 'info');
            addActivity('Pintu Tertutup', 'Limit switch aktif. Solenoid LOCK', 'fa-door-closed');
            updateUI();
        }, 5000);
    }

    // =========================================================
    // 15. LOCK DOOR (Manual)
    // =========================================================
    function lockDoor() {
        if (!state.doorOpen) {
            showToast('ℹ️ Pintu sudah tertutup', 'Tidak ada aksi', 'info');
            return;
        }
        state.doorOpen = false;
        state.solenoidUnlocked = false;
        state.limitSwitchClosed = true;
        state.proximityDetected = false;
        showToast('🔒 Pintu Dikunci', 'Manual lock', 'info');
        addActivity('Pintu Dikunci', 'Manual lock oleh user', 'fa-lock');
        updateUI();
    }

    // =========================================================
    // 16. HILANGKAN LOADING SCREEN
    // =========================================================
    function hideLoadingScreen() {
        if (el.loadingScreen) {
            el.loadingScreen.classList.add('fade');
            setTimeout(function() {
                if (el.loadingScreen) {
                    el.loadingScreen.style.display = 'none';
                }
            }, 800);
        }
    }

    // =========================================================
    // 17. EVENT LISTENERS
    // =========================================================
    function toggleSidebar() {
        if (el.sidebar) el.sidebar.classList.toggle('active');
        if (el.sidebarOverlay) el.sidebarOverlay.classList.toggle('active');
        if (el.hamburger) el.hamburger.classList.toggle('active');
        document.body.style.overflow = el.sidebar && el.sidebar.classList.contains('active') ? 'hidden' : '';
    }

    if (el.hamburger) {
        el.hamburger.addEventListener('click', toggleSidebar);
    }
    if (el.sidebarOverlay) {
        el.sidebarOverlay.addEventListener('click', toggleSidebar);
    }

    var navLinks = document.querySelectorAll('.sidebar-nav a[data-section]');
    for (var i = 0; i < navLinks.length; i++) {
        (function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                var section = this.dataset.section;
                var allLinks = document.querySelectorAll('.sidebar-nav a');
                for (var j = 0; j < allLinks.length; j++) {
                    allLinks[j].classList.remove('active');
                }
                this.classList.add('active');
                var allSections = document.querySelectorAll('.section');
                for (var k = 0; k < allSections.length; k++) {
                    allSections[k].classList.add('hidden');
                }
                var target = document.getElementById(section + 'Section');
                if (target) target.classList.remove('hidden');
                if (window.innerWidth <= 768) toggleSidebar();
            });
        })(navLinks[i]);
    }

    if (el.openBtn) {
        el.openBtn.addEventListener('click', openPinModal);
    }
    if (el.openBtn2) {
        el.openBtn2.addEventListener('click', openPinModal);
    }

    if (el.confirmPin) {
        el.confirmPin.addEventListener('click', verifyPIN);
    }
    if (el.cancelPin) {
        el.cancelPin.addEventListener('click', closePinModal);
    }
    if (el.closeModal) {
        el.closeModal.addEventListener('click', closePinModal);
    }
    if (el.pinModal) {
        el.pinModal.addEventListener('click', function(e) {
            if (e.target === this) closePinModal();
        });
    }
    if (el.pinInput) {
        el.pinInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') verifyPIN();
        });
    }

    // =========================================================
    // 18. CHANGE PASSWORD
    // =========================================================
    function openChangePassword() {
        if (el.changePasswordModal) el.changePasswordModal.classList.remove('hidden');
        if (el.oldPin) el.oldPin.value = '';
        if (el.newPin) el.newPin.value = '';
        if (el.confirmNewPin) el.confirmNewPin.value = '';
        if (el.changePinMsg) el.changePinMsg.textContent = '';
        setTimeout(function() {
            if (el.oldPin) el.oldPin.focus();
        }, 100);
    }

    function closeChangePassword() {
        if (el.changePasswordModal) el.changePasswordModal.classList.add('hidden');
    }

    if (el.changePasswordBtn) {
        el.changePasswordBtn.addEventListener('click', openChangePassword);
    }
    var closeChangePwBtn = document.getElementById('closeChangePassword');
    if (closeChangePwBtn) {
        closeChangePwBtn.addEventListener('click', closeChangePassword);
    }
    var cancelChangePwBtn = document.getElementById('cancelChangePassword');
    if (cancelChangePwBtn) {
        cancelChangePwBtn.addEventListener('click', closeChangePassword);
    }
    if (el.changePasswordModal) {
        el.changePasswordModal.addEventListener('click', function(e) {
            if (e.target === this) closeChangePassword();
        });
    }

    var confirmChangePwBtn = document.getElementById('confirmChangePassword');
    if (confirmChangePwBtn) {
        confirmChangePwBtn.addEventListener('click', function() {
            if (!el.oldPin || !el.newPin || !el.confirmNewPin || !el.changePinMsg) return;
            var old = el.oldPin.value.trim();
            var newPw = el.newPin.value.trim();
            var confirm = el.confirmNewPin.value.trim();

            if (old !== CONFIG.securityPIN) {
                el.changePinMsg.textContent = '❌ PIN lama salah!';
                el.changePinMsg.style.color = '#f87171';
                return;
            }
            if (newPw.length < 4) {
                el.changePinMsg.textContent = '❌ PIN minimal 4 digit!';
                el.changePinMsg.style.color = '#f87171';
                return;
            }
            if (newPw !== confirm) {
                el.changePinMsg.textContent = '❌ Konfirmasi tidak cocok!';
                el.changePinMsg.style.color = '#f87171';
                return;
            }
            if (newPw === old) {
                el.changePinMsg.textContent = '⚠️ PIN baru sama dengan lama!';
                el.changePinMsg.style.color = '#facc15';
                return;
            }

            CONFIG.securityPIN = newPw;
            el.changePinMsg.textContent = '✅ PIN berhasil diubah!';
            el.changePinMsg.style.color = '#4ade80';
            showToast('✅ PIN Berubah', 'PIN keamanan berhasil diganti', 'success');
            addActivity('PIN Diubah', 'PIN keamanan diganti', 'fa-key');
            setTimeout(closeChangePassword, 1500);
        });
    }

    // =========================================================
    // 19. RESET
    // =========================================================
    if (el.resetSystemBtn) {
        el.resetSystemBtn.addEventListener('click', function() {
            if (el.resetModal) el.resetModal.classList.remove('hidden');
        });
    }

    var closeResetBtn = document.getElementById('closeReset');
    if (closeResetBtn) {
        closeResetBtn.addEventListener('click', function() {
            if (el.resetModal) el.resetModal.classList.add('hidden');
        });
    }
    var cancelResetBtn = document.getElementById('cancelReset');
    if (cancelResetBtn) {
        cancelResetBtn.addEventListener('click', function() {
            if (el.resetModal) el.resetModal.classList.add('hidden');
        });
    }
    if (el.resetModal) {
        el.resetModal.addEventListener('click', function(e) {
            if (e.target === this) el.resetModal.classList.add('hidden');
        });
    }

    var confirmResetBtn = document.getElementById('confirmReset');
    if (confirmResetBtn) {
        confirmResetBtn.addEventListener('click', function() {
            state.activity = [];
            state.totalPaket = 0;
            state.pinSalahCount = 0;
            state.chartData = [0, 0, 0, 0, 0, 0, 0];
            state.proximityDetected = false;
            state.doorOpen = false;
            state.solenoidUnlocked = false;
            state.limitSwitchClosed = true;

            renderActivity();
            if (el.notifCount) {
                el.notifCount.textContent = '0';
                el.notifCount.classList.remove('show');
            }
            state.notifCount = 0;

            updateUI();
            saveData();
            showToast('🔄 Sistem Direset', 'Semua data telah dihapus', 'info');
            addActivity('Sistem Direset', 'Semua data aktivitas dihapus', 'fa-redo');
            if (el.resetModal) el.resetModal.classList.add('hidden');
        });
    }

    // =========================================================
    // 20. ABOUT
    // =========================================================
    if (el.aboutBtn) {
        el.aboutBtn.addEventListener('click', function() {
            if (el.aboutModal) el.aboutModal.classList.remove('hidden');
        });
    }
    var closeAboutBtn = document.getElementById('closeAbout');
    if (closeAboutBtn) {
        closeAboutBtn.addEventListener('click', function() {
            if (el.aboutModal) el.aboutModal.classList.add('hidden');
        });
    }
    var closeAboutBtn2 = document.getElementById('closeAboutBtn');
    if (closeAboutBtn2) {
        closeAboutBtn2.addEventListener('click', function() {
            if (el.aboutModal) el.aboutModal.classList.add('hidden');
        });
    }
    if (el.aboutModal) {
        el.aboutModal.addEventListener('click', function(e) {
            if (e.target === this) el.aboutModal.classList.add('hidden');
        });
    }

    // =========================================================
    // 21. EXPORT DATA
    // =========================================================
    if (el.exportDataBtn) {
        el.exportDataBtn.addEventListener('click', function() {
            if (state.activity.length === 0) {
                showToast('⚠️ Tidak ada data!', 'Log kosong', 'warning');
                return;
            }
            var headers = ['Waktu', 'Aktivitas', 'Deskripsi'];
            var rows = [];
            for (var i = 0; i < state.activity.length; i++) {
                var a = state.activity[i];
                rows.push([a.time, a.title, a.desc]);
            }
            var csv = headers.join(',') + '\n';
            for (var j = 0; j < rows.length; j++) {
                csv += rows[j].join(',') + '\n';
            }
            var blob = new Blob([csv], { type: 'text/csv' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            var now = new Date();
            var dateStr = now.toISOString().slice(0, 10);
            a.download = 'smartbox_log_' + dateStr + '.csv';
            a.click();
            URL.revokeObjectURL(url);
            showToast('📥 Data Diexport', 'File CSV berhasil diunduh', 'success');
            if (window.innerWidth <= 768) toggleSidebar();
        });
    }

    // =========================================================
    // 22. REFRESH
    // =========================================================
    if (el.refreshDataBtn) {
        el.refreshDataBtn.addEventListener('click', function() {
            showToast('🔄 Memperbarui data...', 'Menyinkronkan sistem', 'info');
            setTimeout(function() {
                updateUI();
                showToast('✅ Data Refresh', 'Data berhasil diperbarui', 'success');
                if (window.innerWidth <= 768) toggleSidebar();
            }, 800);
        });
    }

    // =========================================================
    // 23. CLEAR LOG
    // =========================================================
    if (el.clearLog) {
        el.clearLog.addEventListener('click', function() {
            if (state.activity.length === 0) {
                showToast('ℹ️ Log kosong', 'Tidak ada data untuk dihapus', 'info');
                return;
            }
            if (confirm('Hapus semua riwayat aktivitas?')) {
                state.activity = [];
                renderActivity();
                if (el.notifCount) {
                    el.notifCount.textContent = '0';
                    el.notifCount.classList.remove('show');
                }
                state.notifCount = 0;
                showToast('🗑️ Log Dihapus', 'Semua riwayat dibersihkan', 'info');
                saveData();
            }
        });
    }

    // =========================================================
    // 24. NOTIFIKASI BADGE
    // =========================================================
    if (el.notifBtn) {
        el.notifBtn.addEventListener('click', function() {
            state.notifCount = 0;
            if (el.notifCount) {
                el.notifCount.textContent = '0';
                el.notifCount.classList.remove('show');
            }
        });
    }

    // =========================================================
    // 25. THEME TOGGLE
    // =========================================================
    var isDark = true;
    if (el.themeToggleSidebar) {
        el.themeToggleSidebar.addEventListener('click', function() {
            isDark = !isDark;
            var r = document.documentElement.style;
            if (isDark) {
                r.setProperty('--bg-primary', '#0d0d16');
                r.setProperty('--bg-secondary', '#13131f');
                r.setProperty('--text-primary', '#f0f0ff');
                r.setProperty('--text-secondary', '#9aa0b8');
                this.innerHTML = '<i class="fas fa-moon"></i> MODE GELAP';
            } else {
                r.setProperty('--bg-primary', '#f0ecff');
                r.setProperty('--bg-secondary', '#e8e0f5');
                r.setProperty('--text-primary', '#1a1035');
                r.setProperty('--text-secondary', '#554477');
                this.innerHTML = '<i class="fas fa-sun"></i> MODE TERANG';
            }
            showToast(isDark ? '🌙 Mode Gelap' : '☀️ Mode Terang', 'Tema diubah', 'info');
            if (window.innerWidth <= 768) toggleSidebar();
        });
    }

    // =========================================================
    // 26. INIT - HILANGKAN LOADING SCREEN SETELAH SELESAI
    // =========================================================
    function init() {
        initCharts();
        renderDevices();
        renderActivity();
        updateUI();

        updateESP32Status();

        startSimulation();

        addActivity('System Initialized', 'SmartBox v6.0 siap digunakan', 'fa-power-off');
        addActivity('Security Active', 'Monitoring proximity & limit switch', 'fa-shield-halved');

        showToast('🚀 SmartBox Ready', 'Sistem monitoring aktif', 'info');

        // ===== HILANGKAN LOADING SCREEN =====
        hideLoadingScreen();

        console.log('🚀 SMARTBOX v6.0 FINAL');
        console.log('🔑 PIN Default: 1234');
        console.log('📦 Kapasitas: 20 Paket');
        console.log('📌 ESP32 ONLINE (tanpa notifikasi)');
        console.log('📌 Semua perangkat IoT ONLINE');
        console.log('📌 Simulasi paket otomatis berjalan');
    }

    init();

    // =========================================================
    // 27. EXPOSE FUNCTIONS
    // =========================================================
    window.SmartBox = {
        addPacket: addPacket,
        lockDoor: lockDoor,
        openPinModal: openPinModal,
        state: state,
        CONFIG: CONFIG,
        addActivity: addActivity,
        showToast: showToast,
        getData: function() {
            return { totalPaket: state.totalPaket, chartData: state.chartData, activity: state.activity };
        }
    };

    console.log('📌 SmartBox API: window.SmartBox');

});
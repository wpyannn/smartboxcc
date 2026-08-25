/* =========================================================
   SMARTBOX v6.0 - FINAL
   ESP32 Ready | Limit Switch Logic | Real-time Chart
========================================================= */

// ===== CONFIG =====
let CONFIG = {
    securityPIN: "0000",
    esp32Connected: false,
    proximityDetected: false,
    limitSwitchClosed: true,
    doorOpen: false,
    solenoidUnlocked: false,
    totalPaket: 0,
    maxKapasitas: 20,
    pinSalahCount: 0,
    maxPinSalah: 3,
    chartData: [],
    chartLabels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
};

// ===== STATE =====
const state = {
    esp32Connected: CONFIG.esp32Connected,
    proximityDetected: CONFIG.proximityDetected,
    limitSwitchClosed: CONFIG.limitSwitchClosed,
    doorOpen: CONFIG.doorOpen,
    solenoidUnlocked: CONFIG.solenoidUnlocked,
    totalPaket: CONFIG.totalPaket,
    activity: [],
    chartData: CONFIG.chartData,
    pinSalahCount: 0
};

// ===== DOM REFS =====
const $ = id => document.getElementById(id);

const el = {
    totalPaket: $("totalPaket"),
    totalPaketSub: $("totalPaketSub"),
    deteksiStatus: $("deteksiStatus"),
    deteksiSub: $("deteksiSub"),
    pintuStatus: $("pintuStatus"),
    pintuSub: $("pintuSub"),
    keamananStatus: $("keamananStatus"),
    keamananSub: $("keamananSub"),
    hardProx: $("hardProx"),
    espStatus: $("espStatus"),
    accDoor: $("accDoor"),
    accLimit: $("accLimit"),
    accSolenoid: $("accSolenoid"),
    doorDisplay: $("doorDisplay"),
    activityList: $("activityList"),
    fullActivityList: $("fullActivityList"),
    gatewayStatus: $("gatewayStatus"),
    accDoor2: $("accDoor2"),
    accLimit2: $("accLimit2"),
    accSolenoid2: $("accSolenoid2"),
    openBtn: $("openBtn"),
    openBtn2: $("openBtn2"),
    pinModal: $("pinModal"),
    pinInput: $("pinInput"),
    pinMsg: $("pinMsg"),
    toast: $("toast"),
    notifCount: $("notifCount"),
    notifContainer: $("notificationContainer"),
    changePasswordModal: $("changePasswordModal"),
    resetModal: $("resetModal"),
    aboutModal: $("aboutModal"),
    oldPin: $("oldPin"),
    newPin: $("newPin"),
    confirmNewPin: $("confirmNewPin"),
    changePinMsg: $("changePinMsg"),
    heroTotalPaket: $("heroTotalPaket"),
    heroKapasitas: $("heroKapasitas"),
    progressFill: $("progressFill"),
    progressPercent: $("progressPercent"),
    devicesGrid: $("devicesGrid"),
    weekTotal: $("weekTotal"),
    weekPeak: $("weekPeak")
};

// ===== DEVICES LIST =====
const devices = [
    { name: "ESP32", icon: "fa-microchip" },
    { name: "PROXIMITY", icon: "fa-tower-broadcast" },
    { name: "RFID", icon: "fa-id-card" },
    { name: "KEYPAD", icon: "fa-keyboard" },
    { name: "LIMIT SWITCH", icon: "fa-toggle-on" },
    { name: "LCD 16X2", icon: "fa-display" },
    { name: "SELENOID", icon: "fa-lock" }
];

// =========================================================
// LOADING SCREEN
// =========================================================
window.addEventListener("load", function() {
    setTimeout(function() {
        document.getElementById("loadingScreen").classList.add("fade");
    }, 1200);
});

// =========================================================
// HAMBURGER
// =========================================================
const hamburger = document.getElementById("hamburgerBtn");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("sidebarOverlay");
const sidebarClose = document.getElementById("sidebarClose");

function toggleSidebar(e) {
    if (e) e.stopPropagation();
    sidebar.classList.toggle("active");
    overlay.classList.toggle("active");
    hamburger.classList.toggle("active");
    document.body.style.overflow = sidebar.classList.contains("active") ? "hidden" : "";
}

if (hamburger) {
    hamburger.addEventListener("click", toggleSidebar);
    hamburger.addEventListener("touchstart", function(e) {
        e.preventDefault();
        toggleSidebar(e);
    }, { passive: false });
}
if (sidebarClose) sidebarClose.addEventListener("click", toggleSidebar);
if (overlay) overlay.addEventListener("click", toggleSidebar);

document.addEventListener("keydown", function(e) {
    if (e.key === "Escape" && sidebar.classList.contains("active")) toggleSidebar();
});

// =========================================================
// CLOCK
// =========================================================
function updateClock() {
    const now = new Date();
    $("clockTime").textContent = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
    $("clockDate").textContent = now.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}
updateClock();
setInterval(updateClock, 1000);

// =========================================================
// NAVIGATION
// =========================================================
document.querySelectorAll(".sidebar-nav a, .btn-link[data-section]").forEach(item => {
    item.addEventListener("click", function() {
        const section = this.dataset.section;
        if (!section) return;
        document.querySelectorAll(".sidebar-nav a").forEach(n => n.classList.remove("active"));
        document.querySelectorAll(".section").forEach(s => s.classList.add("hidden"));
        this.classList.add("active");
        const target = document.getElementById(section + "Section");
        if (target) target.classList.remove("hidden");
        if (window.innerWidth <= 1024) toggleSidebar();
    });
});

// =========================================================
// TOAST
// =========================================================
function showToast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add("show");
    clearTimeout(el.toast._timer);
    el.toast._timer = setTimeout(() => el.toast.classList.remove("show"), 3000);
}

// =========================================================
// NOTIFICATION POPUP
// =========================================================
function showNotification(title, desc, type = "info") {
    const container = el.notifContainer;
    const notif = document.createElement("div");
    notif.className = "notification";

    const icons = {
        success: "fa-check-circle",
        warning: "fa-exclamation-triangle",
        danger: "fa-times-circle",
        info: "fa-info-circle"
    };

    notif.innerHTML = `
        <div class="notif-icon ${type}"><i class="fas ${icons[type] || icons.info}"></i></div>
        <div class="notif-content">
            <span class="notif-title">${title}</span>
            <span class="notif-desc">${desc}</span>
        </div>
        <span class="notif-time">${new Date().toLocaleTimeString("id-ID", {hour:"2-digit",minute:"2-digit"})}</span>
    `;

    container.prepend(notif);

    setTimeout(() => {
        notif.classList.add("out");
        setTimeout(() => notif.remove(), 300);
    }, 5000);

    while (container.children.length > 5) {
        container.lastChild.remove();
    }

    const count = parseInt(el.notifCount.textContent) + 1;
    el.notifCount.textContent = count;
    el.notifCount.classList.add("show");
}

// =========================================================
// ACTIVITY LOG
// =========================================================
function addActivity(title, desc, icon = "fa-info-circle") {
    const now = new Date();
    const time = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
    state.activity.unshift({ title, desc, icon, time });
    if (state.activity.length > 50) state.activity.pop();
    renderActivity();

    const count = parseInt(el.notifCount.textContent) + 1;
    el.notifCount.textContent = count;
    el.notifCount.classList.add("show");
}

function renderActivity() {
    if (state.activity.length === 0) {
        const empty =
            `<div class="activity"><div class="activity-icon"><i class="fas fa-info-circle"></i></div><div class="activity-text"><strong>Belum ada aktivitas</strong><p>Log akan muncul di sini</p></div><time>--:--</time></div>`;
        el.activityList.innerHTML = empty;
        el.fullActivityList.innerHTML = empty;
        return;
    }
    const latest = state.activity.slice(0, 5);
    el.activityList.innerHTML = latest.map(a =>
        `<div class="activity"><div class="activity-icon"><i class="fas ${a.icon}"></i></div><div class="activity-text"><strong>${a.title}</strong><p>${a.desc}</p></div><time>${a.time}</time></div>`
    ).join("");
    el.fullActivityList.innerHTML = state.activity.map(a =>
        `<div class="activity"><div class="activity-icon"><i class="fas ${a.icon}"></i></div><div class="activity-text"><strong>${a.title}</strong><p>${a.desc}</p></div><time>${a.time}</time></div>`
    ).join("");
}

$("clearLog")?.addEventListener("click", () => {
    state.activity = [];
    renderActivity();
    el.notifCount.textContent = "0";
    el.notifCount.classList.remove("show");
    showToast("Log dihapus");
});

// =========================================================
// RENDER DEVICES
// =========================================================
function renderDevices(online) {
    el.devicesGrid.innerHTML = "";
    devices.forEach(d => {
        const item = document.createElement("div");
        item.className = "device-item";
        const isOnline = online && state.esp32Connected;
        item.innerHTML = `
            <div class="dev-icon"><i class="fas ${d.icon}"></i></div>
            <div class="dev-info">
                <span class="dev-name">${d.name}</span>
                <span class="dev-status" style="color:${isOnline ? 'var(--green)' : 'var(--red)'}">
                    ${isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
            </div>
            <span class="dev-led ${isOnline ? 'online' : 'offline'}"></span>
        `;
        el.devicesGrid.appendChild(item);
    });
}

// =========================================================
// UPDATE ESP32 CONNECTION
// =========================================================
function setESP32Connection(connected) {
    state.esp32Connected = connected;
    const led = document.getElementById("espLed");
    const text = document.getElementById("espText");
    const status = document.getElementById("espStatus");
    const gateway = document.getElementById("gatewayStatus");

    if (connected) {
        led.className = "cyber-led online";
        text.textContent = "ONLINE";
        text.style.color = "var(--green)";
        status.textContent = "ESP32 CONNECTED";
        status.style.color = "var(--green)";
        gateway.textContent = "Connected";
        gateway.className = "status-badge green";
        renderDevices(true);
        showNotification("✅ ESP32 Terhubung", "Semua perangkat IoT online", "success");
        addActivity("ESP32 Online", "Gateway IoT terhubung", "fa-microchip");
        showToast("✅ ESP32 Terhubung!");
    } else {
        led.className = "cyber-led offline";
        text.textContent = "MENUNGGU KONEKSI";
        text.style.color = "var(--yellow)";
        status.textContent = "MENUNGGU KONEKSI";
        status.style.color = "var(--yellow)";
        gateway.textContent = "Menunggu";
        gateway.className = "status-badge red";
        renderDevices(false);
        showNotification("⚠️ ESP32 Terputus", "Menunggu koneksi ke perangkat", "warning");
        addActivity("ESP32 Offline", "Gateway IoT terputus", "fa-triangle-exclamation");
        showToast("⚠️ ESP32 Terputus!");
    }
}

// =========================================================
// PROXIMITY SENSOR
// =========================================================
function setProximity(detected) {
    state.proximityDetected = detected;

    if (detected) {
        if (state.totalPaket >= CONFIG.maxKapasitas) {
            showNotification("⚠️ DROPBOX PENUH!", "Kapasitas maksimal 20 paket", "warning");
            addActivity("Dropbox Penuh", "Kapasitas paket sudah mencapai 20", "fa-exclamation-triangle");
            el.deteksiStatus.textContent = "DROPBOX PENUH";
            el.deteksiStatus.style.color = "var(--red)";
            el.deteksiSub.textContent = "Kapasitas penuh!";
            el.hardProx.textContent = "PENUH";
            el.hardProx.style.color = "var(--red)";
            return;
        }

        state.totalPaket++;
        CONFIG.totalPaket = state.totalPaket;

        el.deteksiStatus.textContent = "PAKET TERDETEKSI";
        el.deteksiStatus.style.color = "var(--green)";
        el.deteksiSub.textContent = "Sensor aktif";
        el.hardProx.textContent = "PAKET TERDETEKSI";
        el.hardProx.style.color = "var(--green)";
        el.totalPaket.textContent = state.totalPaket;
        el.heroTotalPaket.textContent = state.totalPaket;
        el.heroKapasitas.textContent = `${state.totalPaket} / ${CONFIG.maxKapasitas}`;

        const percent = Math.floor(Math.random() * 30) + 10;
        el.totalPaketSub.textContent = `↑ ${percent}% dari kemarin`;

        const progress = Math.min(100, Math.floor((state.totalPaket / CONFIG.maxKapasitas) * 100));
        updateProgress(progress);

        showNotification("📦 Paket Masuk!", `Total paket: ${state.totalPaket}`, "success");
        addActivity("Paket Terdeteksi", `Total paket menjadi ${state.totalPaket}`, "fa-box");

        updateChartData(state.totalPaket);
        updateDistribution();

    } else {
        el.deteksiStatus.textContent = "TIDAK ADA PAKET";
        el.deteksiStatus.style.color = "var(--text-muted)";
        el.deteksiSub.textContent = "Sensor standby";
        el.hardProx.textContent = "MENUNGGU PAKET";
        el.hardProx.style.color = "var(--cyan)";
    }
}

// =========================================================
// LIMIT SWITCH
// =========================================================
function setLimitSwitch(closed) {
    state.limitSwitchClosed = closed;

    if (closed) {
        state.doorOpen = false;
        state.solenoidUnlocked = false;

        el.pintuStatus.textContent = "TERTUTUP";
        el.pintuStatus.style.color = "var(--green)";
        el.pintuSub.innerHTML = "🔒 Terkunci";
        el.accDoor.textContent = "TERTUTUP";
        el.accDoor.style.color = "var(--green)";
        el.accDoor2.textContent = "TERTUTUP";
        el.accDoor2.style.color = "var(--green)";
        el.accLimit.textContent = "CLOSED";
        el.accLimit.style.color = "var(--green)";
        el.accLimit2.textContent = "CLOSED";
        el.accLimit2.style.color = "var(--green)";
        el.accSolenoid.textContent = "LOCK";
        el.accSolenoid.style.color = "var(--yellow)";
        el.accSolenoid2.textContent = "LOCK";
        el.accSolenoid2.style.color = "var(--yellow)";

        el.doorDisplay.innerHTML = `<i class="fas fa-lock"></i><strong>TERKUNCI</strong>`;
        el.doorDisplay.style.color = "var(--yellow)";
        el.doorDisplay.style.borderColor = "rgba(255,230,0,0.1)";

        el.openBtn.disabled = false;
        el.openBtn2.disabled = false;

        showNotification("🔒 Pintu Tertutup", "Solenoid terkunci otomatis", "info");
        addActivity("Pintu Tertutup", "Limit switch aktif. Solenoid LOCK", "fa-door-closed");
        showToast("🔒 Pintu tertutup - Terkunci!");

    } else {
        state.doorOpen = true;
        state.solenoidUnlocked = true;

        el.pintuStatus.textContent = "TERBUKA";
        el.pintuStatus.style.color = "var(--yellow)";
        el.pintuSub.innerHTML = "🔓 Tidak terkunci";
        el.accDoor.textContent = "TERBUKA";
        el.accDoor.style.color = "var(--yellow)";
        el.accDoor2.textContent = "TERBUKA";
        el.accDoor2.style.color = "var(--yellow)";
        el.accLimit.textContent = "OPEN";
        el.accLimit.style.color = "var(--yellow)";
        el.accLimit2.textContent = "OPEN";
        el.accLimit2.style.color = "var(--yellow)";
        el.accSolenoid.textContent = "UNLOCK";
        el.accSolenoid.style.color = "var(--green)";
        el.accSolenoid2.textContent = "UNLOCK";
        el.accSolenoid2.style.color = "var(--green)";

        el.doorDisplay.innerHTML = `<i class="fas fa-lock-open"></i><strong>TERBUKA</strong>`;
        el.doorDisplay.style.color = "var(--green)";
        el.doorDisplay.style.borderColor = "rgba(0,255,136,0.2)";

        el.openBtn.disabled = true;
        el.openBtn2.disabled = true;

        showNotification("🔓 Pintu Terbuka", "Solenoid unlock", "warning");
        addActivity("Pintu Terbuka", "Limit switch tidak aktif. Solenoid UNLOCK", "fa-lock-open");
        showToast("🔓 Pintu terbuka!");
    }
}

// =========================================================
// UNLOCK DOOR (via PIN)
// =========================================================
function unlockDoor() {
    setLimitSwitch(false);
    state.pinSalahCount = 0;
    el.keamananStatus.textContent = "AMAN";
    el.keamananStatus.style.color = "var(--green)";
    el.keamananSub.textContent = "Sistem normal";
}

// =========================================================
// KEAMANAN - PIN SALAH
// =========================================================
function pinSalah() {
    state.pinSalahCount++;
    if (state.pinSalahCount >= CONFIG.maxPinSalah) {
        el.keamananStatus.textContent = "PERINGATAN";
        el.keamananStatus.style.color = "var(--red)";
        el.keamananSub.textContent = "⚠️ Akses ditolak berulang!";

        showNotification("⚠️ PERINGATAN KEAMANAN!", "Terjadi 3x percobaan PIN salah", "danger");
        addActivity("Peringatan Keamanan", "3x percobaan PIN salah berturut-turut", "fa-shield-halved");
        showToast("⚠️ PERINGATAN! Akses ditolak!");

        setTimeout(() => {
            state.pinSalahCount = 0;
            el.keamananStatus.textContent = "AMAN";
            el.keamananStatus.style.color = "var(--green)";
            el.keamananSub.textContent = "Sistem normal";
        }, 10000);
    } else {
        el.keamananStatus.textContent = "PERINGATAN";
        el.keamananStatus.style.color = "var(--yellow)";
        el.keamananSub.textContent = `Percobaan PIN salah ${state.pinSalahCount}/${CONFIG.maxPinSalah}`;
        showNotification("⚠️ PIN Salah!", `Percobaan ${state.pinSalahCount}/${CONFIG.maxPinSalah}`, "warning");
        addActivity("PIN Salah", `Percobaan ke-${state.pinSalahCount}`, "fa-exclamation-triangle");
        showToast(`⚠️ PIN salah! (${state.pinSalahCount}/${CONFIG.maxPinSalah})`);
    }
}

// =========================================================
// UPDATE PROGRESS
// =========================================================
function updateProgress(val) {
    const v = Math.min(100, Math.max(0, val));
    el.progressFill.style.width = v + "%";
    el.progressPercent.textContent = v + "%";
}

// =========================================================
// UPDATE DASHBOARD
// =========================================================
function updateDashboard() {
    el.heroTotalPaket.textContent = state.totalPaket;
    el.heroKapasitas.textContent = `${state.totalPaket} / ${CONFIG.maxKapasitas}`;
    const progress = Math.min(100, Math.floor((state.totalPaket / CONFIG.maxKapasitas) * 100));
    updateProgress(progress);
}

// =========================================================
// CHARTS
// =========================================================
let chartData = [0, 0, 0, 0, 0, 0, 0];

// Activity Chart - 7 HARI
const ctx1 = document.getElementById("activityChart").getContext("2d");
const grad = ctx1.createLinearGradient(0, 0, 0, 180);
grad.addColorStop(0, "rgba(0, 240, 255, 0.25)");
grad.addColorStop(1, "rgba(0, 240, 255, 0.01)");

const activityChart = new Chart(ctx1, {
    type: "line",
    data: {
        labels: CONFIG.chartLabels,
        datasets: [{
            label: "Paket",
            data: chartData,
            borderColor: "#00f0ff",
            backgroundColor: grad,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "#00f0ff",
            pointBorderColor: "#0a0a12",
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
                backgroundColor: "rgba(10,10,18,0.9)",
                titleColor: "#e0e0ff",
                bodyColor: "#8899bb",
                borderColor: "rgba(0,240,255,0.2)",
                borderWidth: 1,
                cornerRadius: 8
            }
        },
        scales: {
            x: {
                grid: { color: "rgba(255,255,255,0.03)" },
                ticks: { color: "#445577" }
            },
            y: {
                grid: { color: "rgba(255,255,255,0.03)" },
                ticks: { color: "#445577", stepSize: 5, max: 20 }
            }
        },
        animation: {
            duration: 600,
            easing: "easeOutQuart"
        }
    }
});

// Distribution Chart
let distributionData = [0, 0, 0];

const ctx2 = document.getElementById("distributionChart").getContext("2d");
const distributionChart = new Chart(ctx2, {
    type: "doughnut",
    data: {
        labels: ["Paket Diterima", "Menunggu Diambil", "Akses Ditolak"],
        datasets: [{
            data: distributionData,
            backgroundColor: ["#00f0ff", "#ffe600", "#ff2d95"],
            borderColor: "#0a0a12",
            borderWidth: 3
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: {
            legend: {
                position: "bottom",
                labels: {
                    color: "#8899bb",
                    font: { size: 11 },
                    boxWidth: 12,
                    padding: 12
                }
            }
        },
        animation: {
            animateRotate: true,
            duration: 800
        }
    }
});

// =========================================================
// UPDATE CHART DATA (Real-time - 7 Hari)
// =========================================================
function updateChartData(value) {
    chartData.push(value);
    if (chartData.length > 7) {
        chartData.shift();
    }
    activityChart.data.datasets[0].data = chartData;
    activityChart.update();

    const total = chartData.reduce((a, b) => a + b, 0);
    const peak = Math.max(...chartData);
    el.weekTotal.textContent = total;
    el.weekPeak.textContent = peak;
}

// =========================================================
// UPDATE DISTRIBUTION
// =========================================================
function updateDistribution() {
    const diterima = Math.floor(Math.random() * 30) + 50;
    const menunggu = Math.floor(Math.random() * 20) + 10;
    const ditolak = 100 - diterima - menunggu;
    distributionData = [diterima, menunggu, ditolak];
    distributionChart.data.datasets[0].data = distributionData;
    distributionChart.update();
}

// =========================================================
// SIMULASI PROXIMITY
// =========================================================
function simulateProximity() {
    if (!state.esp32Connected) return;
    const detect = Math.random() > 0.45;
    setProximity(detect);
    const interval = Math.floor(Math.random() * 5000) + 5000;
    setTimeout(simulateProximity, interval);
}

// =========================================================
// SIMULASI LIMIT SWITCH
// =========================================================
function simulateLimitSwitch() {
    if (!state.esp32Connected) return;
    if (!state.doorOpen) {
        const toggle = Math.random() > 0.6;
        setLimitSwitch(toggle);
    }
    const interval = Math.floor(Math.random() * 10000) + 20000;
    setTimeout(simulateLimitSwitch, interval);
}

// =========================================================
// PIN MODAL
// =========================================================
function openPinModal() {
    if (state.doorOpen) {
        showToast("⚠️ Pintu masih terbuka!");
        return;
    }
    if (!state.esp32Connected) {
        showToast("⚠️ ESP32 belum terhubung!");
        return;
    }
    el.pinInput.value = "";
    el.pinMsg.textContent = "";
    el.pinModal.classList.remove("hidden");
    setTimeout(() => el.pinInput.focus(), 100);
}

function closePinModal() {
    el.pinModal.classList.add("hidden");
    el.pinInput.value = "";
    el.pinMsg.textContent = "";
}

el.openBtn.addEventListener("click", openPinModal);
el.openBtn2.addEventListener("click", openPinModal);
$("closeModal")?.addEventListener("click", closePinModal);
$("cancelPin")?.addEventListener("click", closePinModal);
el.pinModal.addEventListener("click", e => {
    if (e.target === el.pinModal) closePinModal();
});

function verifyPIN() {
    const pin = el.pinInput.value.trim();
    if (!pin) {
        el.pinMsg.textContent = "Masukkan PIN!";
        return;
    }
    if (pin !== CONFIG.securityPIN) {
        el.pinMsg.textContent = "❌ PIN salah!";
        pinSalah();
        el.pinInput.value = "";
        el.pinInput.focus();
        return;
    }
    el.pinMsg.textContent = "";
    closePinModal();
    unlockDoor();
    showNotification("✅ Akses Diterima!", "Pintu dibuka dengan PIN", "success");
    addActivity("Akses Diterima", "PIN benar. Pintu terbuka", "fa-check-circle");
    showToast("✅ Akses diterima!");
}

$("confirmPin")?.addEventListener("click", verifyPIN);
el.pinInput.addEventListener("keydown", e => {
    if (e.key === "Enter") verifyPIN();
});

// =========================================================
// ESP32 CONNECTION - OTOMATIS TANPA TOMBOL
// =========================================================
// ESP32 akan terhubung secara otomatis setelah beberapa detik
setTimeout(() => {
    setESP32Connection(true);
    // Init grafik dengan data awal
    for (let i = 0; i < 7; i++) {
        chartData[i] = Math.floor(Math.random() * 15) + 1;
    }
    updateChartData(chartData[chartData.length - 1]);
    updateDashboard();
    updateProgress(95);
    // Mulai simulasi sensor
    setTimeout(simulateProximity, 1000);
    setTimeout(simulateLimitSwitch, 2000);
}, 3000);

// =========================================================
// CHANGE PASSWORD
// =========================================================
function openChangePassword() {
    el.changePasswordModal.classList.remove("hidden");
    el.oldPin.value = "";
    el.newPin.value = "";
    el.confirmNewPin.value = "";
    el.changePinMsg.textContent = "";
    setTimeout(() => el.oldPin.focus(), 100);
}

function closeChangePassword() {
    el.changePasswordModal.classList.add("hidden");
}

$("changePasswordBtn")?.addEventListener("click", openChangePassword);
$("closeChangePassword")?.addEventListener("click", closeChangePassword);
$("cancelChangePassword")?.addEventListener("click", closeChangePassword);
el.changePasswordModal.addEventListener("click", e => {
    if (e.target === el.changePasswordModal) closeChangePassword();
});

$("confirmChangePassword")?.addEventListener("click", function() {
    const old = el.oldPin.value.trim();
    const newPin = el.newPin.value.trim();
    const confirm = el.confirmNewPin.value.trim();

    if (old !== CONFIG.securityPIN) {
        el.changePinMsg.textContent = "❌ PIN lama salah!";
        el.changePinMsg.style.color = "var(--pink)";
        return;
    }
    if (newPin.length < 4) {
        el.changePinMsg.textContent = "❌ PIN minimal 4 digit!";
        el.changePinMsg.style.color = "var(--pink)";
        return;
    }
    if (newPin !== confirm) {
        el.changePinMsg.textContent = "❌ Konfirmasi tidak cocok!";
        el.changePinMsg.style.color = "var(--pink)";
        return;
    }
    if (newPin === old) {
        el.changePinMsg.textContent = "⚠️ PIN baru sama dengan lama!";
        el.changePinMsg.style.color = "var(--yellow)";
        return;
    }

    CONFIG.securityPIN = newPin;
    el.changePinMsg.textContent = "✅ PIN berhasil diubah!";
    el.changePinMsg.style.color = "var(--green)";
    addActivity("PIN Diubah", "PIN keamanan diganti", "fa-key");
    showNotification("✅ PIN Berubah", "PIN keamanan berhasil diganti", "success");
    showToast("✅ PIN berhasil diubah!");
    setTimeout(closeChangePassword, 1500);
});

// =========================================================
// RESET
// =========================================================
$("resetSystemBtn")?.addEventListener("click", () => {
    $("resetModal").classList.remove("hidden");
});
$("closeReset")?.addEventListener("click", () => {
    $("resetModal").classList.add("hidden");
});
$("cancelReset")?.addEventListener("click", () => {
    $("resetModal").classList.add("hidden");
});
$("resetModal")?.addEventListener("click", function(e) {
    if (e.target === this) $("resetModal").classList.add("hidden");
});

$("confirmReset")?.addEventListener("click", function() {
    state.activity = [];
    state.totalPaket = 0;
    CONFIG.totalPaket = 0;
    state.pinSalahCount = 0;
    chartData = [0, 0, 0, 0, 0, 0, 0];
    updateChartData(0);

    renderActivity();
    el.notifCount.textContent = "0";
    el.notifCount.classList.remove("show");

    state.doorOpen = false;
    state.solenoidUnlocked = false;
    state.limitSwitchClosed = true;
    el.keamananStatus.textContent = "AMAN";
    el.keamananStatus.style.color = "var(--green)";
    el.keamananSub.textContent = "Sistem normal";

    el.totalPaket.textContent = "0";
    el.heroTotalPaket.textContent = "0";
    el.heroKapasitas.textContent = "0 / 20";
    el.totalPaketSub.textContent = "↑ 0% dari kemarin";
    updateProgress(10);

    setLimitSwitch(true);
    addActivity("Sistem Direset", "Semua data aktivitas dihapus", "fa-redo");
    showNotification("🔄 Sistem Direset", "Semua data telah dihapus", "info");
    showToast("🔄 Sistem telah direset!");

    $("resetModal").classList.add("hidden");
});

// =========================================================
// ABOUT
// =========================================================
$("aboutBtn")?.addEventListener("click", () => {
    $("aboutModal").classList.remove("hidden");
});
$("closeAbout")?.addEventListener("click", () => {
    $("aboutModal").classList.add("hidden");
});
$("closeAboutBtn")?.addEventListener("click", () => {
    $("aboutModal").classList.add("hidden");
});
$("aboutModal")?.addEventListener("click", function(e) {
    if (e.target === this) $("aboutModal").classList.add("hidden");
});

// =========================================================
// EXPORT
// =========================================================
$("exportDataBtn")?.addEventListener("click", function() {
    if (state.activity.length === 0) {
        showToast("⚠️ Tidak ada data!", "error");
        return;
    }
    const headers = ["Waktu", "Aktivitas", "Deskripsi"];
    const rows = state.activity.map(a => [a.time, a.title, a.desc]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smartbox_log_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification("📥 Data Diexport", "File CSV berhasil diunduh", "success");
    showToast("📥 Data berhasil diexport!");
    if (window.innerWidth <= 1024) toggleSidebar();
});

// =========================================================
// REFRESH
// =========================================================
$("refreshDataBtn")?.addEventListener("click", function() {
    showToast("🔄 Memperbarui data...");
    setTimeout(() => {
        updateDashboard();
        const progress = Math.min(100, Math.floor((state.totalPaket / CONFIG.maxKapasitas) * 100));
        updateProgress(progress);
        addActivity("Data Direfresh", "Sistem memperbarui data dari ESP32", "fa-sync");
        showNotification("🔄 Data Refresh", "Data berhasil diperbarui", "info");
        showToast("✅ Data berhasil diperbarui!");
        if (window.innerWidth <= 1024) toggleSidebar();
    }, 1000);
});

// =========================================================
// THEME
// =========================================================
let isDark = true;
$("themeToggleSidebar")?.addEventListener("click", function() {
    isDark = !isDark;
    const r = document.documentElement;
    if (isDark) {
        r.style.setProperty("--bg-primary", "#0a0a12");
        r.style.setProperty("--bg-secondary", "#111122");
        r.style.setProperty("--text-primary", "#e0e0ff");
        r.style.setProperty("--text-secondary", "#8899bb");
        this.innerHTML = '<i class="fas fa-moon"></i> MODE GELAP';
    } else {
        r.style.setProperty("--bg-primary", "#f0ecff");
        r.style.setProperty("--bg-secondary", "#e8e0f5");
        r.style.setProperty("--text-primary", "#1a1035");
        r.style.setProperty("--text-secondary", "#554477");
        this.innerHTML = '<i class="fas fa-sun"></i> MODE TERANG';
    }
    showNotification(isDark ? "🌙 Mode Gelap" : "☀️ Mode Terang", "Tema diubah", "info");
    showToast(isDark ? "🌙 Mode Gelap" : "☀️ Mode Terang");
    if (window.innerWidth <= 1024) toggleSidebar();
});

// =========================================================
// UPDATE FUNCTIONS FOR ESP32 INTEGRATION
// =========================================================
window.setESP32Connection = setESP32Connection;
window.setProximity = setProximity;
window.setLimitSwitch = setLimitSwitch;
window.unlockDoor = unlockDoor;
window.addActivityLog = function(msg, icon = "fa-info-circle") {
    addActivity("System", msg, icon);
};

// =========================================================
// INIT
// =========================================================
renderDevices(false);
updateDashboard();
updateProgress(10);

// Initial status
el.deteksiStatus.textContent = "TIDAK ADA PAKET";
el.deteksiStatus.style.color = "var(--text-muted)";
el.deteksiSub.textContent = "Sensor standby";
el.hardProx.textContent = "MENUNGGU PAKET";
el.hardProx.style.color = "var(--cyan)";
el.pintuStatus.textContent = "TERTUTUP";
el.pintuStatus.style.color = "var(--green)";
el.pintuSub.innerHTML = "🔒 Terkunci";
el.totalPaket.textContent = "0";

// Init chart with zeros
for (let i = 0; i < 7; i++) {
    chartData[i] = 0;
}
updateChartData(0);
updateDistribution();

addActivity("System Initialized", "SmartBox v6.0 siap digunakan", "fa-power-off");
addActivity("Security Active", "Monitoring proximity & limit switch", "fa-shield-halved");

showNotification("🚀 SmartBox Ready", "Sistem monitoring aktif", "info");

console.log("🚀 SMARTBOX v6.0 FINAL");
console.log("🔑 PIN Default: 0000");
console.log("📦 Kapasitas: 20 Paket");
console.log("📌 Fungsi: setProximity(), setLimitSwitch(), setESP32Connection()");

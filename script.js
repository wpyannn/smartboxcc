/* =========================================================
   DROPBOX CONTROL CENTER
   Sistem Monitoring dan Keamanan Dropbox Paket Pintar

   LOGIKA:
   - Proximity sensor  -> mendeteksi paket
   - PIN               -> autentikasi akses
   - Open Door         -> membuka solenoid
   - Limit Switch      -> mendeteksi pintu sudah tertutup
   - Limit Switch      -> memicu LOCK kembali
   - TIDAK menggunakan timer untuk mengunci pintu
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

// Mode simulasi sementara.
// Nanti dapat diganti ketika ESP32/Wokwi sudah terhubung.
const CONFIG = {

    username: "wafian",

    password: "1234",

    securityPIN: "1922",

    // Status awal hardware
    proximityDetected: false,

    limitSwitchClosed: true,

    doorOpen: false,

    solenoidUnlocked: false,

    esp32Connected: false

};


/* =========================================================
   APPLICATION STATE
========================================================= */

const state = {

    loggedIn: false,

    proximityDetected: CONFIG.proximityDetected,

    limitSwitchClosed: CONFIG.limitSwitchClosed,

    doorOpen: CONFIG.doorOpen,

    solenoidUnlocked: CONFIG.solenoidUnlocked,

    esp32Connected: CONFIG.esp32Connected,

    activity: []

};


/* =========================================================
   DOM ELEMENTS
========================================================= */

const proximityStatus =
    document.getElementById("proximityStatus");

const packageStatus =
    document.getElementById("packageStatus");

const packageSub =
    document.getElementById("packageSub");

const doorStatus =
    document.getElementById("doorStatus");

const doorSub =
    document.getElementById("doorSub");

const limitSwitch =
    document.getElementById("limitSwitch");

const hardwareProximity =
    document.getElementById("hardwareProximity");

const esp32Status =
    document.getElementById("esp32Status");

const accessDoorStatus =
    document.getElementById("accessDoorStatus");

const accessLimitStatus =
    document.getElementById("accessLimitStatus");

const solenoidStatus =
    document.getElementById("solenoidStatus");

const doorVisual =
    document.getElementById("doorVisual");

const activityList =
    document.getElementById("activityList");

const fullActivityList =
    document.getElementById("fullActivityList");


/* Buttons */

const openDoorBtn =
    document.getElementById("openDoorBtn");

const openDoorBtn2 =
    document.getElementById("openDoorBtn2");

const closeModal =
    document.getElementById("closeModal");

const cancelPin =
    document.getElementById("cancelPin");

const confirmPin =
    document.getElementById("confirmPin");

const clearLog =
    document.getElementById("clearLog");


/* Modal */

const pinModal =
    document.getElementById("pinModal");

const pinInput =
    document.getElementById("pinInput");

const pinMessage =
    document.getElementById("pinMessage");


/* Other */

const toast =
    document.getElementById("toast");

const dateLine =
    document.getElementById("dateLine");

const pageTitle =
    document.getElementById("pageTitle");

const gatewayStatus =
    document.getElementById("gatewayStatus");


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeApplication();

});


function initializeApplication() {

    updateDateTime();

    setInterval(updateDateTime, 1000);

    updateDashboard();

    renderActivity();

    setupNavigation();

}


/* =========================================================
   DATE & TIME
========================================================= */

function updateDateTime() {

    const now = new Date();

    const options = {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    };

    dateLine.textContent =
        now.toLocaleDateString(
            "id-ID",
            options
        );

}

/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    const navItems =
        document.querySelectorAll(".nav-item");

    const sections = {

        dashboard:
            document.getElementById(
                "dashboardSection"
            ),

        access:
            document.getElementById(
                "accessSection"
            ),

        activity:
            document.getElementById(
                "activitySection"
            ),

        settings:
            document.getElementById(
                "settingsSection"
            )

    };


    navItems.forEach(item => {

        item.addEventListener(
            "click",
            () => {

                const sectionName =
                    item.dataset.section;


                navItems.forEach(nav => {

                    nav.classList.remove(
                        "active"
                    );

                });


                item.classList.add("active");


                Object.values(sections)
                    .forEach(section => {

                        section.classList.add(
                            "hidden"
                        );

                    });


                sections[
                    sectionName
                ].classList.remove("hidden");


                updatePageTitle(
                    sectionName
                );

            }
        );

    });


    document
        .querySelectorAll("[data-section]")
        .forEach(button => {

            if (
                !button.classList.contains(
                    "nav-item"
                )
            ) {

                button.addEventListener(
                    "click",
                    () => {

                        const section =
                            button.dataset.section;

                        const nav =
                            document.querySelector(
                                `.nav-item[data-section="${section}"]`
                            );

                        if (nav) {

                            nav.click();

                        }

                    }
                );

            }

        });

}


/* =========================================================
   PAGE TITLE
========================================================= */

function updatePageTitle(section) {

    const titles = {

        dashboard:
            "Dashboard",

        access:
            "Kontrol Akses",

        activity:
            "Aktivitas Sistem",

        settings:
            "Pengaturan"

    };


    pageTitle.textContent =
        titles[section] || "Dashboard";

}


/* =========================================================
   OPEN DOOR REQUEST
========================================================= */

openDoorBtn.addEventListener(
    "click",
    openPinModal
);


openDoorBtn2.addEventListener(
    "click",
    openPinModal
);


function openPinModal() {

    /*
       Jika pintu masih terbuka,
       jangan membuka akses lagi.
    */

    if (state.doorOpen) {

        showToast(
            "Pintu masih terbuka."
        );

        return;

    }


    /*
       Reset input PIN
    */

    pinInput.value = "";

    pinMessage.textContent = "";


    /*
       Tampilkan modal PIN
    */

    pinModal.classList.remove(
        "hidden"
    );


    /*
       Fokus otomatis ke input PIN
    */

    setTimeout(() => {

        pinInput.focus();

    }, 100);

}

/* =========================================================
   CLOSE PIN MODAL
========================================================= */

function closePinModal() {

    pinModal.classList.add("hidden");

    pinInput.value = "";

    pinMessage.textContent = "";

}


closeModal.addEventListener(
    "click",
    closePinModal
);


cancelPin.addEventListener(
    "click",
    closePinModal
);


/* Klik area luar modal */

pinModal.addEventListener(
    "click",
    event => {

        if (event.target === pinModal) {

            closePinModal();

        }

    }
);


/* =========================================================
   PIN VERIFICATION
========================================================= */

confirmPin.addEventListener(
    "click",
    verifyPIN
);


pinInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            verifyPIN();

        }

    }
);


function verifyPIN() {

    const pin =
        pinInput.value.trim();


    if (pin.length === 0) {

        pinMessage.textContent =
            "Masukkan PIN terlebih dahulu.";

        return;

    }


    if (pin !== CONFIG.securityPIN) {

        pinMessage.textContent =
            "PIN salah. Akses ditolak.";

        addActivity(
            "Akses ditolak",
            "PIN keamanan tidak valid",
            "fa-shield-halved"
        );

        showToast(
            "PIN salah. Pintu tetap terkunci."
        );

        return;

    }


    pinMessage.textContent = "";

    closePinModal();

    unlockDoor();

}


/* =========================================================
   UNLOCK DOOR
========================================================= */

function unlockDoor() {

    /*
       PERINTAH UNLOCK

       Pada tahap simulasi:
       state.solenoidUnlocked = true

       Nanti bagian ini menjadi komunikasi
       ke ESP32.
    */

    state.solenoidUnlocked = true;

    state.doorOpen = true;

    /*
       Limit switch belum tertutup.
       Karena pintu sedang dibuka,
       status limit switch menjadi OPEN.
    */

    state.limitSwitchClosed = false;


    addActivity(
        "Pintu dibuka",
        "Autentikasi berhasil dan solenoid UNLOCK",
        "fa-lock-open"
    );


    showToast(
        "Akses diterima. Pintu telah dibuka."
    );


    updateDashboard();

}


/* =========================================================
   LIMIT SWITCH
========================================================= */

/*
   FUNGSI INI ADALAH BAGIAN PENTING.

   Nanti ESP32 akan mengirim status limit switch
   ke website.

   Contoh:

   setLimitSwitch(true);

   berarti:
   LIMIT SWITCH TERTEKAN
   pintu sudah tertutup.

   setLimitSwitch(false);

   berarti:
   LIMIT SWITCH TIDAK TERTEKAN
   pintu belum tertutup.
*/

function setLimitSwitch(isClosed) {

    state.limitSwitchClosed =
        Boolean(isClosed);


    if (state.limitSwitchClosed) {

        handleDoorClosed();

    }

    else {

        state.doorOpen = true;

        updateDashboard();

    }

}


/* =========================================================
   DOOR CLOSED
========================================================= */

function handleDoorClosed() {

    /*
       LIMIT SWITCH TERTEKAN
       berarti pintu sudah benar-benar tertutup.

       BARU SEKARANG SISTEM MENGUNCI SOLENOID.

       TIDAK ADA TIMER.
    */

    state.doorOpen = false;

    state.solenoidUnlocked = false;


    addActivity(
        "Pintu tertutup",
        "Limit switch aktif. Solenoid kembali LOCK.",
        "fa-door-closed"
    );


    showToast(
        "Pintu tertutup. Sistem kembali terkunci."
    );


    updateDashboard();

}


/* =========================================================
   SIMULASI LIMIT SWITCH
========================================================= */

/*
   Tombol ini tidak ditampilkan pada UI.

   Untuk pengujian dari browser,
   buka Console browser lalu gunakan:

   setLimitSwitch(true);

   = pintu tertutup

   setLimitSwitch(false);

   = pintu terbuka
*/


window.setLimitSwitch =
    setLimitSwitch;


/* =========================================================
   PROXIMITY SENSOR
========================================================= */

/*
   Fungsi ini nantinya dipanggil oleh data ESP32.

   true  = paket terdeteksi
   false = tidak ada paket
*/

function setProximitySensor(isDetected) {

    state.proximityDetected =
        Boolean(isDetected);


    updateProximity();

}


window.setProximitySensor =
    setProximitySensor;


/* =========================================================
   PROXIMITY UPDATE
========================================================= */

function updateProximity() {

    if (state.proximityDetected) {

        proximityStatus.textContent =
            "PAKET TERDETEKSI";

        packageStatus.textContent =
            "PAKET TERSEDIA";

        packageSub.textContent =
            "Sensor proximity mendeteksi paket";

        hardwareProximity.textContent =
            "DETECTED";

    }

    else {

        proximityStatus.textContent =
            "TIDAK TERDETEKSI";

        packageStatus.textContent =
            "BELUM ADA PAKET";

        packageSub.textContent =
            "Area sensor kosong";

        hardwareProximity.textContent =
            "CLEAR";

    }

}


/* =========================================================
   UPDATE DOOR
========================================================= */

function updateDoorStatus() {

    if (state.doorOpen) {

        doorStatus.textContent =
            "TERBUKA";

        doorSub.textContent =
            "Menunggu pintu ditutup";

        accessDoorStatus.textContent =
            "TERBUKA";

        doorVisual.innerHTML =
            `
            <i class="fa-solid fa-lock-open"></i>
            <strong>UNLOCKED</strong>
            `;

        solenoidStatus.textContent =
            "UNLOCK";

        openDoorBtn.disabled = true;

    }

    else {

        doorStatus.textContent =
            "TERKUNCI";

        doorSub.textContent =
            "Pintu terkunci";

        accessDoorStatus.textContent =
            "TERKUNCI";

        doorVisual.innerHTML =
            `
            <i class="fa-solid fa-lock"></i>
            <strong>LOCKED</strong>
            `;

        solenoidStatus.textContent =
            "LOCK";

        openDoorBtn.disabled = false;

    }


    /*
       LIMIT SWITCH STATUS
    */

    if (state.limitSwitchClosed) {

        limitSwitch.textContent =
            "CLOSED";

        accessLimitStatus.textContent =
            "CLOSED";

    }

    else {

        limitSwitch.textContent =
            "OPEN";

        accessLimitStatus.textContent =
            "OPEN";

    }

}


/* =========================================================
   UPDATE DASHBOARD
========================================================= */

function updateDashboard() {

    updateProximity();

    updateDoorStatus();

    updateESP32Status();

}


/* =========================================================
   ESP32 STATUS
========================================================= */

function updateESP32Status() {

    if (state.esp32Connected) {

        esp32Status.textContent =
            "ESP32 CONNECTED";

        gatewayStatus.textContent =
            "ESP32 terhubung";

    }

    else {

        esp32Status.textContent =
            "READY FOR CONNECTION";

        gatewayStatus.textContent =
            "Belum terhubung";

    }

}


/* =========================================================
   ESP32 CONNECTION
========================================================= */

/*
   Fungsi ini nanti dipakai ketika ESP32/Wokwi
   sudah benar-benar dihubungkan.

   Contoh:

   setESP32Connection(true);

*/

function setESP32Connection(isConnected) {

    state.esp32Connected =
        Boolean(isConnected);


    if (state.esp32Connected) {

        addActivity(
            "ESP32 terhubung",
            "Gateway IoT berhasil terkoneksi",
            "fa-microchip"
        );

    }

    else {

        addActivity(
            "ESP32 terputus",
            "Gateway IoT tidak terhubung",
            "fa-triangle-exclamation"
        );

    }


    updateESP32Status();

}


window.setESP32Connection =
    setESP32Connection;


/* =========================================================
   ACTIVITY LOG
========================================================= */

function addActivity(
    title,
    description,
    icon
) {

    const now = new Date();

    const time =
        now.toLocaleTimeString(
            "id-ID",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );


    state.activity.unshift({

        title,
        description,
        icon,
        time

    });


    /*
       Batasi jumlah log di browser.
    */

    if (state.activity.length > 30) {

        state.activity.pop();

    }


    renderActivity();

}


/* =========================================================
   RENDER ACTIVITY
========================================================= */

function renderActivity() {

    if (!activityList ||
        !fullActivityList) {

        return;

    }


    if (state.activity.length === 0) {

        const emptyHTML = `
            <div class="activity">
                <div class="activity-icon">
                    <i class="fa-solid fa-circle-info"></i>
                </div>

                <div class="activity-text">
                    <strong>Belum ada aktivitas</strong>
                    <p>Aktivitas sistem akan muncul di sini.</p>
                </div>

                <time>--:--:--</time>
            </div>
        `;

        activityList.innerHTML =
            emptyHTML;

        fullActivityList.innerHTML =
            emptyHTML;

        return;

    }


    const latest =
        state.activity.slice(0, 5);


    activityList.innerHTML =
        latest.map(
            createActivityHTML
        ).join("");


    fullActivityList.innerHTML =
        state.activity.map(
            createActivityHTML
        ).join("");

}


function createActivityHTML(activity) {

    return `
        <div class="activity">

            <div class="activity-icon">

                <i class="fa-solid ${activity.icon}"></i>

            </div>


            <div class="activity-text">

                <strong>
                    ${activity.title}
                </strong>

                <p>
                    ${activity.description}
                </p>

            </div>


            <time>
                ${activity.time}
            </time>

        </div>
    `;

}


/* =========================================================
   CLEAR ACTIVITY LOG
========================================================= */

clearLog.addEventListener(
    "click",
    () => {

        state.activity = [];

        renderActivity();

        showToast(
            "Activity log telah dihapus."
        );

    }
);


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

    toast.textContent =
        message;

    toast.classList.add("show");


    /*
       Timer di sini HANYA untuk menghilangkan
       notifikasi visual.

       BUKAN untuk mengontrol pintu.
    */

    setTimeout(() => {

        toast.classList.remove(
            "show"
        );

    }, 3000);

}


/* =========================================================
   INITIAL SYSTEM LOG
========================================================= */

addActivity(
    "System initialized",
    "SmartBox Control Center siap digunakan",
    "fa-power-off"
);


addActivity(
    "Security system ready",
    "Monitoring proximity dan limit switch aktif",
    "fa-shield-halved"
);


/* =========================================================
   DEVELOPMENT TEST COMMANDS

   Browser Console:

   setProximitySensor(true)
   setProximitySensor(false)

   setLimitSwitch(false)
   setLimitSwitch(true)

   setESP32Connection(true)
   setESP32Connection(false)
========================================================= */
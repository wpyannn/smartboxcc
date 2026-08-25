/* =========================================================
   SMARTBOX CYBERPUNK v6.0 - PREMIUM
   Fitur: Loading, Progress Bar, Refresh, Tooltip, dll
========================================================= */

let CONFIG = {
    securityPIN: "1234",
    proximityDetected: false,
    limitSwitchClosed: true,
    doorOpen: false,
    solenoidUnlocked: false,
    esp32Connected: true
};

const state = {
    proximityDetected: CONFIG.proximityDetected,
    limitSwitchClosed: CONFIG.limitSwitchClosed,
    doorOpen: CONFIG.doorOpen,
    solenoidUnlocked: CONFIG.solenoidUnlocked,
    esp32Connected: CONFIG.esp32Connected,
    activity: [],
    totalPaket: 0,
    hariIni: 0
};

const $ = id => document.getElementById(id);

const el = {
    proxStatus: $("proxStatus"), proxSub: $("proxSub"), pkgStatus: $("pkgStatus"), pkgSub: $("pkgSub"),
    doorStatus: $("doorStatus"), doorSub: $("doorSub"), limitStatus: $("limitStatus"),
    hardProx: $("hardProx"), espStatus: $("espStatus"), accDoor: $("accDoor"), accLimit: $("accLimit"),
    accSolenoid: $("accSolenoid"), doorDisplay: $("doorDisplay"), activityList: $("activityList"),
    fullActivityList: $("fullActivityList"), gatewayStatus: $("gatewayStatus"),
    accDoor2: $("accDoor2"), accLimit2: $("accLimit2"), accSolenoid2: $("accSolenoid2"),
    openBtn: $("openBtn"), openBtn2: $("openBtn2"), pinModal: $("pinModal"), pinInput: $("pinInput"),
    pinMsg: $("pinMsg"), toast: $("toast"), notifCount: $("notifCount"),
    changePasswordModal: $("changePasswordModal"), resetModal: $("resetModal"), aboutModal: $("aboutModal"),
    oldPin: $("oldPin"), newPin: $("newPin"), confirmNewPin: $("confirmNewPin"), changePinMsg: $("changePinMsg"),
    heroTotalPaket: $("heroTotalPaket"), heroHariIni: $("heroHariIni"),
    progressFill: $("progressFill"), progressPercent: $("progressPercent")
};

// ===== LOADING SCREEN =====
window.addEventListener("load", function() {
    setTimeout(function() {
        document.getElementById("loadingScreen").classList.add("fade");
    }, 1200);
});

// ===== HAMBURGER =====
const hamburger = document.getElementById("hamburgerBtn"), sidebar = document.getElementById("sidebar"), overlay = document.getElementById("sidebarOverlay"), sidebarClose = document.getElementById("sidebarClose");
function toggleSidebar(e){if(e)e.stopPropagation();sidebar.classList.toggle("active");overlay.classList.toggle("active");hamburger.classList.toggle("active");document.body.style.overflow=sidebar.classList.contains("active")?"hidden":"";}
if(hamburger){hamburger.addEventListener("click",toggleSidebar);hamburger.addEventListener("touchstart",function(e){e.preventDefault();toggleSidebar(e);},{passive:false});}
if(sidebarClose)sidebarClose.addEventListener("click",toggleSidebar);if(overlay)overlay.addEventListener("click",toggleSidebar);
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&sidebar.classList.contains("active"))toggleSidebar();});

// ===== CLOCK =====
function updateClock(){const n=new Date();$("clockTime").textContent=n.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit",second:"2-digit"});$("clockDate").textContent=n.toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"});}
updateClock();setInterval(updateClock,1000);

// ===== NAVIGATION =====
document.querySelectorAll(".sidebar-nav a, .btn-link[data-section]").forEach(i=>{i.addEventListener("click",function(){const s=this.dataset.section;if(!s)return;document.querySelectorAll(".sidebar-nav a").forEach(n=>n.classList.remove("active"));document.querySelectorAll(".section").forEach(s=>s.classList.add("hidden"));this.classList.add("active");document.getElementById(s+"Section").classList.remove("hidden");if(window.innerWidth<=1024)toggleSidebar();});});

// ===== TOAST =====
function showToast(msg){el.toast.textContent=msg;el.toast.classList.add("show");clearTimeout(el.toast._timer);el.toast._timer=setTimeout(()=>el.toast.classList.remove("show"),3000);}

// ===== ACTIVITY =====
function addActivity(title,desc,icon="fa-info-circle"){const n=new Date(),time=n.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit",second:"2-digit"});state.activity.unshift({title,desc,icon,time});if(state.activity.length>50)state.activity.pop();renderActivity();updateHeroStats();const c=parseInt(el.notifCount.textContent)+1;el.notifCount.textContent=c;el.notifCount.style.display="flex";}
function renderActivity(){if(state.activity.length===0){const e='<div class="activity"><div class="activity-icon"><i class="fas fa-info-circle"></i></div><div class="activity-text"><strong>Belum ada aktivitas</strong><p>Log akan muncul di sini</p></div><time>--:--</time></div>';el.activityList.innerHTML=e;el.fullActivityList.innerHTML=e;return;}const latest=state.activity.slice(0,5);el.activityList.innerHTML=latest.map(a=>`<div class="activity"><div class="activity-icon"><i class="fas ${a.icon}"></i></div><div class="activity-text"><strong>${a.title}</strong><p>${a.desc}</p></div><time>${a.time}</time></div>`).join("");el.fullActivityList.innerHTML=state.activity.map(a=>`<div class="activity"><div class="activity-icon"><i class="fas ${a.icon}"></i></div><div class="activity-text"><strong>${a.title}</strong><p>${a.desc}</p></div><time>${a.time}</time></div>`).join("");}
$("clearLog")?.addEventListener("click",()=>{state.activity=[];renderActivity();el.notifCount.textContent="0";showToast("Log dihapus");});

// ===== HERO STATS =====
function updateHeroStats(){el.heroTotalPaket.textContent=state.activity.length;const today=new Date().toLocaleDateString();const todayCount=state.activity.filter(a=>a.time.includes(today)||a.time.includes(new Date().toLocaleTimeString().slice(0,5))).length;el.heroHariIni.textContent=todayCount||Math.floor(Math.random()*5)+1;}

// ===== PROGRESS BAR =====
function updateProgress(val){const v=Math.min(100,Math.max(0,val));el.progressFill.style.width=v+"%";el.progressPercent.textContent=v+"%";}

// ===== PROXIMITY =====
function setProximitySensor(d){state.proximityDetected=!!d;if(state.proximityDetected){el.proxStatus.textContent="DETECTED";el.proxSub.textContent="Paket terdeteksi";el.pkgStatus.textContent="TERSEDIA";el.pkgSub.textContent="Ada paket";el.hardProx.textContent="DETECTED";addActivity("Paket terdeteksi","Sensor proximity mendeteksi paket","fa-box");}else{el.proxStatus.textContent="CLEAR";el.proxSub.textContent="Tidak ada paket";el.pkgStatus.textContent="KOSONG";el.pkgSub.textContent="Tidak ada";el.hardProx.textContent="CLEAR";}updateProgress(Math.floor(Math.random()*10)+90);}
window.setProximitySensor=setProximitySensor;

// ===== LIMIT SWITCH =====
function setLimitSwitch(c){state.limitSwitchClosed=!!c;if(state.limitSwitchClosed){state.doorOpen=false;state.solenoidUnlocked=false;addActivity("Pintu tertutup","Limit switch aktif. Solenoid LOCK","fa-door-closed");showToast("🔒 Pintu tertutup - Terkunci!");}else{state.doorOpen=true;state.solenoidUnlocked=true;addActivity("Pintu terbuka","Limit switch tidak aktif. Solenoid UNLOCK","fa-lock-open");showToast("🔓 Pintu terbuka");}updateDashboard();}
window.setLimitSwitch=setLimitSwitch;

function unlockDoor(){state.limitSwitchClosed=false;state.doorOpen=true;state.solenoidUnlocked=true;addActivity("Pintu dibuka","Verifikasi PIN berhasil. Solenoid UNLOCK","fa-lock-open");showToast("✅ Akses diterima. Pintu terbuka!");updateDashboard();}

function updateDashboard(){
    if(state.doorOpen){el.doorStatus.textContent="TERBUKA";el.doorSub.textContent="Menunggu ditutup";el.accDoor.textContent="TERBUKA";el.accDoor2.textContent="TERBUKA";el.doorDisplay.innerHTML='<i class="fas fa-lock-open"></i><strong>UNLOCKED</strong>';el.accSolenoid.textContent="UNLOCK";el.accSolenoid2.textContent="UNLOCK";el.openBtn.disabled=true;el.openBtn2.disabled=true;el.doorDisplay.style.color="var(--green)";el.doorDisplay.style.borderColor="rgba(0,255,136,0.2)";}else{el.doorStatus.textContent="TERKUNCI";el.doorSub.textContent="Aman";el.accDoor.textContent="TERKUNCI";el.accDoor2.textContent="TERKUNCI";el.doorDisplay.innerHTML='<i class="fas fa-lock"></i><strong>LOCKED</strong>';el.accSolenoid.textContent="LOCK";el.accSolenoid2.textContent="LOCK";el.openBtn.disabled=false;el.openBtn2.disabled=false;el.doorDisplay.style.color="var(--yellow)";el.doorDisplay.style.borderColor="rgba(255,230,0,0.1)";}
    const ls=state.limitSwitchClosed?"CLOSED":"OPEN";el.limitStatus.textContent=ls;el.accLimit.textContent=ls;el.accLimit2.textContent=ls;
}

// ===== ESP32 =====
function setESP32Connection(c){state.esp32Connected=!!c;if(state.esp32Connected){el.espStatus.textContent="CONNECTED";el.gatewayStatus.textContent="Connected";$("espLed").className="cyber-led online";$("espText").textContent="ONLINE";addActivity("ESP32 terhubung","Gateway IoT terkoneksi","fa-microchip");}else{el.espStatus.textContent="DISCONNECTED";el.gatewayStatus.textContent="Disconnected";$("espLed").className="cyber-led offline";$("espText").textContent="OFFLINE";addActivity("ESP32 terputus","Gateway IoT tidak terhubung","fa-triangle-exclamation");}}
window.setESP32Connection=setESP32Connection;

// ===== PIN MODAL =====
function openPinModal(){if(state.doorOpen){showToast("⚠️ Pintu masih terbuka!");return;}el.pinInput.value="";el.pinMsg.textContent="";el.pinModal.classList.remove("hidden");setTimeout(()=>el.pinInput.focus(),100);}
function closePinModal(){el.pinModal.classList.add("hidden");el.pinInput.value="";el.pinMsg.textContent="";}
el.openBtn.addEventListener("click",openPinModal);el.openBtn2.addEventListener("click",openPinModal);$("closeModal")?.addEventListener("click",closePinModal);$("cancelPin")?.addEventListener("click",closePinModal);el.pinModal.addEventListener("click",e=>{if(e.target===el.pinModal)closePinModal();});
function verifyPIN(){const p=el.pinInput.value.trim();if(!p){el.pinMsg.textContent="Masukkan PIN!";return;}if(p!==CONFIG.securityPIN){el.pinMsg.textContent="❌ PIN salah!";addActivity("Akses ditolak","PIN keamanan tidak valid","fa-shield-halved");showToast("❌ PIN salah!");el.pinInput.value="";el.pinInput.focus();return;}el.pinMsg.textContent="";closePinModal();unlockDoor();}
$("confirmPin")?.addEventListener("click",verifyPIN);el.pinInput.addEventListener("keydown",e=>{if(e.key==="Enter")verifyPIN();});

// ===== UBAH SANDI =====
function openChangePassword(){el.changePasswordModal.classList.remove("hidden");el.oldPin.value="";el.newPin.value="";el.confirmNewPin.value="";el.changePinMsg.textContent="";setTimeout(()=>el.oldPin.focus(),100);}
function closeChangePassword(){el.changePasswordModal.classList.add("hidden");}
$("changePasswordBtn")?.addEventListener("click",openChangePassword);$("closeChangePassword")?.addEventListener("click",closeChangePassword);$("cancelChangePassword")?.addEventListener("click",closeChangePassword);el.changePasswordModal.addEventListener("click",e=>{if(e.target===el.changePasswordModal)closeChangePassword();});
$("confirmChangePassword")?.addEventListener("click",function(){const o=el.oldPin.value.trim(),n=el.newPin.value.trim(),c=el.confirmNewPin.value.trim();if(o!==CONFIG.securityPIN){el.changePinMsg.textContent="❌ PIN lama salah!";el.changePinMsg.style.color="var(--pink)";return;}if(n.length<4){el.changePinMsg.textContent="❌ PIN baru minimal 4 digit!";el.changePinMsg.style.color="var(--pink)";return;}if(n!==c){el.changePinMsg.textContent="❌ Konfirmasi PIN tidak cocok!";el.changePinMsg.style.color="var(--pink)";return;}if(n===o){el.changePinMsg.textContent="⚠️ PIN baru sama dengan PIN lama!";el.changePinMsg.style.color="var(--yellow)";return;}CONFIG.securityPIN=n;el.changePinMsg.textContent="✅ PIN berhasil diubah!";el.changePinMsg.style.color="var(--green)";addActivity("PIN diubah","PIN keamanan sistem telah diganti","fa-key");showToast("✅ PIN berhasil diubah!");setTimeout(closeChangePassword,1500);});

// ===== RESET =====
$("resetSystemBtn")?.addEventListener("click",()=>{$("resetModal").classList.remove("hidden");});
$("closeReset")?.addEventListener("click",()=>{$("resetModal").classList.add("hidden");});$("cancelReset")?.addEventListener("click",()=>{$("resetModal").classList.add("hidden");});
$("resetModal")?.addEventListener("click",function(e){if(e.target===this)$("resetModal").classList.add("hidden");});
$("confirmReset")?.addEventListener("click",function(){state.activity=[];renderActivity();el.notifCount.textContent="0";state.doorOpen=false;state.solenoidUnlocked=false;state.limitSwitchClosed=true;updateDashboard();updateHeroStats();addActivity("Sistem direset","Semua data aktivitas dihapus","fa-redo");showToast("🔄 Sistem telah direset!");$("resetModal").classList.add("hidden");});

// ===== ABOUT =====
$("aboutBtn")?.addEventListener("click",()=>{$("aboutModal").classList.remove("hidden");});
$("closeAbout")?.addEventListener("click",()=>{$("aboutModal").classList.add("hidden");});$("closeAboutBtn")?.addEventListener("click",()=>{$("aboutModal").classList.add("hidden");});
$("aboutModal")?.addEventListener("click",function(e){if(e.target===this)$("aboutModal").classList.add("hidden");});

// ===== EXPORT =====
$("exportDataBtn")?.addEventListener("click",function(){if(state.activity.length===0){showToast("⚠️ Tidak ada data!","error");return;}const h=["Waktu","Aktivitas","Deskripsi"],r=state.activity.map(a=>[a.time,a.title,a.desc]),csv=[h.join(","),...r.map(r=>r.join(","))].join("\n"),b=new Blob([csv],{type:"text/csv"}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=`smartbox_log_${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(u);showToast("📥 Data berhasil diexport!");if(window.innerWidth<=1024)toggleSidebar();});

// ===== REFRESH DATA =====
$("refreshDataBtn")?.addEventListener("click",function(){showToast("🔄 Memperbarui data...");setTimeout(()=>{updateDashboard();updateProgress(Math.floor(Math.random()*15)+85);addActivity("Data direfresh","Sistem memperbarui data dari ESP32","fa-sync");showToast("✅ Data berhasil diperbarui!");if(window.innerWidth<=1024)toggleSidebar();},1000);});

// ===== THEME =====
let isDark=true;$("themeToggleSidebar")?.addEventListener("click",function(){isDark=!isDark;const r=document.documentElement;if(isDark){r.style.setProperty("--bg-primary","#0a0a12");r.style.setProperty("--bg-secondary","#111122");r.style.setProperty("--text-primary","#e0e0ff");r.style.setProperty("--text-secondary","#8899bb");this.innerHTML='<i class="fas fa-moon"></i> Mode Gelap';}else{r.style.setProperty("--bg-primary","#f0ecff");r.style.setProperty("--bg-secondary","#e8e0f5");r.style.setProperty("--text-primary","#1a1035");r.style.setProperty("--text-secondary","#554477");this.innerHTML='<i class="fas fa-sun"></i> Mode Terang';}showToast(isDark?"🌙 Mode Gelap":"☀️ Mode Terang");if(window.innerWidth<=1024)toggleSidebar();});

// ===== CHARTS =====
const pkg={labels:["Sen","Sel","Rab","Kam","Jum","Sab","Min"],values:[8,12,6,15,10,18,14]};
const total=pkg.values.reduce((a,b)=>a+b,0),peak=Math.max(...pkg.values),peakLabel=pkg.labels[pkg.values.indexOf(peak)];
$("weekTotal").textContent=total;$("weekPeak").textContent=peakLabel+" ("+peak+")";
const c1=document.getElementById("activityChart").getContext("2d"),g=c1.createLinearGradient(0,0,0,180);g.addColorStop(0,"rgba(0,240,255,0.25)");g.addColorStop(1,"rgba(0,240,255,0.01)");
const actChart=new Chart(c1,{type:"line",data:{labels:pkg.labels,datasets:[{label:"Paket",data:pkg.values,borderColor:"#00f0ff",backgroundColor:g,fill:true,tension:0.4,pointBackgroundColor:"#00f0ff",pointBorderColor:"#0a0a12",pointBorderWidth:2,pointRadius:4,pointHoverRadius:7}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:"rgba(10,10,18,0.9)",titleColor:"#e0e0ff",bodyColor:"#8899bb",borderColor:"rgba(0,240,255,0.2)",borderWidth:1,cornerRadius:8}},scales:{x:{grid:{color:"rgba(255,255,255,0.03)"},ticks:{color:"#445577"}},y:{grid:{color:"rgba(255,255,255,0.03)"},ticks:{color:"#445577",stepSize:5}}},animation:{duration:1200,easing:"easeOutQuart"}}});
new Chart(document.getElementById("distributionChart").getContext("2d"),{type:"doughnut",data:{labels:["Diterima","Menunggu","Ditolak"],datasets:[{data:[65,25,10],backgroundColor:["#00f0ff","#ffe600","#ff2d95"],borderColor:"#0a0a12",borderWidth:3}]},options:{responsive:true,maintainAspectRatio:false,cutout:"70%",plugins:{legend:{position:"bottom",labels:{color:"#8899bb",font:{size:11},boxWidth:12,padding:12}}},animation:{animateRotate:true,duration:1000}}});

window.updatePackageChart=function(d){actChart.data.labels=d.labels;actChart.data.datasets[0].data=d.values;actChart.update();const t=d.values.reduce((a,b)=>a+b,0),p=Math.max(...d.values),pl=d.labels[d.values.indexOf(p)];$("weekTotal").textContent=t;$("weekPeak").textContent=pl+" ("+p+")";};
window.addActivityLog=function(m,i="fa-info-circle"){addActivity("System",m,i);};

// ===== AUTO SIMULASI =====
setInterval(()=>{const l=$("espLed"),t=$("espText");if(Math.random()>0.08){l.className="cyber-led online";t.textContent="ONLINE";}else{l.className="cyber-led offline";t.textContent="OFFLINE";}},30000);

// ===== INIT =====
addActivity("System initialized","SmartBox Cyberpunk v6.0 Premium ready","fa-power-off");
addActivity("Security active","Monitoring proximity & limit switch","fa-shield-halved");
updateDashboard();setProximitySensor(false);setESP32Connection(true);updateHeroStats();updateProgress(98);

console.log("🚀 SMARTBOX CYBERPUNK v6.0 PREMIUM");
console.log("🔥 Fitur: Loading | Progress Bar | Refresh | Tooltip | Font Premium");
console.log("🔑 PIN Default: 1234");
console.log("📌 setProximitySensor(), setLimitSwitch(), setESP32Connection()");

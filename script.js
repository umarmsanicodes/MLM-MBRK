// ================================================================
// 0. ENSURE BODY HAS 'pre-login' CLASS FROM THE START
//    This hides the navbar immediately, preventing any flash.
// ================================================================
document.body.classList.add('pre-login');

// ================================================================
// 1. SPLASH ANIMATION
// ================================================================
(function runSplash() {
    const splashScreen = document.getElementById('splashScreen');
    const quranBook = document.getElementById('quranBook');
    const titleEl = document.getElementById('splashTitle');
    const arabicEl = document.getElementById('splashArabic');
    const taglineEl = document.getElementById('splashTagline');

    const englishText = 'Mubarak Smart Islamic Academy';
    const arabicWords = ['الأكاديمية', 'الإسلامية', 'للتميز', 'القرآني'];

    setTimeout(() => {
        quranBook.classList.remove('closed');
        quranBook.classList.add('open');
    }, 500);

    let englishIndex = 0;
    const englishChars = englishText.split('');

    function typeEnglish() {
        if (englishIndex < englishChars.length) {
            const span = document.createElement('span');
            span.className = 'letter';
            span.textContent = englishChars[englishIndex];
            titleEl.appendChild(span);
            englishIndex++;
            setTimeout(typeEnglish, 70);
        } else {
            titleEl.classList.add('visible');
            setTimeout(typeArabic, 300);
        }
    }

    let arabicIndex = 0;

    function typeArabic() {
        if (arabicIndex < arabicWords.length) {
            const span = document.createElement('span');
            span.className = 'word';
            span.textContent = arabicWords[arabicIndex];
            arabicEl.appendChild(span);
            arabicIndex++;
            setTimeout(typeArabic, 450);
        } else {
            arabicEl.classList.add('visible');
            setTimeout(() => {
                taglineEl.classList.add('visible');
            }, 400);
        }
    }

    setTimeout(typeEnglish, 1500);

    const totalDuration = Math.max(
        1500 + (englishChars.length * 70),
        1500 + 300 + (arabicWords.length * 450)
    ) + 400 + 1000;
    const finalDuration = Math.max(totalDuration, 10000);

    setTimeout(() => {
        quranBook.classList.remove('open');
        quranBook.classList.add('closed');
        setTimeout(() => {
            splashScreen.classList.add('hidden');
            setTimeout(() => {
                splashScreen.style.display = 'none';
                renderUnifiedLoginPage(document.getElementById('appContainer'));
                document.getElementById("logoutBtn").classList.add("hidden");
                document.getElementById("adminDashboardBtn").classList.add("hidden");
                updateNotificationBadge();
            }, 1200);
        }, 1800);
    }, finalDuration);
})();

// ================================================================
// 2. JITSI MEET IMPLEMENTATION (MODIFIED: added voiceOnly parameter)
// ================================================================
let isInLiveClass = false;
let currentJitsiRoom = null;
let jitsiApiInstance = null;
let liveParticipants = [];
let jitsiRetryCount = 0;

function openJitsiMeeting(roomName, displayName, isHost, options = {}) {
    const sanitizedRoom = roomName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const overlay = document.getElementById('jitsiOverlay');
    const container = document.getElementById('jitsiIframeContainer');
    const label = document.getElementById('jitsiRoomLabel');
    const statusEl = document.getElementById('jitsiConnectionStatus');
    const msgEl = document.getElementById('connectionMessage');

    container.innerHTML = '';
    overlay.classList.add('active');

    // Determine if voice-only mode
    const startWithVideoMuted = options.voiceOnly === true;

    try {
        const domain = 'meet.jit.si';
        const optionsConfig = {
            roomName: sanitizedRoom,
            width: '100%',
            height: '100%',
            parentNode: container,
            userInfo: { displayName: displayName || (isHost ? 'Teacher' : 'Student') },
            configOverwrite: {
                startWithAudioMuted: false,
                startWithVideoMuted: startWithVideoMuted,
                disableDeepLinking: true,
                disableInviteFunctions: true,
                disableThirdPartyRequests: true,
                enableWelcomePage: false,
                p2p: { enabled: false },
                analytics: { disabled: true },
                disableProfile: true,
                hideLobbyButton: true,
                requireDisplayName: false,
                toolbarButtons: [
                    'microphone', 'camera', 'desktop', 'fullscreen',
                    'fodeviceselection', 'hangup', 'settings', 'videoquality', 'pip'
                ]
            },
            interfaceConfigOverwrite: {
                APP_NAME: 'Mubarak Academy',
                DEFAULT_BACKGROUND: '#0a1928',
                SHOW_BRAND_WATERMARK: false,
                SHOW_POWERED_BY: false,
                SHOW_DEEP_LINKING_IMAGE: false,
                TOOLBAR_ALWAYS_VISIBLE: true,
                MOBILE_APP_PROMO: false,
                NATIVE_APP_NAME: 'Mubarak Academy',
                DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
                HIDE_INVITE_MORE_HEADER: true,
                FILM_STRIP_MAX_HEIGHT: 0,
                VERTICAL_FILMSTRIP: false,
                SHOW_CHROME_EXTENSION_BANNER: false,
                HIDE_DEEP_LINKING_LOGO: true
            }
        };
        jitsiApiInstance = new JitsiMeetExternalAPI(domain, optionsConfig);
        label.textContent = `📹 ${roomName}`;
        document.getElementById('jitsiEndClassBtn').style.display = isHost ? 'inline-block' : 'none';

        isInLiveClass = true;
        currentJitsiRoom = sanitizedRoom;
        liveParticipants = [];

        statusEl.style.display = 'none';

        jitsiApiInstance.addListener('videoConferenceJoined', (data) => {
            console.log('Joined live class:', roomName);
            const myName = displayName || (isHost ? 'Teacher' : 'Student');
            const myId = data?.id || 'local';
            if (!liveParticipants.find(p => p.id === myId)) {
                liveParticipants.push({ id: myId, name: myName, isLocal: true });
            }
            renderLiveParticipants();
            updateParticipantCount();
        });

        jitsiApiInstance.addListener('participantJoined', (data) => {
            const name = data?.displayName || 'Student';
            const id = data?.id || 'unknown';
            if (!liveParticipants.find(p => p.id === id)) {
                liveParticipants.push({ id, name, isLocal: false });
                renderLiveParticipants();
                updateParticipantCount();
            }
        });

        jitsiApiInstance.addListener('participantLeft', (data) => {
            const id = data?.id || 'unknown';
            liveParticipants = liveParticipants.filter(p => p.id !== id);
            renderLiveParticipants();
            updateParticipantCount();
        });

        jitsiApiInstance.addListener('readyToClose', () => {
            liveParticipants = [];
            renderLiveParticipants();
        });

        jitsiApiInstance.addListener('connectionStatusChanged', (status) => {
            if (status === 'CONNECTING') {
                msgEl.textContent = 'Reconnecting...';
                statusEl.style.display = 'block';
            } else if (status === 'CONNECTED') {
                statusEl.style.display = 'none';
            } else if (status === 'DISCONNECTED') {
                msgEl.textContent = 'Connection lost. Check your network.';
                statusEl.style.display = 'block';
                jitsiRetryCount++;
                if (jitsiRetryCount > 3) {
                    alert('Unable to connect to Jitsi. Please refresh and try again.');
                }
            }
        });

        setTimeout(updateParticipantCount, 3000);
    } catch (error) {
        console.error('Jitsi Error:', error);
        msgEl.textContent = 'Failed to start live class. Please retry.';
        statusEl.style.display = 'block';
    }
}

function closeJitsiMeeting() {
    if (jitsiApiInstance) {
        jitsiApiInstance.dispose();
        jitsiApiInstance = null;
    }
    document.getElementById('jitsiOverlay').classList.remove('active');
    document.getElementById('jitsiIframeContainer').innerHTML = '';
    isInLiveClass = false;
    currentJitsiRoom = null;
    liveParticipants = [];
    renderLiveParticipants();
}

function updateParticipantCount() {
    if (!jitsiApiInstance) return;
    try {
        jitsiApiInstance.getParticipantsInfo().then(participants => {
            const count = participants ? participants.length : 0;
            document.querySelectorAll('.participant-count').forEach(el => el.textContent = count);
        }).catch(() => {});
    } catch (e) {}
}

function renderLiveParticipants() {
    const container = document.getElementById('liveParticipantsContainer');
    if (!container) return;
    if (liveParticipants.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; color:var(--gold-light); padding:1rem;">
                <i class="fas fa-users fa-2x" style="opacity:0.3;"></i>
                <p style="margin-top:0.5rem;">Waiting for students to join...</p>
            </div>
        `;
        return;
    }
    let html = '';
    liveParticipants.forEach(p => {
        const initial = p.name.charAt(0).toUpperCase();
        html += `
            <div class="student-card">
                <div class="avatar">${initial}</div>
                <div class="name">${p.name}</div>
                <div style="font-size:0.6rem; color:#2ecc71; margin-top:2px;">● LIVE</div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function retryJitsiConnection() {
    const statusEl = document.getElementById('jitsiConnectionStatus');
    statusEl.style.display = 'none';
    if (currentJitsiRoom && isInLiveClass) {
        const room = currentJitsiRoom;
        const displayName = isTeacher ? 'Teacher' : (currentStudent?.name || 'Student');
        const isHost = isTeacher;
        if (jitsiApiInstance) {
            jitsiApiInstance.dispose();
            jitsiApiInstance = null;
        }
        document.getElementById('jitsiIframeContainer').innerHTML = '';
        openJitsiMeeting(room, displayName, isHost);
    } else {
        window.location.reload();
    }
}
window.retryJitsiConnection = retryJitsiConnection;

// ================================================================
// MEDIA PERMISSIONS
// ================================================================
function requestMediaPermissions() {
    return new Promise((resolve, reject) => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => { stream.getTracks().forEach(track => track.stop());
                resolve(true); })
            .catch(err => showPermissionModal(resolve, reject));
    });
}

function showPermissionModal(resolve, reject) {
    const existing = document.querySelector('.permission-modal');
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.className = 'permission-modal';
    modal.innerHTML = `
            <div class="modal-content">
                <i class="fas fa-video" style="font-size:3rem; color:var(--gold); margin-bottom:1rem;"></i>
                <h3>Camera & Microphone Required</h3>
                <p>Camera and Microphone access are required to join this live class.</p>
                <button class="permission-btn allow" onclick="grantMediaPermissions()">
                    <i class="fas fa-camera"></i> Allow Camera & Microphone
                </button>
                <button class="permission-btn retry" onclick="retryPermissions()">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    document.body.appendChild(modal);
    window._permissionResolve = resolve;
    window._permissionReject = reject;
}

window.grantMediaPermissions = function() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
            stream.getTracks().forEach(track => track.stop());
            document.querySelector('.permission-modal')?.remove();
            if (window._permissionResolve) window._permissionResolve(true);
        })
        .catch(err => {
            const modal = document.querySelector('.permission-modal');
            if (modal) {
                modal.querySelector('p').textContent = '❌ Access denied. Please allow camera and microphone access and try again.';
                modal.querySelector('p').style.color = '#ff6b6b';
            }
            if (window._permissionReject) window._permissionReject(err);
        });
};

window.retryPermissions = function() {
    const modal = document.querySelector('.permission-modal');
    if (modal) {
        modal.querySelector('p').textContent = '🔄 Retrying... Please allow camera and microphone access.';
        modal.querySelector('p').style.color = 'var(--gold-light)';
    }
    requestMediaPermissions().then(window._permissionResolve).catch(window._permissionReject);
};

// ================================================================
// 3. GLOBAL STATE
// ================================================================
let isLoggedIn = false;
let students = [];
let timetableURL = "";
let activeLiveClass = null;
let nextClassInfo = { day: "Saturday", time: "8:00 PM", className: "Tajweed Level 1" };
let liveRoomType = null;
let adminPassword = "0708070";
let notifications = [];
let isTeacher = false;
let currentStudent = null;
let isDashboardMode = false;
let isSidebarOpen = false;
let readNotificationIds = [];

let prayerTimesNigeria = { Fajr: "--:--", Zuhr: "--:--", Asr: "--:--", Maghrib: "--:--", Isha: "--:--" };
let prayerTimesEgypt = { Fajr: "--:--", Zuhr: "--:--", Asr: "--:--", Maghrib: "--:--", Isha: "--:--" };

const whatsappNumber = "201279760786";
const whatsappMessage = encodeURIComponent(
    "Assalamu Alaikum. Ina neman shiga Mubarak Smart Academy domin koyon Al-Qur'ani da sauran darussan addini ta yanar gizo."
);

const availableClasses = [
    { name: "Tajweed Level 1", icon: "fas fa-quran", description: "Master Quranic recitation rules" },
    { name: "Tajweed Level 2", icon: "fas fa-book-quran", description: "Advanced Tajweed principles" },
    { name: "Qur'an Memorization", icon: "fas fa-book", description: "Complete Hifz program" },
    { name: "Arabic Language", icon: "fas fa-language", description: "Learn Quranic Arabic" },
    { name: "Islamic Studies", icon: "fas fa-mosque", description: "Comprehensive Islamic education" }
];

let courses = [
    { name: "Tajweed Al-Quran", teacher: "Malam Mubarak", icon: "fas fa-quran",
    description: "Master the art of Quranic recitation" },
    { name: "Hifz Program", teacher: "Malam Mubarak", icon: "fas fa-book",
    description: "Complete Quran memorization" },
    { name: "Islamic Studies", teacher: "Malam Mubarak", icon: "fas fa-mosque",
    description: "Comprehensive Islamic education" },
    { name: "Arabic Language", teacher: "Malam Mubarak", icon: "fas fa-language",
    description: "Learn Quranic Arabic" }
];

let teachers = [
    { id: 1, name: "Malam Mubarak", title: "Qira'at Expert", bio: "15+ years teaching experience",
        imageData: null, imageUrl: "https://randomuser.me/api/portraits/men/32.jpg" },
    { id: 2, name: "Sheikh Abdullah", title: "Tajweed Specialist", bio: "Certified Tajweed instructor",
        imageData: null, imageUrl: "https://randomuser.me/api/portraits/men/45.jpg" },
    { id: 3, name: "Ustadh Fatima", title: "Hadith Sciences", bio: "PhD in Islamic Studies", imageData: null,
        imageUrl: "https://randomuser.me/api/portraits/women/68.jpg" }
];

// ================================================================
// 4. NOTIFICATION BADGE FUNCTIONS
// ================================================================
function loadNotificationData() {
    const userId = getCurrentUserId();
    const stored = localStorage.getItem(`read_notifications_${userId}`);
    if (stored) {
        readNotificationIds = JSON.parse(stored);
    } else {
        readNotificationIds = [];
    }
}

function saveNotificationData() {
    const userId = getCurrentUserId();
    localStorage.setItem(`read_notifications_${userId}`, JSON.stringify(readNotificationIds));
}

function getCurrentUserId() {
    if (isTeacher) return 'admin';
    if (currentStudent) return `student_${currentStudent.id}`;
    return 'guest';
}

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;
    const unread = notifications.filter(n => !readNotificationIds.includes(n.id)).length;
    if (unread > 0) {
        badge.textContent = unread;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
    const notifCount = document.getElementById('notifCount');
    if (notifCount) notifCount.textContent = unread;

    if (navigator.setAppBadge) {
        navigator.setAppBadge(unread).catch(() => {});
    } else if (navigator.clearAppBadge) {
        navigator.clearAppBadge().catch(() => {});
    }
}

function markAllNotificationsRead() {
    notifications.forEach(n => {
        if (!readNotificationIds.includes(n.id)) {
            readNotificationIds.push(n.id);
        }
    });
    saveNotificationData();
    updateNotificationBadge();
}

function toggleNotificationPanel() {
    if (isLoggedIn && isTeacher) {
        if (isDashboardMode) {
            switchDashboardSection('notifications');
        } else {
            showPage('dashboard');
            setTimeout(() => {
                switchDashboardSection('notifications');
            }, 300);
        }
    } else if (isLoggedIn && !isTeacher) {
        alert('Check your notifications in the dashboard (Admin only for now)');
    } else {
        alert('Please login to view notifications.');
    }
}

// ================================================================
// 5. AUTHENTICATION
// ================================================================
function checkAuth() {
    const adminAuth = localStorage.getItem("adminAuth");
    const studentAuth = localStorage.getItem("studentAuth");
    if (adminAuth === "true") {
        isLoggedIn = true;
        isTeacher = true;
        loadNotificationData();
        updateNotificationBadge();
        return true;
    } else if (studentAuth) {
        try {
            const studentData = JSON.parse(studentAuth);
            const found = students.find(s => s.id === studentData.id);
            if (found && !found.blocked) {
                isLoggedIn = true;
                currentStudent = found;
                isTeacher = false;
                loadNotificationData();
                updateNotificationBadge();
                return true;
            }
        } catch (e) { return false; }
    }
    return false;
}

function requireAuth() {
    if (!checkAuth()) {
        isLoggedIn = false;
        isTeacher = false;
        currentStudent = null;
        document.body.classList.add('pre-login');
        renderUnifiedLoginPage(document.getElementById("appContainer"));
        return false;
    }
    return true;
}

// ================================================================
// 6. SIDEBAR CONTROLLER
// ================================================================
function showDashboardSidebar() {
    const sidebar = document.getElementById('dashboardSidebar');
    if (sidebar) {
        sidebar.style.display = 'flex';
        sidebar.classList.add('visible');
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
        }
    }
    isDashboardMode = true;
    document.getElementById('appContainer').classList.add('dashboard-mode');
    document.body.classList.add('dashboard-mode');
    updateSidebarBadges();
}

function hideDashboardSidebar() {
    const sidebar = document.getElementById('dashboardSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) {
        sidebar.style.display = 'none';
        sidebar.classList.remove('visible');
        sidebar.classList.remove('open');
    }
    if (overlay) overlay.classList.remove('open');
    isDashboardMode = false;
    isSidebarOpen = false;
    document.getElementById('appContainer').classList.remove('dashboard-mode');
    document.body.classList.remove('dashboard-mode');
    document.body.classList.remove('sidebar-open');
}

function toggleDashboardSidebar() {
    if (!isDashboardMode) return;
    const sidebar = document.getElementById('dashboardSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (window.innerWidth > 768) return;
    if (sidebar) {
        sidebar.style.display = 'flex';
        if (!sidebar.classList.contains('visible')) {
            sidebar.classList.add('visible');
        }
        isSidebarOpen = !isSidebarOpen;
        if (isSidebarOpen) {
            sidebar.classList.add('open');
            overlay.classList.add('open');
            document.body.classList.add('sidebar-open');
        } else {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
            document.body.classList.remove('sidebar-open');
        }
    }
}

function closeDashboardSidebar() {
    if (!isDashboardMode) return;
    const sidebar = document.getElementById('dashboardSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
    document.body.classList.remove('sidebar-open');
    isSidebarOpen = false;
}

function updateSidebarBadges() {
    const studentBadge = document.getElementById('studentCount');
    const teacherBadge = document.getElementById('teacherCount');
    const notifBadge = document.getElementById('notifCount');
    const liveBadge = document.getElementById('liveStatusBadge');
    if (studentBadge) studentBadge.textContent = students ? students.length : 0;
    if (teacherBadge) teacherBadge.textContent = teachers ? teachers.length : 0;
    if (notifBadge) notifBadge.textContent = notifications ? notifications.length : 0;
    if (liveBadge) liveBadge.style.display = activeLiveClass ? 'inline-block' : 'none';
    updateNotificationBadge();
}

function updateSidebarActiveState(section) {
    document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active'));
    document.querySelector(`.sidebar-link[data-section="${section}"]`)?.classList.add('active');
}

// ================================================================
// 7. DATA LOAD / SAVE (MODIFIED: added checkLiveClassFromURL & updateLiveJoinButton)
// ================================================================
function loadData() {
    const stored = localStorage.getItem("mubarak_academy_data");
    if (stored) {
        const data = JSON.parse(stored);
        students = data.students || [];
        timetableURL = data.timetableURL || "";
        if (data.teachers) teachers = data.teachers;
        if (data.notifications) {
            notifications = data.notifications;
        }
    }
    if (students.length === 0) {
        students = [
            { id: 1, name: "Muhammad Al-Fatih", payment: "Paid", attendance: "Present",
                email: "muhammad@example.com", username: "muhammad", gmail: "muhammad@gmail.com",
                regDate: new Date().toISOString().split('T')[0], blocked: false },
            { id: 2, name: "Aisha Bint Ahmad", payment: "Paid", attendance: "Absent",
                email: "aisha@example.com", username: "aisha", gmail: "aisha@gmail.com",
                regDate: new Date().toISOString().split('T')[0], blocked: false },
            { id: 3, name: "Omar Ibn Said", payment: "Pending", attendance: "Absent",
                email: "omar@example.com", username: "omar", gmail: "omar@gmail.com",
                regDate: new Date().toISOString().split('T')[0], blocked: false }
        ];
        saveData();
    }
    students.forEach(s => { if (!s.gmail) s.gmail = s.email; if (s.blocked === undefined) s.blocked = false; });

    if (notifications.length === 0) {
        notifications = [{ id: 1, text: "Welcome to Mubarak Academy! Check out our live classes.",
            date: new Date().toLocaleString(), readBy: [] }];
        saveData();
    }
    notifications.forEach(n => { if (!n.readBy) n.readBy = []; });

    const savedLiveClass = localStorage.getItem("activeLiveClass");
    if (savedLiveClass) activeLiveClass = savedLiveClass;
    const savedNextClass = localStorage.getItem("nextClassInfo");
    if (savedNextClass) nextClassInfo = JSON.parse(savedNextClass);

    const savedAdminPass = localStorage.getItem("admin_password");
    if (savedAdminPass) {
        adminPassword = savedAdminPass;
    } else {
        adminPassword = "0708070";
        localStorage.setItem("admin_password", adminPassword);
    }

    const savedRoomType = localStorage.getItem("liveRoomType");
    if (savedRoomType) liveRoomType = savedRoomType;

    // NEW: Check URL for live session (student detection)
    checkLiveClassFromURL();

    // NEW: Update navbar join button visibility
    updateLiveJoinButton();
}

function saveData() {
    const data = { students, timetableURL, teachers, notifications };
    localStorage.setItem("mubarak_academy_data", JSON.stringify(data));
    if (liveRoomType) localStorage.setItem("liveRoomType", liveRoomType);
    else localStorage.removeItem("liveRoomType");
}

// ================================================================
// 8. LOGIN – FIXED: DEFAULT TO ADMIN TAB + FALLBACK PASSWORD
// ================================================================
function renderUnifiedLoginPage(container) {
    container.innerHTML = `
            <div class="login-only-container">
                <div class="glass-card login-card">
                    <div style="display:flex; justify-content:center; margin-bottom:0.5rem;">
                        <div style="width:70px;height:70px;border-radius:50%;background:rgba(226,177,59,0.15);border:3px solid var(--gold);display:flex;align-items:center;justify-content:center;font-size:2.2rem;color:var(--gold);">
                            <i class="fas fa-book-open"></i>
                        </div>
                    </div>
                    <h2 style="margin-top:0.5rem;">Welcome to Mubarak Academy</h2>
                    <p style="color:var(--gold-light); margin-bottom:1rem;">Please login to continue</p>
                    <div class="login-tabs">
                        <!-- ADMIN TAB IS NOW ACTIVE BY DEFAULT -->
                        <div class="login-tab" data-tab="student" onclick="switchLoginTab('student')">Student Login</div>
                        <div class="login-tab active" data-tab="admin" onclick="switchLoginTab('admin')">Admin Login</div>
                    </div>
                    <div id="studentLoginForm" class="login-form hidden">
                        <input type="text" id="studentUsernameLogin" placeholder="Username">
                        <input type="email" id="studentGmailLogin" placeholder="Gmail Address">
                        <button onclick="handleStudentLogin()">Login as Student</button>
                    </div>
                    <div id="adminLoginForm" class="login-form">
                        <input type="text" id="adminUsernameLogin" placeholder="Admin Username">
                        <input type="password" id="adminPasswordLogin" placeholder="Admin Password">
                        <button onclick="handleAdminLoginUnified()">Login as Admin</button>
                        <div style="margin-top:0.5rem; font-size:0.7rem; color:var(--gold-light);">
                            <i class="fas fa-info-circle"></i> Default: mubarak / 0708070
                        </div>
                    </div>
                </div>
            </div>
        `;
}

window.switchLoginTab = function(tab) {
    document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.login-tab[data-tab="${tab}"]`).classList.add('active');
    if (tab === 'student') {
        document.getElementById('studentLoginForm').classList.remove('hidden');
        document.getElementById('adminLoginForm').classList.add('hidden');
    } else {
        document.getElementById('studentLoginForm').classList.add('hidden');
        document.getElementById('adminLoginForm').classList.remove('hidden');
    }
};

function ultraTrim(str) {
    return str.replace(/[\s\u200B-\u200D\uFEFF]/g, '').trim();
}

// --- Admin Login (FIXED: fallback + default tab) ---
window.handleAdminLoginUnified = function() {
    const user = document.getElementById("adminUsernameLogin")?.value;
    const pass = document.getElementById("adminPasswordLogin")?.value;
    if (!user || !pass) {
        alert("Sorry, login failed. Please check your credentials and try again.");
        return;
    }

    const cleanUser = ultraTrim(user).toLowerCase();
    const cleanPass = ultraTrim(pass);

    // Accept both 'mubarak' and 'admin' as username
    const validUsers = ["mubarak", "admin"];

    // FALLBACK: always accept "0708070" as a valid password,
    // even if the stored password is different.
    // This ensures users can always log in on any device.
    const isValidPass = (cleanPass === adminPassword) || (cleanPass === "0708070");

    if (validUsers.includes(cleanUser) && isValidPass) {
        // If the user used the default password, reset the stored password
        // so that future logins work without the fallback.
        if (cleanPass === "0708070" && adminPassword !== "0708070") {
            adminPassword = "0708070";
            localStorage.setItem("admin_password", adminPassword);
            console.log("✅ Password reset to default 0708070");
        }

        document.body.classList.remove('pre-login');
        isLoggedIn = true;
        isTeacher = true;
        localStorage.setItem("adminAuth", "true");
        document.getElementById("logoutBtn").classList.remove("hidden");
        document.getElementById("adminDashboardBtn").classList.remove("hidden");
        loadNotificationData();
        updateNotificationBadge();
        showPage('home');
    } else {
        alert("Sorry, login failed. Please check your credentials and try again.");
    }
};

// --- Student Login (unchanged) ---
window.handleStudentLogin = function() {
    const username = document.getElementById("studentUsernameLogin")?.value.trim();
    const gmail = document.getElementById("studentGmailLogin")?.value.trim();
    if (!username || !gmail) {
        alert("Sorry, login failed. Please check your credentials and try again.");
        return;
    }
    const cleanUser = ultraTrim(username);
    const cleanGmail = ultraTrim(gmail);
    const found = students.find(s => (s.username === cleanUser || s.email === cleanUser) && (s.gmail === cleanGmail || s.email === cleanGmail));
    if (!found) {
        alert("Sorry, login failed. Please check your credentials and try again.");
        return;
    }
    if (found.blocked === true) {
        alert("Sorry, login failed. Please check your credentials and try again.");
        return;
    }
    document.body.classList.remove('pre-login');
    isLoggedIn = true;
    currentStudent = found;
    isTeacher = false;
    localStorage.setItem("studentAuth", JSON.stringify({ id: found.id, name: found.name }));
    document.getElementById("logoutBtn").classList.remove("hidden");
    document.getElementById("adminDashboardBtn").classList.add("hidden");
    loadNotificationData();
    updateNotificationBadge();
    showPage('home');
};

// ================================================================
// 9. WHATSAPP & PRAYER TIMES
// ================================================================
function setupWhatsAppButtons() {
    const floatBtn = document.getElementById("whatsappFloatBtn");
    const handler = (e) => { e.preventDefault();
        window.open(`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`, "_blank"); };
    if (floatBtn) floatBtn.addEventListener("click", handler);
}

async function fetchPrayerTimes() {
    try {
        const [nigeriaRes, egyptRes] = await Promise.all([
            fetch('https://api.aladhan.com/v1/timingsByCity?city=Abuja&country=Nigeria&method=2'),
            fetch('https://api.aladhan.com/v1/timingsByCity?city=Cairo&country=Egypt&method=2')
        ]);
        const nigeriaData = await nigeriaRes.json();
        const egyptData = await egyptRes.json();
        if (nigeriaData.code === 200) prayerTimesNigeria = { Fajr: nigeriaData.data.timings.Fajr, Zuhr: nigeriaData
                .data.timings.Dhuhr, Asr: nigeriaData.data.timings.Asr, Maghrib: nigeriaData.data.timings
                .Maghrib, Isha: nigeriaData.data.timings.Isha };
        if (egyptData.code === 200) prayerTimesEgypt = { Fajr: egyptData.data.timings.Fajr, Zuhr: egyptData.data
                .timings.Dhuhr, Asr: egyptData.data.timings.Asr, Maghrib: egyptData.data.timings.Maghrib,
            Isha: egyptData.data.timings.Isha };
        if (document.getElementById("appContainer").innerHTML.includes("Welcome")) renderHomePage(document
            .getElementById("appContainer"));
    } catch (error) { console.error(error); }
}

// ================================================================
// 10. JITSI LIVE CLASS FUNCTIONS (modified to use new room with voiceOnly)
// ================================================================

// NEW: Generate a unique room name
function generateRoomName() {
    return 'mlm-live-' + Date.now();
}

// NEW: Generate the full shareable link using the fixed GitHub Pages base URL
function generateLiveLink(roomName, type) {
    const BASE_APP_URL = "https://umarmsanicodes.github.io/MLM-MBRK/";
    return `${BASE_APP_URL}?live=${encodeURIComponent(roomName)}&type=${encodeURIComponent(type)}`;
}

// NEW: Show the live link box in the dashboard
function showLiveLinkBox(roomName, type) {
    // Remove any existing box
    const existingBox = document.getElementById('liveLinkBox');
    if (existingBox) existingBox.remove();

    const link = generateLiveLink(roomName, type);
    const box = document.createElement('div');
    box.id = 'liveLinkBox';
    box.style.cssText = `
        background: var(--glass-bg);
        border: 1px solid var(--gold);
        border-radius: 16px;
        padding: 1.2rem 1.5rem;
        margin: 1rem 0;
        animation: fadeIn 0.4s ease;
    `;
    box.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.8rem;">
            <div style="flex:1; min-width:200px;">
                <label style="font-size:0.8rem; color:var(--gold-light);">🔗 Live Link</label>
                <div style="display:flex; align-items:center; gap:0.6rem; background:rgba(255,255,255,0.05); border:1px solid var(--card-border); border-radius:8px; padding:0.4rem 0.8rem;">
                    <input type="text" id="liveLinkInput" value="${link}" readonly style="flex:1; background:transparent; border:none; color:#eef5ff; font-size:0.95rem; padding:0.4rem 0;">
                    <span style="font-size:0.7rem; color:var(--gold-light);">(copy this)</span>
                </div>
                <div style="font-size:0.65rem; color:var(--gold-light); margin-top:0.3rem;">
                    <i class="fas fa-info-circle"></i> Share this link with students
                </div>
            </div>
            <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
                <button onclick="copyLiveLink()" style="background:var(--gold); color:#0a1620; padding:0.4rem 1rem; font-size:0.8rem;">
                    <i class="fas fa-copy"></i> Copy
                </button>
                <button onclick="shareOnWhatsApp()" style="background:#25D366; color:#fff; padding:0.4rem 1rem; font-size:0.8rem;">
                    <i class="fab fa-whatsapp"></i> Share
                </button>
                <button onclick="startLiveSession()" style="background:#2ecc71; color:#fff; padding:0.4rem 1rem; font-size:0.8rem;">
                    <i class="fas fa-play"></i> Start Live
                </button>
                <button onclick="document.getElementById('liveLinkBox').remove()" style="background:transparent; border:1px solid #e74c3c; color:#e74c3c; padding:0.4rem 1rem; font-size:0.8rem;">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        </div>
    `;
    // Insert the box into the dashboard content
    const dashboardContent = document.getElementById('dashboardSectionContent');
    if (dashboardContent) {
        dashboardContent.prepend(box);
    } else {
        document.getElementById('appContainer').prepend(box);
    }

    // Store room name and type for later use
    window._pendingRoom = roomName;
    window._pendingType = type;
}

// NEW: Copy the live link
function copyLiveLink() {
    const input = document.getElementById('liveLinkInput');
    if (!input) return;
    const link = input.value;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(link).then(() => {
            alert('✅ Live link copied! Share it with students.');
        }).catch(() => {
            prompt('📋 Copy this link:', link);
        });
    } else {
        prompt('📋 Copy this link:', link);
    }
}

// NEW: Share on WhatsApp
function shareOnWhatsApp() {
    const input = document.getElementById('liveLinkInput');
    if (!input) return;
    const link = input.value;
    const message = encodeURIComponent('Join my live class here: ' + link);
    window.open('https://wa.me/?text=' + message, '_blank');
}

// NEW: Start the live session (called when admin clicks "Start Live")
function startLiveSession() {
    const room = window._pendingRoom;
    const type = window._pendingType;
    if (!room || !type) {
        alert('Please select a class type first.');
        return;
    }
    // Remove the link box
    document.getElementById('liveLinkBox')?.remove();
    // Start the class with the chosen type
    const voiceOnly = (type === 'voice');
    startJitsiClassWithRoom(room, voiceOnly);
}

// NEW: Start Jitsi class with a given room name and voiceOnly flag
function startJitsiClassWithRoom(roomName, voiceOnly = false) {
    if (!isLoggedIn || !isTeacher) {
        alert("Only Admin can start live class.");
        return;
    }
    if (activeLiveClass) {
        if (!confirm(`A live class (${activeLiveClass}) is currently active. Do you want to end it and start "${roomName}"?`))
            return;
        window.stopLiveClass();
    }
    activeLiveClass = roomName;
    liveRoomType = voiceOnly ? 'voice' : 'video';
    localStorage.setItem("activeLiveClass", roomName);
    localStorage.setItem("liveRoomType", liveRoomType);

    // Update URL to include live parameters (so that if admin shares the current URL, it works)
    const url = new URL(window.location);
    url.searchParams.set('live', roomName);
    url.searchParams.set('type', liveRoomType);
    window.history.replaceState({}, '', url);

    requestMediaPermissions().then(() => {
        // Use the room name directly (already sanitized)
        openJitsiMeeting(roomName, 'Teacher', true, { voiceOnly });
        enterLiveMode();
    }).catch(() => {
        alert("Camera and Microphone access are required to start the live class.");
    });

    updateSidebarBadges();
    updateLiveJoinButton();
}

// Keep the original startJitsiClass for backward compatibility (now it generates a new room)
function startJitsiClass(className) {
    const roomName = generateRoomName();
    startJitsiClassWithRoom(roomName, false);
}

window.startVoiceClass = function() {
    const selected = document.getElementById("liveClassSelect")?.value;
    if (!selected) { alert("Please select a class first!"); return; }
    startJitsiClass(selected);
};

// NEW: Video/Voice selection modal
function startLiveWithOptions() {
    if (!isLoggedIn || !isTeacher) {
        alert("Only Admin can start live class.");
        return;
    }
    // Show modal with Video/Voice choice
    const modal = document.createElement('div');
    modal.className = 'live-choice-modal';
    modal.style.cssText = `
        position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8);
        display:flex; justify-content:center; align-items:center; z-index:10001; backdrop-filter:blur(4px);
    `;
    modal.innerHTML = `
        <div style="background:var(--glass-bg); border:1px solid var(--gold); border-radius:28px; padding:2rem; max-width:400px; width:90%; text-align:center;">
            <h3 style="color:var(--gold); margin-bottom:0.5rem;">Choose Call Type</h3>
            <p style="color:var(--gold-light); margin-bottom:1.5rem;">Select how you want to start the live class</p>
            <div style="display:flex; flex-direction:column; gap:1rem;">
                <button onclick="handleTypeSelection('video')" style="background:#2ecc71; color:#fff; padding:0.8rem; font-size:1.1rem;">
                    <i class="fas fa-video"></i> Video Call
                </button>
                <button onclick="handleTypeSelection('voice')" style="background:#f39c12; color:#fff; padding:0.8rem; font-size:1.1rem;">
                    <i class="fas fa-phone"></i> Voice Call
                </button>
                <button onclick="this.closest('.live-choice-modal').remove()" style="background:transparent; border:1px solid #e74c3c; color:#e74c3c;">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function handleTypeSelection(type) {
    // Remove the modal
    document.querySelector('.live-choice-modal')?.remove();
    // Generate a room name
    const roomName = generateRoomName();
    // Show the link box
    showLiveLinkBox(roomName, type);
}

// NEW: Student detection from URL parameters
function checkLiveClassFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const live = urlParams.get('live');
    const type = urlParams.get('type') || 'video';
    if (live) {
        const roomName = decodeURIComponent(live);
        // If no active class is set, set it from the URL
        if (!activeLiveClass) {
            activeLiveClass = roomName;
            liveRoomType = type;
            localStorage.setItem('activeLiveClass', roomName);
            localStorage.setItem('liveRoomType', type);
            // Update the navbar join button
            updateLiveJoinButton();
            updateSidebarBadges();
        }
        // Keep URL parameters (they are needed for sharing)
    }
}

// Modified stopLiveClass to remove URL parameters
window.stopLiveClass = function() {
    if (!isTeacher) {
        alert("Only Admin can end live class.");
        return;
    }
    if (jitsiApiInstance) {
        jitsiApiInstance.dispose();
        jitsiApiInstance = null;
    }
    activeLiveClass = null;
    liveRoomType = null;
    localStorage.removeItem("activeLiveClass");
    localStorage.removeItem("liveRoomType");
    // Remove URL parameters
    const url = new URL(window.location);
    url.searchParams.delete('live');
    url.searchParams.delete('type');
    window.history.replaceState({}, '', url);
    if (isInLiveClass) {
        closeJitsiMeeting();
        exitLiveMode();
    }
    updateSidebarBadges();
    updateLiveJoinButton();
    alert("Live class stopped. All participants disconnected.");
    showPage('home');
};

// Modified joinLiveClass to use the liveRoomType
window.joinLiveClass = function(role) {
    if (!activeLiveClass) {
        alert("No live class active. Admin must start a class first.");
        return;
    }
    if (isInLiveClass) return;
    let displayName = "Student";
    let isHost = false;
    if (role === 'teacher' || isTeacher) {
        displayName = "Teacher";
        isHost = true;
    } else {
        displayName = currentStudent?.name || "Student";
        isHost = false;
    }
    const roomName = activeLiveClass;
    const voiceOnly = (liveRoomType === 'voice');
    requestMediaPermissions().then(() => {
        openJitsiMeeting(roomName, displayName, isHost, { voiceOnly });
        enterLiveMode();
    }).catch(() => {
        alert("Camera and Microphone access are required to join the live class.");
    });
};

window.leaveLiveClass = function() {
    if (isInLiveClass) {
        closeJitsiMeeting();
        exitLiveMode();
        showPage('home');
    }
};

function enterLiveMode() {
    document.body.classList.add('live-mode');
    if (isDashboardMode) {
        hideDashboardSidebar();
    }
    renderLiveParticipants();
}

function exitLiveMode() {
    document.body.classList.remove('live-mode');
}

// ================================================================
// 11. PAGE RENDER FUNCTIONS
// ================================================================
function renderHomePage(container) {
    if (!requireAuth()) return;
    const welcomeName = currentStudent ? currentStudent.name : (isTeacher ? 'Admin' : 'Guest');
    container.innerHTML = `
            ${activeLiveClass ? `<div class="live-banner" onclick="window.joinLiveClass()"><span class="live-indicator"></span> 🔴 LIVE ${activeLiveClass} Class 🔴 <strong>Click to Join →</strong></div>` : ''}
            <div class="glass-card" style="text-align:center;">
                <h1 style="font-size:2.5rem;">📖 Welcome ${welcomeName}</h1>
                <p style="margin-top:1rem;">Empowering hearts with Quran & Sunnah | Online Islamic Learning Platform</p>
                <button class="nav-btn" style="margin-top:1rem;" onclick="showPage('courses')">Explore Courses →</button>
                ${activeLiveClass ? `<button id="homeJoinLiveBtn" class="live-join-btn" style="margin-top:1rem; margin-left:1rem;" onclick="window.joinLiveClass()"><i class="fas fa-video"></i> 🔴 JOIN LIVE CLASS 🔴</button>` : ''}
            </div>
            <div class="glass-card"><h2 style="text-align:center;"><i class="fas fa-mosque"></i> Prayer Times</h2><div class="prayer-times-grid"><div class="prayer-country-card"><h3><i class="fas fa-flag"></i> Nigeria</h3><div class="prayer-list">${Object.entries(prayerTimesNigeria).map(([k,v])=>`<div class="prayer-row"><span class="prayer-name">${k}</span><span class="prayer-time">${v}</span></div>`).join('')}</div></div><div class="prayer-country-card"><h3><i class="fas fa-flag"></i> Egypt</h3><div class="prayer-list">${Object.entries(prayerTimesEgypt).map(([k,v])=>`<div class="prayer-row"><span class="prayer-name">${k}</span><span class="prayer-time">${v}</span></div>`).join('')}</div></div></div></div>
            <div class="glass-card"><h2><i class="fas fa-calendar-alt"></i> Upcoming Classes</h2><div class="courses-grid" id="upcomingClassesGrid"></div></div>
            <div class="glass-card"><h2><i class="fas fa-clock"></i> Next Class</h2><div class="next-class-card"><i class="fas fa-chalkboard-user fa-2x" style="color:var(--gold);"></i><h3>${nextClassInfo.className}</h3><p>${nextClassInfo.day} - ${nextClassInfo.time}</p>${isLoggedIn ? `<button class="edit-btn" onclick="editNextClass()"><i class="fas fa-edit"></i> Edit</button>` : ''}</div></div>
            <div class="glass-card"><h2><i class="fas fa-calendar-alt"></i> Timetable & Materials</h2>${timetableURL ? `<a href="${timetableURL}" target="_blank" class="btn-good">📅 Download Timetable PDF</a>` : `<p>No timetable uploaded yet.</p>`}</div>
            <footer style="width:100%; margin-top:2rem; padding:1.5rem; background:rgba(5,18,30,0.95); text-align:center; border-top:2px solid var(--gold); border-radius:0; box-shadow:0 -4px 10px rgba(0,0,0,0.2);">
                <p>© Mubarak Smart Islamic Academy</p>
                <p style="margin-top:0.5rem;">Powered by Manu's Smart Web Developer</p>
                <p style="margin-top:0.3rem;"><a href="#" id="whatsappBottomBtn" style="color:#25D366; text-decoration:none;"><i class="fab fa-whatsapp"></i> Contact us on WhatsApp</a></p>
            </footer>
        `;
    const grid = document.getElementById("upcomingClassesGrid");
    if (grid) {
        grid.innerHTML = availableClasses.map(cls => {
            const isLive = activeLiveClass === cls.name;
            return `<div class="course-card glass-card"><i class="${cls.icon} fa-2x"></i><h3>${cls.name}</h3><p>${cls.description}</p>${isLive ? `<div class="live-badge">🔴 LIVE NOW</div><button class="join-class-btn" onclick="window.joinLiveClass()">Join Class</button>` : `<div class="offline-badge">⚪ Offline</div><button class="disabled-btn" disabled>Join Unavailable</button>`}</div>`;
        }).join('');
    }
    const homeJoinBtn = document.getElementById("homeJoinLiveBtn");
    if (homeJoinBtn) homeJoinBtn.onclick = () => window.joinLiveClass();
    const bottomWhatsApp = document.getElementById("whatsappBottomBtn");
    if (bottomWhatsApp) bottomWhatsApp.addEventListener("click", (e) => { e.preventDefault();
        window.open(`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`, "_blank"); });
}

function renderCoursesPage(container) {
    if (!requireAuth()) return;
    container.innerHTML =
        `<div class="glass-card"><h2>📚 Our Premium Courses</h2><div class="courses-grid">${courses.map(c => `<div class="course-card glass-card"><i class="${c.icon} fa-3x"></i><h3>${c.name}</h3><p><strong>Teacher:</strong> ${c.teacher}</p><p>${c.description}</p><button class="nav-btn" onclick="alert('Enrollment open! Contact admin.')">Enroll Now</button></div>`).join('')}</div></div>
            <footer style="width:100%; margin-top:2rem; padding:1.5rem; background:rgba(5,18,30,0.95); text-align:center; border-top:2px solid var(--gold); border-radius:0;"><p>© Mubarak Smart Islamic Academy</p><p>Powered by Manu's Smart Web Developer</p></footer>`;
}

function renderTeachersPage(container) {
    if (!requireAuth()) return;
    container.innerHTML =
        `<div class="glass-card"><h2><i class="fas fa-chalkboard-user"></i> Our Respected Teachers</h2><div class="teachers-grid">${teachers.map(t => `<div class="teacher-card glass-card"><img src="${t.imageData || t.imageUrl || 'https://via.placeholder.com/100'}" class="teacher-img" onerror="this.src='https://via.placeholder.com/100'"><h3>${t.name}</h3><p><strong>${t.title}</strong></p><p>${t.bio}</p></div>`).join('')}</div></div>
            <footer style="width:100%; margin-top:2rem; padding:1.5rem; background:rgba(5,18,30,0.95); text-align:center; border-top:2px solid var(--gold); border-radius:0;"><p>© Mubarak Smart Islamic Academy</p><p>Powered by Manu's Smart Web Developer</p></footer>`;
}

function editNextClass() {
    if (!requireAuth()) return;
    let n = prompt("Class name:", nextClassInfo.className);
    let d = prompt("Day:", nextClassInfo.day);
    let t = prompt("Time:", nextClassInfo.time);
    if (n) nextClassInfo.className = n;
    if (d) nextClassInfo.day = d;
    if (t) nextClassInfo.time = t;
    localStorage.setItem("nextClassInfo", JSON.stringify(nextClassInfo));
    renderHomePage(document.getElementById("appContainer"));
}

// ================================================================
// 12. SHOW PAGE (modified to call updateLiveJoinButton)
// ================================================================
function showPage(page) {
    if (page !== 'dashboard' && isDashboardMode) {
        hideDashboardSidebar();
    }
    if (!isLoggedIn && page !== 'login') {
        renderUnifiedLoginPage(document.getElementById("appContainer"));
        return;
    }
    const container = document.getElementById("appContainer");
    if (page === 'home') renderHomePage(container);
    else if (page === 'courses') renderCoursesPage(container);
    else if (page === 'teachers') renderTeachersPage(container);
    else if (page === 'login') renderUnifiedLoginPage(container);
    else if (page === 'dashboard' && isLoggedIn && isTeacher) renderAdminDashboard(container);
    else renderHomePage(container);

    if (isLoggedIn) {
        document.getElementById("logoutBtn").classList.remove("hidden");
        if (isTeacher) {
            document.getElementById("adminDashboardBtn").classList.remove("hidden");
        } else {
            document.getElementById("adminDashboardBtn").classList.add("hidden");
        }
    } else {
        document.getElementById("logoutBtn").classList.add("hidden");
        document.getElementById("adminDashboardBtn").classList.add("hidden");
    }
    updateNotificationBadge();
    updateLiveJoinButton(); // Ensure join button visibility after navigation
}

function logout() {
    isLoggedIn = false;
    currentStudent = null;
    isTeacher = false;
    localStorage.removeItem("adminAuth");
    localStorage.removeItem("studentAuth");
    hideDashboardSidebar();
    if (isInLiveClass) closeJitsiMeeting();
    document.body.classList.add('pre-login');
    renderUnifiedLoginPage(document.getElementById("appContainer"));
    document.getElementById("logoutBtn").classList.add("hidden");
    document.getElementById("adminDashboardBtn").classList.add("hidden");
}
window.handleLogout = logout;

// ================================================================
// 13. ADMIN DASHBOARD
// ================================================================
// ================================================================
function renderAdminDashboard(container) {
    if (!isLoggedIn || !isTeacher) { renderUnifiedLoginPage(container); return; }
    container.innerHTML = `
            <div class="dashboard-wrapper">
                <div class="main-content" id="dashboardContent" style="margin-left:0;width:100%;">
                    <div id="dashboardSectionContent">${renderDashboardHome()}</div>
                </div>
            </div>
        `;
    showDashboardSidebar();
    updateSidebarActiveState('dashboard');
}

function switchDashboardSection(section) {
    if (!requireAuth()) return;
    const contentDiv = document.getElementById('dashboardSectionContent');
    if (!contentDiv) return;
    if (section === 'dashboard') contentDiv.innerHTML = renderDashboardHome();
    else if (section === 'students') contentDiv.innerHTML = renderStudentManagement();
    else if (section === 'attendance') contentDiv.innerHTML = renderAttendancePanel();
    else if (section === 'teachersManage') contentDiv.innerHTML = renderTeacherManagement();
    else if (section === 'live') contentDiv.innerHTML = renderLiveClassPanel();
    else if (section === 'notifications') {
        contentDiv.innerHTML = renderNotificationsPanel();
        markAllNotificationsRead();
    }
    else if (section === 'settings') contentDiv.innerHTML = renderSettingsPanel();
    updateSidebarActiveState(section);
    if (window.innerWidth <= 768) closeDashboardSidebar();
}
window.switchDashboardSection = switchDashboardSection;

function renderDashboardHome() {
    const presentCount = students.filter(s => s.attendance === 'Present').length;
    return `<div class="glass-card"><h3>Dashboard Overview</h3><div class="stats-grid"><div class="stat-card glass-card"><h3>Total Students</h3><div class="stat-number">${students.length}</div></div><div class="stat-card glass-card"><h3>Present Today</h3><div class="stat-number">${presentCount}</div></div><div class="stat-card glass-card"><h3>Total Teachers</h3><div class="stat-number">${teachers.length}</div></div></div></div><div class="glass-card"><h3>Quick Actions</h3><button onclick="refreshData()">🔄 Refresh Data</button></div>`;
}

function renderTeacherManagement() {
    if (!requireAuth()) return '';
    return `<div class="glass-card"><h3>Add New Teacher (Upload from Gallery)</h3><input type="text" id="teacherName" placeholder="Teacher Name"><input type="text" id="teacherTitle" placeholder="Title / Subject"><textarea id="teacherBio" placeholder="Short Bio" rows="2"></textarea><label style="display:block; margin:5px 0 5px; color:var(--gold-light);">Upload Photo from Device/Gallery</label><input type="file" id="teacherImageUpload" accept="image/*"><button onclick="addTeacher()">Save Teacher</button></div><div class="glass-card"><h3>Current Teachers (${teachers.length})</h3><div style="overflow-x:auto;"><table><thead><tr><th>Photo</th><th>Name</th><th>Title</th><th>Actions</th></tr></thead><tbody>${teachers.map(t => `<tr><td><img src="${t.imageData || t.imageUrl || 'https://via.placeholder.com/100'}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;"></td><td>${t.name}</td><td>${t.title}</td><td><button onclick="editTeacher(${t.id})" style="background:#2c7da0;">Edit</button> <button onclick="deleteTeacher(${t.id})" style="background:#b91c1c;">Delete</button></td></tr>`).join('')}</tbody></table></div></div>`;
}

function renderStudentManagement() {
    if (!requireAuth()) return '';
    return `<div class="glass-card"><h3>Add New Student</h3><input type="text" id="studentName" placeholder="Full Name"><input type="text" id="studentUsername" placeholder="Username"><input type="email" id="studentEmail" placeholder="Email"><select id="studentPayment"><option>Paid</option><option>Pending</option></select><button onclick="addStudent()">Add Student</button></div><div class="glass-card"><h3>Students List (${students.length})</h3><div class="students-list">${students.map(s => `<div class="student-list-item"><div class="student-info"><span class="student-name">${s.name}</span><span class="student-email">${s.email || s.gmail || '-'}</span></div><div class="student-status"><span class="payment-badge ${s.payment === 'Paid' ? 'payment-paid' : 'payment-pending'}">${s.payment}</span><span class="status-badge ${s.attendance === 'Present' ? 'status-present' : 'status-absent'}">${s.attendance}</span><button class="toggle-block-btn ${s.blocked ? 'blocked' : 'unblocked'}" onclick="toggleBlockStudent(${s.id}, 'students')">${s.blocked ? 'Unblock' : 'Block'}</button><button onclick="deleteStudent(${s.id})" style="background:#b91c1c; padding:5px 15px;">Delete</button></div></div>`).join('')}</div></div>`;
}

function renderAttendancePanel() {
    if (!requireAuth()) return '';
    return `<div class="glass-card"><h3>Mark Attendance & Manage Access</h3><div class="students-list">${students.map(s => `<div class="student-list-item"><span class="student-name">${s.name}</span><div class="student-status"><span class="status-badge ${s.attendance === 'Present' ? 'status-present' : 'status-absent'}">${s.attendance}</span><button class="btn-good" onclick="markAttendance(${s.id}, 'Present')">PRE</button><button class="btn-cancel" onclick="markAttendance(${s.id}, 'Absent')">ABS</button><button class="toggle-block-btn ${s.blocked ? 'blocked' : 'unblocked'}" onclick="toggleBlockStudent(${s.id}, 'attendance')">${s.blocked ? 'Unblock' : 'Block'}</button></div></div>`).join('')}</div></div>`;
}

// ================================================================
// 14. LIVE CLASS PANEL (MODIFIED: replaced Start button with startLiveWithOptions)
// ================================================================
function renderLiveClassPanel() {
    if (!requireAuth()) return '';
    const isLive = activeLiveClass ? true : false;

    return `
        <div class="glass-card">
            <h3><i class="fas fa-video" style="color:var(--gold);"></i> Live Class Management</h3>
            <div style="display:flex; gap:1rem; flex-wrap:wrap; margin:1rem 0;">
                <select id="liveClassSelect" style="flex:1; min-width:200px; background:rgba(255,255,255,0.08); border:1px solid var(--card-border); border-radius:12px; padding:10px 16px; color:#eef5ff;">
                    ${availableClasses.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
                </select>
                ${!isLive ? `
                    <button onclick="startLiveWithOptions()" style="background:#2ecc71; color:#fff; padding:10px 24px; border-radius:30px; border:none; font-weight:600; cursor:pointer;">
                        <i class="fas fa-play"></i> Start Live (Video/Voice)
                    </button>
                ` : `
                    <button onclick="window.stopLiveClass()" style="background:#e74c3c; color:#fff; padding:10px 24px; border-radius:30px; border:none; font-weight:600; cursor:pointer;">
                        <i class="fas fa-stop"></i> End Class
                    </button>
                `}
            </div>

            ${isLive ? `
                <div style="margin-top:1rem; text-align:center;">
                    <p><i class="fas fa-circle" style="color:#2ecc71;"></i> <strong>Live Now:</strong> ${activeLiveClass} (${liveRoomType === 'voice' ? 'Voice Only' : 'Video'})</p>
                    <div style="display:flex; gap:0.8rem; margin-top:0.8rem; flex-wrap:wrap; justify-content:center;">
                        <button onclick="window.joinLiveClass('teacher')" style="background:var(--gold); color:#0a1620; padding:8px 20px; border-radius:30px; border:none; font-weight:600; cursor:pointer;">
                            <i class="fas fa-chalkboard-teacher"></i> Join as Teacher
                        </button>
                        <button onclick="window.joinLiveClass('student')" style="background:#2c7da0; color:#fff; padding:8px 20px; border-radius:30px; border:none; font-weight:600; cursor:pointer;">
                            <i class="fas fa-user-graduate"></i> Join as Student
                        </button>
                        <span style="color:var(--gold-light);font-size:0.9rem;display:flex;align-items:center;gap:5px;">
                            <i class="fas fa-users"></i> <span class="participant-count">0</span> participants
                        </span>
                    </div>
                </div>
            ` : `
                <div style="background:rgba(0,0,0,0.3); border-radius:16px; padding:2rem; text-align:center; margin-top:0.5rem;">
                    <i class="fas fa-video" style="font-size:3rem; color:var(--gold); opacity:0.3;"></i>
                    <p style="color:var(--gold-light); margin-top:1rem;">No active class. Click "Start Live" above.</p>
                </div>
            `}
        </div>
    `;
}

// ================================================================
// 15. NOTIFICATIONS PANEL – WITH READ STATUS
// ================================================================
function renderNotificationsPanel() {
    if (!requireAuth()) return '';
    markAllNotificationsRead();

    let html = `<div class="glass-card"><h3>Manage Notifications</h3>`;
    if (isTeacher) {
        html += `<button onclick="addNotification()">+ Add Announcement</button>`;
    }
    html += `<div id="notificationsList">`;
    if (notifications.length === 0) {
        html += `<p style="color:var(--gold-light); text-align:center; padding:1rem;">No notifications.</p>`;
    } else {
        notifications.forEach(n => {
            const isRead = readNotificationIds.includes(n.id);
            html += `
                <div class="notification-banner" style="${isRead ? 'opacity:0.7;' : 'border-left-color: var(--gold);'}">
                    <span>${isRead ? '✅' : '🔔'} ${n.text} <small>${n.date}</small></span>
                    ${isTeacher ? `<button onclick="deleteNotification(${n.id})" style="background:#b91c1c; padding:2px 10px;">Delete</button>` : ''}
                </div>
            `;
        });
    }
    html += `</div></div>`;
    return html;
}

// ================================================================
// 16. NOTIFICATION CRUD
// ================================================================
window.addNotification = function() {
    if (!isLoggedIn || !isTeacher) { alert("Only Admin can add notifications."); return; }
    const text = prompt("Enter notification message:");
    if (text) {
        const newNotif = {
            id: Date.now(),
            text: text,
            date: new Date().toLocaleString(),
            readBy: []
        };
        notifications.push(newNotif);
        saveData();
        updateSidebarBadges();
        updateNotificationBadge();
        alert("Notification added!");
        switchDashboardSection('notifications');
    }
};

window.deleteNotification = function(id) {
    if (!isTeacher) { alert("Only Admin can delete notifications."); return; }
    if (confirm("Delete this notification?")) {
        notifications = notifications.filter(n => n.id !== id);
        readNotificationIds = readNotificationIds.filter(rid => rid !== id);
        saveData();
        saveNotificationData();
        updateSidebarBadges();
        updateNotificationBadge();
        switchDashboardSection('notifications');
    }
};

// ================================================================
// 17. SETTINGS PANEL
// ================================================================
function renderSettingsPanel() {
    if (!requireAuth()) return '';
    return `
            <div class="glass-card">
                <h3>Admin Settings</h3>
                <button onclick="changeAdminPassword()">🔑 Change Admin Password</button>
                <br><br>
                <h3>Upload Academy Logo</h3>
                <p style="color:var(--gold-light);">Logo is now the Open Qur'an icon (no upload needed).</p>
                <br>
                <h3>Upload Timetable (PDF)</h3>
                <input type="file" id="timetableFile" accept="application/pdf">
                <button onclick="uploadTimetable()">Upload Timetable</button>
                ${timetableURL ? `<p style="margin-top:0.5rem;">Current: <a href="${timetableURL}" target="_blank" style="color:var(--gold-light);">📄 View Timetable</a></p>` : ''}
            </div>
        `;
}

// ================================================================
// 18. CRUD OPERATIONS
// ================================================================
window.toggleBlockStudent = function(id, source) {
    const student = students.find(s => s.id === id);
    if (student) { student.blocked = !student.blocked;
        saveData();
        updateSidebarBadges();
        switchDashboardSection(source === 'attendance' ? 'attendance' : 'students'); }
};

window.addStudent = function() {
    if (!requireAuth()) return;
    const name = document.getElementById("studentName")?.value;
    const username = document.getElementById("studentUsername")?.value;
    const email = document.getElementById("studentEmail")?.value;
    const payment = document.getElementById("studentPayment")?.value;
    if (name && username && email) {
        if (!email.toLowerCase().endsWith('@gmail.com')) { alert(
            "Please enter a valid Gmail address ending with @gmail.com"); return; }
        const newId = students.length ? Math.max(...students.map(s => s.id)) + 1 : 1;
        students.push({ id: newId, name, username, email, gmail: email, payment, attendance: "Absent",
            regDate: new Date().toISOString().split('T')[0], blocked: false });
        saveData();
        updateSidebarBadges();
        switchDashboardSection('students');
    } else alert("Please fill all fields");
};

window.deleteStudent = function(id) {
    if (!requireAuth()) return;
    if (confirm("Delete student?")) { students = students.filter(s => s.id !== id);
        saveData();
        updateSidebarBadges();
        switchDashboardSection('students'); }
};

window.markAttendance = function(id, status) {
    if (!requireAuth()) return;
    const student = students.find(s => s.id === id);
    if (student) { student.attendance = status;
        saveData();
        switchDashboardSection('attendance'); }
};

window.addTeacher = function() {
    if (!requireAuth()) return;
    const name = document.getElementById("teacherName")?.value;
    const title = document.getElementById("teacherTitle")?.value;
    const bio = document.getElementById("teacherBio")?.value;
    if (name && title) {
        const fileInput = document.getElementById("teacherImageUpload");
        const file = fileInput.files[0];
        const newId = teachers.length ? Math.max(...teachers.map(t => t.id)) + 1 : 1;
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                teachers.push({ id: newId, name, title, bio, imageData: e.target.result });
                saveData();
                updateSidebarBadges();
                switchDashboardSection('teachersManage');
            };
            reader.readAsDataURL(file);
        } else {
            teachers.push({ id: newId, name, title, bio, imageData: null });
            saveData();
            updateSidebarBadges();
            switchDashboardSection('teachersManage');
        }
    } else alert("Please fill name and title");
};

window.editTeacher = function(id) {
    if (!requireAuth()) return;
    const teacher = teachers.find(t => t.id === id);
    if (teacher) {
        const newName = prompt("New name:", teacher.name);
        if (newName) teacher.name = newName;
        const newTitle = prompt("New title:", teacher.title);
        if (newTitle) teacher.title = newTitle;
        const newBio = prompt("New bio:", teacher.bio);
        if (newBio) teacher.bio = newBio;
        saveData();
        switchDashboardSection('teachersManage');
    }
};

window.deleteTeacher = function(id) {
    if (!requireAuth()) return;
    if (confirm("Delete teacher?")) { teachers = teachers.filter(t => t.id !== id);
        saveData();
        updateSidebarBadges();
        switchDashboardSection('teachersManage'); }
};

window.uploadTimetable = function() {
    if (!requireAuth()) return;
    const fileInput = document.getElementById("timetableFile");
    if (fileInput && fileInput.files.length) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            timetableURL = e.target.result;
            saveData();
            alert("Timetable uploaded successfully!");
            switchDashboardSection('settings');
        };
        reader.readAsDataURL(file);
    } else alert("Please select a PDF file");
};

window.uploadLogo = function() {
    alert("Logo is now the Open Qur'an icon. Upload is not needed.");
};

// ================================================================
// 19. CHANGE ADMIN PASSWORD
// ================================================================
window.changeAdminPassword = function() {
    const current = prompt("Enter current password:");
    if (current === adminPassword) {
        const newPass = prompt("Enter new password (min 4 characters):");
        if (newPass && newPass.length >= 4) {
            adminPassword = newPass;
            localStorage.setItem("admin_password", adminPassword);
            saveData();
            alert("✅ Password changed successfully! Please use your new password next time.");
        } else {
            alert("❌ Password must be at least 4 characters.");
        }
    } else {
        alert("❌ Current password is incorrect.");
    }
};

window.refreshData = function() {
    if (!requireAuth()) return;
    renderAdminDashboard(document.getElementById("appContainer"));
};

// ================================================================
// 20. DASHBOARD SECURITY LOGIN (UPDATED)
// ================================================================
const securityLoginHTML = `
        <div id="dashboardSecurityLogin" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(8px); z-index:9999; align-items:center; justify-content:center;">
            <div style="max-width:400px;width:90%;background:rgba(10,25,40,0.95);border:1px solid var(--gold);border-radius:32px;padding:2.5rem 2rem;box-shadow:0 30px 80px rgba(0,0,0,0.6);text-align:center;">
                <div style="font-size:3rem;color:var(--gold);margin-bottom:1rem;"><i class="fas fa-lock"></i></div>
                <h2 style="font-size:1.4rem;margin-bottom:0.3rem;color:#fff;">Dashboard Access</h2>
                <p style="color:var(--gold-light);font-size:0.85rem;margin-bottom:1.5rem;">Enter admin credentials</p>
                <input type="text" id="securityUsername" placeholder="Username" style="width:100%;padding:14px 18px;margin:6px 0;background:rgba(255,255,255,0.06);border:1px solid rgba(226,177,59,0.2);border-radius:14px;color:#eef5ff;font-size:0.95rem;">
                <input type="password" id="securityPassword" placeholder="Password" style="width:100%;padding:14px 18px;margin:6px 0;background:rgba(255,255,255,0.06);border:1px solid rgba(226,177,59,0.2);border-radius:14px;color:#eef5ff;font-size:0.95rem;">
                <div id="securityError" style="color:#ff6b6b;font-size:0.8rem;margin-top:0.5rem;min-height:1.2rem;"></div>
                <button onclick="handleSecurityLogin()" style="width:100%;padding:14px;margin-top:12px;border-radius:14px;background:linear-gradient(135deg,var(--gold),#d4a02a);color:#0a1620;font-weight:700;font-size:1rem;border:none;cursor:pointer;transition:all 0.3s;">
                    <i class="fas fa-tachometer-alt"></i> Access Dashboard
                </button>
                <a onclick="closeSecurityLogin()" style="display:inline-block;margin-top:1rem;color:var(--gold-light);text-decoration:none;font-size:0.85rem;cursor:pointer;">
                    <i class="fas fa-arrow-left"></i> Back
                </a>
            </div>
        </div>`;
document.body.insertAdjacentHTML('beforeend', securityLoginHTML);

window.handleSecurityLogin = function() {
    const username = document.getElementById('securityUsername').value.trim();
    const password = document.getElementById('securityPassword').value.trim();
    const error = document.getElementById('securityError');
    const validUsers = ["mubarak", "admin"];
    const isValidPass = (password === adminPassword) || (password === "0708070");
    if (validUsers.includes(username.toLowerCase()) && isValidPass) {
        if (password === "0708070" && adminPassword !== "0708070") {
            adminPassword = "0708070";
            localStorage.setItem("admin_password", adminPassword);
        }
        error.textContent = '';
        document.getElementById('dashboardSecurityLogin').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
        showDashboardSidebar();
        renderAdminDashboard(document.getElementById('appContainer'));
    } else {
        error.textContent = '❌ Invalid credentials. Access denied.';
        error.style.color = '#ff6b6b';
    }
};

window.closeSecurityLogin = function() {
    document.getElementById('dashboardSecurityLogin').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    showPage('home');
};

window.handleDashboardClick = function() {
    if (!isLoggedIn || !isTeacher) {
        alert('Please login as Admin first');
        return;
    }
    document.getElementById('dashboardSecurityLogin').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('securityError').textContent = '';
    document.getElementById('securityUsername').value = '';
    document.getElementById('securityPassword').value = '';
};

// ================================================================
// 21. EVENT LISTENERS
// ================================================================
document.addEventListener('DOMContentLoaded', function() {
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) {
        overlay.addEventListener('click', closeDashboardSidebar);
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isSidebarOpen) closeDashboardSidebar();
    });

    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if (window.innerWidth > 768 && isSidebarOpen) closeDashboardSidebar();
        }, 150);
    });
});

// ================================================================
// 22. AUTO PICTURE-IN-PICTURE
// ================================================================
(function autoPiP() {
    let pipAttempted = false;
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && isInLiveClass && !pipAttempted) {
            const videos = document.querySelectorAll('video');
            if (videos.length > 0) {
                const video = videos[0];
                if (video && document.pictureInPictureEnabled && !document.pictureInPictureElement) {
                    video.requestPictureInPicture().catch(err => {
                        console.log('Auto PiP failed:', err);
                        pipAttempted = false;
                    });
                    pipAttempted = true;
                }
            }
        }
        if (!document.hidden) {
            pipAttempted = false;
        }
    });
})();

// ================================================================
// 23. PWA – SERVICE WORKER & INSTALL PROMPT
// ================================================================
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
        .then(() => console.log('✅ Service Worker registered'))
        .catch(err => console.log('❌ Service Worker registration failed:', err));
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
        console.log('Service Worker ready for push notifications.');
    });
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.createElement('button');
    installBtn.textContent = '📲 Install App';
    installBtn.style.cssText =
        'position:fixed; bottom:100px; right:20px; z-index:9999; background:var(--gold); color:#0a1620; padding:12px 24px; border-radius:30px; font-weight:bold; border:none; cursor:pointer; box-shadow:0 4px 15px rgba(0,0,0,0.3);';
    installBtn.onclick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const result = await deferredPrompt.userChoice;
            if (result.outcome === 'accepted') {
                console.log('✅ App installed');
            } else {
                console.log('❌ Installation declined');
            }
            deferredPrompt = null;
            installBtn.remove();
        }
    };
    document.body.appendChild(installBtn);
});
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show your custom install button
    const installBtn = document.getElementById('installAppBtn');
    if (installBtn) installBtn.style.display = 'block';
});

// When user clicks the custom install button
function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((result) => {
            if (result.outcome === 'accepted') {
                console.log('✅ App installed');
            } else {
                console.log('❌ Installation declined');
            }
            deferredPrompt = null;
        });
    }
}
// ================================================================
// 24. INITIALIZATION
// ================================================================
loadData();
setupWhatsAppButtons();
fetchPrayerTimes();
loadNotificationData();
updateNotificationBadge();

// Ensure join button state on load
updateLiveJoinButton();

console.log('✅ Mubarak Smart Islamic Academy loaded successfully!');
console.log('🔐 Admin credentials: mubarak / ' + adminPassword);
console.log('   (or use "admin" as username with the same password)');
console.log('   If you forgot your password, use "0708070" — it always works.');
console.log('📱 Hamburger sidebar toggle works on mobile (fixed).');
console.log('📏 Sidebar positioned with dynamic navbar height.');
console.log('🛡️ Generic login error messages.');
console.log('📦 PWA ready.');
console.log('👥 Live participants are now real-time and no fake students.');
console.log('🔄 Jitsi error handling with reconnect and retry.');
console.log('🔔 Notification badge implemented with PWA Badging API support.');
console.log('🔴 Live join button appears when ?live=room-name is detected.');
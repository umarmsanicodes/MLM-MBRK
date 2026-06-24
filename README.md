📚 Mubarak Smart Islamic Academy – README
Welcome to the Mubarak Smart Islamic Academy platform – a comprehensive online Islamic learning system with live classes, admin dashboards, student management, and PWA support.

🌟 Overview
Mubarak Smart Islamic Academy is a single‑page web application built for Islamic schools and online learning. It provides:

Separate logins for Students and Admin.

Live video classes using Jitsi Meet (audio/video, screen sharing, participant lists).

Admin Dashboard for managing students, teachers, attendance, notifications, and settings.

Real‑time notification badge with PWA Badging API support.

Splash screen with a premium Qur’an opening animation.

Progressive Web App (PWA) – installable on Android, iOS, and Desktop.

✨ Key Features
Feature	Description
🔐 Authentication	Student login (username + email) and Admin login (username + password), both redirect to the Home page.
📺 Live Classes	Fully integrated Jitsi Meet with camera/microphone, participant list, and custom classroom UI.
👨‍🏫 Admin Dashboard	Manage students, teachers, attendance, and publish notifications.
🔔 Notifications	Admin creates announcements; students see a badge counter and unread status. PWA badge appears on the app icon.
📱 PWA Ready	Installable on mobile and desktop with offline caching and splash screen.
🕌 Splash Animation	Qur’an opens, academy name types letter‑by‑letter, Arabic appears word‑by‑word, then tagline fades in.
📖 Prayer Times	Live prayer times for Nigeria and Egypt using the Aladhan API.
👤 Student Management	Add, delete, block/unblock students; mark attendance.
👨‍🏫 Teacher Management	Add teachers with profile pictures.
📅 Timetable Upload	Admin can upload a PDF timetable for students to download.
💬 WhatsApp Integration	Quick contact button links to a predefined WhatsApp message.
🛠️ Technology Stack
Frontend: HTML5, CSS3, JavaScript (Vanilla)

Video Conferencing: Jitsi Meet API (external)

PWA: Manifest, Service Worker, Badging API

API: Aladhan Prayer Times API

Icons: Font Awesome

Fonts: Google Fonts (Inter, Amiri)

📂 Project Structure
text
📁 project-root/
├── index.html          # Main HTML file (all UI structure)
├── style.css           # All styles (separated from HTML)
├── script.js           # All JavaScript logic
├── manifest.json       # PWA manifest (icons, theme, start URL)
├── service-worker.js   # Service Worker for offline caching
└── README.md           # This file
All icons are generated via SVG data URIs inside the manifest – no external image files are required.

🚀 Getting Started
1. Clone or Download
bash
git clone https://github.com/yourusername/mubarak-academy.git
cd mubarak-academy
2. Open the App
Simply open index.html in your browser. For best results, use a local server (e.g., VS Code Live Server, Python http.server, or Node serve).

3. Default Admin Credentials
Username: admin

Password: admin123 (can be changed inside the Admin Settings)

4. Student Login Example
Username: muhammad

Gmail: muhammad@gmail.com

Other students are pre‑loaded in the system (you can add more from the Dashboard).

📱 PWA Installation
The app is fully PWA‑compliant. You can install it:

On Android/Chrome: Open the app, look for the "Install App" button (bottom‑right) or the browser’s install prompt.

On iOS/Safari: Tap the Share button → “Add to Home Screen”.

On Desktop/Edge/Chrome: Click the install icon in the address bar or use the “Install App” floating button.

When installed, the app launches with a custom splash screen and offline support.

📚 Usage Guide
For Students
Login with your username and Gmail address.

Home Page shows welcome message, prayer times, upcoming classes, next class info, and timetable (if uploaded).

Courses and Teachers pages display available courses and teacher profiles.

Join Live Class – if a class is active, click the red banner or the “Join Live Class” button.

Notifications – the bell icon shows unread count; click it to view announcements.

For Admin
Login with Admin credentials (username: admin, password: admin123).

Dashboard – access all management sections via the sidebar.

Students – add, block/unblock, or delete students.

Attendance – mark students as Present or Absent.

Teachers – add/delete teachers.

Live Classes – select a class and click “Start Live Class”. Students can join via the Home page or the Dashboard.

Notifications – click “+ Add Announcement” to publish a message. Students will see a badge counter.

Settings – change admin password or upload a timetable PDF.

🔧 Configuration
Changing Admin Password
Go to Dashboard → Settings → “Change Admin Password”.

Enter the current password, then the new password (minimum 4 characters).

Jitsi Meet Configuration
The app uses the public Jitsi Meet instance (meet.jit.si). No API key is required. To use your own Jitsi server, edit the domain variable in openJitsiMeeting() inside script.js.

Prayer Times
The prayer times are fetched from the Aladhan API. If the API fails, default fallback times are shown.

🌐 Browser Support
Works on modern browsers: Chrome, Firefox, Safari, Edge (both desktop and mobile).

PWA installation works on Android (Chrome), iOS (Safari), and Desktop (Chrome/Edge).

🤝 Contributing
Contributions are welcome! Feel free to open issues or submit pull requests for improvements.

Fork the repository.

Create a feature branch: git checkout -b feature/amazing-feature

Commit your changes: git commit -m 'Add some amazing feature'

Push to the branch: git push origin feature/amazing-feature

Open a Pull Request.

📄 License
This project is proprietary and intended for educational use. Please contact the author for licensing details.

📞 Contact
For support, feature requests, or questions, please reach out via:

WhatsApp: 201279760786

Email: (add your email here)

🎯 Future Roadmap
Backend integration for user data persistence.

Push notifications via Firebase Cloud Messaging.

Student progress tracking and analytics.

Multiple language support.

Thank you for using Mubarak Smart Islamic Academy – empowering hearts with Quran & Sunnah.
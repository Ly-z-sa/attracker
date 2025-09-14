let currentSubjectId = null;

// Load subjects on page load
document.addEventListener('DOMContentLoaded', () => {
    // Auth state will handle initialization
});

// Toast notification system
function showToast(title, message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconMap = {
        success: '<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20" style="color: #10b981;"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>',
        error: '<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20" style="color: #ef4444;"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/></svg>',
        warning: '<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20" style="color: #f59e0b;"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"/></svg>'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">${iconMap[type]}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => container.removeChild(toast), 300);
    }, 3000);
}

// Toggle user menu
function toggleUserMenu() {
    const menu = document.getElementById('userDropdownMenu');
    menu.classList.toggle('show');
}

// Sign in function
async function signIn() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showToast('Missing Information', 'Please enter email and password', 'warning');
        return;
    }
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        showToast('Welcome Back!', 'Successfully signed in', 'success');
    } catch (error) {
        showToast('Sign In Failed', error.message, 'error');
    }
}

// Sign up function
async function signUp() {
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    if (!name || !email || !password) {
        showToast('Missing Information', 'Please fill in all fields', 'warning');
        return;
    }
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: name });
        showToast('Account Created!', 'Welcome to AttendanceTracker', 'success');
    } catch (error) {
        showToast('Sign Up Failed', error.message, 'error');
    }
}

// Show sign up form
function showSignUp() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
    document.getElementById('authTitle').textContent = 'Create Account';
}

// Show sign in form
function showSignIn() {
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('authTitle').textContent = 'Welcome Back';
}

// Initialize app after authentication
function initializeApp() {
    initializeUserData();
    loadSubjects();
    updateStats();
    loadReports();
    loadNotifications();
    initializeDarkMode();
    autoMarkTodaysAttendance();
}

// Sign out function
function signOut() {
    auth.signOut();
    showToast('Signed Out', 'See you next time!', 'success');
    document.getElementById('userDropdownMenu').classList.remove('show');
}

// Auto mark attendance as present for today's classes
async function autoMarkTodaysAttendance() {
    try {
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        const todayDayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][today.getDay()];
        
        // Get all subjects that have classes today
        const subjectsSnapshot = await subjectsCollection.get();
        
        for (const doc of subjectsSnapshot.docs) {
            const subject = doc.data();
            const subjectDays = subject.days || [];
            
            // Check if subject has class today
            if (subjectDays.includes(todayDayName)) {
                // Check if attendance already exists for today
                const existingAttendance = await attendanceCollection
                    .where('subjectId', '==', doc.id)
                    .where('date', '==', todayString)
                    .get();
                
                // If no attendance record exists, create one as 'present'
                if (existingAttendance.empty) {
                    await attendanceCollection.add({
                        subjectId: doc.id,
                        date: todayString,
                        status: 'present',
                        autoMarked: true,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            }
        }
        
        // Refresh the UI to show the auto-marked attendance
        loadSubjects();
        updateStats();
    } catch (error) {
        console.error('Error auto-marking attendance:', error);
    }
}

// Initialize dark mode
function initializeDarkMode() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateDarkModeIcon(savedTheme);
}

// Toggle dark mode
function toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateDarkModeIcon(newTheme);
}

// Update dark mode icon
function updateDarkModeIcon(theme) {
    const icon = document.getElementById('darkModeIcon');
    if (theme === 'dark') {
        icon.innerHTML = '<path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/>';
    } else {
        icon.innerHTML = '<path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>';
    }
}

// Initialize user data
async function initializeUserData() {
    try {
        const userDoc = await usersCollection.doc(currentUserId).get();
        if (!userDoc.exists) {
            await usersCollection.doc(currentUserId).set({
                name: currentUser.displayName || 'Student User',
                email: currentUser.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        const userData = userDoc.exists ? userDoc.data() : { name: currentUser.displayName || 'Student User', email: currentUser.email };
        document.getElementById('fullName').value = userData.name;
        document.getElementById('email').value = userData.email;
        document.querySelector('.user-avatar span').textContent = userData.name.split(' ').map(n => n[0]).join('').toUpperCase();
    } catch (error) {
        console.error('Error initializing user data:', error);
    }
}

// Tab functionality
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Add active class to clicked nav link
    event.target.classList.add('active');
    
    // Load data for specific tabs
    if (tabName === 'reports') {
        loadReports();
    }
}

// Update statistics
async function updateStats() {
    try {
        const subjectsSnapshot = await subjectsCollection.where('userId', '==', currentUserId).get();
        document.getElementById('totalSubjects').textContent = subjectsSnapshot.size;
        
        const today = new Date().toISOString().split('T')[0];
        const attendanceSnapshot = await attendanceCollection
            .where('userId', '==', currentUserId)
            .where('date', '==', today)
            .get();
        
        let presentCount = 0, absentCount = 0, lateCount = 0;
        
        attendanceSnapshot.forEach(doc => {
            const record = doc.data();
            if (record.status === 'present') presentCount++;
            else if (record.status === 'absent') absentCount++;
            else if (record.status === 'late') lateCount++;
        });
        
        document.getElementById('presentCount').textContent = presentCount;
        document.getElementById('absentCount').textContent = absentCount;
        document.getElementById('lateCount').textContent = lateCount;
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Load reports data
async function loadReports() {
    try {
        // Get ALL user attendance (no date filter to debug)
        const allUserAttendance = await attendanceCollection
            .where('userId', '==', currentUserId)
            .get();
        
        console.log('Total user attendance records:', allUserAttendance.size);
        
        // Calculate date ranges
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        const weekStartStr = weekStart.toISOString().split('T')[0];
        
        const monthStart = new Date();
        monthStart.setDate(1);
        const monthStartStr = monthStart.toISOString().split('T')[0];
        
        // Weekly Report
        let weeklyStats = { present: 0, absent: 0, late: 0, permission: 0 };
        allUserAttendance.forEach(doc => {
            const record = doc.data();
            if (record.date >= weekStartStr && weeklyStats[record.status] !== undefined) {
                weeklyStats[record.status]++;
            }
        });
        
        document.getElementById('weeklyReport').innerHTML = `
            <div class="stat-row">Present: ${weeklyStats.present}</div>
            <div class="stat-row">Absent: ${weeklyStats.absent}</div>
            <div class="stat-row">Late: ${weeklyStats.late}</div>
            <div class="stat-row">Permission: ${weeklyStats.permission}</div>
        `;
        
        // Monthly Report
        let monthlyStats = { present: 0, absent: 0, late: 0, permission: 0 };
        allUserAttendance.forEach(doc => {
            const record = doc.data();
            if (record.date >= monthStartStr && monthlyStats[record.status] !== undefined) {
                monthlyStats[record.status]++;
            }
        });
        
        document.getElementById('monthlyReport').innerHTML = `
            <div class="stat-row">Present: ${monthlyStats.present}</div>
            <div class="stat-row">Absent: ${monthlyStats.absent}</div>
            <div class="stat-row">Late: ${monthlyStats.late}</div>
            <div class="stat-row">Permission: ${monthlyStats.permission}</div>
        `;
        
        // Subject Performance
        const userSubjects = await subjectsCollection
            .where('userId', '==', currentUserId)
            .get();
        
        let subjectPerformance = [];
        
        for (let doc of userSubjects.docs) {
            const subject = doc.data();
            if (!subject.name) continue;
            
            let stats = { present: 0, absent: 0, late: 0, permission: 0 };
            
            // Count attendance for this subject from all user attendance
            allUserAttendance.forEach(attendanceDoc => {
                const record = attendanceDoc.data();
                if (record.subjectId === doc.id && stats[record.status] !== undefined) {
                    stats[record.status]++;
                }
            });
            
            const total = stats.present + stats.absent + stats.late + stats.permission;
            const percentage = total > 0 ? Math.round((stats.present / total) * 100) : 0;
            
            subjectPerformance.push({
                name: subject.name,
                percentage: percentage,
                total: total
            });
        }
        
        document.getElementById('subjectReport').innerHTML = subjectPerformance.length > 0 
            ? subjectPerformance.map(subject => 
                `<div class="stat-row">${subject.name}: ${subject.percentage}% (${subject.total} records)</div>`
              ).join('')
            : '<div class="stat-row">No subjects found</div>';
        
    } catch (error) {
        console.error('Error loading reports:', error);
        document.getElementById('weeklyReport').innerHTML = '<div class="stat-row">Error loading data</div>';
        document.getElementById('monthlyReport').innerHTML = '<div class="stat-row">Error loading data</div>';
        document.getElementById('subjectReport').innerHTML = '<div class="stat-row">Error loading data</div>';
    }
}

// Check attendance alerts
async function checkAttendanceAlerts(subjectId) {
    try {
        const subjectDoc = await subjectsCollection.doc(subjectId).get();
        const subjectName = subjectDoc.data().name;
        
        const attendanceSnapshot = await attendanceCollection
            .where('subjectId', '==', subjectId)
            .get();
        
        let absentCount = 0;
        let lateCount = 0;
        
        attendanceSnapshot.forEach(doc => {
            const record = doc.data();
            if (record.status === 'absent') absentCount++;
            if (record.status === 'late') lateCount++;
        });
        
        // Check for 2 absents
        if (absentCount === 2) {
            await createNotification(
                'Attendance Warning',
                `You have 2 absences in ${subjectName}. Please improve your attendance.`,
                'warning'
            );
        }
        
        // Check for 3 combined absents and lates
        if ((absentCount + lateCount) === 3) {
            await createNotification(
                'Critical Attendance Alert',
                `You have ${absentCount} absences and ${lateCount} late arrivals in ${subjectName}. Immediate attention required.`,
                'critical'
            );
        }
        
        loadNotifications();
    } catch (error) {
        console.error('Error checking attendance alerts:', error);
    }
}

// Create notification
async function createNotification(title, message, type) {
    try {
        await notificationsCollection.add({
            userId: currentUserId,
            title: title,
            message: message,
            type: type,
            read: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
}

// Load notifications
async function loadNotifications() {
    try {
        const snapshot = await notificationsCollection
            .where('userId', '==', currentUserId)
            .where('read', '==', false)
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();
        
        const badge = document.querySelector('.notification-badge');
        badge.textContent = snapshot.size;
        badge.style.display = snapshot.size > 0 ? 'block' : 'none';
        
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// Show notifications dropdown
function showNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown.style.display === 'block') {
        dropdown.style.display = 'none';
        return;
    }
    
    loadNotificationsList();
    dropdown.style.display = 'block';
}

// Load notifications list
async function loadNotificationsList() {
    try {
        const snapshot = await notificationsCollection
            .where('userId', '==', currentUserId)
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();
        
        const list = document.getElementById('notificationsList');
        list.innerHTML = '';
        
        if (snapshot.empty) {
            list.innerHTML = '<div class="notification-item">No notifications</div>';
            return;
        }
        
        snapshot.forEach(doc => {
            const notification = doc.data();
            const item = document.createElement('div');
            item.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
            item.innerHTML = `
                <div class="notification-header">
                    <span class="notification-title">${notification.title}</span>
                    <span class="notification-type ${notification.type}">${notification.type}</span>
                </div>
                <div class="notification-message">${notification.message}</div>
                <div class="notification-actions">
                    ${!notification.read ? `<button onclick="markAsRead('${doc.id}')" class="btn-link">Mark as read</button>` : ''}
                    <button onclick="deleteNotification('${doc.id}')" class="btn-link">Delete</button>
                </div>
            `;
            list.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading notifications list:', error);
    }
}

// Mark notification as read
async function markAsRead(notificationId) {
    try {
        await notificationsCollection.doc(notificationId).update({
            read: true
        });
        loadNotifications();
        loadNotificationsList();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// Delete notification
async function deleteNotification(notificationId) {
    try {
        await notificationsCollection.doc(notificationId).delete();
        loadNotifications();
        loadNotificationsList();
    } catch (error) {
        console.error('Error deleting notification:', error);
    }
}

// Update user profile
async function updateProfile() {
    try {
        const name = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        
        await usersCollection.doc(currentUserId).update({
            name: name,
            email: email,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        document.querySelector('.user-avatar span').textContent = name.split(' ').map(n => n[0]).join('').toUpperCase();
        alert('Profile updated successfully!');
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Error updating profile');
    }
}

// Helper function to show tab by name
function showTabByName(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    document.getElementById(tabName + '-tab').classList.add('active');
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
}

// Close notification dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('notificationDropdown');
    const button = document.querySelector('.btn-icon');
    
    if (!button.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.style.display = 'none';
    }
});

// Add new subject
async function addSubject() {
    const subjectName = document.getElementById('subjectInput').value.trim();
    const selectedDays = Array.from(document.querySelectorAll('.day-input:checked')).map(input => input.value);
    
    if (!subjectName || selectedDays.length === 0) {
        alert('Please enter subject name and select at least one day');
        return;
    }

    try {
        await subjectsCollection.add({
            userId: currentUserId,
            name: subjectName,
            days: selectedDays,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        document.getElementById('subjectInput').value = '';
        document.querySelectorAll('.day-input').forEach(input => input.checked = false);
        loadSubjects();
    } catch (error) {
        console.error('Error adding subject:', error);
    }
}

// Load all subjects
async function loadSubjects() {
    try {
        const snapshot = await subjectsCollection
            .where('userId', '==', currentUserId)
            .get();
        
        const subjectsList = document.getElementById('subjectsList');
        subjectsList.innerHTML = '';

        if (snapshot.empty) {
            subjectsList.innerHTML = '<div class="empty-state"><h3>No subjects yet</h3><p>Add your first subject to get started</p></div>';
            return;
        }

        snapshot.forEach(doc => {
            const subject = doc.data();
            const days = subject.days || ['monday'];
            const name = subject.name || 'Unnamed Subject';
            const subjectElement = createSubjectElement(doc.id, name, days);
            subjectsList.appendChild(subjectElement);
        });
    } catch (error) {
        console.error('Error loading subjects:', error);
        // Show subjects without userId filter as fallback
        try {
            const fallbackSnapshot = await subjectsCollection.get();
            const subjectsList = document.getElementById('subjectsList');
            subjectsList.innerHTML = '';
            
            fallbackSnapshot.forEach(doc => {
                const subject = doc.data();
                if (subject.name) {
                    const days = subject.days || ['monday'];
                    const subjectElement = createSubjectElement(doc.id, subject.name, days);
                    subjectsList.appendChild(subjectElement);
                }
            });
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
        }
    }
}

// Create subject element
function createSubjectElement(id, name, days) {
    const div = document.createElement('div');
    div.className = 'subject-card';
    div.dataset.days = days.join(',');
    
    const daysText = days.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ');
    
    div.innerHTML = `
        <div class="subject-header">
            <div class="subject-info">
                <h3>${name}</h3>
                <p>${daysText}</p>
            </div>
            <div class="subject-actions">
                <button onclick="openAttendanceModal('${id}', '${name}', '${days.join(',')}')" class="btn btn-primary btn-icon-only" title="Mark Attendance">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"/>
                    </svg>
                </button>
                <button onclick="openEditModal('${id}', '${name}', '${days.join(',')}')" class="btn btn-secondary btn-icon-only" title="Edit Subject">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                    </svg>
                </button>
                <button onclick="deleteSubject('${id}')" class="btn btn-danger btn-icon-only" title="Delete Subject">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/>
                    </svg>
                </button>
            </div>
        </div>
        <div id="attendance-${id}" class="attendance-list">
            <!-- Attendance records will be loaded here -->
        </div>
    `;
    
    loadAttendanceForSubject(id);
    return div;
}

// Load attendance for specific subject
async function loadAttendanceForSubject(subjectId) {
    try {
        const snapshot = await attendanceCollection
            .where('userId', '==', currentUserId)
            .where('subjectId', '==', subjectId)
            .orderBy('date', 'desc')
            .limit(5)
            .get();

        const attendanceDiv = document.getElementById(`attendance-${subjectId}`);
        if (!attendanceDiv) return;

        attendanceDiv.innerHTML = '';
        
        if (snapshot.empty) {
            attendanceDiv.innerHTML = '<div class="empty-state"><p>No attendance records yet</p></div>';
            return;
        }

        snapshot.forEach(doc => {
            const record = doc.data();
            const recordElement = document.createElement('div');
            recordElement.className = `attendance-record ${record.status}`;
            
            const statusText = record.status === 'permission' ? 'Permission' : record.status.charAt(0).toUpperCase() + record.status.slice(1);
            const autoMarkedIndicator = record.autoMarked ? ' <span class="auto-marked">●</span>' : '';
            recordElement.innerHTML = `
                <span>${record.date}</span>
                <span class="status-badge ${record.status}">${statusText}${autoMarkedIndicator}</span>
            `;
            attendanceDiv.appendChild(recordElement);
        });
    } catch (error) {
        console.error('Error loading attendance:', error);
    }
}

let currentSelectedDate = new Date();
let currentSubjectDays = [];

// Open attendance modal
function openAttendanceModal(subjectId, subjectName, subjectDays) {
    currentSubjectId = subjectId;
    currentSubjectDays = subjectDays.split(',');
    
    document.getElementById('modalTitle').textContent = `Mark Attendance - ${subjectName}`;
    
    // Find the nearest valid date for this subject
    currentSelectedDate = findNearestValidDateForSubject(new Date(), currentSubjectDays);
    updateDateDisplay();
    
    document.getElementById('attendanceModal').classList.add('show');
}

// Find nearest valid date for subject
function findNearestValidDateForSubject(startDate, subjectDays) {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const validDayNumbers = subjectDays.map(day => dayNames.indexOf(day.toLowerCase()));
    
    // If today is a valid day, use today
    if (validDayNumbers.includes(startDate.getDay())) {
        return new Date(startDate);
    }
    
    // Find the nearest valid day (check both forward and backward)
    for (let i = 1; i <= 7; i++) {
        // Check forward
        const forwardDate = new Date(startDate);
        forwardDate.setDate(startDate.getDate() + i);
        if (validDayNumbers.includes(forwardDate.getDay())) {
            return forwardDate;
        }
        
        // Check backward
        const backwardDate = new Date(startDate);
        backwardDate.setDate(startDate.getDate() - i);
        if (validDayNumbers.includes(backwardDate.getDay())) {
            return backwardDate;
        }
    }
    
    return startDate; // fallback
}

// Navigate date (direction: -1 for previous, 1 for next)
function navigateDate(direction) {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const validDayNumbers = currentSubjectDays.map(day => dayNames.indexOf(day.toLowerCase()));
    
    // Start from current date and move in the specified direction
    let newDate = new Date(currentSelectedDate);
    
    // Move by weeks to find the next/previous occurrence of valid days
    if (direction === 1) {
        // Find next valid date
        do {
            newDate.setDate(newDate.getDate() + 1);
        } while (!validDayNumbers.includes(newDate.getDay()));
    } else {
        // Find previous valid date
        do {
            newDate.setDate(newDate.getDate() - 1);
        } while (!validDayNumbers.includes(newDate.getDay()));
    }
    
    currentSelectedDate = newDate;
    updateDateDisplay();
}

// Update date display
function updateDateDisplay() {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dateStr = `${monthNames[currentSelectedDate.getMonth()]} ${currentSelectedDate.getDate()}, ${currentSelectedDate.getFullYear()}`;
    const dayStr = dayNames[currentSelectedDate.getDay()];
    
    document.getElementById('selectedDate').textContent = dateStr;
    document.getElementById('selectedDay').textContent = dayStr;
}

// Filter subjects by day
function filterSubjectsByDay() {
    const selectedDay = document.getElementById('dayFilter').value;
    const subjectCards = document.querySelectorAll('.subject-card');
    
    subjectCards.forEach(card => {
        const cardDays = card.dataset.days.split(',');
        
        if (selectedDay === 'all' || cardDays.includes(selectedDay)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Close modal
function closeModal() {
    document.getElementById('attendanceModal').classList.remove('show');
    document.getElementById('statusOptions').classList.remove('show');
    document.querySelector('.dropdown-selected').classList.remove('active');
    selectedAttendanceStatus = 'present';
    document.getElementById('selectedStatus').textContent = 'Present';
    currentSubjectId = null;
}

let selectedAttendanceStatus = 'present';

// Toggle status dropdown
function toggleStatusDropdown() {
    const dropdown = document.getElementById('statusOptions');
    const selected = document.querySelector('.dropdown-selected');
    
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        selected.classList.remove('active');
    } else {
        dropdown.classList.add('show');
        selected.classList.add('active');
    }
}

// Select status from dropdown
function selectStatus(value, text) {
    selectedAttendanceStatus = value;
    document.getElementById('selectedStatus').textContent = text;
    
    // Close dropdown
    document.getElementById('statusOptions').classList.remove('show');
    document.querySelector('.dropdown-selected').classList.remove('active');
}

// Save attendance
async function saveAttendance() {
    if (!currentSubjectId) return;

    const date = currentSelectedDate.toISOString().split('T')[0];
    const status = selectedAttendanceStatus;

    if (!date) return;

    try {
        // Check if attendance already exists for this date
        const existingSnapshot = await attendanceCollection
            .where('userId', '==', currentUserId)
            .where('subjectId', '==', currentSubjectId)
            .where('date', '==', date)
            .get();

        if (!existingSnapshot.empty) {
            // Update existing record
            const docId = existingSnapshot.docs[0].id;
            await attendanceCollection.doc(docId).update({
                status: status,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            // Create new record
            await attendanceCollection.add({
                userId: currentUserId,
                subjectId: currentSubjectId,
                date: date,
                status: status,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        closeModal();
        loadAttendanceForSubject(currentSubjectId);
        updateStats();
        checkAttendanceAlerts(currentSubjectId);
    } catch (error) {
        console.error('Error saving attendance:', error);
    }
}

// Delete subject
async function deleteSubject(subjectId) {
    if (!confirm('Are you sure you want to delete this subject and all its attendance records?')) {
        return;
    }

    try {
        // Delete all attendance records for this subject
        const attendanceSnapshot = await attendanceCollection
            .where('subjectId', '==', subjectId)
            .get();

        const batch = db.batch();
        attendanceSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Delete the subject
        batch.delete(subjectsCollection.doc(subjectId));
        
        await batch.commit();
        loadSubjects();
        updateStats();
        
        // Switch to dashboard after adding subject
        showTabByName('dashboard');
        
        // Reset day filter
        document.getElementById('dayFilter').value = 'all';
    } catch (error) {
        console.error('Error deleting subject:', error);
    }
}

// Close modal when clicking outside
document.getElementById('attendanceModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// Handle Enter key for adding subjects
document.getElementById('subjectInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addSubject();
    }
});

let currentEditSubjectId = null;

// Open edit subject modal
function openEditModal(subjectId, subjectName, subjectDays) {
    currentEditSubjectId = subjectId;
    
    // Set subject name
    document.getElementById('editSubjectName').value = subjectName;
    
    // Clear all checkboxes first
    document.querySelectorAll('.edit-day-input').forEach(input => {
        input.checked = false;
    });
    
    // Check the days for this subject
    const days = subjectDays.split(',');
    days.forEach(day => {
        const checkbox = document.querySelector(`.edit-day-input[value="${day}"]`);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
    
    document.getElementById('editSubjectModal').classList.add('show');
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editSubjectModal').classList.remove('show');
    currentEditSubjectId = null;
}

// Save edited subject
async function saveEditSubject() {
    const subjectName = document.getElementById('editSubjectName').value.trim();
    const selectedDays = Array.from(document.querySelectorAll('.edit-day-input:checked')).map(input => input.value);
    
    if (!subjectName || selectedDays.length === 0) {
        alert('Please enter subject name and select at least one day');
        return;
    }
    
    try {
        await subjectsCollection.doc(currentEditSubjectId).update({
            name: subjectName,
            days: selectedDays,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        closeEditModal();
        loadSubjects();
        updateStats();
    } catch (error) {
        console.error('Error updating subject:', error);
        alert('Error updating subject');
    }
}

// Close edit modal when clicking outside
document.getElementById('editSubjectModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeEditModal();
    }
});

let selectedDayFilter = 'all';
let selectedDefaultView = 'dashboard';

// Toggle day filter dropdown
function toggleDayFilter() {
    const dropdown = document.getElementById('dayFilterOptions');
    const selected = document.querySelector('#dayFilterDropdown .dropdown-selected');
    
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        selected.classList.remove('active');
    } else {
        dropdown.classList.add('show');
        selected.classList.add('active');
    }
}

// Select day from dropdown
function selectDay(value, text) {
    selectedDayFilter = value;
    document.getElementById('selectedDay').textContent = text;
    
    // Close dropdown
    document.getElementById('dayFilterOptions').classList.remove('show');
    document.querySelector('#dayFilterDropdown .dropdown-selected').classList.remove('active');
    
    // Filter subjects
    filterSubjectsByDay();
}

// Toggle default view dropdown
function toggleDefaultView() {
    const dropdown = document.getElementById('defaultViewOptions');
    const selected = document.querySelector('#defaultViewDropdown .dropdown-selected');
    
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        selected.classList.remove('active');
    } else {
        dropdown.classList.add('show');
        selected.classList.add('active');
    }
}

// Select default view from dropdown
function selectDefaultView(value, text) {
    selectedDefaultView = value;
    document.getElementById('selectedDefaultView').textContent = text;
    
    // Close dropdown
    document.getElementById('defaultViewOptions').classList.remove('show');
    document.querySelector('#defaultViewDropdown .dropdown-selected').classList.remove('active');
}

// Update filter subjects function to use custom dropdown value
function filterSubjectsByDay() {
    const selectedDay = selectedDayFilter;
    const subjectCards = document.querySelectorAll('.subject-card');
    
    subjectCards.forEach(card => {
        const cardDays = card.dataset.days.split(',');
        
        if (selectedDay === 'all' || cardDays.includes(selectedDay)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const statusDropdown = document.getElementById('statusDropdown');
    const dayFilterDropdown = document.getElementById('dayFilterDropdown');
    const defaultViewDropdown = document.getElementById('defaultViewDropdown');
    const userDropdown = document.querySelector('.user-dropdown');
    
    if (statusDropdown && !statusDropdown.contains(event.target)) {
        document.getElementById('statusOptions').classList.remove('show');
        document.querySelector('#statusDropdown .dropdown-selected').classList.remove('active');
    }
    
    if (dayFilterDropdown && !dayFilterDropdown.contains(event.target)) {
        document.getElementById('dayFilterOptions').classList.remove('show');
        document.querySelector('#dayFilterDropdown .dropdown-selected').classList.remove('active');
    }
    
    if (defaultViewDropdown && !defaultViewDropdown.contains(event.target)) {
        document.getElementById('defaultViewOptions').classList.remove('show');
        document.querySelector('#defaultViewDropdown .dropdown-selected').classList.remove('active');
    }
    
    if (userDropdown && !userDropdown.contains(event.target)) {
        document.getElementById('userDropdownMenu').classList.remove('show');
    }
});
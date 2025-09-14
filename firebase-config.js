// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBywNRB8wqzsphiPZ2gY9Q2IqQEZqvcgBU",
  authDomain: "attracker-fe6b7.firebaseapp.com",
  projectId: "attracker-fe6b7",
  storageBucket: "attracker-fe6b7.firebasestorage.app",
  messagingSenderId: "616720897632",
  appId: "1:616720897632:web:f4553717d593f29a585505",
  measurementId: "G-E3MDMBNN7M"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Collections
const subjectsCollection = db.collection('subjects');
const attendanceCollection = db.collection('attendance');
const usersCollection = db.collection('users');
const notificationsCollection = db.collection('notifications');

// Current user ID (persistent across sessions)
let currentUserId = localStorage.getItem('attracker_user_id');
if (!currentUserId) {
    currentUserId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('attracker_user_id', currentUserId);
}
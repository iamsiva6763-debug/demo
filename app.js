import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  getDatabase, 
  ref, 
  push, 
  onChildAdded 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDsSj48uBIVhkwHKaApr7eJ2xCzVLLFF00",
  authDomain: "real-time-chat-b2263.firebaseapp.com",
  databaseURL: "https://real-time-chat-b2263-default-rtdb.firebaseio.com",
  projectId: "real-time-chat-b2263",
  storageBucket: "real-time-chat-b2263.firebasestorage.app",
  messagingSenderId: "1015697771482",
  appId: "1:1015697771482:web:d29b7ba60a6c4e96f1cee3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// Explicitly passing databaseURL ensures smooth connection across regions
const db = getDatabase(app, firebaseConfig.databaseURL); 
const googleProvider = new GoogleAuthProvider();

// DOM Elements
const authCard = document.getElementById("auth-card");
const dashboardView = document.getElementById("dashboard-view");
const formTitle = document.getElementById("form-title");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const btnSubmit = document.getElementById("btn-submit");
const btnGoogle = document.getElementById("btn-google");
const btnLogout = document.getElementById("btn-logout");
const toggleForm = document.getElementById("toggle-form");
const errorMsg = document.getElementById("error-msg");
const profileEmail = document.getElementById("profile-email");
const avatar = document.getElementById("avatar");
const pageTitle = document.getElementById("page-title");

// Chat DOM Elements
const chatMessages = document.getElementById("chat-messages");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");

let isSignUp = false;
let currentUser = null;
let isChatInitialized = false;

// Toggle Login / Sign Up UI
toggleForm.addEventListener("click", () => {
  isSignUp = !isSignUp;
  formTitle.textContent = isSignUp ? "Sign Up" : "Login";
  btnSubmit.textContent = isSignUp ? "Sign Up" : "Log In";
  toggleForm.textContent = isSignUp ? "Already have an account? Login" : "Need an account? Sign Up";
  errorMsg.textContent = "";
});

// Authentication Handler
btnSubmit.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  errorMsg.textContent = "";

  try {
    if (isSignUp) {
      await createUserWithEmailAndPassword(auth, email, password);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  } catch (err) {
    console.error("Auth Error:", err);
    errorMsg.textContent = err.message.replace("Firebase: ", "");
  }
});

// Google Login
btnGoogle.addEventListener("click", async () => {
  errorMsg.textContent = "";
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    console.error("Google Auth Error:", err);
    errorMsg.textContent = err.message.replace("Firebase: ", "");
  }
});

// Logout Handler
btnLogout.addEventListener("click", () => signOut(auth));

// Sidebar Navigation Switcher
const navItems = document.querySelectorAll(".nav-item");
const viewPanels = document.querySelectorAll(".view-panel");

navItems.forEach(item => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    const targetId = item.getAttribute("data-target");

    navItems.forEach(nav => nav.classList.remove("active"));
    item.classList.add("active");

    pageTitle.textContent = item.textContent;

    viewPanels.forEach(panel => {
      if (panel.id === targetId) {
        panel.classList.remove("hidden");
      } else {
        panel.classList.add("hidden");
      }
    });
  });
});

// Realtime Chat Submit
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text || !currentUser) return;

  try {
    const messagesRef = ref(db, "messages");
    await push(messagesRef, {
      uid: currentUser.uid,
      sender: currentUser.email || "User",
      text: text,
      timestamp: Date.now()
    });

    chatInput.value = "";
  } catch (err) {
    console.error("Send Message Error:", err);
    alert("Failed to send message: " + err.message);
  }
});

// Listen for Messages
function listenForChatMessages() {
  if (isChatInitialized) return;
  isChatInitialized = true;

  chatMessages.innerHTML = "";
  const messagesRef = ref(db, "messages");

  onChildAdded(messagesRef, (snapshot) => {
    const data = snapshot.val();
    renderMessage(data);
  }, (error) => {
    console.error("Database Read Error:", error);
  });
}

function renderMessage(msg) {
  const isMine = currentUser && msg.uid === currentUser.uid;
  const msgDiv = document.createElement("div");
  msgDiv.className = `chat-msg ${isMine ? 'mine' : 'other'}`;
  
  msgDiv.innerHTML = `
    <span class="msg-sender">${isMine ? 'You' : msg.sender}</span>
    <div>${escapeHtml(msg.text)}</div>
  `;

  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Session State Tracking
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    
    profileEmail.textContent = user.email;
    avatar.textContent = user.email ? user.email.charAt(0).toUpperCase() : "U";

    authCard.classList.add("hidden");
    dashboardView.classList.remove("hidden");

    listenForChatMessages();
  } else {
    currentUser = null;
    isChatInitialized = false;
    dashboardView.classList.add("hidden");
    authCard.classList.remove("hidden");
    emailInput.value = "";
    passwordInput.value = "";
    chatMessages.innerHTML = "";
  }
});
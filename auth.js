import { initializeApp, getApps, getApp }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  browserLocalPersistence,
  setPersistence,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

// ── Init ──────────────────────────────────────────────────────────────────────

const CONFIGURED = Boolean(firebaseConfig?.apiKey) &&
                   !firebaseConfig.apiKey.startsWith('YOUR_');

let auth = null;

if (CONFIGURED) {
  // Safe init: reuse the existing app if another module already called
  // initializeApp() on this page — prevents "app already exists" crash.
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);

  setPersistence(auth, browserLocalPersistence).catch(() => {});

  // If already signed in when the auth page loads, go straight to the dashboard.
  onAuthStateChanged(auth, user => {
    if (user) window.location.replace('index.html');
  });
}

// ── DOM refs ──────────────────────────────────────────────────────────────────

const tabSignin = document.getElementById("tabSignin");
const tabSignup = document.getElementById("tabSignup");
const panelSignin = document.getElementById("panelSignin");
const panelSignup = document.getElementById("panelSignup");
const authHeading = document.getElementById("authHeading");
const authSub = document.getElementById("authSub");
const authBanner = document.getElementById("authBanner");
const formSignin = document.getElementById("formSignin");
const formSignup = document.getElementById("formSignup");
const siEmail = document.getElementById("siEmail");
const siPassword = document.getElementById("siPassword");
const siEye = document.getElementById("siEye");
const siSubmit = document.getElementById("siSubmit");
const suName = document.getElementById("suName");
const suEmail = document.getElementById("suEmail");
const suPassword = document.getElementById("suPassword");
const suEye = document.getElementById("suEye");
const suSubmit = document.getElementById("suSubmit");
const forgotBtn = document.getElementById("forgotBtn");
const googleBtn = document.getElementById("googleBtn");
const strengthFill = document.getElementById("strengthFill");
const strengthLabel = document.getElementById("strengthLabel");

// ── Tab switching ─────────────────────────────────────────────────────────────

function activateTab(tab) {
  const isSignin = tab === "signin";
  tabSignin.classList.toggle("auth-tab--active", isSignin);
  tabSignup.classList.toggle("auth-tab--active", !isSignin);
  tabSignin.setAttribute("aria-selected", isSignin);
  tabSignup.setAttribute("aria-selected", !isSignin);
  panelSignin.hidden = !isSignin;
  panelSignup.hidden = isSignin;
  authHeading.textContent = isSignin ? "Welcome back" : "Create your account";
  authSub.textContent = isSignin
    ? "Sign in to your account to continue"
    : "Start your job search journey today";
  clearBanner();
}

tabSignin.addEventListener("click", () => activateTab("signin"));
tabSignup.addEventListener("click", () => activateTab("signup"));

// ── Banner helpers ─────────────────────────────────────────────────────────────

function showBanner(msg, type = "error") {
  authBanner.textContent = msg;
  authBanner.className = `auth-banner auth-banner--${type}`;
  authBanner.hidden = false;
}

function clearBanner() {
  authBanner.hidden = true;
}

// ── Loading state ─────────────────────────────────────────────────────────────

function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.querySelector(".auth-submit__text").hidden = loading;
  btn.querySelector(".auth-spinner").hidden = !loading;
}

// ── Password visibility toggle ────────────────────────────────────────────────

function wireEye(eyeBtn, input) {
  eyeBtn.addEventListener("click", () => {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    eyeBtn.querySelector(".material-icons").textContent = show
      ? "visibility_off"
      : "visibility";
  });
}

wireEye(siEye, siPassword);
wireEye(suEye, suPassword);

// ── Password strength ─────────────────────────────────────────────────────────

function measureStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0–5
}

const STRENGTH_LABELS = [
  "",
  "Very weak",
  "Weak",
  "Fair",
  "Strong",
  "Very strong",
];
const STRENGTH_COLORS = [
  "",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#22c55e",
  "#16a34a",
];

suPassword.addEventListener("input", () => {
  const pw = suPassword.value;
  const score = pw ? measureStrength(pw) : 0;
  const pct = score ? Math.round((score / 5) * 100) : 0;
  strengthFill.style.width = pct + "%";
  strengthFill.style.backgroundColor = STRENGTH_COLORS[score] || "";
  strengthLabel.textContent = pw ? STRENGTH_LABELS[score] : "";
  strengthLabel.style.color = STRENGTH_COLORS[score] || "";
});

// ── Firebase error messages ────────────────────────────────────────────────────

function friendlyError(code) {
  const map = {
    "auth/invalid-email": "That email address isn't valid.",
    "auth/user-not-found": "No account found for that email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/email-already-in-use": "An account with that email already exists.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/popup-closed-by-user": "Sign-in popup was closed.",
    "auth/cancelled-popup-request": "",
  };
  return map[code] || "Something went wrong. Please try again.";
}

// ── Sign in ───────────────────────────────────────────────────────────────────

formSignin.addEventListener('submit', async e => {
  e.preventDefault();
  clearBanner();

  if (!auth) {
    showBanner('Firebase is not configured. Edit firebase-config.js.', 'warn');
    return;
  }

  setLoading(siSubmit, true);
  try {
    await signInWithEmailAndPassword(auth, siEmail.value.trim(), siPassword.value);
    // Redirect immediately — don't wait for onAuthStateChanged to fire
    window.location.replace('index.html');
  } catch (err) {
    showBanner(friendlyError(err.code));
    setLoading(siSubmit, false);
  }
});

// ── Sign up ───────────────────────────────────────────────────────────────────

formSignup.addEventListener('submit', async e => {
  e.preventDefault();
  clearBanner();

  if (!auth) {
    showBanner('Firebase is not configured. Edit firebase-config.js.', 'warn');
    return;
  }

  setLoading(suSubmit, true);
  try {
    const cred = await createUserWithEmailAndPassword(
      auth, suEmail.value.trim(), suPassword.value,
    );
    await updateProfile(cred.user, { displayName: suName.value.trim() });
    window.location.replace('index.html');
  } catch (err) {
    showBanner(friendlyError(err.code));
    setLoading(suSubmit, false);
  }
});

// ── Forgot password ───────────────────────────────────────────────────────────

forgotBtn.addEventListener('click', async () => {
  clearBanner();

  if (!auth) {
    showBanner('Firebase is not configured. Edit firebase-config.js.', 'warn');
    return;
  }

  const email = siEmail.value.trim();
  if (!email) {
    showBanner('Enter your email address above, then click "Forgot password?".');
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    showBanner('Password reset email sent! Check your inbox.', 'success');
  } catch (err) {
    showBanner(friendlyError(err.code));
  }
});

// ── Google sign-in ────────────────────────────────────────────────────────────

googleBtn.addEventListener('click', async () => {
  clearBanner();

  if (!auth) {
    showBanner('Firebase is not configured. Edit firebase-config.js.', 'warn');
    return;
  }

  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
    window.location.replace('index.html');
  } catch (err) {
    if (err.code !== 'auth/cancelled-popup-request') {
      showBanner(friendlyError(err.code));
    }
  }
});

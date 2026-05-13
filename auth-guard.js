import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User logged in:", user.email);

    // SHOW PAGE
    document.body.style.visibility = "visible";
  } else {
    window.location.href = "auth.html";
  }
});

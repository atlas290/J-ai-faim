/* ============================================================
   J'ai faim — login-resto.js (Connexion sécurisée)
   ============================================================ */
"use strict";

const firebaseConfig = {
  apiKey: "AIzaSyCDhZlwQv9YEi88S9MgPBHKmo6Lgq1-rrs",
  authDomain: "jai-faim-d5e80.firebaseapp.com",
  projectId: "jai-faim-d5e80",
  storageBucket: "jai-faim-d5e80.firebasestorage.app",
  messagingSenderId: "208346031068",
  appId: "1:208346031068:web:b0323b1a51e1eab6a7a519"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

document.addEventListener("DOMContentLoaded", () => {
  // Si l'utilisateur est déjà connecté, on le redirige direct vers son dashboard
  auth.onAuthStateChanged((user) => {
    if (user) window.location.href = "dashboard-resto.html";
  });

  const form = document.querySelector(".inscription-form");
  if (form) form.addEventListener("submit", handleSubmit);
});

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  if (!email || !password) return alert("Remplissez tous les champs.");

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Connexion...";

  try {
    await auth.signInWithEmailAndPassword(email, password);
    window.location.href = "dashboard-resto.html";
  } catch (err) {
    console.error(err);
    if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
      alert("Email ou mot de passe incorrect.");
    } else {
      alert("Erreur : " + err.message);
    }
    submitBtn.disabled = false;
    submitBtn.textContent = "Se connecter";
  }
}
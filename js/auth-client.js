/* ============================================================
   J'ai faim — auth-client.js (Corrigé)
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

let isSubmitting = false;

function getFieldValue(form, ...keys) {
  for (const key of keys) {
    const el = form.querySelector(`#${key}, [name="${key}"]`);
    if (el) return (el.value || "").trim();
  }
  return "";
}

function frenchAuthError(code) {
  const map = {
    "auth/invalid-email": "Adresse email invalide.",
    "auth/user-disabled": "Ce compte a été désactivé.",
    "auth/user-not-found": "Aucun compte ne correspond à cet email.",
    "auth/wrong-password": "Mot de passe incorrect.",
    "auth/invalid-credential": "Email ou mot de passe incorrect.",
    "auth/email-already-in-use": "Cet email est déjà utilisé.",
    "auth/weak-password": "Le mot de passe doit faire au moins 6 caractères.",
    "auth/network-request-failed": "Problème de connexion réseau."
  };
  return map[code] || "Une erreur est survenue. Réessayez.";
}

function detectMode() {
  const path = window.location.pathname.toLowerCase();
  if (path.includes("inscription-client")) return "signup";
  if (path.includes("login-client")) return "login";
  if (document.querySelector("#name, [name='name']")) return "signup";
  return "login";
}

document.addEventListener("DOMContentLoaded", () => {
  const mode = detectMode();

  auth.onAuthStateChanged((user) => {
    if (user && !isSubmitting) {
      window.location.href = "profil.html";
    }
  });

  const form = document.querySelector("form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (mode === "signup") handleSignup(e.currentTarget);
    else handleLogin(e.currentTarget);
  });
});

async function handleSignup(form) {
  const nom = getFieldValue(form, "name", "nom");
  const email = getFieldValue(form, "email");
  const password = getFieldValue(form, "password");

  if (!nom || !email || !password) return alert("Remplissez tous les champs.");
  if (password.length < 6) return alert("Le mot de passe doit faire 6 caractères minimum.");

  isSubmitting = true;
  const submitBtn = form.querySelector('[type="submit"]');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Création..."; }

  try {
    const credential = await auth.createUserWithEmailAndPassword(email, password);
    await credential.user.updateProfile({ displayName: nom });
    window.location.href = "profil.html";
  } catch (err) {
    alert(frenchAuthError(err.code));
    isSubmitting = false;
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "S'inscrire"; }
  }
}

async function handleLogin(form) {
  const email = getFieldValue(form, "email");
  const password = getFieldValue(form, "password");

  if (!email || !password) return alert("Remplissez tous les champs.");

  isSubmitting = true;
  const submitBtn = form.querySelector('[type="submit"]');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Connexion..."; }

  try {
    await auth.signInWithEmailAndPassword(email, password);
    window.location.href = "profil.html";
  } catch (err) {
    alert(frenchAuthError(err.code));
    isSubmitting = false;
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Se connecter"; }
  }
}
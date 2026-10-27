/* ============================================================
   J'ai faim — inscription.js (Sécurisé avec Firebase Auth)
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
const db = firebase.firestore();
const auth = firebase.auth();

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".inscription-form");
  if (form) form.addEventListener("submit", handleSubmit);
});

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;

  // Récupération des données
  const nom = document.getElementById("resto-name").value.trim();
  const whatsapp = document.getElementById("resto-whatsapp").value.trim().replace(/\D/g, "");
  const cuisine = document.getElementById("resto-cuisine").value.trim();
  const adresse = document.getElementById("resto-address").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!nom || !whatsapp || !email || !password) {
    alert("Remplissez tous les champs obligatoires.");
    return;
  }
  if (password.length < 6) {
    alert("Le mot de passe doit faire au moins 6 caractères.");
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Enregistrement...";
  
  let createdUser = null;

  try {
    // 1. Créer le compte utilisateur (Email / Mot de passe)
    const credential = await auth.createUserWithEmailAndPassword(email, password);
    createdUser = credential.user;

    // 2. Créer le restaurant dans la base de données (avec son ID de propriétaire)
    const newRestaurant = {
      nom: nom,
      whatsapp: whatsapp,
      categorie: cuisine || "Autre",
      adresse: adresse,
      email: email,
      ownerUid: createdUser.uid, // C'est le lien de sécurité !
      note: "Nouveau",
      distance: "0 km",
      prix: "Menu à venir",
      image: "",
      sponsorise: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection("restaurants").add(newRestaurant);
    
    alert("Restaurant ajouté avec succès !");
    window.location.href = `dashboard-resto.html?id=${docRef.id}`;

  } catch (err) {
    console.error("Erreur :", err);
    if (err.code === "auth/email-already-in-use") {
      alert("Cet email est déjà utilisé. Essayez de vous connecter.");
    } else if (err.code === "auth/weak-password") {
      alert("Le mot de passe est trop faible.");
    } else {
      alert("Erreur : " + (err.message || "Réessayez."));
    }
    
    // Si le compte a été créé mais que le resto a échoué, on supprime le compte (sécurité)
    if (createdUser) {
      try { await createdUser.delete(); } catch (_) {}
    }
    
    submitBtn.disabled = false;
    submitBtn.textContent = "Créer mon compte resto";
  }
}
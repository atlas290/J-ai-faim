/* ============================================================
   J'ai faim — profil.js (Version finale corrigée)
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
const db = firebase.firestore();

document.addEventListener("DOMContentLoaded", () => {
  const nameEl = document.getElementById("profile-nom");
  const emailEl = document.getElementById("profile-email");
  const loginBtn = document.getElementById("btn-login");
  const logoutBtn = document.getElementById("btn-logout");
  const favoritesEl = document.querySelector(".profile-favorites");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await auth.signOut();
    });
  }

  auth.onAuthStateChanged((user) => {
    if (user) {
      if (nameEl) nameEl.textContent = `Bonjour, ${user.displayName || user.email}`;
      if (emailEl) emailEl.textContent = user.email || "";
      
      // On cache le bouton connexion et on montre le bouton déconnexion
      if (loginBtn) loginBtn.hidden = true;
      if (logoutBtn) logoutBtn.hidden = false;
      
      loadFavorites(user, favoritesEl);
    } else {
      if (nameEl) nameEl.textContent = "Bienvenue sur J'ai faim";
      if (emailEl) emailEl.textContent = "";
      
      // On montre le bouton connexion et on cache le bouton déconnexion
      if (loginBtn) loginBtn.hidden = false;
      if (logoutBtn) logoutBtn.hidden = true;
      
      if (favoritesEl) {
        favoritesEl.innerHTML = `<div class="empty-state"><h2 class="empty-state-title">Vous n'avez pas encore de favoris.</h2><p class="empty-state-text">Touchez le cœur sur un restaurant pour le retrouver ici.</p></div>`;
      }
    }
  });
});

async function loadFavorites(user, container) {
  if (!container) return;
  try {
    const userSnap = await db.collection("users").doc(user.uid).get();
    const favoris = userSnap.exists ? (userSnap.data().favoris || []) : [];

    if (favoris.length === 0) {
      container.innerHTML = `<div class="empty-state"><h2 class="empty-state-title">Vous n'avez pas encore de favoris.</h2><p class="empty-state-text">Touchez le cœur sur un restaurant pour le retrouver ici.</p></div>`;
      return;
    }

    const snaps = await Promise.all(favoris.map((id) => db.collection("restaurants").doc(id).get()));
    const restos = snaps.filter(s => s.exists).map(s => ({ id: s.id, ...s.data() }));

    if (restos.length === 0) {
      container.innerHTML = `<div class="empty-state"><h2 class="empty-state-title">Vos restaurants favoris ont été supprimés.</h2></div>`;
      return;
    }

    container.innerHTML = `
      <div class="restaurants" style="margin-top: 20px;">
        ${restos.map(r => {
          const img = r.image || 'https://placehold.co/400x300/f5ede0/8a7f76?text=Resto';
          const badge = r.sponsorise ? `<span class="badge-sponsored">⭐ Sponsorise</span>` : "";
          return `
            <a href="resto.html?id=${r.id}" class="restaurant-card" style="position:relative;">
              ${badge}
              <img src="${img}" alt="${r.nom}" class="card-image" loading="lazy">
              <div class="card-body">
                <h3 class="card-title">${r.nom}</h3>
                <div class="card-meta"><span class="star">⭐ ${r.note || 'N/A'}</span><span class="dot">·</span><span>${r.distance || '0 km'}</span></div>
                <p class="card-price">${r.prix || 'Menu à venir'}</p>
                <span class="card-btn">Voir le menu</span>
              </div>
            </a>
          `;
        }).join("")}
      </div>
    `;
  } catch (err) {
    console.error("Erreur favoris:", err);
    container.innerHTML = `<p style="text-align:center;color:red;">Erreur de chargement des favoris.</p>`;
  }
}
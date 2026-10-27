/* ============================================================
   J'ai faim — hasard.js (Version finale avec animation Shaker)
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

let restaurantsData = [];

document.addEventListener("DOMContentLoaded", () => {
  const btnLaunch = document.querySelector(".btn-surprise-launch");
  const circle = document.querySelector(".surprise-circle");
  const resultEl = document.getElementById("surprise-result");

  // 1. On charge les restaurants en arrière-plan
  db.collection("restaurants").get().then(snap => {
    restaurantsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }).catch(err => console.error("Erreur chargement Firebase :", err));

  // 2. L'action du bouton
  if (btnLaunch) {
    btnLaunch.addEventListener("click", () => {
      if (restaurantsData.length === 0) {
        alert("Aucun restaurant n'est disponible pour l'instant.");
        return;
      }

      // On cache l'ancien résultat
      resultEl.classList.remove("is-visible");
      
      // 🎰 ON LANCE LE SHAKER (le cercle tremble)
      circle.classList.add("is-rolling");
      
      // On désactive le bouton et on fait tourner le dé
      btnLaunch.disabled = true;
      // 👇 C'EST ICI QU'ON AJOUTE LA CLASSE is-spinning POUR QUE LE DÉ TOURNE
      btnLaunch.innerHTML = "<span class='btn-surprise-dice is-spinning' aria-hidden='true'>🎲</span><span>Recherche...</span>";

      // On attend 1.5 seconde pour le suspense
      setTimeout(() => {
        // On choisit un restaurant au hasard
        const randomResto = restaurantsData[Math.floor(Math.random() * restaurantsData.length)];
        
        // On prépare la carte HTML
        const imgSrc = randomResto.image || 'https://placehold.co/400x300/f5e6c8/2c2416?text=Surprise';
        const badge = randomResto.sponsorise ? `<span class="badge-sponsored">⭐ Sponsorisé</span>` : "";
        
        resultEl.innerHTML = `
          <a href="resto.html?id=${randomResto.id}" class="restaurant-card" style="position:relative;">
            ${badge}
            <img src="${imgSrc}" alt="${randomResto.nom}" class="card-image" width="400" height="300" loading="lazy">
            <div class="card-body">
              <h3 class="card-title">${randomResto.nom}</h3>
              <div class="card-meta">
                <span class="star-icon" aria-hidden="true">⭐</span>
                <span class="rating">${randomResto.note || 'N/A'}</span>
                <span class="dot">·</span>
                <span>${randomResto.distance || '0 km'}</span>
              </div>
              <p class="card-price">${randomResto.prix || 'Menu à venir'}</p>
              <span class="card-btn">Voir le menu</span>
            </div>
          </a>
        `;

        // On arrête le shaker et on montre le résultat
        circle.classList.remove("is-rolling");
        resultEl.classList.add("is-visible");
        
        // On remet le bouton en état normal (le dé arrête de tourner)
        btnLaunch.disabled = false;
        btnLaunch.innerHTML = "<span class='btn-surprise-dice' aria-hidden='true'>🎲</span><span>Relancer le dé</span>";

      }, 1500); // 1.5 seconde de suspense
    });
  }
});
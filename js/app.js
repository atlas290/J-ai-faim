// js/app.js
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

let RESTAURANTS = []; 
const gridEl = document.getElementById('restaurants-grid');
const searchEl = document.getElementById('search-input');
const pillsEl = document.getElementById('categories');
const surpriseBtn = document.getElementById('btn-surprise'); 

let state = { searchTerm: "", activeCategory: "Petit déjeuner" };

// --- DÉTECTION DE L'HEURE ---
function getCurrentMealCategory() {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) return "Petit déjeuner";
  if (hour >= 11 && hour < 16) return "Déjeuner";
  return "Dîner"; // 16h à 3h59
}

function renderRestaurants(list) {
  if (!gridEl) return;

  if (list.length === 0) {
    gridEl.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#8a7f76;padding:40px 20px;font-size:15px;">Aucun restaurant ne correspond à votre recherche 😕</p>`;
    return;
  }

  gridEl.innerHTML = list.map(r => {
    const restoUrl = `resto.html?id=${r.id}`;
    const isSponsor = (r.sponsorise === true || r.sponsorise === "true");
    const badge = isSponsor ? `<span class="badge-sponsored">⭐ Sponsorisé</span>` : "";

    let imgUrl = 'https://placehold.co/400x300/f5e6c8/2c2416?text=Resto';
    if (r.image && typeof r.image === 'string' && r.image.trim() !== "" && r.image !== "null") {
      imgUrl = r.image;
    }

    const nomResto = (r.nom && typeof r.nom === 'string') ? r.nom : "Restaurant sans nom";

    return `
      <a href="${restoUrl}" class="restaurant-card" style="position:relative;">
        ${badge}
        <img src="${imgUrl}" alt="${nomResto}" class="card-image" width="400" height="300" loading="lazy">
        <div class="card-body">
          <h3 class="card-title">${nomResto}</h3>
          <div class="card-meta">
            <span class="star">⭐ ${r.note || 'N/A'}</span>
            <span class="dot">·</span>
            <span>${r.distance || '0 km'}</span>
          </div>
          <p class="card-price">${r.prix || 'Prix non défini'}</p>
          <span class="card-btn">Voir le menu</span>
        </div>
      </a>
    `;
  }).join("");
}

function getFilteredRestaurants() {
  const term = state.searchTerm.trim().toLowerCase();
  return RESTAURANTS.filter((r) => {
    const matchCategory = state.activeCategory === "Tous" || r.categorie === state.activeCategory;
    const nom = (r.nom && typeof r.nom === 'string') ? r.nom.toLowerCase() : "";
    const matchSearch = !term || nom.includes(term);
    return matchCategory && matchSearch;
  });
}

function updateActivePills() {
  if (!pillsEl) return;
  pillsEl.querySelectorAll(".category").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.category === state.activeCategory);
  });
}

function refresh() {
  renderRestaurants(getFilteredRestaurants());
  updateActivePills();
}

function bindEvents() {
  if (searchEl) {
    searchEl.addEventListener("input", (e) => {
      state.searchTerm = e.target.value;
      refresh();
    });
  }
  if (pillsEl) {
    pillsEl.addEventListener("click", (e) => {
      const pill = e.target.closest(".category");
      if (!pill) return;
      const cat = pill.dataset.category;
      state.activeCategory = state.activeCategory === cat ? "Tous" : cat;
      refresh();
    });
  }
  if (surpriseBtn) {
    surpriseBtn.addEventListener("click", (e) => {
      e.preventDefault(); 
      if (RESTAURANTS.length === 0) return;
      const random = RESTAURANTS[Math.floor(Math.random() * RESTAURANTS.length)];
      alert(`Notre suggestion du jour : ${random.nom} !`);
    });
  }
}

function chargerDonneesFirebase() {
  if (gridEl) gridEl.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:20px;">Chargement des restaurants...</p>';

  db.collection("restaurants").get()
    .then((querySnapshot) => {
      RESTAURANTS = []; 
      querySnapshot.forEach((doc) => {
        RESTAURANTS.push({ id: doc.id, ...doc.data() });
      });

      RESTAURANTS.sort((a, b) => Number(b.sponsorise === true) - Number(a.sponsorise === true));
      
      // On applique la catégorie en fonction de l'heure au démarrage
      state.activeCategory = getCurrentMealCategory();
      
      refresh();
    })
    .catch((error) => {
      console.error("Erreur Firebase :", error);
      if (gridEl) gridEl.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:red;padding:20px;">Erreur Firebase : ${error.message}</p>`;
    });
}

document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  chargerDonneesFirebase(); 
  
  const splash = document.getElementById('splash-screen');
  const dejaVu = sessionStorage.getItem('splashDejaVu');
  if (splash) {
    if (dejaVu) splash.style.display = 'none';
    else setTimeout(() => { splash.classList.add('hidden'); sessionStorage.setItem('splashDejaVu', 'oui'); }, 1500);
  }
});
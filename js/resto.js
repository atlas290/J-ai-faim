/* ============================================================
   J'ai faim — resto.js (Version finale : Panier + Favoris + Menu)
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

let currentRestaurant = null;
let cart = JSON.parse(localStorage.getItem('jaiFaimCart')) || { items: [] };
let cartBar, cartCountEl, cartTotalEl, menuListEl;

function init() {
  cartBar = document.querySelector(".cart-bar");
  if (cartBar) {
    cartCountEl = cartBar.querySelector(".cart-count");
    cartTotalEl = cartBar.querySelector(".cart-total");
  }

  menuListEl = document.querySelector(".menu-list");
  if (menuListEl) {
    menuListEl.addEventListener("click", (e) => {
      const addBtn = e.target.closest(".menu-item-add");
      const removeBtn = e.target.closest(".menu-item-remove");
      if (addBtn) addItem(addBtn.getAttribute("data-name"), parseInt(addBtn.getAttribute("data-price"), 10) || 0);
      else if (removeBtn) removeItem(removeBtn.getAttribute("data-name"));
    });
  }

  if (cartBar) {
    cartBar.style.cursor = "pointer";
    cartBar.addEventListener("click", () => { window.location.href = "panier.html"; });
  }

  setupFavButtonListener();
  auth.onAuthStateChanged(() => { if (currentRestaurant) refreshFavIcon(); });

  loadRestaurantFromUrl();
  updateCartUI();
}

// --- CHARGEMENT FIREBASE ---
async function loadRestaurantFromUrl() {
  const restoId = new URLSearchParams(window.location.search).get("id");
  if (!restoId) return;

  try {
    const doc = await db.collection("restaurants").doc(restoId).get();
    if (!doc.exists) return;
    
    currentRestaurant = doc.data();
    currentRestaurant.id = restoId;
    updateRestaurantUI(currentRestaurant);
    refreshFavIcon(); // Vérifie si en favori

    const platsSnap = await db.collection("restaurants").doc(restoId).collection("plats").get();
    const plats = platsSnap.docs.map(d => d.data());
    renderMenu(plats, currentRestaurant.menu_url);
  } catch (err) {
    console.error("Erreur Firestore :", err);
  }
}

function updateRestaurantUI(data) {
  const nameEl = document.querySelector(".resto-name");
  if (nameEl) nameEl.textContent = data.nom;
  document.title = `${data.nom} — J'ai faim`;

  const noteEl = document.querySelector(".rating");
  if (noteEl) noteEl.textContent = data.note || "Nouveau";

  const catEl = document.querySelector(".resto-cuisine");
  if (catEl) catEl.textContent = data.categorie || "";

  const distEl = document.querySelector(".resto-distance");
  if (distEl) distEl.textContent = data.distance || "0 km";
}

function renderMenu(plats, menuUrl) {
  if (!menuListEl) return;
  let html = "";

  if (menuUrl) {
    html += `<a href="${menuUrl}" target="_blank" rel="noopener noreferrer" class="menu-external-link"><span>🔗</span> Visiter le site menu</a>`;
  }

  if (plats.length === 0) {
    html += `<p style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">Le menu est en cours de préparation...</${p>`;
  } else {
    plats.forEach(plat => {
      const prixFormplatate = parseInt(plat.prix).toLocaleString('fr-FR');
      const imgUrl = plat.image || 'https://placehold.co/200x200/f5e6c8/2c2416?text=Plat';
      html += `
        <article class="menu-item">
          <img src="${imgUrl}" alt="${plat.nom}" class="menu-item-img" width="200" height="200" loading="lazy">
          <div class="menu-item-body">
            <h3 class="menu-item-name">${plat.nom}</h3>
            <p class="menu-item-desc">.description || ''}</p>
            <p class="menu-item-price">${prixFormate} FCFA</p>
          </div>
          <button class="menu-item-remove" type="button" data-name="${plat.nom}">-</button>
          <button class="menu-item-add" type="button" data-price="${plat.prix}" data-name="${plat.nom}">+</button>
        </article>
      `;
    });
  }
  menuListEl.innerHTML = html;
}

// --- PANIER ---
function saveCart() { localStorage.setItem('jaiFaimCart', JSON.stringify(cart)); }
function addItem(name, price) {
  const existing = cart.items.find((i) => i.name === name);
  if (existing) existing.qty += 1;
  else cart.items.push({ name, price, qty: 1 });
  saveCart(); updateCartUI();
}
function removeItem(name) {
  const existing = cart.items.find((i) => i.name === name);
  if (existing) {
    existing.qty -= 1;
    if (existing.qty <= 0) cart.items = cart.items.filter(i => i.name !== name);
  }
  saveCart(); updateCartUI();
}
function updateCartUI() {
  if (!cartBar || !cartCountEl || !cartTotalEl) return;
  const count = cart.items.reduce((sum, i) => sum + i.qty, 0);
  if (count === 0) cartBar.classList.add("is-hidden");
  else {
    cartBar.classList.remove("is-hidden");
    cartCountEl.textContent = `${count} article${count > 1 ? 's' : ''}`;
    cartTotalEl.textContent = `${cart.items.reduce((sum, i) => sum + i.price * i.qty, 0).toLocaleString("fr-FR")} FCFA`;
  }
}

// --- FAVORIS ---
function setupFavButtonListener() {
  const btn = document.querySelector(".hero-btn.is-fav");
  if (btn) btn.addEventListener("click", handleFavClick);
}

async function handleFavClick() {
  const user = auth.currentUser;
  if (!user) {
    alert("Connectez-vous pour ajouter aux favoris");
    window.location.href = "login-client.html";
    return;
  }
  if (!currentRestaurant || !currentRestaurant.id) return;

  const btn = document.querySelector(".hero-btn.is-fav");
  if (btn) btn.disabled = true;

  try {
    const userRef = db.collection("users").doc(user.uid);
    const userSnap = await userRef.get();
    const favoris = userSnap.exists ? (userSnap.data().favoris || []) : [];
    const isFav = favoris.includes(currentRestaurant.id);

    await userRef.set({ favoris: isFav ? firebase.firestore.FieldValue.arrayRemove(currentRestaurant.id) : firebase.firestore.FieldValue.arrayUnion(currentRestaurant.id) }, { merge: true });
    updateFavIcon(!isFav);
  } catch (err) {
    console.error("Erreur favori :", err);
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function refreshFavIcon() {
  const user = auth.currentUser;
  if (!user || !currentRestaurant || !currentRestaurant.id) {
    updateFavIcon(false); return;
  }
  try {
    const userSnap = await db.collection("users").doc(user.uid).get();
    const favoris = userSnap.exists ? (userSnap.data().favoris || []) : [];
    updateFavIcon(favoris.includes(currentRestaurant.id));
  } catch (err) { updateFavIcon(false); }
}

function updateFavIcon(isFav) {
  const btn = document.querySelector(".hero-btn.is-fav");
  if (!btn) return;
  btn.setAttribute("aria-pressed", isFav ? "true" : "false");
  btn.classList.toggle("is-active", isFav);
}

document.addEventListener("DOMContentLoaded", init);
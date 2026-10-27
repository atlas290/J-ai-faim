/* ============================================================
   J'ai faim — dashboard-resto.js (Version FINALE ET PROPRE)
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

const CLOUDINARY_CLOUD_NAME = "jaifaim-app"; 
const CLOUDINARY_UPLOAD_PRESET = "plats_resto"; 

let currentRestoId = null;
let currentUser = null;
const modal = document.getElementById('add-dish-modal');
const openModalBtn = document.querySelector('.btn-add-dish');
const closeModalBtn = document.querySelector('.modal-close');
const modalForm = document.querySelector('.modal-form');

function openModal() { if (modal) { modal.classList.add('is-open'); document.body.classList.add('modal-open'); } }
function closeModal() { if (modal) { modal.classList.remove('is-open'); document.body.classList.remove('modal-open'); } }

document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "login-resto.html";
      return;
    }
    
    currentUser = user;
    currentRestoId = new URLSearchParams(window.location.search).get("id");

    if (!currentRestoId) {
      const query = await db.collection("restaurants").where("ownerUid", "==", currentUser.uid).limit(1).get();
      if (!query.empty) currentRestoId = query.docs[0].id;
    }

    if (!currentRestoId) {
      alert("Aucun restaurant associé à ce compte.");
      await auth.signOut();
      return;
    }

    const snap = await db.collection("restaurants").doc(currentRestoId).get();
    if (!snap.exists || snap.data().ownerUid !== currentUser.uid) {
      alert("Accès refusé.");
      window.location.href = "index.html";
      return;
    }

    loadRestaurant(snap.data());
    loadDishes();
    
    // Boutons
    if (openModalBtn) openModalBtn.addEventListener('click', openModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (modal) { modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); }); }
    if (modalForm) modalForm.addEventListener('submit', handleAddDish);

    const genBtn = document.getElementById("btn-generate-desc");
    if (genBtn) genBtn.addEventListener("click", genererDescriptionIA);

    const saveBtn = document.querySelector(".btn-save");
    if (saveBtn) {
      saveBtn.addEventListener("click", async () => {
        const input = document.getElementById("menu-url");
        if (!input || !input.value.trim()) return;
        saveBtn.disabled = true; saveBtn.textContent = "Enregistrement...";
        try {
          await db.collection("restaurants").doc(currentRestoId).update({ menu_url: input.value.trim() });
          alert("Lien enregistré ✅");
        } catch (err) { alert("Erreur."); }
        finally { saveBtn.disabled = false; saveBtn.textContent = "Enregistrer"; }
      });
    }

    const logoutBtn = document.querySelector(".btn-logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        await auth.signOut();
        window.location.href = "index.html";
      });
    }
  });
});

function loadRestaurant(data) {
  document.querySelector(".dash-subtitle").textContent = `Bienvenue, ${data.nom}`;
  document.title = `${data.nom} — Dashboard`;
  const accountValues = document.querySelectorAll(".account-value");
  if (accountValues.length >= 2) {
    accountValues[0].textContent = data.whatsapp ? `+${data.whatsapp}` : "—";
    accountValues[1].textContent = data.adresse || "—";
  }
  const menuInput = document.getElementById("menu-url");
  if (menuInput && data.menu_url) menuInput.value = data.menu_url;
}

async function loadDishes() {
  const dishList = document.querySelector(".dish-list");
  if (!dishList) return;
  dishList.innerHTML = '<p style="text-align:center;color:var(--text-muted);">Chargement...</p>';

  try {
    const snapshot = await db.collection("restaurants").doc(currentRestoId).collection("plats").get();
    if (snapshot.empty) {
      dishList.innerHTML = '<p style="text-align:center;color:var(--text-muted);">Aucun plat. Ajoutez-en un !</p>';
      return;
    }
    dishList.innerHTML = snapshot.docs.map(doc => {
      const plat = doc.data();
      return `
        <article class="dish-item">
          <img src="${plat.image || 'https://placehold.co/200x200/f5e6c8/2c2416?text=Plat'}" alt="${plat.nom}" class="dish-img">
          <div class="dish-body">
            <h3 class="dish-name">${plat.nom}</h3>
            <p class="dish-price">${parseInt(plat.prix).toLocaleString('fr-FR')} FCFA</p>
          </div>
          <div class="dish-actions">
            <button type="button" class="btn-icon" onclick="deleteDish('${doc.id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </article>
      `;
    }).join('');
  } catch (err) { dishList.innerHTML = '<p style="color:red;text-align:center;">Erreur.</p>'; }
}

// --- AJOUTER UN PLAT (Le bouton qui marchait avant) ---
async function handleAddDish(e) {
  e.preventDefault();
  const nom = document.getElementById("dish-name").value.trim();
  const prix = document.getElementById("dish-price").value.trim();
  const description = document.getElementById("dish-description").value.trim();
  const file = document.getElementById("dish-image").files[0];

  if (!nom || !prix) return alert("Remplissez le nom et le prix.");

  const submitBtn = modalForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Ajout en cours...";

  try {
    let imageUrl = "";
    if (file) {
      submitBtn.textContent = "Envoi photo...";
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Erreur Cloudinary");
      imageUrl = data.secure_url;
    }

    submitBtn.textContent = "Enregistrement...";
    await db.collection("restaurants").doc(currentRestoId).collection("plats").add({
      nom, prix, description, image: imageUrl,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("Plat ajouté !");
    modalForm.reset();
    closeModal();
    loadDishes();
  } catch (err) {
    alert("Erreur : " + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Ajouter au menu";
  }
}

// --- GÉNÉRATEUR IA (Avec le bon header pour les clés AQ.) ---
async function genererDescriptionIA() {
  const nameInput = document.getElementById("dish-name");
  const descTextarea = document.getElementById("dish-description");
  const generateBtn = document.getElementById("btn-generate-desc");

  if (!nameInput || !descTextarea || !generateBtn) return;

  const dishName = nameInput.value.trim();
  if (!dishName) {
    alert("Remplissez d'abord le nom du plat.");
    return;
  }

  const originalText = generateBtn.textContent;
  generateBtn.disabled = true;
  generateBtn.textContent = "Génération...";

  const prompt = `Tu es un rédacteur culinaire. Rédige une description courte (maximum 2 phrases), appétissante et professionnelle en français pour un plat nommé "${dishName}". Ne mets pas de guillemets autour de la réponse.`;
  
  try {
    const proxyUrl = "https://corsproxy.io/?";
    const apiUrl = `https://aiplatform.googleapis.com/v1beta1/publishers/google/models/gemini-3.8-flash:generateContent`;
    const fullUrl = proxyUrl + encodeURIComponent(apiUrl);

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY 
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 150 }
      })
    });

    if (!response.ok) {
      console.error("Erreur Gemini :", response.status);
      alert(`Erreur IA (${response.status}).`);
      return;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text) descTextarea.value = text.trim();
    else alert("L'IA n'a pas pu générer de description.");
  } catch (err) {
    console.error("Erreur réseau Gemini :", err);
    alert("Impossible de contacter l'IA.");
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = originalText;
  }
}

window.deleteDish = async function(idPlat) {
  if (!confirm("Supprimer ce plat ?")) return;
  await db.collection("restaurants").doc(currentRestoId).collection("plats").doc(idPlat).delete();
  loadDishes();
}
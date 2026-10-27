let cart = { items: [] };
try {
  const saved = localStorage.getItem('jaiFaimCart');
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed && Array.isArray(parsed.items)) cart = parsed;
  }
} catch (e) { console.warn("Erreur lecture panier"); }

function saveCart() {
  try { localStorage.setItem('jaiFaimCart', JSON.stringify(cart)); } catch (e) {}
}

const listeEl = document.getElementById('panier-liste');
const footerEl = document.getElementById('panier-footer');
const formEl = document.getElementById('formulaire-livraison');
const totalEl = document.getElementById('panier-total');
const videEl = document.getElementById('panier-vide');

// Éléments du formulaire dynamique
const modeSelect = document.getElementById('mode-recuperation');
const blocAdresse = document.getElementById('bloc-adresse');
const blocTable = document.getElementById('bloc-table');

// --- LOGIQUE D'AFFICHAGE DYNAMIQUE ---
if (modeSelect) {
  modeSelect.addEventListener('change', (e) => {
    const mode = e.target.value;
    if (mode === 'Livraison') {
      blocAdresse.style.display = 'block';
      blocTable.style.display = 'none';
    } else if (mode === 'Sur place') {
      blocAdresse.style.display = 'none';
      blocTable.style.display = 'block';
    } else {
      // À emporter
      blocAdresse.style.display = 'none';
      blocTable.style.display = 'none';
    }
  });
}

function renderPanier() {
  if (cart.items.length === 0) {
    if(listeEl) listeEl.style.display = 'none';
    if(footerEl) footerEl.style.display = 'none';
    if(formEl) formEl.style.display = 'none';
    if(videEl) videEl.style.display = 'block';
    return;
  }

  if(listeEl) listeEl.style.display = 'flex';
  if(footerEl) footerEl.style.display = 'block';
  if(formEl) formEl.style.display = 'block';
  if(videEl) videEl.style.display = 'none';

  if(listeEl) {
    listeEl.innerHTML = cart.items.map(item => `
      <div style="display: flex; justify-content: space-between; align-items: center; background: var(--card); padding: 15px; border-radius: 10px; box-shadow: var(--shadow-card);">
        <div>
          <h3 style="margin: 0; font-size: 16px;">${item.name}</h3>
          <p style="margin: 5px 0 0 0; color: var(--accent); font-weight: bold;">${(item.price * item.qty).toLocaleString('fr-FR')} FCFA</p>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <button onclick="changeQty('${item.name}', -1)" style="width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--accent); background: transparent; color: var(--accent); font-weight: bold;">-</button>
          <span style="font-weight: bold;">${item.qty}</span>
          <button onclick="changeQty('${item.name}', 1)" style="width: 30px; height: 30px; border-radius: 50%; border: none; background: var(--accent); color: white; font-weight: bold;">+</button>
        </div>
      </div>
    `).join('');
  }

  const total = cart.items.reduce((sum, i) => sum + (i.price * i.qty), 0);
  if(totalEl) totalEl.textContent = `${total.toLocaleString('fr-FR')} FCFA`;
}

window.changeQty = function(name, change) {
  const item = cart.items.find(i => i.name === name);
  if (item) {
    item.qty += change;
    if (item.qty <= 0) cart.items = cart.items.filter(i => i.name !== name);
    saveCart();
    renderPanier();
  }
};

document.getElementById('btn-valider').addEventListener('click', () => {
  const nom = document.getElementById('client-nom').value.trim();
  const mode = document.getElementById('mode-recuperation').value;
  const adresse = document.getElementById('client-adresse').value.trim();
  const table = document.getElementById('client-table').value.trim();
  const remarque = document.getElementById('client-remarque').value.trim();

  // Validation intelligente
  if (!nom) {
    alert("Veuillez entrer votre nom pour continuer.");
    return;
  }
  if (mode === "Livraison" && !adresse) {
    alert("Veuillez entrer une adresse pour la livraison.");
    return;
  }
  if (mode === "Sur place" && !table) {
    alert("Veuillez entrer votre numéro de table.");
    return;
  }

  const total = cart.items.reduce((sum, i) => sum + (i.price * i.qty), 0);
  
  let message = `Bonjour, je souhaite commander :\n\n`;
  cart.items.forEach(item => {
    message += `▪️ ${item.qty}x ${item.name} (${(item.price * item.qty)} FCFA)\n`;
  });
  
  message += `\n*Total : ${total.toLocaleString('fr-FR')} FCFA*\n`;
  message += `------------------------\n`;
  message += `👤 *Nom :* ${nom}\n`;
  message += `🛵 *Mode :* ${mode}\n`;
  
  // Message adapté au mode choisi
  if (mode === "Livraison" && adresse) {
    message += `📍 *Adresse :* ${adresse}\n`;
  } else if (mode === "Sur place" && table) {
    message += `🍽️ *Table :* ${table}\n`;
  }
  
  if (remarque) message += `📝 *Remarque :* ${remarque}\n`;

  window.location.href = `https://wa.me/22997000000?text=${encodeURIComponent(message)}`;
});

renderPanier();
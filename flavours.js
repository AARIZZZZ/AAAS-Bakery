/**
 * ─────────────────────────────────────────────
 *  AAAS BAKERY — FLAVOURS MANAGER
 * ─────────────────────────────────────────────
 *  Add / remove / reorder cake flavours here.
 *  They automatically appear in:
 *    1. The "Available Flavours" tag cloud on the custom order section
 *    2. The flavour dropdown in the order form
 *    3. The admin panel (admin.html)
 *
 *  Each flavour object:
 *    name      → displayed name
 *    emoji     → decorative emoji (optional)
 *    available → true = show, false = hide (e.g. seasonal)
 * ─────────────────────────────────────────────
 */

let FLAVOURS = JSON.parse(localStorage.getItem('aaas_flavours') || 'null') || [
  { name: 'Vanilla',        emoji: '🍦', available: true },
  { name: 'Chocolate',      emoji: '🍫', available: true },
  { name: 'Red Velvet',     emoji: '❤️',  available: true },
  { name: 'Butterscotch',   emoji: '🧈', available: true },
  { name: 'Black Forest',   emoji: '🍒', available: true },
  { name: 'Strawberry',     emoji: '🍓', available: true },
  { name: 'Pineapple',      emoji: '🍍', available: true },
  { name: 'Oreo',           emoji: '🍪', available: true },
  { name: 'Lotus Biscoff',  emoji: '🌸', available: true },
  { name: 'Mango',          emoji: '🥭', available: true },
  { name: 'Blueberry',      emoji: '🫐', available: true },
  { name: 'Taro',           emoji: '💜', available: false },
  { name: 'Other (mention below)', emoji: '✏️', available: true }
];

function saveFlavours() {
  localStorage.setItem('aaas_flavours', JSON.stringify(FLAVOURS));
}

function renderFlavourTags() {
  const container = document.getElementById('flavourTagsDisplay');
  if (!container) return;
  const visible = FLAVOURS.filter(f => f.available);
  container.innerHTML = visible.map(f =>
    `<span class="cf-tag">${f.emoji ? f.emoji + ' ' : ''}${f.name}</span>`
  ).join('');
}

function renderFlavourSelect() {
  const sel = document.getElementById('flavourSelect');
  if (!sel) return;
  const visible = FLAVOURS.filter(f => f.available);
  sel.innerHTML = `<option value="" disabled selected>Select flavour</option>` +
    visible.map(f => `<option value="${f.name}">${f.emoji ? f.emoji + ' ' : ''}${f.name}</option>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderFlavourTags();
  renderFlavourSelect();
});

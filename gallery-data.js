/**
 * ─────────────────────────────────────────────
 *  AAAS BAKERY — GALLERY DATA
 * ─────────────────────────────────────────────
 *  To add a photo: add an object to GALLERY_ITEMS.
 *  To remove:      delete the object.
 *  To change order: move the objects around.
 *
 *  Fields:
 *    img      → filename or full URL (Instagram direct link also works)
 *    label    → caption shown in lightbox
 *    category → "birthday" | "anniversary" | "theme" | "special"
 *    span     → grid span class: "g1"–"g8" (controls size in grid, optional)
 *
 *  INSTAGRAM SYNC:
 *    Paste the direct image URL from Instagram (right-click → Copy Image Address)
 *    into the `img` field. The admin panel below auto-fetches new posts.
 * ─────────────────────────────────────────────
 */

/* Load admin-saved gallery if available, else fall back to defaults */
let _GALLERY_DEFAULTS = [
  {
    img: 'WhatsApp_Image_2026-04-03_at_18_21_36__1_.jpeg',
    label: 'Birthday Ombre Cake',
    category: 'birthday',
    span: 'g1'
  },
  {
    img: 'WhatsApp_Image_2026-04-03_at_18_21_36__2_.jpeg',
    label: 'Melody Candy Bouquet',
    category: 'special',
    span: 'g2'
  },
  {
    img: 'WhatsApp_Image_2026-04-03_at_18_21_36.jpeg',
    label: 'Calendar Birthday Cake',
    category: 'birthday',
    span: 'g3'
  },
  {
    img: 'WhatsApp_Image_2026-04-03_at_18_21_37__1_.jpeg',
    label: 'Minion Theme Cake',
    category: 'theme',
    span: 'g4'
  },
  {
    img: 'WhatsApp_Image_2026-04-03_at_18_21_37__2_.jpeg',
    label: 'Lotus & Oreo Cheesecake',
    category: 'special',
    span: 'g5'
  },
  {
    img: 'WhatsApp_Image_2026-04-03_at_18_21_37.jpeg',
    label: 'Anniversary Love Cake',
    category: 'anniversary',
    span: 'g6'
  },
  {
    img: 'WhatsApp_Image_2026-04-03_at_18_21_38__1_.jpeg',
    label: '3D Car Cake',
    category: 'theme',
    span: 'g7'
  },
  {
    img: 'WhatsApp_Image_2026-04-03_at_18_21_38.jpeg',
    label: 'Heart Birthday Cake',
    category: 'birthday',
    span: 'g8'
  }
  /* ── ADD MORE PHOTOS HERE ──
  ,{
    img: 'your_new_photo.jpg',
    label: 'Your Caption Here',
    category: 'birthday',
    span: 'g1'
  }
  */
];

/* Merge with admin-saved gallery */
const _saved = localStorage.getItem('aaas_gallery');
const GALLERY_ITEMS = _saved ? JSON.parse(_saved) : _GALLERY_DEFAULTS;

/* Merge with admin-saved Razorpay config */
(function() {
  const cfg = localStorage.getItem('aaas_rzp_cfg');
  if (cfg && typeof RAZORPAY_CONFIG !== 'undefined') {
    try { Object.assign(RAZORPAY_CONFIG, JSON.parse(cfg)); } catch(e) {}
  }
})();

/* ── Grid span config (size in bento grid) ── */
const SPAN_CLASSES = {
  g1: 'gc1', g2: 'gc2', g3: 'gc3', g4: 'gc4',
  g5: 'gc5', g6: 'gc6', g7: 'gc7', g8: 'gc8'
};

let galleryPage = 0;
const PAGE_SIZE = 8;

function renderGallery(filter = 'all', reset = false) {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  const filtered = filter === 'all'
    ? GALLERY_ITEMS
    : GALLERY_ITEMS.filter(i => i.category === filter);

  if (reset) {
    galleryPage = 0;
    grid.innerHTML = '';
  }

  const start = galleryPage * PAGE_SIZE;
  const slice = filtered.slice(start, start + PAGE_SIZE);

  slice.forEach((item, idx) => {
    const globalIdx = start + idx;
    const spanNum = ((globalIdx % 8) + 1);
    const spanClass = item.span || `g${spanNum}`;
    const gcClass = SPAN_CLASSES[spanClass] || 'gc1';

    const el = document.createElement('div');
    el.className = `gi ${spanClass} ${gcClass}`;
    el.dataset.c = item.category;
    el.innerHTML = `
      <div class="gi-ph" style="background-image:url('${item.img}')"></div>
      <div class="gi-ov"><span class="gi-lb">${item.label}</span></div>
    `;

    /* cursor label */
    el.dataset.cursor = 'View';

    /* lightbox click */
    el.addEventListener('click', () => openLightbox(item.img, item.label));

    /* hover ring */
    el.addEventListener('mouseenter', () => {
      const ring = document.getElementById('crng');
      if (ring) ring.classList.add('hov');
      const lbl = document.getElementById('clbl');
      if (lbl) { lbl.textContent = 'View'; lbl.classList.add('show'); }
    });
    el.addEventListener('mouseleave', () => {
      const ring = document.getElementById('crng');
      if (ring) ring.classList.remove('hov');
      const lbl = document.getElementById('clbl');
      if (lbl) lbl.classList.remove('show');
    });

    grid.appendChild(el);
  });

  galleryPage++;

  /* hide Load More if nothing left */
  const btn = document.getElementById('loadMoreBtn');
  if (btn) {
    btn.style.display = (galleryPage * PAGE_SIZE >= filtered.length) ? 'none' : 'inline-flex';
  }

  /* re-attach intersection observer for reveal */
  grid.querySelectorAll('.gi').forEach(el => revealObserver && revealObserver.observe(el));
}

function loadMoreGallery() {
  const activeTab = document.querySelector('.gtab.act');
  const filter = activeTab ? activeTab.dataset.f : 'all';
  renderGallery(filter, false);
}

/* Tab filter wiring */
document.addEventListener('DOMContentLoaded', () => {
  renderGallery('all', true);

  document.querySelectorAll('.gtab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.gtab').forEach(t => t.classList.remove('act'));
      tab.classList.add('act');
      renderGallery(tab.dataset.f, true);
    });
  });
});

/* Lightbox helper */
function openLightbox(imgSrc, caption) {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  const lbImg = document.getElementById('lb-img');
  if (lbImg) {
    lbImg.style.backgroundImage = `url('${imgSrc}')`;
    lbImg.style.backgroundSize = 'cover';
    lbImg.style.backgroundPosition = 'center';
  }
  const lbCap = document.getElementById('lb-cap');
  if (lbCap) lbCap.textContent = caption || '';
  lb.classList.add('open');
}

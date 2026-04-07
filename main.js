
(function () {
  var fill = document.getElementById('lf');
  var pct  = document.getElementById('lpct');
  var ldr  = document.getElementById('ldr');
  var p = 0;
  function tick() {
    p += Math.random() * 12 + 4;
    if (p > 100) p = 100;
    fill.style.width = p + '%';
    pct.textContent  = Math.floor(p) + '%';
    if (p < 100) {
      setTimeout(tick, 60);
    } else {
      setTimeout(function () {
        ldr.style.opacity = '0';
        ldr.style.pointerEvents = 'none';
        setTimeout(function () { ldr.style.display = 'none'; }, 800);
      }, 400);
    }
  }
  tick();
})();


window.addEventListener('scroll', () => {
  const scrolled = scrollY, maxScroll = document.documentElement.scrollHeight - innerHeight;
  document.getElementById('pb').style.width = (scrolled / maxScroll * 100) + '%';
  document.getElementById('btt').classList.toggle('on', scrolled > 500);
});
document.getElementById('btt').addEventListener('click', () =>
  window.scrollTo({ top: 0, behavior: 'smooth' })
);


const cursorDot   = document.getElementById('cdot');
const cursorRing  = document.getElementById('crng');
const cursorLabel = document.getElementById('clbl');
let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  cursorDot.style.left = mouseX + 'px'; cursorDot.style.top = mouseY + 'px';
  cursorLabel.style.left = (mouseX + 28) + 'px'; cursorLabel.style.top = (mouseY - 8) + 'px';
});
(function animateCursorRing() {
  ringX += (mouseX - ringX) * .1; ringY += (mouseY - ringY) * .1;
  cursorRing.style.left = ringX + 'px'; cursorRing.style.top = ringY + 'px';
  requestAnimationFrame(animateCursorRing);
})();
document.addEventListener('mousedown', () => cursorRing.classList.add('clk'));
document.addEventListener('mouseup',   () => cursorRing.classList.remove('clk'));

document.querySelectorAll('[data-cursor]').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursorRing.classList.add('hov');
    cursorLabel.textContent = el.dataset.cursor;
    cursorLabel.classList.add('show');
  });
  el.addEventListener('mouseleave', () => {
    cursorRing.classList.remove('hov');
    cursorLabel.classList.remove('show');
  });
});
document.querySelectorAll('a,button,.sc,.gi,.gtab').forEach(el => {
  if (!el.dataset.cursor) {
    el.addEventListener('mouseenter', () => cursorRing.classList.add('hov'));
    el.addEventListener('mouseleave', () => cursorRing.classList.remove('hov'));
  }
});


const nav = document.getElementById('nav');
window.addEventListener('scroll', () => nav.classList.toggle('sc', scrollY > 60));


function toggleMobileMenu() {
  const menu = document.getElementById('mob');
  const hamburger = document.getElementById('ham');
  const isOpen = menu.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}
function closeMobileMenu() {
  document.getElementById('mob').classList.remove('open');
  document.getElementById('ham').classList.remove('open');
  document.body.style.overflow = '';
}


const heroParallax = document.getElementById('hpar');
window.addEventListener('scroll', () => {
  if (heroParallax) heroParallax.style.transform = `translateY(${scrollY * .2}px)`;
});


const particleCanvas = document.getElementById('pc');
if (particleCanvas) {
  const ctx = particleCanvas.getContext('2d');
  function resizeCanvas() {
    particleCanvas.width  = particleCanvas.offsetWidth;
    particleCanvas.height = particleCanvas.offsetHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  
  const colors = ['rgba(245,198,216,', 'rgba(224,80,136,', 'rgba(253,232,239,', 'rgba(240,144,176,'];

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x     = Math.random() * particleCanvas.width;
      this.y     = Math.random() * particleCanvas.height;
      this.size  = Math.random() * 2 + .4;
      this.vx    = (Math.random() - .5) * .3;
      this.vy    = -Math.random() * .5 - .12;
      this.life  = 1;
      this.decay = Math.random() * .003 + .001;
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }
    tick() {
      this.x += this.vx; this.y += this.vy; this.life -= this.decay;
      if (this.life <= 0) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color + (Math.random() * .28 + .06).toFixed(2) + ')';
      ctx.globalAlpha = this.life;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  const particles = Array.from({ length: 60 }, () => new Particle());
  (function particleLoop() {
    ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    particles.forEach(p => { p.tick(); p.draw(); });
    requestAnimationFrame(particleLoop);
  })();
}


const revealObserver = new IntersectionObserver(entries =>
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('on'); }),
  { threshold: .1, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('.rv,.rvl,.rvr,.rvs').forEach(el => revealObserver.observe(el));


function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }
function animateCounter(el) {
  const target = +el.dataset.t, suffix = el.dataset.s || '', duration = 1800, startTime = performance.now();
  (function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    el.textContent = Math.floor(easeOutQuart(progress) * target).toLocaleString('en-IN') + suffix;
    if (progress < 1) requestAnimationFrame(step);
  })(performance.now());
}
const counterObserver = new IntersectionObserver(entries =>
  entries.forEach(e => {
    if (e.isIntersecting) { animateCounter(e.target); counterObserver.unobserve(e.target); }
  }), { threshold: .6 }
);
document.querySelectorAll('.cu').forEach(el => counterObserver.observe(el));

─
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const r = btn.getBoundingClientRect();
    btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px,${(e.clientY - r.top - r.height / 2) * .22}px)`;
  });
  btn.addEventListener('mouseleave', () => btn.style.transform = '');
});


document.querySelectorAll('.sc').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    card.style.transform = `perspective(700px) rotateY(${((e.clientX - r.left) / r.width - .5) * 4}deg) rotateX(${-((e.clientY - r.top) / r.height - .5) * 4}deg) translateZ(4px)`;
  });
  card.addEventListener('mouseleave', () => card.style.transform = '');
});


document.querySelectorAll('.gtab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.gtab').forEach(t => t.classList.remove('act'));
    tab.classList.add('act');
    const filter = tab.dataset.f;
    document.querySelectorAll('.gi').forEach(item => {
      const matches = filter === 'all' || item.dataset.c === filter;
      item.style.opacity       = matches ? '1' : '.08';
      item.style.transform     = matches ? '' : 'scale(.97)';
      item.style.pointerEvents = matches ? '' : 'none';
      item.style.transition    = 'opacity .4s,transform .4s';
    });
  });
});


const lightbox = document.getElementById('lightbox');
if (lightbox) {
  document.querySelectorAll('.gi').forEach(item => {
    item.addEventListener('click', () => {
      const bg = item.querySelector('.gi-ph');
      if (bg) {
        document.getElementById('lb-img').style.backgroundImage = bg.style.backgroundImage;
        document.getElementById('lb-img').style.backgroundSize = 'cover';
        document.getElementById('lb-img').style.backgroundPosition = 'center';
      }
      const label = item.querySelector('.gi-lb');
      document.getElementById('lb-cap').textContent = label ? label.textContent : '';
      lightbox.classList.add('open');
    });
  });
  document.getElementById('lb-close').addEventListener('click', () => lightbox.classList.remove('open'));
  lightbox.addEventListener('click', e => { if (e.target === lightbox) lightbox.classList.remove('open'); });
}


const testimonialTrack   = document.getElementById('tt');
const testimonialDots    = document.querySelectorAll('.t-dt');
const testimonialCounter = document.getElementById('tctr');
let currentSlide = 0;
const totalSlides = document.querySelectorAll('.t-sl').length;

function goToSlide(n) {
  currentSlide = ((n % totalSlides) + totalSlides) % totalSlides;
  testimonialTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
  testimonialDots.forEach((d, i) => d.classList.toggle('on', i === currentSlide));
  testimonialCounter.textContent = String(currentSlide + 1).padStart(2, '0');
}
document.getElementById('tprev').addEventListener('click', () => goToSlide(currentSlide - 1));
document.getElementById('tnext').addEventListener('click', () => goToSlide(currentSlide + 1));
testimonialDots.forEach((d, i) => d.addEventListener('click', () => goToSlide(i)));

let touchStartX = 0;
testimonialTrack.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
testimonialTrack.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 50) goToSlide(currentSlide + (dx < 0 ? 1 : -1));
});

let autoSlide = setInterval(() => goToSlide(currentSlide + 1), 5500);
testimonialTrack.addEventListener('mouseenter', () => clearInterval(autoSlide));
testimonialTrack.addEventListener('mouseleave', () => {
  autoSlide = setInterval(() => goToSlide(currentSlide + 1), 5500);
});


const fsubBtn = document.getElementById('fsub');
if (fsubBtn) {
  fsubBtn.addEventListener('click', function () {
    const btn = this;
    btn.querySelector('.ft').style.display = 'none';
    btn.querySelector('.fs').style.display = 'inline';
    btn.disabled = true;
    setTimeout(() => {
      btn.querySelector('.fs').style.display = 'none';
      btn.querySelector('.ft').style.display = 'inline';
      btn.querySelector('.ft').textContent = 'Order Sent 🎂 ✓';
      btn.style.background = 'var(--deep)';
      btn.disabled = false;
      document.getElementById('fok').classList.add('show');
      setTimeout(() => {
        document.getElementById('fok').classList.remove('show');
        btn.querySelector('.ft').textContent = 'Send My Cake Order 🎂';
        btn.style.background = '';
      }, 5500);
    }, 2000);
  });
}


document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + scrollY - 75, behavior: 'smooth' });
    }
  });
});

const marqueeTrack = document.getElementById('mqt');
if (marqueeTrack) {
  marqueeTrack.addEventListener('mouseenter', () => marqueeTrack.style.animationPlayState = 'paused');
  marqueeTrack.addEventListener('mouseleave', () => marqueeTrack.style.animationPlayState = 'running');
}


const heroBadge = document.querySelector('.h-badge');
if (heroBadge) {
  document.addEventListener('mousemove', e => {
    heroBadge.style.transform = `translate(${(e.clientX / innerWidth - .5) * 14}px,${(e.clientY / innerHeight - .5) * 10}px)`;
  });
}


const navLinks = document.querySelectorAll('.n-links a:not(.n-cta)');
document.querySelectorAll('section[id]').forEach(section =>
  new IntersectionObserver(entries =>
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(a => a.style.color = '');
        const active = document.querySelector(`.n-links a[href="#${e.target.id}"]`);
        if (active) active.style.color = 'var(--hot)';
      }
    }), { threshold: .45 }
  ).observe(section)
);


function createHeart() {
  const heart = document.createElement('div');
  heart.innerHTML = '♥';
  heart.style.cssText = `
    position:fixed;
    left:${Math.random() * 100}vw;
    bottom:-30px;
    font-size:${Math.random() * 16 + 10}px;
    color:rgba(224,80,136,${Math.random() * 0.3 + 0.05});
    pointer-events:none;
    z-index:1;
    animation:floatHeart ${Math.random() * 4 + 4}s ease-in forwards;
    cursor:none;
  `;
  document.body.appendChild(heart);
  setTimeout(() => heart.remove(), 8000);
}


const style = document.createElement('style');
style.textContent = `
  @keyframes floatHeart {
    0%   { transform: translateY(0) rotate(0deg); opacity:1; }
    100% { transform: translateY(-100vh) rotate(${Math.random() > .5 ? '' : '-'}${Math.floor(Math.random()*30+10)}deg); opacity:0; }
  }
`;
document.head.appendChild(style);


setInterval(createHeart, 3500);

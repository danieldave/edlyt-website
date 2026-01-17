// Edlyt Academy main interactions

document.addEventListener('DOMContentLoaded', () => {
  // Progress bar
  const progressBar = document.getElementById('progress-bar');
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    progressBar.style.width = pct + '%';
  });

  // Mobile nav toggle
  const toggle = document.getElementById('nav-toggle') || document.getElementById('nav-toggle-legacy');
  const hamburger = document.getElementById('nav-toggle') || document.querySelector('.hamburger');
  const nav = document.querySelector('.main-nav');

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      const expanded = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', String(!expanded));
      if (nav) {
        nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
        nav.style.flexDirection = 'column';
        nav.style.gap = '1rem';
        nav.style.background = 'rgba(255,255,255,0.98)';
        nav.style.padding = '1rem';
      }
    });
  }

  // Reveal on scroll
  const reveals = document.querySelectorAll('.reveal');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(ent => {
      if (ent.isIntersecting) ent.target.classList.add('visible');
    });
  }, {threshold: 0.18});
  reveals.forEach(r => obs.observe(r));

  // Stats counter
  const counters = document.querySelectorAll('.stat .num');
  const counterObs = new IntersectionObserver((entries, o) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (el.dataset.animated) return;
      const target = parseInt(el.getAttribute('data-target') || el.textContent.replace(/\D/g,''), 10) || 0;
      let cur = 0;
      const duration = 1400;
      const step = Math.max(1, Math.floor(target / (duration / 16)));
      const timer = setInterval(() => {
        cur += step;
        if (cur >= target) {
          el.textContent = target.toLocaleString();
          el.dataset.animated = '1';
          clearInterval(timer);
        } else {
          el.textContent = cur.toLocaleString();
        }
      }, 16);
      o.unobserve(el);
    });
  }, {threshold: 0.3});

  counters.forEach(c => counterObs.observe(c));
});

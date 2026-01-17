/* script.js
   Mobile menu toggle, smooth scrolling, scroll-triggered reveals,
   contact form lightweight handler, theme toggle, and small helpers.
*/

/* ---- Helpers ---- */
const qs = (s, root=document) => root.querySelector(s);
const qsa = (s, root=document) => Array.from(root.querySelectorAll(s));

/* ---- DOM elements ---- */
const menuToggle = qs('#menu-toggle');
const mobileNav = qs('#mobile-nav');
const mobileLinks = qsa('.mobile-link');
const navLinks = qsa('.nav-link');
const themeToggle = qs('#theme-toggle');
const themeIcon = qs('#theme-icon');
const body = document.body;
const yearEl = qs('#year');

/* Set year in footer */
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---- Mobile menu ---- */
menuToggle.addEventListener('click', () => {
  const isOpen = mobileNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  mobileNav.setAttribute('aria-hidden', String(!isOpen));
});

mobileLinks.forEach(link => {
  link.addEventListener('click', () => {
    mobileNav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    mobileNav.setAttribute('aria-hidden', 'true');
  });
});

/* ---- Smooth scrolling for all internal links ---- */
function handleSmoothScroll(e) {
  const href = this.getAttribute('href');
  if (!href || !href.startsWith('#')) return;
  e.preventDefault();
  const target = qs(href);
  if (!target) return;
  const top = target.getBoundingClientRect().top + window.scrollY - 68; // account for header
  window.scrollTo({ top, behavior: 'smooth' });
}
[...navLinks, ...mobileLinks, ...qsa('a[href^="#"]')].forEach(a => {
  a.addEventListener('click', handleSmoothScroll);
});

/* ---- Scroll revealed animations using IntersectionObserver ---- */
const revealEls = qsa('.reveal-up, .reveal-fade');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(ent => {
    if (ent.isIntersecting) {
      if (ent.target.classList.contains('reveal-up')) {
        ent.target.classList.add('reveal-up--in');
      } else {
        ent.target.classList.add('reveal-fade--in');
      }
      // optional: unobserve after reveal for performance
      revealObserver.unobserve(ent.target);
    }
  });
}, { root: null, threshold: 0.12 });

revealEls.forEach(el => revealObserver.observe(el));

/* ---- Theme toggle (light/dark) ---- */
const THEME_KEY = 'md_theme_pref';
function applyTheme(theme) {
  if (theme === 'light') {
    body.classList.remove('theme-dark');
    body.classList.add('theme-light');
  } else {
    body.classList.remove('theme-light');
    body.classList.add('theme-dark');
  }
  // update icon color (optional visual)
  themeIcon.style.color = theme === 'light' ? '#0077ff' : '#00e5ff';
}

function getSavedTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || 'dark';
  } catch (e) {
    return 'dark';
  }
}

/* initialize theme */
applyTheme(getSavedTheme());

themeToggle.addEventListener('click', () => {
  const current = body.classList.contains('theme-light') ? 'light' : 'dark';
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
  try { localStorage.setItem(THEME_KEY, next); } catch(e){}
});

/* ---- Contact form handling (mock) ---- */
const form = qs('#contact-form');
const formMsg = qs('#form-msg');
const emailBtn = qs('#email-btn');

if (form) {
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    // Basic validation
    const data = new FormData(form);
    const name = data.get('name')?.trim();
    const email = data.get('email')?.trim();
    const message = data.get('message')?.trim();

    if (!name || !email || !message) {
      formMsg.textContent = 'Please fill in all fields.';
      return;
    }

    // This is a demo: in production you'd POST to your server or serverless endpoint.
    formMsg.textContent = 'Sending...';

    setTimeout(() => {
      form.reset();
      formMsg.textContent = 'Thanks — your message has been sent (demo). I will reply to ' + email + ' soon.';
    }, 900);
  });
}

/* quick mail button - opens mail client */
if (emailBtn) {
  emailBtn.addEventListener('click', () => {
    const subject = encodeURIComponent('Project inquiry — Master Dan Portfolio');
    const body = encodeURIComponent('Hi Master Dan,\n\nI am interested in your services. Please tell me more about your availability.\n\nRegards,\n');
    window.location.href = `mailto:master.dan@example.com?subject=${subject}&body=${body}`;
  });
}

/* small accessibility: close mobile menu with escape */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (mobileNav.classList.contains('open')) {
      mobileNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded','false');
    }
  }
});

/* optionally: close mobile nav when clicking outside */
document.addEventListener('click', (e) => {
  if (!mobileNav.classList.contains('open')) return;
  if (!mobileNav.contains(e.target) && !menuToggle.contains(e.target)) {
    mobileNav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded','false');
  }
});

/* ---- Small progressive enhancement: reduce motion preference ---- */
const media = window.matchMedia('(prefers-reduced-motion: reduce)');
if (media.matches) {
  // disable animations for users who prefer reduced motion
  document.documentElement.style.scrollBehavior = 'auto';
  // remove reveal transitions
  qsa('.reveal-up, .reveal-fade').forEach(el => {
    el.style.transition = 'none';
    el.classList.add('reveal-up--in');
    el.classList.add('reveal-fade--in');
  });
}

/* ---- End of script ---- */

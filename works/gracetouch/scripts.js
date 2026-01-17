// --- 1. Animation on Scroll (Intersection Observer) ---
// Observer now targets ALL elements with the 'fade-in' class.
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        } 
        // We do NOT remove 'visible' on exit, to keep content on screen after viewing.
    });
}, { threshold: 0.15 });

// Apply the observer to all elements tagged for animation
document.querySelectorAll('.fade-in').forEach(element => {
    observer.observe(element);
});


// --- 2. Mobile Menu Toggle FIX ---
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

menuToggle.addEventListener('click', () => {
    // Toggles the class that triggers the CSS transformation (slide-in)
    navLinks.classList.toggle('nav-open');
    // Change icon between Hamburger and Close (X)
    menuToggle.innerHTML = navLinks.classList.contains('nav-open') ? '&times;' : '&#9776;'; 
});

// Hide menu when a link is clicked (for single-page navigation)
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        if (navLinks.classList.contains('nav-open')) {
            navLinks.classList.remove('nav-open');
            menuToggle.innerHTML = '&#9776;';
        }
    });
});


// --- 3. Progress Tracker and Back-to-Top (Unchanged) ---
const progressTracker = document.getElementById('progressTracker');
const backToTopBtn = document.getElementById('backToTopBtn');

window.addEventListener('scroll', () => {
    // Progress Tracker Logic
    const scrollY = window.scrollY;
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (scrollY / totalHeight) * 100;
    progressTracker.style.width = Math.min(100, Math.max(0, progress)) + '%';

    // Back-to-Top Button Logic (show/hide)
    if (scrollY > 600) { 
        backToTopBtn.style.display = 'flex';
    } else {
        backToTopBtn.style.display = 'none';
    }
});

// Back-to-Top Click Handler
backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});


// --- 4. Contact Form Submission (Basic Example) ---
document.getElementById('contactForm').addEventListener('submit', function(event) {
    event.preventDefault();
    alert('Thank you for your request! Your quick quote/order request has been received. We will contact you via email shortly.'); 
    this.reset();
});
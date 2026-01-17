/* =========================
   EDLYT SOLUTIONS – JS
   Day 3: Micro Interactions
========================= */

document.addEventListener("DOMContentLoaded", () => {

  /* ---------- SCROLL REVEAL ---------- */
  const revealElements = document.querySelectorAll(
    ".service-card, .step, .why-list li, section h3, section p"
  );

  const revealOnScroll = () => {
    const triggerPoint = window.innerHeight * 0.85;

    revealElements.forEach(el => {
      const elementTop = el.getBoundingClientRect().top;

      if (elementTop < triggerPoint) {
        el.classList.add("reveal-active");
      }
    });
  };

  window.addEventListener("scroll", revealOnScroll);
  revealOnScroll();

  /* ---------- HEADER SHADOW ON SCROLL ---------- */
  const header = document.querySelector(".site-header");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 20) {
      header.style.boxShadow = "0 10px 30px rgba(0,0,0,0.35)";
    } else {
      header.style.boxShadow = "none";
    }
  });

  /* ---------- BUTTON RIPPLE FEEL ---------- */
  const buttons = document.querySelectorAll(".btn-primary");

  buttons.forEach(btn => {
    btn.addEventListener("mousemove", e => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      btn.style.background = `
        radial-gradient(
          circle at ${x}px ${y}px,
          rgba(255,255,255,0.35),
          rgba(255,255,255,0) 40%
        ),
        linear-gradient(135deg, #38bdf8, #6366f1)
      `;
    });

    btn.addEventListener("mouseleave", () => {
      btn.style.background =
        "linear-gradient(135deg, #38bdf8, #6366f1)";
    });
  });

});
lucide.createIcons();

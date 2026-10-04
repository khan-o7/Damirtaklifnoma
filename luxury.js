// ===========================================================
// LUXURY.JS — faqat vizual bezaklar (scroll-reveal, nav, ripple)
// Bu fayl script.js va i18n.js dagi hech qanday funksiyaga
// tegmaydi, mustaqil ishlaydi. index.html oxiriga
// <script src="luxury.js"></script> sifatida ulanadi.
// ===========================================================

document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------------------------------------
  // 1) SCROLL-REVEAL: [data-reveal] elementlar ko'ringanda
  //    "revealed" klassini qo'shadi (CSS animatsiyani ishga tushiradi)
  // ---------------------------------------------------------
  const revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && revealEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            // Ketma-ket paydo bo'lish effekti (stagger)
            setTimeout(() => entry.target.classList.add("revealed"), i * 60);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    // Fallback: IntersectionObserver yo'q bo'lsa, hammasini darhol ko'rsatish
    revealEls.forEach((el) => el.classList.add("revealed"));
  }

  // ---------------------------------------------------------
  // 2) STICKY NAV: pastga aylantirilganda ko'rinadi,
  //    faol bo'limni belgilaydi
  // ---------------------------------------------------------
  const nav = document.getElementById("luxury-nav");
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = Array.from(navLinks)
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  function onScroll() {
    if (!nav) return;
    const scrollY = window.scrollY;

    // Bosh ekrandan chiqqach nav ko'rinadi
    nav.classList.toggle("visible", scrollY > window.innerHeight * 0.6);
    nav.classList.toggle("scrolled", scrollY > 80);

    // Faol bo'limni aniqlash
    let current = sections[0];
    sections.forEach((sec) => {
      if (sec.getBoundingClientRect().top - 120 <= 0) current = sec;
    });
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${current?.id}`);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Silliq scroll (agar CSS scroll-behavior qo'llab-quvvatlanmasa ham ishlaydi)
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // ---------------------------------------------------------
  // 3) BUTTON RIPPLE EFFEKTI (.btn-primary va .map-link-btn uchun)
  // ---------------------------------------------------------
  document.querySelectorAll(".btn-primary, .map-link-btn").forEach((btn) => {
    btn.style.position = btn.style.position || "relative";
    btn.style.overflow = "hidden";
    btn.addEventListener("click", function (e) {
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement("span");
      const size = Math.max(rect.width, rect.height);
      ripple.style.position = "absolute";
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      ripple.style.borderRadius = "50%";
      ripple.style.background = "rgba(255,255,255,0.45)";
      ripple.style.transform = "scale(0)";
      ripple.style.pointerEvents = "none";
      ripple.style.transition = "transform 0.6s ease, opacity 0.6s ease";
      this.appendChild(ripple);
      requestAnimationFrame(() => {
        ripple.style.transform = "scale(1)";
        ripple.style.opacity = "0";
      });
      setTimeout(() => ripple.remove(), 650);
    });
  });

  // ---------------------------------------------------------
  // 4) HERO MOUSE PARALLAX (nozik effekt, faqat kompyuterda)
  // ---------------------------------------------------------
  const hero = document.querySelector(".hero-frame");
  const heroSection = document.querySelector(".hero");
  if (hero && heroSection && window.matchMedia("(pointer: fine)").matches) {
    heroSection.addEventListener("mousemove", (e) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 8;
      const y = (e.clientY / innerHeight - 0.5) * 8;
      hero.style.transform = `translate(${x}px, ${y}px)`;
    });
    heroSection.addEventListener("mouseleave", () => {
      hero.style.transform = "translate(0, 0)";
    });
  }
});
// Damir & Gulsina — to'y taklifnomasi asosiy skripti

// Bu versiya Google Sheets backend orqali ishlaydi va qo'shimcha ravishda
// tezkor ishlashi uchun va tarmoq muammolarida ham ma'lumot yo'qolmasligi uchun 
// vaqtincha mahalliy xotira (localStorage) imkoniyatiga ega.
//
// Use a same-origin Vercel proxy in production to avoid browser CORS issues.
// In local non-Vercel previews, fall back to the Apps Script URL directly.
const SHEETS_API_URL =
  typeof window !== "undefined" && window.location.hostname.endsWith("vercel.app")
    ? "/api/wishes"
    : "https://script.google.com/macros/s/AKfycbyvszIkUCDx8Qm5MVn1tOz4r60uggpqsoveNl2t1J3AFqjigueoufX4IoHsU4LjlFv4/exec";

const WEDDING_DATE = new Date("2026-11-07T18:00:00+05:00"); // O'zbekiston vaqti

function clearLocalDemoData() {
  if (!SHEETS_API_URL) {
    ["cache_wishes", "cache_stats"].forEach((key) => localStorage.removeItem(key));
  }
}

const remoteDB = {
  async _get(action) {
    try {
      if (!SHEETS_API_URL) throw new Error("SHEETS_API_URL hali sozlanmagan");
      const res = await fetch(`${SHEETS_API_URL}?action=${action}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        mode: "cors",
        cache: "no-store",
      });
      if (!res.ok) throw new Error("fetch failed: " + action);
      const data = await res.json();
      if (Array.isArray(data)) {
        localStorage.setItem(`cache_${action}`, JSON.stringify(data));
      } else if (data && typeof data === "object") {
        localStorage.setItem(`cache_${action}`, JSON.stringify(data));
      }
      return data;
    } catch (err) {
      if (!SHEETS_API_URL) {
        return [];
      }
      const cached = localStorage.getItem(`cache_${action}`);
      if (cached) return JSON.parse(cached);
      throw err;
    }
  },
  async _post(payload) {
    try {
      if (!SHEETS_API_URL) throw new Error("SHEETS_API_URL hali sozlanmagan");
      const res = await fetch(SHEETS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        mode: "cors",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("post failed");
      return res.json();
    } catch (err) {
      // Local fallback for offline/delayed network
      if (payload.type === "wish") {
        const wishes = JSON.parse(localStorage.getItem("cache_wishes") || "[]");
        wishes.unshift({ ism: payload.ism, xabar: payload.xabar, vaqt: new Date().toISOString() });
        localStorage.setItem("cache_wishes", JSON.stringify(wishes));
      }
      return { ok: true, offline: true };
    }
  },

  async listWishes() {
    return this._get("wishes");
  },
  async addWish({ ism, xabar }) {
    return this._post({ type: "wish", ism, xabar });
  },

};

// ---------------------------------------------------------------------------
// 1) QULF EKRANINI OCHISH
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const lockScreen = document.getElementById("lock-screen");
  const lockBtn = document.getElementById("lock-btn");
  const main = document.getElementById("main");

  lockBtn.addEventListener("click", () => {
    lockBtn.classList.add("unlocked");
    lockScreen.classList.add("opening");
    main.classList.remove("hidden");
    document.body.style.overflow = "auto";
    setTimeout(() => {
      lockScreen.style.display = "none";
    }, 1500);
  });

  document.body.style.overflow = "hidden";

  // Magnetic Hover Effect for Lock Button
  if (lockBtn) {
    lockBtn.addEventListener("mousemove", (e) => {
      const rect = lockBtn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      lockBtn.style.transform = `translate(${x * 0.4}px, ${y * 0.4}px) scale(1.1)`;
    });
    lockBtn.addEventListener("mouseleave", () => {
      lockBtn.style.transform = "translate(0px, 0px) scale(1)";
    });
  }

  // Parallax Leaves effect on scroll
  const pl1 = document.getElementById("pl-1");
  const pl2 = document.getElementById("pl-2");
  window.addEventListener("scroll", () => {
    const scrolled = window.scrollY;
    if (pl1) pl1.style.transform = `translateY(${scrolled * -0.15}px) rotate(45deg)`;
    if (pl2) pl2.style.transform = `translateY(${scrolled * -0.08}px) rotate(-30deg)`;
  });


  clearLocalDemoData();
  buildCalendar();
  startCountdown();
  loadWishes();

  document.getElementById("wish-form").addEventListener("submit", handleWishSubmit);
});

// ---------------------------------------------------------------------------
// 2) SANOQ TAYMER
// ---------------------------------------------------------------------------
function startCountdown() {
  function tick() {
    const now = new Date();
    let diff = WEDDING_DATE.getTime() - now.getTime();
    if (diff < 0) diff = 0;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    document.getElementById("cd-days").textContent = String(days).padStart(2, "0");
    document.getElementById("cd-hours").textContent = String(hours).padStart(2, "0");
    document.getElementById("cd-min").textContent = String(mins).padStart(2, "0");
    document.getElementById("cd-sec").textContent = String(secs).padStart(2, "0");
  }
  tick();
  setInterval(tick, 1000);
}

// ---------------------------------------------------------------------------
// 3) KALENDAR (2026-yil iyul, 11-sana belgilangan)
// ---------------------------------------------------------------------------
function buildCalendar() {
  const grid = document.getElementById("calendar-grid");
  if (!grid) return;
  const year = WEDDING_DATE.getFullYear();
  const month = WEDDING_DATE.getMonth();
  const weddingDay = WEDDING_DATE.getDate();

  const dowLabels = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];
  dowLabels.forEach((d) => {
    const el = document.createElement("div");
    el.className = "cal-dow";
    el.textContent = d;
    grid.appendChild(el);
  });

  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < startOffset; i++) {
    const empty = document.createElement("div");
    empty.className = "cal-day empty";
    grid.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement("div");
    cell.className = "cal-day" + (d === weddingDay ? " wedding-day" : "");
    if (d === weddingDay) {
      cell.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
    } else {
      cell.textContent = String(d);
    }
    grid.appendChild(cell);
  }
}

// ---------------------------------------------------------------------------
// 4) TILAKLAR DAFTARI
// ---------------------------------------------------------------------------
async function loadWishes() {
  const list = document.getElementById("wishes-list");
  try {
    const wishes = await remoteDB.listWishes();
    renderWishes(wishes);
  } catch (err) {
    list.innerHTML = `<p class="wishes-empty">Hozircha tilaklar yo'q. Birinchi bo'lib tilak qoldiring!</p>`;
  }
}

function renderWishes(wishes) {
  const list = document.getElementById("wishes-list");
  if (!wishes || wishes.length === 0) {
    list.innerHTML = `<p class="wishes-empty">Hozircha tilaklar yo'q. Birinchi bo'lib tilak qoldiring!</p>`;
    return;
  }
  list.innerHTML = wishes
    .map((w) => {
      const date = new Date(w.vaqt);
      const timeStr = date.toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
      return `
        <article class="wish-card">
          <div class="wish-header">
            <div class="wish-name">${escapeHtml(w.ism)}</div>
            <span class="wish-time">${timeStr}</span>
          </div>
          <div class="wish-message">${escapeHtml(w.xabar)}</div>
        </article>`;
    })
    .join("");
}

async function handleWishSubmit(e) {
  e.preventDefault();
  const nameEl = document.getElementById("wish-name");
  const msgEl = document.getElementById("wish-message");
  const statusEl = document.getElementById("wish-status");
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.uz;

  statusEl.textContent = "...";
  statusEl.classList.remove("error");

  try {
    await remoteDB.addWish({ ism: nameEl.value, xabar: msgEl.value });
    statusEl.textContent = dict.wish_sent;
    nameEl.value = "";
    msgEl.value = "";
    loadWishes();
  } catch (err) {
    statusEl.textContent = dict.form_error;
    statusEl.classList.add("error");
  }
}

// ---------------------------------------------------------------------------
// Yordamchi funksiya: HTML-injection oldini olish
// ---------------------------------------------------------------------------
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// ===========================================================
// MUSIQA BOSHQARUVI
// ===========================================================
document.addEventListener("DOMContentLoaded", () => {
  const music = document.getElementById("bg-music");
  const musicBtn = document.getElementById("music-toggle");

  if (!music || !musicBtn) return;

    // Force browser to fetch the latest audio file instead of stale cached version.
    const musicUrl = `assets/audio/music.mp3?v=${Date.now()}`;
    if (music.getAttribute("src") !== musicUrl) {
      music.setAttribute("src", musicUrl);
      music.load();
    }

    // Taklifnoma ochilganda musiqani avtomatik ishga tushirish (sahifaga kirish bilan)
    const attemptPlayMusic = () => {
      music.volume = 0.6;
      music.play().then(() => {
        musicBtn.classList.add("playing");
        musicBtn.classList.remove("paused");
        // Muvaffaqiyatli chalinsa, event listenerlarni o'chiramiz
        document.removeEventListener("click", attemptPlayMusic);
        document.removeEventListener("touchstart", attemptPlayMusic);
      }).catch(() => {
        // Brauzer avtomatik ijroni bloklasa, jim turamiz
        musicBtn.classList.remove("playing");
        musicBtn.classList.add("paused");
      });
    };

    // Darhol urinib ko'ramiz
    attemptPlayMusic();

    // Agar brauzer bloklasa, foydalanuvchining ilk harakatida ijro etamiz
    document.addEventListener("click", attemptPlayMusic, { once: true });
    document.addEventListener("touchstart", attemptPlayMusic, { once: true });

  // Tugma orqali qo'lda yoqish/o'chirish
  musicBtn.addEventListener("click", () => {
    if (music.paused) {
      music.play().catch(() => {});
      musicBtn.classList.add("playing");
      musicBtn.classList.remove("paused");
    } else {
      music.pause();
      musicBtn.classList.remove("playing");
      musicBtn.classList.add("paused");
    }
  });
});

// ==========================================
// PARALLAX EFFECT FOR BRANCHES
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const branches = document.querySelectorAll('.decor-branch');
  
  // Store initial transforms
  branches.forEach(branch => {
    const style = window.getComputedStyle(branch);
    branch.dataset.initialTransform = style.transform !== 'none' ? style.transform : '';
  });
  
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    
    branches.forEach(branch => {
      const speed = parseFloat(branch.getAttribute('data-parallax') || 0);
      const yPos = scrollY * speed;
      const initial = branch.dataset.initialTransform;
      
      branch.style.transform = `translateY(${yPos}px) ${initial}`;
    });
  });
});


// Robust Preloader
document.addEventListener("DOMContentLoaded", () => {
  const preloader = document.getElementById("preloader");
  if (preloader) {
    setTimeout(() => {
      preloader.classList.add("hidden");
    }, 150);
  }
});

// --- Petals Animation ---
function createPetals() {
  const container = document.getElementById("petals-container");
  if (!container) return;
  const maxPetals = 30;
  for (let i = 0; i < maxPetals; i++) {
    setTimeout(() => {
      const petal = document.createElement("div");
      petal.classList.add("petal");
      petal.style.left = Math.random() * 100 + "vw";
      petal.style.width = (Math.random() * 8 + 6) + "px";
      petal.style.height = (Math.random() * 8 + 6) + "px";
      petal.style.animationDuration = (Math.random() * 5 + 7) + "s";
      petal.style.animationDelay = (Math.random() * 5) + "s";
      petal.style.filter = "blur(" + (Math.random() * 2) + "px)";
      container.appendChild(petal);
    }, i * 300);
  }
}
createPetals();

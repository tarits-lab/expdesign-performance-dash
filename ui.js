(function (global) {
  "use strict";

  /* =========================================================
     Helper Format & Render
     ========================================================= */
  const fmtPct = (x, d = 2) => Number.isFinite(x) ? (x * 100).toFixed(d) + "%" : "—";
  const fmtNum = (x) => Number.isFinite(x) ? x.toLocaleString("id-ID") : "—";
  const fmtP   = (x) => Number.isFinite(x) ? x.toFixed(4) : "—";

  function setError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg || "";
  }

  function renderResult(id, rows, verdict) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML =
      "<dl>" +
      rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("") +
      "</dl>" +
      (verdict ? `<div class="verdict">${verdict}</div>` : "");
  }

  function initTabs(root = document) {
    root.querySelectorAll(".tab").forEach(btn => {
      btn.addEventListener("click", () => {
        const nav = btn.closest(".tabs");
        nav.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
        root.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        const target = document.getElementById(btn.dataset.tab);
        if (target) target.classList.add("active");
      });
    });
  }

  /* =========================================================
     Theme Logic (Dark / Light Mode)
     ========================================================= */
  function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.textContent = savedTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
      toggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        toggleBtn.textContent = next === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
      });
    }
  }

  /* =========================================================
     Mobile Menu Logic (Buka-Tutup Sidebar)
     ========================================================= */
  function initMobileMenu() {
    const toggleBtn = document.getElementById('menu-toggle');
    const closeBtn = document.getElementById('menu-close');
    const nav = document.getElementById('site-nav');
    const overlay = document.getElementById('nav-overlay');

    if (!toggleBtn || !nav) return;

    const openMenu = () => {
      nav.classList.add('active');
      if (overlay) overlay.classList.add('active');
    };

    const closeMenu = () => {
      nav.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
    };

    toggleBtn.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);

    // Tutup menu otomatis saat link diklik
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }

  /* =========================================================
     Inisialisasi
     ========================================================= */
  initTheme();
  initMobileMenu();

  // ... kode sebelumnya ...

  function showToast(message) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    
    toast.innerHTML = `
      <button class="toast-close" aria-label="Close">×</button>
      <div class="toast-message">${message}</div>
    `;

    container.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close');
    const removeToast = () => {
      toast.classList.add('removing');
      toast.addEventListener('animationend', () => toast.remove());
    };

    closeBtn.addEventListener('click', removeToast);
    
    // Auto close setelah 4 detik
    setTimeout(() => {
      if (document.body.contains(toast)) {
        removeToast();
      }
    }, 4000);
  }

  // Ekspos showToast ke global window
  global.UI = { fmtPct, fmtNum, fmtP, setError, renderResult, initTabs, showToast };

})(window);
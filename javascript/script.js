/* ==========================================================================
   WellSphere — Master JavaScript
   Every feature is initialised defensively (checks the element exists first)
   so this single file can be shared safely across all pages.
   --------------------------------------------------------------------------
   INDEX
   1.  Helpers + Toast
   2.  Theme (dark/light) toggle  — persisted
   3.  Navigation (mobile menu, dropdowns, active link, scroll effects)
   4.  Scroll reveal + progress + back-to-top + count-up stats
   5.  Testimonial / image carousel
   6.  FAQ accordion
   7.  Countdown timers
   8.  Form validation (membership + contact + newsletter)
   9.  Fitness workout generator
   10. Mood tracker
   11. Wellness quiz
   12. Health calculators (BMI / Water / Calorie)
   13. Daily challenge generator
   14. Wellness dashboard + gamification (localStorage)
   15. Gallery filter + lightbox
   16. Misc (year, smooth anchor)
   ========================================================================== */
(function () {
  "use strict";
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };

  /* ------------------------------------------------------------------------
     EMAILJS — every form emails the admin AND auto-replies to the visitor.
     Fill in the four values below from your EmailJS dashboard
     (https://dashboard.emailjs.com). While they still say "YOUR_…", forms
     keep working in demo mode (success toast only, no email is sent).
     ------------------------------------------------------------------------ */
  const EMAILJS = {
    publicKey:       "k3as1Btku8I62N2A4",        // Account → General → Public Key
    serviceId:       "service_6u36evk",          // Email Services → Service ID
    adminTemplateId: "template_0orpan1",         // template that emails the admin
    userTemplateId:  "template_db5dr5j",         // template that auto-replies to the visitor
    adminEmail:      "ektaroyy2580@gmail.com"
  };
  const notPlaceholder = v => v && !/^YOUR_/.test(v);
  function emailConfigured() {
    return typeof window.emailjs !== "undefined" &&
      notPlaceholder(EMAILJS.publicKey) && notPlaceholder(EMAILJS.serviceId) && notPlaceholder(EMAILJS.adminTemplateId);
  }
  function initEmail() {
    if (typeof window.emailjs !== "undefined" && notPlaceholder(EMAILJS.publicKey)) {
      try { window.emailjs.init({ publicKey: EMAILJS.publicKey }); } catch (e) {}
    }
  }
  // Pull name / email / a readable summary out of any form without needing name="" attrs
  function collectForm(form) {
    const data = { name: "", email: "", pairs: [] };
    $$(".field", form).forEach(f => {
      const input = f.querySelector("input,select,textarea");
      if (!input) return;
      const labelEl = f.querySelector("label");
      const label = (labelEl ? labelEl.textContent : (input.placeholder || "Field")).replace(/\*/g, "").trim();
      if (input.type === "checkbox") { data.pairs.push([label, input.checked ? "Yes" : "No"]); return; }
      const val = (input.value || "").trim();
      if (!val) return;
      data.pairs.push([label, val]);
      if (input.type === "email" && !data.email) data.email = val;
      if (/name/.test(input.dataset.validate || "") && !data.name) data.name = val;
    });
    data.message = data.pairs.map(([k, v]) => `${k}: ${v}`).join("\n");
    return data;
  }
  function formTypeFor(form) {
    if (form.matches("[data-newsletter]")) return "Newsletter signup";
    const m = (form.dataset.successMsg || "").toLowerCase();
    if (m.includes("regist")) return "Event registration";
    if (m.includes("welcome")) return "Membership application";
    if (m.includes("repl") || m.includes("help")) return "Contact enquiry";
    return "Website enquiry";
  }
  // Sends one email to the admin and, when we have the visitor's address, an auto-reply to them.
  function sendFormEmails(type, data) {
    if (!emailConfigured()) return Promise.resolve("skipped");
    const params = {
      form_type: type,
      name: data.name || "Website visitor",
      email: data.email || "",
      reply_to: data.email || EMAILJS.adminEmail,
      message: data.message || "",
      admin_email: EMAILJS.adminEmail
    };
    const jobs = [
      window.emailjs.send(EMAILJS.serviceId, EMAILJS.adminTemplateId, Object.assign({}, params, { to_email: EMAILJS.adminEmail }))
    ];
    if (data.email && notPlaceholder(EMAILJS.userTemplateId)) {
      jobs.push(window.emailjs.send(EMAILJS.serviceId, EMAILJS.userTemplateId, Object.assign({}, params, { to_email: data.email })));
    }
    return Promise.all(jobs).then(() => "sent").catch(err => {
      const detail = (err && (err.text || err.message)) || JSON.stringify(err);
      console.error("EmailJS error " + (err && err.status) + ": " + detail, err);
      window.__wsLastEmailError = err;   // inspect in console after a failed submit
      return "error";
    });
  }

  /* 0. SVG ICON SYSTEM ----------------------------------------------------- */
  /* Clean, single-weight line icons drawn with currentColor so they inherit
     text colour and scale with font-size. Replaces all decorative emoji. */
  const ICON_PATHS = {
    run: '<circle cx="14" cy="5" r="1.9" fill="currentColor" stroke="none"/><path d="M12.5 8.5 9 11l-3.5.5M12.5 8.5l3 2 3 .5M12.5 8.5 11 14l3 2 .5 4M11 14l-3.5 1L6 20"/>',
    meditation: '<circle cx="12" cy="5.5" r="2"/><path d="M12 8.5c2 1.5 3 3.5 3 6M12 8.5c-2 1.5-3 3.5-3 6M4 18c2.5-2 5-3 8-3s5.5 1 8 3M6 16.5l6-1.5 6 1.5"/>',
    salad: '<path d="M3.5 11h17a8.5 8.5 0 0 1-17 0Z"/><path d="M12 11c-1-2.5.5-5 3-6M12 11c0-2.5-2-4-4.5-4.5M12 11c1-2 3.5-2.5 5.5-1.5"/>',
    book: '<path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5Z"/><path d="M12 6.5v13"/>',
    pencil: '<path d="M4 20l1.2-4.2L15.5 5.5l3 3L8.2 18.8 4 20Z"/><path d="M13.5 7.5l3 3"/>',
    camera: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><circle cx="12" cy="13.5" r="3.4"/><path d="M8.5 7 10 4.5h4L15.5 7"/>',
    instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1.1" fill="currentColor" stroke="none"/>',
    twitter: '<path d="M4.5 4h3.3l4 5.4L16.6 4H20l-6 7.2L20.5 20h-3.3l-4.4-6L7.6 20H4l6.4-7.7Z" fill="currentColor" stroke="none"/>',
    facebook: '<path d="M14 8.5V7c0-.8.4-1.1 1.1-1.1H16.6V3H14C11.9 3 10.5 4.4 10.5 6.6V8.5H8.5v3h2V21H14v-9.5h2.2l.4-3Z" fill="currentColor" stroke="none"/>',
    linkedin: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M7.5 10.5V16.5M7.5 7.6v.01M11.2 16.5v-3.3c0-1.9 3.3-2.1 3.3.2v3.1"/><circle cx="7.5" cy="7.6" r="0.5" fill="currentColor" stroke="none"/>',
    youtube: '<rect x="3" y="6" width="18" height="12" rx="3.5"/><path d="M10.5 9.5l4.5 2.5-4.5 2.5Z" fill="currentColor" stroke="none"/>',
    heart: '<path d="M12 20.5S3.5 15 3.5 8.8A4.3 4.3 0 0 1 12 6a4.3 4.3 0 0 1 8.5 2.8C20.5 15 12 20.5 12 20.5Z" fill="currentColor" stroke="none"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.3 9.4a2.8 2.8 0 0 1 5.4 1c0 1.9-2.7 2-2.7 3.6"/><circle cx="12" cy="17" r="0.7" fill="currentColor" stroke="none"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M4 7l8 6 8-6"/>',
    celebrate: '<path d="M4 20l4.8-12.5 7.7 7.7L4 20Z"/><path d="M4 20l7.3-2.2M8.8 7.5l7.7 7.7"/><path d="M15 4v2.4M18.5 7.5H21M16.8 10.6 18.5 9"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3"/>',
    water: '<path d="M12 3.2s6 6.3 6 10.3A6 6 0 1 1 6 13.5C6 9.5 12 3.2 12 3.2Z" fill="currentColor" stroke="none"/>',
    walk: '<circle cx="13" cy="4.5" r="1.8" fill="currentColor" stroke="none"/><path d="M13 7.5l-1.5 4 2 2 1.5 5M11.5 11.5l-3 1.5-1 3M13.5 13.5l2.5 1.5"/>',
    leaf: '<path d="M4.5 19.5c0-8 6-13.5 15.5-14.5.5 10-5.5 15.5-15.5 14.5Z"/><path d="M5 19C9 14 12.5 11 17 9"/>',
    flame: '<path d="M12 2.5C9.5 5.5 7 8 7 12a5 5 0 0 0 10 0c0-2-1-3.6-2.2-5-.6 1.4-1.8 1.6-1.8-.2 0-1.6-.4-3-1-4.3Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.2 2"/>',
    download: '<path d="M12 3v11M8 10.5l4 4 4-4M4.5 19.5h15"/>',
    check: '<path d="M20 6.5 9.5 17.5 4 12"/>',
    sleep: '<path d="M19.5 13.8A7.2 7.2 0 0 1 10.2 4.5 7.2 7.2 0 1 0 19.5 13.8Z"/><path d="M14.5 4h4l-4 4.2h4"/>',
    warning: '<path d="M12 3.5l9.2 16H2.8L12 3.5Z"/><path d="M12 10v4.2M12 17.6v.01"/>',
    dumbbell: '<path d="M4 9v6M6.5 8v8M17.5 8v8M20 9v6M6.5 12h11"/>',
    bolt: '<path d="M13 2L4 14h6l-1 8 9-12h-6l1-8Z" fill="currentColor" stroke="none"/>',
    star: '<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 18.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9L12 2.5Z" fill="currentColor" stroke="none"/>',
    video: '<rect x="3" y="6" width="12.5" height="12" rx="2"/><path d="M15.5 10l5.5-3v10l-5.5-3z"/>',
    money: '<circle cx="12" cy="12" r="9"/><path d="M12 6.8v10.4M14.6 9.2C13.9 8.4 13 8 12 8c-1.5 0-2.6.9-2.6 2s1 1.8 2.6 2 2.6.9 2.6 2-1.1 2-2.6 2c-1 0-1.9-.4-2.6-1.2"/>',
    chart: '<path d="M4 20V4M4 20h16M8 20v-6M12 20v-9M16 20v-4"/>',
    shuffle: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.1" fill="currentColor" stroke="none"/><circle cx="9" cy="15" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.1" fill="currentColor" stroke="none"/>',
    cooking: '<circle cx="11" cy="13" r="6"/><path d="M17 13h4.5"/>',
    "mood-happy": '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="0.9" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="0.9" fill="currentColor" stroke="none"/><path d="M8 14a4 4 0 0 0 8 0"/>',
    "mood-calm": '<circle cx="12" cy="12" r="9"/><path d="M7.8 10.2c.7-.6 1.7-.6 2.4 0M13.8 10.2c.7-.6 1.7-.6 2.4 0M8.5 14.5c1.6 1 5.4 1 7 0"/>',
    "mood-neutral": '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="0.9" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="0.9" fill="currentColor" stroke="none"/><path d="M9 15h6"/>',
    "mood-sad": '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="0.9" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="0.9" fill="currentColor" stroke="none"/><path d="M8 15.5a4 4 0 0 1 8 0"/>',
    "phone-off": '<path d="M6 3.5h3.5L11 7.5 9 8.8a11 11 0 0 0 5 5l1.3-2 4 1.5v3.7c0 1-.9 1.8-1.9 1.7C11 20 4 12.9 3.3 5.4 3.2 4.4 4 3.5 5 3.5Z"/><path d="M3 3l18 18"/>',
    phone: '<path d="M6 3.5h3.5L11 7.5 9 8.8a11 11 0 0 0 5 5l1.3-2 4 1.5v3.7c0 1-.9 1.8-1.9 1.7C11 20 4 12.9 3.3 5.4 3.2 4.4 4 3.5 5 3.5Z"/>',
    trophy: '<path d="M8 4h8v4.5a4 4 0 0 1-8 0V4Z"/><path d="M8 5H5v1.8a3 3 0 0 0 3 3M16 5h3v1.8a3 3 0 0 1-3 3M10 15.5h4M8.5 20h7M12 15.5v-2.5"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-13.7-4.5L4 9M4 9V4M4 9h5M4 13a8 8 0 0 0 13.7 4.5L20 15M20 15v5M20 15h-5"/>',
    balance: '<path d="M12 3.5v16M6 20h12M6 6l12-1.5M6 6l-3 6a3 3 0 0 0 6 0L6 6ZM18 4.5l-3 6a3 3 0 0 0 6 0l-3-6Z"/>',
    handshake: '<path d="M12 6.5 9.5 5 3 8.5v6l3 1M12 6.5l2.5-1.5L21 8.5v6l-3 1M6 15.5l3 2.5 2-1.8 2.5 2 2.5-2.2M9 12l2 2"/>',
    chat: '<path d="M4 5.5h16v10H9.5L5 19v-3.5H4V5.5Z"/><path d="M8 10h8M8 12.5h5"/>',
    brain: '<path d="M9.5 4.2A2.6 2.6 0 0 0 6.4 6.6 2.8 2.8 0 0 0 5 12a2.8 2.8 0 0 0 2 4.4A2.4 2.4 0 0 0 11.5 17V5.5A2.4 2.4 0 0 0 9.5 4.2Z"/><path d="M14.5 4.2A2.6 2.6 0 0 1 17.6 6.6 2.8 2.8 0 0 1 19 12a2.8 2.8 0 0 1-2 4.4A2.4 2.4 0 0 1 12.5 17"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.6 8.4 13 13l-4.6 2.6L11 11l4.6-2.6Z" fill="currentColor" stroke="none"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none"/>',
    vision: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" fill="currentColor" stroke="none"/><path d="M18.5 4v3M20 5.5h-3"/>',
    bulb: '<path d="M9.5 17.5h5M10.5 20.5h3M8.6 14.5a5 5 0 1 1 6.8 0c-.8.7-1.4 1.4-1.4 2.5h-4c0-1.1-.6-1.8-1.4-2.5Z"/>',
    gift: '<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M4 13h16M12 9v11M8.5 9C6 9 6 5.5 8.5 5.5 10.7 5.5 12 9 12 9s1.3-3.5 3.5-3.5C18 5.5 18 9 15.5 9"/>',
    breath: '<path d="M3 8h9a2.5 2.5 0 1 0-2.5-2.6M3 12h13a3 3 0 1 1-3 3M3 16h8a2.2 2.2 0 1 1-2.2 2.2"/>',
    tag: '<path d="M4 4h7l9 9-7 7-9-9V4Z"/><circle cx="8" cy="8" r="1.1" fill="currentColor" stroke="none"/>',
    coffee: '<path d="M5 8.5h12v4.5a5 5 0 0 1-10 0V8.5ZM17 9.5h2a2 2 0 0 1 0 4h-2M6 3c0 1 1 1 1 2M10 3c0 1 1 1 1 2M14 3c0 1 1 1 1 2M4.5 20.5h14"/>',
    document: '<path d="M6 3h7l5 5v13H6V3Z"/><path d="M13 3v5h5M9 13h6M9 16.5h6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>',
    pin: '<path d="M12 21c4-4.5 7-7.6 7-11a7 7 0 1 0-14 0c0 3.4 3 6.5 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>'
  };
  function iconSVG(name, cls) {
    const inner = ICON_PATHS[name];
    if (!inner) return "";
    return `<svg class="ico-svg${cls ? " " + cls : ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`;
  }
  window.wsIcon = iconSVG;
  const iconTag = (name, cls) => `<span class="ico${cls ? " " + cls : ""}">${iconSVG(name)}</span>`;
  function hydrateIcons(root = document) {
    $$("[data-ico]", root).forEach(el => {
      const name = el.getAttribute("data-ico");
      const svg = iconSVG(name);
      if (svg) el.innerHTML = svg;
    });
  }

  /* 1. TOAST --------------------------------------------------------------- */
  let toastEl, toastTimer;
  function toast(msg, icon = "check") {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = `<span class="ico">${iconSVG(icon) || iconSVG("check")}</span><span>${msg}</span>`;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3200);
  }
  window.wsToast = toast;

  /* 2. THEME TOGGLE -------------------------------------------------------- */
  function initTheme() {
    const saved = store.get("ws-theme", null);
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = saved || (prefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
    updateToggleIcon(theme);

    $$(".theme-toggle").forEach(btn => btn.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme");
      const next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      store.set("ws-theme", next);
      updateToggleIcon(next);
    }));
  }
  function updateToggleIcon(theme) {
    const svg = iconSVG(theme === "dark" ? "sun" : "moon");
    $$(".theme-toggle").forEach(b => {
      b.innerHTML = svg;
      b.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    });
  }

  /* 3. NAVIGATION ---------------------------------------------------------- */
  function initNav() {
    const header = $(".site-header");
    const toggle = $(".nav-toggle");
    const menu = $(".nav-menu");

    if (toggle && menu) {
      toggle.addEventListener("click", () => {
        toggle.classList.toggle("open");
        menu.classList.toggle("open");
      });
      // close menu on link click (mobile)
      $$(".nav-menu a", menu).forEach(a => a.addEventListener("click", () => {
        if (window.innerWidth <= 860 && !a.parentElement.classList.contains("has-drop")) {
          toggle.classList.remove("open"); menu.classList.remove("open");
        }
      }));
    }
    // mobile dropdown expand
    $$(".has-drop > a").forEach(a => a.addEventListener("click", e => {
      if (window.innerWidth <= 860) { e.preventDefault(); a.parentElement.classList.toggle("open"); }
    }));

    // scrolled shadow
    if (header) {
      const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 10);
      onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
    }

    // active link based on current file
    const path = location.pathname.split("/").pop() || "index.html";
    $$(".nav-menu a").forEach(a => {
      const href = a.getAttribute("href");
      if (!href) return;
      const file = href.split("/").pop();
      if (file === path) {
        a.classList.add("active");
        const drop = a.closest(".has-drop");
        if (drop) drop.querySelector(":scope > a").classList.add("active");
      }
    });
  }

  /* 4. SCROLL REVEAL / PROGRESS / TOP / COUNT-UP --------------------------- */
  function initScrollFX() {
    // reveal
    const items = $$(".reveal");
    if ("IntersectionObserver" in window && items.length) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          const el = en.target;
          el.classList.add("in");
          io.unobserve(el);
          // drop the compositor hint once the reveal has finished so it can't shimmer
          setTimeout(() => el.classList.add("settled"), 760);
        });
      }, { threshold: 0.12 });
      items.forEach(el => io.observe(el));
    } else items.forEach(el => el.classList.add("in", "settled"));

    // scroll progress bar
    let bar = $("#scrollProgress");
    if (!bar) { bar = document.createElement("div"); bar.id = "scrollProgress"; document.body.appendChild(bar); }
    // back to top
    let top = $("#toTop");
    if (!top) {
      top = document.createElement("button"); top.id = "toTop"; top.innerHTML = "↑"; top.setAttribute("aria-label", "Back to top");
      top.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
      document.body.appendChild(top);
    }
    const onScroll = () => {
      const h = document.documentElement;
      const pct = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
      bar.style.width = pct + "%";
      top.classList.toggle("show", h.scrollTop > 500);
    };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

    // count-up numbers
    const nums = $$("[data-count]");
    if ("IntersectionObserver" in window && nums.length) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          countUp(en.target); io.unobserve(en.target);
        });
      }, { threshold: 0.5 });
      nums.forEach(n => io.observe(n));
    }
  }
  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const dur = 1400; const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = target * eased;
      el.textContent = (target % 1 === 0 ? Math.round(val) : val.toFixed(1)).toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* 5. CAROUSEL ------------------------------------------------------------ */
  function initCarousels() {
    $$("[data-carousel]").forEach(car => {
      const track = $(".carousel-track", car);
      const slides = $$(".slide", track);
      const dotsWrap = $(".dots", car);
      let i = 0, timer;
      if (dotsWrap) slides.forEach((_, idx) => {
        const b = document.createElement("button");
        b.setAttribute("aria-label", "Go to slide " + (idx + 1));
        b.addEventListener("click", () => go(idx));
        dotsWrap.appendChild(b);
      });
      const dots = dotsWrap ? $$("button", dotsWrap) : [];
      function go(n) {
        i = (n + slides.length) % slides.length;
        track.style.transform = `translateX(-${i * 100}%)`;
        dots.forEach((d, idx) => d.classList.toggle("active", idx === i));
      }
      $(".c-next", car)?.addEventListener("click", () => { go(i + 1); restart(); });
      $(".c-prev", car)?.addEventListener("click", () => { go(i - 1); restart(); });
      function restart() { clearInterval(timer); timer = setInterval(() => go(i + 1), 6000); }
      go(0); restart();
      car.addEventListener("mouseenter", () => clearInterval(timer));
      car.addEventListener("mouseleave", restart);
    });
  }

  /* 6. ACCORDION ----------------------------------------------------------- */
  function initAccordion() {
    $$(".acc-head").forEach(head => head.addEventListener("click", () => {
      const item = head.closest(".acc-item");
      const body = $(".acc-body", item);
      const open = item.classList.contains("open");
      // optional single-open per accordion
      const group = item.closest("[data-accordion-single]");
      if (group && !open) $$(".acc-item.open", group).forEach(o => { o.classList.remove("open"); $(".acc-body", o).style.maxHeight = null; });
      item.classList.toggle("open");
      body.style.maxHeight = open ? null : body.scrollHeight + "px";
    }));
  }

  /* 7. COUNTDOWN ----------------------------------------------------------- */
  function initCountdowns() {
    $$("[data-countdown]").forEach(el => {
      const target = new Date(el.dataset.countdown).getTime();
      const D = $(".cd-days", el), H = $(".cd-hours", el), M = $(".cd-mins", el), S = $(".cd-secs", el);
      function tick() {
        const diff = target - Date.now();
        if (diff <= 0) { el.innerHTML = `<p class="big" style="color:var(--green-dark)">${iconTag("celebrate")} The event is live now!</p>`; clearInterval(t); return; }
        const d = Math.floor(diff / 864e5), h = Math.floor(diff % 864e5 / 36e5),
              m = Math.floor(diff % 36e5 / 6e4), s = Math.floor(diff % 6e4 / 1e3);
        if (D) D.textContent = String(d).padStart(2, "0");
        if (H) H.textContent = String(h).padStart(2, "0");
        if (M) M.textContent = String(m).padStart(2, "0");
        if (S) S.textContent = String(s).padStart(2, "0");
      }
      tick(); const t = setInterval(tick, 1000);
    });
  }

  /* 8. FORM VALIDATION ----------------------------------------------------- */
  const validators = {
    required: v => v.trim().length > 0,
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
    name: v => /^[a-zA-Z\s'.-]{2,}$/.test(v.trim()),
    phone: v => v.trim() === "" || /^[+\d][\d\s()-]{6,}$/.test(v.trim()),
    min3: v => v.trim().length >= 3,
    min10: v => v.trim().length >= 10
  };
  function validateField(field) {
    const input = $(".input, .select, .textarea", field) || field.querySelector("input,select,textarea");
    if (!input) return true;
    const rules = (input.dataset.validate || "").split(" ").filter(Boolean);
    let ok = true;
    for (const r of rules) { if (validators[r] && !validators[r](input.value)) { ok = false; break; } }
    if (input.type === "checkbox") ok = !rules.includes("required") || input.checked;
    field.classList.toggle("invalid", !ok);
    field.classList.toggle("valid", ok && input.value.trim() !== "");
    return ok;
  }
  function initForms() {
    $$("form[data-validate-form]").forEach(form => {
      const fields = $$(".field", form);
      fields.forEach(f => {
        const input = f.querySelector("input,select,textarea");
        if (input) input.addEventListener("input", () => validateField(f));
        if (input) input.addEventListener("blur", () => validateField(f));
      });
      form.addEventListener("submit", e => {
        e.preventDefault();
        let allOk = true;
        fields.forEach(f => { if (!validateField(f)) allOk = false; });
        const success = $(".form-success", form);
        if (!allOk) {
          toast("Please fix the highlighted fields.", "warning");
          const firstBad = $(".field.invalid", form);
          firstBad?.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }
        const collected = collectForm(form);
        const btn = form.querySelector('[type="submit"]');
        const restore = btn ? btn.innerHTML : "";
        const sending = emailConfigured();
        if (btn && sending) { btn.disabled = true; btn.innerHTML = "Sending…"; }
        sendFormEmails(formTypeFor(form), collected).then(status => {
          if (btn && sending) { btn.disabled = false; btn.innerHTML = restore; }
          if (status === "error") { toast("Couldn't send right now — please try again.", "warning"); return; }
          if (success) { success.style.display = "flex"; }
          toast(form.dataset.successMsg || "Submitted successfully!", form.dataset.successIcon || "celebrate");
          form.reset();
          fields.forEach(f => f.classList.remove("valid", "invalid"));
          if (success) setTimeout(() => (success.style.display = "none"), 6000);
        });
      });
    });

    // simple newsletter forms
    $$("form[data-newsletter]").forEach(form => form.addEventListener("submit", e => {
      e.preventDefault();
      const input = form.querySelector("input");
      if (!input || !validators.email(input.value)) { toast("Please enter a valid email.", "warning"); return; }
      const email = input.value.trim();
      const btn = form.querySelector("button");
      const sending = emailConfigured();
      if (btn && sending) btn.disabled = true;
      sendFormEmails("Newsletter signup", { name: "", email, message: "New newsletter subscription: " + email, pairs: [] }).then(status => {
        if (btn && sending) btn.disabled = false;
        if (status === "error") { toast("Couldn't subscribe right now — please try again.", "warning"); return; }
        toast("You're subscribed! Check your inbox.", "mail");
        form.reset();
      });
    }));
  }

  /* 9. FITNESS WORKOUT GENERATOR ------------------------------------------ */
  const workoutDB = {
    strength: {
      beginner: ["Bodyweight squats — 3×10", "Wall push-ups — 3×8", "Glute bridges — 3×12", "Plank — 3×20s"],
      intermediate: ["Push-ups — 4×12", "Lunges — 3×12/leg", "Dumbbell rows — 3×12", "Plank — 3×45s"],
      advanced: ["Pull-ups — 4×8", "Bulgarian split squats — 4×10", "Pike push-ups — 4×10", "Hollow hold — 4×40s"]
    },
    cardio: {
      beginner: ["Brisk 15-min walk", "Marching in place — 3×2min", "Step-ups — 3×20", "Gentle cycling — 15min"],
      intermediate: ["Jog — 25min", "Jump rope — 5×1min", "High knees — 4×30s", "Stair intervals — 20min"],
      advanced: ["HIIT sprints — 8×30s", "Burpees — 5×12", "Mountain climbers — 5×40s", "Tabata circuit — 20min"]
    },
    flexibility: {
      beginner: ["Neck & shoulder rolls — 5min", "Cat-cow stretch — 3×10", "Seated forward fold — 3×30s", "Child's pose — 2min"],
      intermediate: ["Sun salutations — 5 rounds", "Hip flexor stretch — 3×40s", "Downward dog flow — 5min", "Spinal twist — 3×30s"],
      advanced: ["Full yoga flow — 30min", "Deep pigeon pose — 3×60s", "Bridge/wheel — 3×20s", "Standing splits practice — 10min"]
    },
    weightloss: {
      beginner: ["Walk + light jog — 20min", "Bodyweight circuit — 3 rounds", "Dancing — 15min", "Squats — 3×15"],
      intermediate: ["Circuit training — 30min", "Jump rope — 5×1min", "Kettlebell swings — 4×15", "Jog — 25min"],
      advanced: ["HIIT — 30min", "Full-body AMRAP — 20min", "Sprint intervals — 10×30s", "Metabolic circuit — 4 rounds"]
    }
  };
  function initFitness() {
    const gen = $("#workoutGenerate");
    if (!gen) return;
    const out = $("#workoutResult");
    gen.addEventListener("click", () => {
      const goal = $("#fitGoal .chip.selected")?.dataset.val;
      const level = $("#fitLevel .chip.selected")?.dataset.val;
      const time = $("#fitTime")?.value;
      if (!goal || !level) { toast("Pick a goal and an activity level first.", "warning"); return; }
      const list = workoutDB[goal][level];
      const count = time <= 15 ? 2 : time <= 30 ? 3 : 4;
      const picks = list.slice(0, count);
      out.innerHTML = `
        <h3>${iconTag("dumbbell")} Your ${level} ${goal.replace("weightloss","weight-loss")} plan (${time} min)</h3>
        <p class="muted">Warm up 5 minutes, then complete:</p>
        <ul class="check-list">${picks.map(p => `<li>${p}</li>`).join("")}</ul>
        <p class="mt-2"><b>Cool down:</b> 5 minutes of light stretching. Stay hydrated.</p>`;
      out.classList.add("show");
      out.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    // chip selection
    $$("#fitGoal .chip, #fitLevel .chip").forEach(c => c.addEventListener("click", () => {
      $$(".chip", c.parentElement).forEach(x => x.classList.remove("selected"));
      c.classList.add("selected");
    }));
    const range = $("#fitTime"), label = $("#fitTimeLabel");
    if (range && label) { const upd = () => label.textContent = range.value + " min"; range.addEventListener("input", upd); upd(); }
  }

  /* 10. MOOD TRACKER ------------------------------------------------------- */
  const moodAdvice = {
    happy:   { icon: "mood-happy", title: "Love that energy!", tips: ["Share your positivity — check in on a friend today", "Channel it into a 20-min workout", "Journal 3 things you're grateful for to lock in the feeling"] },
    calm:    { icon: "mood-calm", title: "Beautifully balanced", tips: ["Great time for focused work — ride the calm", "Try a 10-min mindfulness session to deepen it", "Do some gentle stretching or a nature walk"] },
    neutral: { icon: "mood-neutral", title: "Let's lift things up", tips: ["A short walk outside can boost your mood fast", "Listen to an upbeat playlist for 10 minutes", "Drink some water and have a healthy snack"] },
    stressed:{ icon: "mood-sad", title: "Let's ease the pressure", tips: ["Try the 4-7-8 breathing exercise (breathe in 4s, hold 7s, out 8s)", "Break big tasks into small 25-min focus blocks", "Talk to someone — a trusted friend or a professional support line is always there"] }
  };
  function initMood() {
    const grid = $("#moodGrid");
    if (!grid) return;
    const out = $("#moodResult");
    $$(".mood", grid).forEach(m => m.addEventListener("click", () => {
      $$(".mood", grid).forEach(x => x.classList.remove("selected"));
      m.classList.add("selected");
      const data = moodAdvice[m.dataset.mood];
      out.innerHTML = `
        <h3>${iconTag(data.icon)} ${data.title}</h3>
        <ul class="check-list mt-2">${data.tips.map(t => `<li>${t}</li>`).join("")}</ul>`;
      out.classList.add("show");
      // log to dashboard
      const log = store.get("ws-moods", []);
      log.push({ mood: m.dataset.mood, t: Date.now() });
      store.set("ws-moods", log.slice(-30));
    }));
  }

  /* 11. WELLNESS QUIZ ------------------------------------------------------ */
  function initQuiz() {
    const quiz = $("#wellnessQuiz");
    if (!quiz) return;
    const btn = $("#quizSubmit");
    const out = $("#quizResult");
    btn.addEventListener("click", () => {
      const questions = $$(".quiz-q", quiz);
      let answered = 0, score = 0;
      questions.forEach(q => {
        const sel = $(".quiz-opt.selected", q);
        if (sel) { answered++; score += parseInt(sel.dataset.score, 10); }
      });
      if (answered < questions.length) { toast(`Please answer all ${questions.length} questions.`, "warning"); return; }
      const max = questions.length * 4;
      const pct = Math.round(score / max * 100);
      let verdict, tips;
      if (pct >= 80) { verdict = iconTag("star") + " Wellness Champion"; tips = "Fantastic! Your habits are excellent. Keep the momentum and inspire others."; }
      else if (pct >= 60) { verdict = iconTag("dumbbell") + " Doing Great"; tips = "Strong foundation! Fine-tune your weakest area — often sleep or hydration."; }
      else if (pct >= 40) { verdict = iconTag("leaf") + " Room to Grow"; tips = "You're on the path. Pick ONE habit this week — small steps compound fast."; }
      else { verdict = iconTag("compass") + " Time for a Reset"; tips = "No judgement! Start tiny: an early night, a water bottle, a 10-min walk."; }
      out.innerHTML = `
        <div class="text-center">
          <div class="ring" style="--val:${pct}"><div class="ring-inner"><b>${pct}%</b><small>Wellness Score</small></div></div>
          <h3 class="mt-3">${verdict}</h3>
          <p class="muted">${tips}</p>
          <a class="btn btn-primary mt-2" href="${quiz.dataset.dash || 'dashboard.html'}">Open your dashboard →</a>
        </div>`;
      out.classList.add("show");
      out.scrollIntoView({ behavior: "smooth", block: "center" });
      store.set("ws-quiz", pct);
    });
    $$(".quiz-opt", quiz).forEach(o => o.addEventListener("click", () => {
      $$(".quiz-opt", o.closest(".quiz-options")).forEach(x => x.classList.remove("selected"));
      o.classList.add("selected");
    }));
  }

  /* 12. HEALTH CALCULATORS ------------------------------------------------- */
  function initCalculators() {
    // BMI
    const bmiBtn = $("#bmiCalc");
    if (bmiBtn) bmiBtn.addEventListener("click", () => {
      const h = parseFloat($("#bmiHeight").value) / 100;
      const w = parseFloat($("#bmiWeight").value);
      const out = $("#bmiResult");
      if (!h || !w || h <= 0 || w <= 0) { out.innerHTML = "<p>Please enter valid height & weight.</p>"; out.classList.add("show"); return; }
      const bmi = w / (h * h);
      let cat, color;
      if (bmi < 18.5) { cat = "Underweight"; color = "var(--blue)"; }
      else if (bmi < 25) { cat = "Healthy weight"; color = "var(--green)"; }
      else if (bmi < 30) { cat = "Overweight"; color = "var(--accent)"; }
      else { cat = "Obese"; color = "var(--coral)"; }
      out.innerHTML = `<h3>Your BMI: <span style="color:${color}">${bmi.toFixed(1)}</span></h3>
        <p><b>${cat}</b> — BMI is a general guide; body composition & lifestyle matter too.</p>`;
      out.classList.add("show");
    });

    // Water intake
    const waterBtn = $("#waterCalc");
    if (waterBtn) waterBtn.addEventListener("click", () => {
      const w = parseFloat($("#waterWeight").value);
      const act = parseFloat($("#waterActivity").value || 0);
      const out = $("#waterResult");
      if (!w || w <= 0) { out.innerHTML = "<p>Please enter your weight.</p>"; out.classList.add("show"); return; }
      const litres = (w * 0.033 + act * 0.35);
      const glasses = Math.round(litres / 0.25);
      out.innerHTML = `<h3>${iconTag("water")} ${litres.toFixed(1)} litres / day</h3>
        <p>That's about <b>${glasses} glasses</b> (250ml each). Keep a bottle on your desk!</p>`;
      out.classList.add("show");
    });

    // Calorie (Mifflin-St Jeor)
    const calBtn = $("#calorieCalc");
    if (calBtn) calBtn.addEventListener("click", () => {
      const age = parseFloat($("#calAge").value), h = parseFloat($("#calHeight").value),
            w = parseFloat($("#calWeight").value), sex = $("#calSex").value, act = parseFloat($("#calActivity").value);
      const out = $("#calorieResult");
      if (!age || !h || !w) { out.innerHTML = "<p>Please fill in all fields.</p>"; out.classList.add("show"); return; }
      let bmr = 10 * w + 6.25 * h - 5 * age + (sex === "male" ? 5 : -161);
      const tdee = Math.round(bmr * act);
      out.innerHTML = `<h3>${iconTag("flame")} ${tdee.toLocaleString()} kcal / day</h3>
        <p>Maintenance estimate. For weight loss aim ~${(tdee-400).toLocaleString()} kcal; to build muscle ~${(tdee+300).toLocaleString()} kcal.</p>`;
      out.classList.add("show");
    });
  }

  /* 13. DAILY CHALLENGE ---------------------------------------------------- */
  const challenges = [
    { ic: "water", t: "Drink 8 glasses of water today", pts: 20 },
    { ic: "walk", t: "Walk 5,000 steps", pts: 25 },
    { ic: "meditation", t: "Meditate for 5 minutes", pts: 15 },
    { ic: "run", t: "Do a 10-minute stretch routine", pts: 15 },
    { ic: "salad", t: "Eat 3 servings of vegetables", pts: 20 },
    { ic: "sleep", t: "Sleep at least 7 hours tonight", pts: 25 },
    { ic: "phone-off", t: "Take a 1-hour screen break", pts: 15 },
    { ic: "heart", t: "Write down 3 things you're grateful for", pts: 15 },
    { ic: "sun", t: "Get 15 minutes of sunlight", pts: 15 },
    { ic: "phone", t: "Check in with a friend or family member", pts: 20 }
  ];
  function initChallenge() {
    const box = $("#challengeBox");
    if (!box) return;
    const btn = $("#challengeNew");
    const done = $("#challengeDone");
    function render(ch) {
      $("#challengeIcon", box) && ($("#challengeIcon", box).innerHTML = iconSVG(ch.ic));
      $("#challengeText", box) && ($("#challengeText", box).textContent = ch.t);
      $("#challengePts", box) && ($("#challengePts", box).textContent = "+" + ch.pts + " points");
      box.dataset.pts = ch.pts;
    }
    // deterministic "daily" challenge based on date, but allow reroll
    const dayIdx = new Date().getDate() % challenges.length;
    render(challenges[dayIdx]);
    btn?.addEventListener("click", () => render(challenges[Math.floor(Math.random() * challenges.length)]));
    done?.addEventListener("click", () => {
      addPoints(parseInt(box.dataset.pts, 10) || 10);
      toast("Challenge complete! Points added.", "trophy");
    });
  }

  /* 14. DASHBOARD + GAMIFICATION ------------------------------------------ */
  function getProfile() {
    return store.get("ws-profile", { points: 0, water: 0, steps: 0, mind: 0, streak: 1 });
  }
  function saveProfile(p) { store.set("ws-profile", p); }
  function addPoints(n) {
    const p = getProfile(); p.points += n; saveProfile(p);
    renderDashboard(); updateBadges();
    return p.points;
  }
  window.wsAddPoints = addPoints;

  function updateBadges() {
    const p = getProfile();
    const rules = {
      "badge-hydration": p.water >= 8,
      "badge-fitness": p.steps >= 5000,
      "badge-mind": p.mind >= 3,
      "badge-points100": p.points >= 100,
      "badge-points500": p.points >= 500,
      "badge-streak": p.streak >= 7
    };
    Object.entries(rules).forEach(([id, earned]) => {
      const el = document.getElementById(id);
      if (el) { el.classList.toggle("earned", earned); el.classList.toggle("locked", !earned); }
    });
  }

  function renderDashboard() {
    const dash = $("#dashboard");
    if (!dash) return;
    const p = getProfile();
    // score = weighted mini formula
    const score = Math.min(100, Math.round(
      (Math.min(p.water, 8) / 8) * 35 +
      (Math.min(p.steps, 8000) / 8000) * 35 +
      (Math.min(p.mind, 3) / 3) * 30
    ));
    const ring = $("#dashRing");
    if (ring) { ring.style.setProperty("--val", score); $("#dashScore").textContent = score + "%"; }
    $("#dashPoints") && ($("#dashPoints").textContent = p.points);
    $("#dashStreak") && ($("#dashStreak").textContent = p.streak);
    // meters
    setMeter("water", p.water, 8);
    setMeter("steps", p.steps, 8000);
    setMeter("mind", p.mind, 3);
    // suggestions
    const sug = $("#dashSuggestions");
    if (sug) {
      const list = [];
      if (p.water < 8) list.push(iconTag("water") + " Drink " + (8 - p.water) + " more glass(es) of water");
      if (p.steps < 8000) list.push(iconTag("walk") + " Walk " + (8000 - p.steps).toLocaleString() + " more steps");
      if (p.mind < 3) list.push(iconTag("meditation") + " Do " + (3 - p.mind) + " more mindfulness session(s)");
      if (!list.length) list.push(iconTag("star") + " All goals hit — you're crushing it today!");
      sug.innerHTML = list.map(x => `<li>${x}</li>`).join("");
    }
    updateBadges();
  }
  function setMeter(key, val, max) {
    const bar = document.getElementById("meter-" + key);
    const lbl = document.getElementById("val-" + key);
    if (bar) bar.querySelector("span").style.width = Math.min(100, val / max * 100) + "%";
    if (lbl) lbl.textContent = key === "steps" ? val.toLocaleString() : val;
  }
  function initDashboard() {
    const dash = $("#dashboard");
    if (!dash) return;
    // streak: bump if new day
    const last = store.get("ws-last", null);
    const today = new Date().toDateString();
    if (last !== today) {
      const p = getProfile();
      p.streak = last ? p.streak + 1 : 1;
      // reset daily counters on new day
      p.water = 0; p.steps = 0; p.mind = 0;
      saveProfile(p); store.set("ws-last", today);
    }
    // counter buttons
    $$("[data-inc]").forEach(btn => btn.addEventListener("click", () => {
      const p = getProfile();
      const key = btn.dataset.inc; const amt = parseInt(btn.dataset.amt || "1", 10);
      p[key] = Math.max(0, (p[key] || 0) + amt);
      p.points += amt > 0 ? (key === "steps" ? 1 : 5) : 0;
      saveProfile(p); renderDashboard();
      if (amt > 0) toast("Logged! Keep it up.", "check");
    }));
    $("#dashReset")?.addEventListener("click", () => {
      if (confirm("Reset today's progress? (Points & streak are kept)")) {
        const p = getProfile(); p.water = 0; p.steps = 0; p.mind = 0; saveProfile(p); renderDashboard();
        toast("Today's trackers reset.", "refresh");
      }
    });
    // reflect quiz score if present
    const qs = store.get("ws-quiz", null);
    if (qs !== null && $("#dashQuiz")) $("#dashQuiz").textContent = qs + "%";
    renderDashboard();
  }

  /* 15. GALLERY FILTER + LIGHTBOX ----------------------------------------- */
  function initGallery() {
    const grid = $("#galleryGrid");
    if (grid) {
      $$(".gallery-filter .chip").forEach(btn => btn.addEventListener("click", () => {
        $$(".gallery-filter .chip").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        const f = btn.dataset.filter;
        $$(".g-item", grid).forEach(item => {
          const show = f === "all" || item.dataset.cat === f;
          item.style.display = show ? "" : "none";
        });
      }));
    }
    // lightbox for any [data-lightbox] image
    const imgs = $$("[data-lightbox]");
    if (!imgs.length) return;
    let lb = $("#lightbox");
    if (!lb) {
      lb = document.createElement("div"); lb.id = "lightbox"; lb.className = "lightbox";
      lb.innerHTML = '<button class="close" aria-label="Close">×</button><img alt="Enlarged gallery image">';
      document.body.appendChild(lb);
      lb.addEventListener("click", e => { if (e.target === lb || e.target.classList.contains("close")) lb.classList.remove("open"); });
      document.addEventListener("keydown", e => { if (e.key === "Escape") lb.classList.remove("open"); });
    }
    const lbImg = $("img", lb);
    imgs.forEach(img => img.addEventListener("click", () => {
      lbImg.src = img.dataset.full || img.src; lb.classList.add("open");
    }));
  }

  /* 15b. PARALLAX (hero doodles) ------------------------------------------- */
  function initParallax() {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const els = $$("[data-parallax]");
    if (!els.length) return;
    let ticking = false;
    const update = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      els.forEach(el => {
        const sp = parseFloat(el.dataset.parallax) || 0;
        // uses the `translate` property; the doodles' floaty animation uses `transform`
        // (GPU-composited), so the two compose smoothly without fighting over one property
        el.style.translate = `0 ${(y * sp).toFixed(1)}px`;
      });
      ticking = false;
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
  }

  /* 15c. GENERIC MODAL (video / audio / article popups) -------------------- */
  let modalEl, lastFocused;
  function ensureModal() {
    if (modalEl) return modalEl;
    modalEl = document.createElement("div");
    modalEl.className = "ws-modal";
    modalEl.innerHTML =
      '<div class="ws-modal-panel" role="dialog" aria-modal="true">' +
      '<button class="ws-modal-close" aria-label="Close">&times;</button>' +
      '<div class="ws-modal-body"></div></div>';
    document.body.appendChild(modalEl);
    modalEl.addEventListener("click", e => {
      if (e.target === modalEl || e.target.closest(".ws-modal-close")) closeModal();
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && modalEl.classList.contains("open")) closeModal();
    });
    return modalEl;
  }
  function openModal(html, variant) {
    const m = ensureModal();
    lastFocused = document.activeElement;
    const panel = $(".ws-modal-panel", m);
    panel.className = "ws-modal-panel" + (variant ? " " + variant : "");
    const body = $(".ws-modal-body", m);
    body.innerHTML = html;
    hydrateIcons(body);
    m.classList.add("open");
    document.body.classList.add("modal-open");
    $(".ws-modal-close", m).focus();
  }
  function closeModal() {
    if (!modalEl) return;
    // stop any playing media before clearing
    $$("video, audio", modalEl).forEach(el => { try { el.pause(); } catch (e) {} });
    modalEl.classList.remove("open");
    document.body.classList.remove("modal-open");
    $(".ws-modal-body", modalEl).innerHTML = "";
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  /* 15d. MEDIA POPUPS — routine videos & guided-audio sessions ------------- */
  function initMediaPopups() {
    const cards = $$("[data-media-src]");
    if (!cards.length) return;
    cards.forEach(card => {
      card.classList.add("has-media");
      const open = () => {
        const src   = encodeURI(card.getAttribute("data-media-src"));
        const type  = card.getAttribute("data-media-type") || "video";
        const title = card.getAttribute("data-media-title") || "";
        const desc  = card.getAttribute("data-media-desc") || "";
        const media = type === "audio"
          ? `<div class="ws-audio-wrap">${iconTag("meditation")}` +
            `<audio controls autoplay src="${src}">Your browser can’t play this audio.</audio></div>`
          : `<video controls autoplay playsinline src="${src}">Your browser can’t play this video.</video>`;
        openModal(
          media +
          `<div class="ws-modal-caption"><h3>${title}</h3>` +
          (desc ? `<p class="muted">${desc}</p>` : "") + `</div>`,
          type === "audio" ? "is-audio" : "is-video"
        );
      };
      card.addEventListener("click", open);
      card.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      });
    });
  }

  /* 15e. BLOG ARTICLE POPUPS ----------------------------------------------- */
  const ARTICLES = {
    "sleep-well-busy": {
      badge: "Lifestyle", img: "../images/blog1.svg",
      title: "How to Actually Sleep Well When Life Is Busy",
      meta: "By Aisyah Rahman · 1 July 2026 · 7 min read",
      body: `
        <p>Late nights feel productive, but they quietly wreck the memory consolidation your brain does while you sleep. Skimp on rest and everything else — focus, mood, appetite, willpower — gets harder the next day. The good news: you don't need a perfect eight hours to feel the difference. You need a routine your body can rely on.</p>
        <h3>Wind down on purpose</h3>
        <p>Give yourself a 30-minute runway before bed. Dim the lights, put your phone on the other side of the room, and do something low-stakes — read a few pages, stretch, or simply sit. The goal is to signal to your nervous system that the day is over.</p>
        <h3>Watch the afternoon caffeine</h3>
        <p>Caffeine has a half-life of roughly five to six hours, so that 3pm coffee is still half-active at 9pm — sabotaging the deep sleep that actually restores you. Switch to water or herbal tea after lunch and notice how much faster you drift off.</p>
        <h3>The 10-minute brain dump</h3>
        <p>If racing thoughts keep you up, keep a notebook by the bed and write tomorrow's worries down before you switch off. Externalising the list tells your brain it's safe to stop rehearsing it. Start with just one of these tonight — small, consistent tweaks beat a perfect routine you can't keep.</p>`
    },
    "better-sleep-schedule": {
      badge: "Lifestyle", img: "../images/blog1.svg",
      title: "Better Sleep on a Busy Schedule",
      meta: "28 Jun 2026 · 5 min read",
      body: `
        <p>Irregular shifts and early starts make consistent sleep feel impossible — but your body clock cares less about <em>when</em> you sleep and more about <em>how regularly</em> you do it.</p>
        <h3>Anchor your wake-up time</h3>
        <p>Pick a wake-up time you can hit seven days a week — yes, even on weekends — and hold it. A steady morning anchor resets your circadian rhythm far more powerfully than chasing a fixed bedtime. Within a week or two, you'll start feeling sleepy at a consistent hour on your own.</p>
        <h3>Tune your bedroom</h3>
        <p>Cool, dark and quiet wins. Aim for around 18°C, block stray light, and keep screens out of arm's reach. If noise is an issue, a fan or white-noise track smooths over the sudden sounds that jolt you awake.</p>
        <p>Change one thing this week, not five. Consistency is the habit that compounds.</p>`
    },
    "beating-stress": {
      badge: "Mind", img: "../images/blog2.svg",
      title: "Beating Stress Before It Beats You",
      meta: "24 Jun 2026 · 6 min read",
      body: `
        <p>A little pressure sharpens focus; too much freezes it. The skill isn't avoiding stress altogether — it's spotting it early and having a couple of reliable ways to let it out.</p>
        <h3>Know your early signals</h3>
        <p>Tight shoulders, a clenched jaw, snapping at small things, doom-scrolling — these are your body's check-engine lights. Naming the signal is half the battle, because it turns a vague overwhelm into something you can actually act on.</p>
        <h3>Box breathing</h3>
        <p>Breathe in for four counts, hold for four, out for four, hold for four. Three or four rounds tells your nervous system the danger has passed. It works anywhere — at your desk, on the bus, before a hard conversation.</p>
        <h3>The worry window</h3>
        <p>Instead of worrying all day, book a fixed 15 minutes to worry on purpose. When anxious thoughts pop up outside that window, jot them down for later. Most lose their grip by the time the window arrives — and if something still feels too heavy, reaching out to a counselling service is a sign of strength, not weakness.</p>`
    },
    "staying-hydrated": {
      badge: "Nutrition", img: "../images/blog3.svg",
      title: "Staying Hydrated When You're Always Busy",
      meta: "20 Jun 2026 · 4 min read",
      body: `
        <p>Mild dehydration shows up as brain fog and afternoon fatigue long before you actually feel thirsty. By the time your mouth is dry, you're already behind.</p>
        <h3>How much do you really need?</h3>
        <p>A rough guide is about 30ml per kilo of body weight, plus extra for exercise and hot days. Coffee and tea count a little, but caffeine is a mild diuretic, so don't rely on them alone.</p>
        <h3>Make it automatic</h3>
        <p>Keep a bottle within arm's reach and stack the habit onto things you already do: a glass when you wake, one before each meal, one when you sit down to work. A visible bottle you refill twice is far easier than remembering to count. Add a slice of lemon or cucumber if plain water bores you.</p>`
    },
    "small-space-workouts": {
      badge: "Fitness", img: "../images/blog4.svg",
      title: "Small-Space Workouts With Zero Equipment",
      meta: "16 Jun 2026 · 8 min read",
      body: `
        <p>No gym membership and barely any floor space? No problem. Your own bodyweight and a sturdy chair are enough to build real strength and mobility at home.</p>
        <h3>A 20-minute circuit</h3>
        <p>Move through the following with good control, rest a minute, and repeat for three rounds:</p>
        <ul class="check-list">
          <li>Bodyweight squats — 12 reps</li>
          <li>Incline push-ups against a desk — 10 reps</li>
          <li>Reverse lunges — 8 per leg</li>
          <li>Glute bridges — 15 reps</li>
          <li>Plank — hold 30 seconds</li>
        </ul>
        <h3>Keep it neighbour-friendly</h3>
        <p>Swap jumping moves for step-backs and land softly with bent knees. Focus on control over speed — slow, deliberate reps build more strength and make far less noise. Consistency three times a week beats one heroic session you're too sore to repeat.</p>`
    },
    "eating-budget": {
      badge: "Nutrition", img: "../images/blog5.svg",
      title: "Eating Well on a Tight Budget",
      meta: "12 Jun 2026 · 7 min read",
      body: `
        <p>Healthy eating doesn't have to drain your wallet. A handful of cheap, nutrient-dense staples and a little batch cooking go a long way.</p>
        <h3>Stock the flexible basics</h3>
        <p>Oats, eggs, rice, lentils, frozen vegetables, tinned beans and seasonal produce give you dozens of meals for very little. Frozen veg is picked and frozen at peak ripeness, so it's often more nutritious than tired fresh produce — and it never wilts in the back of the fridge.</p>
        <h3>Three 15-minute meals</h3>
        <ul class="check-list">
          <li>Loaded lentil soup with whatever veg needs using up</li>
          <li>Egg fried rice with frozen peas and a splash of soy</li>
          <li>Bean-and-veg wraps with a squeeze of lime</li>
        </ul>
        <p>Cook once, eat twice. Doubling a recipe and freezing half turns a busy week into a stack of ready meals — saving both money and the 6pm "what's for dinner" panic.</p>`
    },
    "morning-routine": {
      badge: "Lifestyle", img: "../images/blog6.svg",
      title: "Building a Morning Routine That Sticks",
      meta: "8 Jun 2026 · 5 min read",
      body: `
        <p>Perfect five-step morning routines look great online but rarely survive a real, busy week. The routines that last are almost always smaller than you'd expect.</p>
        <h3>Start with one keystone habit</h3>
        <p>Pick a single action that makes the rest of your morning better — a glass of water, five minutes of stretching, or simply making the bed. One win you never skip beats five you abandon by Wednesday.</p>
        <h3>Attach it to something you already do</h3>
        <p>Habit stacking is the trick: "after I start the kettle, I stretch." The existing habit becomes the reminder, so you're not relying on motivation or memory. Once it feels automatic, add the next small piece.</p>
        <p>Grow slowly. A calm, reliable two-minute routine will outlast an ambitious one every single time.</p>`
    }
  };
  function initArticles() {
    $$("[data-article]").forEach(link => link.addEventListener("click", e => {
      e.preventDefault();
      const a = ARTICLES[link.getAttribute("data-article")];
      if (!a) return;
      openModal(
        `<img class="ws-article-hero" src="${a.img}" alt="">` +
        `<div class="ws-article-body">` +
          (a.badge ? `<span class="badge green">${a.badge}</span>` : "") +
          `<h2>${a.title}</h2>` +
          `<div class="article-meta">${a.meta}</div>` +
          a.body +
        `</div>`,
        "is-article"
      );
    }));
  }

  /* 15f. INFORMATIONAL CARD POPUPS ---------------------------------------- */
  // Optional richer copy shown under a card's own content, keyed by a
  // normalised title. Cards with no entry still open a popup that shows their
  // full existing content in a focused reading view.
  const INFO_EXTRA = {
    // ----- Events -----
    "stress-free-wellness-week": `<p>Across the week you can drop into short, come-as-you-are sessions: guided meditations, gentle breathing drills, and quiet reset corners with free herbal tea. No booking, no pressure — stay for five minutes or the full hour.</p><p>Perfect if deadlines have you frazzled and you want a calm, judgement-free space to breathe before diving back in.</p>`,
    "morning-yoga-sessions": `<p>Every Tuesday and Thursday we roll out the mats at 7:30 AM for a gentle flow that suits complete beginners and regulars alike. Expect slow stretches, steady breathing, and a calm, welcoming crowd.</p><p>Mats and props are provided — just bring water and comfy clothes. A lovely way to start the day feeling loose and clear-headed.</p>`,
    "healthy-cooking-workshop": `<p>A hands-on class where you'll cook three budget-friendly, balanced meals from scratch alongside our community chef. You'll pick up knife skills, smart swaps, and batch-cooking tricks you can repeat at home.</p><p>Everyone leaves with printed recipe cards, a full stomach, and the confidence that eating well doesn't need a big budget.</p>`,
    "mental-health-awareness-campaign": `<p>A full community day of honest talks, peer-listening booths, and practical workshops on stress, burnout, and looking out for one another. Come to listen, share, or simply be around people who get it.</p><p>Our goal is simple: chip away at the stigma and remind everyone that it's okay to not be okay — and that support is always within reach.</p>`,
    "fitness-challenge-month": `<p>Thirty days, one goal: move a little every single day. Log your activity, watch your streak grow, climb the community leaderboard, and win small prizes along the way.</p><p>Every level is welcome — a ten-minute walk counts just as much as a full workout. The point is building a habit that outlasts the month.</p>`,
    "nature-walk-and-talk": `<p>Swap screens for greenery on a relaxed group walk through Shivapuri Nature Park. Easy pace, good conversation, fresh air — and a gentle way to meet new faces outside your usual routine.</p><p>Suitable for all fitness levels. Wear comfortable shoes and bring a water bottle; we'll take our time and enjoy the views.</p>`,
    // ----- Home programs -----
    "fitness-and-exercise": `<p>From beginner-friendly home routines to a smart planner that builds a session around your goal and free time, our fitness programme meets you exactly where you are — no gym, no pressure, no experience needed.</p>`,
    "mental-wellness": `<p>A stigma-free space for your mind: guided breathing, mindfulness sessions, stress-management tools, and an interactive mood tracker that offers caring, tailored suggestions whenever you check in.</p>`,
    "nutrition-and-eating": `<p>Balanced-plate guides, budget-friendly recipes, and quick meal ideas that don't need a full kitchen. Practical, flexible eating advice designed for real, busy lives — not strict diets.</p>`,
    // ----- Fitness: routine library -----
    "10-min-home-hiit": `<h3>How it works</h3><p>A fast, high-intensity circuit you can finish before your coffee cools. Move through each exercise back-to-back, then rest and repeat. No equipment, no commute, no excuses — just ten focused minutes.</p><h3>The full circuit</h3><ul class="check-list"><li>40s jumping jacks</li><li>30s high knees</li><li>30s mountain climbers</li><li>20s rest — then repeat the whole circuit</li></ul><p>Aim for <b>3–4 rounds</b>. Push hard during the work intervals and recover fully in the rest.</p><h3>Tips</h3><p>Warm up with 60 seconds of marching first, land softly with bent knees, and keep breathing steady. Too intense? Swap the jumps for step-outs and march the high knees — the goal is to raise your heart rate, not to hurt your joints.</p><p><b>Best for:</b> busy days, a quick energy boost, or squeezing movement in between tasks.</p>`,
    "beginner-full-body": `<h3>How it works</h3><p>The perfect starting point if you're new to training. These three moves cover your whole body — legs, chest, arms and core — and teach the fundamentals safely. Do the routine <b>three times a week</b> with a rest day in between.</p><h3>The full routine</h3><ul class="check-list"><li>Bodyweight squats — 3 sets of 10</li><li>Knee push-ups — 3 sets of 8</li><li>Glute bridges — 3 sets of 12</li><li>Rest 45–60 seconds between sets</li></ul><h3>Tips</h3><p>Quality beats quantity — move slowly and with control rather than rushing the reps. As it starts to feel easy, add a fourth set or slow the lowering phase to make each rep harder.</p><p><b>Best for:</b> complete beginners building a foundation of strength and confidence.</p>`,
    "desk-stretch-breaks": `<h3>How it works</h3><p>Undo hours of hunching over a screen in under five minutes. This gentle sequence resets your posture, loosens tight shoulders and hips, and clears mental fog — no need to change clothes or leave your chair.</p><h3>The sequence</h3><ul class="check-list"><li>Neck &amp; shoulder rolls — 30 seconds each direction</li><li>Seated spinal twist — hold 20 seconds per side</li><li>Standing forward fold — hold 30 seconds, let your head hang</li><li>Chest opener — clasp hands behind you and lift, 20 seconds</li></ul><h3>Tips</h3><p>Move slowly and breathe into each stretch — never force it. Try to take one break every hour or two; a handful of short resets does more for a stiff body than one long stretch at the end of the day.</p><p><b>Best for:</b> desk workers, students, and anyone who sits for long stretches.</p>`,
    // ----- Fitness: beginner exercises -----
    "squats": `<p><b>Muscles worked:</b> quads, glutes and core.</p><p><b>Common mistakes:</b> letting the knees cave inward or rounding the lower back. Keep your weight in your heels and your chest proud. Start with a chair behind you for a target if you're unsure how low to go.</p>`,
    "push-ups": `<p><b>Muscles worked:</b> chest, shoulders, triceps and core.</p><p><b>Make it easier:</b> raise your hands onto a desk or wall, or drop to your knees. <b>Make it harder:</b> slow the lowering phase to three seconds. Keep your body in one straight line the whole time.</p>`,
    "plank": `<p><b>Muscles worked:</b> the whole core, plus shoulders.</p><p><b>Form cue:</b> squeeze your glutes and brace as if bracing for a light punch — this stops your hips sagging. Two solid 20-second holds beat one saggy minute.</p>`,
    "lunges": `<p><b>Muscles worked:</b> quads, glutes and balance.</p><p><b>Watch for:</b> the front knee drifting past the toes. Step far enough forward that both knees bend to about 90°, and keep your torso tall. Hold a wall for balance while you learn.</p>`,
    "glute-bridge": `<p><b>Muscles worked:</b> glutes, hamstrings and lower back.</p><p><b>Form cue:</b> drive through your heels and squeeze at the top for a second before lowering slowly. Great for undoing tight, desk-bound hips.</p>`,
    "jumping-jacks": `<p><b>Great for:</b> a quick full-body warm-up or a cardio burst.</p><p><b>Joint-friendly tip:</b> land softly with slightly bent knees, and keep a steady rhythm. Swap the jump for a step-out side to side if you need a quieter, lower-impact version.</p>`,
    // ----- Mental wellness: stress techniques -----
    "time-management": `<p>Try the "one thing" rule: each morning pick a single most-important task and start there. Pair it with 25-minute focus blocks and short breaks, and an overwhelming week quickly becomes a series of calm, doable wins.</p>`,
    "the-4-7-8-breath": `<p>Breathe in through your nose for 4 seconds, hold for 7, then exhale slowly through your mouth for 8. The long out-breath is the key — it nudges your nervous system out of "fight or flight."</p><p>Repeat four cycles. If you feel light-headed, simply return to normal breathing and go gentler next time.</p>`,
    "movement-breaks": `<p>You don't need a workout — just interrupt the sitting. A lap of the room, a few shoulder rolls, or ten star-jumps between tasks clears mental fog and releases tension your body has been quietly holding.</p><p>Set a reminder to move once an hour; your focus and posture will both thank you.</p>`,
    "sleep-hygiene": `<p>Anchor a steady wake-up time, dim the lights an hour before bed, and keep screens out of arm's reach. A cool, dark, quiet room does most of the work for you.</p><p>Rested minds handle stress far more kindly — protecting sleep is one of the highest-return wellness habits there is.</p>`,
    "talking-it-out": `<p>Saying a worry out loud shrinks it. Sharing with a friend, mentor, or counsellor helps you untangle your thoughts and reminds you that you're not carrying it alone.</p><p>If things feel heavy, our free and confidential counselling line is always here — reaching out is a sign of strength, not weakness.</p>`,
    "digital-detox": `<p>Set gentle limits on doom-scrolling and turn off non-essential notifications. Even a short, screen-free pause each day gives your attention room to breathe and reset.</p><p>Try a "no phone for the first 30 minutes" rule in the morning and notice how much calmer the day starts.</p>`,
    // ----- Nutrition: recipes -----
    "avocado-toast": `<p><b>Method:</b> toast the bread, mash the avocado with a squeeze of lemon, a pinch of salt and chilli flakes, then pile it on and scatter over the seeds. Ready in about five minutes.</p><p><b>Make it a meal:</b> add a poached egg or a few cherry tomatoes for extra protein and colour.</p>`,
    "overnight-oats": `<p><b>Method:</b> stir the oats, milk and yoghurt in a jar, top with fruit and a drizzle of honey, then refrigerate overnight. Grab and go in the morning — no cooking at all.</p><p><b>Swap ideas:</b> peanut butter, grated apple and cinnamon, or frozen berries all work beautifully.</p>`,
    "buddha-bowl": `<p><b>Method:</b> start with a base of cooked rice or quinoa, add roasted or raw veg and a tin of chickpeas, then finish with a tahini or yoghurt dressing. It's the balanced plate in a bowl.</p><p><b>Batch tip:</b> cook the grains and roast a tray of veg at the weekend, then assemble fresh bowls all week.</p>`,
    "berry-smoothie": `<p><b>Method:</b> blend the frozen berries, banana, milk and a spoon of oats or peanut butter until smooth. Breakfast you can drink on the walk out the door.</p><p><b>Budget tip:</b> frozen fruit is cheaper, lasts for weeks and is picked at peak ripeness — no waste, no fuss.</p>`
  };
  function infoKey(str) {
    return (str || "").toLowerCase().replace(/&amp;|&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function membershipHref() {
    return location.pathname.includes("/pages/") ? "membership.html" : "pages/membership.html";
  }
  function initInfoPopups() {
    const cards = $$("article.card").filter(card =>
      !card.hasAttribute("data-media-src") &&
      !card.classList.contains("article-card") &&
      !card.querySelector("input,select,textarea,button,form,[data-inc],.counter-btn,.progress,.ring,.mood,.chip,[data-carousel]") &&
      card.querySelector("h2,h3,h4")
    );
    cards.forEach(card => {
      const titleEl = card.querySelector("h2,h3,h4");
      const title = titleEl ? titleEl.textContent.trim() : "More information";
      card.classList.add("info-card");
      if (!card.getAttribute("role")) card.setAttribute("role", "button");
      if (!card.hasAttribute("tabindex")) card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", "More info: " + title);
      // add a visible "More info" cue if the card has no existing link cue
      if (!card.querySelector(".info-more, .card-link")) {
        const host = card.querySelector(".body") || card;
        const cue = document.createElement("span");
        cue.className = "info-more";
        cue.innerHTML = "More info " + iconSVG("compass");
        host.appendChild(cue);
      }
      const open = () => openInfoPopup(card, title);
      card.addEventListener("click", e => { if (!e.target.closest("a,button")) open(); });
      card.addEventListener("keydown", e => {
        if ((e.key === "Enter" || e.key === " ") && !e.target.closest("a,button")) { e.preventDefault(); open(); }
      });
    });
  }
  function openInfoPopup(card, title) {
    const clone = card.cloneNode(true);
    clone.querySelectorAll("a, button, .card-link, .center-btns, .info-more, .card-ic").forEach(el => el.remove());
    const img = clone.querySelector("img");
    const imgHtml = img ? `<img class="ws-info-hero" src="${img.getAttribute("src")}" alt="">` : "";
    const badges = Array.from(clone.querySelectorAll(".badge")).map(b => b.outerHTML).join("");
    const bodyRoot = clone.querySelector(".body") || clone;
    bodyRoot.querySelectorAll("img, .badge, .recipe-tags").forEach(el => el.remove());
    const heading = bodyRoot.querySelector("h1,h2,h3,h4");
    if (heading) heading.remove();
    const content = bodyRoot.innerHTML.trim();
    const extra = INFO_EXTRA[infoKey(title)] || "";
    const actions = card.hasAttribute("data-register")
      ? `<div class="ws-info-actions"><a class="btn btn-primary" href="${membershipHref()}">Become a member →</a></div>` : "";
    openModal(
      imgHtml +
      `<div class="ws-info-body">` +
        (badges ? `<div class="ws-info-badges">${badges}</div>` : "") +
        `<h2>${title}</h2>` +
        content + extra + actions +
      `</div>`,
      "is-info"
    );
  }

  /* 16. MISC --------------------------------------------------------------- */
  function initMisc() {
    $$("[data-year]").forEach(el => (el.textContent = new Date().getFullYear()));
  }

  /* BOOT ------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    hydrateIcons();
    initEmail();
    initTheme(); initNav(); initScrollFX(); initCarousels(); initAccordion();
    initCountdowns(); initForms(); initFitness(); initMood(); initQuiz();
    initCalculators(); initChallenge(); initDashboard(); initGallery(); initParallax();
    initMediaPopups(); initArticles(); initInfoPopups(); initMisc();
  });
})();

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

  /* 1. TOAST --------------------------------------------------------------- */
  let toastEl, toastTimer;
  function toast(msg, icon = "✅") {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
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
    $$(".theme-toggle").forEach(b => (b.textContent = theme === "dark" ? "☀️" : "🌙"));
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
        entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
      }, { threshold: 0.12 });
      items.forEach(el => io.observe(el));
    } else items.forEach(el => el.classList.add("in"));

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
        if (diff <= 0) { el.innerHTML = '<p class="big" style="color:var(--green-dark)">🎉 The event is live now!</p>'; clearInterval(t); return; }
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
        if (allOk) {
          if (success) { success.style.display = "flex"; }
          toast(form.dataset.successMsg || "Submitted successfully! 🎉", "🎉");
          form.reset();
          fields.forEach(f => f.classList.remove("valid", "invalid"));
          if (success) setTimeout(() => (success.style.display = "none"), 6000);
        } else {
          toast("Please fix the highlighted fields.", "⚠️");
          const firstBad = $(".field.invalid", form);
          firstBad?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    });

    // simple newsletter forms
    $$("form[data-newsletter]").forEach(form => form.addEventListener("submit", e => {
      e.preventDefault();
      const input = form.querySelector("input");
      if (validators.email(input.value)) { toast("You're subscribed! Check your inbox 📬", "📬"); form.reset(); }
      else toast("Please enter a valid email.", "⚠️");
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
      if (!goal || !level) { toast("Pick a goal and an activity level first.", "⚠️"); return; }
      const list = workoutDB[goal][level];
      const count = time <= 15 ? 2 : time <= 30 ? 3 : 4;
      const picks = list.slice(0, count);
      out.innerHTML = `
        <h3>🏋️ Your ${level} ${goal.replace("weightloss","weight-loss")} plan (${time} min)</h3>
        <p class="muted">Warm up 5 minutes, then complete:</p>
        <ul class="check-list">${picks.map(p => `<li>${p}</li>`).join("")}</ul>
        <p class="mt-2"><b>Cool down:</b> 5 minutes of light stretching. Stay hydrated! 💧</p>`;
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
    happy:   { icon: "😊", title: "Love that energy!", tips: ["Share your positivity — check in on a friend today", "Channel it into a 20-min workout", "Journal 3 things you're grateful for to lock in the feeling"] },
    calm:    { icon: "😌", title: "Beautifully balanced", tips: ["Great time for focused study — ride the calm", "Try a 10-min mindfulness session to deepen it", "Do some gentle stretching or a nature walk"] },
    neutral: { icon: "😐", title: "Let's lift things up", tips: ["A short walk outside can boost your mood fast", "Listen to an upbeat playlist for 10 minutes", "Drink some water and have a healthy snack"] },
    stressed:{ icon: "😔", title: "Let's ease the pressure", tips: ["Try the 4-7-8 breathing exercise (breathe in 4s, hold 7s, out 8s)", "Break big tasks into small 25-min focus blocks", "Talk to someone — the APU counselling service is free & confidential"] }
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
        <h3>${data.icon} ${data.title}</h3>
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
      if (answered < questions.length) { toast(`Please answer all ${questions.length} questions.`, "⚠️"); return; }
      const max = questions.length * 4;
      const pct = Math.round(score / max * 100);
      let verdict, tips;
      if (pct >= 80) { verdict = "🌟 Wellness Champion"; tips = "Fantastic! Your habits are excellent. Keep the momentum and inspire others."; }
      else if (pct >= 60) { verdict = "💪 Doing Great"; tips = "Strong foundation! Fine-tune your weakest area — often sleep or hydration."; }
      else if (pct >= 40) { verdict = "🌱 Room to Grow"; tips = "You're on the path. Pick ONE habit this week — small steps compound fast."; }
      else { verdict = "🧭 Time for a Reset"; tips = "No judgement! Start tiny: an early night, a water bottle, a 10-min walk."; }
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
      out.innerHTML = `<h3>💧 ${litres.toFixed(1)} litres / day</h3>
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
      out.innerHTML = `<h3>🔥 ${tdee.toLocaleString()} kcal / day</h3>
        <p>Maintenance estimate. For weight loss aim ~${(tdee-400).toLocaleString()} kcal; to build muscle ~${(tdee+300).toLocaleString()} kcal.</p>`;
      out.classList.add("show");
    });
  }

  /* 13. DAILY CHALLENGE ---------------------------------------------------- */
  const challenges = [
    { ic: "💧", t: "Drink 8 glasses of water today", pts: 20 },
    { ic: "🚶", t: "Walk 5,000 steps", pts: 25 },
    { ic: "🧘", t: "Meditate for 5 minutes", pts: 15 },
    { ic: "🤸", t: "Do a 10-minute stretch routine", pts: 15 },
    { ic: "🥗", t: "Eat 3 servings of vegetables", pts: 20 },
    { ic: "😴", t: "Sleep at least 7 hours tonight", pts: 25 },
    { ic: "📵", t: "Take a 1-hour screen break", pts: 15 },
    { ic: "🙏", t: "Write down 3 things you're grateful for", pts: 15 },
    { ic: "🌞", t: "Get 15 minutes of sunlight", pts: 15 },
    { ic: "📞", t: "Check in with a friend or family member", pts: 20 }
  ];
  function initChallenge() {
    const box = $("#challengeBox");
    if (!box) return;
    const btn = $("#challengeNew");
    const done = $("#challengeDone");
    function render(ch) {
      $("#challengeIcon", box) && ($("#challengeIcon", box).textContent = ch.ic);
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
      toast("Challenge complete! Points added 🎉", "🏆");
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
      if (p.water < 8) list.push("💧 Drink " + (8 - p.water) + " more glass(es) of water");
      if (p.steps < 8000) list.push("🚶 Walk " + (8000 - p.steps).toLocaleString() + " more steps");
      if (p.mind < 3) list.push("🧘 Do " + (3 - p.mind) + " more mindfulness session(s)");
      if (!list.length) list.push("🌟 All goals hit — you're crushing it today!");
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
      if (amt > 0) toast("Logged! Keep it up 💪", "✅");
    }));
    $("#dashReset")?.addEventListener("click", () => {
      if (confirm("Reset today's progress? (Points & streak are kept)")) {
        const p = getProfile(); p.water = 0; p.steps = 0; p.mind = 0; saveProfile(p); renderDashboard();
        toast("Today's trackers reset.", "🔄");
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

  /* 16. MISC --------------------------------------------------------------- */
  function initMisc() {
    $$("[data-year]").forEach(el => (el.textContent = new Date().getFullYear()));
  }

  /* BOOT ------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    initTheme(); initNav(); initScrollFX(); initCarousels(); initAccordion();
    initCountdowns(); initForms(); initFitness(); initMood(); initQuiz();
    initCalculators(); initChallenge(); initDashboard(); initGallery(); initMisc();
  });
})();

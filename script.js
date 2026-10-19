/* Synq. – Interaktionen & Effekte */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Navigation, Fortschritt, Nach-oben ---------- */
  const header = $("header.nav"), bar = $(".progress"), toTop = $(".to-top");
  const onScroll = () => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    header.classList.toggle("scrolled", y > 20);
    bar.style.setProperty("--p", max > 0 ? y / max : 0);
    toTop.classList.toggle("show", y > innerHeight * 1.2);
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));

  const burger = $(".burger");
  const setMenu = (open) => {
    document.body.classList.toggle("nav-open", open);
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
  };
  burger.addEventListener("click", () => setMenu(!document.body.classList.contains("nav-open")));
  $$("nav a").forEach(a => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

  const links = new Map($$("nav a").map(a => [a.getAttribute("href").slice(1), a]));
  const secObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      let id = en.target.id;
      if (id === "partner") id = "ressourcen";
      links.forEach(a => a.classList.remove("active"));
      links.get(id)?.classList.add("active");
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach(s => secObs.observe(s));

  /* ---------- Reveal & Zähler ---------- */
  const countUp = (el) => {
    const end = +el.dataset.count;
    if (reduce) { el.textContent = end.toLocaleString("de-AT"); return; }
    const t0 = performance.now(), dur = 1400;
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(end * e).toLocaleString("de-AT");
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const revObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      $$("[data-count]", en.target).forEach(countUp);
      if (en.target.matches("[data-count]")) countUp(en.target);
      revObs.unobserve(en.target);
    });
  }, { threshold: .12, rootMargin: "0px 0px -6% 0px" });
  $$("[data-reveal]").forEach(el => revObs.observe(el));
  $$(".stats [data-count]").forEach(el => setTimeout(() => countUp(el), 900));
  // Tabellen-Balken im Risiko-Table
  const tblObs = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { $$(".rf", en.target).forEach(r => r.classList.add("in")); tblObs.unobserve(en.target); } }), { threshold: .2 });
  $$("#risiken .table-wrap").forEach(t => tblObs.observe(t));

  /* ---------- Spotlight auf Karten ---------- */
  if (matchMedia("(hover: hover)").matches) {
    document.addEventListener("pointermove", e => {
      const c = e.target.closest?.(".card, .goal, .member, .pf, .crit");
      if (!c) return;
      const r = c.getBoundingClientRect();
      c.style.setProperty("--mx", `${e.clientX - r.left}px`);
      c.style.setProperty("--my", `${e.clientY - r.top}px`);
    }, { passive: true });
  }

  /* ---------- Hero-Wellen (Canvas) ---------- */
  const waves = $("#waves");
  if (waves) {
    const ctx = waves.getContext("2d");
    let w, h, dpr, t = 0, mx = .5, my = .5, running = true, raf;
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = waves.clientWidth; h = waves.clientHeight;
      waves.width = w * dpr; waves.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const lines = [
      { c: "255,90,54", a: .55, amp: 56, f: .0062, s: .9, off: 0 },
      { c: "255,179,71", a: .28, amp: 40, f: .0081, s: 1.3, off: 1.7 },
      { c: "63,193,201", a: .42, amp: 48, f: .0049, s: .7, off: 3.1 },
      { c: "63,193,201", a: .18, amp: 70, f: .0035, s: .5, off: 4.4 },
      { c: "237,240,245", a: .08, amp: 30, f: .011, s: 1.6, off: 2.2 },
    ];
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const base = h * (w > 960 ? .72 : .82);
      lines.forEach((L, i) => {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 4) {
          const nx = x / w;
          // Dämpfung nach rechts: die Kammer "schluckt" den Schall
          const damp = w > 960 ? Math.max(.08, 1 - Math.pow(Math.max(0, nx - .42) / .5, 1.4)) : 1 - nx * .5;
          const near = Math.exp(-Math.pow((nx - mx) * 4, 2)) * 26 * (1 - my);
          const y = base + i * 7 +
            Math.sin(x * L.f + t * L.s + L.off) * (L.amp + near) * damp +
            Math.sin(x * L.f * 2.3 - t * L.s * .7) * L.amp * .25 * damp;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${L.c},${L.a})`;
        ctx.lineWidth = i === 0 ? 2 : 1.2;
        ctx.stroke();
      });
    };
    const loop = () => { t += .018; draw(); if (running) raf = requestAnimationFrame(loop); };
    resize(); addEventListener("resize", resize);
    $(".hero").addEventListener("pointermove", e => { mx = e.clientX / w; my = e.clientY / h; }, { passive: true });
    if (reduce) draw();
    else {
      new IntersectionObserver(([en]) => {
        running = en.isIntersecting;
        cancelAnimationFrame(raf);
        if (running) loop();
      }).observe(waves);
    }
  }

  /* ---------- dB-Visualisierung (20 dB = Faktor 10 in der Amplitude) ---------- */
  const db = $("#dbViz");
  if (db) {
    const ctx = db.getContext("2d");
    let w, h, t = 0, run = false, raf;
    const resize = () => { const d = Math.min(devicePixelRatio || 1, 2); w = db.clientWidth; h = db.clientHeight; db.width = w * d; db.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    const noise = (x, k) => Math.sin(x * .09 + k) * .5 + Math.sin(x * .23 - k * 1.7) * .3 + Math.sin(x * .51 + k * 2.3) * .2;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const mid = h / 2, half = w / 2;
      [["255,90,54", 1, 0, half - 8], ["63,193,201", .1, half + 8, w]].forEach(([c, g, x0, x1]) => {
        ctx.beginPath();
        for (let x = x0; x <= x1; x += 2) {
          const y = mid + noise(x, t) * (h * .38) * g;
          x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${c},.95)`; ctx.lineWidth = 2; ctx.stroke();
      });
    };
    const loop = () => { t += .06; draw(); if (run) raf = requestAnimationFrame(loop); };
    resize(); addEventListener("resize", () => { resize(); draw(); });
    if (reduce) draw();
    else new IntersectionObserver(([en]) => { run = en.isIntersecting; cancelAnimationFrame(raf); if (run) loop(); else draw(); }).observe(db);
  }

  /* ---------- 3D-Kammer ---------- */
  const scene = $("#scene"), stage = $("#stage");
  if (scene) {
    const btns = $$(".chamber-controls button"), label = $("#chamberState"), cap = $("#chamberCaption");
    const texts = {
      built: ["aufgebaut", "Einsatzbereit für störungsarme Aufnahmen"],
      exploded: ["zerlegt", "Rahmen, Boden, Wände und Decke als einzelne Module"],
      stored: ["verstaut", "Gekennzeichnete Module, platzsparend gestapelt"],
    };
    const setState = (s) => {
      scene.classList.toggle("exploded", s === "exploded");
      scene.classList.toggle("stored", s === "stored");
      btns.forEach(b => b.setAttribute("aria-pressed", b.dataset.state === s));
      label.textContent = texts[s][0]; cap.textContent = texts[s][1];
    };
    btns.forEach(b => b.addEventListener("click", () => { setState(b.dataset.state); auto = false; clearInterval(cycle); }));

    let ry = -35, vel = 0, drag = false, lastX = 0, auto = true;
    stage.addEventListener("pointerdown", e => { drag = true; lastX = e.clientX; stage.setPointerCapture(e.pointerId); });
    stage.addEventListener("pointermove", e => { if (!drag) return; const dx = e.clientX - lastX; lastX = e.clientX; vel = dx * .5; ry += vel; });
    const end = () => { drag = false; };
    stage.addEventListener("pointerup", end); stage.addEventListener("pointercancel", end);
    const spin = () => {
      if (!drag) { vel *= .94; ry += vel + (reduce ? 0 : .12); }
      scene.style.setProperty("--ry", `${ry}deg`);
      requestAnimationFrame(spin);
    };
    spin();
    // Intro: zerlegt -> aufgebaut, danach automatischer Zyklus bis zur ersten Interaktion
    let cycle;
    if (!reduce) {
      setState("exploded");
      setTimeout(() => setState("built"), 900);
      const order = ["built", "exploded", "stored"]; let k = 0;
      cycle = setInterval(() => { if (!auto) return; k = (k + 1) % 3; setState(order[k]); }, 4200);
      stage.addEventListener("pointerdown", () => { auto = false; }, { once: true });
    }
  }

  /* ---------- Ziel-Tabs ---------- */
  const tabs = $$(".tab"), pill = $(".tab-pill"), toggleAll = $(".toggle-all");
  const movePill = (tab) => {
    pill.style.width = `${tab.offsetWidth}px`;
    pill.style.transform = `translateX(${tab.offsetLeft}px)`;
    pill.className = `tab-pill ${tab.dataset.kind}`;
  };
  const activate = (tab, focus) => {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
      const p = $("#" + t.getAttribute("aria-controls"));
      p.hidden = !on; p.classList.toggle("show", on);
    });
    movePill(tab);
    toggleAll.style.visibility = tab.dataset.kind === "non" ? "hidden" : "visible";
    syncToggle();
    if (focus) tab.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => activate(t));
    t.addEventListener("keydown", e => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      activate(tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length], true);
    });
  });
  const activePanel = () => $(".panel:not([hidden])");
  const syncToggle = () => {
    const ds = $$("details.goal", activePanel());
    const allOpen = ds.length && ds.every(d => d.open);
    toggleAll.textContent = allOpen ? "Alle zuklappen" : "Alle aufklappen";
  };
  toggleAll.addEventListener("click", () => {
    const ds = $$("details.goal", activePanel()), open = !ds.every(d => d.open);
    ds.forEach(d => d.open = open); syncToggle();
  });
  $$("details.goal").forEach(d => d.addEventListener("toggle", syncToggle));
  addEventListener("resize", () => movePill($(".tab[aria-selected=true]")));
  document.fonts?.ready.then(() => movePill($(".tab[aria-selected=true]")));
  activate(tabs[0]);

  /* ---------- Risikomatrix ---------- */
  const risks = window.SYNQ_RISKS || [], svg = $("#riskMatrix"), detail = $("#riskDetail");
  if (svg && risks.length) {
    const NS = "http://www.w3.org/2000/svg";
    const X0 = 92, Y0 = 16, W = 410, H = 340;
    const px = v => X0 + v * W, py = v => Y0 + (1 - v) * H;
    const el = (n, a, p = svg) => { const e = document.createElementNS(NS, n); Object.entries(a).forEach(([k, v]) => e.setAttribute(k, v)); p.appendChild(e); return e; };
    const poly = (pts, cls) => el("polygon", { points: pts.map(([x, y]) => `${px(x)},${py(y)}`).join(" "), class: cls });
    poly([[0, 0], [.74, 0], [0, .74]], "zone-c");
    poly([[.74, 0], [1, 0], [1, .26], [.26, 1], [0, 1], [0, .74]], "zone-b");
    poly([[.26, 1], [1, 1], [1, .26]], "zone-a");
    [1 / 3, 2 / 3].forEach(v => { el("line", { x1: px(v), x2: px(v), y1: py(0), y2: py(1), class: "grid" }); el("line", { x1: px(0), x2: px(1), y1: py(v), y2: py(v), class: "grid" }); });
    el("rect", { x: X0, y: Y0, width: W, height: H, fill: "none", stroke: "var(--line-2)", "stroke-width": 1.5, rx: 4 });
    [["A", .82, .86], ["B", .36, .62], ["C", .14, .16]].forEach(([t, x, y]) => { const e = el("text", { x: px(x), y: py(y), class: "zl", "text-anchor": "middle" }); e.textContent = t; });
    ["niedrig", "mittel", "hoch"].forEach((t, i) => {
      const x = el("text", { x: px(i / 3 + 1 / 6), y: py(0) + 20, class: "ax", "text-anchor": "middle" }); x.textContent = t;
      const y = el("text", { x: X0 - 10, y: py(i / 3 + 1 / 6) + 4, class: "ax", "text-anchor": "end" }); y.textContent = t;
    });
    const xt = el("text", { x: px(.5), y: py(0) + 44, class: "ax-t", "text-anchor": "middle" }); xt.textContent = "Schadensausmaß (A) →";
    const yt = el("text", { x: 16, y: py(.5), class: "ax-t", "text-anchor": "middle", transform: `rotate(-90 16 ${py(.5)})` }); yt.textContent = "Eintrittswahrscheinlichkeit (P) →";

    const zoneOf = r => { const s = r.a / 100 + r.p / 100; return s >= 1.26 ? "A" : s <= .74 ? "C" : "B"; };
    const dots = new Map();
    const rows = new Map($$("#risiken tbody tr").map(tr => [+tr.dataset.risk, tr]));
    // leichte Entzerrung überlappender Punkte (1 & 4)
    const nudge = { 4: [-6, 0], 1: [6, 0] };
    risks.forEach((r, i) => {
      const g = el("g", { class: "dot", tabindex: 0, role: "button", "aria-label": `Risiko ${r.n}: ${r.t}`, style: `--d:${i}` });
      const [dx, dy] = nudge[r.n] || [0, 0];
      const cx = px(r.a / 100) + dx, cy = py(r.p / 100) + dy;
      el("circle", { cx, cy, r: 18, class: "halo" }, g);
      el("circle", { cx, cy, r: 13, class: "c" }, g);
      const tx = el("text", { x: cx, y: cy }, g); tx.textContent = r.n;
      g.addEventListener("click", () => select(r.n));
      g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(r.n); } });
      g.addEventListener("mouseenter", () => rows.get(r.n)?.classList.add("hot"));
      g.addEventListener("mouseleave", () => rows.get(r.n)?.classList.remove("hot"));
      dots.set(r.n, g);
    });
    rows.forEach((tr, n) => {
      tr.addEventListener("mouseenter", () => dots.get(n)?.classList.add("hot"));
      tr.addEventListener("mouseleave", () => { if (n !== current) dots.get(n)?.classList.remove("hot"); });
      tr.addEventListener("click", () => { select(n); if (innerWidth < 960) detail.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); });
    });
    let current = 0;
    const select = (n) => {
      current = n;
      const r = risks.find(x => x.n === n);
      dots.forEach((g, k) => g.classList.toggle("hot", k === n));
      rows.forEach((tr, k) => tr.classList.toggle("hot", k === n));
      detail.innerHTML = `
        <div class="rd-num">#${r.n}</div>
        <h3>${r.t}</h3>
        <p style="color:var(--soft);font-size:.92rem">${r.d}</p>
        <div class="rd-meta">
          <div><b>${r.p}</b><span>P</span></div><div><b>${r.a}</b><span>A</span></div>
          <div><b>${r.p * r.a}</b><span>RF</span></div><div><b>${r.w}</b><span>WOCHEN</span></div>
        </div>
        <p class="rd-m"><b style="color:var(--text)">Maßnahmen:</b> ${r.m}</p>
        <p class="hint">Bereich ${zoneOf(r)} · Kosten der Maßnahme: ${r.c}</p>`;
    };
    select(risks.reduce((a, b) => (b.p * b.a > a.p * a.a ? b : a)).n);
  }

  /* ---------- Meilenstein-Zeitstrahl ---------- */
  const tl = $("#timeline");
  if (tl) {
    const start = new Date("2026-09-01"), end = new Date("2027-05-01"), now = new Date();
    const pos = d => Math.max(0, Math.min(1, (d - start) / (end - start))) * 100;
    const items = $$("#msList .ms-item");
    let nextFound = false;
    items.forEach((li) => {
      const d = new Date(li.dataset.date + "T23:59:59");
      const st = $(".st", li);
      if (d < now) { li.classList.add("done"); st.textContent = "fällig"; }
      else if (!nextFound) { li.classList.add("next"); st.textContent = "als Nächstes"; nextFound = true; }
    });
    const fill = $(".tl-fill", tl), today = $(".tl-today", tl);
    today.style.left = "0%";
    const go = () => { fill.style.width = `${pos(now)}%`; today.style.left = `${pos(now)}%`; today.firstChild.textContent = "Heute · " + now.toLocaleDateString("de-AT", { day: "numeric", month: "short" }); };
    new IntersectionObserver(([en], o) => { if (en.isIntersecting) { go(); o.disconnect(); } }, { threshold: .3 }).observe(tl);
    // nummerierte Marker für jeden Meilenstein auf der Spur
    items.forEach((li, i) => {
      const m = document.createElement("span");
      m.className = "tl-mark" + (li.classList.contains("next") ? " next" : li.classList.contains("done") ? " done" : "");
      m.textContent = i + 1;
      m.title = $(".date", li).textContent;
      m.style.left = pos(new Date(li.dataset.date)) + "%";
      $(".tl-track", tl).appendChild(m);
    });
    // Monatsticks
    const months = ["Sep.", "Okt.", "Nov.", "Dez.", "Jän.", "Feb.", "März", "Apr.", "Mai"];
    for (let k = 1; k < 8; k++) {
      const d = new Date(2026, 8 + k, 1), s = document.createElement("span");
      s.textContent = months[k];
      s.style.cssText = `position:absolute;top:18px;transform:translateX(-50%);font-family:var(--mono);font-size:.62rem;color:var(--muted);left:${pos(d)}%`;
      $(".tl-track", tl).appendChild(s);
    }
  }
})();

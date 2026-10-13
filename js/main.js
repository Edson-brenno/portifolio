/* =========================================================
   Edson Brenno — Portfolio interactions
   Progressive enhancement: everything is readable without JS.
   GSAP / ScrollTrigger / Lenis add motion when available.
   ========================================================= */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  const motion = hasGSAP && !prefersReduced;

  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (motion && typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  // Anchor links
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(target, { offset: id === "#top" ? 0 : -60, duration: 1.6 });
      else target.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
    });
  });

  /* ---------- Preloader ---------- */
  const loader = $("#loader");
  const loaderCount = $("#loaderCount");
  const loaderBar = $("#loaderBar");

  function runLoader() {
    return new Promise((resolve) => {
      if (prefersReduced || !loader) { resolve(); return; }
      const minTime = 1500;
      const start = performance.now();
      let loaded = document.readyState === "complete";
      window.addEventListener("load", () => (loaded = true), { once: true });
      const tick = (now) => {
        const t = Math.min(1, (now - start) / minTime);
        const eased = 1 - Math.pow(1 - t, 3);
        const pct = Math.round(eased * (loaded ? 100 : 92));
        loaderCount.textContent = pct;
        loaderBar.style.width = pct + "%";
        if (t < 1 || (!loaded && now - start < 4000)) requestAnimationFrame(tick);
        else { loaderCount.textContent = 100; loaderBar.style.width = "100%"; resolve(); }
      };
      requestAnimationFrame(tick);
    });
  }

  function hideLoader() {
    document.body.classList.remove("is-loading");
    if (!loader) return;
    if (motion) {
      gsap.to(loader, { yPercent: -100, duration: 1.1, ease: "expo.inOut", onComplete: () => loader.remove() });
    } else {
      loader.remove();
    }
  }

  /* ---------- Hero intro ---------- */
  function heroIntro() {
    if (!motion) return;
    const tl = gsap.timeline({ delay: 0.35 });
    tl.from("[data-hero-line]", { yPercent: 115, rotate: 3, duration: 1.3, ease: "expo.out", stagger: 0.09 })
      .from("[data-hero]", { y: 30, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.1 }, "-=0.9")
      .from("[data-hero-visual] .hero__frame", { clipPath: "inset(100% 0% 0% 0% round 200px 200px 22px 22px)", duration: 1.5, ease: "expo.inOut" }, 0.1)
      .from("[data-hero-visual] img", { scale: 1.4, duration: 1.8, ease: "expo.out" }, 0.4)
      .from("[data-float]", { y: 30, opacity: 0, scale: 0.9, duration: 0.9, ease: "back.out(1.7)", stagger: 0.12 }, "-=1")
      .from("#nav", { y: -30, opacity: 0, duration: 0.9, ease: "expo.out" }, "-=1.2");

    // Idle float
    $$("[data-float]").forEach((el, i) => {
      gsap.to(el, { y: i % 2 ? 10 : -10, duration: 2.6 + i * 0.4, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 2 + i * 0.2 });
    });

    // Parallax on scroll
    gsap.to(".hero__frame img", { yPercent: 10, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero__content", { yPercent: -12, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  }

  /* ---------- Nav behaviour ---------- */
  const nav = $("#nav");
  const progressBar = $("#progressBar");
  let lastY = 0;
  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 40);
    const menuOpen = $("#mobileMenu").classList.contains("is-open");
    nav.classList.toggle("is-hidden", !menuOpen && y > lastY && y > 500);
    lastY = y;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Active link
  const navLinks = $$("[data-nav]");
  const sections = navLinks.map((l) => $(l.getAttribute("href"))).filter(Boolean);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        navLinks.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === "#" + en.target.id));
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((s) => io.observe(s));

  // Mobile menu
  const burger = $("#navBurger");
  const menu = $("#mobileMenu");
  function closeMenu() {
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Abrir menu");
    if (lenis) lenis.start();
  }
  burger.addEventListener("click", () => {
    const open = !menu.classList.contains("is-open");
    if (!open) return closeMenu();
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    burger.setAttribute("aria-expanded", "true");
    burger.setAttribute("aria-label", "Fechar menu");
    if (lenis) lenis.stop();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

  /* ---------- Custom cursor ---------- */
  const cursor = $("#cursor");
  const cursorLabel = $("#cursorLabel");
  if (isFinePointer && cursor && !prefersReduced) {
    let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    window.addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY; cursor.classList.add("is-visible"); }, { passive: true });
    document.addEventListener("mouseleave", () => cursor.classList.remove("is-visible"));
    const loop = () => {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
    $$("a, button, .services, .tags li").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
    });
    $$("[data-cursor]").forEach((el) => {
      el.addEventListener("mouseenter", () => { cursorLabel.textContent = el.dataset.cursor; cursor.classList.add("is-label"); });
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-label"));
    });
  }

  /* ---------- Magnetic buttons ---------- */
  if (isFinePointer && !prefersReduced) {
    $$(".magnetic").forEach((el) => {
      const strength = 0.3;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength;
        const y = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  }

  /* ---------- Spotlight + tilt cards ---------- */
  $$(".impact-card, .stack-card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.setProperty("--mx", x + "px");
      card.style.setProperty("--my", y + "px");
      if (isFinePointer && !prefersReduced && card.classList.contains("tilt")) {
        const rx = ((y / r.height) - 0.5) * -6;
        const ry = ((x / r.width) - 0.5) * 6;
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      }
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
  });

  /* ---------- Manifesto word-by-word ---------- */
  const manifesto = $("#manifestoText");
  if (manifesto) {
    const words = manifesto.textContent.trim().split(/\s+/);
    manifesto.innerHTML = words
      .map((w) => `<span class="word${["some.", "diferença.", "construo."].includes(w) ? " is-key" : ""}">${w}</span>`)
      .join(" ");
    if (motion) {
      gsap.to("#manifestoText .word", {
        opacity: 1, stagger: 0.05, ease: "none",
        scrollTrigger: { trigger: manifesto, start: "top 78%", end: "bottom 45%", scrub: 0.6 }
      });
    } else {
      $$("#manifestoText .word").forEach((w) => (w.style.opacity = 1));
    }
  }

  /* ---------- Counters ---------- */
  const counters = $$("[data-count]");
  function animateCount(el) {
    const target = +el.dataset.count;
    if (!motion) { el.textContent = target; return; }
    const obj = { v: 0 };
    gsap.to(obj, { v: target, duration: target > 10 ? 2 : 1.2, ease: "power3.out", onUpdate: () => (el.textContent = Math.round(obj.v)) });
  }
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { animateCount(en.target); countIO.unobserve(en.target); } });
  }, { threshold: 0.6 });
  counters.forEach((c) => countIO.observe(c));

  /* ---------- Generic reveals ---------- */
  function setupReveals() {
    if (!motion) return;
    gsap.utils.toArray(".section__head").forEach((head) => {
      gsap.from(head.children, { y: 40, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: head, start: "top 82%" } });
    });
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 88%",
      onEnter: (batch) => gsap.fromTo(batch, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: "expo.out", stagger: 0.1, overwrite: true }),
    });
    gsap.set("[data-reveal]", { opacity: 0 });

    // Chapters
    $$("[data-chapter]").forEach((ch) => {
      gsap.from(ch.querySelector(".chapter__card"), { x: 60, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: ch, start: "top 80%" } });
    });

    // Contact
    gsap.from(".contact__title", { y: 80, opacity: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".contact", start: "top 70%" } });
    gsap.from([".contact__lead", ".contact__actions", ".socials"], { y: 30, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.12, scrollTrigger: { trigger: ".contact", start: "top 60%" } });
  }

  /* ---------- Timeline ---------- */
  function setupTimeline() {
    const chapters = $$("[data-chapter]");
    if (motion) {
      gsap.to("#timelineProgress", { scaleY: 1, ease: "none", scrollTrigger: { trigger: "#timeline", start: "top 60%", end: "bottom 60%", scrub: true } });
      chapters.forEach((ch) => {
        ScrollTrigger.create({ trigger: ch, start: "top 60%", end: "bottom 60%", onToggle: (self) => ch.classList.toggle("is-active", self.isActive) });
      });
    } else {
      $("#timelineProgress").style.transform = "scaleY(1)";
      const cio = new IntersectionObserver((ens) => ens.forEach((en) => en.target.classList.toggle("is-active", en.isIntersecting)), { rootMargin: "-40% 0px -40% 0px" });
      chapters.forEach((c) => cio.observe(c));
    }
  }

  /* ---------- Architecture diagram ---------- */
  const archInfo = {
    client: { k: "// camada de entrada", t: "Clientes", d: "Aplicações web, mobile e integrações de parceiros. Todos entram pelo mesmo lugar — nunca direto nos serviços." },
    kong: { k: "// api gateway", t: "Kong Gateway", d: "Ponto de entrada único e seguro. Roteamento, rate limiting e isolamento de ambientes por cliente, antes de qualquer requisição tocar a regra de negócio." },
    auth: { k: "// segurança · python", t: "Auth Service", d: "Serviço central de autenticação em Python. Uma única fonte de verdade sobre identidade e permissões para todo o ecossistema." },
    services: { k: "// java · spring boot", t: "9 Microsserviços", d: "Arquitetados do zero, cada um autônomo com seu próprio banco. Código em camadas (Controller → Service → Repository → DTO), o que reduziu em 30% o tempo de manutenção." },
    fastapi: { k: "// python · fastapi", t: "API desacoplada", d: "Um novo endpoint independente do monolito, criado para integrar serviços sem acoplamento — a fundação da migração para microsserviços." },
    rabbit: { k: "// mensageria", t: "RabbitMQ", d: "Filas para processamento em background. Tarefas pesadas saem do caminho da requisição e a aplicação principal ganha fôlego." },
    celery: { k: "// workers assíncronos", t: "Celery", d: "Orquestra o processamento assíncrono e o envio em lotes — garante que milhares de registros entrem e se atualizem sem travar nada." },
    db: { k: "// persistência", t: "PostgreSQL", d: "Database-per-service, modelagem cuidadosa e segurança. Bulk loads otimizados que levaram a ingestão de 30 para 5 minutos." },
    esus: { k: "// fonte externa", t: "e-SUS", d: "Base nacional de dados de saúde. Cada novo dado inserido dispara automaticamente o pipeline — sincronização quase em tempo real." },
    etl: { k: "// event-driven etl", t: "Pipeline ETL", d: "Extração, transformação e carga orientadas a eventos, rodando em containers Docker em VPS Linux que eu mesmo provisiono e monitoro." },
  };
  const links = [
    ["client", "kong"], ["kong", "auth"], ["kong", "services"], ["kong", "fastapi"],
    ["services", "rabbit"], ["fastapi", "rabbit"], ["rabbit", "celery"], ["celery", "db"],
    ["services", "db"], ["esus", "etl"], ["etl", "celery"], ["auth", "db"],
  ];

  function setupArch() {
    const diagram = $("#archDiagram");
    const svg = $("#archLines");
    if (!diagram || !svg) return;
    const NS = "http://www.w3.org/2000/svg";
    const nodeEl = (k) => diagram.querySelector(`[data-node="${k}"]`);

    function draw() {
      svg.innerHTML = "";
      if (getComputedStyle(svg).display === "none") return;
      const d = diagram.getBoundingClientRect();
      links.forEach(([a, b], i) => {
        const A = nodeEl(a).getBoundingClientRect();
        const B = nodeEl(b).getBoundingClientRect();
        let x1, y1, x2, y2, path;
        if (Math.abs(A.left - B.left) < 30) {
          x1 = A.left + A.width / 2 - d.left; y1 = A.bottom - d.top;
          x2 = B.left + B.width / 2 - d.left; y2 = B.top - d.top;
          if (y2 < y1) { [y1, y2] = [A.top - d.top, B.bottom - d.top]; }
          path = `M${x1},${y1} L${x2},${y2}`;
        } else {
          x1 = A.right - d.left; y1 = A.top + A.height / 2 - d.top;
          x2 = B.left - d.left; y2 = B.top + B.height / 2 - d.top;
          const mx = (x1 + x2) / 2;
          path = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
        }
        const p = document.createElementNS(NS, "path");
        p.setAttribute("d", path);
        p.setAttribute("id", `link-${i}`);
        p.dataset.a = a; p.dataset.b = b;
        svg.appendChild(p);

        if (!prefersReduced) {
          const c = document.createElementNS(NS, "circle");
          c.setAttribute("r", "3");
          if (a === "esus" || b === "db" || a === "etl") c.classList.add("cool");
          const am = document.createElementNS(NS, "animateMotion");
          am.setAttribute("dur", (2.2 + Math.random() * 2).toFixed(2) + "s");
          am.setAttribute("repeatCount", "indefinite");
          am.setAttribute("begin", (Math.random() * 2).toFixed(2) + "s");
          const mp = document.createElementNS(NS, "mpath");
          mp.setAttribute("href", `#link-${i}`);
          am.appendChild(mp); c.appendChild(am); svg.appendChild(c);
        }
      });
    }

    const panel = $("#archPanel");
    const pk = $("#archKicker"), pt = $("#archPanelTitle"), pd = $("#archPanelText");
    function focus(key) {
      const info = archInfo[key];
      if (!info) return;
      diagram.classList.add("has-focus");
      $$("[data-node]", diagram).forEach((n) => n.classList.remove("is-active", "is-linked"));
      nodeEl(key).classList.add("is-active");
      $$("path", svg).forEach((p) => {
        const hot = p.dataset.a === key || p.dataset.b === key;
        p.classList.toggle("is-hot", hot);
        if (hot) nodeEl(p.dataset.a === key ? p.dataset.b : p.dataset.a).classList.add("is-linked");
      });
      pk.textContent = info.k; pt.textContent = info.t; pd.textContent = info.d;
      panel.classList.remove("is-updating"); void panel.offsetWidth; panel.classList.add("is-updating");
    }
    function blur() {
      diagram.classList.remove("has-focus");
      $$("[data-node]", diagram).forEach((n) => n.classList.remove("is-active", "is-linked"));
      $$("path", svg).forEach((p) => p.classList.remove("is-hot"));
    }
    $$("[data-node]", diagram).forEach((n) => {
      const key = n.dataset.node;
      n.addEventListener("mouseenter", () => focus(key));
      n.addEventListener("focus", () => focus(key));
      n.addEventListener("click", () => focus(key));
      n.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); focus(key); } });
    });
    diagram.addEventListener("mouseleave", blur);

    draw();
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);

    if (motion) {
      gsap.from(".arch__col > *", { y: 30, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.06, scrollTrigger: { trigger: diagram, start: "top 75%" }, onComplete: draw });
    }
  }

  /* ---------- Interlude ---------- */
  function setupInterlude() {
    if (!motion) return;
    gsap.fromTo(".interlude__media img", { yPercent: -8, scale: 1.15 }, { yPercent: 8, scale: 1, ease: "none", scrollTrigger: { trigger: ".interlude", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.from("[data-interlude-line]", { yPercent: 115, duration: 1.3, ease: "expo.out", stagger: 0.12, scrollTrigger: { trigger: ".interlude", start: "top 45%" } });
  }

  /* ---------- Life: horizontal scroll ---------- */
  function setupLife() {
    const track = $("#lifeTrack");
    const pin = $("#lifePin");
    if (!track || !pin) return;
    if (motion) {
      ScrollTrigger.matchMedia({
        "(min-width: 901px)": () => {
          const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
          const tween = gsap.to(track, {
            x: () => -distance(), ease: "none",
            scrollTrigger: { trigger: pin, start: "center center", end: () => "+=" + distance(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 }
          });
          $$(".life-card", track).forEach((card) => {
            gsap.from(card.querySelector(".life-card__body"), { y: 30, opacity: 0, duration: 0.8, ease: "expo.out", scrollTrigger: { trigger: card, containerAnimation: tween, start: "left 85%" } });
          });
          return () => tween.kill();
        }
      });
    }
    // Autoplay videos in view
    const vids = $$("video[data-autoplay]");
    const vio = new IntersectionObserver((ens) => {
      ens.forEach((en) => {
        const v = en.target;
        if (en.isIntersecting && !prefersReduced) { v.preload = "auto"; v.play().catch(() => {}); }
        else v.pause();
      });
    }, { threshold: 0.35 });
    vids.forEach((v) => vio.observe(v));
  }

  /* ---------- Strings (cello tuning: C2 G2 D3 A3) ---------- */
  function setupStrings() {
    const wrap = $("#strings");
    if (!wrap) return;
    const freqs = [65.41, 98.0, 146.83, 220.0];
    let ctx = null;
    const ensureCtx = () => {
      if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) ctx = new AC(); }
      if (ctx && ctx.state === "suspended") ctx.resume();
    };
    window.addEventListener("pointerdown", ensureCtx, { once: true });
    window.addEventListener("keydown", ensureCtx, { once: true });

    function play(f) {
      if (!ctx || ctx.state !== "running") return;
      const t = ctx.currentTime;
      const out = ctx.createGain();
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.setValueAtTime(2200, t); lp.frequency.exponentialRampToValueAtTime(400, t + 1.6);
      out.gain.setValueAtTime(0.0001, t);
      out.gain.exponentialRampToValueAtTime(0.18, t + 0.015);
      out.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      [1, 2, 3].forEach((h, i) => {
        const o = ctx.createOscillator();
        o.type = i === 0 ? "sawtooth" : "triangle";
        o.frequency.value = f * h;
        const g = ctx.createGain(); g.gain.value = [0.5, 0.25, 0.12][i];
        o.connect(g).connect(lp); o.start(t); o.stop(t + 2.3);
      });
      lp.connect(out).connect(ctx.destination);
    }
    $$("span", wrap).forEach((s) => {
      const pluck = () => {
        s.classList.remove("is-plucked"); void s.offsetWidth; s.classList.add("is-plucked");
        play(freqs[+s.dataset.note]);
      };
      s.addEventListener("pointerenter", pluck);
      s.addEventListener("pointerdown", () => { ensureCtx(); setTimeout(pluck, 10); });
    });
  }

  /* ---------- Copy email ---------- */
  const copyBtn = $("#copyEmail");
  const copyHint = $("#copyHint");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const email = copyBtn.dataset.email;
      try {
        await navigator.clipboard.writeText(email);
        copyBtn.classList.add("is-copied");
        copyHint.textContent = "copiado! ✓ te espero na caixa de entrada";
        setTimeout(() => { copyBtn.classList.remove("is-copied"); copyHint.textContent = "clique para copiar"; }, 2800);
      } catch {
        window.location.href = "mailto:" + email;
      }
    });
  }

  $("#year").textContent = new Date().getFullYear();

  /* ---------- Boot ---------- */
  setupStrings();
  runLoader().then(() => {
    hideLoader();
    if (lenis) lenis.start();
    heroIntro();
    setupReveals();
    setupTimeline();
    setupArch();
    setupInterlude();
    setupLife();
    if (hasGSAP) setTimeout(() => ScrollTrigger.refresh(), 300);
  });
})();

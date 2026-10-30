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

  /* ---------- i18n (PT / EN) ---------- */
  let currentLang = "pt";
  try {
    localStorage.removeItem("eb_lang");
    const urlLang = new URLSearchParams(window.location.search).get("lang");
    if (urlLang === "en" || urlLang === "pt") currentLang = urlLang;
  } catch (e) {}

  const i18n = {
    pt: {
      htmlLang: "pt-BR",
      title: "Edson Brenno — Engenheiro Back-End | Java, Python & Arquitetura de Sistemas",
      metaDesc: "Portfólio de Edson Brenno, desenvolvedor Back-End com 5 anos de experiência em Java, Python, microsserviços, ETL e arquitetura de sistemas escaláveis. Baseado na Bahia, Brasil.",
      skipLink: "Pular para o conteúdo",
      loaderCmd: '<span class="loader__prompt">$</span> ./contar-historia --autor="edson"',
      navLogoLabel: "Edson Brenno — início",
      navAria: "Navegação principal",
      nav: { trajetoria: "Trajetória", impacto: "Impacto", arquitetura: "Arquitetura", stack: "Stack", vida: "Além do código", contato: "Contato" },
      navCta: "Vamos conversar",
      burgerOpen: "Abrir menu",
      burgerClose: "Fechar menu",
      langSwitchAria: "Switch to English",
      heroEyebrow: '<span class="status-dot" aria-hidden="true"></span> Engenheiro Back-End · Bahia, Brasil',
      heroLines: ["Eu construo", "o que ninguém <em>vê</em>", "— e faz tudo", "funcionar."],
      heroLead: 'Oi, eu sou o <strong>Edson Brenno</strong>. Há 5 anos arquiteto APIs, microsserviços e pipelines de dados em <strong>Java</strong> e <strong>Python</strong> — transformando processos de meses em minutos.',
      heroCtaStory: 'Conheça minha história <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12l7 7 7-7"/></svg>',
      heroCtaCv: 'Baixar CV <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14"/></svg>',
      heroImgAlt: "Retrato de Edson Brenno sorrindo, de camiseta preta",
      heroChip3: '<span class="chip-dot"></span> 9 microsserviços em produção',
      heroCode: '<span class="c-key">SELECT</span> paixão<br/><span class="c-key">FROM</span> engenharia<br/><span class="c-key">WHERE</span> impacto &gt; <span class="c-num">0</span>;',
      scrollCueAria: "Rolar para baixo",
      scrollCueText: "role",
      manifestoEyebrow: "Prólogo",
      manifestoText: "Eu acredito que bom software é aquele que some. Ninguém percebe a fila que processa milhões de registros de madrugada, o gateway que protege cada requisição, o pipeline que entrega dados de saúde em um dia em vez de quatro meses. Mas é exatamente aí que as pessoas sentem a diferença. É isso que eu construo.",
      manifestoKeys: ["some.", "diferença.", "construo."],
      impactEyebrow: "Capítulo 01 — Impacto",
      impactTitle: "Números que contam <em>histórias</em>.",
      impactLead: "Cada métrica abaixo é uma equipe que voltou a ter tempo, um gestor que decidiu mais rápido, um cidadão melhor atendido.",
      impactCards: [
        { before: "antes: <s>4 meses</s>", unit: " dia", label: "para equipes de saúde acessarem os dados que precisam, com pipelines ETL automatizados.", tag: "Prefeitura de Mata de São João" },
        { before: "antes: <s>30+ dias</s>", unit: " dia", label: "para elaborar planos municipais, com as APIs centrais da plataforma de planejamento estratégico.", tag: "Zrn Tecnologias" },
        { before: "antes: <s>4 dias</s>", unit: " horas", label: "no ciclo de coleta de dados, com web scraping e ETL ponta a ponta.", tag: "TemMais Gestão" },
        { label: "mais rápido na ingestão no PostgreSQL — de 30 para 5 minutos com bulk load em memória.", tag: "Performance" },
        { label: "microsserviços autônomos arquitetados do zero, cada um com seu próprio banco.", tag: "Arquitetura" },
        { label: "no tempo de manutenção e depuração de erros críticos, com arquitetura em camadas.", tag: "Qualidade" }
      ],
      journeyEyebrow: "Capítulo 02 — Trajetória",
      journeyTitle: "Uma jornada de <em>problemas reais</em>.",
      journeyLead: "Eu não comecei escrevendo código bonito. Comecei resolvendo dores de verdade — e a arquitetura veio como consequência.",
      chapters: [
        {
          kicker: "09/2021 — 07/2024 · Mata de São João, BA",
          title: "O primeiro problema real",
          role: "Analista de Sistemas · <strong>Prefeitura de Mata de São João</strong>",
          story: "Equipes de saúde esperavam <strong>quatro meses</strong> para ter acesso a dados que deveriam guiar decisões diárias. Ali eu entendi que tecnologia é sobre pessoas. Construí pipelines ETL que reduziram essa espera para <strong>um dia</strong>.",
          list: [
            "Pipelines ETL automatizados com Python (Pandas, SQLAlchemy) e PostgreSQL.",
            "Entrega de pipelines de 3 dias para 1 dia, com POO e arquitetura de código reutilizável.",
            "Ingestão 83% mais rápida (30 → 5 min) com bulk load via <code>io.StringIO</code>, eliminando gargalos de I/O."
          ]
        },
        {
          kicker: "12/2021 — 07/2024 · Mata de São João, BA",
          title: "Automatizar o que é repetitivo",
          role: "Desenvolvedor Python · <strong>TemMais Gestão</strong>",
          story: "Paralelo à prefeitura, mergulhei no desenvolvimento de produtos. Coletar dados levava <strong>quatro dias</strong> de trabalho manual — eu automatizei para <strong>três horas</strong>.",
          list: [
            "Web scraping automatizado com fluxo ETL completo, da extração ao PostgreSQL.",
            "Sistemas escaláveis com arquitetura MVT do Django e separação clara de responsabilidades."
          ]
        },
        {
          badge: '<span class="status-dot" aria-hidden="true"></span> Agora',
          kicker: "07/2024 — atual · Dias d'Ávila, BA",
          title: "Arquitetar do zero",
          role: "Desenvolvedor de Software Pleno · <strong>Zrn Tecnologias</strong>",
          story: "Hoje sou responsável pela <strong>arquitetura e engenharia completa do ecossistema back-end</strong> — do planejamento e modelagem à segurança de bancos, orquestração em nuvem e observabilidade. Meu foco: uma <strong>Clean Architecture</strong> que permita à empresa crescer sem medo.",
          list: [
            "Plataforma com <strong>9 microsserviços</strong> em Java/Spring Boot, cada um com banco e ciclo próprios.",
            "<strong>API Gateway com Kong</strong> e serviço central de autenticação em Python: ponto de entrada único e seguro.",
            "APIs centrais da plataforma de planejamento estratégico: planos municipais de <strong>30+ dias para &lt;1 dia</strong>.",
            "API REST em <strong>FastAPI</strong> desacoplada do monolito — base da migração para microsserviços.",
            "<strong>RabbitMQ</strong> para filas e processamento em background, liberando a aplicação principal.",
            "Pipeline ETL do <strong>e-SUS</strong> orientado a eventos com Celery, em VPS Linux provisionadas por mim.",
            "CI/CD, Docker e observabilidade em tempo real para detectar falhas antes do usuário."
          ]
        },
        {
          title: "O próximo capítulo",
          story: 'Talvez a gente escreva juntos. <a href="#contato" class="link">Vamos conversar →</a>'
        }
      ],
      archEyebrow: "Capítulo 03 — Por dentro",
      archTitle: "Como eu penso <em>sistemas</em>.",
      archLead: "Uma visão simplificada do ecossistema que arquitetei na Zrn. Passe o mouse (ou toque) em cada peça para entender o papel dela.",
      archNodes: {
        client: { name: "Clientes", sub: "web · mobile · parceiros" },
        esus: { name: "e-SUS", sub: "fonte de dados" },
        kong: { name: "Kong Gateway", sub: "entrada única" },
        auth: { name: "Auth Service", sub: "Python" },
        etl: { name: "ETL Pipeline", sub: "event-driven" },
        services: { title: "9 microsserviços · Spring Boot", aria: "9 microsserviços Spring Boot" },
        fastapi: { name: "FastAPI", sub: "API desacoplada" },
        rabbit: { name: "RabbitMQ", sub: "filas · async" },
        celery: { name: "Celery", sub: "workers" },
        db: { name: "PostgreSQL", sub: "db por serviço" }
      },
      archDefault: {
        k: "// selecione uma peça",
        t: "O ecossistema",
        d: "Um ecossistema distribuído, desenhado para ser resiliente, observável e fácil de evoluir. Cada serviço é independente; a comunicação é segura e assíncrona sempre que possível.",
        pills: ["Clean Architecture", "Observabilidade", "CI/CD", "Docker"]
      },
      archInfo: {
        client: { k: "// camada de entrada", t: "Clientes", d: "Aplicações web, mobile e integrações de parceiros. Todos entram pelo mesmo lugar — nunca direto nos serviços." },
        kong: { k: "// api gateway", t: "Kong Gateway", d: "Ponto de entrada único e seguro. Roteamento, rate limiting e isolamento de ambientes por cliente, antes de qualquer requisição tocar a regra de negócio." },
        auth: { k: "// segurança · python", t: "Auth Service", d: "Serviço central de autenticação em Python. Uma única fonte de verdade sobre identidade e permissões para todo o ecossistema." },
        services: { k: "// java · spring boot", t: "9 Microsserviços", d: "Arquitetados do zero, cada um autônomo com seu próprio banco. Código em camadas (Controller → Service → Repository → DTO), o que reduziu em 30% o tempo de manutenção." },
        fastapi: { k: "// python · fastapi", t: "API desacoplada", d: "Um novo endpoint independente do monolito, criado para integrar serviços sem acoplamento — a fundação da migração para microsserviços." },
        rabbit: { k: "// mensageria", t: "RabbitMQ", d: "Filas para processamento em background. Tarefas pesadas saem do caminho da requisição e a aplicação principal ganha fôlego." },
        celery: { k: "// workers assíncronos", t: "Celery", d: "Orquestra o processamento assíncrono e o envio em lotes — garante que milhares de registros entrem e se atualizem sem travar nada." },
        db: { k: "// persistência", t: "PostgreSQL", d: "Database-per-service, modelagem cuidadosa e segurança. Bulk loads otimizados que levaram a ingestão de 30 para 5 minutos." },
        esus: { k: "// fonte externa", t: "e-SUS", d: "Base nacional de dados de saúde. Cada novo dado inserido dispara automaticamente o pipeline — sincronização quase em tempo real." },
        etl: { k: "// event-driven etl", t: "Pipeline ETL", d: "Extração, transformação e carga orientadas a eventos, rodando em containers Docker em VPS Linux que eu mesmo provisiono e monitoro." }
      },
      stackEyebrow: "Capítulo 04 — Ferramentas",
      stackTitle: "A caixa de <em>ferramentas</em>.",
      stackLead: "Tecnologia é meio, não fim. Mas escolher bem a ferramenta é metade do trabalho.",
      stackCards: [
        { title: "Linguagens", tags: ["Java", "Python", "SQL", "JavaScript"] },
        { title: "Frameworks & APIs", tags: ["Spring Boot", "FastAPI", "Django", "Flask", "RESTful APIs"] },
        { title: "Dados", tags: ["PostgreSQL", "MongoDB", "SQLite", "ETL/ELT", "Pandas", "Modelagem"] },
        { title: "Mensageria & Async", tags: ["RabbitMQ", "Celery", "Redis", "Apache Kafka"] },
        { title: "Infra & DevOps", tags: ["Docker", "CI/CD", "GitHub", "Linux", "Kong", "Observabilidade"] },
        { title: "Práticas", tags: ["Clean Architecture", "Microsserviços", "POO", "Scrum", "Kanban", "LLMs"] }
      ],
      eduTitle: "Formação & certificações",
      eduCards: [
        { status: "Cursando", title: "Engenharia da Computação", sub: "Bacharelado · Unijorge" },
        { status: "2022 — 2023", title: "MBA em Segurança da Informação", sub: "Especialização · Descomplica" },
        { status: "2019 — 2021", title: "Análise e Desenvolvimento de Sistemas", sub: "Tecnólogo · Unicesumar" },
        { status: "Em preparação", title: "AWS Certified Developer — Associate", sub: "Preparação ativa" }
      ],
      eduLangs: "Português — nativo \u00a0·\u00a0 Inglês — intermediário/avançado (B2)",
      interludeEyebrow: "Intervalo",
      interludeLines: ["Quando o terminal", "fecha, a história", "<em>continua.</em>"],
      interludeCaption: "Lua cheia na represa · Dias d'Ávila, BA",
      lifeEyebrow: "Capítulo 05 — Além do código",
      lifeTitle: "O que me <em>move</em>.",
      lifeLead: "Os mesmos valores que levo para o código — paciência, ritmo, curiosidade e conexão — vêm daqui.",
      lifeCards: [
        { cursor: "assistir", num: "01 / Estrada", title: "Viajar de moto", text: "Capacete, estrada e pôr do sol. Na moto eu aprendi que a melhor rota nem sempre é a mais curta — e que atenção ao presente é tudo." },
        { num: "02 / Música", title: "Violoncelo, violão e baixo", text: 'O violoncelo me ensinou paciência; o violão, leveza; o baixo, que a base sustenta tudo — igual a um bom back-end. <span class="hint">Passe o mouse nas cordas ♪</span>', stringsAria: "Cordas interativas — passe o mouse" },
        { num: "03 / Leitura", title: "Ler", text: "Na estante convivem Orwell, Augusto Cury e livros de programação. Ler me dá repertório para pensar diferente — dentro e fora do código." },
        { num: "04 / Movimento", title: "Desafios que dão medalha", text: "Peito 5093 na H11 na Pista. Assim como em projetos longos: ritmo constante, respirar fundo e cruzar a linha de chegada." },
        { num: "05 / Pessoas", title: "Boas conversas", text: "Gosto de gente. De ouvir histórias, trocar ideias e rir sem pressa. É conversando que os melhores sistemas — e amizades — nascem." },
        { cursor: "respirar", num: "06 / Pausa", title: "Tempo de qualidade", text: "Mar, céu azul e ninguém com pressa. Desligar é parte do processo — é aqui que as melhores ideias aparecem." }
      ],
      contactEyebrow: "Epílogo",
      contactTitle: "Vamos construir algo<br/>que <em>dure</em>?",
      contactLead: "Estou aberto a novos desafios, projetos e — claro — a uma boa conversa.",
      copyCursor: "copiar",
      copyHint: "clique para copiar",
      copySuccess: "copiado! ✓ te espero na caixa de entrada",
      cvLabel: "Currículo",
      cvFile: "assets/curriculo_edson_brenno_portfolio_pt.pdf",
      cvFileName: "curriculo_edson_brenno_portfolio_pt.pdf",
      footerText: '© <span id="year">' + new Date().getFullYear() + '</span> Edson Brenno · Feito com café, código e um pouco de violoncelo.',
      backToTop: "Voltar ao topo ↑"
    },
    en: {
      htmlLang: "en",
      title: "Edson Brenno — Back-End Engineer | Java, Python & Systems Architecture",
      metaDesc: "Portfolio of Edson Brenno, Back-End Developer with 5 years of experience in Java, Python, microservices, ETL, and scalable systems architecture. Based in Bahia, Brazil.",
      skipLink: "Skip to content",
      loaderCmd: '<span class="loader__prompt">$</span> ./tell-story --author="edson"',
      navLogoLabel: "Edson Brenno — home",
      navAria: "Main navigation",
      nav: { trajetoria: "Journey", impacto: "Impact", arquitetura: "Architecture", stack: "Stack", vida: "Beyond code", contato: "Contact" },
      navCta: "Let's talk",
      burgerOpen: "Open menu",
      burgerClose: "Close menu",
      langSwitchAria: "Mudar para Português",
      heroEyebrow: '<span class="status-dot" aria-hidden="true"></span> Back-End Engineer · Bahia, Brazil',
      heroLines: ["I build", "what nobody <em>sees</em>", "— and makes it all", "work."],
      heroLead: "Hi, I'm <strong>Edson Brenno</strong>. For 5 years I've been architecting APIs, microservices, and data pipelines in <strong>Java</strong> and <strong>Python</strong> — turning multi-month processes into minutes.",
      heroCtaStory: 'Read my story <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12l7 7 7-7"/></svg>',
      heroCtaCv: 'Download CV <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14"/></svg>',
      heroImgAlt: "Portrait of Edson Brenno smiling in a black t-shirt",
      heroChip3: '<span class="chip-dot"></span> 9 microservices in production',
      heroCode: '<span class="c-key">SELECT</span> passion<br/><span class="c-key">FROM</span> engineering<br/><span class="c-key">WHERE</span> impact &gt; <span class="c-num">0</span>;',
      scrollCueAria: "Scroll down",
      scrollCueText: "scroll",
      manifestoEyebrow: "Prologue",
      manifestoText: "I believe good software is the kind that disappears. Nobody notices the queue processing millions of records overnight, the gateway protecting every request, or the pipeline delivering healthcare data in one day instead of four months. Yet that is exactly where people feel the difference. That is what I build.",
      manifestoKeys: ["disappears.", "difference.", "build."],
      impactEyebrow: "Chapter 01 — Impact",
      impactTitle: "Numbers that tell <em>stories</em>.",
      impactLead: "Every metric below represents a team that got their time back, a manager who decided faster, a citizen better served.",
      impactCards: [
        { before: "before: <s>4 months</s>", unit: " day", label: "for healthcare teams to access the data they need, powered by automated ETL pipelines.", tag: "City of Mata de São João" },
        { before: "before: <s>30+ days</s>", unit: " day", label: "to draft municipal plans, driven by the core APIs of the strategic planning platform.", tag: "Zrn Tecnologias" },
        { before: "before: <s>4 days</s>", unit: " hours", label: "in the data collection cycle, with end-to-end web scraping and ETL.", tag: "TemMais Gestão" },
        { label: "faster PostgreSQL ingestion — from 30 down to 5 minutes using in-memory bulk load.", tag: "Performance" },
        { label: "autonomous microservices architected from scratch, each with its own database.", tag: "Architecture" },
        { label: "in maintenance and critical bug-fixing time, through layered architecture.", tag: "Quality" }
      ],
      journeyEyebrow: "Chapter 02 — Journey",
      journeyTitle: "A journey of <em>real problems</em>.",
      journeyLead: "I didn't start by writing pretty code. I started by solving real pain points — and architecture came as a consequence.",
      chapters: [
        {
          kicker: "09/2021 — 07/2024 · Mata de São João, BA",
          title: "The first real problem",
          role: "Systems Analyst · <strong>City of Mata de São João</strong>",
          story: "Healthcare teams waited <strong>four months</strong> to access data that should have guided daily decisions. That's where I realized technology is about people. I built ETL pipelines that cut that wait down to <strong>one day</strong>.",
          list: [
            "Automated ETL pipelines using Python (Pandas, SQLAlchemy) and PostgreSQL.",
            "Cut pipeline delivery from 3 days to 1 day with OOP and reusable code architecture.",
            "83% faster ingestion (30 → 5 min) using in-memory bulk load via <code>io.StringIO</code>, eliminating I/O bottlenecks."
          ]
        },
        {
          kicker: "12/2021 — 07/2024 · Mata de São João, BA",
          title: "Automating the repetitive",
          role: "Python Developer · <strong>TemMais Gestão</strong>",
          story: "Alongside my city hall work, I dove into product development. Collecting data took <strong>four days</strong> of manual work — I automated it down to <strong>three hours</strong>.",
          list: [
            "Automated web scraping with a complete ETL flow, from extraction to PostgreSQL.",
            "Scalable systems built with Django's MVT architecture and clear separation of concerns."
          ]
        },
        {
          badge: '<span class="status-dot" aria-hidden="true"></span> Now',
          kicker: "07/2024 — present · Dias d'Ávila, BA",
          title: "Architecting from scratch",
          role: "Mid-Level Software Developer · <strong>Zrn Tecnologias</strong>",
          story: "Today I lead the <strong>complete architecture and engineering of the back-end ecosystem</strong> — from planning and data modeling to database security, cloud orchestration, and observability. My focus: a <strong>Clean Architecture</strong> that lets the company scale without fear.",
          list: [
            "Platform with <strong>9 microservices</strong> in Java/Spring Boot, each with its own database and lifecycle.",
            "<strong>Kong API Gateway</strong> and a central Python authentication service: a single, secure entry point.",
            "Core APIs for the strategic planning platform: municipal plans reduced from <strong>30+ days to &lt;1 day</strong>.",
            "REST API in <strong>FastAPI</strong> decoupled from the monolith — the foundation for migrating to microservices.",
            "<strong>RabbitMQ</strong> for queuing and background processing, keeping the main application responsive.",
            "Event-driven <strong>e-SUS</strong> ETL pipeline with Celery, running on Linux VPS instances I provision and manage.",
            "CI/CD, Docker, and real-time observability to catch failures before users ever notice."
          ]
        },
        {
          title: "The next chapter",
          story: 'Maybe we write it together. <a href="#contato" class="link">Let\'s talk →</a>'
        }
      ],
      archEyebrow: "Chapter 03 — Under the hood",
      archTitle: "How I think about <em>systems</em>.",
      archLead: "A simplified view of the ecosystem I architected at Zrn. Hover (or tap) each piece to see the role it plays.",
      archNodes: {
        client: { name: "Clients", sub: "web · mobile · partners" },
        esus: { name: "e-SUS", sub: "data source" },
        kong: { name: "Kong Gateway", sub: "single entry" },
        auth: { name: "Auth Service", sub: "Python" },
        etl: { name: "ETL Pipeline", sub: "event-driven" },
        services: { title: "9 microservices · Spring Boot", aria: "9 Spring Boot microservices" },
        fastapi: { name: "FastAPI", sub: "decoupled API" },
        rabbit: { name: "RabbitMQ", sub: "queues · async" },
        celery: { name: "Celery", sub: "workers" },
        db: { name: "PostgreSQL", sub: "db per service" }
      },
      archDefault: {
        k: "// select a component",
        t: "The ecosystem",
        d: "A distributed ecosystem designed to be resilient, observable, and easy to evolve. Each service is independent; communication is secure and asynchronous whenever possible.",
        pills: ["Clean Architecture", "Observability", "CI/CD", "Docker"]
      },
      archInfo: {
        client: { k: "// entry layer", t: "Clients", d: "Web and mobile apps plus partner integrations. Everything comes through the same front door — never directly into the services." },
        kong: { k: "// api gateway", t: "Kong Gateway", d: "A single, secure entry point. Routing, rate limiting, and per-client environment isolation before any request touches business logic." },
        auth: { k: "// security · python", t: "Auth Service", d: "Central authentication service in Python. A single source of truth for identity and permissions across the entire ecosystem." },
        services: { k: "// java · spring boot", t: "9 Microservices", d: "Architected from scratch, each autonomous with its own database. Layered code (Controller → Service → Repository → DTO), cutting maintenance time by 30%." },
        fastapi: { k: "// python · fastapi", t: "Decoupled API", d: "A standalone endpoint independent from the monolith, built to integrate services without tight coupling — the foundation of our microservices migration." },
        rabbit: { k: "// messaging", t: "RabbitMQ", d: "Message queues for background processing. Heavy tasks move out of the request path so the main application stays fast." },
        celery: { k: "// async workers", t: "Celery", d: "Orchestrates asynchronous processing and batching — ensuring thousands of records are ingested and updated without blocking anything." },
        db: { k: "// persistence", t: "PostgreSQL", d: "Database-per-service, careful data modeling, and security. Optimized bulk loads that brought ingestion down from 30 to 5 minutes." },
        esus: { k: "// external source", t: "e-SUS", d: "National healthcare database. Every new record automatically triggers the pipeline — near real-time synchronization." },
        etl: { k: "// event-driven etl", t: "ETL Pipeline", d: "Event-driven extraction, transformation, and loading running in Docker containers on Linux VPS instances that I provision and monitor." }
      },
      stackEyebrow: "Chapter 04 — Craft",
      stackTitle: "The <em>toolbox</em>.",
      stackLead: "Technology is a means, not an end. Still, picking the right tool is half the job.",
      stackCards: [
        { title: "Languages", tags: ["Java", "Python", "SQL", "JavaScript"] },
        { title: "Frameworks & APIs", tags: ["Spring Boot", "FastAPI", "Django", "Flask", "RESTful APIs"] },
        { title: "Data", tags: ["PostgreSQL", "MongoDB", "SQLite", "ETL/ELT", "Pandas", "Data Modeling"] },
        { title: "Messaging & Async", tags: ["RabbitMQ", "Celery", "Redis", "Apache Kafka"] },
        { title: "Infra & DevOps", tags: ["Docker", "CI/CD", "GitHub", "Linux", "Kong", "Observability"] },
        { title: "Practices", tags: ["Clean Architecture", "Microservices", "OOP", "Scrum", "Kanban", "LLMs"] }
      ],
      eduTitle: "Education & certifications",
      eduCards: [
        { status: "In progress", title: "Computer Engineering", sub: "B.Sc. · Unijorge" },
        { status: "2022 — 2023", title: "MBA in Information Security", sub: "Postgraduate · Descomplica" },
        { status: "2019 — 2021", title: "Systems Analysis and Development", sub: "Associate Degree · Unicesumar" },
        { status: "In preparation", title: "AWS Certified Developer — Associate", sub: "Active preparation" }
      ],
      eduLangs: "Portuguese — native \u00a0·\u00a0 English — upper-intermediate (B2)",
      interludeEyebrow: "Interlude",
      interludeLines: ["When the terminal", "closes, the story", "<em>continues.</em>"],
      interludeCaption: "Full moon over the reservoir · Dias d'Ávila, BA",
      lifeEyebrow: "Chapter 05 — Beyond code",
      lifeTitle: "What <em>moves</em> me.",
      lifeLead: "The same values I bring to code — patience, rhythm, curiosity, and connection — come from here.",
      lifeCards: [
        { cursor: "watch", num: "01 / Open road", title: "Motorcycle trips", text: "Helmet, open road, and sunset. On two wheels I learned that the best route isn't always the shortest — and being present is everything." },
        { num: "02 / Music", title: "Cello, guitar & bass", text: 'The cello taught me patience; the guitar, lightness; the bass, that the foundation holds everything together — just like a good back-end. <span class="hint">Hover over the strings ♪</span>', stringsAria: "Interactive strings — hover to play" },
        { num: "03 / Reading", title: "Reading", text: "On my shelf, Orwell, Augusto Cury, and programming books live side by side. Reading gives me the repertoire to think differently — inside and outside of code." },
        { num: "04 / Motion", title: "Challenges worth a medal", text: "Bib 5093 at the H11 track race. Just like long projects: steady pace, deep breaths, and crossing the finish line." },
        { num: "05 / People", title: "Good conversations", text: "I like people. Listening to stories, trading ideas, and laughing without rushing. Great systems — and great friendships — are born in conversation." },
        { cursor: "breathe", num: "06 / Pause", title: "Quality time", text: "Ocean, blue sky, and nobody in a hurry. Unplugging is part of the process — that's where the best ideas show up." }
      ],
      contactEyebrow: "Epilogue",
      contactTitle: "Shall we build something<br/>that <em>lasts</em>?",
      contactLead: "I'm open to new challenges, projects, and — of course — a good conversation.",
      copyCursor: "copy",
      copyHint: "click to copy",
      copySuccess: "copied! ✓ see you in my inbox",
      cvLabel: "Resume",
      cvFile: "assets/curriculo_edson_brenno_portfolio_en.pdf",
      cvFileName: "curriculo_edson_brenno_portfolio_en.pdf",
      footerText: '© <span id="year">' + new Date().getFullYear() + '</span> Edson Brenno · Built with coffee, code, and a bit of cello.',
      backToTop: "Back to top ↑"
    }
  };

  // Mobile menu
  const burger = $("#navBurger");
  const menu = $("#mobileMenu");
  function closeMenu() {
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", i18n[currentLang].burgerOpen);
    if (lenis) lenis.start();
  }
  burger.addEventListener("click", () => {
    const open = !menu.classList.contains("is-open");
    if (!open) return closeMenu();
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    burger.setAttribute("aria-expanded", "true");
    burger.setAttribute("aria-label", i18n[currentLang].burgerClose);
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
  let manifestoST = null;
  function renderManifesto(isInitial = false) {
    if (!manifesto) return;
    const t = i18n[currentLang];
    const words = t.manifestoText.trim().split(/\s+/);
    manifesto.innerHTML = words
      .map((w) => `<span class="word${t.manifestoKeys.includes(w) ? " is-key" : ""}">${w}</span>`)
      .join(" ");
    if (manifestoST) { manifestoST.kill(); manifestoST = null; }
    if (motion) {
      const tween = gsap.to("#manifestoText .word", {
        opacity: 1, stagger: 0.05, ease: "none",
        scrollTrigger: { trigger: manifesto, start: "top 78%", end: "bottom 45%", scrub: 0.6 }
      });
      manifestoST = tween.scrollTrigger;
      if (!isInitial && manifestoST) manifestoST.refresh();
    } else {
      $$("#manifestoText .word").forEach((w) => (w.style.opacity = 1));
    }
  }
  renderManifesto(true);

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
      onEnter: (batch) => gsap.fromTo(batch, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: "expo.out", stagger: 0.1, overwrite: true, clearProps: "transform,opacity,translate,rotate,scale" }),
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
  let activeArchKey = null;
  let redrawArch = null;
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
        const elA = nodeEl(a), elB = nodeEl(b);
        if (!elA || !elB) return;
        const rA = elA.getBoundingClientRect(), rB = elB.getBoundingClientRect();
        const yOffA = hasGSAP ? (+gsap.getProperty(elA, "y") || 0) : 0;
        const yOffB = hasGSAP ? (+gsap.getProperty(elB, "y") || 0) : 0;
        const A = { left: rA.left, right: rA.right, top: rA.top - yOffA, bottom: rA.bottom - yOffA, width: rA.width, height: rA.height };
        const B = { left: rB.left, right: rB.right, top: rB.top - yOffB, bottom: rB.bottom - yOffB, width: rB.width, height: rB.height };
        let x1, y1, x2, y2, path;
        if (Math.abs(A.left - B.left) < 30) {
          x1 = A.left + A.width / 2 - d.left; y1 = A.bottom - d.top;
          x2 = B.left + B.width / 2 - d.left; y2 = B.top - d.top;
          if (y2 < y1) { [y1, y2] = [A.top - d.top, B.bottom - d.top]; }
          path = `M${x1},${y1} L${x2},${y2}`;
          if (Math.abs(B.top - A.bottom) >= 48 && Math.abs(A.top - B.bottom) >= 48) {
            const isRightCol = (A.left - d.left) > d.width * 0.35;
            x1 = (isRightCol ? A.left : A.right) - d.left; y1 = A.top + A.height / 2 - d.top;
            x2 = (isRightCol ? B.left : B.right) - d.left; y2 = B.top + B.height / 2 - d.top;
            const cx = x1 + (isRightCol ? -16 : 16);
            path = `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`;
          }
        } else if (A.left > B.left) {
          x1 = A.left - d.left; y1 = A.top + A.height / 2 - d.top;
          x2 = B.right - d.left; y2 = B.top + B.height / 2 - d.top;
          const mx = (x1 + x2) / 2;
          path = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
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
        if (activeArchKey && diagram.classList.contains("has-focus") && (a === activeArchKey || b === activeArchKey)) p.classList.add("is-hot");
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
    redrawArch = draw;

    const panel = $("#archPanel");
    const pk = $("#archKicker"), pt = $("#archPanelTitle"), pd = $("#archPanelText");
    function focus(key) {
      const info = i18n[currentLang].archInfo[key];
      if (!info) return;
      activeArchKey = key;
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
      const archItems = $$(".arch__col > *", diagram);
      archItems.forEach((el) => el.classList.add("is-animating"));
      gsap.fromTo(archItems, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "expo.out", stagger: 0.06, clearProps: "transform,opacity,translate,rotate,scale", scrollTrigger: { trigger: diagram, start: "top 88%" }, onComplete: () => { archItems.forEach((el) => el.classList.remove("is-animating")); draw(); } });
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
        copyHint.textContent = i18n[currentLang].copySuccess;
        setTimeout(() => { copyBtn.classList.remove("is-copied"); copyHint.textContent = i18n[currentLang].copyHint; }, 2800);
      } catch {
        window.location.href = "mailto:" + email;
      }
    });
  }

  /* ---------- Apply language ---------- */
  function applyLanguage(lang, isInitial = false) {
    currentLang = lang;
    const t = i18n[lang];

    document.documentElement.lang = t.htmlLang;
    document.title = t.title;
    const metaDesc = $('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", t.metaDesc);

    const skip = $(".skip-link");
    if (skip) skip.textContent = t.skipLink;
    const loaderLine = $(".loader__line");
    if (loaderLine) loaderLine.innerHTML = t.loaderCmd;

    // Switcher state
    const langBtn = $("#langSwitch");
    if (langBtn) {
      langBtn.setAttribute("aria-label", t.langSwitchAria);
      $$("[data-lang-opt]", langBtn).forEach((el) => {
        el.classList.toggle("is-active", el.dataset.langOpt === lang);
      });
    }

    // Header & Nav
    const navLogo = $("#navLogo");
    if (navLogo) navLogo.setAttribute("aria-label", t.navLogoLabel);
    const navEl = $("#nav nav");
    if (navEl) navEl.setAttribute("aria-label", t.navAria);
    $$("[data-nav]").forEach((a) => {
      const key = a.getAttribute("href").slice(1);
      if (t.nav[key]) a.textContent = t.nav[key];
    });
    $$("[data-mobile-nav]").forEach((a) => {
      const key = a.dataset.mobileNav;
      if (t.nav[key]) a.textContent = t.nav[key];
    });
    const navCta = $("#navCta");
    if (navCta) navCta.textContent = t.navCta;
    if (burger) {
      const open = menu && menu.classList.contains("is-open");
      burger.setAttribute("aria-label", open ? t.burgerClose : t.burgerOpen);
    }

    // Hero
    const heroEyebrow = $(".hero__eyebrow");
    if (heroEyebrow) heroEyebrow.innerHTML = t.heroEyebrow;
    const heroLines = $$("[data-hero-line]");
    t.heroLines.forEach((lineHtml, idx) => {
      if (heroLines[idx]) heroLines[idx].innerHTML = lineHtml;
    });
    const heroLead = $(".hero__lead");
    if (heroLead) heroLead.innerHTML = t.heroLead;
    const heroCtaStory = $("#heroCtaStory");
    if (heroCtaStory) heroCtaStory.innerHTML = t.heroCtaStory;
    const heroCtaCv = $("#heroCtaCv");
    if (heroCtaCv) {
      heroCtaCv.innerHTML = t.heroCtaCv;
      heroCtaCv.setAttribute("href", t.cvFile);
      heroCtaCv.setAttribute("download", t.cvFileName);
    }
    const heroImg = $(".hero__frame img");
    if (heroImg) heroImg.setAttribute("alt", t.heroImgAlt);
    const chip3 = $(".float-chip--3");
    if (chip3) chip3.innerHTML = t.heroChip3;
    const heroCode = $(".hero__code");
    if (heroCode) heroCode.innerHTML = t.heroCode;
    const scrollCue = $(".scroll-cue");
    if (scrollCue) scrollCue.setAttribute("aria-label", t.scrollCueAria);
    const scrollCueText = $(".scroll-cue__text");
    if (scrollCueText) scrollCueText.textContent = t.scrollCueText;

    // Manifesto
    const manifestoEyebrow = $("#manifesto .eyebrow");
    if (manifestoEyebrow) manifestoEyebrow.textContent = t.manifestoEyebrow;
    if (!isInitial) renderManifesto(false);

    // Impact
    const impactEyebrow = $("#impacto .eyebrow");
    if (impactEyebrow) impactEyebrow.textContent = t.impactEyebrow;
    const impactTitle = $("#impactTitle");
    if (impactTitle) impactTitle.innerHTML = t.impactTitle;
    const impactLead = $("#impacto .section__lead");
    if (impactLead) impactLead.textContent = t.impactLead;
    const impactCards = $$("#impacto .impact-card");
    t.impactCards.forEach((c, idx) => {
      const card = impactCards[idx];
      if (!card) return;
      const before = $(".impact-card__before", card);
      if (before && c.before) before.innerHTML = c.before;
      const small = $(".impact-card__value small", card);
      if (small && c.unit) small.textContent = c.unit;
      const label = $(".impact-card__label", card);
      if (label) label.textContent = c.label;
      const tag = $(".impact-card__tag", card);
      if (tag) tag.textContent = c.tag;
    });

    // Journey
    const journeyEyebrow = $("#trajetoria .eyebrow");
    if (journeyEyebrow) journeyEyebrow.textContent = t.journeyEyebrow;
    const journeyTitle = $("#journeyTitle");
    if (journeyTitle) journeyTitle.innerHTML = t.journeyTitle;
    const journeyLead = $("#trajetoria .section__lead");
    if (journeyLead) journeyLead.textContent = t.journeyLead;
    const chapters = $$("#trajetoria [data-chapter]");
    t.chapters.forEach((c, idx) => {
      const ch = chapters[idx];
      if (!ch) return;
      const badge = $(".chapter__badge", ch);
      if (badge && c.badge) badge.innerHTML = c.badge;
      const kicker = $(".chapter__kicker", ch);
      if (kicker && c.kicker) kicker.textContent = c.kicker;
      const title = $(".chapter__title", ch);
      if (title && c.title) title.textContent = c.title;
      const role = $(".chapter__role", ch);
      if (role && c.role) role.innerHTML = c.role;
      const story = $(".chapter__story", ch);
      if (story && c.story) story.innerHTML = c.story;
      if (c.list) {
        const items = $$(".chapter__list li", ch);
        c.list.forEach((liHtml, liIdx) => {
          if (items[liIdx]) items[liIdx].innerHTML = liHtml;
        });
      }
    });

    // Architecture
    const archEyebrow = $("#arquitetura .eyebrow");
    if (archEyebrow) archEyebrow.textContent = t.archEyebrow;
    const archTitle = $("#archTitle");
    if (archTitle) archTitle.innerHTML = t.archTitle;
    const archLead = $("#arquitetura .section__lead");
    if (archLead) archLead.textContent = t.archLead;

    Object.entries(t.archNodes).forEach(([key, val]) => {
      const el = $(`#node-${key}`);
      if (!el) return;
      if (key === "services") {
        const st = $(".services__title", el);
        if (st) st.textContent = val.title;
        el.setAttribute("aria-label", val.aria);
      } else {
        const nm = $(".node__name", el);
        const sb = $(".node__sub", el);
        if (nm) nm.textContent = val.name;
        if (sb) sb.textContent = val.sub;
      }
    });

    const pk = $("#archKicker"), pt = $("#archPanelTitle"), pd = $("#archPanelText");
    if (activeArchKey && t.archInfo[activeArchKey]) {
      const info = t.archInfo[activeArchKey];
      if (pk) pk.textContent = info.k;
      if (pt) pt.textContent = info.t;
      if (pd) pd.textContent = info.d;
    } else {
      if (pk) pk.textContent = t.archDefault.k;
      if (pt) pt.textContent = t.archDefault.t;
      if (pd) pd.textContent = t.archDefault.d;
    }
    const pills = $$(".arch__panel-pills li");
    t.archDefault.pills.forEach((pText, idx) => {
      if (pills[idx]) pills[idx].textContent = pText;
    });

    // Stack
    const stackEyebrow = $("#stack .eyebrow");
    if (stackEyebrow) stackEyebrow.textContent = t.stackEyebrow;
    const stackTitle = $("#stackTitle");
    if (stackTitle) stackTitle.innerHTML = t.stackTitle;
    const stackLead = $("#stack .section__lead");
    if (stackLead) stackLead.textContent = t.stackLead;
    const stackCards = $$("#stack .stack-card");
    t.stackCards.forEach((sc, idx) => {
      const card = stackCards[idx];
      if (!card) return;
      const h3 = $("h3", card);
      if (h3) h3.textContent = sc.title;
      const tags = $$(".tags li", card);
      sc.tags.forEach((tg, tIdx) => {
        if (tags[tIdx]) tags[tIdx].textContent = tg;
      });
    });

    // Education
    const eduTitle = $(".edu__title");
    if (eduTitle) eduTitle.textContent = t.eduTitle;
    const eduCards = $$(".edu-card");
    t.eduCards.forEach((ec, idx) => {
      const card = eduCards[idx];
      if (!card) return;
      const st = $(".edu-card__status", card);
      const h4 = $("h4", card);
      const p = $("p", card);
      if (st) st.textContent = ec.status;
      if (h4) h4.textContent = ec.title;
      if (p) p.textContent = ec.sub;
    });
    const eduLangs = $(".edu__langs");
    if (eduLangs) eduLangs.textContent = t.eduLangs;

    // Interlude
    const interludeEyebrow = $("#interlude .eyebrow");
    if (interludeEyebrow) interludeEyebrow.textContent = t.interludeEyebrow;
    const interludeLines = $$("[data-interlude-line]");
    t.interludeLines.forEach((lHtml, idx) => {
      if (interludeLines[idx]) interludeLines[idx].innerHTML = lHtml;
    });
    const interludeCaption = $(".interlude__caption");
    if (interludeCaption) interludeCaption.textContent = t.interludeCaption;

    // Life
    const lifeEyebrow = $("#vida .eyebrow");
    if (lifeEyebrow) lifeEyebrow.textContent = t.lifeEyebrow;
    const lifeTitle = $("#lifeTitle");
    if (lifeTitle) lifeTitle.innerHTML = t.lifeTitle;
    const lifeLead = $("#vida .section__lead");
    if (lifeLead) lifeLead.textContent = t.lifeLead;
    const lifeCards = $$("#lifeTrack .life-card");
    t.lifeCards.forEach((lc, idx) => {
      const card = lifeCards[idx];
      if (!card) return;
      if (lc.cursor) card.dataset.cursor = lc.cursor;
      const num = $(".life-card__num", card);
      const h3 = $("h3", card);
      const p = $("p", card);
      if (num) num.textContent = lc.num;
      if (h3) h3.textContent = lc.title;
      if (p) p.innerHTML = lc.text;
      if (lc.stringsAria) {
        const str = $("#strings", card);
        if (str) str.setAttribute("aria-label", lc.stringsAria);
      }
    });

    // Contact & Footer
    const contactEyebrow = $("#contato .eyebrow");
    if (contactEyebrow) contactEyebrow.textContent = t.contactEyebrow;
    const contactTitle = $("#contactTitle");
    if (contactTitle) contactTitle.innerHTML = t.contactTitle;
    const contactLead = $(".contact__lead");
    if (contactLead) contactLead.textContent = t.contactLead;
    if (copyBtn) copyBtn.dataset.cursor = t.copyCursor;
    if (copyHint && !copyBtn?.classList.contains("is-copied")) copyHint.textContent = t.copyHint;
    const linkCv = $("#linkCv");
    if (linkCv) {
      const svg = $("svg", linkCv);
      linkCv.innerHTML = "";
      if (svg) linkCv.appendChild(svg);
      linkCv.append(" " + t.cvLabel);
      linkCv.setAttribute("href", t.cvFile);
      linkCv.setAttribute("download", t.cvFileName);
    }
    const footerP = $(".footer p");
    if (footerP) footerP.innerHTML = t.footerText;
    const backToTop = $("#backToTop");
    if (backToTop) backToTop.textContent = t.backToTop;

    if (redrawArch) setTimeout(redrawArch, 50);
    if (hasGSAP && !isInitial) setTimeout(() => ScrollTrigger.refresh(), 100);
  }

  const langSwitchBtn = $("#langSwitch");
  if (langSwitchBtn) {
    langSwitchBtn.addEventListener("click", () => {
      applyLanguage(currentLang === "pt" ? "en" : "pt", false);
    });
  }

  if (currentLang === "en") {
    applyLanguage("en", true);
    renderManifesto(true);
  } else {
    $("#year").textContent = new Date().getFullYear();
  }

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

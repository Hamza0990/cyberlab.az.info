/* ==========================================================
   CYBERLAB — app.js
========================================================== */

/* Qeyd: əvvəlki "lockZoom" bloku silindi. O, 300ms içində ikinci toxunuşu ləğv edirdi
   (sürətli toxunuşlar "yeyilirdi") və masaüstündə Ctrl+çarx / Ctrl +/- qısayollarını
   bloklayırdı. Pinch-zoom artıq yalnız CSS ilə (touch-action) idarə olunur. */

/* ==========================================================
   I18N MÜHƏRRİKİ — AZ / EN / RU / TR
========================================================== */
const I18N = (function () {
  const DEFAULT = 'az';
  const SUPPORTED = ['az', 'en', 'ru', 'tr'];
  const META = {
    az: { code: 'AZ', name: 'Azərbaycan' },
    en: { code: 'EN', name: 'English' },
    ru: { code: 'RU', name: 'Русский' },
    tr: { code: 'TR', name: 'Türkçe' },
  };

  let current = DEFAULT;
  const azOriginals = {};   // data-i18n açarlarının orijinal AZ HTML-i
  let azTips = [];          // kill-chain tooltip-lərinin orijinal AZ mətni
  let captured = false;

  function dict(lang) {
    return (window.CYBERLAB_I18N && window.CYBERLAB_I18N[lang]) || null;
  }
  function dyn(lang) {
    lang = lang || current;
    return (window.CYBERLAB_DYN && window.CYBERLAB_DYN[lang]) || window.CYBERLAB_DYN.az;
  }

  /* Səhifə yüklənəndə AZ mətnlərini yaddaşa al (typewriter onları pozmazdan əvvəl) */
  function capture() {
    if (captured) return;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      azOriginals[el.dataset.i18n] = el.innerHTML;
    });
    azTips = Array.from(document.querySelectorAll('.kc-step')).map(el => el.dataset.tip || '');
    captured = true;
  }

  /* Bir alətin təsvirini cari dildə qaytarır */
  function toolDesc(tool) {
    const d = dyn();
    return (d.tools && d.tools[tool.name]) || tool.desc;
  }

  function apply(lang, animate) {
    if (!SUPPORTED.includes(lang)) lang = DEFAULT;
    capture();
    current = lang;

    const table = lang === DEFAULT ? null : dict(lang);

    const run = () => {
      /* 1. Statik mətnlər */
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        const val = table ? (table[key] ?? azOriginals[key]) : azOriginals[key];
        if (val != null && el.tagName !== 'TITLE') el.innerHTML = val;
      });

      /* 2. Səhifə başlığı və lang atributu */
      const titleVal = table ? (table.pageTitle || azOriginals.pageTitle) : azOriginals.pageTitle;
      if (titleVal) document.title = titleVal.replace(/&amp;/g, '&');
      document.documentElement.lang = lang;

      /* 3. Kill-chain tooltip-ləri */
      const tips = lang === DEFAULT ? azTips : (dyn(lang).kcTips || azTips);
      document.querySelectorAll('.kc-step').forEach((el, i) => {
        if (tips[i]) el.dataset.tip = tips[i];
      });

      /* 4. Terminal sətirləri */
      const terms = dyn(lang).terminals || [];
      document.querySelectorAll('.terminal').forEach((el, i) => {
        if (terms[i]) el.dataset.lines = JSON.stringify(terms[i]);
        el.removeAttribute('data-done');
        el.innerHTML = '';
      });

      /* 5. Alət kartlarını yenidən çək (aktiv filtri qoruyaraq) */
      const activeFilters = {};
      document.querySelectorAll('.tabs').forEach(g => {
        const act = g.querySelector('.tab.active');
        if (act) activeFilters[g.dataset.target] = act.dataset.filter;
      });
      if (typeof renderAllTools === 'function') renderAllTools();
      Object.entries(activeFilters).forEach(([target, filter]) => {
        const grid = document.getElementById(target);
        if (!grid || filter === 'all') return;
        grid.querySelectorAll('.tool-card, .platform-card').forEach(card => {
          const val = card.dataset.cat || card.dataset.phase;
          card.classList.toggle('hide', val !== filter);
        });
      });

      /* 6. Simulyasiya düyməsinin etiketi */
      const simLabel = document.getElementById('simulateLabel');
      if (simLabel) simLabel.textContent = dyn(lang).simulateIdle;

      /* 7. Animasiyaları yenidən işə sal */
      if (typeof initTypewriter === 'function') initTypewriter();
      if (typeof initTerminals === 'function') initTerminals();
      if (typeof rebindAccordion === 'function') rebindAccordion();

      /* 8. Seçici UI-nı yenilə */
      const codeEl = document.getElementById('langCodeCurrent');
      const flagEl = document.getElementById('langFlagCurrent');
      if (codeEl) codeEl.textContent = META[lang].code;
      document.querySelectorAll('.lang-option').forEach(opt => {
        const isActive = opt.dataset.lang === lang;
        opt.classList.toggle('active', isActive);
        if (isActive && flagEl) {
          const svg = opt.querySelector('.lang-flag svg');
          if (svg) flagEl.innerHTML = svg.outerHTML;
        }
      });

      /* 9. "Tezliklə" səhifəsinə gedən sosial linklərə cari dili ötür —
            o səhifənin öz JS-i yoxdursa belə, düz dildə açılsın. */
      document.querySelectorAll('.social-icon[data-social]').forEach(a => {
        const network = a.dataset.social;
        a.setAttribute('href', 'soon/index.html?n=' + encodeURIComponent(network) + '&lang=' + encodeURIComponent(lang));
      });
    };

    if (animate) {
      document.body.classList.add('lang-switching');
      setTimeout(() => {
        run();
        requestAnimationFrame(() => document.body.classList.remove('lang-switching'));
      }, 200);
    } else {
      run();
    }
  }

  return { apply, toolDesc, dyn, capture, get current() { return current; }, SUPPORTED, META };
})();

/* AZ mətnlərini dərhal yaddaşa al (typewriter işləməzdən əvvəl) */
I18N.capture();

/* ---------- Dil seçici dropdown ---------- */
(function langSwitcher() {
  const wrap = document.getElementById('langSwitch');
  const trigger = document.getElementById('langTrigger');
  if (!wrap || !trigger) return;

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = wrap.classList.toggle('open');
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  wrap.querySelectorAll('.lang-option').forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const lang = opt.dataset.lang;
      wrap.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
      if (lang !== I18N.current) I18N.apply(lang, true);
    });
  });

  document.addEventListener('click', () => {
    wrap.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      wrap.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    }
  });
})();

/* ---------- Loader ---------- */
(function loaderInit() {
  const loader = document.getElementById('loader');
  if (!loader) return;
  let done = false;
  const hide = () => {
    if (done) return;
    done = true;
    loader.classList.add('hidden');
    setTimeout(() => { loader.style.display = 'none'; }, 800);
  };
  // Yavaş mobil şəbəkədə kənar şrift/ikon CSS-i gec gəlsə də loader ilişib qalmasın
  window.addEventListener('load', () => setTimeout(hide, 500));
  setTimeout(hide, 2500);
})();

/* ---------- Theme toggle ----------
   Seçim theme-init.js vasitəsilə localStorage-da saxlanır (əsas sayt ↔ soon/ eyni tema). */
(function themeInit() {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    if (window.CyberTheme) window.CyberTheme.toggle();
  });
})();

/* ---------- Nav scroll state ---------- */
(function navScroll() {
  const nav = document.getElementById('mainNav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
})();

/* ---------- Mobile menu ---------- */
(function mobileMenu() {
  const nav = document.getElementById('mainNav');
  const burger = document.getElementById('burger');
  const menu = document.getElementById('mobileMenu');
  if (!nav || !burger || !menu) return;

  function setOpen(open) {
    menu.classList.toggle('open', open);
    nav.classList.toggle('menu-open', open);
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('menu-locked', open);
  }
  const isOpen = () => menu.classList.contains('open');

  burger.addEventListener('click', (e) => { e.stopPropagation(); setOpen(!isOpen()); });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
  // menyudan kənara toxunanda bağlan
  document.addEventListener('click', (e) => { if (isOpen() && !nav.contains(e.target)) setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen()) setOpen(false); });
  // ekran masaüstü ölçüsünə keçəndə (məs. planşet çevriləndə) menyu açıq qalmasın
  const wide = window.matchMedia('(min-width: 1025px)');
  const onWide = (e) => { if (e.matches) setOpen(false); };
  if (wide.addEventListener) wide.addEventListener('change', onWide); else wide.addListener(onWide);
})();

/* ---------- Scroll reveal ---------- */
(function reveal() {
  const els = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  els.forEach(el => io.observe(el));
})();

/* ---------- Stat counters ---------- */
(function counters() {
  const stats = document.querySelectorAll('.stat-num');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target;
        const target = parseInt(el.dataset.count, 10);
        let cur = 0;
        const step = Math.max(1, Math.round(target / 30));
        const tick = () => {
          cur += step;
          if (cur >= target) { el.textContent = target; return; }
          el.textContent = cur;
          requestAnimationFrame(tick);
        };
        tick();
        io.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  stats.forEach(s => io.observe(s));
})();

/* ---------- Particle network background ---------- */
(function particleNet() {
  const canvas = document.getElementById('netCanvas');
  const ctx = canvas.getContext('2d');
  let w, h, nodes = [];
  const NODE_COUNT = window.innerWidth < 700 ? 34 : 70;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function initNodes() {
    nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
    }));
  }
  initNodes();

  function getAccent() {
    const dark = document.documentElement.getAttribute('data-theme') !== 'light';
    return dark
      ? { line: 'rgba(90,130,150,0.18)', node: 'rgba(150,180,200,0.45)', hot: 'rgba(255,59,78,0.5)' }
      : { line: 'rgba(80,110,130,0.14)', node: 'rgba(60,90,110,0.35)', hot: 'rgba(214,39,58,0.35)' };
  }

  function step() {
    ctx.clearRect(0, 0, w, h);
    const acc = getAccent();
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          ctx.strokeStyle = dist < 60 ? acc.hot : acc.line;
          ctx.lineWidth = dist < 60 ? 1 : 0.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    for (const n of nodes) {
      ctx.fillStyle = acc.node;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(step);
  }
  step();
})();

/* Yalnız əsl siçanı olan cihazlarda hover effektləri (toxunma ekranında "ilişib qalır") */
const FINE_POINTER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- Tool data ---------- */
const RED_TOOLS = [
  { name: 'Nmap', phase: 'RECON', icon: 'fa-solid fa-magnifying-glass', desc: 'Şəbəkədəki açıq portları və işləyən servisləri xəritələyir — hədəf profilinin əsasını qurur.' },
  { name: 'Burp Suite', phase: 'EXPLOIT', icon: 'fa-solid fa-bug', desc: 'Veb tətbiqlərin trafikini analiz edərək giriş validasiyası kimi zəiflikləri aşkarlamaq üçün proxy əsaslı platforma.' },
  { name: 'Metasploit', phase: 'EXPLOIT', icon: 'fa-solid fa-bolt', desc: 'Bilinən zəifliklər üçün standartlaşdırılmış istismar modullarını təşkil edən freymvork.' },
  { name: 'Amass', phase: 'RECON', icon: 'fa-solid fa-sitemap', desc: 'Hədəfin bütün alt-domenlərini və hücum səthini xəritələyən aktiv/passiv kəşfiyyat aləti.' },
  { name: 'John the Ripper', phase: 'EXPLOIT', icon: 'fa-solid fa-key', desc: 'Zəif parol siyasətlərini yoxlamaq üçün parol hash-lərini nəzarətli mühitdə sınayır.' },
  { name: 'Hydra', phase: 'EXPLOIT', icon: 'fa-solid fa-unlock', desc: 'Giriş formalarında brute-force müdafiəsinin gücünü ölçmək üçün istifadə olunan giriş sınaq aləti.' },
  { name: 'Aircrack-ng', phase: 'RECON', icon: 'fa-solid fa-wifi', desc: 'Wi-Fi şəbəkələrinin şifrələmə gücünü qiymətləndirən simsiz audit toolkit-i.' },
  { name: 'SET Toolkit', phase: 'DELIVER', icon: 'fa-solid fa-user-secret', desc: 'Sosial mühəndislik ssenarilərini icazəli fişinq simulyasiyalarında sınamaq üçün çərçivə.' },
  { name: 'Cobalt Strike', phase: 'PERSIST', icon: 'fa-solid fa-tower-broadcast', desc: 'Adversary emulation üçün C2 infrastrukturunu modelləşdirən komanda platforması.' },
  { name: 'PowerShell Empire', phase: 'PERSIST', icon: 'fa-solid fa-terminal', desc: 'Post-exploitation ssenarilərini simulyasiya edən açıq mənbəli agent freymvorku.' },
  { name: 'Nikto', phase: 'RECON', icon: 'fa-solid fa-triangle-exclamation', desc: 'Veb serverlərdə köhnəlmiş komponent və konfiqurasiya zəifliklərini skan edir.' },
  { name: 'SQLmap', phase: 'EXPLOIT', icon: 'fa-solid fa-database', desc: 'SQL inyeksiya zəifliklərini avtomatik aşkarlayıb icazəli test mühitində doğrulayır.' },
  { name: 'GoPhish', phase: 'DELIVER', icon: 'fa-solid fa-fish', desc: 'Korporativ icazəli fişinq maarifləndirmə kampaniyalarını idarə edən açıq mənbəli platforma.' },
];

const BLUE_TOOLS = [
  { name: 'Wireshark', phase: 'DETECT', icon: 'fa-solid fa-ethernet', desc: 'Şəbəkə paketlərini analiz edərək anomal trafik nümunələrini erkən aşkarlayır.', dual: true },
  { name: 'Suricata / Snort', phase: 'DETECT', icon: 'fa-solid fa-shield-halved', desc: 'İmza və davranış əsaslı qaydalarla şəbəkə səviyyəsində müdaxilə cəhdlərini bloklayır (IDS/IPS).' },
  { name: 'Splunk', phase: 'ANALYZE', icon: 'fa-solid fa-chart-column', desc: 'Bütün infrastrukturdan log məlumatını mərkəzləşdirib korrelyasiya qaydaları ilə hadisə aşkarlayır (SIEM).' },
  { name: 'Elastic (ELK)', phase: 'ANALYZE', icon: 'fa-solid fa-magnifying-glass-chart', desc: 'Açıq mənbəli log toplama, axtarış və vizuallaşdırma stack-i — hadisə araşdırmasını asanlaşdırır.' },
  { name: 'Wazuh', phase: 'DETECT', icon: 'fa-solid fa-file-shield', desc: 'Host səviyyəsində fayl bütövlüyü və konfiqurasiya monitorinqi aparan açıq mənbəli HIDS.' },
  { name: 'YARA', phase: 'ANALYZE', icon: 'fa-solid fa-fingerprint', desc: 'Zərərli fayl nümunələrini imza qaydaları əsasında təsnifləndirən statik analiz aləti.' },
  { name: 'TheHive', phase: 'RESPOND', icon: 'fa-solid fa-clipboard-list', desc: 'Təhlükəsizlik hadisələrinin komanda daxilində izlənməsi və cavab prosesini idarə edən platforma.' },
  { name: 'MISP', phase: 'ANALYZE', icon: 'fa-solid fa-share-nodes', desc: 'Təhlükə indikatorlarını (IoC) komandalar arasında paylaşan açıq təhdid kəşfiyyatı platforması.' },
  { name: 'Sysmon', phase: 'DETECT', icon: 'fa-brands fa-windows', desc: 'Windows sistemlərində proses və şəbəkə davranışını ətraflı jurnala yazan Microsoft aləti.' },
  { name: 'OSSEC', phase: 'DETECT', icon: 'fa-solid fa-lock', desc: 'Log analizi, bütövlük yoxlaması və real-vaxt xəbərdarlıq verən host əsaslı müdafiə sistemi.' },
  { name: 'CrowdStrike Falcon', phase: 'RESPOND', icon: 'fa-solid fa-cloud', desc: 'Buluda əsaslanan EDR platforması — endpoint davranışını izləyib təhdidi avtomatik təcrid edir.' },
  { name: 'pfSense / WAF', phase: 'RESPOND', icon: 'fa-solid fa-fire', desc: 'Şəbəkə perimetrini filtrləyən firewall və veb tətbiq qoruması qatı.' },
  { name: 'Zeek', phase: 'DETECT', icon: 'fa-solid fa-binoculars', desc: 'Şəbəkə trafikini dərin protokol səviyyəsində analiz edərək anomaliya jurnalları yaradan açıq mənbəli monitorinq mühərriki.' },
];

function renderTools(list, containerId, glowColor) {
  const grid = document.getElementById(containerId);
  grid.innerHTML = list.map((t, idx) => `
    <div class="tool-card" data-phase="${t.phase}" style="--i:${idx}">
      <div class="tool-card-glow" style="--glow-color:${glowColor}"></div>
      <div class="tool-card-top">
        <div class="tool-name-row">
          <span class="tool-icon-wrap"><i class="${t.icon || 'fa-solid fa-shield'}"></i></span>
          <span class="tool-name">${t.name}</span>
        </div>
        <span class="tool-phase">${t.phase}</span>
      </div>
      <p class="tool-desc">${I18N.toolDesc(t)}</p>
      ${t.dual ? `<span class="dual-badge">${I18N.dyn().dualBadge}</span>` : ''}
    </div>
  `).join('');

  if (!FINE_POINTER) return;
  grid.querySelectorAll('.tool-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      card.style.setProperty('--my', `${e.clientY - rect.top}px`);
    });
  });
}

function renderAllTools() {
  renderTools(RED_TOOLS, 'redGrid', 'rgba(255,59,78,.18)');
  renderTools(BLUE_TOOLS, 'blueGrid', 'rgba(38,201,224,.2)');
}
renderAllTools();

/* ---------- Custom cursor dot ---------- */
(function cursorDot() {
  const dot = document.getElementById('cursorDot');
  if (!dot) return;
  // Yalnız əsl siçanı olan cihazlarda işə sal (planşet/mobil toxunma ekranlarında
  // mousemove heç vaxt atılmadığından nöqtə 0,0-da "ilişib qalırdı").
  if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  let mx = 0, my = 0, cx = 0, cy = 0, started = false;
  window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; started = true; });
  function loop() {
    if (started) {
      cx += (mx - cx) * 0.2;
      cy += (my - cy) * 0.2;
      dot.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
    }
    requestAnimationFrame(loop);
  }
  loop();
  document.querySelectorAll('a, button, .tool-card, .why-card, .platform-card, .case-card, .kc-step, .hat-card, .ti-card').forEach(el => {
    el.addEventListener('mouseenter', () => dot.classList.add('hover'));
    el.addEventListener('mouseleave', () => dot.classList.remove('hover'));
  });
})();

/* ---------- Magnetic buttons ----------
   Əvvəl düymə kursora doğru eninin 25%-i qədər sürüşürdü və qonşu düymənin üstünə çıxırdı.
   İndi maksimum ~4px yerdəyişmə, yalnız siçanla, və ayrıca "translate" xassəsi ilə
   (hover-dəki transform ilə toqquşmur). */
(function magnetic() {
  if (!FINE_POINTER) return;
  document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      btn.style.setProperty('--mag-x', (x * 8).toFixed(1) + 'px');
      btn.style.setProperty('--mag-y', (y * 6).toFixed(1) + 'px');
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.setProperty('--mag-x', '0px');
      btn.style.setProperty('--mag-y', '0px');
    });
  });
})();

/* ---------- Tilt effect for cards ---------- */
(function tiltCards() {
  if (!FINE_POINTER) return;
  document.querySelectorAll('.tilt').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(600px) rotateX(${py * -8}deg) rotateY(${px * 8}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
})();

/* ---------- Glitch title on load + periodic ---------- */
(function glitchTitle() {
  const el = document.getElementById('glitchTitle');
  if (!el) return;
  function fire() {
    el.classList.add('glitching');
    setTimeout(() => el.classList.remove('glitching'), 650);
  }
  setTimeout(fire, 900);
  setInterval(fire, 7000);
})();

/* ---------- Terminal typing effect ---------- */
function initTerminals() {
  const terms = document.querySelectorAll('.terminal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (el.dataset.done) return;
      el.dataset.done = '1';
      let lines = [];
      try { lines = JSON.parse(el.dataset.lines || '[]'); } catch (e) { lines = []; }
      el.innerHTML = '';
      let i = 0;
      function typeLine() {
        if (i >= lines.length) {
          const cursor = document.createElement('span');
          cursor.className = 't-cursor';
          el.appendChild(cursor);
          return;
        }
        const p = document.createElement('div');
        p.className = 't-line';
        el.appendChild(p);
        const text = lines[i];
        let ci = 0;
        const speed = 14;
        p.classList.add('shown');
        const tick = () => {
          p.textContent = text.slice(0, ci);
          ci++;
          if (ci <= text.length) { setTimeout(tick, speed); }
          else { i++; setTimeout(typeLine, 220); }
        };
        tick();
      }
      typeLine();
      io.unobserve(el);
    });
  }, { threshold: 0.35 });
  terms.forEach(t => io.observe(t));
}

/* ---------- Tabs filter for tool grids ---------- */
(function tabsFilter() {
  document.querySelectorAll('.tabs').forEach(tabGroup => {
    const targetId = tabGroup.dataset.target;
    const attr = tabGroup.dataset.attr || 'phase';
    tabGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab');
      if (!btn || btn.classList.contains('active')) return;
      tabGroup.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      const grid = document.getElementById(targetId);
      const cards = Array.from(grid.querySelectorAll('.tool-card, .platform-card'));

      /* FIRST — hazırkı (filtrdən əvvəlki) mövqeləri qeyd et */
      const firstRects = new Map();
      cards.forEach(card => {
        if (!card.classList.contains('hide')) firstRects.set(card, card.getBoundingClientRect());
      });

      /* Filtri tətbiq et */
      cards.forEach(card => {
        const val = attr === 'cat' ? card.dataset.cat : card.dataset.phase;
        const willShow = filter === 'all' || val === filter;
        const wasHidden = card.classList.contains('hide');
        card.classList.toggle('hide', !willShow);
        if (willShow && wasHidden) card.classList.add('entering');
      });

      /* LAST + INVERT + PLAY — sıçrayışsız, hamar keçid (FLIP texnikası) */
      requestAnimationFrame(() => {
        cards.forEach(card => {
          if (card.classList.contains('hide')) return;
          const first = firstRects.get(card);
          if (first) {
            const last = card.getBoundingClientRect();
            const dx = first.left - last.left;
            const dy = first.top - last.top;
            if (dx || dy) {
              card.style.transition = 'none';
              card.style.transform = `translate(${dx}px, ${dy}px)`;
              requestAnimationFrame(() => {
                card.style.transition = '';
                card.style.transform = '';
              });
            }
          }
          if (card.classList.contains('entering')) {
            requestAnimationFrame(() => card.classList.remove('entering'));
          }
        });
      });
    });
  });
})();

/* ---------- FAQ accordion ---------- */
(function accordion() {
  document.querySelectorAll('.acc-item').forEach(item => {
    const head = item.querySelector('.acc-head');
    const body = item.querySelector('.acc-body');
    head.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.acc-item').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.acc-body').style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('open');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });
})();

window.addEventListener('resize', () => {
  document.querySelectorAll('.acc-item.open .acc-body').forEach(b => { b.style.maxHeight = b.scrollHeight + 'px'; });
});

/* ---------- Back to top ---------- */
(function backToTop() {
  const btn = document.getElementById('toTop');
  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 700);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* ---------- Hat cards: tap-to-flip for touch devices ---------- */
(function hatCards() {
  document.querySelectorAll('.hat-card').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('flipped');
    });
  });
})();

/* ---------- Scroll progress bar ---------- */
(function scrollProgress() {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  function update() {
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const height = h.scrollHeight - h.clientHeight;
    const pct = height > 0 ? (scrolled / height) * 100 : 0;
    bar.style.width = pct + '%';
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* ---------- Typewriter reveal for headings ---------- */
function initTypewriter() {
  const els = document.querySelectorAll('.type-on-scroll');
  els.forEach(el => {
    el.classList.remove('type-in');
    // Daxilində HTML elementi varsa (məs. <span class="threat-sub">),
    // hərf-hərf bölmə həmin stili pozardı — bütöv şəkildə fade edirik.
    if (el.querySelector('*') && el.children.length) {
      const inner = el.innerHTML;
      const wrap = document.createElement('span');
      wrap.className = 'tw-all';
      wrap.innerHTML = inner;
      el.innerHTML = '';
      el.appendChild(wrap);
      return;
    }
    const text = el.textContent;
    el.textContent = '';
    let idx = 0;
    // hər söz ayrıca "nowrap" qutuda — sətir yalnız sözlər arasında qırılır
    text.split(/(\s+)/).forEach(part => {
      if (!part) return;
      if (/^\s+$/.test(part)) { el.appendChild(document.createTextNode(' ')); return; }
      const word = document.createElement('span');
      word.className = 'tw-w';
      part.split('').forEach(ch => {
        const c = document.createElement('span');
        c.className = 'tw-c';
        c.textContent = ch;
        c.style.transitionDelay = `${Math.min(idx * 18, 900)}ms`;
        idx++;
        word.appendChild(c);
      });
      el.appendChild(word);
    });
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('type-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  els.forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      el.classList.add('type-in');   // artıq ekrandadırsa, dərhal göstər
    } else {
      io.observe(el);
    }
  });
}

/* ---------- Legal spectrum bars ---------- */
(function spectrumBars() {
  const bars = document.querySelectorAll('.spectrum');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const pos = el.dataset.pos || '50';
        const dot = el.querySelector('.spectrum-dot');
        requestAnimationFrame(() => {
          el.classList.add('in-view');
          dot.style.left = pos + '%';
        });
        io.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  bars.forEach(b => io.observe(b));
})();

/* ---------- Kill chain: simulate attack walkthrough ---------- */
(function simulateAttack() {
  const btn = document.getElementById('simulateBtn');
  const label = document.getElementById('simulateLabel');
  if (!btn) return;
  const redSteps = Array.from(document.querySelectorAll('.kc-red .kc-step'));
  const blueSteps = Array.from(document.querySelectorAll('.kc-blue .kc-step'));
  let running = false;

  function reset() {
    [...redSteps, ...blueSteps].forEach(s => s.classList.remove('active', 'done'));
  }

  async function play() {
    if (running) return;
    running = true;
    btn.classList.add('running');
    label.textContent = I18N.dyn().simulateRunning;
    reset();
    for (const step of redSteps) {
      step.classList.add('active');
      await new Promise(r => setTimeout(r, 480));
      step.classList.remove('active');
      step.classList.add('done');
    }
    for (const step of blueSteps) {
      step.classList.add('active');
      await new Promise(r => setTimeout(r, 480));
      step.classList.remove('active');
      step.classList.add('done');
    }
    label.textContent = I18N.dyn().simulateAgain;
    btn.classList.remove('running');
    running = false;
  }

  btn.addEventListener('click', play);
})();

/* ---------- Kill chain: toxunma / klaviatura ilə izah aç-bağla ----------
   Masaüstündə (siçan olan, geniş ekran) izah :hover / :focus ilə kiçik "popover" kimi görünür.
   Telefon və planşetdə (hover yoxdur və ya ekran ≤900px) addımın öz içində, axının daxilində
   açılır — heç bir qonşu addımın üstünə düşmür. CSS-dəki media sorğusu ilə eynidir. */
(function killChainTips() {
  const steps = document.querySelectorAll('.kc-step');
  if (!steps.length) return;
  const mq = window.matchMedia('(max-width: 900px), (hover: none)');

  function closeAll() {
    steps.forEach(s => { s.classList.remove('kc-open'); s.setAttribute('aria-expanded', 'false'); });
  }
  function toggle(step) {
    if (!mq.matches) return;
    const wasOpen = step.classList.contains('kc-open');
    closeAll();
    if (!wasOpen) { step.classList.add('kc-open'); step.setAttribute('aria-expanded', 'true'); }
  }

  steps.forEach(step => {
    step.setAttribute('tabindex', '0');
    step.setAttribute('role', 'button');
    step.setAttribute('aria-expanded', 'false');
    step.addEventListener('click', () => toggle(step));
    step.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(step); }
      else if (e.key === 'Escape') closeAll();
    });
  });
  const onChange = () => closeAll();
  if (mq.addEventListener) mq.addEventListener('change', onChange); else mq.addListener(onChange);
})();

/* ---------- Kartların ardıcıl (stagger) görünməsi ---------- */
(function staggerInit() {
  const groups = document.querySelectorAll('.why-grid, .tool-grid, .platform-grid, .case-grid, .legal-grid, .ti-list, .ethics-badges, .tool-chip-row');
  if (!groups.length) return;
  groups.forEach(g => {
    g.classList.add('stagger');
    Array.from(g.children).forEach((c, i) => { if (!c.style.getPropertyValue('--i')) c.style.setProperty('--i', i); });
  });
  if (!('IntersectionObserver' in window)) { groups.forEach(g => g.classList.add('in-view', 'done')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in-view');
      // animasiya bitəndən sonra söndür ki, filtr/dil dəyişəndə təkrar gecikməsin
      setTimeout(() => e.target.classList.add('done'), 1900);
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  groups.forEach(g => io.observe(g));
})();

/* ---------- İlkin animasiya başlatmaları ---------- */
initTypewriter();
initTerminals();

/* ---------- Offline dəstəyi (Service Worker) ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { });
  });
}

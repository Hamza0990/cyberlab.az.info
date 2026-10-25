/* ==========================================================
   CYBERLAB — soon/script.js
   Sosial şəbəkə ikonlarından gələn "tezliklə" səhifəsi.
   Asılılıq: yalnız ../translations.js-dəki META/adlar (əgər yüklənə bilsə).
   translations.js yüklənməsə belə, bu fayl öz TEXT lüğəti ilə tam işləyir.
========================================================== */
(function () {
  'use strict';

  var SUPPORTED = ['az', 'en', 'ru', 'tr'];
  var DEFAULT_LANG = 'az';

  var NETWORKS = {
    instagram: { label: 'Instagram', icon: 'fa-brands fa-instagram' },
    tiktok: { label: 'TikTok', icon: 'fa-brands fa-tiktok' },
    facebook: { label: 'Facebook', icon: 'fa-brands fa-facebook-f' },
    youtube: { label: 'YouTube', icon: 'fa-brands fa-youtube' },
    linkedin: { label: 'LinkedIn', icon: 'fa-brands fa-linkedin-in' },
    telegram: { label: 'Telegram', icon: 'fa-brands fa-telegram' },
  };
  var ORDER = ['instagram', 'tiktok', 'facebook', 'youtube', 'linkedin', 'telegram'];

  /* Real nömrə gələndə burada dəyişin (beynəlxalq format, boşluqsuz). */
  var WHATSAPP_NUMBER = '994000000000';

  var STATUS = {
    az: ['Səhifə hazırlanır…', 'Məzmun yüklənir…', 'Dizayn tənzimlənir…', 'Tezliklə hazır olacaq…'],
    en: ['Preparing the page…', 'Loading content…', 'Fine-tuning the design…', 'Almost ready…'],
    ru: ['Страница готовится…', 'Загружаем контент…', 'Настраиваем дизайн…', 'Уже почти готово…'],
    tr: ['Sayfa hazırlanıyor…', 'İçerik yükleniyor…', 'Tasarım ayarlanıyor…', 'Neredeyse hazır…'],
  };

  var TEXT = {
    az: {
      title: 'Tezliklə — CyberLab',
      eyebrow: 'CYBERLAB · SOSİAL ŞƏBƏKƏ',
      titleA: 'Tezliklə burdayıq —',
      desc: 'Bu hesab hazırda hazırlanır. Yeniliklərdən xəbərdar olmaq üçün bizimlə əlaqədə qalın — açılan kimi burada canlı link görünəcək.',
      back: 'Sayta qayıt',
      whatsapp: 'WhatsApp ilə yaz',
      otherLabel: 'Digər şəbəkələrimiz:',
      footNote: 'Təhsil məqsədli konseptual mənbə · icra oluna bilən hücum kodu daxil deyil.',
      unknown: 'Sosial şəbəkə',
    },
    en: {
      title: 'Coming soon — CyberLab',
      eyebrow: 'CYBERLAB · SOCIAL NETWORK',
      titleA: 'Coming soon on',
      desc: 'This account is currently being prepared. Stay in touch to hear about updates — a live link will appear here as soon as it launches.',
      back: 'Back to site',
      whatsapp: 'Message us on WhatsApp',
      otherLabel: 'Our other networks:',
      footNote: 'Educational, conceptual resource · contains no executable attack code.',
      unknown: 'Social network',
    },
    ru: {
      title: 'Скоро — CyberLab',
      eyebrow: 'CYBERLAB · СОЦСЕТЬ',
      titleA: 'Скоро будем в',
      desc: 'Этот аккаунт сейчас готовится. Следите за обновлениями — как только он заработает, здесь появится рабочая ссылка.',
      back: 'Вернуться на сайт',
      whatsapp: 'Написать в WhatsApp',
      otherLabel: 'Наши другие сети:',
      footNote: 'Образовательный концептуальный ресурс · без исполняемого кода атак.',
      unknown: 'Социальная сеть',
    },
    tr: {
      title: 'Yakında — CyberLab',
      eyebrow: 'CYBERLAB · SOSYAL AĞ',
      titleA: 'Yakında buradayız —',
      desc: 'Bu hesap şu anda hazırlanıyor. Gelişmelerden haberdar olmak için bizimle iletişimde kalın — açılır açılmaz burada canlı bağlantı görünecek.',
      back: 'Siteye dön',
      whatsapp: "WhatsApp'tan yaz",
      otherLabel: 'Diğer ağlarımız:',
      footNote: 'Eğitim amaçlı kavramsal kaynak · çalıştırılabilir saldırı kodu içermez.',
      unknown: 'Sosyal ağ',
    },
  };

  function qs(name) {
    try {
      return new URLSearchParams(window.location.search).get(name);
    } catch (e) {
      return null;
    }
  }

  function detectLang() {
    var q = (qs('lang') || '').toLowerCase();
    if (SUPPORTED.indexOf(q) !== -1) return q;
    // Sənədin özündə əvvəldən qoyulmuş lang (məs. birbaşa /soon/?lang=... olmadan gəlinsə)
    var docLang = (document.documentElement.lang || '').toLowerCase();
    if (SUPPORTED.indexOf(docLang) !== -1) return docLang;
    // Brauzer dili ehtiyat variant kimi
    var nav = ((navigator.language || navigator.userLanguage || '') + '').slice(0, 2).toLowerCase();
    if (SUPPORTED.indexOf(nav) !== -1) return nav;
    return DEFAULT_LANG;
  }

  function detectNetwork() {
    var n = (qs('n') || qs('network') || '').toLowerCase();
    return Object.prototype.hasOwnProperty.call(NETWORKS, n) ? n : null;
  }

  var lang = detectLang();
  var netKey = detectNetwork();
  var net = netKey ? NETWORKS[netKey] : null;
  var t = TEXT[lang] || TEXT[DEFAULT_LANG];

  document.documentElement.lang = lang;

  function applyText() {
    document.title = net ? net.label + ' · ' + t.title : t.title;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.dataset.i18n;
      if (t[key] != null) el.textContent = t[key];
    });
  }

  function applyNetwork() {
    var iconWrap = document.getElementById('networkIcon');
    var nameEl = document.getElementById('networkName');

    var label = net ? net.label : t.unknown;
    var icon = net ? net.icon : 'fa-solid fa-hourglass-half';

    if (iconWrap) iconWrap.innerHTML = '<i class="' + icon + '" aria-hidden="true"></i>';
    if (nameEl) nameEl.textContent = label;
  }

  function applyWhatsapp() {
    var btn = document.getElementById('whatsappBtn');
    if (!btn) return;
    var label = net ? net.label : t.unknown;
    var messages = {
      az: 'Salam! ' + label + ' hesabınız barədə soruşmaq istəyirəm.',
      en: 'Hi! I wanted to ask about your ' + label + ' account.',
      ru: 'Здравствуйте! Хотел(а) спросить про ваш аккаунт ' + label + '.',
      tr: 'Merhaba! ' + label + ' hesabınız hakkında bilgi almak istiyorum.',
    };
    var text = messages[lang] || messages[DEFAULT_LANG];
    btn.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);
  }

  /* Terminal-tərzi "yazan" status sətri: mesajları yazır, bir az gözləyir, silir, növbətiyə keçir.
     Hərəkətə həssas istifadəçilər üçün animasiyasız, sabit ilk mesaj göstərilir. */
  function statusTicker() {
    var el = document.getElementById('statusText');
    if (!el) return;
    var messages = STATUS[lang] || STATUS[DEFAULT_LANG];
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion || !messages.length) {
      el.textContent = messages[0] || '';
      return;
    }

    var mi = 0, ci = 0, deleting = false;
    var TYPE_MS = 42, DELETE_MS = 22, HOLD_MS = 1400, GAP_MS = 300;

    function tick() {
      var msg = messages[mi];
      if (!deleting) {
        ci++;
        el.textContent = msg.slice(0, ci);
        if (ci >= msg.length) {
          deleting = false;
          setTimeout(function () { deleting = true; tick(); }, HOLD_MS);
          return;
        }
        setTimeout(tick, TYPE_MS);
      } else {
        ci--;
        el.textContent = msg.slice(0, ci);
        if (ci <= 0) {
          deleting = false;
          mi = (mi + 1) % messages.length;
          setTimeout(tick, GAP_MS);
          return;
        }
        setTimeout(tick, DELETE_MS);
      }
    }
    tick();
  }

  function buildOtherIcons() {
    var wrap = document.getElementById('otherIcons');
    if (!wrap) return;
    ORDER.forEach(function (key) {
      if (key === netKey) return;
      var n = NETWORKS[key];
      var a = document.createElement('a');
      a.href = 'index.html?n=' + key + '&lang=' + lang;
      a.setAttribute('aria-label', n.label);
      a.title = n.label;
      a.innerHTML = '<i class="' + n.icon + '" aria-hidden="true"></i>';
      wrap.appendChild(a);
    });
  }

  function langMenu() {
    var box = document.getElementById('langBox');
    var trigger = document.getElementById('langTrigger');
    var menu = document.getElementById('langMenu');
    var code = document.getElementById('langCode');
    if (!box || !trigger || !menu) return;

    code.textContent = lang.toUpperCase();
    menu.querySelectorAll('button').forEach(function (btn) {
      if (btn.dataset.lang === lang) btn.setAttribute('aria-current', 'true');
      btn.addEventListener('click', function () {
        var params = new URLSearchParams(window.location.search);
        params.set('lang', btn.dataset.lang);
        window.location.search = params.toString();
      });
    });

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = box.classList.toggle('open');
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function () {
      box.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        box.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- Tema keçidi (dark/light) ----------
     Əsas saytla eyni açar (theme-init.js): orada hansı tema seçilibsə burada da odur. */
  function themeToggle() {
    var toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    toggle.addEventListener('click', function () {
      if (window.CyberTheme) window.CyberTheme.toggle();
    });
  }

  /* Fon: yüngül "şəbəkə nöqtələri" animasiyası (əsas saytdakı netCanvas-ın sadələşdirilmiş versiyası) */
  function bgCanvas() {
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var canvas = document.getElementById('bgCanvas');
    if (!canvas || reduceMotion) return;
    var ctx = canvas.getContext('2d');
    var w, h, dots;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      var count = Math.min(70, Math.round((w * h) / 22000));
      dots = Array.from({ length: count }, function () {
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
        };
      });
    }

    function tick() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(38,201,224,0.55)';
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(255,59,78,0.12)';
      for (var a = 0; a < dots.length; a++) {
        for (var b = a + 1; b < dots.length; b++) {
          var dx = dots[a].x - dots[b].x, dy = dots[a].y - dots[b].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.globalAlpha = 1 - dist / 120;
            ctx.beginPath();
            ctx.moveTo(dots[a].x, dots[a].y);
            ctx.lineTo(dots[b].x, dots[b].y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(tick);
  }

  applyText();
  applyNetwork();
  applyWhatsapp();
  statusTicker();
  buildOtherIcons();
  langMenu();
  themeToggle();
  bgCanvas();
})();

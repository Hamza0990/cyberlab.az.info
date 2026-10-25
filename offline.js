/* CYBERLAB — offline.js (offline.html üçün; CSP inline skripti bloklayır, ona görə ayrı fayl) */
(function () {
    var T = {
      az: { t: 'Şəbəkəniz yoxdur', m: 'CyberLab-a qoşulmaq üçün internetə ehtiyac var. Şəbəkəyə qoşulan kimi bu səhifə avtomatik yenidən yüklənəcək.', b: 'Yenidən yoxla', title: 'Şəbəkə yoxdur | CyberLab' },
      en: { t: 'You are offline', m: 'An internet connection is required to reach CyberLab. This page will reload automatically as soon as you are back online.', b: 'Retry', title: 'Offline | CyberLab' },
      ru: { t: 'Нет подключения', m: 'Для доступа к CyberLab нужен интернет. Эта страница автоматически перезагрузится, как только связь восстановится.', b: 'Проверить снова', title: 'Нет сети | CyberLab' },
      tr: { t: 'Bağlantınız yok', m: 'CyberLab’a erişmek için internet gerekiyor. Ağa bağlandığınız anda bu sayfa otomatik olarak yeniden yüklenecek.', b: 'Tekrar dene', title: 'Çevrimdışı | CyberLab' }
    };
    var lang = (navigator.language || 'az').slice(0, 2).toLowerCase();
    var d = T[lang] || T.az;
    document.documentElement.lang = T[lang] ? lang : 'az';
    document.title = d.title;
    document.getElementById('t').textContent = d.t;
    document.getElementById('m').textContent = d.m;
    document.getElementById('b').textContent = d.b;

    window.addEventListener('online', function () { location.reload(); });
    setInterval(function () { if (navigator.onLine) location.reload(); }, 4000);

  var btn = document.getElementById('b');
  if (btn) btn.addEventListener('click', function () { location.reload(); });
})();

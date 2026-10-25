/* CYBERLAB — theme-init.js
   Dark/Light seçimini bütün səhifələrdə (əsas sayt + soon/) eyni saxlayır.
   <head>-də sinxron yüklənir ki, səhifə çəkilməzdən əvvəl tema qoyulsun (yanıb-sönmə olmasın).
   Skript ayrı fayldır, çünki server CSP-si (scriptSrc 'self') inline skriptləri bloklayır. */
(function () {
  var KEY = 'cyberlab-theme';
  var root = document.documentElement;
  var COLORS = { dark: '#0A0E13', light: '#EDF1F4' };

  function read() {
    try {
      var v = window.localStorage.getItem(KEY);
      return v === 'light' || v === 'dark' ? v : null;
    } catch (e) { return null; }
  }
  function write(mode) {
    try { window.localStorage.setItem(KEY, mode); } catch (e) { /* private rejim və s. */ }
  }
  function apply(mode) {
    root.setAttribute('data-theme', mode);
    root.style.colorScheme = mode;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', COLORS[mode]);
    var btn = document.getElementById('themeToggle');
    if (btn) btn.setAttribute('aria-pressed', mode === 'light' ? 'true' : 'false');
  }
  function current() { return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }

  apply(read() || 'dark');

  window.CyberTheme = {
    get: current,
    set: function (mode) { apply(mode); write(mode); },
    toggle: function () { this.set(current() === 'dark' ? 'light' : 'dark'); }
  };

  // başqa tabda / səhifədə tema dəyişəndə bu səhifə də eyni olsun
  window.addEventListener('storage', function (e) {
    if (e.key === KEY && (e.newValue === 'light' || e.newValue === 'dark')) apply(e.newValue);
  });
  // meta + düymə DOM hazır olandan sonra da sinxronlaşsın
  document.addEventListener('DOMContentLoaded', function () { apply(current()); });
})();

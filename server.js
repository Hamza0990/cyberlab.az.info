/**
 * ============================================================================
 *  CYBERLAB — TAM PRODUCTION SERVER
 * ============================================================================
 *  Bu tək fayl bütün əvvəlki mərhələləri birləşdirir:
 *    • Çoxdilli statik saytın ötürülməsi (AZ / EN / RU / TR)
 *    • SEO: kanonik 301 yönləndirmə, robots.txt, sitemap.xml, GSC doğrulama
 *    • Çoxqatlı müdafiə: rate-limit, slow-down, imza əsaslı WAF, avto IP blok
 *    • Offline dəstəyi (Service Worker başlıqları)
 *    • Admin panel (/admin) — canlı statistika və IP idarəetməsi
 *
 *  Müdafiə fəlsəfəsi: "Defense in Depth" — bir qat aşılsa, digəri saxlayır.
 *  Qatlar aşağıda 0-dan 12-yə qədər nömrələnib.
 * ============================================================================
 */

require('dotenv').config();

const path = require('path');
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const hpp = require('hpp');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

const app = express();

/* ---------------------------------------------------------------- Konfiq */
const PORT              = process.env.PORT || 3000;
const IS_PROD           = process.env.NODE_ENV === 'production';
const BEHIND_PROXY      = process.env.BEHIND_PROXY === 'true';
const CANONICAL_HOST    = (process.env.CANONICAL_HOST || 'cyberlab.az.info').toLowerCase();
const FORCE_HTTPS       = process.env.FORCE_HTTPS === 'true';
const RATE_LIMIT_MAX    = parseInt(process.env.RATE_LIMIT_MAX || '120', 10);
const STRIKE_LIMIT      = parseInt(process.env.STRIKE_LIMIT || '3', 10);
const BLOCK_MINUTES     = parseInt(process.env.BLOCK_MINUTES || '15', 10);
const MAX_URL_LENGTH    = parseInt(process.env.MAX_URL_LENGTH || '2048', 10);
const ADMIN_USER        = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD    = process.env.ADMIN_PASSWORD || '';

const SITE_URL   = `https://${CANONICAL_HOST}`;
const PUBLIC_DIR = __dirname;  // Serve static files from root directory
const ADMIN_DIR  = path.join(__dirname, 'admin');
const STARTED_AT = Date.now();

/* ============================================================================
   QAT 0 — Proxy etibarı və server izinin gizlədilməsi
   Cloudflare/Nginx arxasında real istifadəçi IP-si X-Forwarded-For-dan gəlir.
   Yanlış konfiqurasiya rate-limit-i yararsız edərdi (hamı eyni IP görünərdi).
============================================================================ */
app.set('trust proxy', BEHIND_PROXY ? 1 : false);
app.disable('x-powered-by');          // "Express" imzasını gizlədir (fingerprinting əleyhinə)
app.set('etag', 'strong');

/* ============================================================================
   QAT 1 — Erkən sanitarlaşdırma: həddindən uzun və pozuq URL-lər
   Bəzi hücumlar nəhəng URL ilə yaddaş/parser tükətməyə çalışır.
============================================================================ */
app.use((req, res, next) => {
  if ((req.originalUrl || '').length > MAX_URL_LENGTH) {
    return res.status(414).json({ error: 'Sorğu ünvanı çox uzundur.' });
  }
  // Null bayt inyeksiyası
  if ((req.originalUrl || '').includes('\0')) {
    return res.status(400).json({ error: 'Sorğu qəbul olunmadı.' });
  }
  next();
});

/* ============================================================================
   QAT 2 — KANONİK DOMEN YÖNLƏNDİRMƏSİ  (SEO üçün kritik)
     http://cyberlab.az.info       ─┐
     https://www.cyberlab.az.info  ─┼──► https://cyberlab.az.info   (301)
     http://www.cyberlab.az.info   ─┘
   Google eyni məzmunu bir neçə ünvanda görsə reytinq bölünür.
============================================================================ */
app.use((req, res, next) => {
  if (!IS_PROD) return next();                 // lokal inkişafda yönləndirmə yoxdur

  const host   = (req.headers.host || '').toLowerCase().split(':')[0];
  const proto  = req.headers['x-forwarded-proto'] || req.protocol;
  const needsHttps = FORCE_HTTPS && proto !== 'https';
  const needsHost  = host && host !== CANONICAL_HOST;

  if (needsHttps || needsHost) {
    return res.redirect(301, SITE_URL + req.originalUrl);
  }
  next();
});

/* ============================================================================
   QAT 3 — Təhlükəsizlik başlıqları (Helmet + CSP)
   CSP yalnız saytın həqiqətən istifadə etdiyi mənbələrə icazə verir —
   XSS baş versə belə, kənar skript yüklənə bilmir.
============================================================================ */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        scriptSrc:   ["'self'"],
        styleSrc:    ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
        fontSrc:     ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com', 'data:'],
        imgSrc:      ["'self'", 'data:'],
        connectSrc:  ["'self'"],
        workerSrc:   ["'self'"],            // Service Worker (offline rejim) üçün
        objectSrc:   ["'none'"],            // Flash/plugin tamamilə bağlı
        baseUri:     ["'self'"],            // <base> ilə yönləndirmə hücumu əleyhinə
        formAction:  ["'self'"],
        frameAncestors: ["'self'"],         // clickjacking əleyhinə
        upgradeInsecureRequests: IS_PROD ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    noSniff: true,
    frameguard: { action: 'sameorigin' },
  })
);

/* ============================================================================
   QAT 4 — Sıxılma, gövdə limiti, parametr çirklənməsi
============================================================================ */
app.use(compression());
app.use(express.json({ limit: '10kb' }));           // nəhəng JSON ilə DoS əleyhinə
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(hpp());                                      // ?a=1&a=2 tipli HPP hücumu

/* ============================================================================
   QAT 5 — Audit jurnalı
============================================================================ */
app.use(
  morgan(IS_PROD ? 'combined' : 'dev', {
    skip: (req) => req.path === '/healthz',
  })
);

/* ============================================================================
   QAT 6 — Statistika (admin panel üçün)
============================================================================ */
const getIp = (req) => req.ip || req.connection?.remoteAddress || 'unknown';

const stats = { totalRequests: 0, blockedRequests: 0, uniqueIps: new Set() };

app.use((req, res, next) => {
  stats.totalRequests += 1;
  if (stats.uniqueIps.size < 50000) stats.uniqueIps.add(getIp(req));  // yaddaş qoruması
  next();
});

/* ============================================================================
   QAT 7 — Sürət limitləmə (DDoS / brute-force)
   Limit Googlebot-un normal tempini bloklamayacaq qədər genişdir.
============================================================================ */
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Çox sayda sorğu göndərildi. Bir az sonra cəhd edin.' },
  })
);

// Limitə yaxınlaşanda süni gecikmə — botu yavaşladır, real istifadəçini əngəlləmir
app.use(
  slowDown({
    windowMs: 60 * 1000,
    delayAfter: Math.floor(RATE_LIMIT_MAX * 0.6),
    delayMs: () => 250,
    maxDelayMs: 3000,
  })
);

/* ============================================================================
   QAT 8 — İMZA ƏSASLI MİNİ-WAF + AVTOMATİK IP BLOKU
   Skanerlərin və hücum alətlərinin klassik imzalarını tanıyır.
   STRIKE_LIMIT (default 3) cəhddən sonra IP avtomatik bloklanır.
============================================================================ */
const strikeMap = new Map();   // ip -> { count, blockedUntil }

const SUSPICIOUS_PATTERNS = [
  /\.\.[\/\\]/,                        // path traversal
  /<script/i,                          // XSS
  /javascript:/i,
  /on(error|load|click)\s*=/i,         // inline event handler inyeksiyası
  /union[\s\+]+select/i,               // SQLi
  /(\bor\b|\band\b)[\s\+]+1[\s\+]*=[\s\+]*1/i,
  /sleep\(\s*\d+\s*\)/i,               // time-based SQLi
  /(\.env|\.git\/|\.ssh\/|\.aws\/)/i,  // sensitiv fayl skanı
  /wp-(login|admin|content|includes)/i,// WordPress skaneri
  /phpmyadmin|adminer\.php/i,
  /etc\/passwd|proc\/self/i,           // LFI
  /base64_decode|eval\(|system\(|exec\(/i,
  /\$\{jndi:/i,                        // Log4Shell
  /\/cgi-bin\//i,
];

// Bilinən zərərli/skan user-agent imzaları
const BAD_AGENTS = /(sqlmap|nikto|nmap|masscan|havij|acunetix|nessus|zgrab|dirbuster|gobuster|wpscan)/i;

app.use((req, res, next) => {
  const ip = getIp(req);
  const entry = strikeMap.get(ip);

  // Artıq bloklanıbsa — dərhal kəs
  if (entry && entry.blockedUntil > Date.now()) {
    stats.blockedRequests += 1;
    return res.status(403).json({ error: 'IP müvəqqəti bloklanıb.' });
  }

  let target = req.originalUrl || '';
  try { target = decodeURIComponent(target); } catch (_) { /* pozuq kodlaşdırma */ }

  const ua = req.headers['user-agent'] || '';
  const isSuspicious = SUSPICIOUS_PATTERNS.some((re) => re.test(target)) || BAD_AGENTS.test(ua);

  if (isSuspicious) {
    const cur = entry || { count: 0, blockedUntil: 0 };
    cur.count += 1;

    if (cur.count >= STRIKE_LIMIT) {
      cur.blockedUntil = Date.now() + BLOCK_MINUTES * 60 * 1000;
      cur.count = 0;
      stats.blockedRequests += 1;
      console.warn(`[WAF] IP bloklandı: ${ip} — ${BLOCK_MINUTES} dəq | UA: ${ua.slice(0, 60)}`);
    }
    strikeMap.set(ip, cur);
    return res.status(400).json({ error: 'Sorğu qəbul olunmadı.' });
  }
  next();
});

// Köhnə qeydləri təmizlə (yaddaş sızmasının qarşısı)
setInterval(() => {
  const now = Date.now();
  for (const [ip, e] of strikeMap) {
    if (e.blockedUntil < now && e.count === 0) strikeMap.delete(ip);
  }
}, 10 * 60 * 1000).unref();

/* ============================================================================
   QAT 9 — SEO FAYLLARI (Google-un saytı tapıb indeksləməsi üçün)
============================================================================ */
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(
    ['User-agent: *', 'Allow: /', 'Disallow: /admin', '', `Sitemap: ${SITE_URL}/sitemap.xml`].join('\n')
  );
});

app.get('/sitemap.xml', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const sections = ['', '#osint', '#ddos', '#rat', '#phishing', '#teamintro',
                    '#killchain', '#redteam', '#blueteam', '#hats', '#cases', '#labs', '#faq', '#ethics'];
  const urls = sections.map((s) => `  <url>
    <loc>${SITE_URL}/${s}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${s === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n');

  res.type('application/xml').send(
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`);
});

// Google Search Console HTML doğrulama faylı
if (process.env.GOOGLE_VERIFICATION) {
  const token = process.env.GOOGLE_VERIFICATION.replace(/[^a-zA-Z0-9]/g, '');
  app.get(`/google${token}.html`, (req, res) => {
    res.type('text/html').send(`google-site-verification: google${token}.html`);
  });
}

app.get('/.well-known/security.txt', (req, res) => {
  res.type('text/plain').send([
    `Contact: mailto:security@${CANONICAL_HOST}`,
    'Preferred-Languages: az, en, ru, tr',
    `Canonical: ${SITE_URL}/.well-known/security.txt`,
    `Policy: ${SITE_URL}/#ethics`,
  ].join('\n'));
});

app.get('/healthz', (req, res) => res.status(200).json({ status: 'ok' }));

/* ============================================================================
   QAT 10 — ADMİN PANEL (/admin)
   Basic Auth + timing-safe müqayisə + ayrıca brute-force limiti.
   ADMIN_PASSWORD boşdursa panel TAMAMİLƏ deaktivdir (404) — təhlükəsiz default.
============================================================================ */
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);   // vaxt sızmasının qarşısı
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function adminAuth(req, res, next) {
  if (!ADMIN_PASSWORD) {
    return res.status(404).json({ error: 'Admin panel deaktivdir.' });
  }
  const [scheme, encoded] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Basic' || !encoded) {
    res.set('WWW-Authenticate', 'Basic realm="CyberLab Admin"');
    return res.status(401).json({ error: 'Giriş tələb olunur.' });
  }
  const decoded = Buffer.from(encoded, 'base64').toString('utf8');
  const sep = decoded.indexOf(':');
  const okUser = safeEqual(decoded.slice(0, sep), ADMIN_USER);
  const okPass = safeEqual(decoded.slice(sep + 1), ADMIN_PASSWORD);

  if (!okUser || !okPass) {
    res.set('WWW-Authenticate', 'Basic realm="CyberLab Admin"');
    return res.status(401).json({ error: 'İstifadəçi adı və ya şifrə səhvdir.' });
  }
  next();
}

const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çox sayda giriş cəhdi. 5 dəqiqə sonra cəhd edin.' },
});

app.get('/admin', adminLimiter, adminAuth, (req, res) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.sendFile(path.join(ADMIN_DIR, 'admin.html'));
});

app.get('/admin/api/status', adminLimiter, adminAuth, (req, res) => {
  const now = Date.now();
  const blockedIps = [];
  for (const [ip, e] of strikeMap) {
    if (e.blockedUntil > now) {
      blockedIps.push({ ip, remainingMinutes: Math.ceil((e.blockedUntil - now) / 60000), blockedUntil: e.blockedUntil });
    }
  }
  res.json({
    uptimeSeconds: Math.floor((now - STARTED_AT) / 1000),
    totalRequests: stats.totalRequests,
    blockedRequests: stats.blockedRequests,
    uniqueIps: stats.uniqueIps.size,
    config: { rateLimitMax: RATE_LIMIT_MAX, strikeLimit: STRIKE_LIMIT, blockMinutes: BLOCK_MINUTES },
    blockedIps: blockedIps.sort((a, b) => b.blockedUntil - a.blockedUntil),
  });
});

app.post('/admin/api/block', adminLimiter, adminAuth, (req, res) => {
  const { ip, minutes } = req.body || {};
  if (!ip || typeof ip !== 'string') return res.status(400).json({ error: 'IP ünvanı tələb olunur.' });
  const mins = Number.isFinite(minutes) && minutes > 0 ? minutes : BLOCK_MINUTES;
  strikeMap.set(ip, { count: 0, blockedUntil: Date.now() + mins * 60 * 1000 });
  console.log(`[ADMIN] IP manual bloklandı: ${ip} (${mins} dəq)`);
  res.json({ success: true, ip, minutes: mins });
});

app.post('/admin/api/unblock', adminLimiter, adminAuth, (req, res) => {
  const { ip } = req.body || {};
  if (!ip || typeof ip !== 'string') return res.status(400).json({ error: 'IP ünvanı tələb olunur.' });
  strikeMap.delete(ip);
  console.log(`[ADMIN] IP bloku ləğv edildi: ${ip}`);
  res.json({ success: true, ip });
});

/* ============================================================================
   QAT 10.5 — Vercel Speed Insights  
   Serve Speed Insights script from node_modules for local development.
   On Vercel production, /_vercel/* routes are automatically handled.
============================================================================ */
app.get('/_vercel/speed-insights/script.js', (req, res) => {
  const scriptPath = path.join(__dirname, 'node_modules', '@vercel', 'speed-insights', 'dist', 'index.mjs');
  res.type('application/javascript');
  res.sendFile(scriptPath, (err) => {
    if (err) res.status(404).send('// Speed Insights not available in development');
  });
});

/* ============================================================================
   QAT 11 — Statik fayllar (offline dəstəyi ilə)
============================================================================ */
app.use(
  express.static(PUBLIC_DIR, {
    index: 'index.html',
    dotfiles: 'deny',          // .env, .git kimi faylları heç vaxt vermə
    redirect: false,
    maxAge: IS_PROD ? '7d' : 0,
    setHeaders(res, filePath) {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
      if (filePath.endsWith('sw.js')) {
        res.setHeader('Service-Worker-Allowed', '/');
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  })
);

/* ============================================================================
   QAT 12 — 404 və mərkəzi xəta idarəetməsi (daxili detal sızmır)
============================================================================ */
app.use((req, res) => {
  res.status(404).sendFile(path.join(PUBLIC_DIR, '404.html'), (err) => {
    if (err) res.status(404).type('text/plain').send('404 — Səhifə tapılmadı.');
  });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    error: IS_PROD ? 'Daxili server xətası.' : err.message,   // stack trace heç vaxt sızmır
  });
});

/* ============================================================================
   Başlatma və təmiz bağlanma
============================================================================ */
const server = app.listen(PORT, () => {
  console.log('─'.repeat(58));
  console.log(`  ◈ CYBERLAB — port ${PORT} (${IS_PROD ? 'production' : 'development'})`);
  console.log(`  Kanonik ünvan : ${SITE_URL}`);
  console.log(`  WAF           : ${STRIKE_LIMIT} cəhd → ${BLOCK_MINUTES} dəq blok`);
  console.log(`  Sürət limiti  : ${RATE_LIMIT_MAX} sorğu/dəq`);
  console.log(`  Admin panel   : ${ADMIN_PASSWORD ? '/admin (aktiv)' : 'DEAKTİV (.env-də ADMIN_PASSWORD yoxdur)'}`);
  console.log('─'.repeat(58));
});

// Yavaş-loris tipli hücumlara qarşı bağlantı zaman limitləri
server.headersTimeout = 20000;
server.requestTimeout = 30000;
server.keepAliveTimeout = 15000;

function shutdown(sig) {
  console.log(`\n${sig} alındı — server təmiz bağlanır...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

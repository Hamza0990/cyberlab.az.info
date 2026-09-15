# ◈ CYBERLAB

Çoxdilli kibertəhlükəsizlik təhsil saytı və onun təhlükəsizlik-gücləndirilmiş serveri.
Bütün mərhələlər tək paketdə birləşdirilib.

---

## Fayl strukturu

```
CYBERLAB/
├── server.js            ← Bütün backend (SEO + müdafiə + admin panel)
├── package.json
├── .env.example         ← ".env" adı ilə kopyalayıb doldurun
├── .gitignore
├── README.md
│
├── public/              ← Saytın özü (brauzerə verilən fayllar)
│   ├── index.html       ← Struktur + SEO teqləri
│   ├── style.css        ← Bütün dizayn, animasiyalar, dark/light, mobil
│   ├── app.js           ← İnteraktivlik + i18n mühərriki
│   ├── translations.js  ← EN / RU / TR tərcümələri (AZ = mənbə)
│   ├── favicon.svg      ← Sekmə loqosu
│   ├── 404.html         ← Səhifə tapılmadı
│   ├── offline.html     ← "Şəbəkəniz yoxdur" (4 dildə, avtomatik)
│   └── sw.js            ← Service Worker (offline dəstəyi)
│
└── admin/
    └── admin.html       ← Admin panel (Basic Auth ilə qorunur)
```

---

## Sürətli başlanğıc

```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:3000
```

Production üçün:

```bash
npm start            # NODE_ENV=production
```

---

## Saytın xüsusiyyətləri

### Məzmun
- **4 hücum vektoru** — OSINT, DDoS, RAT, fişinq/ZIP (hər biri üçün "niyə", "harada", "Blue Team necə müdafiə edir" + nümunə ssenari)
- **Kill chain diaqramı** — hücum addımları vs NIST müdafiə funksiyaları, canlandırma düyməsi ilə
- **26 alət icmalı** — Red Team (13) və Blue Team (13) ayrı-ayrı, mərhələyə görə filtrlənən
- **6 haker "şapka" tipi** — White/Black/Gray/Blue/Red/Green, qanunilik spektri ilə
- **4 tarixi hadisə** — Mirai, WannaCry, Target, SolarWinds
- **8 qanuni təlim platforması** — FontAwesome ikonları, kateqoriya və çətinlik göstəriciləri ilə
- **FAQ + hüquqi çərçivə** bölmələri

### Texniki
| Xüsusiyyət | İzah |
|---|---|
| **4 dil** | AZ / EN / RU / TR — bayraqlı dropdown, anlıq keçid, `<title>` və `<html lang>` daxil |
| **Dark / Light** | Tam rəng sistemi hər iki rejimdə |
| **Animasiyalar** | Hissəcik şəbəkəsi fonu, typewriter başlıqlar, scroll-reveal, 3D tilt, maqnit düymələr, glitch, terminal yazma, spektr zolaqları |
| **Mobil** | 360px-ə qədər tam uyğun, üfüqi scroll yoxdur (test edilib) |
| **Offline** | Şəbəkə kəsiləndə öz səhifəniz açılır, qayıdanda avtomatik yenilənir |

---

## Backend müdafiə qatları

Fəlsəfə: **Defense in Depth** — bir qat aşılsa, digəri saxlayır.
`server.js` daxilində 0-dan 12-yə qədər nömrələnib.

| Qat | Nə edir | Hansı hücuma qarşı |
|---|---|---|
| **0** | `trust proxy`, `x-powered-by` gizlədilir | IP spoofing, fingerprinting |
| **1** | URL uzunluğu limiti, null-bayt yoxlaması | Parser/yaddaş tükətmə, null-byte injection |
| **2** | 301 kanonik yönləndirmə | SEO reytinq bölünməsi |
| **3** | Helmet: CSP, HSTS, noSniff, frameguard | XSS, clickjacking, MIME-sniffing |
| **4** | Gövdə limiti (10kb) + HPP | Böyük paket DoS, parametr çirklənməsi |
| **5** | Audit jurnalı (morgan) | İnsident araşdırması |
| **6** | Statistika toplama | Admin panel üçün |
| **7** | Rate limit + tədricən yavaşlatma | DDoS, brute-force |
| **8** | **İmza əsaslı WAF + avtomatik IP blok** | SQLi, XSS, LFI, Log4Shell, skanerlər |
| **9** | robots.txt, sitemap.xml, security.txt | SEO + məsuliyyətli açıqlama |
| **10** | Admin panel (Basic Auth, timing-safe) | Yetkisiz giriş |
| **11** | Statik fayllar, `dotfiles: deny` | `.env`, `.git` sızması |
| **12** | 404 + mərkəzi xəta (stack trace gizli) | Məlumat sızması |

Əlavə: **yavaş-loris** hücumuna qarşı bağlantı zaman limitləri
(`headersTimeout`, `requestTimeout`, `keepAliveTimeout`).

### WAF nəyi tutur

Path traversal · XSS · `javascript:` · inline event handler · SQL injection ·
time-based SQLi · `.env`/`.git`/`.ssh`/`.aws` skanı · WordPress skaneri ·
phpMyAdmin · LFI (`etc/passwd`) · `eval()`/`system()`/`exec()` · **Log4Shell** ·
cgi-bin · və bilinən zərərli user-agent-lər (`sqlmap`, `nikto`, `nmap`, `masscan`,
`acunetix`, `nessus`, `wpscan`, `gobuster` və s.)

**3 şübhəli cəhddən sonra IP avtomatik 15 dəqiqə bloklanır.**
Bu rəqəmlər `.env`-dən dəyişdirilir (`STRIKE_LIMIT`, `BLOCK_MINUTES`).

### Test nəticələri (real olaraq yoxlanıldı)

```
SQL injection ......... 400 ✓        Rate limit (130 sorğu) ... 114×200, 16×429 ✓
XSS ................... 400 ✓        Admin şifrəsiz ........... 401 ✓
Path traversal ........ 400 ✓        Admin səhv şifrə ......... 401 ✓
Log4Shell ............. 403 ✓        Admin düzgün şifrə ....... 200 ✓
.env skanı ............ 403 ✓        www → kanonik ............ 301 ✓
WordPress skanı ....... 403 ✓        Mobil üfüqi scroll ....... yoxdur ✓
sqlmap user-agent ..... 403 ✓        Brauzer JS xətası ........ yoxdur ✓
Uzun URL (3000 simvol)  414 ✓        4 dil də işləyir ......... ✓
```

---

## Admin panel

`.env`-də şifrə təyin edin:

```bash
ADMIN_USER=admin
ADMIN_PASSWORD=çox-güclü-unikal-şifrə
```

Sonra `https://domeniniz/admin` — brauzer giriş pəncərəsi çıxacaq.

Panel göstərir: uptime, ümumi sorğu, bloklanmış sorğu, unikal IP sayı,
bloklanmış IP-lərin siyahısı (tək kliklə blokdan çıxarma) və manual IP bloklama.

> **ADMIN_PASSWORD boş qalsa panel tamamilə deaktiv olur (404).**
> Bu təhlükəsiz defaultdur — təsadüfən qorunmasız panel açıq qalmasın deyə.

---

## "cyberlab.az.info" ünvanında yayımlamaq

Saytın Google-da çıxması **tək başına kodla həll olunmur**. Dörd mərhələ var:

| # | Mərhələ | Kim edir |
|---|---------|----------|
| 1 | Domen qeydiyyatı | **Siz** (pullu) |
| 2 | Hostinq + DNS | **Siz** |
| 3 | Server + SEO qurulması | ✅ **Bu paket — hazırdır** |
| 4 | Google Search Console | **Siz** (pulsuz, 5 dəq) |

### Addım 1 — Domen

⚠️ `cyberlab.az.info` üçün `az.info` domeninin sahibi olmalısınız — bu, adi
qeydiyyatçılarda satılan bir şey deyil. Real variantlar:

- `cyberlab.az` — AzNIC vasitəsilə
- `cyberlab.info` — Namecheap/GoDaddy (~$5/il)
- Pulsuz başlanğıc: `cyberlab.vercel.app`

Hansını seçsəniz, `.env`-də **tək sətri** dəyişin: `CANONICAL_HOST=...`

### Addım 2 — Hostinq

**Ən asan (pulsuz):**
```bash
npm i -g vercel && vercel --prod
```

**Öz VPS-iniz:**
```bash
npm install && cp .env.example .env && nano .env
npm i -g pm2 && pm2 start server.js --name cyberlab && pm2 save && pm2 startup

# HTTPS (pulsuz)
sudo apt install nginx certbot python3-certbot-nginx
sudo certbot --nginx -d cyberlab.az.info -d www.cyberlab.az.info
```

Nginx proxy konfiqurasiyası:
```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```
Sonra `.env`-də `BEHIND_PROXY=true` və `FORCE_HTTPS=true`.

DNS qeydləri:
```
A      @      <serverinizin-IP-si>
CNAME  www    cyberlab.az.info
```

### Addım 3 — Google Search Console

1. [search.google.com/search-console](https://search.google.com/search-console) → "Add property"
2. Doğrulama: Google `google1a2b3c.html` verirsə → `.env`-də `GOOGLE_VERIFICATION=1a2b3c`
   (server faylı avtomatik yaradır), serveri yenidən başladın
3. "Sitemaps" → `sitemap.xml` yazıb göndərin
4. "URL Inspection" → domeninizi yazıb "Request indexing"

⏱️ Google adətən **3 gün – 4 həftə** ərzində indeksləyir. Bunu sürətləndirmək
mümkün deyil. Yoxlamaq üçün Google-da: `site:cyberlab.az.info`

---

## Təhlükəsizlik tövsiyələri

Bu server güclüdür, amma tək qat deyil — tam müdafiə üçün:

1. **CDN/WAF əlavə edin** — Cloudflare pulsuz planı real DDoS həcmini serverə
   çatmadan filtrləyir. Bu backend **ikinci** müdafiə xəttidir, birinci deyil.
2. **`npm audit`** mütəmadi işlədin, asılılıqları yeniləyin.
3. **Root ilə işlətməyin** — ayrı istifadəçi və ya Docker konteyneri.
4. **Logları izləyin** — `[WAF]` sətirləri hücum cəhdlərini göstərir.

---

## Etik qeyd

Saytdakı bütün alət və texnika izahları **konseptualdır** — heç bir işlək exploit,
zərərli proqram kodu və ya hazır hücum skripti daxil deyil. Məqsəd hücum məntiqini
anlayaraq daha güclü müdafiə qurmaqdır.

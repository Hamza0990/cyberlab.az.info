# ◈ CYBERLAB
---

## Haqqında

CYBERLAB — çoxdilli kibertəhlükəsizlik təhsil platformasıdır. Məqsəd hücumların necə işlədiyini konseptual izah etməklə müdafiə bacarıqlarını gücləndirməkdir. Sayt həm Red Team (hücum) həm də Blue Team (müdafiə) yanaşmalarını, kill chain diaqramını, tarixi hadisələri və qanuni təlim platformalarını təqdim edir.  

Frontend hissəsi HTML, CSS və JavaScript ilə qurulub, PWA dəstəyi var (offline işləyir, mobil uyğunluq, “Ana ekrana əlavə et”). Backend isə Node.js üzərindədir və **Defense in Depth** fəlsəfəsi ilə çoxqatlı müdafiə tətbiq edir (Helmet, rate-limit, WAF, audit log, Basic Auth ilə qorunan admin panel).

---


## Fayl strukturu

```

│  
│   ├── index.html       ← Struktur + SEO teqləri + FAQ schema
│   ├── style.css        ← Bütün dizayn, animasiyalar, dark/light, mobil
│   ├── app.js           ← İnteraktivlik + i18n mühərriki + alət ikonları
│   ├── translations.js  ← EN / RU / TR tərcümələri (AZ = mənbə)
│   ├── theme-init.js    ← Dark/Light seçimini yadda saxlayır (əsas sayt + soon/ eyni tema)
│   ├── offline.html + offline.js ← Şəbəkə olmayanda göstərilən səhifə
│   ├── favicon.svg      ← Sekmə loqosu
│   ├── manifest.json    ← PWA manifest ("Ana ekrana əlavə et")
│   └── sw.js            ← Service Worker (offline dəstəyi)
│
└── 
```



## Nə ilə qurulub

- **Frontend:**  
  - `index.html` → struktur + SEO teqləri  
  - `style.css` → dizayn, animasiyalar, dark/light rejim  
  - `app.js` → interaktivlik, dil dəyişmə (i18n)  
  - `translations.js` → tərcümələr  

---

## Hansı səbəbdən düzəlib

- **Kibertəhlükəsizlik biliklərini paylaşmaq** — hücumların məntiqini anlamaqla müdafiəni gücləndirmək.  
- **Çoxdilli auditoriyaya çatmaq** — Azərbaycan dilində əsas mənbə, EN/RU/TR dəstəyi ilə daha geniş kütlə.  
- **Etik yanaşma** — real exploit kodları yoxdur, yalnız konseptual izahlar.  
- **Praktiki öyrənmə mühiti** — interaktiv diaqramlar, alət filtrləri, animasiyalar öyrənməni daha maraqlı edir.  

---

## Etik qeyd

Saytdakı bütün alət və texnika izahları **konseptualdır** — heç bir işlək exploit,
zərərli proqram kodu və ya hazır hücum skripti daxil deyil. Məqsəd hücum məntiqini
anlayaraq daha güclü müdafiə qurmaqdır.

---

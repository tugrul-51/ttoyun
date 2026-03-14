# TT Oyun - GitHub Pages Yayın Sürümü

Bu sürüm, mevcut özellikleri bozmadan GitHub üzerinde çevrimiçi yayın için hazırlanmıştır.

## Neler hazırlandı?

- GitHub Pages için otomatik deploy iş akışı eklendi.
- Üretim ortamında gereksiz `localhost` SCORM exporter denemesi kapatıldı.
- SCORM indirme özelliği çevrimiçi yayında tarayıcı içi üretim ile çalışmaya devam eder.
- SPA fallback için `404.html` üretimi workflow içine eklendi.

## GitHub'a yükleme

1. Bu projeyi bir GitHub reposuna yükle.
2. Repo içinde **Settings > Pages** bölümüne gir.
3. **Build and deployment** alanında **Source = GitHub Actions** seç.
4. Kodu `main` ya da `master` dalına gönder.
5. Actions tamamlanınca siten yayına alınır.

## Gerekli GitHub Secrets

AI soru üretimi ve bulut senkronizasyon gibi özellikler için repo içinde:

**Settings > Secrets and variables > Actions**

alanına aşağıdakileri ekleyebilirsin:

- `VITE_GROQ_API_KEY`
- `VITE_GROQ_MODEL`
- `VITE_CLOUD_SYNC_MODE`
- `VITE_CLOUD_SYNC_ENDPOINT`
- `VITE_CLOUD_SYNC_API_KEY`
- `VITE_CLOUD_PROJECT`

## Önemli not

Bu proje istemci tarafı bir Vite uygulamasıdır. `VITE_` ile başlayan anahtarlar build sonrasında tarayıcıya gider. Yani Groq anahtarı teknik olarak gizli kalmaz. Şimdilik kişisel kullanım için sorun değilse bu şekilde kullanılabilir. Tam gizlilik istenirse API çağrısı ayrı bir backend/proxy üzerinden yapılmalıdır.

## Lokal kullanım

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## SCORM

- Lokal geliştirmede exporter servisi varsa onu kullanır.
- GitHub Pages üzerinde ise doğrudan tarayıcı içinden SCORM paketi üretmeye çalışır.
- Böylece çevrimiçi sürümde SCORM indirme özelliği bozulmaz.

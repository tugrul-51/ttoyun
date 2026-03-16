# V5.1 Bulut Senkron Kurulumu

## Ortam değişkenleri
`.env` dosyana aşağıdaki alanları ekle:

```env
VITE_CLOUD_SYNC_ENDPOINT=https://senin-servisin.example.com/sync
VITE_CLOUD_SYNC_TOKEN=opsiyonel_guvenlik_anahtari
```

## Beklenen uç noktalar
- `POST /push` : uygulamanın gönderdiği snapshot verisini kaydeder
- `GET /pull` : en son snapshot verisini döndürür

## Davranış
- Yapılandırma yoksa sistem local-first çalışmaya devam eder.
- Yapılandırma varsa öğretmen panelindeki senkron düğmeleri uzak servisle konuşur.

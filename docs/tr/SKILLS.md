**🌐 Language / Dil:** [English](../SKILLS.md) · **Türkçe**

# Skill'ler referansı

**46 skill** — [agent'ların](AGENTS.md) yararlandığı, yeniden kullanılabilir, yığına özgü oyun kitapları. Skill'leri doğrudan çağırmazsınız; Claude, iş eşleştiğinde ilgili skill'i otomatik olarak devreye alır. Her giriş şunu içerir: **size ne sağlar** · *ne zaman devreye girer*.

---

## Android

- **`android-patterns`** — Temel Kotlin deyimleri + Android yaşam döngüsü farkında bileşenler. *Kotlin/yaşam döngüsü kurallarına uymak zorunda olan Android bileşenleri oluştururken.*
- **`jetpack-compose`** — Bildirimsel UI: durum, tema, animasyon, yeniden bileşim. *XML olmadan Android UI oluştururken.*
- **`navigation-compose`** — Tür güvenli Compose Navigation: grafikler, geri yığın, argümanlar. *Çok ekranlı Compose uygulamaları.*
- **`koin-patterns`** — Koin DI: modüller, kapsamlar, ViewModel enjeksiyonu (Android). *Android uygulamasında DI bağlantısı kurarken.*
- **`coroutines-patterns`** — Yapılandırılmış eşzamanlılık + Flow: iptal, hata yönetimi, kapsamlar. *Android'de arka plan/asenkron iş yaparken.*
- **`room-patterns`** — Room DB: DAO'lar, varlıklar, geçişler (Android-yerel). *Android'de yerel kalıcılık sağlarken.*
- **`gradle-patterns`** — Modern Gradle: sürüm katalogları, kural eklentileri, çok modüllü yapı. *Derleme betiklerini kurarken/yeniden düzenlerken.*
- **`m3-expressive`** — Material 3 Expressive: yay fiziği, şekil dönüşümü, hareket. *Parlak, animasyonlu Android UI.*
- **`app-lifecycle`** — İşlem ölümü, `SavedStateHandle`, arka plan görevleri. *Yapılandırma değişikliği / işlem ölümünden kurtulması gereken durum.*

## iOS

- **`swift-patterns`** — Deyimsel Swift: opsiyoneller, hata yönetimi, modern özellikler. *Deyimsel Swift yazarken.*
- **`swiftui-patterns`** — SwiftUI durum/bileşim/yaşam döngüsü (`@State`, bağlama, gözlem). *SwiftUI UI'ını doğru biçimde oluştururken.*
- **`combine-framework`** — Reaktif akış için yayıncılar/aboneler/operatörler. *iOS'ta asenkron veri akışları.*
- **`core-data`** — Core Data: modeller, getirme istekleri, arka plan bağlamları. *iOS'ta yerel kalıcılık sağlarken.*
- **`ios-testing`** — XCTest, taklit nesneler, UI ve anlık görüntü testleri. *iOS özelliklerini test ederken.*
- **`liquid-glass`** — iOS 26 Liquid Glass: `.glassEffect()`, katmanlı şeffaflık. *iOS 26+ üzerinde cam-morfizm UI.*

## Kotlin Multiplatform

- **`expect-actual`** — `expect`/`actual` platforma özgü uygulamalar. *Paylaşılan kodda platform API'lerini soyutlarken.*
- **`kmp-di`** — Platform modülleriyle Koin Multiplatform DI. *Paylaşılan + platform kodunda DI.*
- **`kmp-networking`** — Platform motorlarıyla (OkHttp/Darwin) Ktor istemcisi. *Paylaşılan ağ katmanı.*
- **`kmp-navigation`** — Çapraz platform navigasyon (Voyager / Decompose). *Android ve iOS genelinde paylaşılan navigasyon.*
- **`kmp-repositories`** — Repository kalıbı: paylaşılan arayüzler, platform uygulamaları. *Paylaşılan veri erişim katmanı.*
- **`sqldelight-patterns`** — KMP için tür güvenli SQL → üretilmiş Kotlin. *Paylaşılan, tür güvenli DB erişimi.*
- **`shared-coroutines`** — KMP coroutine yapılandırması: platform dağıtıcıları, paylaşılan kapsamlar. *KMP paylaşılan kodunda asenkron.*
- **`shared-models`** — Paylaşılan serileştirilebilir alan modelleri, tek gerçek kaynağı. *Alan modellerini tüm platformlar için bir kez tanımlarken.*

## Mimari ve kalite

- **`mvi-architecture`** — Model-View-Intent tek yönlü akış: durum/niyet/yan etki. *Uygulama mimarisini yapılandırırken.*
- **`feature-builder`** — 6 aşamalı uçtan uca özellik hattının kendisi. *Baştan sona eksiksiz bir özellik oluştururken.*
- **`mobile-testing`** — Test stratejisi (JUnit5/Mockk/Turbine/Compose), ≥%80 kapsam. *Test katmanını yazarken.*
- **`mobile-verification`** — pass@k ölçütleri ve kararsız test tespiti. *Test güvenilirliğini ölçerken/iyileştirirken.*
- **`mobile-security`** — Şifreli depolama, TLS/sertifika sabitleme, girdi doğrulama, güvenli günlük tutma. *Güvenlik açısından hassas özellikler uygularken.*
- **`ci-cd-patterns`** — GitHub Actions, Fastlane, imzalama, sürüm hatları. *CI/CD kurarken.*
- **`accessibility-patterns`** — WCAG, içerik açıklamaları, dokunma hedefleri, dinamik tür. *Uygulamayı erişilebilir kılarken.*

## Özellik tarifleri

- **`offline-first`** — NetworkBoundResource, senkronizasyon, çakışma çözümü (paylaşılan kod için SQLDelight destekli). *Çevrimdışı önbellek + senkronizasyon.*
- **`pagination-patterns`** — Büyük listeler için Paging 3 (Android) / özel (iOS). *Uzun listeleri tembel yüklerken.*
- **`deep-linking`** — URI şemaları, Uygulama Bağlantıları, Evrensel Bağlantılar, ertelenmiş derin bağlantılar. *Dışarıdan uygulama içeriğine yönlendirirken.*
- **`push-notifications`** — FCM (Android) + APNs (iOS). *Anlık bildirim eklerken.*
- **`feature-flags`** — LaunchDarkly / Firebase Remote Config, A/B dağıtımı. *Kademeli sürümler ve denemeler.*
- **`image-loading`** — Coil (Android) / AsyncImage (iOS): önbellekleme, dönüşümler. *Verimli resim gösterimi.*
- **`localization-patterns`** — Çok dilli dizeler, RTL, çoğullama. *Dünya geneli / çok dilli uygulamalar.*
- **`analytics-patterns`** — Olay/ekran izleme, kullanıcı özellikleri, onay. *Kullanım analitiğini araçlandırırken.*
- **`ktor-patterns`** — Ktor HTTP istemci yapılandırması (Android/OkHttp): anlaşma, engelleyiciler, hata eşleme. *Android ağ kurulumu.*

## Sürekli öğrenme

Bunlar [kendi kendine öğrenme sistemini](HOOKS-AND-MCP.md#continuous-learning) güçlendirir.

- **`continuous-learning`** — Skill'leri geliştirmek için oturumlardan kalıp çıkarımını yönetir.
- **`continuous-learning-v2`** — V2: oturumlar arası güven puanlamasıyla içgüdü yakalama.
- **`mobile-instinct-v1`** — Düzenlemeler sırasında anlık, gerçek zamanlı kalıp yakalama.
- **`mobile-instinct-v2`** — Oturumlar arası gözlemsel öğrenme; yinelenen kalıpları pekiştirir.
- **`mobile-memory`** — Oturumlar arası kalıcı proje bağlamı (yapı, bağımlılıklar, mimari).
- **`mobile-checkpoint`** — Kritik kontrol noktalarında proje durumunu kaydet/geri yükle.
- **`mobile-compaction`** — Büyük kod tabanları için bağlam optimizasyonu stratejisi.

---

← [README'ye](../../README.md) geri dön · Ayrıca bakınız [Agent'lar](AGENTS.md) · [Komutlar](COMMANDS.md) · [Hook'lar ve MCP](HOOKS-AND-MCP.md)

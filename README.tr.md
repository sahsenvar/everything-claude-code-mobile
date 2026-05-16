**🌐 Language / Dil:** [English](README.md) · **Türkçe**

# Everything Claude Code Mobile

[![Stars](https://img.shields.io/github/stars/ahmed3elshaer/everything-claude-code-mobile?style=flat)](https://github.com/ahmed3elshaer/everything-claude-code-mobile/stargazers)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Kotlin](https://img.shields.io/badge/-Kotlin-7F52FF?logo=kotlin&logoColor=white)
![Compose](https://img.shields.io/badge/-Jetpack%20Compose-4285F4?logo=jetpackcompose&logoColor=white)
![Android](https://img.shields.io/badge/-Android-3DDC84?logo=android&logoColor=white)
![Swift](https://img.shields.io/badge/-Swift-FA7343?logo=swift&logoColor=white)
![SwiftUI](https://img.shields.io/badge/-SwiftUI-0D96F6?logo=swift&logoColor=white)
![KMP](https://img.shields.io/badge/-Kotlin%20Multiplatform-7F52FF?logo=kotlin&logoColor=white)

---

**Mobil geliştirme için eksiksiz Claude Code yapılandırma koleksiyonu.**

**Android**, **iOS** ve **Kotlin Multiplatform** geliştirme için 27 ajan, 48 skill, 35 komut ve 3 MCP sunucusu. Tüm bir özelliği otomatik olarak planlayan, geliştiren, test eden ve gözden geçiren uçtan uca bir özellik (feature) inşa edici içerir.

> [everything-claude-code](https://github.com/ahmed3elshaer/everything-claude-code) projesinin mobil tamamlayıcısıdır.

---

## Hızlı Başlangıç

### Adım 1: Plugin'i Kur

```bash
# Marketplace ekle
/plugin marketplace add ahmed3elshaer/everything-claude-code-mobile

# Plugin'i kur
/plugin install everything-claude-code-mobile@ahmed3elshaer
```

### Adım 2: Kuralları Kur (Zorunlu)

```bash
# Önce repoyu klonla
git clone https://github.com/ahmed3elshaer/everything-claude-code-mobile.git

# Kuralları kopyala (tüm projelere uygulanır)
cp -r everything-claude-code-mobile/rules/* ~/.claude/rules/
```

### Adım 3: Kullanmaya Başla

```bash
# Tam bir özelliği uçtan uca inşa et
/feature-build Biyometrik ile kullanıcı kimlik doğrulaması ekle

# Android projesini derle
/android-build

# Gradle sorunlarını düzelt
/gradle-fix

# TDD akışı
/mobile-tdd

# Tüm komutları görüntüle
/plugin list everything-claude-code-mobile@ahmed3elshaer
```

---

## Feature Builder Pipeline (Özellik İnşa Hattı)

Bu plugin'in öne çıkan yeteneği. `/feature-build`, tek bir açıklamadan tam bir özellik inşa etmek için özelleşmiş ajanları 7 fazda orkestre eder:

```bash
/feature-build Push bildirimi desteği ekle
/feature-build --platform=android Çevrimdışı önbellekleme uygula
/feature-build --platform=kmp Kullanıcı verisi için çevrimdışı senkronizasyon ekle
```

### Fazlar

| # | Faz | Ne Olur |
|---|-------|--------------|
| 1 | **Plan** | `feature-planner` + `mobile-architect` projeni analiz eder ve yapılandırılmış bir uygulama planı oluşturur |
| 2 | **Implement (Uygula)** | 5 katman ajanı bağımlılık sırasıyla çalışır (architecture -> network + UI -> data -> wiring) |
| 3 | **Test** | `unit-test-writer` + `ui-test-writer` %80 kapsama hedefiyle testler oluşturur |
| 4 | **Build Fix (Derleme Düzeltme)** | Derler ve hataları iteratif olarak düzeltir |
| 5 | **Quality Gate (Kalite Kapısı)** | Paralel kod incelemesi + güvenlik denetimi + performans incelemesi |
| 6 | **Verify (Doğrula)** | `mobile-verifier` pass@k metriklerini çalıştırır ve kapsama onayı verir |
| 7 | **Learn (Öğren)** | Desen çıkarımı ve içgüdü (instinct) güncellemeleri |

### Uygulama Ajanı DAG'ı

```
Faz 1:    architecture-impl    (domain modelleri, arayüzler, DI iskeleti)
               |
          +----+----+
Faz 2:    network   ui-impl    (API istemcileri, DTO'lar / Compose ekranları, bileşenler)
          -impl      |
            |        |
Faz 3:    data-impl  |         (repository'ler, yerel DB, önbellekleme)
               |     |
          +----+----+
Faz 4:    wiring-impl          (DI bağlamaları, navigasyon, feature flag'ler)
```

### Feature Komutları

| Komut | Açıklama |
|---------|-------------|
| `/feature-build` | Uçtan uca özellik inşası (7 fazın tamamı) |
| `/feature-plan` | Mimari, dosya, bağımlılık ve test stratejisini planla |
| `/feature-implement` | Planı paralel katman ajanlarıyla çalıştır |
| `/feature-test` | Birim, UI ve E2E testleri oluştur |
| `/feature-build-fix` | Derle ve derleme hatalarını düzelt |
| `/feature-quality-gate` | Kod incelemesi + güvenlik + performans denetimi |
| `/feature-status` | Mevcut özellik inşa ilerlemesini göster |
| `/feature-learn` | Tamamlanan özellikten desenleri çıkar |

---

## İçeride Neler Var

```
everything-claude-code-mobile/
├── agents/           # 27 özelleşmiş ajan
│   ├── Kod İncelemesi: android-reviewer, ios-reviewer
│   ├── Derleme:        android-build-resolver, xcode-build-resolver, gradle-expert
│   ├── Mimari:         mobile-architect, kmp-architect, feature-planner, shared-model-designer
│   ├── UI/Tasarım:     compose-guide, swiftui-guide, m3-expressive-guide, liquid-glass-guide
│   ├── Uygulama:       architecture-impl, network-impl, data-impl, ui-impl, wiring-impl
│   ├── Test:           mobile-tdd-guide, mobile-e2e-runner, unit-test-writer, ui-test-writer, mobile-verifier
│   └── Öğrenme:        mobile-pattern-extractor, mobile-compactor
│
├── skills/           # 48 platform skill'i
│   ├── Android:      android-patterns, jetpack-compose, navigation-compose, coroutines-patterns,
│   │                 koin-patterns, room-patterns, gradle-patterns, m3-expressive
│   ├── iOS:          swift-patterns, swiftui-patterns, combine-framework, core-data,
│   │                 ios-testing, liquid-glass
│   ├── KMP:          kmp-di, kmp-navigation, kmp-networking, kmp-repositories,
│   │                 expect-actual, shared-coroutines, shared-models, sqldelight-patterns
│   ├── Mimari:       mvi-architecture, feature-builder, mobile-testing, mobile-security
│   ├── Özellikler:   deep-linking, feature-flags, offline-first, pagination-patterns,
│   │                 push-notifications, image-loading, localization-patterns,
│   │                 analytics-patterns, app-lifecycle, accessibility-patterns, ktor-patterns
│   └── Öğrenme:      continuous-learning, continuous-learning-v2, mobile-instinct-v1,
│                     mobile-instinct-v2, mobile-checkpoint, mobile-compaction, mobile-memory
│
├── commands/         # 35 slash komutu
├── rules/            # Her zaman uygulanan 5 kural
├── contexts/         # 7 dinamik bağlam dosyası
├── hooks/            # Otomatik tetiklenen kontroller ve desen çıkarımı
└── mcp-servers/      # 3 kalıcı bellek sunucusu
```

---

## Teknoloji Yığını (Tech Stack)

| Kategori | Teknolojiler |
|----------|--------------|
| **Dil** | Kotlin, Swift |
| **UI** | Jetpack Compose, SwiftUI, UIKit (eski) |
| **Tasarım Sistemleri** | Material 3 Expressive, Apple Liquid Glass |
| **Mimari** | MVI, Clean Architecture, MVVM |
| **DI** | Koin (Android), Environment Objects (iOS), Koin Multiplatform (KMP) |
| **Ağ İletişimi** | Ktor Client (Android/KMP), URLSession + async/await (iOS) |
| **Veritabanı** | Room (Android), CoreData/SwiftData (iOS), SQLDelight (KMP) |
| **Asenkron** | Kotlin Coroutines + Flow, Swift Concurrency (async/await) |
| **Test** | JUnit5, Mockk, Turbine, Kotest, Espresso (Android); XCTest (iOS) |
| **Derleme** | Gradle (KTS), Xcode, SPM, CocoaPods |

---

## Komutlar

### Derleme ve Düzeltme

| Komut | Açıklama |
|---------|-------------|
| `/android-build` | Android projesini derle, hataları düzelt, APK/AAB üret |
| `/ios-build` | iOS projesini Xcode ile derle |
| `/kmp-build` | Kotlin Multiplatform projesini derle |
| `/gradle-fix` | Gradle senkronizasyon/bağımlılık sorunlarını çöz |
| `/kmp-dependency-fix` | KMP bağımlılık çakışmalarını düzelt |
| `/compose-preview` | Compose preview'larının derlendiğini doğrula |
| `/lint-android` | Detekt, ktlint, Android Lint çalıştır |
| `/swiftlint` | iOS kod stili için SwiftLint çalıştır |
| `/release-build` | Release/production sürümlerini derle |
| `/mobile-build` | Genel mobil derleme komutu |

### Test

| Komut | Açıklama |
|---------|-------------|
| `/mobile-tdd` | TDD akışı (RED -> GREEN -> REFACTOR) |
| `/android-test` | Android birim ve enstrümantasyon testlerini çalıştır |
| `/ios-test` | iOS birim ve UI testlerini çalıştır |
| `/kmp-test` | KMP paylaşımlı testlerini çalıştır |
| `/compose-test` | Compose UI testlerini Espresso ile çalıştır |
| `/mobile-test` | Mobil testleri çalıştır (birim + UI) |
| `/mobile-verify` | Uygulamayı spesifikasyonlara karşı doğrula |

### Planlama ve İnceleme

| Komut | Açıklama |
|---------|-------------|
| `/mobile-plan` | Mobil özellik uygulamasını planla |
| `/android-review` | Android'e özel kod incelemesi |
| `/platform-info` | Tespit edilen platformu göster (Android/iOS/KMP) |

### Öğrenme

| Komut | Açıklama |
|---------|-------------|
| `/learn` | Mevcut oturumdan desenleri çıkar |
| `/instinct-status` | Öğrenilen mobil desenleri görüntüle |
| `/instinct-export` | Desenleri paylaşım için dışa aktar |
| `/instinct-import` | Dış kaynaklardan desenleri içe aktar |
| `/evolve` | İçgüdüleri yeniden kullanılabilir skill'lere kümele |

---

## Ajanlar (27)

### Kod İncelemesi

| Ajan | Ne Zaman Kullanılır |
|-------|-------------|
| `android-reviewer` | Kotlin/Compose kod incelemesi, Google en iyi pratikleri |
| `ios-reviewer` | Swift/SwiftUI kod incelemesi, Apple en iyi pratikleri |
| `mobile-security-reviewer` | Güvenlik denetimi: gizli anahtarlar, şifreleme, ağ, depolama |
| `mobile-performance-reviewer` | Başlangıç süresi, bellek, render, pil |

### Derleme ve Compile

| Ajan | Ne Zaman Kullanılır |
|-------|-------------|
| `android-build-resolver` | Gradle senkronizasyon, AGP, R8/ProGuard, bağımlılık çakışmaları |
| `xcode-build-resolver` | Xcode, SPM, kod imzalama, CocoaPods, simülatör hataları |
| `gradle-expert` | Gradle optimizasyonu, Version Catalog'lar, convention plugin'leri |

### Mimari ve Planlama

| Ajan | Ne Zaman Kullanılır |
|-------|-------------|
| `mobile-architect` | MVI, Clean Architecture, modülerleştirme |
| `kmp-architect` | KMP paylaşımlı modüller, expect/actual, platformlar arası DI |
| `feature-planner` | Mimari incelemeli özellik planlaması |
| `shared-model-designer` | @ObjCName ile platformlar arası veri modelleri |

### UI ve Tasarım

| Ajan | Ne Zaman Kullanılır |
|-------|-------------|
| `compose-guide` | Compose state, recomposition, temalama, animasyonlar |
| `swiftui-guide` | SwiftUI state, view optimizasyonu, temalama |
| `m3-expressive-guide` | Material 3 Expressive: spring animasyonları, şekil dönüşümü, 28 bileşen |
| `liquid-glass-guide` | SwiftUI için Apple Liquid Glass (iOS 26+) |

### Uygulama (Katman Ajanları)

Bu ajanlar `/feature-implement` tarafından orkestre edilir ve bağımlılık sırasıyla çalışır:

| Ajan | Katman | Ne Oluşturur |
|-------|-------|----------------|
| `architecture-impl` | Domain | Use case'ler, domain modelleri, repository arayüzleri, DI modülleri |
| `network-impl` | Ağ | API istemcileri, DTO'lar, istek/yanıt modelleri (Ktor / URLSession) |
| `data-impl` | Veri | Repository'ler, yerel depolama, önbellekleme (Room / CoreData / SQLDelight) |
| `ui-impl` | Sunum | Ekranlar, ViewModel'ler, state yönetimi (Compose / SwiftUI) |
| `wiring-impl` | Entegrasyon | Navigasyon, DI kaydı, manifest girişleri, feature flag'ler |

### Test

| Ajan | Ne Zaman Kullanılır |
|-------|-------------|
| `mobile-tdd-guide` | TDD zorlaması (yeni özellikler için zorunlu) |
| `mobile-e2e-runner` | Espresso E2E testleri, UI otomasyonu |
| `unit-test-writer` | ViewModel, UseCase, Repository testleri (JUnit5 + Mockk + Turbine) |
| `ui-test-writer` | Compose UI testleri, SwiftUI testleri, erişilebilirlik testi |
| `mobile-verifier` | pass@k metrikleriyle otomatik doğrulama döngüleri |

### Öğrenme ve Kalite

| Ajan | Ne Zaman Kullanılır |
|-------|-------------|
| `mobile-pattern-extractor` | Kod tabanını yeniden kullanılabilir desenler için analiz et |
| `mobile-compactor` | Token optimizasyonu için stratejik bağlam sıkıştırma |

---

## Uygulanan Kurallar

Bu kurallar her zaman aktiftir ve tüm projelere uygulanır:

- Tüm kodda en az **%80 test kapsamı**
- **TDD akışı** zorunlu (RED -> GREEN -> REFACTOR)
- **Hardcode edilmiş gizli anahtar yok** (Android'de BuildConfig/local.properties, iOS'ta Keychain kullan)
- **Önce değişmezlik (immutability)** (`val`/`let`, değişmez koleksiyonlar, `copy()`'li data class'lar)
- **Null güvenliği** (güvenli çağrılar, Elvis operatörü, `!!`/force unwrap minimumda)
- **Compose/SwiftUI en iyi pratikleri** (state hoisting, composition/body içinde yan etki yok)
- Production'da sertifika pinleme ile **yalnızca HTTPS**
- **Yapısal eşzamanlılık** (Coroutines/async-await, GlobalScope/DispatchQueue.main.async yok)
- **Dosyalar < 400 satır, fonksiyonlar < 50 satır, iç içe geçme < 4 seviye**

---

## MCP Sunucuları

Üç kalıcı bellek sunucusu oturumlar arası bağlamı korur:

| Sunucu | Amaç |
|--------|---------|
| `mobile-memory` | Proje yapısı, bağımlılıklar, mimari, test durumu |
| `ios-memory` | iOS proje durumu, SwiftUI bileşenleri, XCTest desenleri |
| `kmp-context` | KMP modül yapısı, expect/actual desenleri, paylaşımlı modeller |

---

## Bağlamlar (Contexts)

Dinamik bağlam dosyaları proje tipine göre enjekte edilir:

| Bağlam | Ne Zaman Aktif |
|---------|-------------|
| `android-dev` | Android projesi tespit edildi (Kotlin, Gradle, Compose) |
| `ios-dev` | iOS projesi tespit edildi (Swift, Xcode, SwiftUI) |
| `kmp-dev` | KMP projesi tespit edildi (paylaşımlı modül, multiplatform) |
| `compose-dev` | Jetpack Compose kodu düzenleniyor |
| `swiftui-dev` | SwiftUI kodu düzenleniyor |
| `uikit-dev` | UIKit (eski) kodu düzenleniyor |
| `mobile-memory-context` | Kalıcı bellek sistemi aktif |

---

## Hook'lar

Belirli olaylarda otomatik kontroller tetiklenir:

### Android Hook'ları
- **Anti-pattern tespiti**: Kotlin dosyalarında `GlobalScope`, `!!`, `runBlocking` işaretler
- **TDD hatırlatmaları**: ViewModel oluştururken test dosyası ister
- **Desen çıkarımı**: Çıkışta oturumlardan öğrenir

### iOS Hook'ları
- **Anti-pattern tespiti**: Swift dosyalarında force unwrap `!`, `DispatchQueue.main.async` işaretler
- **Preview hatırlatmaları**: `ContentView.swift` düzenlenirken `#Preview` ister
- **Bağımlılık hatırlatmaları**: Podfile değişikliğinden sonra `pod install`, `Package.swift` değişikliğinden sonra paket çözümlemesi ister

---

## Sürekli Öğrenme

Plugin geliştirme desenlerinizden öğrenir ve zamanla gelişir:

```bash
/learn                  # Mevcut oturumdan desenleri çıkar
/instinct-status        # Öğrenilen mobil desenleri görüntüle
/instinct-export        # Desenleri paylaşım için dışa aktar
/instinct-import        # Dış kaynaklardan desenleri içe aktar
/evolve                 # İçgüdüleri yeniden kullanılabilir skill'lere kümele
```

Öğrenilen desenler şunları içerir:
- Compose recomposition optimizasyonları
- ViewModel/Repository desenleri
- Koin modül organizasyonu
- Ktor istemci yapılandırması
- SwiftUI state yönetimi deyimleri
- KMP expect/actual desenleri
- Framework başına test desenleri

---

## Katkıda Bulunma

Katkılar memnuniyetle karşılanır! İhtiyaç duyulan alanlar:

- Ek platforma özel desenler
- CI/CD yapılandırmaları (Fastlane, GitHub Actions)
- App Store/Play Store yönergeleri
- Erişilebilirlik test komutları
- Cihaz çiftliği (device farm) entegrasyonları

---

## Lisans

MIT - Özgürce kullanın, ihtiyaca göre değiştirin, mümkünse geri katkıda bulunun.

---

**Claude Code ile kaliteli uygulamalar yayınlayan mobil geliştiriciler için inşa edildi.**

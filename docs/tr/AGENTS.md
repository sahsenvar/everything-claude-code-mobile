**🌐 Language / Dil:** [English](../AGENTS.md) · **Türkçe**

# Agent referansı

Bu plugin **32 özelleşmiş agent** içerir. Her agent tek bir işe sahiptir ve Claude Code tarafından **otomatik olarak** devreye alınır — `/agent-adı` şeklinde slash command yoktur. Bir agent şu durumlarda çalışır:

- **[Feature Builder pipeline](../../README.md#️-the-feature-builder-pipeline)**, o agentin sorumlu olduğu aşamaya ulaştığında (örneğin `/feature-build` → planlama → `feature-planner`),
- bir **[command](COMMANDS.md)** tarafından yönlendirildiğinde (örneğin `/android-build` → `android-build-resolver`),
- ya da Claude'un isteğinizle ilgili olduğuna karar verdiğinde (pek çok agent, tanımında *"proactively kullan / MUTLAKA kullanılmalı"* olarak işaretlidir).

> Listelenen araçlar, agentin izin verilen tool setidir. "Auto" = Claude/pipeline tarafından çağrılır, siz bir komut yazarak değil.

---

## Mimari & Planlama

### `feature-planner`
Platformu algılar ve bir özellik açıklamasını yapılandırılmış bir plana dönüştürür (modüller, dosyalar, bağımlılıklar, task DAG, test stratejisi).
**Devreye girer:** `/feature-build` Phase 1'de ya da doğrudan `/feature-plan "<açıklama>"` / `/mobile-plan` ile.

### `mobile-architect`
MVI / Clean Architecture / modülarizasyon uzmanı; katman ayrımını ve çapraz modül yapısını gözden geçirir ve şekillendirir.
**Devreye girer:** `/feature-build` Phase 1'de `feature-planner` ile birlikte; bir mimari karar gerektiğinde proactively.

### `kmp-architect`
Kotlin Multiplatform yapı uzmanı: `expect`/`actual`, shared ve platform modülleri, KMP navigation, shared-code organizasyonu.
**Devreye girer:** Auto — proje KMP olduğunda ve modül/yapı tasarımı kapsam dahilindeyken.

### `shared-model-designer`
KMP için platformlar arası data modeller tasarlar (kotlinx-serialization, doğrulama, platform alanları, iOS birlikte çalışabilirliği için `@ObjCName`).
**Devreye girer:** Auto — shared domain modellerin planlanması/uygulanması sırasında.

## Uygulama (feature-build DAG)

Bu beş agent, `/feature-build` **Phase 2**'sinde (ya da `/feature-implement` ile) bağımlılık sırasına göre çalışır. `network-impl` ∥ `ui-impl` paralel çalışır.

### `architecture-impl`
Domain/mimari katmanı oluşturur — use case'ler, domain modelleri, repository interface'leri, DI modül iskeletleri (Koin / iOS container).

### `network-impl`
Networking katmanını uygular — Ktor (KMP/Android) veya URLSession (iOS) client'ları, DTO'lar, hata yönetimi, serializasyon.

### `data-impl`
Data katmanını uygular — SQLDelight (KMP) / Room (Android) / Core Data (iOS), önbellekleme, offline-first bağlantısı.

### `ui-impl`
UI katmanını uygular — Compose veya SwiftUI ekranları, MVI state hoisting, bileşenler, preview'lar.

### `wiring-impl`
Her şeyi entegre eder — navigation route'ları, DI kaydı, manifest/plist girişleri, özellikler arası bağlantı. En son çalışır.

## Kod incelemesi (quality gate)

Bu dört agent, `/feature-build` **Phase 5**'inde (ya da `/feature-quality-gate` ile) paralel çalışır.

### `android-reviewer`
Kotlin/Compose'u kalite, MVI doğruluğu, coroutine güvenliği ve Google kılavuzları açısından inceler. *Android değişiklikleri için mutlaka kullanılmalıdır.*

### `ios-reviewer`
Swift/SwiftUI'yi kalite, concurrency/bellek yönetimi ve Apple kılavuzları açısından inceler. *iOS değişiklikleri için mutlaka kullanılmalıdır.*

### `mobile-security-reviewer`
Güvensiz depolama, zayıf transport, sızdırılan secret'lar, eksik input doğrulama ve uyumluluk boşluklarını denetler.

### `mobile-performance-reviewer`
Başlatma süresi, bellek, rendering ve pil maliyetini inceler; gerileme noktalarını işaretler.

### `accessibility-reviewer`
Compose/SwiftUI/KMP arayüzünün salt-okunur a11y denetimi — etiketler, semantics, dokunma hedefleri, Dynamic Type; önem sırasına göre bulgular. Kod değiştirmez.
**Devreye girer:** `/accessibility-review`.

### `localization-reviewer`
Android/iOS/KMP için salt-okunur i18n denetimi — sabit metinler, çoğullar, RTL düzeni, yerel biçimlendirme; önem sırasına göre bulgular. Kod değiştirmez.
**Devreye girer:** `/localization-review`.

## Build & Derleme çözücüler

### `android-build-resolver`
Gradle/AGP/bağımlılık build hatalarını minimal, mimari olmayan değişikliklerle tespit eder ve düzeltir.
**Devreye girer:** `/android-build`, `/gradle-fix`, build-fix döngüsü.

### `mobile-crash-resolver`
Yapıştırılan stacktrace/logcat/Crashlytics/Sentry kazasını sıralı kök neden + tam `file:line`'da minimal düzeltmeye dönüştürür (yalnızca metin, dış servis çağrısı yok).
**Devreye girer:** `/crash-triage`.

### `xcode-build-resolver`
Xcode build, Swift Package Manager ve signing/sertifika hatalarını düzeltir.
**Devreye girer:** `/ios-build`.

### `gradle-expert`
Gradle'ı optimize eder: version catalog'lar, convention plugin'ler, build önbellekleme, yapılandırma.
**Devreye girer:** Auto — build yapılandırması veya performansı görev olduğunda.

### `android-ci-generator`
GitHub Actions Android CI workflow'larını üretir ve onarır (build/test/lint/detekt, Gradle önbelleği, artefakt yükleme). Mevcut workflow'lara minimal-diff onarım uygular.
**Devreye girer:** `/android-ci`.

### `mobile-dependency-upgrader`
AGP/Kotlin/Gradle, SwiftPM ve KMP sürümlerini eşgüdümlü sürüm setleriyle + minimal-diff migration ile yükseltir (ileri yükseltme, çakışma çözümü değil).
**Devreye girer:** `/dependency-upgrade`.

## UI & Tasarım

### `compose-guide`
Jetpack Compose uzmanı — state, recomposition, side effect'ler, theming, animasyon, test pattern'ları.

### `swiftui-guide`
SwiftUI uzmanı — state yönetimi, view performansı, theming, animasyon, en iyi uygulamalar.

### `m3-expressive-guide`
Material 3 Expressive — expressive theming, spring motion, shape morphing, 28 expressive bileşen.

### `liquid-glass-guide`
Apple Liquid Glass (iOS 26+ SwiftUI) — glass efektleri, morphing, interactive/tinted glass, erişilebilirlik.

**Devreye girer:** Auto — ilgili platform/tasarım sistemi üzerinde UI oluştururken/geliştirirken.

## Test

### `mobile-tdd-guide`
Önce-test-yaz yaklaşımını uygular (JUnit5/Mockk/Turbine, XCTest). Yeni özellikler için zorunludur.

### `unit-test-writer`
ViewModel/UseCase/Repository unit testleri yazar (JUnit5 + Mockk + Turbine + Kotest; iOS'ta XCTest).

### `ui-test-writer`
Yükleme/hata/başarı durumlarını, etkileşimleri ve erişilebilirliği kapsayan Compose UI testleri / XCUITest yazar.

### `mobile-e2e-runner`
Uçtan uca UI akışları oluşturur ve çalıştırır (Espresso/Compose) ve sonuçları raporlar.

### `mobile-verifier`
Kararsız testleri tespit etmek ve güvenilirliği ölçmek için **pass@k döngülerinde** suite'i çalıştırır. `/feature-build` Phase 6.

**Devreye girer:** `/feature-build` Phase 3 & 6, test command'ları (`/mobile-tdd`, `/android-test`…) ya da commit/push öncesinde proactively.

## Öğrenme & Meta

### `mobile-pattern-extractor`
Read-only. Android/Kotlin değişikliklerini analiz eder ve yeniden kullanılabilir pattern'ları continuous-learning sistemi için "instinct" olarak gün yüzüne çıkarır. **Asla yazmaz** — kalıcılık, tasarım gereği `PostToolUse` hook zincirine devredilir. Bkz. [Hooks & MCP](HOOKS-AND-MCP.md#continuous-learning).

### `mobile-compactor`
Read-only. Oturumlar büyüdüğünde ya da büyük bir refactor öncesinde, kritik bağlamı korurken token kullanımını azaltmak için stratejik bir context-compaction planı üretir.

---

← [README](../../README.md)'e geri dön · Ayrıca bkz. [Skills](SKILLS.md) · [Commands](COMMANDS.md) · [Hooks & MCP](HOOKS-AND-MCP.md)

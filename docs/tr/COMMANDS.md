**🌐 Language / Dil:** [English](../COMMANDS.md) · **Türkçe**

# Komut referansı

**42 slash komutu.** Claude Code'da yazarak çalıştırırsınız. Bunlar *sizin* çağırdığınız komutlardır; arka planda [ajanları](AGENTS.md) ve [becerileri](SKILLS.md) düzenlerler.

---

## Kurulum & sağlık

| Komut | Ne yapar | Örnek |
|---|---|---|
| `/ecc-setup` | Tek komutla kurulum: 3 paket halinde gelen MCP sunucu bağımlılıklarını kurar, sağlığı doğrular. Idempotent. | `/ecc-setup` |
| `/ecc-doctor` | Salt okunur sağlık raporu: MCP bağımlılıkları, platform, disiplin skill'i, SessionStart hook'u, tespit edilen tamamlayıcı eklentiler. | `/ecc-doctor` |

---

## Tamamlayıcı köprüler

Bunlar ECC'yi resmi Atlassian/GitHub/Figma eklentilerine bağlar. Soft-detect: companion kurulu değilse açıklayıp atlar — asla başarısız olmaz. Hangileri tespit edildi görmek için `/ecc-doctor`.

| Komut | Ne yapar | Örnek |
|---|---|---|
| `/jira-feature-build <KEY>` | Bir Jira sorununu (Atlassian MCP) getirir ve açıklama olarak `/feature-build` ile çalıştırır. | `/jira-feature-build PROJ-123` |
| `/github-pr-feature [name]` | Mevcut özellik dalı için bir GitHub PR'ı (GitHub MCP) açar/günceller. | `/github-pr-feature auth` |
| `/figma-ui-impl <url>` | Figma tasarım bağlamını (Figma MCP) getirir ve `ui-impl`'e iletir. | `/figma-ui-impl https://figma.com/design/…` |

---

## Özellik hattı

Ana iş akışı. `/feature-build` 6 fazın tamamını çalıştırır; diğerleri tek tek fazları yönetmenizi veya incelemenizi sağlar.

| Command | What it does | Example |
|---|---|---|
| `/feature-build "<desc>"` | Uçtan uca: plan → uygulama → test → derleme-düzeltme → kalite kapısı → doğrulama. Platformu otomatik algılar. | `/feature-build "Add biometric login"` |
| `/feature-plan "<desc>"` | Yalnızca 1. faz: mimari/dosya/bağımlılık/test planını üretir. | `/feature-plan "Push notification handling"` |
| `/feature-implement <name>` | 2. faz: onaylanmış planı uygulama DAG'ı aracılığıyla yürütür. | `/feature-implement auth` |
| `/feature-test <name>` | 3. faz: özellik için birim + UI + E2E testleri yazar. | `/feature-test offline-cache` |
| `/feature-build-fix <name>` | 4. faz: yeşile geçene kadar derleme/test/düzeltme döngüsü (en fazla 5 yineleme). | `/feature-build-fix auth` |
| `/feature-quality-gate <name>` | 5. faz: paralel inceleme + güvenlik + performans denetimi, düzeltmeleri uygular. | `/feature-quality-gate auth` |
| `/feature-verify <name>` | 6. faz: pass@k (k=3) güvenilirlik + kapsam onayı. | `/feature-verify auth` |
| `/feature-status [<name>]` | Bir özellik derlemesinin hangi fazda olduğunu, tamamlananları/kalanları ve engelleyicileri gösterir. | `/feature-status` |
| `/feature-learn [--export]` | Tamamlanan derlemelerden öğrenilen kalıpları/içgüdüleri gösterir. | `/feature-learn --export` |

## Derleme ve derleme

| Command | What it does | Example |
|---|---|---|
| `/mobile-build` | Platformu algılar, doğru derleme komutuna yönlendirir. | `/mobile-build` |
| `/android-build [release\|<module>]` | Gradle derlemesi; `android-build-resolver` aracılığıyla hataları otomatik düzeltir; APK/AAB üretir. | `/android-build release` |
| `/ios-build [release\|test]` | Xcode derlemesi; `xcode-build-resolver` aracılığıyla otomatik düzeltir; IPA üretir. | `/ios-build release` |
| `/kmp-build [android\|ios]` | Tüm KMP hedeflerini derler; bağımlılık hatalarını düzeltir. | `/kmp-build` |
| `/gradle-fix [dependencies\|sync]` | Gradle senkronizasyon/bağımlılık/önbellek sorunlarını çözer. | `/gradle-fix dependencies` |
| `/crash-triage` | Yapıştırılan stacktrace/logcat/Crashlytics/Sentry kazasını `mobile-crash-resolver` aracılığıyla kök neden + minimal düzeltmeye dönüştürür. | `/crash-triage` |
| `/android-ci [generate\|fix]` | `android-ci-generator` aracılığıyla GitHub Actions Android CI workflow'unu üretir veya onarır. | `/android-ci` |
| `/kmp-dependency-fix` | KMP bağımlılık çakışmalarını/sürüm uyumsuzluklarını çözer. | `/kmp-dependency-fix` |
| `/release-build [apk\|bundle]` | Boyut raporuyla imzalı, R8 ile optimize edilmiş production derlemesi. | `/release-build bundle` |
| `/compose-preview [<Component>]` | `@Preview` ekler/doğrular ve bunların render edildiğini kontrol eder. | `/compose-preview HomeScreen` |

## Test

| Command | What it does | Example |
|---|---|---|
| `/mobile-test` | Platformu algılar, doğru test komutuna yönlendirir. | `/mobile-test` |
| `/android-test [--coverage]` | Kapsam ölçümüyle Android birim + enstrümantasyon testleri. | `/android-test --coverage` |
| `/ios-test [unit\|coverage]` | `xcodebuild` aracılığıyla iOS birim + UI testleri, hataları analiz eder. | `/ios-test coverage` |
| `/kmp-test [common\|android]` | Tüm hedeflerde + kapsam ölçümüyle KMP testleri. | `/kmp-test` |
| `/compose-test [<TestClass>]` | Kritik akışlar için Compose UI testlerini çalıştırır. | `/compose-test HomeScreenTest` |
| `/mobile-verify [--k=N] [--flaky]` | Kararsız testleri algılamak / güvenilirliği ölçmek için pass@k döngüsü. | `/mobile-verify --k=3` |
| `/mobile-tdd "<requirement>"` | Önce test → uygulama → yeniden düzenleme döngüsü, ≥%80 kapsam. | `/mobile-tdd "Add search to HomeScreen"` |
| `/lint-android [--fix]` | Android Lint + Detekt + ktlint, isteğe bağlı otomatik düzeltme. | `/lint-android --fix` |
| `/swiftlint [fix\|strict]` | SwiftLint stil denetimi + otomatik düzeltme. | `/swiftlint fix` |
| `/android-review [<branch>]` | Kotlin/Compose/MVI incelemesi: stil, kalıplar, güvenlik, performans. | `/android-review feature/home` |

## Planlama ve inceleme

| Command | What it does | Example |
|---|---|---|
| `/mobile-plan "<desc>"` | Bir özelliği planlar: mimari, modül yerleşimi, görevler, test stratejisi. | `/mobile-plan "Implement offline support"` |
| `/platform-info [detect\|list]` | Proje türünü (Android/iOS/KMP) ve platform ayrıntılarını algılar. | `/platform-info` |
| `/mobile-checkpoint save\|restore\|list [name]` | Riskli işlemler öncesinde derleme ve test proje durumunu anlık görüntüler/geri yükler. | `/mobile-checkpoint save before-mvi-refactor` |

## Öğrenme ve içgüdüler

Bunlar [sürekli öğrenme sistemini](HOOKS-AND-MCP.md#continuous-learning) yönlendirir.

| Command | What it does | Example |
|---|---|---|
| `/learn [--type <ctx>]` | Geçerli oturumdan kalıpları yeniden kullanılabilir bilgi olarak çıkarır. | `/learn --type compose` |
| `/instinct-status [--type <ctx>]` | Güven puanları ve son kullanım tarihleriyle öğrenilen içgüdüleri listeler. | `/instinct-status` |
| `/instinct-export [<file>]` | İçgüdüleri paylaşım için JSON'a dışa aktarır. | `/instinct-export patterns.json` |
| `/instinct-import <file>` | İçgüdüleri içe aktarır ve birleştirir (tekrarları kaldırır, güveni korur). | `/instinct-import patterns.json` |
| `/evolve [--context <ctx>]` | Olgun içgüdüleri yeni yeniden kullanılabilir `SKILL.md` becerilerine kümelendirir. | `/evolve` |

---

← [README](../../README.md)'e dön · Ayrıca bkz. [Ajanlar](AGENTS.md) · [Beceriler](SKILLS.md) · [Hook'lar & MCP](HOOKS-AND-MCP.md)

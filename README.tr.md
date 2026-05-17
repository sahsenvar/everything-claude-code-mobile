**🌐 Language / Dil:** [English](README.md) · **Türkçe**

# Everything Claude Code Mobile

> **Bir mobil özelliği tek cümleyle tarif et. Planlanmış, kodlanmış, test edilmiş, gözden geçirilmiş ve doğrulanmış halini al — Android, iOS ve Kotlin Multiplatform üzerinde.**

[![Stars](https://img.shields.io/github/stars/sahsenvar/everything-claude-code-mobile?style=flat)](https://github.com/sahsenvar/everything-claude-code-mobile/stargazers)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-plugin-D97757)](https://claude.com/claude-code)
![Kotlin](https://img.shields.io/badge/-Kotlin-7F52FF?logo=kotlin&logoColor=white)
![Compose](https://img.shields.io/badge/-Jetpack%20Compose-4285F4?logo=jetpackcompose&logoColor=white)
![Android](https://img.shields.io/badge/-Android-3DDC84?logo=android&logoColor=white)
![Swift](https://img.shields.io/badge/-Swift-FA7343?logo=swift&logoColor=white)
![SwiftUI](https://img.shields.io/badge/-SwiftUI-0D96F6?logo=swift&logoColor=white)
![KMP](https://img.shields.io/badge/-Kotlin%20Multiplatform-7F52FF?logo=kotlin&logoColor=white)

> 🍴 **Bu bir kişisel fork'tur** — kaynağı: [`ahmed3elshaer/everything-claude-code-mobile`](https://github.com/ahmed3elshaer/everything-claude-code-mobile). Gerçek kurulumlar için sağlamlaştırıldı ve belirli bir KMP yığınına göre ayarlandı. Bkz. [Teşekkürler & kaynak](#-teşekkürler--kaynak) ve [`FORK-NOTES.md`](FORK-NOTES.md).

---

## ✨ Bu nedir?

**Everything Claude Code Mobile**, [Claude Code](https://claude.com/claude-code)'u eksiksiz bir mobil mühendislik ekibine dönüştüren bir eklentidir.

Kod parçalarını ileri geri kopyalamak yerine, ona bir özellik tarif edersin ("Senkronizasyonlu, çevrimdışı makale okuma ekle") ve **uzmanlaşmış agent'lardan** oluşan orkestralı bir hat: mimariyi planlar, her katmanı kodlar, testleri yazar, build'i düzeltir, kalite ve güvenlik incelemesini yapar ve güvenilirliği doğrular — **Android, iOS ve Kotlin Multiplatform** için. Sen çalışırken arka planda **kod tabanının desenlerini öğrenir** ve senin konvansiyonlarına uymakta giderek ustalaşır.

İçinde **29 agent**, **47 skill**, **42 slash komut**, **3 arka plan hook aşaması** ve **3 proje-hafıza MCP sunucusu** gelir — hepsi kurulumda Claude Code tarafından otomatik keşfedilir.

### Kimler için?

**Android (Kotlin/Compose)**, **iOS (Swift/SwiftUI)** veya **Kotlin Multiplatform** kullanan; Claude Code'dan gevşek kod parçaları yerine yapısal, test edilmiş, incelemeden geçmiş özellikler isteyen — ve mimari korkulukların otomatik uygulanmasını isteyen mobil geliştiriciler ve ekipler.

---

## 🚀 Neden kullanmalı?

- **Tek komut, koca bir özellik.** `/feature-build "<açıklama>"` 6 fazlı bir hattı uçtan uca çalıştırır — planlama → implementasyon → testler → build-fix → kalite kapısı → doğrulama.
- **Genelci değil, uzman.** 29 agent'ın her biri tek bir işin sahibi (network katmanı, SwiftUI, Gradle hataları, güvenlik incelemesi, TDD…), böylece her katmanı o katmanı derinlemesine bilen bir şey üstlenir.
- **Varsayılan olarak çapraz platform.** Aynı özellik isteği Android, iOS ve paylaşılan KMP kodunda idiomatik biçimde gerçeklenir.
- **Görüşlü, tutarlı yığın.** Paylaşılan kod için Koin · Ktor · MVI · SQLDelight; UI için Jetpack Compose + native SwiftUI. Skill'ler agent'ları rastgele alternatiflere değil *senin* yığınına yönlendirir.
- **Kod tabanını öğrenir.** Bir continuous-learning sistemi tekrarlayan desenleri yeniden kullanılabilir "instinct"ler olarak yakalar; sonraki işler senin konvansiyonlarına otomatik uyar.
- **Korkuluklar önerilmez, uygulanır.** %80 test kapsamı, TDD, sabit-kodlanmış sır yok, yapılandırılmış eşzamanlılık, null-güvenliği ve kod-boyutu sınırları her değişiklikte uygulanır.
- **Sıfır manuel bağlama.** Agent, skill ve komutlar otomatik keşfedilir — kur ve başla.

---

## ⚡ Hızlı başlangıç

> **Gereksinimler:** [Claude Code](https://claude.com/claude-code) ve **Node.js ≥ 18**.

```bash
# 1. Marketplace'i ekle (bu fork)
/plugin marketplace add sahsenvar/everything-claude-code-mobile

# 2. Eklentiyi kur
/plugin install everything-claude-code-mobile@sahsenvar
```

```bash
# 3. Kurulumu çalıştır (MCP bağımlılıkları + doğrulama): /ecc-setup
#    Sağlığı istediğin zaman /ecc-doctor ile kontrol et.
```

```bash
# 4. (İsteğe bağlı) Pakete dahil disiplin kurallarını global Claude config'ine kur
git clone https://github.com/sahsenvar/everything-claude-code-mobile.git
cp -r everything-claude-code-mobile/rules/* ~/.claude/rules/
```

Sonra sadece iste:

```
/feature-build "Çevrimdışı kalıcılık ve aşağı-çekip-yenileme ile bir favoriler ekranı ekle"
```

> 💡 **Güncelliyor musun?** Sürüm dizesi değişmediyse `claude plugin update` hiçbir şey yapmaz — sürümü artır ya da yeniden kur. MCP araçları görünmüyorsa `/ecc-setup` çalıştır ya da `/ecc-doctor` ile tanı koy.

### Kaldırma

```
/plugin uninstall everything-claude-code-mobile@sahsenvar
```

Temiz — global config'e hiçbir şey kopyalanmaz. Proje veri dizinleri (`.claude/mobile-memory`, `.claude/ios-memory`, `.claude/kmp-context`, `.claude/checkpoints`) senin verin; istersen elle sil.

### Önerilen tamamlayıcı eklentiler

ECC, official eklentilerle birlikte çalışır (içermez): Figma, Atlassian (Jira/Confluence), GitHub. Hangileri tespit edildi görmek için `/ecc-doctor` çalıştır.

---

## 🛠️ Feature Builder hattı

`/feature-build "<açıklama>"` **altı yapısal fazı** orkestre eder. Her faz bir sonrakine devreder; implementasyon fazı 5 agent'lık bir DAG'a yayılır.

```
1. Planlama           feature-planner + mobile-architect
                       → mimari, modüller, görev DAG'ı
2. Implementasyon     architecture-impl → (network-impl ∥ ui-impl)
                       → data-impl → wiring-impl   (bağımlılık sıralı DAG)
3. Test               unit-test-writer + ui-test-writer + mobile-e2e-runner
4. Build & Fix        yeşil olana dek derle/test döngüsü
5. Kalite Kapısı      android-reviewer ∥ ios-reviewer ∥
                       mobile-security-reviewer ∥ mobile-performance-reviewer
6. Doğrulama          mobile-verifier (pass@k güvenilirlik metrikleri)
```

Fazları tek tek de sürebilirsin: `/feature-plan`, `/feature-implement`, `/feature-test`, `/feature-build-fix`, `/feature-quality-gate`, `/feature-verify`, `/feature-status`.

---

## 🧭 Daha fazla kullanım yolu

`/feature-build` vitrin özelliği ama eklentinin çoğu tek başına da işe yarar — ne yapıyorsan ona yönelt:

| İstediğin | Çalıştır | Ne olur |
|---|---|---|
| Bozuk Android build'i düzelt | `/android-build` | `android-build-resolver` Gradle/AGP/bağımlılık hatalarını teşhis edip minimal düzeltir |
| Eksik testleri tamamla | `/mobile-tdd "<gereksinim>"` | `mobile-tdd-guide` + `unit-test-writer`/`ui-test-writer` önce test yazar, sonra implementasyon |
| PR öncesi branch incele | `/android-review <branch>` | `android-reviewer` Kotlin/Compose/MVI stil, güvenlik, performans bakar |
| Flaky testleri yakala | `/mobile-verify --k=3` | `mobile-verifier` suite'i k kez çalıştırıp pass@k güvenilirliği raporlar |
| Kodlamadan önce planla | `/mobile-plan "<açıklama>"` | `feature-planner` + `mobile-architect` mimari/görev planı üretir |
| Ne öğrendiğini gör | `/instinct-status` | Kod tabanından yakalanan desenleri ("instinct") güven skoruyla listeler |
| Desenleri skill'e dönüştür | `/evolve` | Olgun instinct'leri yeni yeniden-kullanılabilir `SKILL.md` skill'lerine kümeler |

Her komut, agent ve skill'in tek tek açıklandığı tam katalog → **[Dokümantasyon](#-dokümantasyon)**.

---

## 📦 İçinde ne var

> 📚 Bunlar özet. **Her bir agent, skill ve komut** aşağıdaki [Dokümantasyon](#-dokümantasyon) bölümünde tam olarak açıklanıyor (İngilizce + Türkçe).

### 29 agent — [tam referans →](docs/tr/AGENTS.md)

| Grup | Agent'lar | Ne yapar |
|---|---|---|
| **Kod incelemesi (4)** | `android-reviewer`, `ios-reviewer`, `mobile-security-reviewer`, `mobile-performance-reviewer` | Platform ve kesişen kalite, güvenlik, performans incelemesi |
| **Build & derleme (3)** | `android-build-resolver`, `xcode-build-resolver`, `gradle-expert` | Build/Gradle/Xcode hatalarını teşhis ve düzeltme |
| **Mimari & planlama (4)** | `mobile-architect`, `kmp-architect`, `feature-planner`, `shared-model-designer` | Özellik planlama ve çapraz platform tasarım |
| **UI & tasarım (4)** | `compose-guide`, `swiftui-guide`, `m3-expressive-guide`, `liquid-glass-guide` | İdiomatik Compose / SwiftUI / Material 3 / Liquid Glass |
| **Implementasyon (5)** | `architecture-impl`, `network-impl`, `data-impl`, `ui-impl`, `wiring-impl` | Bağımlılık sıralı feature-build DAG'ı |
| **Test (5)** | `mobile-tdd-guide`, `mobile-e2e-runner`, `unit-test-writer`, `ui-test-writer`, `mobile-verifier` | TDD akışı, E2E ve güvenilirlik doğrulaması |
| **Öğrenme & meta (2)** | `mobile-pattern-extractor`, `mobile-compactor` | Yeniden kullanılabilir desen yakalama; bağlam optimizasyonu |

### 47 skill — [tam referans →](docs/tr/SKILLS.md)

Agent'ların başvurduğu, yeniden kullanılabilir, yığına özel rehberler:

- **Android** — `jetpack-compose`, `navigation-compose`, `koin-patterns`, `coroutines-patterns`, `room-patterns`, `gradle-patterns`, `m3-expressive`, `android-patterns`
- **iOS** — `swiftui-patterns`, `swift-patterns`, `combine-framework`, `core-data`, `ios-testing`, `liquid-glass`
- **Kotlin Multiplatform** — `kmp-di`, `kmp-networking`, `kmp-navigation`, `kmp-repositories`, `shared-models`, `shared-coroutines`, `expect-actual`, `sqldelight-patterns`
- **Mimari & kalite** — `mvi-architecture`, `feature-builder`, `mobile-testing`, `mobile-verification`, `mobile-security`, `ci-cd-patterns`
- **Özellik reçeteleri** — `offline-first`, `pagination-patterns`, `deep-linking`, `push-notifications`, `feature-flags`, `image-loading`, `localization-patterns`, `analytics-patterns`, `accessibility-patterns`, `app-lifecycle`, `ktor-patterns`
- **Continuous learning** — `continuous-learning`(+`-v2`), `mobile-instinct-v1`/`-v2`, `mobile-checkpoint`, `mobile-compaction`, `mobile-memory`

### 42 komut — [tam referans →](docs/tr/COMMANDS.md)

| Grup | Örnekler |
|---|---|
| **Özellik hattı (9)** | `/feature-build`, `/feature-plan`, `/feature-implement`, `/feature-test`, `/feature-build-fix`, `/feature-quality-gate`, `/feature-status`, `/feature-verify`, `/feature-learn` |
| **Build & derleme (10)** | `/android-build`, `/ios-build`, `/kmp-build`, `/gradle-fix`, `/kmp-dependency-fix`, `/compose-preview`, `/lint-android`, `/swiftlint`, `/release-build`, `/mobile-build` |
| **Test (7)** | `/mobile-tdd`, `/android-test`, `/ios-test`, `/kmp-test`, `/compose-test`, `/mobile-test`, `/mobile-verify` |
| **Planlama & inceleme (3)** | `/mobile-plan`, `/android-review`, `/platform-info` |
| **Öğrenme & instinct (6)** | `/learn`, `/instinct-status`, `/instinct-export`, `/instinct-import`, `/evolve`, `/mobile-checkpoint` |

---

## 🧠 Continuous-learning sistemi nasıl çalışır

Eklenti, bir kod tabanında kullandıkça daha akıllı hale gelir — otomatik, ek komut gerekmeden:

1. **Yakala** — Claude her kod yazdığında/düzenlediğinde bir `PostToolUse` hook tetiklenir.
2. **Çıkar** — salt-okunur `mobile-pattern-extractor` agent'ı değişikliği analiz eder ve tekrarlayan desenleri (MVI şekilleri, DI bağlama, Compose idiom'ları…) yüzeye çıkarır.
3. **Kalıcılaştır** — hook zinciri (`post-tool-use.js → extract-pattern.js → instincts.js`) bunları `~/.claude/instincts/` altında "instinct" olarak saklar. *(Agent'ın kendisi asla yazmaz — kalıcılık tasarımca hook'a delege edilmiştir.)*
4. **Gözlemle** — `mobile-instinct-v2` / `continuous-learning` skill'leri oturumlar boyu tekrarlayan desenleri tespit eder.
5. **Yeniden kullan & evrimleştir** — `/instinct-status` öğrenilenleri listeler, `/instinct-export` / `/instinct-import` makineler arası paylaşır, `/evolve` olgunlaşmış instinct'leri yeniden kullanılabilir skill'lere kümeler.

Kesin veri akışı, dosya yolları ve her handler → [docs/tr/HOOKS-AND-MCP.md](docs/tr/HOOKS-AND-MCP.md#continuous-learning).

---

## 🔌 Hook'lar & MCP sunucuları

**Arka plan hook'ları** (3 olay aşaması, 9 script handler) — `hooks/hooks.json` ile kayıtlı, `${CLAUDE_PLUGIN_ROOT}` ile yola-taşınabilir:

| Olay | Handler'lar | Amaç |
|---|---|---|
| `Stop` | `evaluate-session`, `v2-analysis`, `evaluate-ios-session`, `session-checkpoint-prompt` | Oturum sonu desen çıkarımı & checkpoint istemleri |
| `PreCompact` | `pre-compact`, `pre-compact-ios` | Token compaction öncesi kritik bağlamı koru |
| `PostToolUse` | `post-tool-use` (Write/Edit), `track-build` (Bash), `track-focus` (Read) | Instinct yakalama, build izleme, odak izleme |

**Proje-hafıza MCP sunucuları** (3) — proje başına kalıcı bağlam, `.mcp.json` ile yapılandırılır:

| Sunucu | Hatırladığı |
|---|---|
| `mobile-memory` | Proje yapısı, bağımlılıklar, mimari, test durumu |
| `ios-memory` | iOS proje durumu, SwiftUI bileşenleri, XCTest desenleri |
| `kmp-context` | KMP modül yapısı, expect/actual, paylaşılan modeller |

> ⚠️ MCP sunucuları, eklenti kurulumundan sonra bir kez bağımlılık kurulumu ister: `/ecc-setup` çalıştır (bkz. [Hızlı başlangıç](#-hızlı-başlangıç) 3. adım).

**Her hook handler'ı ve MCP sunucusu, ve tam öğrenme veri-akışı → [docs/tr/HOOKS-AND-MCP.md](docs/tr/HOOKS-AND-MCP.md).**

---

## 📚 Dokümantasyon

README genel bakıştır. Her agent, skill, komut, hook ve MCP sunucusu tam olarak belgelenmiştir — **İngilizce ve Türkçe**:

| Referans | İngilizce | Türkçe |
|---|---|---|
| **Agent'lar** — 27'sinin tümü, ne yapar & nasıl devreye girer | [docs/AGENTS.md](docs/AGENTS.md) | [docs/tr/AGENTS.md](docs/tr/AGENTS.md) |
| **Skill'ler** — 46'sının tümü, amaç & ne zaman | [docs/SKILLS.md](docs/SKILLS.md) | [docs/tr/SKILLS.md](docs/tr/SKILLS.md) |
| **Komutlar** — 35'inin tümü, kullanım & örnek | [docs/COMMANDS.md](docs/COMMANDS.md) | [docs/tr/COMMANDS.md](docs/tr/COMMANDS.md) |
| **Hook & MCP** — 9 hook, 3 sunucu, öğrenme akışı | [docs/HOOKS-AND-MCP.md](docs/HOOKS-AND-MCP.md) | [docs/tr/HOOKS-AND-MCP.md](docs/tr/HOOKS-AND-MCP.md) |

---

## 🎯 Görüşlü yığın

Skill ve agent'lar tek, tutarlı bir yığına göre ayarlanmıştır; böylece üretilen kod alternatiflerin karışımı değil tutarlıdır:

| Konu | Seçim |
|---|---|
| Bağımlılık enjeksiyonu | **Koin** (KMP için Koin Multiplatform) |
| Ağ | **Ktor** (platform engine'leri: OkHttp / Darwin) |
| Mimari | **MVI** tek-yönlü veri akışı |
| Paylaşılan kalıcılık | **SQLDelight** |
| UI | **Jetpack Compose** + native **SwiftUI** |
| Build | Gradle **version catalog** (`libs.*`) — satır içi sürüm sabitleme yok |

---

## 🛡️ Her değişiklikte uygulanan kurallar

≥ %80 test kapsamı · test-güdümlü geliştirme · sabit-kodlanmış sır yok · önce-değişmezlik & null-güvenliği · yapılandırılmış eşzamanlılık · Compose/SwiftUI en iyi pratikleri · HTTPS + sertifika pinning · kod-boyutu sınırları. Global kurulum için [Hızlı başlangıç](#-hızlı-başlangıç) 4. adım.

---

## 🩹 Sorun giderme

| Belirti | Çözüm |
|---|---|
| MCP araçları (mobile-memory vb.) görünmüyor | `/ecc-setup` çalıştır (bağımlılıkları kurar + doğrular), sonra Claude Code'u yeniden başlat. Neyin eksik olduğunu görmek için `/ecc-doctor` kullan. |
| `claude plugin update` hiçbir şey yapmadı | Sürüm dizesi değişmemişse no-op olur — yeniden kur ya da sürüm artışını bekle |
| Agent/skill yüklenmiyor | `agents/`, `skills/`, `commands/` dizinlerinden otomatik keşfedilir; `plugin.json`'a `agents`/`skills`/`commands` anahtarları **ekleme** (keşfi bozar) |

---

## 🤝 Katkı

[Bu fork'ta](https://github.com/sahsenvar/everything-claude-code-mobile) issue ve PR'lara açığız. İyi alanlar: yeni platform skill'leri, ek özellik reçeteleri, agent prompt ayarı ve instinct-sistemi iyileştirmeleri. Değişiklikler [`FORK-NOTES.md`](FORK-NOTES.md)'de izlenir.

---

## 🙏 Teşekkürler & kaynak

Bu proje, Ahmed El-Shaer'in **[`ahmed3elshaer/everything-claude-code-mobile`](https://github.com/ahmed3elshaer/everything-claude-code-mobile)** projesinin kişisel bir fork'udur — özgün fikir ve temel için tüm kredi yukarı akıma (upstream) aittir. Bu fork; taşınabilirlik düzeltmeleri (yola-taşınabilir hook'lar, çalışan MCP bağlama, şema-uyumlu manifest, otomatik keşif), bir yığın-hizalama içerik geçişi ve bir kütüphane-sürüm politikası ekler. Ayrışma [`FORK-NOTES.md`](FORK-NOTES.md)'de belgelenir.

## 📄 Lisans

[MIT](LICENSE). Özgün eser © ilgili sahiplerine aittir; fork değişiklikleri aynı MIT lisansı altında katkılanmıştır.

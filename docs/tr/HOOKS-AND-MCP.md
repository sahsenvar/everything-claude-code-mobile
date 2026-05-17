**🌐 Language / Dil:** [English](../HOOKS-AND-MCP.md) · **Türkçe**

# Hook'lar, MCP sunucuları ve sürekli öğrenme sistemi

Bu, "çalıştıkça zekileşir" mekanizmasıdır. Hiçbir şeyi elle çağırmanıza gerek yoktur — arka planda çalışır.

---

## Arka plan hook'ları (9 işleyici, 3 olay)

`hooks/hooks.json` dosyasında kayıtlıdır; `${CLAUDE_PLUGIN_ROOT}` üzerinden taşınabilir yol kullanır. Hook'lar asenkron çalışır ve oturumunuzu hiçbir zaman başarısız yapmaz.

### `Stop` — bir oturum sona erdiğinde

| İşleyici | Ne yapar |
|---|---|
| `evaluate-session.js` | Son 5 commit'in `.kt` dosyalarını mobil örüntüler açısından tarar (Compose state hoisting, MVI intents, Koin injection, safe Ktor requests, structured concurrency, LazyColumn keys, immutable data classes, sealed state). Her birini düşük güvenlik eşiğiyle (~0.4) bir içgüdü olarak kaydeder. |
| `v2-analysis.js` | Son Kotlin değişikliklerinin çapraz dosya mimari analizi (katman ayrımı, feature modülleri, repository'ler, use case'ler, pagination, test yansıması). 3+ oturumda görülen örüntülerin güvenini artırır. |
| `evaluate-ios-session.js` | iOS karşılığı — son `.swift` dosyalarını SwiftUI/Combine/Concurrency/Core Data örüntüleri açısından tarar ve içgüdüleri kaydeder. |
| `session-checkpoint-prompt.js` | Değiştirilen dosya sayısını ve branch'i sayar; oturum önemliyse (≥5 dosya / feature branch) bir checkpoint kaydetmeyi önerir ve oturum özeti saklar (son 30 tutulur). |

### `PreCompact` — bağlam sıkıştırılmadan önce

| İşleyici | Ne yapar |
|---|---|
| `pre-compact.js` | Sıkıştırma nedeniyle hiçbir kritik verinin kaybolmaması için bir checkpoint (içgüdüler, git branch, son dosyalar) kaydeder. Son 10 tutulur. |
| `pre-compact-ios.js` | iOS'a özel checkpoint (son `.swift` dosyaları + içgüdüler). Son 10 tutulur. |

### `PostToolUse` — Claude bir eylem gerçekleştirdikten sonra

| İşleyici | Eşleştirici | Ne yapar |
|---|---|---|
| `post-tool-use.js` | `Write`\|`Edit` | Dağıtıcı. Dosya adına göre odaklanmış yakalayıcılara yönlendirir — `*ViewModel.kt` → ViewModel örüntüleri, `*Screen.kt` → Compose yapısı, `*Module.kt` → Koin DI, `build.gradle.kts` → bağımlılık takibi, diğer `.kt` → genel örüntü çıkarımı. |
| `track-build.js` | `Bash` | Derleme/test komut çalıştırmalarını (tür, komut, branch) kayan geçmişe kaydeder (son 100). |
| `track-focus.js` | `Read` | Aynı dosyanın tekrar tekrar okunmasını sayar — çok ziyaret ettiğiniz dosyalar problem çözme odağınızı işaretler. |

### `SessionStart` — bir oturum başladığında

| İşleyici | Ne yapar |
|---|---|
| `check-setup.js` | Yalnızca tespit: oturum başlarken, paket halinde gelen MCP sunucularından herhangi birinin bağımlılıkları eksikse, `/ecc-setup` çalıştırması için tek satırlık bir uyarı yazdırır. Hiçbir şey kurmaz, ağ kullanmaz, oturumu hiçbir zaman başarısız kılmaz. |

## Proje bellek MCP sunucuları (3)

`.mcp.json` dosyasında yapılandırılmıştır. Her biri proje durumunu **oturumlar arası** hatırlayan küçük bir sunucudur; böylece Claude her seferinde tüm kod tabanınızı yeniden okumak zorunda kalmaz.

> ⚙️ **Bir kerelik kurulum:** eklentiyi yükledikten sonra, yüklü eklenti dizininden `npm run mcp:install` komutunu çalıştırın. Her sunucunun bağımlılıklarını yükler (`npm ci` / `npm install --omit=dev`). Bu yapılmadan MCP araçları görünmez.

| Sunucu | Neleri hatırlar | Yapılandırma (`.mcp.json`) |
|---|---|---|
| `mobile-memory` | Android proje yapısı, bağımlılıklar, mimari meta veriler, test kapsamı/eğilimi, Compose ekranları, derleme varyantları, navigasyon grafiği, son değişiklikler. | `MOBILE_MEMORY_DIR=.claude/mobile-memory`, maks. 10 MB, 90 günlük saklama |
| `ios-memory` | Xcode proje/workspace/targets/schemes, SwiftUI view'ları ve navigasyon, SPM/CocoaPods bağımlılıkları, test meta verileri, `Info.plist` özellikleri. | `IOS_MEMORY_DIR=.claude/ios-memory`, maks. 10 MB, 90 günlük saklama |
| `kmp-context` | KMP modül düzeni, kaynak kümeleri ve bağımlılıkları, `expect`/`actual` bildirimleri, paylaşılan serileştirilebilir modeller, platform hedefleri. | `KMP_CONTEXT_DIR=.claude/kmp-context`, isteğe bağlı otomatik algılama |

## Continuous learning

**"Kod tabanınızı öğrenir" iddiası — somut olarak:**

1. **Yakalama.** Kod yazarsınız/düzenlersiniz → `PostToolUse(Write|Edit)` hook'u tetiklenir → `post-tool-use.js` dosyayı bir örüntü çıkarıcıya yönlendirir (`extract-pattern.js` ve odaklanmış `capture-*` betikleri).
2. **Puanlama.** Algılanan örüntüler `scripts/lib/instincts.js` aracılığıyla **içgüdülere** dönüşür: yeni bir örüntü ~0.3–0.5 güven değeriyle başlar; her yeniden algılamada +0.1 eklenir (üst sınır 1.0); kullanılmayan içgüdüler 30 günden sonra −0.05 azalır.
3. **Kalıcılık.** İçgüdüler **`~/.claude/instincts/mobile-instincts.json`** dosyasına yazılır (artı etkinlik sinyalleri için `build-history.json`, `focus-history.json`, `v2-sessions.json`). `mobile-pattern-extractor` ajanı kasıtlı olarak **salt okunur** tutulur — kalıcılık, ajan ile yazıcının asla çakışmaması amacıyla hook zincirine devredilmiştir.
4. **Pekiştirme.** Oturum sonunda `v2-analysis.js` oturumlar genelinde bakar ve tekrar gördüğü örüntülerin güvenini artırır.
5. **Yeniden kullanım ve evrim.** `/instinct-status` öğrenilenleri (güven değerleriyle birlikte) gösterir, `/instinct-export` / `/instinct-import` bunları makineler arasında taşır, `/evolve` ise olgun içgüdüleri tamamen yeni yeniden kullanılabilir `SKILL.md` becerilerine kümelendirir. `mobile-instinct-v2` / `continuous-learning` becerileri yüksek güvenli örüntüleri gelecekteki çalışmalara geri besler.

**Verileriniz nerede saklanır:** makinenizde `~/.claude/instincts/` (örüntü deposu), proje bazında ise `.claude/checkpoints/` (sıkıştırma öncesi anlık görüntüler) ve yukarıdaki MCP bellek dizinlerinde. Hiçbir şey hiçbir yere gönderilmez.

---

← [README](../../README.md)'e geri dön · Ayrıca bkz: [Ajanlar](AGENTS.md) · [Beceriler](SKILLS.md) · [Komutlar](COMMANDS.md)

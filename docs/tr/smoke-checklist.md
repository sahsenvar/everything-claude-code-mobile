# Smoke kontrol listesi (yayın öncesi)

Sürüm etiketlemeden önceki elle kontroller. Otomatik katman
(`tests/integration/smoke.test.js`) JS çalışma yüzeyini kapsar; bu liste
yalnızca bir insanın doğrulayabileceğini kapsar.

- [ ] `npm test` yeşil (`tests/integration/smoke.test.js` dahil); `npm run verify` sorunsuz.
- [ ] Claude Code'da temiz kurulum: `/plugin install …` sonra `/ecc-setup` → 3 MCP sunucusu kurulur, `/ecc-doctor` yeşil.
- [ ] `examples/android-smoke/` projesini aç: `/ecc-doctor` `platform: android` raporlar.
- [ ] Gerçek oturumda bir hook tetikle (`*ViewModel.kt` düzenle): TDD hatırlatması çıkar; oturum bozulmaz.
- [ ] `/feature-build "küçük değişiklik"` plan fazına hatasız ulaşır (nokta kontrol, tam koşu değil).
- [ ] Tüm agent/komutlar Claude Code'da listelenir (keşif bozulmaz); `docs/COMMANDS.md` sayısı `commands/` ile uyumlu.
- [ ] `/plugin uninstall` global-config'te kalıntı bırakmaz.

# Android-App (Capacitor) — Anleitung

Gleiche Next.js-Web-App wie Web & iOS, verpackt mit [Capacitor](https://capacitorjs.com).
Kein separater App-Code — Web-Code ändern, statisch bauen, ins native Android-Projekt (`android/`) syncen.

---

## Voraussetzungen (einmalig)

1. **Android Studio** (bringt SDK, Emulator und eine eigene JDK mit):
   ```bash
   brew install --cask android-studio
   ```
2. **JDK 21** (für `./gradlew`-Builds im Terminal — braucht Admin-Passwort):
   ```bash
   brew install --cask temurin@21
   ```
3. **Erststart-Assistent in Android Studio** (GUI, einmalig):
   - Android Studio öffnen → „More Actions" → **SDK Manager**: ein aktuelles SDK (API 34/35) installieren, **Lizenzen akzeptieren**.
   - **Device Manager** → Emulator anlegen (z. B. *Pixel 8*, aktuelles System-Image).
4. **Umgebungsvariablen** setzen (in `~/.zshrc`), damit das Terminal das SDK findet:
   ```bash
   export ANDROID_HOME="$HOME/Library/Android/sdk"
   export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator"
   ```
   Danach `source ~/.zshrc`. Prüfen: `adb --version`.

---

## Projekt in Android Studio öffnen

```bash
npm run android:sync   # Web-App bauen + ins Android-Projekt kopieren
npm run android:open   # Android Studio mit dem Projekt öffnen
```

In Android Studio oben einen Emulator/Gerät wählen → **▶ Run**.

---

## Direkt in den Emulator (ohne Studio-GUI)

Emulator muss laufen oder als Gerät verfügbar sein:

```bash
npm run android:run    # bauen + installieren + starten
```

Kein iCloud-/codesign-Problem wie bei iOS — Android-Builds sind davon nicht betroffen.

---

## Nach jeder Web-Änderung

```bash
npm run android:sync   # danach in Studio erneut Run, ODER:
npm run android:run    # sync + bauen + starten in einem
```

---

## Backend & Netzwerk (wichtiger Unterschied zu iOS)

Die App spricht zur Laufzeit mit der .NET-API. Backend starten:
```bash
cd ../Business-Backend
docker compose up -d postgres
dotnet run --project src/Business.API   # http://localhost:5228
```

- **Android-Emulator erreicht den Mac NICHT über `localhost`** — der Host ist dort `10.0.2.2`.
  Das ist bereits gelöst: [`src/lib/api-client.ts`](src/lib/api-client.ts) erkennt die Android-Plattform
  und ersetzt `localhost` automatisch durch `10.0.2.2`.
- Plain-HTTP zu `10.0.2.2`/`localhost` ist für die Entwicklung in
  [`network_security_config.xml`](android/app/src/main/res/xml/network_security_config.xml) freigegeben.
  **Vor Release** auf HTTPS umstellen und diese Ausnahme entfernen.
- **Echtes Gerät:** `NEXT_PUBLIC_API_URL` in `.env.local` auf die LAN-IP des Macs setzen, neu bauen.

---

## Google Play Store (Release)

1. **Signing-Key** erzeugen (einmalig, sicher aufbewahren!):
   ```bash
   keytool -genkey -v -keystore business.keystore -alias business -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Key in `android/` einbinden (Gradle-Signing-Config) — oder über Android Studio:
   **Build → Generate Signed Bundle / APK → Android App Bundle**.
3. **AAB bauen** (Play verlangt App Bundle, nicht APK):
   ```bash
   cd android && ./gradlew bundleRelease
   # → android/app/build/outputs/bundle/release/app-release.aab
   ```
4. **Google Play Console**: einmalig **25 $**, App anlegen, AAB hochladen, Store-Eintrag ausfüllen, zur Prüfung einreichen.

> Play ist bei „Web-Wrapper"-Apps kulanter als Apple (kein striktes 4.2-Äquivalent).

---

## App-Identität ändern (vor Release)

- **Application ID** (aktuell `de.business.app`): `android/app/build.gradle` → `applicationId`
- **App-Name**: `android/app/src/main/res/values/strings.xml` (`app_name`)
- **Icon**: `android/app/src/main/res/mipmap-*` (oder über Studio: Image Asset Studio)

---

## Befehls-Übersicht

| Befehl | Zweck |
|---|---|
| `npm run android:sync` | Web bauen + ins Android-Projekt kopieren |
| `npm run android:open` | Projekt in Android Studio öffnen |
| `npm run android:run`  | Bauen + im Emulator starten |

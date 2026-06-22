# iOS-App (Capacitor) — Anleitung

Die iOS-App ist die **gleiche Next.js-Web-App**, verpackt mit [Capacitor](https://capacitorjs.com).
Es gibt **keinen separaten App-Code** — du änderst den Web-Code, baust ihn statisch und
synchronisierst ihn ins native Xcode-Projekt unter `ios/`.

---

## Voraussetzungen (einmalig)

- **Xcode** (aus dem App Store) + einmal öffnen, damit die Lizenz akzeptiert wird:
  ```bash
  sudo xcodebuild -license accept
  ```
- **CocoaPods** (für native Abhängigkeiten):
  ```bash
  brew install cocoapods
  ```
- **Node-Abhängigkeiten** installiert: `npm install`

---

## Projekt in Xcode öffnen

```bash
npm run ios:sync   # Web-App bauen + ins iOS-Projekt kopieren
npm run ios:open   # Xcode mit dem App-Projekt öffnen
```

`ios:open` ruft `cap open ios` auf und öffnet `ios/App/App.xcodeproj` in Xcode.
Dort oben das Ziel (z. B. **iPhone 17**) wählen und auf **▶ Run** drücken.

> **Tipp:** Aus der Xcode-GUI funktioniert der Build problemlos, weil Xcode in
> `~/Library/Developer/Xcode/DerivedData` baut (nicht in iCloud — siehe „Bekanntes Problem").

---

## Ohne Xcode direkt in den Simulator (schneller)

```bash
npm run ios:run    # bauen + installieren + im Simulator starten (Default: iPhone 17)
```

Anderen Simulator wählen:
```bash
SIM_NAME="iPhone 17 Pro" npm run ios:run
```

---

## Nach jeder Web-Änderung

Änderungen am Web-Code (Komponenten, Seiten, Styles) landen **nicht automatisch** in der App.
Immer neu synchronisieren:

```bash
npm run ios:sync     # danach in Xcode erneut Run, ODER:
npm run ios:run      # macht sync + bauen + starten in einem
```

---

## Backend muss laufen

Die App spricht zur Laufzeit mit der .NET-API. Vorher starten:

```bash
cd ../Business-Backend
docker compose up -d postgres          # Datenbank
dotnet run --project src/Business.API  # API auf http://localhost:5228
```

- Im **Simulator** erreicht `localhost:5228` den Mac direkt — funktioniert ohne Konfiguration.
- Auf einem **echten iPhone** zeigt `localhost` aufs Telefon, nicht auf den Mac. Dann in
  `.env.local` `NEXT_PUBLIC_API_URL` auf die LAN-IP des Macs (z. B. `http://192.168.x.x:5228`)
  setzen, neu bauen — und das Backend per HTTPS/LAN erreichbar machen.

---

## Bekanntes Problem: codesign-Fehler

Fehlermeldung beim Build:
```
resource fork, Finder information, or similar detritus not allowed
Command CodeSign failed with a nonzero exit code
```

**Ursache:** Das Projekt liegt unter `~/Documents`, das von **iCloud Drive** synchronisiert wird.
iCloud hängt Extended Attributes an die Build-Dateien, die `codesign` ablehnt.

**Lösung:** `npm run ios:run` baut bewusst nach `/tmp/biz_dd` (nicht synchronisiert) und umgeht
das Problem. Details im Skript [`scripts/ios-run.sh`](scripts/ios-run.sh).

**Dauerhaft sauber:** Projekt aus `~/Documents` herausziehen (z. B. nach `~/Developer/`).
Dann funktioniert auch `npx cap run ios` direkt.

---

## App-Identität ändern (vor App-Store-Release)

In Xcode → Target **App** → **Signing & Capabilities**:
- **Bundle Identifier** (aktuell `de.business.app`) auf die echte Domain umstellen
- **Team** wählen (Apple Developer Account, 99 $/Jahr)
- App-Name: `capacitor.config.ts` (`appName`) bzw. `Info.plist` (`CFBundleDisplayName`)

> Vor Release: ATS-Ausnahme für HTTP in `ios/App/App/Info.plist` entfernen — Produktion nur über HTTPS.

---

## Befehls-Übersicht

| Befehl | Zweck |
|---|---|
| `npm run ios:sync` | Web bauen + ins iOS-Projekt kopieren |
| `npm run ios:open` | Projekt in Xcode öffnen |
| `npm run ios:run`  | Bauen + im Simulator starten (umgeht iCloud-Problem) |

# Betrieb-App Frontend — Next.js 14 + shadcn/ui

Modernes Frontend für die Betrieb-App, gebaut mit Next.js (App Router), TypeScript, Tailwind CSS und shadcn/ui.

Das Frontend spricht mit einem separaten ASP.NET Core Backend (`Business-Backend`). Für die lokale Entwicklung müssen **beide** Projekte laufen.

## Voraussetzungen

Zum Entwickeln am Frontend allein:

- [Node.js 18+](https://nodejs.org)
- npm 9+

Um zusätzlich das Backend lokal laufen zu lassen (empfohlen, sonst läuft die App nur mit Lade-/Fehlerzuständen):

- [Docker Desktop](https://www.docker.com/products/docker-desktop) — startet PostgreSQL & Redis als Container
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) — zum Ausführen der API
  - Auf Apple Silicon (M1/M2/M3/M4/M5): den **arm64**-Installer wählen, nicht x64
  - Nach der Installation prüfen mit `dotnet --version` (sollte `8.x.x` ausgeben)
  - Falls `dotnet` nicht gefunden wird: das SDK wird i. d. R. nach `/usr/local/share/dotnet` installiert — füge das zu deinem `PATH` hinzu (z. B. in `~/.zshrc`):
    ```bash
    export DOTNET_ROOT=/usr/local/share/dotnet
    export PATH="$DOTNET_ROOT:$PATH"
    ```

## Setup

### 1. Backend starten

```bash
cd ../Business-Backend          # Pfad ggf. anpassen
docker compose up -d            # startet PostgreSQL + Redis
dotnet run --project src/Betrieb.API
```

Warte, bis im Log `Now listening on: http://localhost:5228` erscheint. Die Datenbank wird beim ersten Start automatisch migriert und mit Demo-Daten befüllt (siehe `DbSeeder.cs`).

> Hinweis: Der Default-Port in `appsettings.json` ist `5000`, tatsächlich lauscht die API aber über `launchSettings.json` auf **`http://localhost:5228`**.

### 2. Frontend konfigurieren & starten

Kopiere `.env.example` nach `.env.local`:

```bash
cp .env.example .env.local
```

Stelle sicher, dass die API-URL auf den tatsächlichen Backend-Port zeigt:

| Variable | Beschreibung | Wert (lokal) |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL des Betrieb-API Backends | `http://localhost:5228` |

Abhängigkeiten installieren und Entwicklungsserver starten:

```bash
npm install
npm run dev
```

Die App läuft dann auf [http://localhost:3000](http://localhost:3000).

### 3. Einloggen

Mit einem der vom Seeder angelegten Demo-Konten anmelden (alle benutzen das gleiche Passwort):

- **E-Mail:** `max.mueller@firma.de`
- **Passwort:** `Demo123!`

Weitere Demo-Konten (z. B. für andere Rollen) finden sich in `Business-Backend/.../DbSeeder.cs`.

## Projektstruktur

```
betrieb-app/
└── src/
    ├── app/                    # Next.js App Router Pages
    │   ├── (auth)/login/       # Login-Seite
    │   ├── dashboard/          # Stempeluhr-Dashboard
    │   ├── auftraege/          # Kanban-Board, Backlog, Monatsplan
    │   ├── urlaub/             # Urlaubskalender
    │   ├── mitarbeiter/        # Mitarbeiterübersicht
    │   └── einstellungen/      # Admin-Einstellungen
    ├── components/
    │   ├── layout/             # Sidebar, Header, MainLayout
    │   ├── zeiterfassung/      # StempelButton, ZeitkontoCard
    │   ├── auftraege/          # KanbanBoard, AuftragCard
    │   ├── mitarbeiter/        # MitarbeiterTable
    │   └── ui/                 # shadcn/ui Komponenten (auto-generiert)
    ├── hooks/                  # TanStack React Query Hooks (use-employees, use-orders, ...)
    ├── lib/
    │   ├── api-client.ts       # Axios Instance mit JWT-Auth
    │   └── utils.ts            # cn() und Hilfsfunktionen
    └── types/
        └── index.ts            # API-Typen (gespiegelt von den Backend-DTOs)
```

## Troubleshooting

- **"Address already in use" beim Backend-Start:** Es läuft bereits eine Instanz auf Port 5228 (z. B. im Hintergrund oder in der IDE gestartet). Prüfe mit `lsof -nP -iTCP:5228 -sTCP:LISTEN` und beende den alten Prozess, statt einen zweiten zu starten.
- **Seiten zeigen nur Lade-/Fehlerzustände:** Das Backend läuft nicht oder `NEXT_PUBLIC_API_URL` zeigt auf den falschen Port. Prüfe `.env.local` und ob `http://localhost:5228/swagger` erreichbar ist.

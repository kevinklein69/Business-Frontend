# Betrieb-App Frontend — Next.js 14 + shadcn/ui

Modernes Frontend für die Betrieb-App, gebaut mit Next.js (App Router), TypeScript, Tailwind CSS und shadcn/ui.

## Voraussetzungen

- [Node.js 18+](https://nodejs.org)
- npm 9+

## Setup

1. Abhängigkeiten installieren:
   ```bash
   npm install
   ```

2. Entwicklungsserver starten:
   ```bash
   npm run dev
   ```

Die App läuft dann auf [http://localhost:3000](http://localhost:3000).

## Umgebungsvariablen

Kopiere `.env.example` nach `.env.local` und passe die Werte an:

```bash
cp .env.example .env.local
```

| Variable | Beschreibung | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL des Betrieb-API Backends | `http://localhost:5000` |

## Backend

Das zugehörige Backend-Projekt (`betrieb-api`) ist ein separates Repository.  
Starte es vor dem Frontend: `docker-compose up -d && dotnet run --project src/Betrieb.API`

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
    ├── lib/
    │   ├── api-client.ts       # Axios Instance mit JWT-Auth
    │   └── utils.ts            # cn() und Hilfsfunktionen
    └── types/
        └── index.ts            # API-Typen
```

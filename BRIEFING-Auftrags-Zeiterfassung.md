# Aufgabe: Auftragsbezogene Zeiterfassung (Stempeln pro Auftrag)

## Kontext & Ziel
In Deutschland müssen Arbeitszeiten beim Kunden / pro Auftrag erfasst werden. Mitarbeiter
sollen sich **im jeweiligen Auftrag ein- und ausstempeln** können. Aus diesen Stempelungen
werden die **Ist-Stunden des Auftrags automatisch berechnet**. Der Chef plant weiterhin
manuell die **Soll-Stunden** (`EstimatedHours`).

Das ist eine **zusätzliche** Funktion neben der bestehenden allgemeinen Anwesenheits-
Zeiterfassung – sie ersetzt diese nicht.

Es gibt zwei Repos, beide laufen lokal:
- **Backend:** `/Users/kevinklein/Documents/DEV/Business-Backend` — ASP.NET Core 8, Clean
  Architecture, MediatR/CQRS, EF Core + Postgres. Läuft auf `http://localhost:5228`.
- **Frontend:** `/Users/kevinklein/Documents/DEV/Business-Frontend` — Next.js (⚠️ Version mit
  Breaking Changes — vor Code-Änderungen die Doku unter `node_modules/next/dist/docs/` lesen,
  siehe `AGENTS.md`), TanStack React Query + axios (`src/lib/api-client.ts`).
- Demo-Login: `max.mueller@firma.de` / `Demo123!`.

---

## Fachliche Entscheidungen (so umsetzen, sofern Kevin nichts anderes sagt)

1. **Eigener, separater „Auftrags-Stempel“** — unabhängig vom globalen Anwesenheits-Stempel
   (`/api/time-tracking/clock`). Ein Mitarbeiter kann zu **maximal einem Auftrag gleichzeitig**
   eingestempelt sein. Beim Einstempeln in einen Auftrag, während man schon in einem anderen
   eingestempelt ist: den alten Auftrag automatisch ausstempeln (oder Fehler 409 — siehe offene
   Frage 1).
2. **Ist-Stunden werden automatisch aggregiert.** `Order.ActualHours` = Summe der Netto-Minuten
   aller abgeschlossenen, auftragsbezogenen Zeiteinträge dieses Auftrags (über alle Mitarbeiter),
   umgerechnet in Stunden. Wird beim **Ausstempeln** neu berechnet und persistiert.
   → Das manuelle `ActualHours`-Eingabefeld im Auftrags-Dialog (`kanban-board.tsx`) wird damit
   zum **berechneten, read-only** Wert. (Siehe offene Frage 2 zu manuellem Override.)
3. **Keine Manager-Freigabe nötig** für Auftragsstempel: sie bekommen direkt
   `TimeEntryStatus.Approved`, wie der normale Stempel (`ToggleClockCommandHandler`).
4. Auftragsstempel sollen ebenfalls als Zeiteinträge in der bestehenden Monats-/Saldo-Logik
   auftauchen (sie zählen als gearbeitete Zeit). D.h. `OrderId` ist nur ein **zusätzliches
   optionales Attribut** auf `TimeEntry`, kein separater Entitätstyp.

---

## Backend — Umsetzung

Bestehende Muster als Vorlage nehmen (1:1 Stil übernehmen):
- Entity: `src/Business.Domain/Entities/TimeEntry.cs`, `Order.cs`
- Toggle-Logik: `src/Business.Application/Features/TimeTracking/ToggleClock/`
- Status-Query: `.../TimeTracking/GetClockStatus/`
- DTO + Mapping + Pausenregel (ArbSchG): `.../TimeTracking/TimeEntryDto.cs`
- Controller: `src/Business.API/Controllers/TimeTrackingController.cs`
- EF-Konfiguration: `src/Business.Infrastructure/Persistence/Configurations/`

### 1. Datenmodell
- `TimeEntry` um `public Guid? OrderId { get; set; }` + Navigation `public Order? Order { get; set; }`
  erweitern (nullable: normale Anwesenheitsstempel haben weiterhin keinen Auftrag).
- EF-Konfiguration: optionale Relation `TimeEntry → Order` (Restrict/SetNull beim Löschen des
  Auftrags — kein Cascade-Delete auf Zeiteinträge; entscheiden und konsistent halten).
- **EF Core Migration** erzeugen und anwenden (gleiche Tooling-Kette wie bisher; ggf.
  `dotnet ef migrations add AddOrderIdToTimeEntry`). Seed-Daten in `DbSeeder.cs` optional um ein
  paar auftragsbezogene Stempelungen ergänzen, damit das Frontend etwas anzeigt.

### 2. Commands / Queries (neue Feature-Ordner unter `Features/TimeTracking/`)
- **`ToggleOrderClock/`** — `ToggleOrderClockCommand(Guid OrderId) : IRequest<ToggleOrderClockResult>`.
  Handler-Logik analog zu `ToggleClockCommandHandler`:
  - Offenen *auftragsbezogenen* Eintrag des Users zu **diesem** Auftrag suchen
    (`UserId == userId && OrderId == request.OrderId && ClockOut == null`).
  - Falls vorhanden → `ClockOut = UtcNow` setzen, **`Order.ActualHours` neu berechnen**, speichern,
    `IsClockedIn=false` zurückgeben.
  - Falls nicht → ggf. anderen offenen Auftragsstempel des Users schließen (Entscheidung 1),
    neuen Eintrag mit `OrderId`, `ClockIn=UtcNow`, `Status=Approved`, `IsManual=false` anlegen.
  - Validator: Auftrag existiert; optional: User ist dem Auftrag zugewiesen (`Order.Assignees`).
- **`GetOrderClockStatus/`** — `GetOrderClockStatusQuery(Guid OrderId)` → `OrderClockStatusDto(bool IsClockedIn, DateTime? ClockIn)`.
- **`GetOrderTimeEntries/`** (optional, für Detailansicht) — alle Zeiteinträge eines Auftrags,
  gruppiert je Mitarbeiter, inkl. Netto-Minuten. Für Manager-Übersicht der erfassten Stunden.
- Aggregations-Helfer (z.B. in `TimeEntryQueries.cs`): `RecalculateOrderActualHoursAsync(context, orderId, ct)` —
  summiert Netto-Minuten (gleiche Pausen-/Netto-Logik wie `TimeEntryExtensions.ToDto`) aller
  abgeschlossenen Einträge mit dieser `OrderId`, schreibt das Ergebnis (Stunden, gerundet) nach
  `Order.ActualHours`. Aus dem ToggleOrderClock-Handler aufrufen.

### 3. Controller-Endpunkte
Entscheide dich für **einen** Ort und bleibe konsistent — Empfehlung: in `OrdersController`
(`/api/orders`), da auftragsbezogen:
- `POST /api/orders/{orderId:guid}/clock` → `ToggleOrderClock`
- `GET  /api/orders/{orderId:guid}/clock-status` → `GetOrderClockStatus`
- (optional) `GET /api/orders/{orderId:guid}/time-entries` → Stunden-Detail je Mitarbeiter

`[Authorize]` wie bei den anderen Endpunkten. Detail-Übersicht ggf. `Admin,Manager`.

### 4. ActualHours nicht mehr frei überschreiben
In `UpdateOrderCommandHandler` prüfen, ob `ActualHours` aus dem Update-Request noch gesetzt werden
soll. Empfehlung: serverseitig ignorieren bzw. nur noch berechnet setzen (siehe offene Frage 2).

---

## Frontend — Umsetzung

Vorlagen:
- Stempel-Button-Verhalten: `src/components/time-tracking/stamp-button.tsx` (`ClockButton`)
- Hooks-Stil: `src/hooks/use-time-tracking.ts`, `src/hooks/use-orders.ts`
- Typen: `src/types/index.ts`
- Auftrags-UI: `src/components/orders/order-card.tsx`, `kanban-board.tsx` (Detail-/Edit-Dialog,
  zeigt schon `Soll: Xh / Ist: Yh`), `src/components/orders/orders-view.tsx`

### 1. Typen (`src/types/index.ts`)
- `TimeEntry` um `orderId?: string | null` erweitern.
- Neuen Typ `OrderClockStatus { isClockedIn: boolean; clockIn?: string }` (analog `ToggleClockResult`).

### 2. Hooks (neu in `src/hooks/use-time-tracking.ts` oder `use-orders.ts`)
- `useOrderClockStatus(orderId)` → GET `/api/orders/${orderId}/clock-status`.
- `useToggleOrderClock(orderId)` → POST `/api/orders/${orderId}/clock`; bei `onSuccess`
  **sowohl** `['time-tracking']` **als auch** `['orders']` invalidieren (damit `actualHours` im
  Auftrag sofort aktualisiert wird).

### 3. UI-Komponente: `OrderClockButton`
- Neue Komponente `src/components/orders/order-clock-button.tsx`, abgeleitet von `ClockButton`:
  laufender Timer, Sync mit Server-Status via `useOrderClockStatus`, „Einstempeln/Ausstempeln“.
  Kann kompakter sein als der große runde Button (passend für die Auftrags-Detailansicht).
- Einbinden in der **Auftrags-Detailansicht** (der Dialog/Card in `kanban-board.tsx` bzw.
  `order-card.tsx`), gut sichtbar pro Auftrag.
- Im selben Bereich „Ist: {actualHours}h / Soll: {estimatedHours}h“ anzeigen; `actualHours` ist
  jetzt der berechnete Wert. Das bisherige **manuelle `actualHours`-Eingabefeld** im Edit-Dialog
  entfernen oder auf read-only stellen (siehe offene Frage 2).

### 4. Verhalten
- Stempel-Status pro Auftrag ist die Wahrheit vom Server (wie bei `ClockButton` mit `applyStatus`).
- Klar erkennbar machen, in welchem Auftrag man gerade eingestempelt ist (z.B. Badge in der
  Auftragsliste `orders-view.tsx`, wenn `isClockedIn`).

---

## Definition of Done
- [ ] Migration angelegt + angewendet; `TimeEntry.OrderId` existiert in DB.
- [ ] Ein-/Ausstempeln pro Auftrag funktioniert über die neuen Endpunkte (manuell getestet mit
      Demo-Login, beide Stacks lokal laufend).
- [ ] `Order.ActualHours` wird beim Ausstempeln korrekt aus den Stempelungen berechnet und im
      Frontend angezeigt (kein manuelles Feld mehr / read-only).
- [ ] Allgemeiner Anwesenheits-Stempel funktioniert unverändert weiter.
- [ ] Soll-Stunden (`EstimatedHours`) bleiben vom Chef manuell planbar.
- [ ] Frontend baut ohne TS-Fehler; Backend baut & Tests (falls vorhanden) grün.

## Vorgehen
Backend zuerst (Entity → Migration → Command/Query → Controller), end-to-end gegen die laufende
DB testen, dann Frontend (Typen → Hooks → Komponente → Einbindung). Bestehende Code-Konventionen
beider Repos exakt übernehmen.

---

## Offene Fragen (vor/while Umsetzung mit Kevin klären)
1. **Mehrfach-Einstempeln:** Wenn man in Auftrag A eingestempelt ist und in B einstempelt — A
   automatisch ausstempeln (Vorschlag) **oder** Fehler/Hinweis anzeigen?
2. **Manueller Ist-Stunden-Override:** Soll der Chef `ActualHours` trotz Auto-Berechnung noch
   manuell korrigieren können, oder ist der berechnete Wert verbindlich (Vorschlag: berechnet)?
3. **Koppelung an Anwesenheit:** Soll Auftrags-Stempeln den globalen Anwesenheits-Stempel
   automatisch mitstarten/-stoppen, oder bleiben beide völlig getrennt (Vorschlag: getrennt)?
4. **Korrektur/Manuell:** Sollen auch auftragsbezogene Einträge nachträglich manuell erfasst/
   korrigiert werden können (analog `CreateManualEntry`/`EditEntry`)? Falls ja: `OrderId` dort
   ebenfalls berücksichtigen.

export type Rolle = 'Admin' | 'Manager' | 'Mitarbeiter'

export interface Benutzer {
  id: string
  vorname: string
  nachname: string
  email: string
  rolle: Rolle
  abteilung?: string
}

export interface Stempelung {
  id: string
  benutzerId: string
  eingestempeltUm: string
  ausgestempeltUm?: string
  dauerMinuten?: number
}

export interface Auftrag {
  id: string
  titel: string
  beschreibung?: string
  status: 'Backlog' | 'InBearbeitung' | 'BereitFuerAbnahme' | 'Rechnungserstellung' | 'Erledigt'
  zugewiesenAn?: string
  erstelltAm: string
}

export interface Urlaubsantrag {
  id: string
  benutzerId: string
  von: string
  bis: string
  status: 'Offen' | 'Genehmigt' | 'Abgelehnt'
  kommentar?: string
}

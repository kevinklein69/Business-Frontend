// TODO: Hier werden die API-Typen eingefügt
// Empfehlung: Generiere diese automatisch aus dem OpenAPI-Schema des Backends
// z.B. mit: npx openapi-typescript http://localhost:5000/swagger/v1/swagger.json -o src/types/api.d.ts

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
}

export interface Auftrag {
  id: string
  titel: string
  beschreibung: string
  status: string
  erstelltAm: string
}

export interface Stempelung {
  id: string
  userId: string
  eingestempeltAm: string
  ausgestempeltAm: string | null
}

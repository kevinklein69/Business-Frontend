/**
 * German public holidays per Bundesland, mirroring the backend's `GermanHolidays`
 * (Business.Domain.Common.GermanHolidays). Movable feasts are derived from the
 * Easter Sunday date (Gaussian Easter algorithm), so this works for any year.
 */

export const GERMAN_STATES = [
  'BadenWuerttemberg',
  'Bayern',
  'Berlin',
  'Brandenburg',
  'Bremen',
  'Hamburg',
  'Hessen',
  'MecklenburgVorpommern',
  'Niedersachsen',
  'NordrheinWestfalen',
  'RheinlandPfalz',
  'Saarland',
  'Sachsen',
  'SachsenAnhalt',
  'SchleswigHolstein',
  'Thueringen',
] as const

export type GermanState = (typeof GERMAN_STATES)[number]

export const GERMAN_STATE_LABELS: Record<GermanState, string> = {
  BadenWuerttemberg: 'Baden-Württemberg',
  Bayern: 'Bayern',
  Berlin: 'Berlin',
  Brandenburg: 'Brandenburg',
  Bremen: 'Bremen',
  Hamburg: 'Hamburg',
  Hessen: 'Hessen',
  MecklenburgVorpommern: 'Mecklenburg-Vorpommern',
  Niedersachsen: 'Niedersachsen',
  NordrheinWestfalen: 'Nordrhein-Westfalen',
  RheinlandPfalz: 'Rheinland-Pfalz',
  Saarland: 'Saarland',
  Sachsen: 'Sachsen',
  SachsenAnhalt: 'Sachsen-Anhalt',
  SchleswigHolstein: 'Schleswig-Holstein',
  Thueringen: 'Thüringen',
}

/** Heiligabend and Silvester aren't statutory holidays, but are commonly treated as half working days. */
const HALF_DAYS: ReadonlyArray<[month: number, day: number]> = [
  [12, 24],
  [12, 31],
]

const toKey = (date: Date) => `${date.getMonth() + 1}-${date.getDate()}`

const addDays = (date: Date, days: number) => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/** Gaussian Easter algorithm — returns the date of Easter Sunday for the given year. */
function getEasterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1

  return new Date(year, month - 1, day)
}

/** Buß- und Bettag: the Wednesday immediately preceding November 23rd (always falls Nov 16-22). */
function getBussUndBettag(year: number): Date {
  const nov23 = new Date(year, 10, 23)
  let daysBack = (nov23.getDay() - 3 + 7) % 7 // 3 = Wednesday
  if (daysBack === 0) daysBack = 7
  return addDays(nov23, -daysBack)
}

export interface NamedHoliday {
  name: string
  date: Date
}

/** Returns all full-day public holidays (with their German names) for the given year and Bundesland. */
export function getHolidays(year: number, state: GermanState): NamedHoliday[] {
  const easter = getEasterSunday(year)
  const fronleichnam: NamedHoliday = { name: 'Fronleichnam', date: addDays(easter, 60) }
  const heiligeDreiKoenige: NamedHoliday = { name: 'Heilige Drei Könige', date: new Date(year, 0, 6) }
  const allerheiligen: NamedHoliday = { name: 'Allerheiligen', date: new Date(year, 10, 1) }
  const reformationstag: NamedHoliday = { name: 'Reformationstag', date: new Date(year, 9, 31) }
  const frauentag: NamedHoliday = { name: 'Internationaler Frauentag', date: new Date(year, 2, 8) }
  const mariaHimmelfahrt: NamedHoliday = { name: 'Mariä Himmelfahrt', date: new Date(year, 7, 15) }
  const ostersonntag: NamedHoliday = { name: 'Ostersonntag', date: easter }
  const pfingstsonntag: NamedHoliday = { name: 'Pfingstsonntag', date: addDays(easter, 49) }

  const holidays: NamedHoliday[] = [
    { name: 'Neujahr', date: new Date(year, 0, 1) },
    { name: 'Karfreitag', date: addDays(easter, -2) },
    { name: 'Ostermontag', date: addDays(easter, 1) },
    { name: 'Tag der Arbeit', date: new Date(year, 4, 1) },
    { name: 'Christi Himmelfahrt', date: addDays(easter, 39) },
    { name: 'Pfingstmontag', date: addDays(easter, 50) },
    { name: 'Tag der Deutschen Einheit', date: new Date(year, 9, 3) },
    { name: '1. Weihnachtsfeiertag', date: new Date(year, 11, 25) },
    { name: '2. Weihnachtsfeiertag', date: new Date(year, 11, 26) },
  ]

  switch (state) {
    case 'BadenWuerttemberg':
      holidays.push(heiligeDreiKoenige, fronleichnam, allerheiligen)
      break
    case 'Bayern':
      holidays.push(heiligeDreiKoenige, fronleichnam, mariaHimmelfahrt, allerheiligen)
      break
    case 'Berlin':
      holidays.push(frauentag)
      break
    case 'Brandenburg':
      holidays.push(ostersonntag, pfingstsonntag, reformationstag)
      break
    case 'Bremen':
    case 'Hamburg':
    case 'Niedersachsen':
    case 'SchleswigHolstein':
      holidays.push(reformationstag)
      break
    case 'Hessen':
      holidays.push(fronleichnam)
      break
    case 'MecklenburgVorpommern':
      holidays.push(frauentag, reformationstag)
      break
    case 'NordrheinWestfalen':
    case 'RheinlandPfalz':
      holidays.push(fronleichnam, allerheiligen)
      break
    case 'Saarland':
      holidays.push(fronleichnam, mariaHimmelfahrt, allerheiligen)
      break
    case 'Sachsen':
      holidays.push(reformationstag, { name: 'Buß- und Bettag', date: getBussUndBettag(year) })
      break
    case 'SachsenAnhalt':
      holidays.push(heiligeDreiKoenige, reformationstag)
      break
    case 'Thueringen':
      holidays.push({ name: 'Weltkindertag', date: new Date(year, 8, 20) }, reformationstag)
      break
  }

  return holidays.sort((a, b) => a.date.getTime() - b.date.getTime())
}

const getHolidayKeys = (year: number, state: GermanState): Set<string> =>
  new Set(getHolidays(year, state).map((h) => toKey(h.date)))

const isHalfDay = (date: Date) =>
  HALF_DAYS.some(([month, day]) => date.getMonth() + 1 === month && date.getDate() === day)

/** Returns the next public holiday on or after `from` (looks at most two years ahead). */
export function getNextHoliday(from: Date, state: GermanState): NamedHoliday | null {
  const startOfDay = new Date(from.getFullYear(), from.getMonth(), from.getDate())

  for (const year of [from.getFullYear(), from.getFullYear() + 1]) {
    const upcoming = getHolidays(year, state).find((h) => h.date >= startOfDay)
    if (upcoming) return upcoming
  }

  return null
}

/**
 * Counts working days (inclusive) between start and end: weekends and full public
 * holidays (for the given Bundesland) don't count, Heiligabend/Silvester count
 * as half days — mirrors the backend's `AbsenceRequestExtensions.CountBusinessDays`.
 */
export function countWorkingDays(start: Date, end: Date, state: GermanState): number {
  if (end < start) return 0

  let days = 0
  const holidaysByYear = new Map<number, Set<string>>()

  for (let date = new Date(start); date <= end; date = addDays(date, 1)) {
    const day = date.getDay()
    if (day === 0 || day === 6) continue // Sun/Sat

    const year = date.getFullYear()
    let holidays = holidaysByYear.get(year)
    if (!holidays) {
      holidays = getHolidayKeys(year, state)
      holidaysByYear.set(year, holidays)
    }
    if (holidays.has(toKey(date))) continue

    days += isHalfDay(date) ? 0.5 : 1
  }

  return days
}

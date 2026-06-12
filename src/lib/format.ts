export function formatDiff(diff: number) {
  const abs = Math.abs(diff)
  const h   = Math.floor(abs / 60)
  const m   = String(abs % 60).padStart(2, '0')
  return `${diff >= 0 ? '+' : '-'}${h}:${m}h`
}

export function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = String(minutes % 60).padStart(2, '0')
  return `${h}:${m}`
}

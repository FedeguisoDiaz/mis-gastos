export const gs = (n: number) => '₲ ' + Math.round(n).toLocaleString('es-PY')

export const gsShort = (n: number) => {
  const a = Math.abs(n)
  if (a >= 1_000_000) return '₲ ' + (n / 1_000_000).toLocaleString('es-PY', { maximumFractionDigits: 1 }) + 'M'
  if (a >= 1_000) return '₲ ' + Math.round(n / 1_000).toLocaleString('es-PY') + 'k'
  return gs(n)
}

export const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const shiftISO = (iso: string, days: number) => {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function dayLabel(iso: string) {
  const t = todayISO()
  if (iso === t) return 'Hoy'
  if (iso === shiftISO(t, -1)) return 'Ayer'
  const d = new Date(iso + 'T12:00:00')
  const s = d.toLocaleDateString('es-PY', { weekday: 'long', day: 'numeric', month: 'long' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function monthRange(year: number, month: number) {
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const last = new Date(year, month + 1, 0).getDate()
  const to = `${year}-${String(month + 1).padStart(2, '0')}-${last}`
  return { from, to }
}

/** Convierte "150.000" o "150000" a número */
export const parseGs = (s: string) => Number(s.replace(/\D/g, '')) || 0

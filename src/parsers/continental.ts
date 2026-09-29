// Lector de extractos PDF de Banco Continental (Paraguay).
// Recibe las líneas de texto del PDF y devuelve los movimientos normalizados.

export type ParsedKind =
  | 'compra' // Mov.POS
  | 'cajero' // Mov.ATM -> pasa a efectivo
  | 'transf_salida' // TRANS.INTERB.WEB (sin detalle)
  | 'transf_entrada' // TRF.INTRBN.SIP
  | 'acreditacion' // PS.Id (sueldo, bonos)
  | 'con_concepto' // "concepto | cuenta"
  | 'otro'

export interface ParsedMovement {
  bankRef: string
  date: string // YYYY-MM-DD
  time: string // HH:MM:SS
  amount: number // siempre positivo
  direction: 'out' | 'in'
  kind: ParsedKind
  description: string // texto limpio para mostrar
  matchKey: string // texto para reglas de categorías (MAYÚSCULAS)
  raw: string
  taxIncluded?: number // IVA de compras en el exterior sumado a la compra
}

export interface ParsedStatement {
  bank: 'continental'
  periodFrom: string | null
  periodTo: string | null
  openingBalance: number | null
  closingBalance: number | null
  movements: ParsedMovement[]
  warnings: string[]
}

const num = (s: string) => Number(s.replace(/\./g, '').replace(',', '.'))

const LINE_RE =
  /^(\d{2})\s+(\d{2}:\d{2}:\d{2})\s+(\d+)\s+(\d+)\s+(\S+)\s+(.+?)\s+([\d.]+(?:,\d+)?)\s+([\d.]+(?:,\d+)?)$/

function titleCase(s: string) {
  return s
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(^|[\s(/-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase())
}

function classify(desc: string): { kind: ParsedKind; description: string; matchKey: string } {
  const d = desc.trim()
  let m: RegExpMatchArray | null

  if ((m = d.match(/^Mov\.POS\.:\s*(.+)$/i))) {
    const merchant = m[1]
      .replace(/-\d*$/, '') // referencia del POS
      .replace(/\s+\d{6,}$/, '') // códigos largos (ej. STEAMGAMES.COM 4259522985)
      .replace(/\*\s*[A-Z0-9]{4,8}$/, '') // códigos tipo NAME-CHEAP.COM* VZ0KZL
      .trim()
    return { kind: 'compra', description: titleCase(merchant), matchKey: merchant.toUpperCase() }
  }
  if (/^Mov\.ATM\./i.test(d)) {
    return { kind: 'cajero', description: 'Extracción en cajero', matchKey: 'CAJERO' }
  }
  if (/^TRANS\.INTERB\.WEB/i.test(d)) {
    return { kind: 'transf_salida', description: 'Transferencia a otro banco', matchKey: '' }
  }
  if (/^TRF\.INTRBN\.SIP/i.test(d)) {
    return { kind: 'transf_entrada', description: 'Transferencia recibida', matchKey: '' }
  }
  if ((m = d.match(/^PS\.Id:\s*\d+,\s*(.+)$/i))) {
    return { kind: 'acreditacion', description: titleCase(m[1]), matchKey: m[1].toUpperCase() }
  }
  if (/^PAGO\.QRHUB/i.test(d)) {
    return { kind: 'otro', description: 'Pago con QR', matchKey: 'PAGO QR' }
  }
  if ((m = d.match(/^(.*?)\s*\|\s*\d+$/))) {
    let concept = m[1].trim()
    const service = concept.match(/^([A-Za-z ]+)-\d+$/) // ej. CLARO-231453129
    if (service) concept = service[1]
    const clean = concept.replace(/[^\p{L}\p{N} ]/gu, '').trim()
    return {
      kind: 'con_concepto',
      description: clean ? titleCase(clean) : 'Transferencia',
      matchKey: clean.toUpperCase(),
    }
  }
  return { kind: 'otro', description: titleCase(d.replace(/-\d+$/, '')), matchKey: d.toUpperCase() }
}

const INCOMING_HINT = /^(TRF\.INTRBN\.SIP|PS\.Id|DEP|DEPOSITO|CRED)/i

export function parseContinentalLines(lines: string[]): ParsedStatement {
  const text = lines.join('\n')
  const warnings: string[] = []

  const period = text.match(/Desde el\s+(\d{2})\/(\d{2})\/(\d{4}).*?hasta el\s+(\d{2})\/(\d{2})\/(\d{4})/s)
  const periodFrom = period ? `${period[3]}-${period[2]}-${period[1]}` : null
  const periodTo = period ? `${period[6]}-${period[5]}-${period[4]}` : null
  const opening = text.match(/Saldo Anterior\s+([\d.]+(?:,\d+)?)/)
  const openingBalance = opening ? num(opening[1]) : null

  let year = period ? Number(period[3]) : new Date().getFullYear()
  let month = period ? Number(period[2]) : new Date().getMonth() + 1
  let lastDay = 0
  let prevBalance = openingBalance

  const raw: ParsedMovement[] = []
  for (const line0 of lines) {
    const line = line0.replace(/\s+/g, ' ').trim()
    const m = line.match(LINE_RE)
    if (!m) continue
    const [, dd, time, , ref, , desc, amountS, balanceS] = m
    const day = Number(dd)
    if (day < lastDay) {
      month++
      if (month > 12) {
        month = 1
        year++
      }
    }
    lastDay = day
    const amount = num(amountS)
    const balance = num(balanceS)

    let direction: 'out' | 'in'
    if (prevBalance != null && Math.abs(Math.abs(balance - prevBalance) - amount) < 1) {
      direction = balance < prevBalance ? 'out' : 'in'
    } else {
      direction = INCOMING_HINT.test(desc) ? 'in' : 'out'
      if (prevBalance != null) warnings.push(`No pude verificar el saldo en: ${desc}`)
    }
    prevBalance = balance

    const c = classify(desc)
    raw.push({
      bankRef: `${year}${String(month).padStart(2, '0')}${dd}-${time}-${ref}-${amount}`,
      date: `${year}-${String(month).padStart(2, '0')}-${dd}`,
      time,
      amount,
      direction,
      raw: desc,
      ...c,
    })
  }

  // IVA de compras en el exterior (IVALEY...): se suma a la compra con la misma referencia.
  const movements: ParsedMovement[] = []
  const taxes: ParsedMovement[] = []
  for (const mv of raw) (/^IVALEY/i.test(mv.raw) ? taxes : movements).push(mv)
  for (const t of taxes) {
    const refNum = t.raw.match(/(\d{6,})$/)?.[1]
    const target = movements.find(
      (mv) => mv.kind === 'compra' && mv.date === t.date && mv.time === t.time && (!refNum || mv.raw.includes(refNum.slice(0, 6))),
    ) ?? movements.find((mv) => mv.kind === 'compra' && mv.date === t.date && mv.time === t.time)
    if (target) {
      target.amount += t.amount
      target.taxIncluded = (target.taxIncluded ?? 0) + t.amount
    } else {
      movements.push({ ...t, description: 'IVA compra exterior', matchKey: 'IVA' })
    }
  }

  if (raw.length === 0) warnings.push('No encontré movimientos. ¿Es un extracto de Banco Continental?')

  return {
    bank: 'continental',
    periodFrom,
    periodTo,
    openingBalance,
    closingBalance: prevBalance,
    movements,
    warnings,
  }
}

// Extrae líneas de texto de un PDF agrupando por coordenada vertical.
export async function pdfToLines(data: ArrayBuffer): Promise<string[]> {
  const pdfjs = await import('pdfjs-dist')
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  const doc = await pdfjs.getDocument({ data }).promise
  const out: string[] = []
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const content = await page.getTextContent()
    const rows = new Map<number, { x: number; s: string }[]>()
    for (const it of content.items as { str: string; transform: number[] }[]) {
      if (!it.str?.trim()) continue
      const y = Math.round(it.transform[5] / 2) * 2
      const key = [...rows.keys()].find((k) => Math.abs(k - y) <= 2) ?? y
      if (!rows.has(key)) rows.set(key, [])
      rows.get(key)!.push({ x: it.transform[4], s: it.str })
    }
    const ys = [...rows.keys()].sort((a, b) => b - a)
    for (const y of ys) out.push(rows.get(y)!.sort((a, b) => a.x - b.x).map((r) => r.s).join(' '))
  }
  return out
}

export async function parseContinentalPdf(file: File): Promise<ParsedStatement> {
  const lines = await pdfToLines(await file.arrayBuffer())
  return parseContinentalLines(lines)
}

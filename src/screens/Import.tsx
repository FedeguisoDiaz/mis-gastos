import { AnimatePresence, motion } from 'framer-motion'
import { Check, FileText, Loader2, UploadCloud } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { BlobButton, CategoryGrid, Pill, ScreenHeader, Sheet, Title } from '../components/ui'
import { dayLabel, gs } from '../lib/format'
import { Icon, IconBubble } from '../lib/icons'
import { matchRule, useStore } from '../lib/store'
import { supabase } from '../lib/supabase'
import type { TxType } from '../lib/types'
import type { ParsedMovement, ParsedStatement } from '../parsers/continental'

interface Row {
  key: string
  mv: ParsedMovement
  type: TxType
  categoryId: string | null
  toAccountId: string | null
  description: string
  include: boolean
  duplicate: boolean
  touched: boolean
}

export default function Import({ onDone }: { onDone: () => void }) {
  const { accounts, categories, rules, catById, accById, refresh, setMonth } = useStore()
  const [accountId, setAccountId] = useState<string | null>(accounts.find((a) => a.kind === 'banco')?.id ?? null)
  const [statement, setStatement] = useState<ParsedStatement | null>(null)
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [busy, setBusy] = useState<'parse' | 'save' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Row | null>(null)
  const [done, setDone] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const cashId = accounts.find((a) => a.kind === 'efectivo')?.id ?? null

  async function handleFile(file: File) {
    setError(null)
    setBusy('parse')
    setFileName(file.name)
    try {
      const { parseContinentalPdf } = await import('../parsers/continental')
      const st = await parseContinentalPdf(file)
      if (!st.movements.length) throw new Error(st.warnings[0] ?? 'No encontré movimientos en el archivo.')
      const refs = st.movements.map((m) => m.bankRef)
      const { data: existing } = await supabase.from('transactions').select('bank_ref').in('bank_ref', refs)
      const dup = new Set((existing ?? []).map((e) => e.bank_ref))
      setRows(
        st.movements.map((mv) => {
          const isCash = mv.kind === 'cajero'
          const type: TxType = isCash ? 'transferencia' : mv.direction === 'in' ? 'ingreso' : 'gasto'
          return {
            key: mv.bankRef,
            mv,
            type,
            categoryId: isCash ? null : matchRule(rules, mv.matchKey),
            toAccountId: isCash ? cashId : null,
            description: mv.description,
            include: !dup.has(mv.bankRef),
            duplicate: dup.has(mv.bankRef),
            touched: false,
          }
        }),
      )
      setStatement(st)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pude leer el archivo.')
    } finally {
      setBusy(null)
    }
  }

  const update = (key: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch, touched: true } : r)))

  const pending = rows.filter((r) => r.include && r.type === 'gasto' && !r.categoryId)
  const ready = rows.filter((r) => r.include && !(r.type === 'gasto' && !r.categoryId))
  const skipped = rows.filter((r) => !r.include)
  const totals = useMemo(() => {
    let out = 0
    let inc = 0
    for (const r of rows) if (r.include) r.type === 'gasto' ? (out += r.mv.amount) : r.type === 'ingreso' && (inc += r.mv.amount)
    return { out, inc }
  }, [rows])

  async function save() {
    if (!statement) return
    setBusy('save')
    setError(null)
    const chosen = rows.filter((r) => r.include)
    const { data: imp, error: e1 } = await supabase
      .from('imports')
      .insert({
        account_id: accountId,
        filename: fileName,
        bank: 'continental',
        period_from: statement.periodFrom,
        period_to: statement.periodTo,
        tx_count: chosen.length,
      })
      .select('id')
      .single()
    if (e1 || !imp) {
      setBusy(null)
      return setError(e1?.message ?? 'Error al guardar')
    }
    const { error: e2 } = await supabase.from('transactions').insert(
      chosen.map((r) => ({
        date: r.mv.date,
        time: r.mv.time,
        amount: r.mv.amount,
        type: r.type,
        category_id: r.type === 'transferencia' ? null : r.categoryId,
        account_id: accountId,
        transfer_account_id: r.type === 'transferencia' ? r.toAccountId : null,
        description: r.description,
        raw_description: r.mv.raw,
        source: 'extracto' as const,
        bank_ref: r.mv.bankRef,
        import_id: imp.id,
      })),
    )
    if (e2) {
      await supabase.from('imports').delete().eq('id', imp.id)
      setBusy(null)
      return setError(e2.message)
    }
    // Aprender: si corregiste la categoría de un comercio, se recuerda para la próxima
    const learned = new Map<string, string>()
    for (const r of chosen)
      if (r.touched && r.categoryId && r.mv.matchKey && r.type !== 'transferencia' && matchRule(rules, r.mv.matchKey) !== r.categoryId)
        learned.set(r.mv.matchKey, r.categoryId)
    if (learned.size)
      await supabase
        .from('category_rules')
        .upsert([...learned].map(([pattern, category_id]) => ({ pattern, category_id })), { onConflict: 'user_id,pattern' })

    const [y, m] = (statement.periodFrom ?? chosen[0].mv.date).split('-').map(Number)
    setMonth(y, m - 1)
    await refresh()
    setBusy(null)
    setDone(chosen.length)
  }

  if (done != null)
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="glass mt-16 rounded-[36px] p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ink text-cream">
          <Check size={30} />
        </div>
        <h2 className="text-3xl font-light">¡Listo!</h2>
        <p className="mt-2 text-ink-soft">Importaste {done} movimientos.</p>
        <div className="mt-6">
          <BlobButton full onClick={onDone}>Ver mi mes</BlobButton>
        </div>
      </motion.div>
    )

  return (
    <div className="space-y-4">
      <ScreenHeader title="Importar extracto" onBack={onDone} />
      <div className="px-1 pt-3">
        <Title top="Subí tu" bottom="extracto" size="xl" />
        <p className="mt-3 text-sm text-ink-soft">El PDF de “Movimientos de Cuenta”. Revisás todo antes de guardar.</p>
      </div>

      {!statement && (
        <>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {accounts
              .filter((a) => a.kind !== 'efectivo')
              .map((a) => (
                <Pill key={a.id} active={accountId === a.id} color={a.color} onClick={() => setAccountId(a.id)}>
                  <Icon name={a.icon} size={15} /> {a.name}
                </Pill>
              ))}
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const f = e.dataTransfer.files[0]
              if (f) handleFile(f)
            }}
            className="paper relative flex w-full flex-col items-center gap-3 overflow-hidden rounded-[36px] border border-dashed border-ink/20 px-6 py-14"
          >
            <div className="glow" style={{ width: 160, height: 160, left: '50%', top: '10%', marginLeft: -80, opacity: 0.45 }} />
            {busy === 'parse' ? <Loader2 className="relative animate-spin text-ink" size={34} strokeWidth={1.5} /> : <UploadCloud className="relative text-ink" size={34} strokeWidth={1.5} />}
            <span className="relative text-lg font-light">{busy === 'parse' ? 'Leyendo el extracto…' : 'Tocá para elegir el PDF'}</span>
            <span className="relative text-xs text-muted">Banco Continental · “Movimientos de Cuenta”</span>
          </motion.button>
          <input ref={inputRef} type="file" accept="application/pdf" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {error && <p className="text-center text-sm text-warm-alert">{error}</p>}
        </>
      )}

      {statement && (
        <>
          <section className="card-dark relative overflow-hidden rounded-[36px] p-6">
            <div className="glow" style={{ width: 180, height: 180, right: -60, top: -70, opacity: 0.5 }} />
            <div className="flex items-center gap-2 text-sm text-white/60">
              <FileText size={16} /> {accById(accountId)?.name} · {statement.periodFrom?.split('-').reverse().join('/')} al{' '}
              {statement.periodTo?.split('-').reverse().join('/')}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-white/50">Gastos</p>
                <p className="num relative text-2xl font-light">{gs(totals.out)}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Ingresos</p>
                <p className="num relative text-2xl font-light">{gs(totals.inc)}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-white/50">
              {rows.length} movimientos leídos{skipped.length ? ` · ${skipped.length} no se importan` : ''}
            </p>
          </section>

          {pending.length > 0 && (
            Group({
              title: `Para revisar · ${pending.length}`,
              hint: 'El banco no dice qué fueron. Tocá cada uno para elegir la categoría (o marcalo como ahorro).',
              rows: pending,
              accent: true,
            })
          )}
          {Group({ title: `Listos · ${ready.length}`, rows: ready })}
          {skipped.length > 0 && Group({ title: `No se importan · ${skipped.length}`, rows: skipped, muted: true })}

          {error && <p className="text-center text-sm text-warm-alert">{error}</p>}
          <div className="sticky bottom-24 z-10 space-y-2">
            <BlobButton full onClick={save} disabled={busy === 'save' || rows.every((r) => !r.include)}>
              {busy === 'save' ? 'Guardando…' : `Importar ${rows.filter((r) => r.include).length} movimientos`}
            </BlobButton>
          </div>
          <button onClick={() => setStatement(null)} className="w-full text-center text-sm text-muted">
            Elegir otro archivo
          </button>
        </>
      )}

      {RowSheet()}
    </div>
  )

  function Group({ title, hint, rows, accent, muted }: { title: string; hint?: string; rows: Row[]; accent?: boolean; muted?: boolean }) {
    return (
      <section className={`glass rounded-[32px] p-3 ${accent ? 'ring-1 ring-accent/40' : ''} ${muted ? 'opacity-60' : ''}`}>
        <h3 className={`px-2 pt-1 text-lg font-light ${accent ? 'text-accent' : 'text-ink'}`}>{title}</h3>
        {hint && <p className="px-2 pb-1 text-xs text-muted">{hint}</p>}
        <AnimatePresence initial={false}>
          {rows.map((r) => {
            const c = catById(r.categoryId)
            const isT = r.type === 'transferencia'
            return (
              <motion.button
                layout
                key={r.key}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditing(r)}
                className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-white/50"
              >
                <IconBubble icon={isT ? 'transfer' : c?.icon ?? 'sparkles'} color={isT ? '#8a8178' : c?.color ?? '#BDB3A6'} size={38} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{r.description}</div>
                  <div className="truncate text-xs text-muted">
                    {dayLabel(r.mv.date)} · {isT ? `→ ${accById(r.toAccountId)?.name ?? '?'}` : c?.name ?? (r.type === 'ingreso' ? 'Ingreso' : 'Elegir categoría')}
                    {r.duplicate && ' · ya importado'}
                    {r.mv.taxIncluded ? ` · incluye IVA ${gs(r.mv.taxIncluded)}` : ''}
                  </div>
                </div>
                <span className={`num text-sm ${r.type === 'ingreso' ? 'text-calm' : ''}`}>
                  {r.type === 'ingreso' ? '+' : r.type === 'gasto' ? '−' : ''}
                  {gs(r.mv.amount)}
                </span>
              </motion.button>
            )
          })}
        </AnimatePresence>
      </section>
    )
  }

  function RowSheet() {
    const r = editing ? rows.find((x) => x.key === editing.key) ?? null : null
    const set = (patch: Partial<Row>, close = false) => {
      if (!r) return
      update(r.key, patch)
      if (close) setEditing(null)
    }
    const cats = categories.filter((c) => !c.archived && c.kind === (r?.type === 'ingreso' ? 'ingreso' : 'gasto'))
    return (
      <Sheet open={!!r} onClose={() => setEditing(null)} title={r ? gs(r.mv.amount) : ''}>
        {r && (
          <div className="space-y-4">
            <p className="rounded-2xl bg-sand/60 px-3 py-2 font-mono text-[11px] text-ink-soft">{r.mv.raw}</p>
            <input
              value={r.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="¿Qué fue? (ej. almuerzo, pasaje…)"
              className="w-full rounded-full bg-white/60 px-5 py-3.5 outline-none"
            />
            {r.mv.direction === 'out' && (
              <div className="no-scrollbar flex gap-2 overflow-x-auto">
                <Pill active={r.type === 'gasto'} onClick={() => set({ type: 'gasto', toAccountId: null })}>
                  Es un gasto
                </Pill>
                {accounts
                  .filter((a) => a.id !== accountId)
                  .map((a) => (
                    <Pill key={a.id} active={r.type === 'transferencia' && r.toAccountId === a.id} color={a.color} onClick={() => set({ type: 'transferencia', toAccountId: a.id, categoryId: null }, true)}>
                      <Icon name={a.icon} size={15} /> Pasé a {a.name}
                    </Pill>
                  ))}
              </div>
            )}
            {r.type !== 'transferencia' && <CategoryGrid categories={cats} value={r.categoryId} onChange={(id) => set({ categoryId: id }, true)} />}
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={r.include} onChange={(e) => set({ include: e.target.checked })} className="accent-[#f07a2e]" />
              Importar este movimiento {r.duplicate && '(ya estaba importado)'}
            </label>
          </div>
        )}
      </Sheet>
    )
  }
}

import { useEffect, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { CategoryGrid, Pill, BlobButton, Sheet } from '../components/ui'
import { gs, parseGs, shiftISO, todayISO } from '../lib/format'
import { Icon } from '../lib/icons'
import { useStore } from '../lib/store'
import { supabase } from '../lib/supabase'
import type { Transaction, TxType } from '../lib/types'

export default function TransactionForm({ open, onClose, editing, initialType = 'gasto' }: { open: boolean; onClose: () => void; editing: Transaction | null; initialType?: TxType }) {
  const { categories, accounts, addTransaction, updateTransaction, deleteTransaction, refresh } = useStore()
  const [type, setType] = useState<TxType>('gasto')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [toAccountId, setToAccountId] = useState<string | null>(null)
  const [date, setDate] = useState(todayISO())
  const [description, setDescription] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const amountRef = useRef<HTMLInputElement>(null)

  const defaultAccount = accounts.find((a) => a.kind === 'banco')?.id ?? accounts[0]?.id ?? null

  useEffect(() => {
    if (!open) return
    setError(null)
    if (editing) {
      setType(editing.type)
      setAmount(editing.amount.toLocaleString('es-PY'))
      setCategoryId(editing.category_id)
      setAccountId(editing.account_id)
      setToAccountId(editing.transfer_account_id)
      setDate(editing.date)
      setDescription(editing.description)
    } else {
      setType(initialType)
      setAmount('')
      setCategoryId(null)
      setAccountId(defaultAccount)
      setToAccountId(accounts.find((a) => a.kind === 'billetera')?.id ?? null)
      setDate(todayISO())
      setDescription('')
      setTimeout(() => amountRef.current?.focus(), 250)
    }
  }, [open, editing]) // eslint-disable-line react-hooks/exhaustive-deps

  const cats = categories.filter((c) => !c.archived && c.kind === (type === 'ingreso' ? 'ingreso' : 'gasto'))
  const value = parseGs(amount)
  const catChanged = editing && editing.source === 'extracto' && categoryId && categoryId !== editing.category_id

  async function save() {
    if (!value) return setError('Poné un monto.')
    if (type === 'transferencia' && (!accountId || !toAccountId || accountId === toAccountId)) return setError('Elegí dos cuentas distintas.')
    setBusy(true)
    const payload = {
      type,
      amount: value,
      category_id: type === 'transferencia' ? null : categoryId,
      account_id: accountId,
      transfer_account_id: type === 'transferencia' ? toAccountId : null,
      date,
      description: description.trim(),
    }
    const err = editing ? await updateTransaction(editing.id, payload) : await addTransaction({ ...payload, source: 'manual' })
    if (!err && catChanged && remember && editing.description && type !== 'transferencia') {
      await supabase.from('category_rules').upsert({ pattern: editing.description.toUpperCase(), category_id: categoryId }, { onConflict: 'user_id,pattern' })
      await refresh()
    }
    setBusy(false)
    if (err) setError(err)
    else onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={editing ? 'Editar movimiento' : 'Nuevo movimiento'}>
      <div className="space-y-5">
        <div className="flex rounded-full bg-white/50 p-1">
          {(['gasto', 'ingreso', 'transferencia'] as TxType[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setType(t)
                setCategoryId(null)
              }}
              className={`flex-1 rounded-full py-2 text-sm capitalize transition-all ${type === t ? 'bg-ink text-cream shadow' : 'text-ink-soft'}`}
            >
              {t === 'transferencia' ? 'Transferir' : t}
            </button>
          ))}
        </div>

        <div className="text-center">
          <div className="flex items-baseline justify-center gap-2">
            <span className="num text-3xl font-light text-muted">₲</span>
            <input
              ref={amountRef}
              inputMode="numeric"
                onFocus={(e) => e.currentTarget.select()}
              placeholder="0"
              value={amount}
              onChange={(e) => {
                const n = parseGs(e.target.value)
                setAmount(n ? n.toLocaleString('es-PY') : '')
              }}
              className="num w-full max-w-[260px] bg-transparent text-center text-[52px] font-light outline-none placeholder:text-ink/20"
            />
          </div>
          <div className="mt-3 flex justify-center gap-2">
            {[10000, 20000, 50000, 100000].map((q) => (
              <button key={q} onClick={() => setAmount((value + q).toLocaleString('es-PY'))} className="rounded-full border border-ink/15 bg-white/40 px-3 py-1 text-xs text-ink-soft">
                +{q / 1000}k
              </button>
            ))}
          </div>
        </div>

        {type !== 'transferencia' ? (
          <CategoryGrid categories={cats} value={categoryId} onChange={setCategoryId} />
        ) : (
          <div className="space-y-3">
            <AccountRow label="Desde" value={accountId} onChange={setAccountId} />
            <AccountRow label="Hacia" value={toAccountId} onChange={setToAccountId} />
          </div>
        )}

        {catChanged && (
          <label className="flex items-center gap-2 rounded-3xl bg-accent-soft/50 px-4 py-2.5 text-sm">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-[#f07a2e]" />
            Usar esta categoría siempre para “{editing!.description}”
          </label>
        )}

        <input
          placeholder="Descripción (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-full bg-white/60 px-5 py-3.5 outline-none"
        />

        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          <Pill active={date === todayISO()} onClick={() => setDate(todayISO())}>Hoy</Pill>
          <Pill active={date === shiftISO(todayISO(), -1)} onClick={() => setDate(shiftISO(todayISO(), -1))}>Ayer</Pill>
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="rounded-full border border-ink/15 bg-white/40 px-4 py-2 text-sm text-ink-soft" />
        </div>

        {type !== 'transferencia' && <AccountRow label="Cuenta" value={accountId} onChange={setAccountId} />}

        {error && <p className="text-center text-sm text-warm-alert">{error}</p>}

        <BlobButton full onClick={save} disabled={busy}>
          {busy ? 'Guardando…' : editing ? 'Guardar cambios' : value ? `Guardar ${gs(value)}` : 'Guardar'}
        </BlobButton>

        {editing && (
          <button
            onClick={async () => {
              if (!confirm('¿Borrar este movimiento?')) return
              await deleteTransaction(editing.id)
              onClose()
            }}
            className="mx-auto flex items-center gap-1.5 text-sm text-muted"
          >
            <Trash2 size={15} /> Borrar movimiento
          </button>
        )}
      </div>
    </Sheet>
  )

  function AccountRow({ label, value, onChange }: { label: string; value: string | null; onChange: (id: string) => void }) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-14 shrink-0 text-xs text-muted">{label}</span>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {accounts.map((a) => (
            <Pill key={a.id} active={value === a.id} color={a.color} onClick={() => onChange(a.id)}>
              <Icon name={a.icon} size={15} /> {a.name}
            </Pill>
          ))}
        </div>
      </div>
    )
  }
}

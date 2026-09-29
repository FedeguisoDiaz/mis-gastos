import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Empty, Field, MonthPicker, Pill, TxRow } from '../components/ui'
import { dayLabel, gs } from '../lib/format'
import { useStore } from '../lib/store'
import type { Transaction, TxType } from '../lib/types'

export default function Transactions({ onEdit }: { onEdit: (t: Transaction) => void }) {
  const { transactions, categories, catById } = useStore()
  const [type, setType] = useState<TxType | 'todos' | 'revisar'>('todos')
  const [cat, setCat] = useState<string | null>(null)
  const [q, setQ] = useState('')

  const filtered = useMemo(
    () =>
      transactions.filter(
        (t) =>
          (type === 'todos' || (type === 'revisar' ? t.type === 'gasto' && !t.category_id : t.type === type)) &&
          (!cat || t.category_id === cat) &&
          (!q || `${t.description} ${t.raw_description ?? ''} ${catById(t.category_id)?.name ?? ''}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [transactions, type, cat, q, catById],
  )

  const groups = useMemo(() => {
    const m = new Map<string, Transaction[]>()
    for (const t of filtered) {
      if (!m.has(t.date)) m.set(t.date, [])
      m.get(t.date)!.push(t)
    }
    return [...m.entries()]
  }, [filtered])

  const pending = transactions.filter((t) => t.type === 'gasto' && !t.category_id).length
  const usedCats = categories.filter((c) => transactions.some((t) => t.category_id === c.id))

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between pt-2">
        <span className="text-[15px] font-medium">Movimientos</span>
        <MonthPicker />
      </header>

      <Field icon={<Search size={17} strokeWidth={1.6} />} placeholder="Buscar movimientos" value={q} onChange={(e) => setQ(e.target.value)} />

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        <Pill active={type === 'todos'} onClick={() => setType('todos')}>Todos</Pill>
        <Pill active={type === 'gasto'} onClick={() => setType('gasto')}>Gastos</Pill>
        <Pill active={type === 'ingreso'} onClick={() => setType('ingreso')}>Ingresos</Pill>
        <Pill active={type === 'transferencia'} onClick={() => setType('transferencia')}>Transferencias</Pill>
        {pending > 0 && (
          <Pill active={type === 'revisar'} onClick={() => setType('revisar')} color="#f07a2e">
            Para revisar · {pending}
          </Pill>
        )}
      </div>
      {usedCats.length > 1 && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {usedCats.map((c) => (
            <Pill key={c.id} active={cat === c.id} color={c.color} onClick={() => setCat(cat === c.id ? null : c.id)}>
              {c.name}
            </Pill>
          ))}
        </div>
      )}

      {groups.length === 0 && <Empty>No hay movimientos para mostrar.</Empty>}

      {groups.map(([date, items], i) => {
        const out = items.filter((t) => t.type === 'gasto').reduce((a, t) => a + t.amount, 0)
        return (
          <motion.section
            key={date}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 8) * 0.03 }}
            className="glass rounded-[32px] p-3"
          >
            <div className="flex items-baseline justify-between px-2 pt-1 pb-1">
              <h3 className="text-sm text-ink-soft">{dayLabel(date)}</h3>
              {out > 0 && <span className="num text-xs text-muted">−{gs(out)}</span>}
            </div>
            {items.map((t) => (
              <TxRow key={t.id} t={t} onClick={() => onEdit(t)} />
            ))}
          </motion.section>
        )
      })}
    </div>
  )
}

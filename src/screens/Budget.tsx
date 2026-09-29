import { motion } from 'framer-motion'
import { useState } from 'react'
import { BlobButton, MonthPicker, ProgressBar, Sheet, Title, fadeIn } from '../components/ui'
import { gs, parseGs } from '../lib/format'
import { IconBubble } from '../lib/icons'
import { useMonthStats, useStore } from '../lib/store'
import type { Category } from '../lib/types'

export default function Budget() {
  const { categories, saveCategory } = useStore()
  const s = useMonthStats()
  const [editing, setEditing] = useState<Category | null>(null)
  const [text, setText] = useState('')

  const cats = categories.filter((c) => !c.archived && c.kind === 'gasto')
  const spentBy = new Map(s.breakdown.map((b) => [b.id, b.total]))
  const planned = cats.filter((c) => c.budget)
  const plan = planned.reduce((a, c) => a + (c.budget ?? 0), 0)
  const spentPlanned = planned.reduce((a, c) => a + (spentBy.get(c.id) ?? 0), 0)
  const ratio = plan ? spentPlanned / plan : 0

  const open = (c: Category) => {
    setEditing(c)
    setText(c.budget ? c.budget.toLocaleString('es-PY') : '')
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between pt-2">
        <span className="text-[15px] font-medium">Presupuesto</span>
        <MonthPicker />
      </header>

      <motion.div {...fadeIn(0)} className="px-1 pt-3">
        <Title top="Tu plan" bottom="del mes" size="xl" />
      </motion.div>

      <motion.section {...fadeIn(1)} className="paper relative overflow-hidden rounded-[36px] p-3">
        <div className="relative overflow-hidden rounded-[28px] bg-[#f1ece6] px-5 py-5">
          <div className="glow" style={{ width: 190, height: 190, right: -50, top: -70, opacity: 0.5 }} />
          <div className="relative flex items-end justify-between">
            <div>
              <p className="text-sm text-ink-soft">Plan mensual</p>
              <p className="num text-[34px] leading-tight font-light whitespace-nowrap">{gs(plan)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-ink-soft">Usado</p>
              <p className="num text-lg whitespace-nowrap">{gs(spentPlanned)}</p>
            </div>
          </div>
          <div className="relative mt-4">
            <ProgressBar value={ratio} over={ratio > 1} />
            <p className="mt-2 text-xs text-ink-soft">
              {plan === 0
                ? 'Poné un plan a las categorías que quieras cuidar. Tocá cualquiera de abajo.'
                : ratio > 1
                  ? 'Este mes el plan quedó corto. Buen momento para revisar qué pasó.'
                  : `Vas ${Math.round(ratio * 100)}% del plan · quedan ${gs(plan - spentPlanned)}`}
            </p>
          </div>
        </div>
      </motion.section>

      <motion.section {...fadeIn(2)} className="glass rounded-[32px] p-4">
        <h2 className="px-2 pb-2 text-lg font-light">Categorías</h2>
        {cats.map((c) => {
          const spent = spentBy.get(c.id) ?? 0
          const over = !!c.budget && spent > c.budget
          return (
            <button key={c.id} onClick={() => open(c)} className={`flex w-full items-center gap-3 rounded-3xl px-2 py-2.5 text-left hover:bg-white/40 ${over ? 'bg-accent-soft/45' : ''}`}>
              <IconBubble icon={c.icon} color={c.color} size={38} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[15px] font-medium">{c.name}</span>
                  <span className="num text-[15px]">{gs(spent)}</span>
                </div>
                {c.budget ? (
                  <div className="mt-1.5 space-y-1">
                    <ProgressBar value={spent / c.budget} color={c.color} over={over} />
                    <div className="flex justify-between text-xs text-muted">
                      <span>plan {gs(c.budget)}</span>
                      <span className={over ? 'text-warm-alert' : ''}>{Math.round((spent / c.budget) * 100)}%</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted">Sin plan · tocá para ponerle uno</p>
                )}
              </div>
            </button>
          )
        })}
      </motion.section>

      <Sheet open={!!editing} onClose={() => setEditing(null)} title={editing?.name}>
        {editing && (
          <div className="space-y-5">
            <p className="text-sm text-ink-soft">¿Cuánto querés destinar por mes a esta categoría? Si te acercás al monto, se marca en naranja.</p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-3xl font-light text-muted">₲</span>
              <input
                autoFocus
                inputMode="numeric"
                onFocus={(e) => e.currentTarget.select()}
                placeholder="0"
                value={text}
                onChange={(e) => {
                  const n = parseGs(e.target.value)
                  setText(n ? n.toLocaleString('es-PY') : '')
                }}
                className="num w-full max-w-[240px] bg-transparent text-center text-5xl font-light outline-none placeholder:text-ink/20"
              />
            </div>
            <BlobButton
              full
              onClick={async () => {
                await saveCategory({ id: editing.id, name: editing.name, budget: parseGs(text) || null })
                setEditing(null)
              }}
            >
              Guardar plan
            </BlobButton>
            {editing.budget && (
              <button
                onClick={async () => {
                  await saveCategory({ id: editing.id, name: editing.name, budget: null })
                  setEditing(null)
                }}
                className="w-full text-center text-sm text-muted"
              >
                Quitar plan
              </button>
            )}
          </div>
        )}
      </Sheet>
    </div>
  )
}

import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { BlobButton, Empty, ProgressBar, Sheet, Title, fadeIn } from '../components/ui'
import { gs, parseGs } from '../lib/format'
import { ICON_KEYS, Icon, IconBubble, PALETTE } from '../lib/icons'
import { useStore } from '../lib/store'
import type { Goal } from '../lib/types'

type Draft = { id?: string; name: string; target: string; icon: string; color: string }

export default function Goals() {
  const { goals, saveGoal, deleteGoal } = useStore()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [adding, setAdding] = useState<Goal | null>(null)
  const [amount, setAmount] = useState('')
  const [err, setErr] = useState<string | null>(null)

  const totalSaved = goals.reduce((a, g) => a + g.saved, 0)
  const totalTarget = goals.reduce((a, g) => a + g.target, 0)

  async function saveDraft() {
    if (!draft) return
    const target = parseGs(draft.target)
    if (!draft.name.trim() || !target) return setErr('Poné un nombre y un monto.')
    const e = await saveGoal({ id: draft.id, name: draft.name.trim(), target, icon: draft.icon, color: draft.color })
    if (e) setErr(e)
    else setDraft(null)
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between pt-2">
        <span className="text-[15px] font-medium">Metas</span>
        <button
          onClick={() => {
            setErr(null)
            setDraft({ name: '', target: '', icon: 'piggy-bank', color: PALETTE[0] })
          }}
          className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-white/35 px-4 py-2 text-sm"
        >
          <Plus size={15} strokeWidth={1.6} /> Nueva meta
        </button>
      </header>

      <motion.div {...fadeIn(0)} className="px-1 pt-3">
        <Title top="Lo que" bottom="estás construyendo" size="xl" />
      </motion.div>

      {goals.length > 0 && (
        <motion.section {...fadeIn(1)} className="card-dark relative overflow-hidden rounded-[36px] px-6 py-6">
          <div className="glow" style={{ width: 180, height: 180, right: -50, bottom: -80, opacity: 0.5 }} />
          <p className="relative text-sm text-white/55">Ahorrado en metas</p>
          <p className="num relative text-[40px] leading-tight font-light">{gs(totalSaved)}</p>
          <p className="relative text-sm text-white/55">de {gs(totalTarget)}</p>
        </motion.section>
      )}

      {goals.length === 0 && (
        <Empty>
          Todavía no tenés metas. Probá con algo como “Fondo de emergencia” o “Stock de Zolari” y andá sumando aportes cuando pases plata a eko.
        </Empty>
      )}

      {goals.map((g, i) => {
        const pct = g.saved / g.target
        return (
          <motion.button
            key={g.id}
            {...fadeIn(i + 2)}
            onClick={() => {
              setAmount('')
              setAdding(g)
            }}
            className="glass flex w-full items-center gap-4 rounded-[32px] px-5 py-5 text-left"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg">{g.name}</p>
              <p className="num text-sm text-ink-soft">{gs(g.target)}</p>
              <div className="mt-3">
                <ProgressBar value={pct} color={g.color} />
              </div>
              <div className="mt-1.5 flex justify-between text-xs text-muted">
                <span className="num">
                  {gs(g.saved)} / {gs(g.target)}
                </span>
                <span>{Math.round(pct * 100)}%</span>
              </div>
            </div>
            <IconBubble icon={g.icon} color={g.color} size={56} />
          </motion.button>
        )
      })}

      {/* Sumar aporte */}
      <Sheet open={!!adding} onClose={() => setAdding(null)} title={adding?.name}>
        {adding && (
          <div className="space-y-5">
            <p className="text-sm text-ink-soft">
              Llevás {gs(adding.saved)} de {gs(adding.target)}. ¿Cuánto sumás?
            </p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-3xl font-light text-muted">₲</span>
              <input
                autoFocus
                inputMode="numeric"
                onFocus={(e) => e.currentTarget.select()}
                placeholder="0"
                value={amount}
                onChange={(e) => {
                  const n = parseGs(e.target.value)
                  setAmount(n ? n.toLocaleString('es-PY') : '')
                }}
                className="num w-full max-w-[240px] bg-transparent text-center text-5xl font-light outline-none placeholder:text-ink/20"
              />
            </div>
            <BlobButton
              full
              onClick={async () => {
                const n = parseGs(amount)
                if (n) await saveGoal({ id: adding.id, name: adding.name, target: adding.target, saved: (adding.saved ?? 0) + n })
                setAdding(null)
              }}
            >
              Sumar aporte
            </BlobButton>
            <div className="flex justify-center gap-5 text-sm text-muted">
              <button
                onClick={() => {
                  setErr(null)
                  setDraft({ id: adding.id, name: adding.name, target: adding.target.toLocaleString('es-PY'), icon: adding.icon, color: adding.color })
                  setAdding(null)
                }}
              >
                Editar meta
              </button>
              <button
                onClick={async () => {
                  const n = parseGs(amount)
                  if (n) await saveGoal({ id: adding.id, name: adding.name, target: adding.target, saved: Math.max(0, adding.saved - n) })
                  setAdding(null)
                }}
              >
                Restar monto
              </button>
              <button
                onClick={async () => {
                  if (!confirm('¿Archivar esta meta?')) return
                  await deleteGoal(adding.id)
                  setAdding(null)
                }}
              >
                Archivar
              </button>
            </div>
          </div>
        )}
      </Sheet>

      {/* Crear / editar meta */}
      <Sheet open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'Editar meta' : 'Nueva meta'}>
        {draft && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <IconBubble icon={draft.icon} color={draft.color} size={56} />
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Nombre de la meta"
                className="flex-1 rounded-full bg-white/60 px-5 py-3.5 text-lg outline-none"
              />
            </div>
            <input
              inputMode="numeric"
                onFocus={(e) => e.currentTarget.select()}
              value={draft.target}
              onChange={(e) => {
                const n = parseGs(e.target.value)
                setDraft({ ...draft, target: n ? n.toLocaleString('es-PY') : '' })
              }}
              placeholder="Monto objetivo (₲)"
              className="num w-full rounded-full bg-white/60 px-5 py-3.5 outline-none"
            />
            <div className="flex flex-wrap gap-2">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setDraft({ ...draft, color: c })}
                  className={`h-8 w-8 rounded-full ${draft.color === c ? 'ring-2 ring-ink ring-offset-2 ring-offset-[#f4ede5]' : ''}`}
                  style={{ background: c }}
                  aria-label={c}
                />
              ))}
            </div>
            <div className="grid grid-cols-8 gap-2">
              {ICON_KEYS.map((k) => (
                <button
                  key={k}
                  onClick={() => setDraft({ ...draft, icon: k })}
                  className={`flex aspect-square items-center justify-center rounded-full ${draft.icon === k ? 'text-white' : 'bg-white/60 text-ink-soft'}`}
                  style={draft.icon === k ? { background: draft.color } : undefined}
                >
                  <Icon name={k} size={16} />
                </button>
              ))}
            </div>
            {err && <p className="text-sm text-warm-alert">{err}</p>}
            <BlobButton full onClick={saveDraft}>
              Guardar meta
            </BlobButton>
          </div>
        )}
      </Sheet>
    </div>
  )
}

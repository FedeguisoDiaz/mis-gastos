import { LogOut, Plus } from 'lucide-react'
import { useState } from 'react'
import { BlobButton, Pill, ScreenHeader, Sheet, Title } from '../components/ui'
import { gs, parseGs } from '../lib/format'
import { ICON_KEYS, Icon, IconBubble, PALETTE } from '../lib/icons'
import { useStore } from '../lib/store'
import { supabase } from '../lib/supabase'
import type { Category } from '../lib/types'

type Draft = Partial<Category> & { name: string }

export default function Settings({ onBack }: { onBack: () => void }) {
  const { categories, accounts, session, saveCategory, deleteCategory } = useStore()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [budgetText, setBudgetText] = useState('')
  const [err, setErr] = useState<string | null>(null)

  const open = (c?: Category) => {
    setErr(null)
    setDraft(c ? { ...c } : { name: '', icon: 'sparkles', color: PALETTE[0], kind: 'gasto', budget: null })
    setBudgetText(c?.budget ? c.budget.toLocaleString('es-PY') : '')
  }

  const active = categories.filter((c) => !c.archived)

  async function save() {
    if (!draft?.name.trim()) return setErr('Poné un nombre.')
    const budget = parseGs(budgetText)
    const { id, name, icon, color, kind } = draft
    const e = await saveCategory({ id, name: name.trim(), icon, color, kind, budget: budget || null })
    if (e) setErr(e)
    else setDraft(null)
  }

  return (
    <div className="space-y-4">
      <ScreenHeader title="Perfil" onBack={onBack} />
      <div className="px-1 pt-3">
        <Title top="Tu cuenta" bottom={<span className="text-xl">{session?.user.email}</span>} size="xl" />
      </div>

      {(['gasto', 'ingreso'] as const).map((kind) => (
        <section key={kind} className="glass rounded-[28px] p-3">
          <div className="flex items-center justify-between px-2 pt-1 pb-1">
            <h2 className="text-lg font-light">{kind === 'gasto' ? 'Categorías de gastos' : 'Categorías de ingresos'}</h2>
            <button onClick={() => (open(), setDraft((d) => d && { ...d, kind }))} className="flex items-center gap-1 rounded-full border border-ink/15 bg-white/35 px-3 py-1.5 text-sm">
              <Plus size={15} /> Nueva
            </button>
          </div>
          {active
            .filter((c) => c.kind === kind)
            .map((c) => (
              <button key={c.id} onClick={() => open(c)} className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-white/50">
                <IconBubble icon={c.icon} color={c.color} />
                <span className="flex-1 font-medium">{c.name}</span>
                {c.budget ? <span className="num text-xs text-muted">plan {gs(c.budget)}</span> : null}
              </button>
            ))}
        </section>
      ))}

      <section className="glass rounded-[28px] p-3">
        <h2 className="px-2 pt-1 pb-1 text-lg font-light">Cuentas</h2>
        {accounts.map((a) => (
          <div key={a.id} className="flex items-center gap-3 px-2 py-2">
            <IconBubble icon={a.icon} color={a.color} />
            <span className="flex-1 font-medium">{a.name}</span>
            <span className="text-xs text-muted capitalize">{a.kind}</span>
          </div>
        ))}
      </section>

      <button onClick={() => supabase.auth.signOut()} className="flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 bg-white/35 py-3.5 text-sm text-ink-soft">
        <LogOut size={16} /> Cerrar sesión
      </button>

      <Sheet open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'Editar categoría' : 'Nueva categoría'}>
        {draft && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <IconBubble icon={draft.icon ?? 'sparkles'} color={draft.color ?? PALETTE[0]} size={56} />
              <input
                autoFocus={!draft.id}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Nombre"
                className="flex-1 rounded-full bg-white/60 px-5 py-3.5 text-lg outline-none"
              />
            </div>
            <div className="flex gap-2">
              <Pill active={draft.kind === 'gasto'} onClick={() => setDraft({ ...draft, kind: 'gasto' })}>Gasto</Pill>
              <Pill active={draft.kind === 'ingreso'} onClick={() => setDraft({ ...draft, kind: 'ingreso' })}>Ingreso</Pill>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted">Color</p>
              <div className="flex flex-wrap gap-2">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => setDraft({ ...draft, color: c })}
                    className={`h-9 w-9 rounded-full transition-transform ${draft.color === c ? 'scale-110 ring-2 ring-ink ring-offset-2 ring-offset-[#f4ede5]' : ''}`}
                    style={{ background: c }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted">Icono</p>
              <div className="grid grid-cols-7 gap-2">
                {ICON_KEYS.map((k) => (
                  <button
                    key={k}
                    onClick={() => setDraft({ ...draft, icon: k })}
                    className={`flex aspect-square items-center justify-center rounded-full transition-all ${draft.icon === k ? 'text-white' : 'bg-white/60 text-ink-soft'}`}
                    style={draft.icon === k ? { background: draft.color } : undefined}
                  >
                    <Icon name={k} size={18} />
                  </button>
                ))}
              </div>
            </div>
            {draft.kind === 'gasto' && (
              <div>
                <p className="mb-2 text-xs font-medium text-muted">Plan mensual (opcional)</p>
                <input
                  inputMode="numeric"
                onFocus={(e) => e.currentTarget.select()}
                  value={budgetText}
                  onChange={(e) => {
                    const n = parseGs(e.target.value)
                    setBudgetText(n ? n.toLocaleString('es-PY') : '')
                  }}
                  placeholder="₲ 0"
                  className="num w-full rounded-full bg-white/60 px-5 py-3.5 outline-none"
                />
                <p className="mt-1 px-1 text-xs text-muted">Si te acercás o pasás este monto, la categoría se marca en naranja.</p>
              </div>
            )}
            {err && <p className="text-sm text-warm-alert">{err}</p>}
            <BlobButton full onClick={save}>Guardar</BlobButton>
            {draft.id && (
              <button
                onClick={async () => {
                  if (!confirm('¿Archivar esta categoría? Los movimientos que ya tiene se mantienen.')) return
                  await deleteCategory(draft.id!)
                  setDraft(null)
                }}
                className="w-full text-center text-sm text-muted"
              >
                Archivar categoría
              </button>
            )}
          </div>
        )}
      </Sheet>
    </div>
  )
}

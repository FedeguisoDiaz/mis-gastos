import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { MONTHS, gs } from '../lib/format'
import { IconBubble } from '../lib/icons'
import { useStore } from '../lib/store'
import type { Category, Transaction } from '../lib/types'

/* ---------- Escena de fondo (esferas + orbe) ---------- */
export function Scene() {
  return (
    <div className="scene" aria-hidden>
      <div className="orb" style={{ width: 380, height: 380, top: -120, right: -140 }} />
      <div className="orb" style={{ width: 300, height: 300, bottom: 60, left: -170, opacity: 0.35 }} />
      <div className="bubble" style={{ width: 340, height: 340, top: -90, left: -60 }} />
      <div className="sphere" style={{ width: 150, height: 150, bottom: -40, right: -30 }} />
      <div className="sphere" style={{ width: 70, height: 70, bottom: 120, right: 90, opacity: 0.9 }} />
    </div>
  )
}

/* ---------- Título en dos tonos (negro + gris) ---------- */
export function Title({ top, bottom, size = 'lg' }: { top: ReactNode; bottom?: ReactNode; size?: 'lg' | 'xl' }) {
  const cls = size === 'xl' ? 'text-[44px] leading-[1.02]' : 'text-[34px] leading-[1.05]'
  return (
    <h1 className={`${cls} font-light tracking-tight`}>
      <span className="block text-ink">{top}</span>
      {bottom && <span className="block text-muted">{bottom}</span>}
    </h1>
  )
}

/* ---------- Encabezado de pantalla interna ---------- */
export function ScreenHeader({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <header className="flex items-center justify-between pt-2">
      {onBack ? (
        <button onClick={onBack} className="glass-soft flex h-10 w-10 items-center justify-center rounded-full" aria-label="Volver">
          <ChevronLeft size={20} strokeWidth={1.6} />
        </button>
      ) : (
        <span className="w-10" />
      )}
      <span className="text-[15px] font-medium">{title}</span>
      <div className="flex min-w-10 justify-end">{right}</div>
    </header>
  )
}

/* ---------- Hoja que sube desde abajo ---------- */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-[#3a2c20]/25 backdrop-blur-[3px]" onClick={onClose} />
          <motion.div
            className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[36px] bg-[#f4ede5] px-6 pt-3 pb-8 shadow-2xl sm:rounded-[36px]"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-sand-deep sm:hidden" />
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-light tracking-tight">{title}</h2>
              <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-ink-soft" aria-label="Cerrar">
                <X size={17} strokeWidth={1.6} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ---------- Píldora (filtros, chips) ---------- */
export function Pill({ active, onClick, children, color }: { active?: boolean; onClick?: () => void; children: ReactNode; color?: string }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors ${
        active ? 'border-ink bg-ink text-cream' : 'border-ink/15 bg-white/35 text-ink-soft'
      }`}
      style={active && color ? { background: color, borderColor: color, color: 'white' } : undefined}
    >
      {children}
    </motion.button>
  )
}

/* ---------- Botón negro con flecha (estilo “Join in ›”) ---------- */
export function BlobButton({
  children,
  onClick,
  disabled,
  type = 'button',
  full,
  small,
}: {
  children?: ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
  full?: boolean
  small?: boolean
}) {
  const h = small ? 'h-10' : 'h-14'
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`group inline-flex items-center disabled:opacity-40 ${full ? 'w-full' : ''}`}
    >
      {children && (
        <span className={`${h} flex flex-1 items-center justify-center rounded-full bg-ink ${small ? 'px-4 text-sm' : 'px-7 text-[15px]'} font-medium text-cream`}>
          {children}
        </span>
      )}
      <span className={`${h} ${small ? 'w-10' : 'w-14'} ${children ? '-ml-2' : ''} flex shrink-0 items-center justify-center rounded-full bg-ink text-cream transition-transform group-hover:translate-x-0.5`}>
        <ChevronRight size={small ? 16 : 19} strokeWidth={1.8} />
      </span>
    </motion.button>
  )
}

/* ---------- Campo tipo píldora con icono circular ---------- */
export function Field({ icon, right, ...props }: { icon: ReactNode; right?: ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex items-center gap-3 rounded-full bg-white/45 py-1.5 pr-1.5 pl-1.5 focus-within:bg-white/70">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-ink-soft">{icon}</span>
      <input {...props} className="min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none placeholder:text-ink-soft/80" />
      {right}
    </label>
  )
}

export function MonthPicker() {
  const { year, month, setMonth } = useStore()
  const go = (d: number) => {
    const m = month + d
    setMonth(year + Math.floor(m / 12), ((m % 12) + 12) % 12)
  }
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-white/35 p-1">
      <button onClick={() => go(-1)} className="rounded-full p-1.5 text-ink-soft hover:bg-white/70" aria-label="Mes anterior">
        <ChevronLeft size={16} strokeWidth={1.6} />
      </button>
      <span className="min-w-24 text-center text-sm capitalize">
        {MONTHS[month]} {year !== new Date().getFullYear() ? year : ''}
      </span>
      <button onClick={() => go(1)} className="rounded-full p-1.5 text-ink-soft hover:bg-white/70" aria-label="Mes siguiente">
        <ChevronRight size={16} strokeWidth={1.6} />
      </button>
    </div>
  )
}

export function CategoryGrid({ categories, value, onChange }: { categories: Category[]; value: string | null; onChange: (id: string) => void }) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {categories.map((c) => {
        const active = value === c.id
        return (
          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            key={c.id}
            onClick={() => onChange(c.id)}
            className={`flex flex-col items-center gap-1.5 rounded-3xl px-1 py-2.5 text-[11px] leading-tight transition-all ${active ? 'bg-white shadow-md ring-1' : 'hover:bg-white/50'}`}
            style={active ? ({ '--tw-ring-color': c.color } as CSSProperties) : undefined}
          >
            <IconBubble icon={c.icon} color={c.color} size={42} />
            <span className="line-clamp-2 text-center text-ink-soft">{c.name}</span>
          </motion.button>
        )
      })}
    </div>
  )
}

export function TxRow({ t, onClick }: { t: Transaction; onClick?: () => void }) {
  const { catById, accById } = useStore()
  const c = catById(t.category_id)
  const acc = accById(t.account_id)
  const dest = accById(t.transfer_account_id)
  const isTransfer = t.type === 'transferencia'
  const icon = isTransfer ? 'transfer' : c?.icon ?? 'sparkles'
  const color = isTransfer ? '#8a8178' : c?.color ?? '#b3a89b'
  const sub = isTransfer ? `${acc?.name ?? '—'} → ${dest?.name ?? '—'}` : c?.name ?? 'Sin categoría'
  return (
    <motion.button layout whileTap={{ scale: 0.98 }} onClick={onClick} className="flex w-full items-center gap-3 rounded-3xl px-2 py-2.5 text-left hover:bg-white/40">
      <IconBubble icon={icon} color={color} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-medium">{t.description || c?.name || 'Movimiento'}</div>
        <div className="truncate text-xs text-muted">
          {sub}
          {t.source === 'extracto' && ' · extracto'}
        </div>
      </div>
      <div className={`num text-[15px] ${t.type === 'ingreso' ? 'text-calm' : isTransfer ? 'text-muted' : 'text-ink'}`}>
        {t.type === 'ingreso' ? '+ ' : t.type === 'gasto' ? '− ' : ''}
        {gs(t.amount)}
      </div>
    </motion.button>
  )
}

export function ProgressBar({ value, color = '#1c1b1a', over }: { value: number; color?: string; over?: boolean }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-ink/8">
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ background: over ? 'linear-gradient(90deg,#ffa25a,#e36a2c)' : color }}
      />
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-[28px] border border-dashed border-ink/15 px-6 py-10 text-center text-sm text-muted">{children}</div>
}

export const fadeIn = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.05 * i, duration: 0.45, ease: 'easeOut' as const },
})

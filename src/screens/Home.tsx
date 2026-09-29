import { motion } from 'framer-motion'
import { ArrowDownLeft, ArrowUpRight, Bug, FileUp, Minus, PiggyBank, Plus } from 'lucide-react'
import { CategoryList, DonutChart } from '../components/Donut'
import Sparkline from '../components/Sparkline'
import { BlobButton, Empty, MonthPicker, Title, TxRow, fadeIn } from '../components/ui'
import { MONTHS, gs } from '../lib/format'
import { useMonthStats, useStore } from '../lib/store'
import type { Transaction, TxType } from '../lib/types'

interface Props {
  onEdit: (t: Transaction) => void
  onNew: (type: TxType) => void
  onGo: (tab: 'movimientos' | 'resumen' | 'importar' | 'perfil') => void
}

export default function Home({ onEdit, onNew, onGo }: Props) {
  const { session, transactions, month, loadingTx, prevGastos } = useStore()
  const s = useMonthStats()
  const name = session?.user.email?.split('@')[0] ?? ''
  const hour = new Date().getHours()
  const hello = hour < 12 ? 'Buen día,' : hour < 19 ? 'Buenas tardes,' : 'Buenas noches,'
  const prevMonth = MONTHS[(month + 11) % 12]
  const diff = prevGastos ? (s.gastos - prevGastos) / prevGastos : null

  return (
    <div className="space-y-4">
      <motion.header {...fadeIn(0)} className="flex items-center justify-between pt-2">
        <button onClick={() => onGo('perfil')} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/60 text-lg font-light capitalize" aria-label="Perfil">
          {name.charAt(0)}
        </button>
        <MonthPicker />
      </motion.header>

      <motion.div {...fadeIn(1)} className="px-1 pt-3 pb-1">
        <Title top={hello} bottom={<span className="capitalize">{name}</span>} size="xl" />
      </motion.div>

      {/* Tarjeta oscura: balance del mes */}
      <motion.section {...fadeIn(2)} className="card-dark relative overflow-hidden rounded-[36px] px-6 pt-6 pb-5">
        <div className="glow" style={{ width: 200, height: 200, right: -70, top: -80, opacity: 0.55 }} />
        <p className="relative text-sm text-white/55">Balance de {MONTHS[month]}</p>
        <p className={`num relative mt-1 text-[46px] leading-none font-light ${loadingTx ? 'opacity-40' : ''}`}>
          {s.balance < 0 ? '−' : ''}
          {gs(Math.abs(s.balance))}
        </p>
        <p className="relative mt-2 text-sm text-white/55">
          {diff == null
            ? s.ingresos || s.gastos
              ? 'Lo que queda de lo que entró este mes'
              : 'Todavía no hay movimientos este mes'
            : diff <= 0
              ? `Gastaste ${Math.round(-diff * 100)}% menos que en ${prevMonth}`
              : `Gastaste ${Math.round(diff * 100)}% más que en ${prevMonth}`}
        </p>
        {s.series.length > 1 && (
          <div className="relative mt-4 -mb-1">
            <Sparkline values={s.series.map((p) => p.v)} />
          </div>
        )}
      </motion.section>

      {/* Acciones rápidas */}
      <motion.section {...fadeIn(3)} className="grid grid-cols-3 gap-3">
        {[
          { label: 'Gasto', icon: <Minus size={18} strokeWidth={1.6} />, on: () => onNew('gasto') },
          { label: 'Ingreso', icon: <Plus size={18} strokeWidth={1.6} />, on: () => onNew('ingreso') },
          { label: 'Importar', icon: <FileUp size={18} strokeWidth={1.6} />, on: () => onGo('importar') },
        ].map((a) => (
          <motion.button key={a.label} whileTap={{ scale: 0.95 }} onClick={a.on} className="glass flex flex-col items-center gap-2 rounded-[28px] py-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-cream">{a.icon}</span>
            <span className="text-sm">{a.label}</span>
          </motion.button>
        ))}
      </motion.section>

      {/* Resumen rápido */}
      <motion.section {...fadeIn(4)} className="glass rounded-[32px] px-4 py-4">
        <h2 className="px-2 pb-2 text-lg font-light">Resumen rápido</h2>
        {[
          { label: 'Ingresos', value: s.ingresos, icon: <ArrowDownLeft size={17} />, bg: '#7d9a72' },
          { label: 'Gastos', value: s.gastos, icon: <ArrowUpRight size={17} />, bg: '#f47c20' },
          { label: 'Ahorrado', value: s.ahorro, icon: <PiggyBank size={17} />, bg: '#b08850' },
          { label: `Gastos hormiga · ${s.hormigaCount}`, value: s.hormigaSum, icon: <Bug size={17} />, bg: '#c9678f' },
        ].map((r) => (
          <div key={r.label} className="flex items-center gap-3 px-2 py-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full text-white" style={{ background: r.bg }}>
              {r.icon}
            </span>
            <span className="flex-1 text-[15px]">{r.label}</span>
            <span className="num text-[15px]">{gs(r.value)}</span>
          </div>
        ))}
      </motion.section>

      {/* A dónde fue la plata — tarjeta clara con panel interno y orbe naranja */}
      <motion.section {...fadeIn(5)} className="paper relative overflow-hidden rounded-[36px] p-3">
        <div className="flex gap-3">
          <div className="relative flex-1 overflow-hidden rounded-[28px] bg-[#f1ece6] px-5 py-5">
            <div className="glow" style={{ width: 170, height: 170, left: -30, bottom: -60, opacity: 0.6 }} />
            <div className="relative">
              <Title top="¿A dónde" bottom="fue la plata?" />
              {s.breakdown.length > 0 ? (
                <ul className="mt-5 space-y-1.5 text-sm">
                  {s.breakdown.slice(0, 3).map((b) => (
                    <li key={b.id} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: b.color }} />
                      <span className="flex-1 truncate">{b.name}</span>
                      <span className="text-ink-soft">{Math.round(b.pct * 100)}%</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 text-sm text-ink-soft">Cuando cargues gastos, acá vas a ver el desglose.</p>
              )}
            </div>
          </div>
          {s.breakdown.length > 0 && (
            <div className="flex w-[118px] flex-col items-center justify-between py-2">
              <DonutChart data={s.breakdown} total={s.gastos} size={108} />
              <BlobButton small onClick={() => onGo('resumen')}>
                Ver
              </BlobButton>
            </div>
          )}
        </div>
        {s.breakdown.some((b) => b.budget && b.total > b.budget) && (
          <div className="px-3 pt-3 pb-1">
            <CategoryList data={s.breakdown.filter((b) => b.budget && b.total > b.budget)} />
          </div>
        )}
      </motion.section>

      {/* Últimos movimientos */}
      <motion.section {...fadeIn(6)} className="glass rounded-[32px] p-4">
        <div className="flex items-center justify-between px-2 pb-1">
          <h2 className="text-lg font-light">Últimos movimientos</h2>
          {transactions.length > 0 && (
            <button onClick={() => onGo('movimientos')} className="text-sm text-ink-soft underline-offset-4 hover:underline">
              Ver todo
            </button>
          )}
        </div>
        {transactions.length ? (
          transactions.slice(0, 5).map((t) => <TxRow key={t.id} t={t} onClick={() => onEdit(t)} />)
        ) : (
          <div className="p-2">
            <Empty>Nada por acá todavía. Tocá el + para cargar tu primer gasto o importá un extracto.</Empty>
          </div>
        )}
      </motion.section>
    </div>
  )
}

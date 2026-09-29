import { AnimatePresence, motion } from 'framer-motion'
import { Home as HomeIcon, List, Plus, Target, Wallet } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Scene } from './components/ui'
import { StoreProvider, useStore } from './lib/store'
import type { Transaction, TxType } from './lib/types'
import Auth from './screens/Auth'
import Budget from './screens/Budget'
import Goals from './screens/Goals'
import Home from './screens/Home'
import Import from './screens/Import'
import Settings from './screens/Settings'
import Summary from './screens/Summary'
import TransactionForm from './screens/TransactionForm'
import Transactions from './screens/Transactions'

type Tab = 'inicio' | 'movimientos' | 'presupuesto' | 'metas' | 'resumen' | 'importar' | 'perfil'

function Shell() {
  const { session, ready } = useStore()
  const [tab, setTab] = useState<Tab>('inicio')
  const [formOpen, setFormOpen] = useState(false)
  const [formType, setFormType] = useState<TxType>('gasto')
  const [editing, setEditing] = useState<Transaction | null>(null)

  useEffect(() => window.scrollTo({ top: 0 }), [tab])

  if (!ready) return null
  if (!session) return <Auth />

  const edit = (t: Transaction) => {
    setEditing(t)
    setFormOpen(true)
  }
  const create = (type: TxType = 'gasto') => {
    setEditing(null)
    setFormType(type)
    setFormOpen(true)
  }
  const home = () => setTab('inicio')

  return (
    <div className="relative z-10 mx-auto min-h-dvh max-w-lg px-4 pt-[max(env(safe-area-inset-top),14px)] pb-36">
      <AnimatePresence mode="wait">
        <motion.main key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {tab === 'inicio' && <Home onEdit={edit} onNew={create} onGo={setTab} />}
          {tab === 'movimientos' && <Transactions onEdit={edit} />}
          {tab === 'presupuesto' && <Budget />}
          {tab === 'metas' && <Goals />}
          {tab === 'resumen' && <Summary onBack={home} />}
          {tab === 'importar' && <Import onDone={home} />}
          {tab === 'perfil' && <Settings onBack={home} />}
        </motion.main>
      </AnimatePresence>

      {/* Barra inferior: vidrio + botón central negro */}
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-lg px-4 pb-[max(env(safe-area-inset-bottom),14px)]">
        <div className="glass flex items-center justify-between rounded-full px-2 py-2">
          <NavBtn icon={<HomeIcon size={20} strokeWidth={1.6} />} label="Inicio" active={tab === 'inicio' || tab === 'resumen' || tab === 'perfil'} onClick={home} />
          <NavBtn icon={<List size={20} strokeWidth={1.6} />} label="Movimientos" active={tab === 'movimientos' || tab === 'importar'} onClick={() => setTab('movimientos')} />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => create('gasto')}
            className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-ink text-cream shadow-xl shadow-black/25"
            aria-label="Agregar movimiento"
          >
            <span className="glow" style={{ width: 50, height: 50, bottom: -30, left: 2, opacity: 0.8, filter: 'blur(12px)' }} />
            <Plus size={26} strokeWidth={1.8} className="relative" />
          </motion.button>
          <NavBtn icon={<Wallet size={20} strokeWidth={1.6} />} label="Presupuesto" active={tab === 'presupuesto'} onClick={() => setTab('presupuesto')} />
          <NavBtn icon={<Target size={20} strokeWidth={1.6} />} label="Metas" active={tab === 'metas'} onClick={() => setTab('metas')} />
        </div>
      </nav>

      <TransactionForm open={formOpen} onClose={() => setFormOpen(false)} editing={editing} initialType={formType} />
    </div>
  )
}

function NavBtn({ icon, label, active, onClick }: { icon: ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex w-[68px] flex-col items-center gap-0.5 rounded-full py-1 text-[10px] transition-colors ${active ? 'text-ink' : 'text-muted'}`}>
      {icon}
      <span className={active ? 'font-semibold' : ''}>{label}</span>
    </button>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Scene />
      <Shell />
    </StoreProvider>
  )
}

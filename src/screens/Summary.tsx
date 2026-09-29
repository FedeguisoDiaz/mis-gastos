import { motion } from 'framer-motion'
import { CategoryList, DonutChart } from '../components/Donut'
import { Empty, MonthPicker, ScreenHeader, fadeIn } from '../components/ui'
import { MONTHS, gs } from '../lib/format'
import { useMonthStats, useStore } from '../lib/store'

export default function Summary({ onBack }: { onBack: () => void }) {
  const { month } = useStore()
  const s = useMonthStats()
  return (
    <div className="space-y-4">
      <ScreenHeader title="Resumen de gastos" onBack={onBack} />
      <motion.div {...fadeIn(0)} className="flex items-end justify-between px-1 pt-4">
        <div>
          <p className="num text-[42px] leading-none font-light">{gs(s.gastos)}</p>
          <p className="mt-1 text-muted">Gastos de {MONTHS[month]}</p>
        </div>
      </motion.div>
      <motion.div {...fadeIn(1)}>
        <MonthPicker />
      </motion.div>
      <motion.section {...fadeIn(2)} className="glass relative overflow-hidden rounded-[36px] px-4 pt-7 pb-4">
        {s.breakdown.length ? (
          <>
            <DonutChart data={s.breakdown} total={s.gastos} size={220} label="Total" />
            <div className="mt-6">
              <CategoryList data={s.breakdown} />
            </div>
          </>
        ) : (
          <Empty>Todavía no hay gastos en este mes.</Empty>
        )}
      </motion.section>
    </div>
  )
}

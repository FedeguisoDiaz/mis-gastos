import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { gs, gsShort } from '../lib/format'
import { IconBubble } from '../lib/icons'
import { ProgressBar } from './ui'

export interface Slice {
  id: string
  name: string
  color: string
  icon: string
  total: number
  pct: number
  budget: number | null
}

export function DonutChart({ data, total, size = 208, label = 'Gastado' }: { data: Slice[]; total: number; size?: number; label?: string }) {
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="total" innerRadius="72%" outerRadius="100%" paddingAngle={2.5} cornerRadius={10} stroke="none" animationDuration={800}>
            {data.map((d) => (
              <Cell key={d.id} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {size >= 150 && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="num text-[26px] font-light">{gsShort(total)}</span>
          <span className="text-xs text-muted">{label}</span>
        </div>
      )}
    </div>
  )
}

export function CategoryList({ data }: { data: Slice[] }) {
  return (
    <ul className="space-y-1">
      {data.map((d) => {
        const hasBudget = d.budget != null && d.budget > 0
        const over = hasBudget && d.total > d.budget!
        const near = hasBudget && !over && d.total >= d.budget! * 0.85
        return (
          <li key={d.id} className={`rounded-3xl px-2 py-2.5 ${over ? 'bg-accent-soft/45' : ''}`}>
            <div className="flex items-center gap-3">
              <IconBubble icon={d.icon} color={d.color} size={38} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[15px] font-medium">{d.name}</span>
                  <span className="flex items-baseline gap-3">
                    <span className="text-xs text-muted">{Math.round(d.pct * 100)}%</span>
                    <span className="num text-[15px]">{gs(d.total)}</span>
                  </span>
                </div>
                {hasBudget && (
                  <div className="mt-1.5 space-y-1">
                    <ProgressBar value={d.total / d.budget!} color={d.color} over={over} />
                    <div className={`text-xs ${over ? 'text-warm-alert' : near ? 'text-accent' : 'text-muted'}`}>
                      {over
                        ? `${gs(d.total - d.budget!)} por encima del plan · para mirar con curiosidad`
                        : near
                          ? `Cerca del plan · quedan ${gs(d.budget! - d.total)}`
                          : `Plan ${gs(d.budget!)} · quedan ${gs(d.budget! - d.total)}`}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

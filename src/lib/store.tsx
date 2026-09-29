import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Account, Category, CategoryRule, Goal, NewTransaction, Transaction } from './types'
import { monthRange } from './format'

interface Store {
  session: Session | null
  ready: boolean
  accounts: Account[]
  categories: Category[]
  rules: CategoryRule[]
  transactions: Transaction[]
  goals: Goal[]
  prevGastos: number | null
  loadingTx: boolean
  year: number
  month: number
  setMonth: (y: number, m: number) => void
  catById: (id: string | null) => Category | undefined
  accById: (id: string | null) => Account | undefined
  addTransaction: (t: NewTransaction) => Promise<string | null>
  updateTransaction: (id: string, t: Partial<Transaction>) => Promise<string | null>
  deleteTransaction: (id: string) => Promise<void>
  saveCategory: (c: Partial<Category> & { name: string }) => Promise<string | null>
  deleteCategory: (id: string) => Promise<void>
  saveGoal: (g: Partial<Goal> & { name: string; target: number }) => Promise<string | null>
  deleteGoal: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const now = new Date()
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [rules, setRules] = useState<CategoryRule[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [prevGastos, setPrevGastos] = useState<number | null>(null)
  const [loadingTx, setLoadingTx] = useState(false)
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const loadBase = useCallback(async () => {
    const [a, c, r, g] = await Promise.all([
      supabase.from('accounts').select('*').order('sort_order'),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('category_rules').select('id,pattern,category_id'),
      supabase.from('goals').select('*').eq('archived', false).order('created_at'),
    ])
    setGoals(g.data ?? [])
    setAccounts(a.data ?? [])
    setCategories(c.data ?? [])
    setRules(r.data ?? [])
  }, [])

  const loadTx = useCallback(async () => {
    setLoadingTx(true)
    const { from, to } = monthRange(ym.year, ym.month)
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: false })
      .order('time', { ascending: false, nullsFirst: true })
      .order('created_at', { ascending: false })
    setTransactions(data ?? [])
    setLoadingTx(false)
    // Gastos del mes anterior, para comparar
    const pm = ym.month === 0 ? { y: ym.year - 1, m: 11 } : { y: ym.year, m: ym.month - 1 }
    const pr = monthRange(pm.y, pm.m)
    const { data: prev } = await supabase.from('transactions').select('amount').eq('type', 'gasto').gte('date', pr.from).lte('date', pr.to)
    setPrevGastos(prev && prev.length ? prev.reduce((a, t) => a + t.amount, 0) : null)
  }, [ym])

  const userId = session?.user.id
  useEffect(() => {
    if (userId) loadBase()
  }, [userId, loadBase])
  useEffect(() => {
    if (userId) loadTx()
  }, [userId, loadTx])

  const refresh = useCallback(async () => {
    await Promise.all([loadBase(), loadTx()])
  }, [loadBase, loadTx])

  const value = useMemo<Store>(() => {
    const catMap = new Map(categories.map((c) => [c.id, c]))
    const accMap = new Map(accounts.map((a) => [a.id, a]))
    return {
      session,
      ready,
      accounts,
      categories,
      rules,
      transactions,
      goals,
      prevGastos,
      loadingTx,
      year: ym.year,
      month: ym.month,
      setMonth: (year, month) => setYm({ year, month }),
      catById: (id) => (id ? catMap.get(id) : undefined),
      accById: (id) => (id ? accMap.get(id) : undefined),
      addTransaction: async (t) => {
        const { error } = await supabase.from('transactions').insert(t)
        if (!error) await loadTx()
        return error?.message ?? null
      },
      updateTransaction: async (id, t) => {
        const { error } = await supabase.from('transactions').update(t).eq('id', id)
        if (!error) await loadTx()
        return error?.message ?? null
      },
      deleteTransaction: async (id) => {
        setTransactions((ts) => ts.filter((t) => t.id !== id))
        await supabase.from('transactions').delete().eq('id', id)
      },
      saveCategory: async (c) => {
        const { id, ...rest } = c
        const { error } = id
          ? await supabase.from('categories').update(rest).eq('id', id)
          : await supabase.from('categories').insert({ ...rest, sort_order: categories.length })
        if (!error) await loadBase()
        return error?.message ?? null
      },
      deleteCategory: async (id) => {
        await supabase.from('categories').update({ archived: true }).eq('id', id)
        await loadBase()
      },
      saveGoal: async (g) => {
        const { id, ...rest } = g
        const { error } = id ? await supabase.from('goals').update(rest).eq('id', id) : await supabase.from('goals').insert(rest)
        if (!error) await loadBase()
        return error?.message ?? null
      },
      deleteGoal: async (id) => {
        await supabase.from('goals').update({ archived: true }).eq('id', id)
        await loadBase()
      },
      refresh,
    }
  }, [session, ready, accounts, categories, rules, transactions, goals, prevGastos, loadingTx, ym, loadTx, loadBase, refresh])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore fuera de StoreProvider')
  return s
}

/** Busca la categoría que corresponde a un texto según las reglas (la regla más larga gana). */
export function matchRule(rules: CategoryRule[], text: string): string | null {
  if (!text) return null
  const up = text.toUpperCase()
  let best: CategoryRule | null = null
  for (const r of rules) if (up.includes(r.pattern) && (!best || r.pattern.length > best.pattern.length)) best = r
  return best?.category_id ?? null
}

/** Totales del mes */
export function useMonthStats() {
  const { transactions, categories, accounts } = useStore()
  return useMemo(() => {
    let ingresos = 0
    let gastos = 0
    let ahorro = 0
    const byCat = new Map<string, number>()
    const savingIds = new Set(accounts.filter((a) => a.kind === 'billetera').map((a) => a.id))
    let hormigaCount = 0
    let hormigaSum = 0
    for (const t of transactions) {
      if (t.type === 'ingreso') ingresos += t.amount
      else if (t.type === 'gasto') {
        gastos += t.amount
        const k = t.category_id ?? 'none'
        byCat.set(k, (byCat.get(k) ?? 0) + t.amount)
        if (t.amount <= 50_000) {
          hormigaCount++
          hormigaSum += t.amount
        }
      } else if (t.type === 'transferencia') {
        if (t.transfer_account_id && savingIds.has(t.transfer_account_id)) ahorro += t.amount
        if (t.account_id && savingIds.has(t.account_id)) ahorro -= t.amount
      }
    }
    const catMap = new Map(categories.map((c) => [c.id, c]))
    const breakdown = [...byCat.entries()]
      .map(([id, total]) => {
        const c = catMap.get(id)
        return {
          id,
          name: c?.name ?? 'Sin categoría',
          color: c?.color ?? '#BDB3A6',
          icon: c?.icon ?? 'sparkles',
          budget: c?.budget ?? null,
          total,
          pct: gastos ? total / gastos : 0,
        }
      })
      .sort((a, b) => b.total - a.total)
    // Serie diaria del balance acumulado (para la curvita de la tarjeta)
    const byDay = new Map<string, number>()
    for (const t of transactions) {
      if (t.type === 'transferencia') continue
      byDay.set(t.date, (byDay.get(t.date) ?? 0) + (t.type === 'ingreso' ? t.amount : -t.amount))
    }
    let acc = 0
    const series = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, v: (acc += v) }))
    return { ingresos, gastos, balance: ingresos - gastos, ahorro, breakdown, hormigaCount, hormigaSum, series }
  }, [transactions, categories, accounts])
}

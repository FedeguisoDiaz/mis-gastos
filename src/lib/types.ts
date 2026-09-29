export type TxType = 'gasto' | 'ingreso' | 'transferencia'

export interface Account {
  id: string
  name: string
  kind: 'banco' | 'billetera' | 'efectivo'
  icon: string
  color: string
  sort_order: number
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  kind: 'gasto' | 'ingreso'
  budget: number | null
  sort_order: number
  archived: boolean
}

export interface Transaction {
  id: string
  date: string
  time: string | null
  amount: number
  type: TxType
  category_id: string | null
  account_id: string | null
  transfer_account_id: string | null
  description: string
  raw_description: string | null
  source: 'manual' | 'extracto'
  bank_ref: string | null
  import_id: string | null
  created_at: string
}

export interface CategoryRule {
  id: string
  pattern: string
  category_id: string
}

export type NewTransaction = Omit<Transaction, 'id' | 'created_at' | 'raw_description' | 'bank_ref' | 'import_id' | 'time'> &
  Partial<Pick<Transaction, 'raw_description' | 'bank_ref' | 'import_id' | 'time'>>

export interface Goal {
  id: string
  name: string
  target: number
  saved: number
  icon: string
  color: string
  deadline: string | null
  archived: boolean
}

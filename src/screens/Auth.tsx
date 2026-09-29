import { motion } from 'framer-motion'
import { AtSign, KeyRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { BlobButton, Field } from '../components/ui'

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const { data, error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.href } })
    setBusy(false)
    if (error) {
      setMsg(
        error.message.includes('Invalid login')
          ? 'Email o contraseña incorrectos.'
          : error.message.includes('not confirmed')
            ? 'Todavía no confirmaste tu email. Revisá tu bandeja de entrada.'
            : error.message,
      )
    } else if (mode === 'signup' && !data.session) {
      setMsg('¡Listo! Te mandamos un email para confirmar la cuenta.')
    }
  }

  async function forgot() {
    if (!email) return setMsg('Escribí tu email arriba y tocá “Olvidé” de nuevo.')
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.href })
    setMsg('Te mandamos un email para crear una contraseña nueva.')
  }

  return (
    <div className="relative z-10 mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-3 px-5 py-10">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-[36px] px-6 pt-7 pb-6"
      >
        <div className="flex items-center justify-between">
          <span className="text-lg font-light text-ink-soft">Mis Gastos</span>
          <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-lg">
            {mode === 'login' ? 'Crear cuenta' : 'Entrar'}
          </button>
        </div>

        <h1 className="mt-12 mb-7 text-[38px] font-light tracking-tight">{mode === 'login' ? 'Entrar' : 'Crear cuenta'}</h1>

        <div className="space-y-3">
          <Field icon={<AtSign size={17} strokeWidth={1.6} />} type="email" required placeholder="tu email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field
            icon={<KeyRound size={17} strokeWidth={1.6} />}
            type="password"
            required
            minLength={6}
            placeholder="contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            right={
              mode === 'login' ? (
                <button type="button" onClick={forgot} className="shrink-0 rounded-full bg-white px-4 py-2 text-xs">
                  Olvidé
                </button>
              ) : undefined
            }
          />
        </div>

        <div className="mt-7 flex items-center justify-between gap-4">
          <p className="max-w-[220px] text-xs leading-relaxed text-ink-soft">
            {msg ?? 'Tus datos quedan guardados solo para vos. Nadie más puede ver tus movimientos.'}
          </p>
          <BlobButton type="submit" disabled={busy} />
        </div>
      </motion.form>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-dark rounded-[32px] px-7 py-6">
        <p className="text-[34px] leading-tight font-light">Tu plata,</p>
        <p className="text-[22px] font-light text-white/50">con calma y sin culpa.</p>
        <p className="mt-6 text-right text-lg font-light">Ordená · Mirá · Mejorá</p>
      </motion.div>
    </div>
  )
}

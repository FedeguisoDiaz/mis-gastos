import { createClient } from '@supabase/supabase-js'

// La clave "publishable" es pública por diseño: la seguridad la dan las
// políticas RLS de la base (cada usuario solo ve sus propios datos).
const url = import.meta.env.VITE_SUPABASE_URL ?? 'https://tvhqizyrqfzrnxmatlil.supabase.co'
const key = import.meta.env.VITE_SUPABASE_KEY ?? 'sb_publishable_SHaAmpKbFuYxLW8JHFXvtQ_SWOktOTH'

export const supabase = createClient(url, key)

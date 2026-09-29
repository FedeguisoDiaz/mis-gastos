# Mis Gastos 🧡

Tu app para registrar y entender tus gastos, con calma.
Está hecha con React + Vite + Tailwind, y los datos se guardan en Supabase (proyecto **mis-gastos**, ya creado y configurado).

---

## ✅ Lo que ya está hecho

- Base de datos en Supabase con:
  - Tablas de cuentas, categorías, movimientos, reglas, importaciones y metas.
  - Seguridad por usuario: nadie más puede ver tus datos.
- Al crear tu cuenta se cargan solas:
  - Tus cuentas: **Continental**, **eko (ahorros)** y **Efectivo**.
  - 13 categorías con icono y color.
  - Reglas para categorizar comercios conocidos: Biggie, Petrobras, Burger King, Claro…
- Pantallas:
  - Inicio.
  - Movimientos, con buscador y filtros.
  - Carga rápida (botón +).
  - Resumen de gastos con la dona.
  - Presupuesto.
  - Metas.
  - Importar extracto.
  - Perfil y categorías.
- Lector del PDF de **Banco Continental** ("Movimientos de Cuenta"). Lo probé con tu extracto de septiembre: leyó los 89 movimientos y los totales coinciden con los del banco.
- Preparada para iPhone: se instala como app desde Safari, con ícono propio y a pantalla completa.
- Publicación automática en GitHub Pages ya configurada.

---

## 🚀 Lo que te toca a vos (unos 10 minutos, una sola vez)

### Paso 1 — Supabase (2 min)

Entrá a [supabase.com](https://supabase.com/dashboard) → proyecto **mis-gastos**.

1. **Authentication → Sign In / Providers → Email**: apagá **"Confirm email"** y guardá.
   Así podés entrar apenas creás la cuenta, sin esperar el email de confirmación. Como la app es solo para vos, no hace falta.

### Paso 2 — Subir a GitHub (5 min)

1. Creá tu cuenta en [github.com/signup](https://github.com/signup).
2. Descargá e instalá **GitHub Desktop**: [desktop.github.com](https://desktop.github.com). Entrá con tu cuenta.
3. En GitHub Desktop: **File → Add local repository…** → elegí la carpeta `Proyectos\mis-gastos` → **Add repository**.
   El proyecto ya viene con el primer commit hecho.
4. Tocá **Publish repository**:
   - Nombre: `mis-gastos`.
   - **Destildá "Keep this code private"**, porque GitHub Pages gratis necesita un repositorio público.
   - Tus datos no quedan expuestos: viven en Supabase y están protegidos por usuario. La clave que está en el código es pública por diseño.
5. En el navegador, andá a tu repo en github.com → **Settings → Pages** → en **Source** elegí **GitHub Actions**.
6. Andá a la pestaña **Actions** → **Publicar en GitHub Pages** → **Run workflow**. Tarda 1–2 minutos.
7. Tu app queda en:
   **`https://TU-USUARIO.github.io/mis-gastos/`**

Después volvé a Supabase → **Authentication → URL Configuration** → **Site URL** y pegá ese mismo link. Sirve para los emails de "olvidé mi contraseña".

### Paso 3 — Ponerla en tu iPhone (1 min)

1. Abrí el link en **Safari**. Tiene que ser Safari, no Chrome.
2. Tocá **Compartir** (el cuadrado con la flechita) → **Agregar a pantalla de inicio** → **Agregar**.
3. Abrila desde el ícono, tocá **Crear cuenta** y listo.

Para importar tu extracto: botón **Importar** en el inicio → elegí el PDF que te bajás de la app de Continental.

---

## 💻 Verla y editarla en VS Code

1. Abrí VS Code → **File → Open Folder…** → `Proyectos\mis-gastos`.
2. Si no tenés Node.js, instalá la versión **LTS** desde [nodejs.org](https://nodejs.org).
3. Abrí la terminal (**Ctrl + ñ**) y corré:

```bash
npm install
npm run dev
```

4. Abrí **http://localhost:5173** en el navegador.
5. **Desde el iPhone**, con el celu en el mismo WiFi que la compu: abrí en Safari la dirección que aparece en la terminal como `Network:`, algo como `http://192.168.x.x:5173`.

### Publicar cambios

Cada vez que cambies algo:

1. Abrí GitHub Desktop.
2. Escribí un resumen del cambio.
3. Tocá **Commit to main** → **Push origin**.

En 1–2 minutos la app del iPhone se actualiza sola. Si no ves el cambio, cerrala y volvé a abrirla.

---

## 🗂️ Dónde está cada cosa

| Qué querés cambiar | Archivo |
|---|---|
| **Colores y tipografía de toda la app** | `src/index.css` (bloque `@theme` arriba de todo) |
| Pantalla de inicio | `src/screens/Home.tsx` |
| Movimientos (lista, buscador) | `src/screens/Transactions.tsx` |
| Formulario de carga rápida | `src/screens/TransactionForm.tsx` |
| Presupuesto | `src/screens/Budget.tsx` |
| Metas | `src/screens/Goals.tsx` |
| Resumen con la dona | `src/screens/Summary.tsx` + `src/components/Donut.tsx` |
| Importar extracto | `src/screens/Import.tsx` |
| Lector del PDF de Continental | `src/parsers/continental.ts` |
| Login | `src/screens/Auth.tsx` |
| Perfil / categorías | `src/screens/Settings.tsx` |
| Botones, píldoras, hojas, fondo con esferas | `src/components/ui.tsx` |
| Iconos disponibles para categorías | `src/lib/icons.tsx` |
| Conexión a Supabase | `src/lib/supabase.ts` |

---

## 🧠 Cómo funciona la importación

- El PDF se lee **en tu celular o compu**: el archivo no se sube a ningún lado. Solo se guardan los movimientos que confirmás.
- **Compras con tarjeta** → se categorizan solas por el nombre del comercio.
- **IVA de compras en el exterior** (Steam, Claude…) → se suma a la compra, no aparece como un gasto aparte.
- **Extracción en cajero** → pasa como transferencia a **Efectivo**, no cuenta como gasto.
- **Sueldo y bonificaciones** → ingreso.
- **Transferencias a otro banco** → quedan **"Para revisar"**, porque el banco no dice qué fueron.
  - Tocás cada una y elegís la categoría, o **"Pasé a eko"** si fue ahorro.
- Si corregís la categoría de un comercio, **la app lo recuerda** para los próximos extractos.
- Si subís dos extractos que se superponen, **no se duplican** movimientos.

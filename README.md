# Carunchio-Péculo — Sistema de Gestión

App web de gestión de servicios fúnebres. Next.js 14 + Supabase + TypeScript + Tailwind.

---

## Setup en 5 pasos

### 1. Instalá dependencias
```bash
npm install
```

### 2. Creá el proyecto en Supabase
- Entrá a https://supabase.com y creá un proyecto nuevo
- Anotá la **URL** y la **anon key** (Settings → API)

### 3. Creá las tablas
- En tu proyecto Supabase: **SQL Editor** → pegá el contenido de `supabase-schema.sql` → Run

### 4. Configurá las variables de entorno
```bash
cp .env.local.example .env.local
```
Editá `.env.local` con tu URL y anon key de Supabase.

### 5. Levantá el servidor
```bash
npm run dev
```
Abrí http://localhost:3000

---

## Deploy en Vercel
```bash
# Instalar Vercel CLI si no lo tenés
npm i -g vercel

vercel
# Te va a pedir las env vars: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## Estructura del proyecto
```
src/
  app/
    dashboard/       → Inicio con métricas y alertas
    servicios/       → Lista de servicios + nuevo + detalle
    stock/           → Gestión de inventario
  components/
    layout/          → Sidebar, AppLayout
    servicios/       → Form, Lista, Detalle
    stock/           → StockManager
    ui/              → Badge, StatCard, Modal, Field, Toast
  lib/
    supabase.ts      → Cliente Supabase
    db.ts            → Funciones CRUD
    utils.ts         → Formatters
  types/
    index.ts         → Tipos TypeScript
```

---

## Próximas mejoras sugeridas
- [ ] Autenticación (Supabase Auth) con login por email
- [ ] Multiusuario con RLS por usuario
- [ ] Exportar orden de trabajo a PDF
- [ ] Historial de pagos / cobros parciales
- [ ] Notificaciones de stock bajo por email/WhatsApp
- [ ] Estadísticas mensuales y anuales

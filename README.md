# CARTU v2 — Sistema de Gestión de Servicios Fúnebres

## Setup

### 1. Instalar dependencias
```bash
npm install
```

### 2. Variables de entorno
```bash
cp .env.local.example .env.local
```
El archivo ya tiene las credenciales del proyecto Supabase configurado.

### 3. Crear tablas en Supabase
- Supabase Dashboard → SQL Editor → pegar contenido de `supabase-schema.sql` → Run

### 4. Crear usuario admin
- Supabase Dashboard → Authentication → Users → Add user
- Email: el que quieras usar
- Password: elegís vos

### 5. Correr local
```bash
npm run dev
```

## Deploy en Vercel
```bash
git add .
git commit -m "feat: cartu v2 completo"
git push
```
Vercel detecta el push y redeploya automáticamente.

## Módulos incluidos
- **Dashboard** — métricas, cobros pendientes, alertas de stock
- **Servicios** — CRUD completo, estados, historial de pagos, edición, filtros, exportar Excel
- **Agenda** — calendario mensual, gestión de salas y vehículos
- **Stock** — ataúdes, urnas, mortajas con historial de movimientos y proveedores
- **Contactos** — responsables, obras sociales, crematorios, cementerios, proveedores
- **Reportes** — facturación mensual, rendimiento por asesor, gráficos, exportar Excel
- **Login** — autenticación con Supabase Auth

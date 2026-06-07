-- ============================================================
-- CARTU v2 — Tablas adicionales de FINANZAS
-- Ejecutar en Supabase Dashboard → SQL Editor
-- (además del schema principal)
-- ============================================================

-- EGRESOS (gastos variables)
create table if not exists public.egresos (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  fecha       date not null,
  tipo        text not null,
  descripcion text not null,
  proveedor   text,
  monto       numeric not null,
  comprobante text,
  servicio_id uuid references public.servicios on delete set null,
  stock_id    uuid references public.stock on delete set null,
  notas       text
);

-- COBRANZAS DE OBRAS SOCIALES
create table if not exists public.cobranzas_os (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz default now(),
  servicio_id           uuid references public.servicios on delete set null,
  obra_social           text not null,
  codigo_prestacion     text,
  arancel               numeric default 0,
  monto_presentado      numeric not null,
  fecha_presentacion    date,
  fecha_cobro_estimada  date,
  fecha_cobro_real      date,
  estado                text default 'PENDIENTE' check (estado in ('PENDIENTE','PRESENTADO','COBRADO','INCOBRABLE')),
  notas                 text
);

-- GASTOS FIJOS MENSUALES
create table if not exists public.gastos_fijos (
  id             uuid primary key default gen_random_uuid(),
  nombre         text not null,
  tipo           text not null,
  monto_mensual  numeric not null,
  activo         boolean default true,
  notas          text
);

-- RLS deshabilitado (igual que el resto)
alter table public.egresos        disable row level security;
alter table public.cobranzas_os   disable row level security;
alter table public.gastos_fijos   disable row level security;

-- Gastos fijos de ejemplo
insert into public.gastos_fijos (nombre, tipo, monto_mensual, activo) values
  ('Alquiler sede Boulogne',     'ALQUILER',     850000, true),
  ('Electricidad',               'SERVICIOS',     45000, true),
  ('Gas',                        'SERVICIOS',     30000, true),
  ('Internet y teléfono',        'SERVICIOS',     18000, true),
  ('Seguro vehículos',           'SEGUROS',       95000, true),
  ('Seguro local',               'SEGUROS',       35000, true),
  ('Ingresos brutos',            'IMPUESTOS',     60000, true),
  ('Mantenimiento fúnebre',      'MANTENIMIENTO', 25000, true)
on conflict do nothing;

-- Egresos de ejemplo asociados a los servicios
insert into public.egresos (fecha, tipo, descripcion, proveedor, monto, notas) values
  ('2026-05-03', 'CREMATORIO',   'Servicio crematorio Lencina',        'Crematorio del Norte',  180000, 'Servicio 4446'),
  ('2026-05-03', 'SUBCONTRATADO','Tanatopraxia Lencina',               'Dr. García',             45000, 'Servicio 4446'),
  ('2026-05-03', 'COMBUSTIBLE',  'Combustible ambulancia mayo semana 1','YPF Boulogne',           15000, null),
  ('2026-04-21', 'CREMATORIO',   'Nicho La Chacarita - Martínez',      'La Chacarita',          120000, 'Servicio 4431'),
  ('2026-04-21', 'SUBCONTRATADO','Responso capilla - Martínez',        'Parroquia San José',     25000, 'Servicio 4431'),
  ('2026-04-08', 'CREMATORIO',   'Servicio crematorio Rodríguez',      'Crematorio del Norte',  180000, 'Servicio 4418'),
  ('2026-04-08', 'COMBUSTIBLE',  'Combustible ambulancia abril',       'Shell Tigre',             12000, null),
  ('2026-06-05', 'STOCK',        'Compra 3 ataúdes modelo 2004',       'Proveedora Funebres SA', 480000, '3 unidades x $160.000'),
  ('2026-06-05', 'STOCK',        'Compra mortajas (10 unidades)',      'Textiles Moreno',         35000, null),
  ('2026-06-01', 'PERSONAL',     'Honorarios asesor Marco - junio',    null,                    180000, null),
  ('2026-06-01', 'PERSONAL',     'Honorarios asesora Yani - junio',    null,                    180000, null)
on conflict do nothing;

-- Cobranza OS de ejemplo
insert into public.cobranzas_os (obra_social, codigo_prestacion, arancel, monto_presentado, fecha_presentacion, fecha_cobro_estimada, estado, notas) values
  ('OSDE',          'FUN-001', 850000, 980000,  '2026-04-25', '2026-05-25', 'COBRADO',    'Servicio Martínez - abonado 25/05'),
  ('Swiss Medical', 'FUN-002', 780000, 950000,  '2026-06-10', '2026-07-10', 'PRESENTADO', 'Servicio Gómez - pendiente cobro'),
  ('PAMI',          'FUN-003', 650000, 650000,  '2026-05-15', '2026-06-15', 'PENDIENTE',  'Pendiente de presentación formal')
on conflict do nothing;

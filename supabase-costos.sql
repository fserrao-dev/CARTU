-- ============================================================
-- CARTU v3 — Tabla COSTOS_SERVICIO
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

create table if not exists public.costos_servicio (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz default now(),
  -- Identificación
  nro_servicio          text,
  nro_mes               int,
  fecha                 date not null,
  fallecido             text,
  tipo                  text,
  servicio_id           uuid references public.servicios on delete set null,
  -- Costos del servicio
  costo_ataud           numeric,
  costo_comedor         numeric,
  costo_azafata         numeric,
  costo_cafeteria       numeric,
  costo_tanatopraxia    numeric,
  costo_ambulancia      numeric,
  costo_mat_calle       numeric,
  costo_sellado         numeric,
  costo_soldado         numeric,
  costo_labor           numeric,
  costo_sueldos         numeric,
  costo_mortaja         numeric,
  costo_urna            numeric,
  costo_cementerio      numeric,
  costo_administrativo  numeric,
  iva_ganado            numeric,
  propina               numeric,
  -- Totales calculados
  costo_total           numeric,
  nro_facturacion       text,
  facturacion           numeric,
  valor_servicio        numeric,
  margen                numeric,
  margen_pct            int,
  notas                 text
);

-- Índices para performance con historial grande
create index if not exists idx_costos_fecha on public.costos_servicio(fecha desc);
create index if not exists idx_costos_nro on public.costos_servicio(nro_servicio);
create index if not exists idx_costos_fallecido on public.costos_servicio(fallecido);

alter table public.costos_servicio disable row level security;

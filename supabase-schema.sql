-- ============================================================
-- CARTU — Schema Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- SERVICIOS
create table if not exists public.servicios (
  id                        uuid primary key default gen_random_uuid(),
  created_at                timestamptz default now(),
  -- Encabezado
  nro_orden                 text,
  fecha_servicio            date,
  asesor                    text,
  cobertura                 text default 'PARTICULAR',
  titular                   text,
  codigo_cobertura          text,
  legajo                    text,
  seccion                   text,
  beneficiario              text,
  -- Extinto
  ext_nombre                text not null,
  ext_apellido              text not null,
  ext_documento             text,
  ext_fallecio              date,
  ext_nacimiento            date,
  ext_nacionalidad          text default 'ARGENTINA',
  ext_estado_civil          text,
  ext_profesion             text,
  ext_causa_fallecimiento   text,
  ext_religion              text,
  ext_contextura            text,
  ext_lugar_fallecimiento   text,
  ext_domicilio             text,
  ext_natural               boolean default true,
  ext_interpol              boolean default false,
  -- Servicio
  tipo_velatorio            text,
  destino                   text,
  cementerio                text,
  sala                      text,
  sera_velado               boolean default true,
  registro_civil            boolean default false,
  -- Responsable
  resp_nombre               text,
  resp_apellido             text,
  resp_documento            text,
  resp_parentesco           text,
  resp_telefono             text,
  resp_celular              text,
  resp_nacimiento           date,
  resp_nacionalidad         text default 'ARGENTINA',
  resp_estado_civil         text,
  resp_domicilio            text,
  resp_email                text,
  -- Componentes
  ataud_nro                 text,
  tiene_urna                boolean default false,
  tiene_mortaja             boolean default false,
  tiene_metalica            boolean default false,
  tiene_azafata             boolean default false,
  tiene_cafeteria           boolean default false,
  tiene_tanatoest           boolean default false,
  tiene_tanatoprax          boolean default false,
  tiene_responso            boolean default false,
  tiene_ambulancia          boolean default true,
  -- Valores
  val_total                 numeric,
  val_urna                  numeric,
  val_impuestos             numeric default 0,
  val_total_impuestos       numeric,
  val_abonado               numeric,
  val_saldo                 numeric,
  -- Logística
  log_ambulancia1           text,
  log_ambulancia2           text,
  log_fecha_funebre         date,
  log_hora_funebre          time,
  log_fecha_crematorio      date,
  log_hora_crematorio       time,
  log_observaciones         text
);

-- STOCK
create table if not exists public.stock (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  categoria   text not null check (categoria in ('Ataúd', 'Urna', 'Mortaja')),
  descripcion text not null,
  codigo      text,
  cantidad    int not null default 0,
  minimo      int not null default 1
);

-- RLS (deshabilitar para empezar simple, habilitar cuando agregues auth)
alter table public.servicios disable row level security;
alter table public.stock disable row level security;

-- DATOS DE EJEMPLO en stock
insert into public.stock (categoria, descripcion, codigo, cantidad, minimo) values
  ('Ataúd',  'Ataúd madera clásico',     '2001', 3, 1),
  ('Ataúd',  'Ataúd madera premium',     '2004', 2, 2),
  ('Ataúd',  'Ataúd metálico',           '3001', 1, 1),
  ('Urna',   'Urna cerámica estándar',   'U100', 4, 2),
  ('Urna',   'Urna mármol',              'U200', 2, 1),
  ('Mortaja','Mortaja blanca talle único','M01', 8, 3),
  ('Mortaja','Mortaja blanca talle grande','M02',4, 2)
on conflict do nothing;

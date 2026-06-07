-- ============================================================
-- CARTU v2 — Schema completo Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Extensión para UUID
create extension if not exists "uuid-ossp";

-- PROFILES (usuarios del sistema)
create table if not exists public.profiles (
  id        uuid primary key references auth.users on delete cascade,
  email     text not null,
  nombre    text,
  apellido  text,
  role      text default 'asesor' check (role in ('admin', 'asesor')),
  activo    boolean default true,
  created_at timestamptz default now()
);

-- Trigger para crear profile al registrar usuario
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, nombre)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- SERVICIOS
create table if not exists public.servicios (
  id                        uuid primary key default gen_random_uuid(),
  created_at                timestamptz default now(),
  nro_orden                 text,
  fecha_servicio            date,
  asesor                    text,
  cobertura                 text default 'PARTICULAR',
  estado                    text default 'PENDIENTE' check (estado in ('PENDIENTE','EN CURSO','COMPLETADO','CANCELADO')),
  titular                   text, codigo_cobertura text, legajo text, seccion text, beneficiario text,
  ext_nombre                text not null,
  ext_apellido              text not null,
  ext_documento             text,
  ext_fallecio              date, ext_nacimiento date,
  ext_nacionalidad          text default 'ARGENTINA',
  ext_estado_civil          text, ext_profesion text,
  ext_causa_fallecimiento   text, ext_religion text, ext_contextura text,
  ext_lugar_fallecimiento   text, ext_domicilio text,
  ext_natural               boolean default true,
  ext_interpol              boolean default false,
  tipo_velatorio            text, destino text, cementerio text, sala text,
  sera_velado               boolean default true,
  registro_civil            boolean default false,
  resp_nombre               text, resp_apellido text, resp_documento text,
  resp_parentesco           text, resp_telefono text, resp_celular text,
  resp_nacimiento           date, resp_nacionalidad text default 'ARGENTINA',
  resp_estado_civil         text, resp_domicilio text, resp_email text,
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
  val_total                 numeric, val_urna numeric,
  val_impuestos             numeric default 0,
  val_total_impuestos       numeric, val_abonado numeric, val_saldo numeric,
  log_ambulancia1           text, log_ambulancia2 text,
  log_fecha_funebre         date, log_hora_funebre time,
  log_fecha_crematorio      date, log_hora_crematorio time,
  log_observaciones         text
);

-- PAGOS
create table if not exists public.pagos (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz default now(),
  servicio_id  uuid references public.servicios on delete cascade not null,
  fecha        date not null,
  monto        numeric not null,
  medio        text not null check (medio in ('EFECTIVO','TRANSFERENCIA','TARJETA DÉBITO','TARJETA CRÉDITO','CHEQUE')),
  nota         text
);

-- STOCK
create table if not exists public.stock (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  categoria       text not null check (categoria in ('Ataúd','Urna','Mortaja')),
  descripcion     text not null,
  codigo          text,
  cantidad        int not null default 0,
  minimo          int not null default 1,
  proveedor       text,
  precio_unitario numeric
);

-- MOVIMIENTOS STOCK
create table if not exists public.movimientos_stock (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  stock_id    uuid references public.stock on delete cascade,
  tipo        text not null check (tipo in ('ENTRADA','SALIDA','AJUSTE')),
  cantidad    int not null,
  motivo      text,
  servicio_id uuid references public.servicios on delete set null,
  usuario     text
);

-- SALAS
create table if not exists public.salas (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  capacidad   int,
  activa      boolean default true
);

-- VEHÍCULOS
create table if not exists public.vehiculos (
  id       uuid primary key default gen_random_uuid(),
  nombre   text not null,
  patente  text,
  tipo     text default 'AMBULANCIA' check (tipo in ('AMBULANCIA','FÚNEBRE','OTRO')),
  activo   boolean default true
);

-- CONTACTOS
create table if not exists public.contactos (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz default now(),
  tipo         text not null check (tipo in ('RESPONSABLE','OBRA_SOCIAL','CREMATORIO','CEMENTERIO','PROVEEDOR')),
  nombre       text not null,
  apellido     text,
  razon_social text,
  telefono     text, celular text, email text,
  direccion    text, localidad text, notas text,
  codigo_os    text
);

-- ─── RLS ────────────────────────────────────────────────────
-- Por ahora deshabilitado para arrancar simple.
-- Habilitar cuando se configure auth multiusuario.
alter table public.servicios        disable row level security;
alter table public.pagos            disable row level security;
alter table public.stock            disable row level security;
alter table public.movimientos_stock disable row level security;
alter table public.salas            disable row level security;
alter table public.vehiculos        disable row level security;
alter table public.contactos        disable row level security;
alter table public.profiles         disable row level security;

-- ─── DATOS INICIALES ────────────────────────────────────────

-- Stock inicial
insert into public.stock (categoria, descripcion, codigo, cantidad, minimo) values
  ('Ataúd',  'Ataúd madera clásico',       '2001', 3, 1),
  ('Ataúd',  'Ataúd madera premium',        '2004', 2, 2),
  ('Ataúd',  'Ataúd metálico',              '3001', 1, 1),
  ('Urna',   'Urna cerámica estándar',      'U100', 4, 2),
  ('Urna',   'Urna mármol',                 'U200', 2, 1),
  ('Mortaja','Mortaja blanca talle único',  'M01',  8, 3),
  ('Mortaja','Mortaja blanca talle grande', 'M02',  4, 2)
on conflict do nothing;

-- Salas
insert into public.salas (nombre, capacidad, activa) values
  ('Sala Celestial', 60, true),
  ('Sala Esperanza', 40, true),
  ('Sala Paz',       30, true)
on conflict do nothing;

-- Vehículos
insert into public.vehiculos (nombre, patente, tipo, activo) values
  ('Ambulancia 1', 'AB 123 CD', 'AMBULANCIA', true),
  ('Ambulancia 2', 'EF 456 GH', 'AMBULANCIA', true),
  ('Fúnebre 1',    'IJ 789 KL', 'FÚNEBRE',    true)
on conflict do nothing;

-- Servicios de ejemplo (5)
insert into public.servicios (
  nro_orden, fecha_servicio, asesor, cobertura, estado,
  ext_nombre, ext_apellido, ext_documento, ext_fallecio, ext_nacimiento,
  ext_nacionalidad, ext_estado_civil, ext_profesion, ext_causa_fallecimiento, ext_religion,
  ext_contextura, ext_lugar_fallecimiento, ext_domicilio, ext_natural, ext_interpol,
  tipo_velatorio, destino, cementerio, sala, sera_velado, registro_civil,
  resp_nombre, resp_apellido, resp_documento, resp_parentesco, resp_telefono, resp_celular,
  resp_nacimiento, resp_nacionalidad, resp_estado_civil, resp_domicilio, resp_email,
  ataud_nro, tiene_urna, tiene_mortaja, tiene_metalica, tiene_azafata,
  tiene_cafeteria, tiene_tanatoest, tiene_tanatoprax, tiene_responso, tiene_ambulancia,
  val_total, val_urna, val_impuestos, val_total_impuestos, val_abonado, val_saldo,
  log_ambulancia1, log_fecha_funebre, log_hora_funebre, log_fecha_crematorio, log_hora_crematorio, log_observaciones
) values
(
  '4446', '2026-05-03', 'Yani', 'PARTICULAR', 'COMPLETADO',
  'Jesús Antonio', 'Lencina', 'M7531536', '2026-05-03', '1940-05-01',
  'ARGENTINA', 'VIUDO/A', 'JUBILADO', 'PCR', 'CATÓLICA',
  'NORMAL', 'Gral Los Hornos 1171 entre Guemes y José María Campoz - BS AS',
  'Bomberos Voluntarios 241 PB 1EDIF 7 ESC2 - Boulogne - BS AS', true, false,
  'DESPEDIDA 5 HORAS', 'CREMACIÓN', 'Boulogne', 'Sala Celestial', true, false,
  'Fernanda Soledad', 'Lencina', '33958983', 'HIJO/A', '1121817863', '1141612333',
  '1988-03-02', 'ARGENTINA', 'SOLTERO/A', 'Grl Hilario Lagos 1916 - Boulogne - BS AS', '',
  '2004', true, true, false, false, false, false, true, false, true,
  1260000, 420000, 0, 1680000, 1680000, 0,
  'Angel Geriátrico Santa', '2026-05-04', '09:00', '2026-05-04', '09:15',
  'Funebre 9:00. Crematorio en conocimiento que ingresamos con funes. Código 22 abonado por transferencia.'
),
(
  '4431', '2026-04-21', 'Marco', 'OBRA SOCIAL', 'COMPLETADO',
  'Rosa Elena', 'Martínez', '5.823.441', '2026-04-21', '1948-11-15',
  'ARGENTINA', 'CASADO/A', 'AMA DE CASA', 'PARO CARDÍACO', 'CATÓLICA',
  'NORMAL', 'Hospital Italiano - Buenos Aires', 'Mitre 845 2°B - San Isidro - BS AS', true, false,
  'VELATORIO 12 HORAS', 'INHUMACIÓN', 'La Chacarita', 'Sala 3 - Chacarita', true, true,
  'Carlos Alberto', 'Martínez', '28441902', 'HIJO/A', '1134556778', '1134556778',
  '1975-06-20', 'ARGENTINA', 'CASADO/A', 'Mitre 845 2°B - San Isidro - BS AS', 'carlosmartinez@gmail.com',
  '2001', false, true, false, true, true, true, false, true, true,
  980000, 0, 0, 980000, 500000, 480000,
  'Clínica Oulton', '2026-04-22', '10:00', null, null,
  'Familia solicita responso en capilla antes del entierro. Saldo pendiente acordado para el 30/04.'
),
(
  '4418', '2026-04-08', 'Yani', 'PARTICULAR', 'COMPLETADO',
  'Alberto Miguel', 'Rodríguez', '11.204.873', '2026-04-08', '1945-03-22',
  'ARGENTINA', 'VIUDO/A', 'CONTADOR', 'PCR', 'EVANGELICA',
  'ROBUSTO/A', 'Domicilio particular - Tigre - BS AS', 'Av. Libertad 1204 - Tigre - BS AS', true, false,
  'SIN VELATORIO', 'CREMACIÓN', 'Nordelta', 'Sin velatorio', false, false,
  'Patricia Inés', 'Rodríguez', '39112007', 'HIJO/A', '1167889900', '1167889900',
  '1982-09-04', 'ARGENTINA', 'CASADO/A', 'Av. Libertad 1204 - Tigre - BS AS', 'pattyrod@yahoo.com.ar',
  '3001', true, false, true, false, false, false, false, false, true,
  1450000, 380000, 0, 1830000, 1830000, 0,
  'Domicilio Tigre', '2026-04-09', '08:30', '2026-04-09', '11:00',
  'Sin velatorio por pedido familiar. Directo a crematorio. Urna entregada en mano a hija.'
),
(
  '4455', '2026-06-05', 'Marco', 'MUTUAL', 'EN CURSO',
  'Héctor Omar', 'Gómez', '9.441.332', '2026-06-05', '1952-07-18',
  'ARGENTINA', 'CASADO/A', 'ELECTRICISTA', 'ACV', 'CATÓLICA',
  'NORMAL', 'Hospital Durand - CABA', 'Argerich 2240 3°A - Villa del Parque - CABA', false, false,
  'VELATORIO 24 HORAS', 'INHUMACIÓN', 'Flores', 'Sala 7 - Flores', true, true,
  'María del Carmen', 'Gómez', '12009876', 'CÓNYUGE', '1145223344', '1145223344',
  '1955-02-28', 'ARGENTINA', 'CASADO/A', 'Argerich 2240 3°A - Villa del Parque - CABA', '',
  '2004', false, true, false, true, true, true, true, true, true,
  1100000, 0, 0, 1100000, 550000, 550000,
  'Hospital Durand', '2026-06-06', '10:00', null, null,
  'Familia numerosa. Coordinar con encargado de sala Flores. Saldo pendiente al momento del entierro.'
),
(
  '4461', '2026-06-07', 'Yani', 'PARTICULAR', 'PENDIENTE',
  'Norma Beatriz', 'Sánchez', '14.330.222', '2026-06-07', '1958-08-30',
  'ARGENTINA', 'DIVORCIADO/A', 'DOCENTE', 'PCR', 'CATÓLICA',
  'NORMAL', 'Centro de Jubilados - Martínez - BS AS', 'Reconquista 1440 4°B - Martínez - BS AS', true, false,
  'VELATORIO 12 HORAS', 'CREMACIÓN', 'San Isidro', 'Sala Esperanza', true, false,
  'Diego Hernán', 'Sánchez', '41228900', 'HIJO/A', '1198776655', '1198776655',
  '1990-03-15', 'ARGENTINA', 'SOLTERO/A', 'Reconquista 1440 4°B - Martínez - BS AS', 'diego.sanchez@gmail.com',
  '2004', true, true, false, false, false, false, false, false, true,
  950000, 350000, 0, 1300000, 0, 1300000,
  'Centro de Jubilados Martínez', '2026-06-08', '09:00', '2026-06-08', '14:00',
  'Familia confirma velatorio. Coordinación con crematorio pendiente. Sin pago inicial.'
);

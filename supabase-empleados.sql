-- ============================================================
-- CARTU v3 — Tabla EMPLEADOS
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

create table if not exists public.empleados (
  id                          uuid primary key default gen_random_uuid(),
  created_at                  timestamptz default now(),
  -- Datos personales
  nombre                      text not null,
  apellido                    text not null,
  documento                   text,
  fecha_nacimiento            date,
  nacionalidad                text default 'ARGENTINA',
  estado_civil                text,
  domicilio                   text,
  localidad                   text,
  -- Contacto
  telefono                    text,
  celular                     text,
  email                       text,
  contacto_emergencia_nombre  text,
  contacto_emergencia_tel     text,
  -- Laboral
  rol                         text default 'ASESOR' check (rol in ('ASESOR','CHOFER','VELADOR','ADMINISTRATIVO','GERENCIA','OTRO')),
  estado                      text default 'ACTIVO' check (estado in ('ACTIVO','INACTIVO','LICENCIA')),
  fecha_ingreso               date,
  legajo                      text,
  notas                       text
);

alter table public.empleados disable row level security;

-- Empleados de ejemplo
insert into public.empleados (nombre, apellido, documento, fecha_nacimiento, nacionalidad, estado_civil, domicilio, localidad, celular, email, rol, estado, fecha_ingreso, legajo) values
  ('Yani',    'González',  '28.441.100', '1990-05-12', 'ARGENTINA', 'CASADO/A',   'Mitre 440',          'Boulogne',  '1134001122', 'yani@carunchio.com.ar',   'ASESOR',         'ACTIVO',   '2018-03-01', '001'),
  ('Marco',   'Pérez',     '32.100.220', '1992-08-20', 'ARGENTINA', 'SOLTERO/A',  'Av. Maipú 1200',     'Olivos',    '1145003344', 'marco@carunchio.com.ar',  'ASESOR',         'ACTIVO',   '2020-06-15', '002'),
  ('Carlos',  'Rodríguez', '25.800.330', '1978-11-03', 'ARGENTINA', 'CASADO/A',   'San Martín 800',     'Boulogne',  '1156005566', null,                      'CHOFER',         'ACTIVO',   '2015-01-10', '003'),
  ('Ana',     'Martínez',  '30.550.440', '1985-02-28', 'ARGENTINA', 'DIVORCIADO/A','Libertad 350',      'Martínez',  '1167007788', 'ana@carunchio.com.ar',    'ADMINISTRATIVO', 'ACTIVO',   '2019-09-01', '004'),
  ('Roberto', 'López',     '20.100.550', '1965-07-15', 'ARGENTINA', 'CASADO/A',   'Belgrano 2200',      'Boulogne',  '1178009900', null,                      'VELADOR',        'ACTIVO',   '2010-04-20', '005')
on conflict do nothing;

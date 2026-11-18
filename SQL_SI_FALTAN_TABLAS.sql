-- Ejecutar SOLO si faltan las tablas / indices UNIQUE para la Edge Function.
-- No borra registros y permite actualizar el mismo QR por firebase_id.
create table if not exists public.qrs (
  firebase_id text primary key,
  qr text not null default '',
  phone text not null default '',
  name text not null default '',
  destino text not null default 'Yape',
  firebase_data jsonb not null default '{}'::jsonb
);
alter table public.qrs add column if not exists qr text;
alter table public.qrs add column if not exists phone text;
alter table public.qrs add column if not exists name text;
alter table public.qrs add column if not exists destino text;
alter table public.qrs add column if not exists firebase_data jsonb;
-- Si aparece conflicto por duplicados en firebase_id, hay que revisarlos antes de crear el indice.
create unique index if not exists qrs_firebase_id_unique on public.qrs (firebase_id);
-- La funcion publica de autocompletado guarda en contacts por telefono.
create table if not exists public.contacts (
  phone text primary key,
  name text not null default '',
  destino text not null default 'Yape'
);
alter table public.contacts add column if not exists name text;
alter table public.contacts add column if not exists destino text;
create unique index if not exists contacts_phone_unique on public.contacts (phone);
-- La RPC sonyer_take_quota usada por la Edge Function debe existir previamente.
-- Este SQL no cambia las politicas RLS, claves ni permisos de tus otras tablas.

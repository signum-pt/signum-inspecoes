alter table visitas
  add column if not exists visita_extra boolean not null default false;

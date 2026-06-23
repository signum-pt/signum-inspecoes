-- Secções globais (biblioteca de secções predefinidas)
create table secoes_globais (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  descricao   text not null default '',
  ordem       int  not null default 0,
  created_at  timestamptz not null default now()
);

-- Campos associados a cada secção global (com ordem e obrigatoriedade sugerida)
create table secoes_globais_campos (
  id          uuid primary key default gen_random_uuid(),
  secao_id    uuid not null references secoes_globais(id) on delete cascade,
  campo_id    uuid not null references campos(id) on delete cascade,
  ordem       int  not null default 0,
  obrigatorio boolean not null default false,
  unique (secao_id, campo_id)
);

-- Acesso: apenas admins gerem secções globais
alter table secoes_globais enable row level security;
alter table secoes_globais_campos enable row level security;

create policy "Leitura autenticada — secoes_globais"
  on secoes_globais for select to authenticated using (true);

create policy "Escrita admin — secoes_globais"
  on secoes_globais for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Leitura autenticada — secoes_globais_campos"
  on secoes_globais_campos for select to authenticated using (true);

create policy "Escrita admin — secoes_globais_campos"
  on secoes_globais_campos for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
